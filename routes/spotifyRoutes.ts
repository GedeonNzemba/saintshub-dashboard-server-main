/**
 * Spotify API Proxy Routes
 * All endpoints are public (no auth required) since they only expose
 * Spotify's public catalog data via Client Credentials flow.
 * Rate limiting is inherited from the global /api limiter.
 */
import express, { Request, Response } from 'express';
import {
  search,
  getCategories,
  getCategoryPlaylists,
  getNewReleases,
  getFeaturedPlaylists,
  getArtist,
  getArtistTopTracks,
  getArtistAlbums,
  getRelatedArtists,
  getAlbum,
  getAlbumTracks,
  getSeveralTracks,
  getTrack,
  getPlaylist,
  getPlaylistTracks,
  getRecommendations,
  getAvailableGenreSeeds,
} from '../services/spotifyService';
import { cacheMiddleware } from '../middlewares/cacheMiddleware';
import logger from '../utils/logger';

const router = express.Router();

// Helper: wrap async handlers with error catching
function asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response) => {
    fn(req, res).catch((error: any) => {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message || 'Spotify API error';
      logger.error('Spotify proxy error', { path: req.path, status, message });
      res.status(status).json({ error: message });
    });
  };
}

// ───────────────────────── Search ─────────────────────────

/**
 * GET /api/spotify/search
 * Query params: q (required), type (default: "track,artist,album"), limit, offset, market
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
    const data = await search({
      q: q as string,
      type: (type as string) || 'track,artist,album',
      limit: limit ? parseInt(limit as string, 10) : 20,
      offset: offset ? parseInt(offset as string, 10) : 0,
      market: (market as string) || 'US',
    });
    res.json(data);
  })
);

// ───────────────────────── Browse ─────────────────────────

/**
 * GET /api/spotify/browse/categories
 */
router.get(
  '/browse/categories',
  cacheMiddleware(600), // Cache 10 min
  asyncHandler(async (req, res) => {
    const { limit, offset, country, locale } = req.query;
    const data = await getCategories(
      limit ? parseInt(limit as string, 10) : 50,
      offset ? parseInt(offset as string, 10) : 0,
      (country as string) || 'US',
      (locale as string) || 'en_US'
    );
    res.json(data);
  })
);

/**
 * GET /api/spotify/browse/categories/:categoryId/playlists
 */
router.get(
  '/browse/categories/:categoryId/playlists',
  cacheMiddleware(300),
  asyncHandler(async (req, res) => {
    const { limit, offset, country } = req.query;
    const data = await getCategoryPlaylists(
      req.params.categoryId,
      limit ? parseInt(limit as string, 10) : 20,
      offset ? parseInt(offset as string, 10) : 0,
      (country as string) || 'US'
    );
    res.json(data);
  })
);

/**
 * GET /api/spotify/browse/new-releases
 */
router.get(
  '/browse/new-releases',
  cacheMiddleware(300),
  asyncHandler(async (req, res) => {
    const { limit, offset, country } = req.query;
    const data = await getNewReleases(
      limit ? parseInt(limit as string, 10) : 20,
      offset ? parseInt(offset as string, 10) : 0,
      (country as string) || 'US'
    );
    res.json(data);
  })
);

/**
 * GET /api/spotify/browse/featured-playlists
 */
router.get(
  '/browse/featured-playlists',
  cacheMiddleware(300),
  asyncHandler(async (req, res) => {
    const { limit, offset, country } = req.query;
    const data = await getFeaturedPlaylists(
      limit ? parseInt(limit as string, 10) : 20,
      offset ? parseInt(offset as string, 10) : 0,
      (country as string) || 'US'
    );
    res.json(data);
  })
);

// ───────────────────────── Artists ─────────────────────────

/**
 * GET /api/spotify/artists/:id
 */
router.get(
  '/artists/:id',
  cacheMiddleware(600),
  asyncHandler(async (req, res) => {
    const data = await getArtist(req.params.id);
    res.json(data);
  })
);

/**
 * GET /api/spotify/artists/:id/top-tracks
 */
router.get(
  '/artists/:id/top-tracks',
  cacheMiddleware(300),
  asyncHandler(async (req, res) => {
    const market = (req.query.market as string) || 'US';
    const data = await getArtistTopTracks(req.params.id, market);
    res.json(data);
  })
);

/**
 * GET /api/spotify/artists/:id/albums
 */
router.get(
  '/artists/:id/albums',
  cacheMiddleware(600),
  asyncHandler(async (req, res) => {
    const { limit, offset, include_groups } = req.query;
    const data = await getArtistAlbums(
      req.params.id,
      limit ? parseInt(limit as string, 10) : 20,
      offset ? parseInt(offset as string, 10) : 0,
      (include_groups as string) || 'album,single'
    );
    res.json(data);
  })
);

/**
 * GET /api/spotify/artists/:id/related-artists
 */
router.get(
  '/artists/:id/related-artists',
  cacheMiddleware(600),
  asyncHandler(async (req, res) => {
    const data = await getRelatedArtists(req.params.id);
    res.json(data);
  })
);

// ───────────────────────── Albums ─────────────────────────

/**
 * GET /api/spotify/albums/:id
 * Returns album with enriched tracks (includes preview_url from full track objects)
 */
router.get(
  '/albums/:id',
  cacheMiddleware(600),
  asyncHandler(async (req, res) => {
    const market = (req.query.market as string) || 'US';
    const album = await getAlbum(req.params.id, market);

    // Spotify album tracks are simplified — no preview_url.
    // Enrich by fetching full track objects in batches of 50.
    const simplifiedTracks: any[] = album?.tracks?.items || [];
    if (simplifiedTracks.length > 0) {
      const trackIds = simplifiedTracks.map((t: any) => t.id).filter(Boolean);
      try {
        const batches: string[][] = [];
        for (let i = 0; i < trackIds.length; i += 50) {
          batches.push(trackIds.slice(i, i + 50));
        }
        const results = await Promise.all(
          batches.map(batch => getSeveralTracks(batch, market))
        );
        const fullTracks: any[] = results.flatMap((r: any) => r?.tracks || []);
        const fullMap = new Map(fullTracks.filter(Boolean).map((t: any) => [t.id, t]));

        // Merge preview_url (and album images) into simplified tracks
        album.tracks.items = simplifiedTracks.map((st: any) => {
          const full = fullMap.get(st.id);
          if (full) {
            return { ...st, preview_url: full.preview_url, album: full.album };
          }
          return st;
        });
      } catch {
        // If enrichment fails, return simplified tracks as-is
      }
    }

    res.json(album);
  })
);

/**
 * GET /api/spotify/albums/:id/tracks
 */
router.get(
  '/albums/:id/tracks',
  cacheMiddleware(600),
  asyncHandler(async (req, res) => {
    const { limit, offset, market } = req.query;
    const data = await getAlbumTracks(
      req.params.id,
      limit ? parseInt(limit as string, 10) : 50,
      offset ? parseInt(offset as string, 10) : 0,
      (market as string) || 'US'
    );
    res.json(data);
  })
);

// ───────────────────────── Tracks ─────────────────────────

/**
 * GET /api/spotify/tracks/:id
 */
router.get(
  '/tracks/:id',
  cacheMiddleware(600),
  asyncHandler(async (req, res) => {
    const market = (req.query.market as string) || 'US';
    const data = await getTrack(req.params.id, market);
    res.json(data);
  })
);

// ───────────────────────── Playlists ─────────────────────────

/**
 * GET /api/spotify/playlists/:id
 */
router.get(
  '/playlists/:id',
  cacheMiddleware(300),
  asyncHandler(async (req, res) => {
    const market = (req.query.market as string) || 'US';
    const data = await getPlaylist(req.params.id, market);
    res.json(data);
  })
);

/**
 * GET /api/spotify/playlists/:id/tracks
 */
router.get(
  '/playlists/:id/tracks',
  cacheMiddleware(300),
  asyncHandler(async (req, res) => {
    const { limit, offset, market } = req.query;
    const data = await getPlaylistTracks(
      req.params.id,
      limit ? parseInt(limit as string, 10) : 100,
      offset ? parseInt(offset as string, 10) : 0,
      (market as string) || 'US'
    );
    res.json(data);
  })
);

// ───────────────────────── Recommendations ─────────────────────────

/**
 * GET /api/spotify/recommendations
 * Query params: seed_artists, seed_genres, seed_tracks, limit, market
 */
router.get(
  '/recommendations',
  cacheMiddleware(120),
  asyncHandler(async (req, res) => {
    const { seed_artists, seed_genres, seed_tracks, limit, market } = req.query;
    if (!seed_artists && !seed_genres && !seed_tracks) {
      res.status(400).json({ error: 'At least one seed (seed_artists, seed_genres, or seed_tracks) is required' });
      return;
    }
    const data = await getRecommendations({
      seed_artists: seed_artists as string,
      seed_genres: seed_genres as string,
      seed_tracks: seed_tracks as string,
      limit: limit ? parseInt(limit as string, 10) : 20,
      market: (market as string) || 'US',
    });
    res.json(data);
  })
);

/**
 * GET /api/spotify/genres
 */
router.get(
  '/genres',
  cacheMiddleware(3600), // Cache 1 hour
  asyncHandler(async (_req, res) => {
    const data = await getAvailableGenreSeeds();
    res.json(data);
  })
);

export default router;
