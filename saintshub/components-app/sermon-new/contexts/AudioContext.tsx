// PATH: saintshub\app\(app)\components\sermon-new\contexts\AudioContext.tsx
import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import { DAILY_SCRIPTURE_AND_QUOTE_URI } from '../../../../../utilities/tools';
import { Sermon } from '../types';

interface AudioContextType {
  // State
  currentSermon: Sermon | null;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  currentTime: number;
  sermonQueue: Sermon[];
  originalPlaylist: Sermon[];

  // Actions
  playSermon: (sermon: Sermon, playlist?: Sermon[]) => Promise<void>;
  pauseAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  skipForward: (seconds?: number) => Promise<void>;
  skipBackward: (seconds?: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  // State
  const [currentSermon, setCurrentSermon] = useState<Sermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [sermonQueue, setSermonQueue] = useState<Sermon[]>([]);
  const [originalPlaylist, setOriginalPlaylist] = useState<Sermon[]>([]);

  // Refs
  const soundRef = useRef<Audio.Sound | null>(null);
  const statusUpdateHandlerRef = useRef<((status: any) => void) | null>(null);

  // Configure audio mode
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Error configuring audio:', error);
      }
    };

    configureAudio();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  // Audio cleanup function
  const cleanupAudio = async () => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.unloadAsync();
        }
        soundRef.current = null;
      }
      
      if (statusUpdateHandlerRef.current) {
        statusUpdateHandlerRef.current = null;
      }
      
      setIsPlaying(false);
      setIsLoading(false);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
    } catch (error) {
      console.error('Error during audio cleanup:', error);
    }
  };

  // Load and play sermon
  const playSermon = async (sermon: Sermon, playlist: Sermon[] = []) => {
    try {
      setIsLoading(true);
      
      // If different sermon, cleanup previous
      if (currentSermon?.code !== sermon.code) {
        await cleanupAudio();
        setCurrentSermon(sermon);
      }

      if (playlist.length > 0) {
        const currentIndex = playlist.findIndex(item => item.code === sermon.code);
        if (currentIndex !== -1) {
          setOriginalPlaylist(playlist);
          setSermonQueue(playlist.slice(currentIndex + 1));
        }
      }

      // If no audio loaded, load it
      if (!soundRef.current) {
        let audioUrl = sermon.audioUrl;
        if (!audioUrl) {
          throw new Error('No audio URL available');
        }
        
        // Store original URL for fallback
        const originalUrl = audioUrl;
        let useStreamingApi = false;
        
        // Always use the direct audioUrl with the streaming API
        useStreamingApi = true;
        
        // Use the exact URL structure: ${DAILY_SCRIPTURE_AND_QUOTE_URI}/api/v3/streamSermon?audioUrl=<audioUrl>
        const streamUrl = `${DAILY_SCRIPTURE_AND_QUOTE_URI}/api/v3/streamSermon?audioUrl=${encodeURIComponent(audioUrl)}`;
        console.log('[AudioContext] Using streaming API with direct audioUrl:', streamUrl);
        audioUrl = streamUrl;

        console.log('[AudioContext] Loading audio from:', audioUrl);
        
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: false, isLooping: false },
            (status) => {
              if (statusUpdateHandlerRef.current) {
                statusUpdateHandlerRef.current(status);
              }
            }
          );
  
          soundRef.current = sound;
        } catch (error) {
          // If streaming API failed, try direct URL as fallback
          if (useStreamingApi) {
            console.log('[AudioContext] Streaming API failed, trying direct URL:', originalUrl);
            
            // Always use the direct cloudfront URL as fallback
            console.log('[AudioContext] Using direct cloudfront URL as fallback');
            const fallbackUrl = originalUrl;
            console.log('[AudioContext] Using fallback URL:', fallbackUrl);
            
            const { sound } = await Audio.Sound.createAsync(
              { uri: fallbackUrl },
              { shouldPlay: false, isLooping: false },
              (status) => {
                if (statusUpdateHandlerRef.current) {
                  statusUpdateHandlerRef.current(status);
                }
              }
            );
            
            soundRef.current = sound;
          } else {
            // If not using streaming API or fallback also failed, rethrow
            throw error;
          }
        }

        // Set up status update handler
        statusUpdateHandlerRef.current = (status: any) => {
          if (status.isLoaded) {
            setDuration(status.durationMillis || 0);
            setCurrentTime(status.positionMillis || 0);
            setProgress(status.durationMillis > 0 ? (status.positionMillis || 0) / status.durationMillis : 0);
            
            if (status.didJustFinish) {
              playNext();
            }
          }
          
          if (status.error) {
            console.error('[AudioContext] Playback error:', status.error);
            setIsPlaying(false);
            setIsLoading(false);
            Alert.alert('Playback Error', 'Unable to play this sermon. Please try again.');
          }
        };
      }

      // Start playback
      await soundRef.current.playAsync();
      setIsPlaying(true);
      
    } catch (error) {
      console.error('[AudioContext] Error playing sermon:', error);
      
      // Provide more specific error messages based on the error
      let errorMessage = 'Unable to play this sermon. Please check your connection and try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('No audio URL available')) {
          errorMessage = 'This sermon does not have an audio file available.';
        } else if (error.message.includes('NSURLErrorDomain')) {
          errorMessage = 'Network error while loading the sermon. Please check your internet connection.';
        }
      }
      
      Alert.alert('Playback Error', errorMessage);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Pause audio
  const pauseAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('[AudioContext] Error pausing audio:', error);
    }
  };

  // Resume audio
  const resumeAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('[AudioContext] Error resuming audio:', error);
    }
  };

  // Stop audio completely
  const stopAudio = async () => {
    try {
      await cleanupAudio();
      setCurrentSermon(null);
    } catch (error) {
      console.error('[AudioContext] Error stopping audio:', error);
    }
  };

  // Seek to position
  const seekTo = async (position: number) => {
    try {
      if (soundRef.current && duration > 0) {
        const seekPosition = Math.max(0, Math.min(position * duration, duration));
        await soundRef.current.setPositionAsync(seekPosition);
      }
    } catch (error) {
      console.error('[AudioContext] Error seeking:', error);
    }
  };

  // Skip forward
  const skipForward = async (seconds: number = 15) => {
    try {
      if (soundRef.current && duration > 0) {
        const newPosition = Math.min(currentTime + (seconds * 1000), duration);
        await soundRef.current.setPositionAsync(newPosition);
      }
    } catch (error) {
      console.error('[AudioContext] Error skipping forward:', error);
    }
  };

  // Skip backward
  const skipBackward = async (seconds: number = 15) => {
    try {
      if (soundRef.current) {
        const newPosition = Math.max(currentTime - (seconds * 1000), 0);
        await soundRef.current.setPositionAsync(newPosition);
      }
    } catch (error) {
      console.error('[AudioContext] Error skipping backward:', error);
    }
  };

  const playNext = async () => {
    if (sermonQueue.length > 0) {
      const nextSermon = sermonQueue[0];
      await playSermon(nextSermon, originalPlaylist);
    } else {
      stopAudio();
    }
  };

  const playPrevious = async () => {
    if (currentSermon && originalPlaylist.length > 0) {
      const currentIndex = originalPlaylist.findIndex(item => item.code === currentSermon.code);
      if (currentIndex > 0) {
        const previousSermon = originalPlaylist[currentIndex - 1];
        await playSermon(previousSermon, originalPlaylist);
      }
    }
  };

  const value: AudioContextType = {
    // State
    currentSermon,
    isPlaying,
    isLoading,
    progress,
    duration,
    currentTime,
    sermonQueue,
    originalPlaylist,
    
    // Actions
    playSermon,
    pauseAudio,
    resumeAudio,
    stopAudio,
    seekTo,
    skipForward,
    skipBackward,
    playNext,
    playPrevious,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

// Hook to use audio context
export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export default AudioContext;
