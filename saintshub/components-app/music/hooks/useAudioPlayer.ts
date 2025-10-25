import { useState, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';
import { MusicItem, RepeatMode } from '../types';

const R2_BASE_URL = 'https://pub-a52959f73e9942dd8c84e9b312ab8880.r2.dev';

interface PlaybackStatus {
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  isBuffering: boolean;
  didJustFinish: boolean;
  isLoaded?: boolean;
  isSeeking: boolean;
  seekPosition: number;
}

export const useAudioPlayer = () => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentTrack, setCurrentTrack] = useState<MusicItem | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>({
    isPlaying: false,
    positionMillis: 0,
    durationMillis: 0,
    isBuffering: false,
    didJustFinish: false,
    isLoaded: false,
    isSeeking: false,
    seekPosition: 0
  });
  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [shuffledTracks, setShuffledTracks] = useState<MusicItem[]>([]);
  const [lastSeekTime, setLastSeekTime] = useState(0);

  // Initialize Audio
  useEffect(() => {
    async function initializeAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (err) {
        console.error('Failed to initialize audio:', err);
      }
    }

    initializeAudio();
  }, []);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPlaybackStatus({
        isPlaying: status.isPlaying,
        positionMillis: status.positionMillis || 0,
        durationMillis: status.durationMillis || 0,
        isBuffering: status.isBuffering || false,
        didJustFinish: status.didJustFinish || false,
        isLoaded: true,
        isSeeking: false,
        seekPosition: 0
      });
    }
  };

  const seekTo = useCallback(async (position: number) => {
    if (!sound || !playbackStatus.isLoaded) return;
    
    try {
      const seekPosition = Math.floor(position * playbackStatus.durationMillis);
      await sound.setPositionAsync(seekPosition);
    } catch (error) {
      // Silently handle seeking interruption
      if (error.message !== 'Seeking interrupted.') {
        console.error('Error seeking:', error);
      }
    }
  }, [sound, playbackStatus.isLoaded, playbackStatus.durationMillis]);

  const playTrack = async (track: MusicItem) => {
    try {
      // Unload previous track if exists
      if (sound) {
        await sound.unloadAsync();
      }

      const audioUrl = `${R2_BASE_URL}/${track.key}`;
      console.log('Attempting to play URL:', audioUrl);

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setCurrentTrack(track);
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  const togglePlayPause = async () => {
    if (!sound || !playbackStatus.isLoaded) return;

    try {
      if (playbackStatus.isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const toggleShuffle = () => {
    setIsShuffleOn(prev => !prev);
  };

  const toggleRepeat = () => {
    setRepeatMode(current => {
      switch (current) {
        case 'off': return 'all';
        case 'all': return 'one';
        case 'one': return 'off';
      }
    });
  };

  const shuffleTracks = (tracks: MusicItem[]) => {
    const shuffled = [...tracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledTracks(shuffled);
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  return {
    currentTrack,
    setCurrentTrack,
    playbackStatus,
    isShuffleOn,
    repeatMode,
    playTrack,
    togglePlayPause,
    toggleShuffle,
    toggleRepeat,
    seekTo,
    sound,
  };
};
