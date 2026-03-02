/**
 * YouTube Audio Service
 *
 * Uses yt-dlp to search YouTube Music and return direct audio stream
 * URLs for full-length tracks. Includes in-memory caching.
 */
import { exec } from "child_process";
import { promisify } from "util";
import NodeCache from "node-cache";

const execAsync = promisify(exec);

// Cache audio URLs for 3 hours (YouTube URLs typically expire in ~6h)
const cache = new NodeCache({ stdTTL: 10800, maxKeys: 5000 });

// ─── yt-dlp availability check (once at startup) ────────────
let ytdlpAvailable: boolean | null = null; // null = not checked yet

async function isYtdlpAvailable(): Promise<boolean> {
  if (ytdlpAvailable !== null) return ytdlpAvailable;
  try {
    await execAsync('which yt-dlp', { timeout: 3000 });
    ytdlpAvailable = true;
    console.log('[YouTube] yt-dlp found — YouTube audio enabled');
  } catch {
    ytdlpAvailable = false;
    console.log('[YouTube] yt-dlp not found — YouTube audio disabled (Deezer-only mode)');
  }
  return ytdlpAvailable;
}

export interface YouTubeAudioResult {
  audioUrl: string;
  source: "youtube";
  duration: number; // seconds
  matchedTrack: string;
  matchedArtist: string;
  videoId: string;
}

// ─── Helpers ─────────────────────────────────────────────────

function cleanQuery(s: string): string {
  return s
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/feat\..*/i, "")
    .replace(/ft\..*/i, "")
    .replace(/['']/g, "'")
    .replace(/[^\w\s'.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shellEscape(s: string): string {
  return s.replace(/'/g, "'\\''");
}

// ─── yt-dlp integration ─────────────────────────────────────

interface YtDlpResult {
  url: string;
  title: string;
  uploader: string;
  duration: number;
  id: string;
}

async function ytdlpSearch(query: string): Promise<YtDlpResult | null> {
  if (!(await isYtdlpAvailable())) return null;
  try {
    const escaped = shellEscape(query);
    // Search YouTube, get audio URL + metadata as JSON
    const { stdout } = await execAsync(
      `yt-dlp --no-warnings --no-playlist -f "bestaudio[ext=m4a]/bestaudio" ` +
      `--print-json --no-download "ytsearch1:${escaped}"`,
      { timeout: 20000 }
    );

    const data = JSON.parse(stdout.trim());
    return {
      url: data.url,
      title: data.title || "",
      uploader: data.uploader || data.channel || "",
      duration: data.duration || 0,
      id: data.id || "",
    };
  } catch (err: any) {
    console.error("yt-dlp search error:", err.message?.substring(0, 200));
    return null;
  }
}

async function ytdlpGetUrl(videoId: string): Promise<YtDlpResult | null> {
  if (!(await isYtdlpAvailable())) return null;
  try {
    const { stdout } = await execAsync(
      `yt-dlp --no-warnings --no-playlist -f "bestaudio[ext=m4a]/bestaudio" ` +
      `--print-json --no-download "https://www.youtube.com/watch?v=${videoId}"`,
      { timeout: 15000 }
    );

    const data = JSON.parse(stdout.trim());
    return {
      url: data.url,
      title: data.title || "",
      uploader: data.uploader || data.channel || "",
      duration: data.duration || 0,
      id: data.id || videoId,
    };
  } catch (err: any) {
    console.error("yt-dlp getUrl error:", err.message?.substring(0, 200));
    return null;
  }
}

// ─── Public API ──────────────────────────────────────────────

export async function findFullTrack(
  trackName: string,
  artistName: string
): Promise<YouTubeAudioResult | null> {
  const cacheKey = `yt:${trackName.toLowerCase()}:${artistName.toLowerCase()}`;
  const cached = cache.get<YouTubeAudioResult | null>(cacheKey);
  if (cached !== undefined) return cached;

  const cleanTrack = cleanQuery(trackName);
  const cleanArtist = cleanQuery(artistName);
  const query = `${cleanTrack} ${cleanArtist} official audio`;

  const result = await ytdlpSearch(query);
  if (!result || !result.url) {
    cache.set(cacheKey, null);
    return null;
  }

  // Filter: skip very short (<60s) or very long (>15min)
  if (result.duration > 0 && (result.duration < 30 || result.duration > 900)) {
    cache.set(cacheKey, null);
    return null;
  }

  const ytResult: YouTubeAudioResult = {
    audioUrl: result.url,
    source: "youtube",
    duration: result.duration,
    matchedTrack: result.title,
    matchedArtist: result.uploader,
    videoId: result.id,
  };

  cache.set(cacheKey, ytResult);
  return ytResult;
}

export async function findFullTracksBatch(
  tracks: Array<{ id: string; name: string; artist: string }>
): Promise<Record<string, { url: string; duration: number; source: string } | null>> {
  const results: Record<string, { url: string; duration: number; source: string } | null> = {};
  // Sequential to avoid overwhelming yt-dlp / YouTube
  const CONCURRENCY = 2;

  for (let i = 0; i < tracks.length; i += CONCURRENCY) {
    const batch = tracks.slice(i, i + CONCURRENCY);
    const promises = batch.map(async (t) => {
      const yt = await findFullTrack(t.name, t.artist);
      results[t.id] = yt
        ? { url: yt.audioUrl, duration: yt.duration, source: "youtube" }
        : null;
    });
    await Promise.all(promises);
  }

  return results;
}
