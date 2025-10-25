// PATH: saintshub\app\(app)\components\music\musicService.ts
import axios from 'axios';
import { MUSICKIT_URI } from '../../../../utilities/tools'; // Import the base URI

const API_BASE_URL = MUSICKIT_URI; // Use the imported URI as the base URL

// Define interfaces for expected data structures
export interface Album {
  name: string;
  imageUrl: string;
  totalMusic?: number; // Made optional
  musicFiles?: MusicFile[]; // Optional based on endpoint
  totalSongs: number;
  songs: Song[];
}

export interface MusicFile {
  title: string;
  url: string; // This might be the direct public URL or need construction
  key: string; // R2 key
  size?: number;
  lastModified?: Date;
}

export interface Song {
  title: string;
  album: string;
  albumImage: string | null;
  artist?: string; // Added optional artist based on API response
  url: string; // Streaming URL or base for construction
  key: string;
  size?: number;
  lastModified?: Date;
  metadata?: any; // Keep metadata for potential future use if backend sends it
}

export interface MusicCollection {
  totalSongs: number;
  songs: Song[];
}

// --- Artist Types ---
export interface Artist {
  name: string;
  albums: number; // Number of albums by the artist
}

export interface ArtistAlbum {
  name: string;
  imageUrl: string;
  totalMusic: number;
}

export interface ArtistDetailsResponse {
  artist: string;
  albums: ArtistAlbum[];
}

export interface ArtistSongsResponse {
  artist: string;
  totalSongs: number;
  songs: Song[]; // Re-use the existing Song interface
}
// --- End Artist Types ---

export const fetchAlbums = async (limit: number = 20, offset: number = 0): Promise<Album[]> => {
  try {
    const response = await axios.get<Album[]>(`${API_BASE_URL}/api/music/albums`, {
      params: { limit, offset },
    });
    // Process imageUrl to ensure filename is lowercase
    const processedAlbums = response.data.map(album => {
      if (album.imageUrl) {
        try {
          const urlParts = album.imageUrl.split('/');
          const filename = urlParts.pop(); // Get the last part (filename)
          if (filename) {
            const lowerCaseFilename = filename.toLowerCase();
            urlParts.push(lowerCaseFilename); // Add the lowercase filename back
            album.imageUrl = urlParts.join('/'); // Reconstruct the URL
          }
        } catch (e) {
          console.error(`Error processing imageUrl ${album.imageUrl}:`, e);
          // Keep original URL if processing fails
        }
      }
      return album;
    });
    return processedAlbums;
  } catch (error) {
    console.error('Error fetching albums:', error);
    throw error; // Re-throw to allow caller handling
  }
};

export const fetchAlbumDetails = async (albumName: string, limit: number = 50, offset: number = 0): Promise<Album> => {
  try {
    // Encode album name to handle special characters in URL
    const encodedAlbumName = encodeURIComponent(albumName);
    const response = await axios.get<Album>(`${API_BASE_URL}/api/music/albums/${encodedAlbumName}`, {
      // Note: The backend endpoint must support limit/offset for the *songs within* the album if needed.
      // If the backend returns all songs always, limit/offset might not apply here directly for the album fetch.
      params: { /* limit, offset */ } // Pass params if backend uses them for song list within album
    });
    
    // TODO: Process imageUrl if needed (lowercase conversion from fetchAlbums)
    const albumData = response.data;
    if (albumData.imageUrl) {
       try {
          const urlParts = albumData.imageUrl.split('/');
          const filename = urlParts.pop();
          if (filename) {
            urlParts.push(filename.toLowerCase());
            albumData.imageUrl = urlParts.join('/');
          }
        } catch (e) {
          console.error(`Error processing imageUrl ${albumData.imageUrl}:`, e);
        }
    }

    // Ensure songs array exists, default to musicFiles if songs isn't present
    albumData.songs = albumData.songs || albumData.musicFiles || [];
    // Ensure totalSongs is accurate (if backend doesn't provide it reliably)
    albumData.totalSongs = albumData.songs.length;
    
    // Optional: Construct full streaming URLs for songs if needed
    // albumData.songs = albumData.songs.map(song => ({ ... }));
    
    return albumData; // Return the full Album object
  } catch (error) {
    console.error(`Error fetching album details for ${albumName}:`, error);
    throw error;
  }
};

export const fetchAllSongs = async (limit: number = 100, offset: number = 0, shuffle: boolean = false): Promise<MusicCollection> => {
  try {
    const response = await axios.get<MusicCollection>(`${API_BASE_URL}/api/music/songs`, {
      params: { limit, offset, shuffle }
    });
    // Process songs if needed (e.g., construct full URLs)
    response.data.songs = response.data.songs.map(song => ({
      ...song,
      // Construct full streaming URL - IMPORTANT: Adjust based on actual 'url' value returned by server
      url: `${API_BASE_URL}/api/music/stream/${encodeURIComponent(song.album)}/${encodeURIComponent(song.title)}`
      // If the server already returns the full streaming URL in song.url, you might not need this line.
    }));
    return response.data;
  } catch (error) {
    console.error('Error fetching all songs:', error);
    throw error;
  }
};

// Function to get the streaming URL (might be redundant if constructed above)
export const getStreamingUrl = (album: string, songTitle: string): string => {
  // Ensure album and songTitle are properly encoded for URL
  return `${API_BASE_URL}/api/music/stream/${encodeURIComponent(album)}/${encodeURIComponent(songTitle)}`;
};

// --- Favorite Helper Functions ---

// Type guard to check if an object is a Song (based on properties unique to Song)
export function isSongType(item: MusicFile | Song): item is Song {
  return (item as Song).album !== undefined && (item as Song).albumImage !== undefined;
}

// Centralized function to generate a unique and consistent key for any song/music file
// Use this whenever you need to identify a song for favorites, playlists, etc.
// Accepts optional albumName for cases where the song object itself doesn't have album info (e.g., MusicFile)
export const getSongKey = (song: MusicFile | Song, albumName?: string): string => {
  const titleOrKey = song.key || song.title; // Use R2 key if available, else title
  
  if (isSongType(song)) {
    // If it's a Song type, it has .album property, use it directly
    return `${song.album}::${titleOrKey}`;
  } else if (albumName) {
    // If it's a MusicFile type BUT albumName was provided, use the provided name
    return `${albumName}::${titleOrKey}`;
  } else {
    // Fallback: MusicFile without album context. Less reliable for global uniqueness.
    // Log a warning as this might lead to collisions if titles aren't unique across albums.
    console.warn(`Generating potentially non-unique favorite key for ${titleOrKey}. Album context missing.`);
    return titleOrKey; 
  }
};

// --- Artist Functions ---

/**
 * Fetches a list of all artists.
 */
export const fetchArtists = async (limit: number = 100, offset: number = 0): Promise<Artist[]> => {
  try {
    const response = await axios.get<{ artists: Artist[] }>(`${API_BASE_URL}/api/music/artists`, {
      params: { limit, offset },
    });
    // Sort artists alphabetically by name
    return response.data.artists.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching artists:', error);
    throw new Error('Failed to fetch artists');
  }
};

/**
 * Fetches details (albums) for a specific artist.
 * @param artistName The name of the artist.
 */
export const fetchArtistDetails = async (artistName: string): Promise<ArtistDetailsResponse> => {
  try {
    // Encode the artist name for the URL path segment
    const encodedArtistName = encodeURIComponent(artistName);
    const response = await axios.get<ArtistDetailsResponse>(`${API_BASE_URL}/api/music/artists/${encodedArtistName}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for artist ${artistName}:`, error);
    throw new Error(`Failed to fetch details for artist ${artistName}`);
  }
};

/**
 * Fetches all songs for a specific artist.
 * @param artistName The name of the artist.
 */
export const fetchArtistSongs = async (artistName: string): Promise<ArtistSongsResponse> => {
  try {
    // Encode the artist name for the URL path segment
    const encodedArtistName = encodeURIComponent(artistName);
    const response = await axios.get<ArtistSongsResponse>(`${API_BASE_URL}/api/music/artists/${encodedArtistName}/songs`);
    // Process albumImage URL similar to fetchAllSongs
    const processedResponse = {
      ...response.data,
      songs: response.data.songs.map(song => {
        if (song.albumImage) {
          try {
            const urlParts = song.albumImage.split('/');
            const filename = urlParts.pop();
            if (filename) {
              urlParts.push(filename.toLowerCase());
              return { ...song, albumImage: urlParts.join('/') };
            }
          } catch (e) {
            console.warn(`Failed to process albumImage URL for song ${song.title}: ${song.albumImage}`, e);
            // Return original song if processing fails
            return song; 
          }
        }
        return song;
      })
    };
    return processedResponse;
  } catch (error) {
    console.error(`Error fetching songs for artist ${artistName}:`, error);
    throw new Error(`Failed to fetch songs for artist ${artistName}`);
  }
};

// --- End Artist Functions ---
