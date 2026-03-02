/**
 * Preview Routes – Resolve playable audio URLs
 *
 * Strategy: YouTube full track first → Deezer 30s preview fallback
 *
 * GET  /api/music/preview        – Single track lookup
 * POST /api/music/preview/batch  – Batch lookup (max 20)
 * GET  /api/music/stream         – Proxy audio stream (avoids CDN blocking on mobile)
 */
import { Router, Request, Response } from "express";
import axios from "axios";
import { findPreviewUrl, findPreviewUrlsBatch, invalidatePreviewCache } from "../services/deezerService";
import { findFullTrack, findFullTracksBatch } from "../services/youtubeService";

const router = Router();

// Helper: wrap async handlers
const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response) =>
    fn(req, res).catch((err) => {
      console.error("Preview route error:", err);
      res.status(500).json({ error: "Internal server error" });
    });

// ─── Single track ────────────────────────────────────────────

router.get(
  "/preview",
  asyncHandler(async (req: Request, res: Response) => {
    const { track, artist } = req.query;

    if (!track || typeof track !== "string") {
      res.status(400).json({ error: "Missing 'track' query parameter" });
      return;
    }

    const artistStr = typeof artist === "string" ? artist : "";

    // Try YouTube full track first
    const ytResult = await findFullTrack(track, artistStr);
    if (ytResult) {
      res.set("Cache-Control", "public, max-age=1800");
      res.json({
        previewUrl: ytResult.audioUrl,
        source: "youtube",
        duration: ytResult.duration,
        matchedTrack: ytResult.matchedTrack,
        matchedArtist: ytResult.matchedArtist,
      });
      return;
    }

    // Fallback to Deezer 30s preview
    const deezerResult = await findPreviewUrl(track, artistStr);

    res.set("Cache-Control", "public, max-age=1800");
    res.json({
      previewUrl: deezerResult?.previewUrl || null,
      source: deezerResult ? "deezer" : null,
      duration: deezerResult?.duration || null,
      matchedTrack: deezerResult?.matchedTrack || null,
      matchedArtist: deezerResult?.matchedArtist || null,
    });
  })
);

// ─── Batch ───────────────────────────────────────────────────

router.post(
  "/preview/batch",
  asyncHandler(async (req: Request, res: Response) => {
    const { tracks } = req.body;

    if (!Array.isArray(tracks) || tracks.length === 0) {
      res.status(400).json({ error: "Missing 'tracks' array in body" });
      return;
    }

    if (tracks.length > 20) {
      res.status(400).json({ error: "Max 20 tracks per batch" });
      return;
    }

    // Try YouTube first for all tracks
    const ytPreviews = await findFullTracksBatch(tracks);

    // Collect tracks that YouTube couldn't find
    const missing = tracks.filter((t) => !ytPreviews[t.id]);

    // Fallback to Deezer for missing tracks
    let deezerPreviews: Record<string, string | null> = {};
    if (missing.length > 0) {
      deezerPreviews = await findPreviewUrlsBatch(missing);
    }

    // Merge: YouTube URLs take priority
    const merged: Record<string, string | null> = {};
    for (const t of tracks) {
      merged[t.id] = ytPreviews[t.id]?.url || deezerPreviews[t.id] || null;
    }

    res.json({ previews: merged });
  })
);

// ─── Stream Proxy ────────────────────────────────────────────
// Proxies the audio binary through our server so the mobile app's
// AVPlayer never contacts Deezer/YouTube CDN directly (they block
// mobile clients via TLS fingerprinting → HTTP 403).

router.get(
  "/stream",
  asyncHandler(async (req: Request, res: Response) => {
    const { track, artist } = req.query;

    if (!track || typeof track !== "string") {
      res.status(400).json({ error: "Missing 'track' query parameter" });
      return;
    }

    const artistStr = typeof artist === "string" ? artist : "";
    const fast = req.query.fast === "1"; // fast mode: skip slow yt-dlp, Deezer-only

    // Resolve the audio URL (YouTube → Deezer fallback)
    let audioUrl: string | null = null;

    if (!fast) {
      const ytResult = await findFullTrack(track, artistStr);
      if (ytResult) {
        audioUrl = ytResult.audioUrl;
      }
    }

    if (!audioUrl) {
      const deezerResult = await findPreviewUrl(track, artistStr);
      audioUrl = deezerResult?.previewUrl || null;
    }

    if (!audioUrl) {
      res.status(404).json({ error: "No audio source found" });
      return;
    }

    try {
      // Fetch the audio from the CDN on the server side
      const upstream = await axios.get(audioUrl, {
        responseType: "stream",
        timeout: 15000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        // Don't throw on 4xx so we can handle 403 specifically
        validateStatus: (status: number) => status < 500,
      });

      // If the CDN returned 403, the cached preview URL's HMAC token
      // has expired. Clear cache and retry once with a fresh URL.
      if (upstream.status === 403) {
        console.log("Stream: CDN returned 403, refreshing cached URL...");
        invalidatePreviewCache(track as string, artistStr);

        // Re-resolve the audio URL
        let freshUrl: string | null = null;
        const ytRetry = await findFullTrack(track as string, artistStr);
        if (ytRetry) {
          freshUrl = ytRetry.audioUrl;
        } else {
          const dzRetry = await findPreviewUrl(track as string, artistStr);
          freshUrl = dzRetry?.previewUrl || null;
        }

        if (!freshUrl) {
          res.status(404).json({ error: "No audio source found after refresh" });
          return;
        }

        const retryUpstream = await axios.get(freshUrl, {
          responseType: "stream",
          timeout: 15000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });

        res.set("Content-Type", retryUpstream.headers["content-type"] || "audio/mpeg");
        if (retryUpstream.headers["content-length"]) {
          res.set("Content-Length", retryUpstream.headers["content-length"]);
        }
        res.set("Accept-Ranges", "bytes");
        res.set("Cache-Control", "public, max-age=1800");
        retryUpstream.data.pipe(res);
        return;
      }

      // Forward content headers
      res.set("Content-Type", upstream.headers["content-type"] || "audio/mpeg");
      if (upstream.headers["content-length"]) {
        res.set("Content-Length", upstream.headers["content-length"]);
      }
      res.set("Accept-Ranges", "bytes");
      res.set("Cache-Control", "public, max-age=1800");

      // Pipe the audio stream to the client
      upstream.data.pipe(res);
    } catch (err: any) {
      console.error("Stream proxy error:", err?.message);
      res.status(502).json({ error: "Failed to fetch audio stream" });
    }
  })
);

export default router;
