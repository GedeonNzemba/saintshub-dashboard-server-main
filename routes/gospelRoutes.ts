/**
 * Gospel / Christian Music API Routes
 * 
 * Curated endpoints for Christian/Gospel music content.
 * These wrap SpotifyService with Christian-focused queries,
 * curated artist IDs, and multi-language support.
 */
import express, { Request, Response } from 'express';
import { buildGospelFeed, getGospelQuickMix, CURATED_ARTISTS, ALL_ARTIST_IDS } from '../services/gospelCuration';
import { search, getArtist, getArtistTopTracks } from '../services/spotifyService';
import { cacheMiddleware } from '../middlewares/cacheMiddleware';
import logger from '../utils/logger';

const router = express.Router();

// Helper: wrap async handlers
function asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response) => {
    fn(req, res).catch((error: any) => {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message || 'Gospel API error';
      logger.error('Gospel proxy error', { path: req.path, status, message });
      res.status(status).json({ error: message });
    });
  };
}

// ───────────────────────── Main Feed ─────────────────────────

/**
 * GET /api/gospel/feed
 * Returns the complete curated gospel/christian feed.
 * 
 * Query params:
 *   lang   - Language code (en, fr, es, pt). Default: en
 *   market - Country code for availability (US, FR, BR, etc). Default: US
 */
router.get(
  '/feed',
  cacheMiddleware(600), // Cache 10 min
  asyncHandler(async (req, res) => {
    const lang = (req.query.lang as string) || 'en';
    const market = (req.query.market as string) || 'US';
    
    const feed = await buildGospelFeed(lang, market);
    res.json(feed);
  })
);

// ───────────────────────── Gospel Search ─────────────────────────

/**
 * GET /api/gospel/search
 * Search within Christian/Gospel music specifically.
 * Appends genre:gospel OR genre:christian to the query.
 * 
 * Query params:
 *   q      - Search query (required)
 *   type   - track,artist,album,playlist (default: track,artist,album)
 *   limit  - Max results per type (default: 20)
 *   offset - Pagination offset (default: 0)
 *   market - Country code (default: US)
 */
router.get(
  '/search',
  cacheMiddleware(120), // Cache 2 min
  asyncHandler(async (req, res) => {
    const { q, type, limit, offset, market } = req.query;
    
    if (!q) {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }
    
    // Append Christian/Gospel genre filter to search
    const gospelQuery = `${q} genre:gospel OR genre:christian`;
    
    const data = await search({
      q: gospelQuery,
      type: (type as string) || 'track,artist,album',
      limit: limit ? parseInt(limit as string, 10) : 20,
      offset: offset ? parseInt(offset as string, 10) : 0,
      market: (market as string) || 'US',
    });
    
    res.json(data);
  })
);

// ───────────────────────── Quick Mix ─────────────────────────

/**
 * GET /api/gospel/quick-mix
 * Get a shuffled mix of top tracks from curated Christian artists.
 * Great for auto-play / radio mode.
 * 
 * Query params:
 *   lang   - Language (default: en)
 *   market - Country (default: US)
 *   limit  - Max tracks (default: 30)
 */
router.get(
  '/quick-mix',
  cacheMiddleware(300), // Cache 5 min
  asyncHandler(async (req, res) => {
    const lang = (req.query.lang as string) || 'en';
    const market = (req.query.market as string) || 'US';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
    
    const tracks = await getGospelQuickMix(lang, market, limit);
    res.json({ tracks });
  })
);

// ───────────────────────── Curated Artists ─────────────────────────

/**
 * GET /api/gospel/artists
 * Get the curated list of Christian artist categories and IDs.
 */
router.get(
  '/artists',
  cacheMiddleware(3600), // Cache 1 hour
  asyncHandler(async (_req, res) => {
    res.json({
      categories: Object.keys(CURATED_ARTISTS),
      artists: CURATED_ARTISTS,
      totalCount: ALL_ARTIST_IDS.length,
    });
  })
);

// ───────────────────────── Recommendations ─────────────────────────

/**
 * GET /api/gospel/recommendations
 * Get gospel recommendations based on curated artists' top tracks.
 * (Replaces deprecated Spotify /recommendations endpoint)
 * 
 * Query params:
 *   lang   - Language code (default: en)
 *   limit  - Max tracks (default: 20)
 *   market - Country (default: US)
 */
router.get(
  '/recommendations',
  cacheMiddleware(300),
  asyncHandler(async (req, res) => {
    const { lang, limit, market } = req.query;
    const l = (lang as string) || 'en';
    const m = (market as string) || 'US';
    const lim = limit ? parseInt(limit as string, 10) : 20;

    const langArtistMap: Record<string, keyof typeof CURATED_ARTISTS> = {
      fr: 'french', es: 'spanish', pt: 'portuguese', en: 'worship',
    };
    const category = langArtistMap[l] || 'worship';
    const artistIds = (CURATED_ARTISTS[category] || CURATED_ARTISTS.worship).slice(0, 3);

    const results = await Promise.allSettled(
      artistIds.map(id => getArtistTopTracks(id, m))
    );

    const tracks = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .flatMap(r => r.value?.tracks || [])
      .sort(() => Math.random() - 0.5)
      .slice(0, lim);

    res.json({ tracks });
  })
);

export default router;
