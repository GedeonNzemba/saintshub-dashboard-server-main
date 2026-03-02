/**
 * Spotify Web API Service
 * Handles Client Credentials authentication and all Spotify API calls.
 * Token is cached in-memory and auto-refreshed when expired.
 */
import axios from 'axios';
import logger from '../utils/logger';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// In-memory token cache
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Get a valid Spotify access token via Client Credentials flow.
 * Caches the token and auto-refreshes 60s before expiry.
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env');
  }

  try {
    const response = await axios.post(
      SPOTIFY_TOKEN_URL,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
      }
    );

    cachedToken = response.data.access_token;
    tokenExpiresAt = now + response.data.expires_in * 1000;
    logger.info('Spotify access token obtained/refreshed');
    return cachedToken!;
  } catch (error: any) {
    logger.error('Failed to obtain Spotify access token', {
      status: error.response?.status,
      message: error.response?.data?.error_description || error.message,
    });
    throw new Error('Failed to authenticate with Spotify');
  }
}

/**
 * Make an authenticated GET request to the Spotify Web API.
 */
async function spotifyGet<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const token = await getAccessToken();
  const response = await axios.get<T>(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return response.data;
}

// ───────────────────────── Search ─────────────────────────

export interface SpotifySearchParams {
  q: string;
  type: string;  // comma-separated: "track,artist,album"
  limit?: number;
  offset?: number;
  market?: string;
}

export async function search(params: SpotifySearchParams) {
  return spotifyGet('/search', {
    q: params.q,
    type: params.type,
    limit: params.limit || 20,
    offset: params.offset || 0,
    market: params.market || 'US',
  });
}

// ───────────────────────── Browse ─────────────────────────

export async function getCategories(limit = 50, offset = 0, country = 'US', locale = 'en_US') {
  return spotifyGet('/browse/categories', { limit, offset, country, locale });
}

export async function getCategoryPlaylists(categoryId: string, limit = 20, offset = 0, country = 'US') {
  return spotifyGet(`/browse/categories/${categoryId}/playlists`, { limit, offset, country });
}

export async function getNewReleases(limit = 20, offset = 0, country = 'US') {
  return spotifyGet('/browse/new-releases', { limit, offset, country });
}

export async function getFeaturedPlaylists(limit = 20, offset = 0, country = 'US') {
  return spotifyGet('/browse/featured-playlists', { limit, offset, country });
}

// ───────────────────────── Artists ─────────────────────────

export async function getArtist(artistId: string) {
  return spotifyGet(`/artists/${artistId}`);
}

export async function getArtistTopTracks(artistId: string, market = 'US') {
  return spotifyGet(`/artists/${artistId}/top-tracks`, { market });
}

export async function getArtistAlbums(artistId: string, limit = 20, offset = 0, includeGroups = 'album,single') {
  return spotifyGet(`/artists/${artistId}/albums`, {
    limit,
    offset,
    include_groups: includeGroups,
    market: 'US',
  });
}

export async function getRelatedArtists(artistId: string) {
  return spotifyGet(`/artists/${artistId}/related-artists`);
}

// ───────────────────────── Albums ─────────────────────────

export async function getAlbum(albumId: string, market = 'US') {
  return spotifyGet(`/albums/${albumId}`, { market });
}

export async function getAlbumTracks(albumId: string, limit = 50, offset = 0, market = 'US') {
  return spotifyGet(`/albums/${albumId}/tracks`, { limit, offset, market });
}

// ───────────────────────── Tracks ─────────────────────────

export async function getTrack(trackId: string, market = 'US') {
  return spotifyGet(`/tracks/${trackId}`, { market });
}

export async function getSeveralTracks(ids: string[], market = 'US') {
  return spotifyGet('/tracks', { ids: ids.join(','), market });
}

// ───────────────────────── Playlists ─────────────────────────

export async function getPlaylist(playlistId: string, market = 'US') {
  return spotifyGet(`/playlists/${playlistId}`, { market });
}

export async function getPlaylistTracks(playlistId: string, limit = 100, offset = 0, market = 'US') {
  return spotifyGet(`/playlists/${playlistId}/tracks`, { limit, offset, market });
}

// ───────────────────────── Recommendations ─────────────────────────

export interface RecommendationParams {
  seed_artists?: string;
  seed_genres?: string;
  seed_tracks?: string;
  limit?: number;
  market?: string;
}

export async function getRecommendations(params: RecommendationParams) {
  return spotifyGet('/recommendations', {
    ...params,
    limit: params.limit || 20,
    market: params.market || 'US',
  });
}

export async function getAvailableGenreSeeds() {
  return spotifyGet('/recommendations/available-genre-seeds');
}
