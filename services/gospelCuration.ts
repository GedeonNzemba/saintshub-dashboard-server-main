/**
 * Gospel / Christian Music Curation Service
 * 
 * Curates Christian music content from Spotify's catalog using:
 * - Search API with genre filters (genre:gospel, genre:christian)
 * - Recommendations API seeded with gospel/christian genres
 * - Curated lists of well-known Christian artist Spotify IDs
 * - Multi-language support (English, French, Spanish, Portuguese, etc.)
 */
import { search, getArtist, getArtistTopTracks } from './spotifyService';
import logger from '../utils/logger';

// ───────────────────────── Curated Artist IDs ─────────────────────────
// Well-known Christian/Gospel artists across languages

export const CURATED_ARTISTS = {
  // ── English Worship & Contemporary ──
  worship: [
    '3SgHzT552wy2W8pNLaLk24', // Hillsong Worship
    '3YCKuqpv9nCsIhJ2v8SMix', // Elevation Worship
    '6pRi6EIPXz4QJEOEsBaA0m', // Chris Tomlin
    '40LHVA5BTQp9RxHOQ9JPYj', // Lauren Daigle
    '26T4yOaOoFJvUvxR87Y9HO', // Bethel Music
    '58r1rB5t3VF5X6yXGPequV', // Maverick City Music
    '74cb3MG0x0BOnYNW1uXYnM', // Hillsong UNITED
    '5XlSS9O4eHRiJ0hKzbaFQ2', // Kari Jobe
    '5d1JhBfyb58upMXCZOdbQu', // Phil Wickham
  ],
  // ── Gospel ──
  gospel: [
    '4akybxRTGHJZ1DXjLhJ1qu', // Kirk Franklin
    '3qfrrrSO7utFdJkM2tvMRb', // CeCe Winans
    '5YxebzzreNswbtYC1td4cx', // Tasha Cobbs Leonard
    '41OAtBkqAXVdMlteKlhrZz', // Todd Dulaney
    '6PTGRlwNbg36Mu4boWlixN', // William McDowell
    '6hKHFC67DZJNw9tg1l0lIe', // Sinach
    '74IEeKcuS34kF2TjOigXra', // Donnie McClurkin
  ],
  // ── French Gospel / Louange ──
  french: [
    '3hI9YP4rI93GyoPk5E9zT3', // Dena Mwana
    '6hKHFC67DZJNw9tg1l0lIe', // Sinach (also sings in French)
    '6JrKAZX6GY55wH27xlcMX9', // Mike Kalambay
    '1FDUbvMKJUBLYUZwq5wVIm', // Deborah Lukalu
    '3SgHzT552wy2W8pNLaLk24', // Hillsong Worship (global)
    '3YCKuqpv9nCsIhJ2v8SMix', // Elevation Worship (global)
  ],
  // ── Spanish / Latin Worship ──
  spanish: [
    '4x7kxyIgzgtrHYDQ8SCzo2', // Marcos Witt
    '6JaSyvyg28SHC0Of8YE6M9', // Christine D'Clario
    '7zpvy5B9gb5KprNUzNCOEE', // Miel San Marcos
    '3YCKuqpv9nCsIhJ2v8SMix', // Elevation Worship (global)
    '3SgHzT552wy2W8pNLaLk24', // Hillsong Worship (global)
  ],
  // ── Portuguese / Brazilian ──
  portuguese: [
    '6iAY2AyUZLSX3PWLIAfFZY', // Fernandinho
    '2aKyKSggb31Kw9s9i3iXoo', // Aline Barros
    '4fdCGYM7dtJLa3LvR1ccto', // Gabriela Rocha
  ],
};

// All artist IDs flattened for quick lookup
export const ALL_ARTIST_IDS = Object.values(CURATED_ARTISTS).flat();

// ───────────────────────── Search Queries by Language ─────────────────────────

interface LangQueries {
  worship: string[];
  gospel: string[];
  praise: string[];
  trending: string[];
}

const SEARCH_QUERIES: Record<string, LangQueries> = {
  en: {
    worship: ['worship music', 'worship songs 2024', 'contemporary worship'],
    gospel: ['gospel music', 'gospel songs', 'gospel choir'],
    praise: ['praise and worship', 'christian praise'],
    trending: ['new christian music 2024', 'christian hits'],
  },
  fr: {
    worship: ['louange et adoration', 'musique chrétienne', 'louange'],
    gospel: ['gospel français', 'gospel africain', 'gospel music'],
    praise: ['cantique', 'adoration', 'chant chrétien'],
    trending: ['nouveau gospel 2024', 'gospel 2024'],
  },
  es: {
    worship: ['adoración música cristiana', 'música cristiana'],
    gospel: ['gospel en español', 'música gospel'],
    praise: ['alabanza y adoración', 'alabanza cristiana'],
    trending: ['música cristiana 2024', 'nuevas canciones cristianas'],
  },
  pt: {
    worship: ['adoração música gospel', 'música gospel brasileiro'],
    gospel: ['gospel brasileiro', 'gospel music'],
    praise: ['louvor e adoração', 'hinos gospel'],
    trending: ['gospel 2024', 'lançamentos gospel'],
  },
};

// ───────────────────────── Section Definitions ─────────────────────────

export interface FeedSection {
  id: string;
  title: string;
  subtitle?: string;
  type: 'artists' | 'tracks' | 'albums' | 'playlists';
  items: any[];
  gradient?: [string, string];
}

export interface GospelFeed {
  sections: FeedSection[];
  heroArtists: any[];
  greeting: string;
}

// ───────────────────────── Feed Builder ─────────────────────────

/**
 * Build a curated Christian/Gospel feed for the Explore screen.
 * 
 * @param lang - ISO 639-1 language code (en, fr, es, pt)
 * @param market - ISO 3166-1 country code for content availability
 */
export async function buildGospelFeed(lang = 'en', market = 'US'): Promise<GospelFeed> {
  const queries = SEARCH_QUERIES[lang] || SEARCH_QUERIES.en;
  
  // Determine which curated artist set to prioritize
  const langArtistMap: Record<string, keyof typeof CURATED_ARTISTS> = {
    fr: 'french',
    es: 'spanish',
    pt: 'portuguese',
    en: 'worship',
  };
  const primaryArtistCategory = langArtistMap[lang] || 'worship';

  // Greetings by language
  const greetings: Record<string, string> = {
    en: 'Worship & Praise',
    fr: 'Louange & Adoration',
    es: 'Alabanza & Adoración',
    pt: 'Louvor & Adoração',
  };

  // Section titles by language
  const titles: Record<string, Record<string, string>> = {
    en: {
      featuredArtists: 'Featured Artists',
      worshipHits: 'Worship Hits',
      gospelSongs: 'Gospel Favorites',
      newReleases: 'New Christian Music',
      praise: 'Praise & Worship',
      recommended: 'Recommended For You',
      playlists: 'Christian Playlists',
      gospelArtists: 'Gospel Legends',
    },
    fr: {
      featuredArtists: 'Artistes en Vedette',
      worshipHits: 'Louange Populaire',
      gospelSongs: 'Gospel Favoris',
      newReleases: 'Nouveautés Chrétiennes',
      praise: 'Louange & Adoration',
      recommended: 'Recommandé Pour Vous',
      playlists: 'Playlists Chrétiennes',
      gospelArtists: 'Légendes du Gospel',
    },
    es: {
      featuredArtists: 'Artistas Destacados',
      worshipHits: 'Éxitos de Adoración',
      gospelSongs: 'Favoritos del Gospel',
      newReleases: 'Música Cristiana Nueva',
      praise: 'Alabanza & Adoración',
      recommended: 'Recomendado Para Ti',
      playlists: 'Playlists Cristianas',
      gospelArtists: 'Leyendas del Gospel',
    },
    pt: {
      featuredArtists: 'Artistas em Destaque',
      worshipHits: 'Sucessos de Louvor',
      gospelSongs: 'Favoritos do Gospel',
      newReleases: 'Novidades Cristãs',
      praise: 'Louvor & Adoração',
      recommended: 'Recomendado Para Você',
      playlists: 'Playlists Cristãs',
      gospelArtists: 'Lendas do Gospel',
    },
  };

  const t = titles[lang] || titles.en;

  // ── Parallel API calls (use Promise.allSettled for resilience) ──

  const [
    worshipTracksRes,
    gospelTracksRes,
    praiseTracksRes,
    trendingRes,
    worshipPlaylistsRes,
    gospelPlaylistsRes,
    recommendationsRes,
    heroArtistsRes,
  ] = await Promise.allSettled([
    // 1. Worship tracks
    search({
      q: queries.worship[0],
      type: 'track',
      limit: 20,
      market,
    }),
    // 2. Gospel tracks
    search({
      q: `${queries.gospel[0]} genre:gospel`,
      type: 'track',
      limit: 20,
      market,
    }),
    // 3. Praise tracks
    search({
      q: queries.praise[0],
      type: 'track',
      limit: 20,
      market,
    }),
    // 4. Trending / new releases
    search({
      q: queries.trending[0],
      type: 'album',
      limit: 15,
      market,
    }),
    // 5. Worship playlists
    search({
      q: `${queries.worship[0]}`,
      type: 'playlist',
      limit: 10,
      market,
    }),
    // 6. Gospel playlists
    search({
      q: `${queries.gospel[0]} playlist`,
      type: 'playlist',
      limit: 10,
      market,
    }),
    // 7. "Recommended" — top tracks from a few curated artists (replaces deprecated /recommendations)
    Promise.all(
      (CURATED_ARTISTS[primaryArtistCategory] || CURATED_ARTISTS.worship)
        .slice(0, 3)
        .map(id => getArtistTopTracks(id, market).catch(() => ({ tracks: [] })))
    ),
    // 8. Fetch hero artist profiles (top 6 for carousel)
    Promise.all(
      (CURATED_ARTISTS[primaryArtistCategory] || CURATED_ARTISTS.worship)
        .slice(0, 8)
        .map(id => getArtist(id).catch(() => null))
    ),
  ]);

  // ── Extract results safely ──

  const worshipTracks = worshipTracksRes.status === 'fulfilled'
    ? worshipTracksRes.value?.tracks?.items || [] : [];
  const gospelTracks = gospelTracksRes.status === 'fulfilled'
    ? gospelTracksRes.value?.tracks?.items || [] : [];
  const praiseTracks = praiseTracksRes.status === 'fulfilled'
    ? praiseTracksRes.value?.tracks?.items || [] : [];
  const trendingAlbums = trendingRes.status === 'fulfilled'
    ? trendingRes.value?.albums?.items || [] : [];
  const worshipPlaylists = worshipPlaylistsRes.status === 'fulfilled'
    ? worshipPlaylistsRes.value?.playlists?.items || [] : [];
  const gospelPlaylists = gospelPlaylistsRes.status === 'fulfilled'
    ? gospelPlaylistsRes.value?.playlists?.items || [] : [];
  const recommendedTracks = recommendationsRes.status === 'fulfilled'
    ? recommendationsRes.value
        .flatMap((r: any) => r?.tracks || [])
        .sort(() => Math.random() - 0.5)
        .slice(0, 20)
    : [];
  const heroArtists = heroArtistsRes.status === 'fulfilled'
    ? heroArtistsRes.value.filter(Boolean) : [];

  // ── Also fetch gospel artists for a dedicated section ──
  let gospelArtistProfiles: any[] = [];
  try {
    gospelArtistProfiles = await Promise.all(
      CURATED_ARTISTS.gospel.slice(0, 6).map(id => getArtist(id).catch(() => null))
    );
    gospelArtistProfiles = gospelArtistProfiles.filter(Boolean);
  } catch {
    // silent
  }

  // ── Merge and deduplicate playlists ──
  const allPlaylists = [...worshipPlaylists, ...gospelPlaylists];
  const seenPlaylistIds = new Set<string>();
  const uniquePlaylists = allPlaylists.filter(p => {
    if (!p || seenPlaylistIds.has(p.id)) return false;
    seenPlaylistIds.add(p.id);
    return true;
  }).slice(0, 12);

  // ── Build sections ──

  const sections: FeedSection[] = [];

  // Featured Artists (circular avatars)
  if (heroArtists.length > 0) {
    sections.push({
      id: 'featured-artists',
      title: t.featuredArtists,
      type: 'artists',
      items: heroArtists,
      gradient: ['#1a1a2e', '#16213e'],
    });
  }

  // Worship Hits
  if (worshipTracks.length > 0) {
    sections.push({
      id: 'worship-hits',
      title: t.worshipHits,
      subtitle: lang === 'fr' ? 'Les chants qui élèvent' : 'Songs that lift you higher',
      type: 'tracks',
      items: worshipTracks,
      gradient: ['#0f0c29', '#302b63'],
    });
  }

  // Recommended
  if (recommendedTracks.length > 0) {
    sections.push({
      id: 'recommended',
      title: t.recommended,
      subtitle: lang === 'fr' ? 'Basé sur vos goûts' : 'Based on what you love',
      type: 'tracks',
      items: recommendedTracks,
    });
  }

  // New Releases
  if (trendingAlbums.length > 0) {
    sections.push({
      id: 'new-releases',
      title: t.newReleases,
      type: 'albums',
      items: trendingAlbums,
      gradient: ['#1a1a1a', '#2d2d2d'],
    });
  }

  // Gospel Favorites
  if (gospelTracks.length > 0) {
    sections.push({
      id: 'gospel-songs',
      title: t.gospelSongs,
      subtitle: lang === 'fr' ? 'Classiques et nouveautés' : 'Classics and new favorites',
      type: 'tracks',
      items: gospelTracks,
    });
  }

  // Christian Playlists
  if (uniquePlaylists.length > 0) {
    sections.push({
      id: 'playlists',
      title: t.playlists,
      type: 'playlists',
      items: uniquePlaylists,
    });
  }

  // Gospel Legends
  if (gospelArtistProfiles.length > 0) {
    sections.push({
      id: 'gospel-artists',
      title: t.gospelArtists,
      type: 'artists',
      items: gospelArtistProfiles,
    });
  }

  // Praise & Worship
  if (praiseTracks.length > 0) {
    sections.push({
      id: 'praise',
      title: t.praise,
      type: 'tracks',
      items: praiseTracks,
    });
  }

  logger.info('Gospel feed built', {
    lang,
    market,
    sectionsCount: sections.length,
    heroArtistsCount: heroArtists.length,
  });

  return {
    sections,
    heroArtists,
    greeting: greetings[lang] || greetings.en,
  };
}

/**
 * Get top tracks from a curated list of Christian artists.
 * Used for "Quick Mix" or auto-play functionality.
 */
export async function getGospelQuickMix(lang = 'en', market = 'US', limit = 30) {
  const langArtistMap: Record<string, keyof typeof CURATED_ARTISTS> = {
    fr: 'french',
    es: 'spanish',
    pt: 'portuguese',
    en: 'worship',
  };
  
  const category = langArtistMap[lang] || 'worship';
  const artistIds = CURATED_ARTISTS[category].slice(0, 3);
  
  try {
    const results = await Promise.allSettled(
      artistIds.map(id => getArtistTopTracks(id, market))
    );
    
    const allTracks = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .flatMap(r => r.value?.tracks || []);
    
    // Shuffle and limit
    const shuffled = allTracks.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  } catch (error) {
    logger.error('Failed to build gospel quick mix', { error });
    return [];
  }
}
