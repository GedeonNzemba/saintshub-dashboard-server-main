/**
 * Deezer Preview Service
 *
 * Matches Spotify track metadata against Deezer's free API to find
 * playable 30-second preview MP3 URLs. Uses a 3-strategy search
 * (strict → relaxed → broad) with in-memory caching.
 */
import axios from "axios";
import NodeCache from "node-cache";

const DEEZER_API = "https://api.deezer.com";
const cache = new NodeCache({ stdTTL: 1800, maxKeys: 5000 });

export interface PreviewResult {
  previewUrl: string;
  source: "deezer";
  duration: number;
  matchedTrack: string;
  matchedArtist: string;
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

function similarity(a: string, b: string): number {
  const la = a.toLowerCase().trim();
  const lb = b.toLowerCase().trim();
  if (la === lb) return 1;
  if (la.includes(lb) || lb.includes(la)) return 0.8;
  const wordsA = new Set(la.split(/\s+/));
  const wordsB = new Set(lb.split(/\s+/));
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  return (2 * intersection) / (wordsA.size + wordsB.size);
}

async function deezerSearch(query: string, limit = 10): Promise<any[]> {
  try {
    const { data } = await axios.get(`${DEEZER_API}/search`, {
      params: { q: query, limit },
      timeout: 5000,
    });
    return data?.data || [];
  } catch (err: any) {
    if (err?.response?.status === 429) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const { data } = await axios.get(`${DEEZER_API}/search`, {
          params: { q: query, limit },
          timeout: 5000,
        });
        return data?.data || [];
      } catch {
        return [];
      }
    }
    return [];
  }
}

function findBestMatch(
  results: any[],
  trackName: string,
  artistName: string
): PreviewResult | null {
  const cleanTrack = cleanQuery(trackName).toLowerCase();
  const cleanArtist = cleanQuery(artistName).toLowerCase();

  let bestMatch: any = null;
  let bestScore = 0;

  for (const r of results) {
    if (!r.preview) continue;
    const trackSim = similarity(r.title, cleanTrack);
    const artistSim = similarity(r.artist?.name || "", cleanArtist);
    const score = trackSim * 0.6 + artistSim * 0.4;
    if (score > bestScore && score >= 0.3) {
      bestScore = score;
      bestMatch = r;
    }
  }

  if (!bestMatch) return null;

  return {
    previewUrl: bestMatch.preview,
    source: "deezer",
    duration: bestMatch.duration || 30,
    matchedTrack: bestMatch.title,
    matchedArtist: bestMatch.artist?.name || "",
  };
}

// ─── Public API ──────────────────────────────────────────────

export async function findPreviewUrl(
  trackName: string,
  artistName: string
): Promise<PreviewResult | null> {
  const cacheKey = `preview:${trackName.toLowerCase()}:${artistName.toLowerCase()}`;
  const cached = cache.get<PreviewResult | null>(cacheKey);
  if (cached !== undefined) return cached;

  const cleanTrack = cleanQuery(trackName);
  const cleanArtist = cleanQuery(artistName);

  // Strategy 1: strict
  let results = await deezerSearch(
    `track:"${cleanTrack}" artist:"${cleanArtist}"`,
    5
  );
  let match = findBestMatch(results, trackName, artistName);
  if (match) {
    cache.set(cacheKey, match);
    return match;
  }

  // Strategy 2: relaxed
  results = await deezerSearch(`${cleanTrack} ${cleanArtist}`, 10);
  match = findBestMatch(results, trackName, artistName);
  if (match) {
    cache.set(cacheKey, match);
    return match;
  }

  // Strategy 3: broad (track name only)
  results = await deezerSearch(cleanTrack, 10);
  match = findBestMatch(results, trackName, artistName);
  if (match) {
    cache.set(cacheKey, match);
    return match;
  }

  cache.set(cacheKey, null);
  return null;
}

export async function findPreviewUrlsBatch(
  tracks: Array<{ id: string; name: string; artist: string }>
): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = {};
  const CONCURRENCY = 5;

  for (let i = 0; i < tracks.length; i += CONCURRENCY) {
    const batch = tracks.slice(i, i + CONCURRENCY);
    const promises = batch.map(async (t) => {
      const preview = await findPreviewUrl(t.name, t.artist);
      results[t.id] = preview?.previewUrl || null;
    });
    await Promise.all(promises);
  }

  return results;
}

/**
 * Invalidate cached preview URL for a track so the next lookup
 * fetches a fresh URL from Deezer (useful when HMAC tokens expire).
 */
export function invalidatePreviewCache(
  trackName: string,
  artistName: string
): void {
  const cacheKey = `preview:${trackName.toLowerCase()}:${artistName.toLowerCase()}`;
  cache.del(cacheKey);
}
