export interface MusicItem {
  key: string;
  size: number;
  lastModified: Date;
  type: 'album' | 'artist' | 'track';
  name: string;
  url?: string;
}

export interface PlaybackStatus {
  isPlaying: boolean;
  position: number;
  duration: number;
}

export type RepeatMode = 'off' | 'one' | 'all';
