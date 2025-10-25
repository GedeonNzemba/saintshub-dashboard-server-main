import { MusicItem } from './types';

const R2_BASE_URL = 'https://pub-a52959f73e9942dd8c84e9b312ab8880.r2.dev';

export const getAlbumImage = (albumName: string) => {
  try {
    return `${R2_BASE_URL}/album/${albumName}/album.jpg`;
  } catch (error) {
    return null;
  }
};

export const formatTime = (milliseconds: number): string => {
  if (!milliseconds || isNaN(milliseconds)) return '0:00';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const getTrackType = (track: MusicItem) => {
  return track.key.startsWith('album/') ? 'album' : 'artist';
};

export const getAlbumNameFromTrack = (track: MusicItem) => {
  const parts = track.key.split('/');
  return parts[1] || 'Unknown Album';
};

export const getArtistNameFromTrack = (track: MusicItem): string => {
  if (!track.name) return 'Unknown Artist';
  
  // For artist tracks, the format is usually "Artist Name/track.mp3"
  const parts = track.name.split('/');
  if (parts.length > 1) {
    return parts[0];
  }
  
  return 'Unknown Artist';
};
