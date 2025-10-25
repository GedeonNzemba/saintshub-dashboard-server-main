import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Image,
  PanResponder,
  GestureResponderEvent,
  LayoutChangeEvent,
  LayoutRectangle,
  Alert,
  Animated,
  Easing,
  TextInput,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Share from 'expo-sharing';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useMusicData } from './hooks/useMusicData';
import { getAlbumImage, formatTime, getTrackType, getAlbumNameFromTrack, getArtistNameFromTrack } from './utils';
import { extractColors, adjustColorOpacity } from './utils/colorUtils';
import { styles } from './styles';
import { MusicItem } from './types';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/_layout';
import MusicDrawer from './MusicDrawer';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Main Music Player Component - Handles the entire music player interface and functionality
export default function MusicPlayer() {
  // ============= State Management =============
  // UI State
  const [activeTab, setActiveTab] = useState<'albums' | 'artists'>('albums');
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Download Management
  const [downloading, setDownloading] = useState<{ [key: string]: number }>({});
  const [downloadedTracks, setDownloadedTracks] = useState<Set<string>>(new Set());
  
  // Track Management
  const [favoriteTrackKeys, setFavoriteTrackKeys] = useState<Set<string>>(new Set());
  const [showDownloaded, setShowDownloaded] = useState(false);
  const [filteredTracks, setFilteredTracks] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ============= Animation References =============
  const isAnimating = useRef(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const playerSlideAnim = useRef(new Animated.Value(100)).current;
  const downloadedSlideAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const playerExpandAnim = useRef(new Animated.Value(0)).current;
  const playerZIndex = useRef(new Animated.Value(100)).current;

  // ============= Custom Hooks =============
  // Music Data Hook - Manages music library data (albums, artists, tracks)
  const {
    albums,
    artists,
    allTracks,
    isLoading,
    error,
  } = useMusicData();

  // Audio Player Hook - Manages playback state and controls
  const {
    sound,
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
  } = useAudioPlayer();

  const { drawer } = useSelector((state: RootState) => state.reducer.mainDrawer);

  const handleMenuPress = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleTrackSelect = (track: string) => {
    // Find and play the selected track
    const selectedTrack = allTracks.find(t => t.key === track);
    if (selectedTrack) {
      playTrack(selectedTrack);
      handleDrawerClose();
    }
  };

  const handleTrackDelete = (track: string) => {
    const newTracks = new Set(downloadedTracks);
    newTracks.delete(track);
    setDownloadedTracks(newTracks);
  };

  const handleFavoriteRemove = (track: string) => {
    setFavoriteTrackKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(track);
      return newSet;
    });
  };

  // ============= Track Filtering and Search =============
  const filterTracksBySelection = useCallback((filter: string | null) => {
    if (!filter) {
      return allTracks;
    }

    // Check if the filter is an album name
    const isAlbum = albums.some(album => album.name === filter);
    
    return allTracks.filter(track => {
      if (isAlbum) {
        return track.key.startsWith(`album/${filter}/`);
      } else {
        return track.key.startsWith(`artist/${filter}/`);
      }
    });
  }, [albums, allTracks]);

  useEffect(() => {
    setSelectedFilter(null);
    setFilteredTracks(filterTracksBySelection(null));
  }, [activeTab, filterTracksBySelection]);

  useEffect(() => {
    if (selectedFilter !== null) {
      setFilteredTracks(filterTracksBySelection(selectedFilter));
    }
  }, [selectedFilter, filterTracksBySelection]);

  useEffect(() => {
    if (isShuffleOn) {
      const shuffledTracks = [...filteredTracks].sort(() => Math.random() - 0.5);
      setFilteredTracks(shuffledTracks);
    } else if (selectedFilter !== null) {
      setFilteredTracks(filterTracksBySelection(selectedFilter));
    }
  }, [isShuffleOn, selectedFilter, filterTracksBySelection]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTracks(allTracks);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = allTracks.filter(track => {
      const songName = track.name.toLowerCase();
      const albumName = getAlbumNameFromTrack(track).toLowerCase();
      const artistName = getArtistNameFromTrack(track).toLowerCase();

      return songName.includes(query) || 
             albumName.includes(query) || 
             artistName.includes(query);
    });

    setFilteredTracks(filtered);
  }, [searchQuery, allTracks]);

  useEffect(() => {
    (async () => {
      // Request permissions for saving to media library
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save music files.');
      }
    })();
  }, []);

  useEffect(() => {
    if (currentTrack) {
      // Slide up animation when track is selected
      Animated.spring(playerSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 120,
      }).start();
    } else {
      // Slide down animation when track is cleared
      Animated.spring(playerSlideAnim, {
        toValue: 100,
        useNativeDriver: true,
        damping: 20,
        stiffness: 120,
      }).start();
    }
  }, [currentTrack]);

  useEffect(() => {
    (async () => {
      if (sound && playbackStatus.didJustFinish) {
        if (repeatMode === 'one') {
          await seekTo(0);
          await sound.playAsync();
        } else if (repeatMode === 'all' || isShuffleOn) {
          // Find current track index
          const currentIndex = filteredTracks.findIndex(
            track => track.key === currentTrack?.key
          );
          
          // Play next track or loop back to start
          if (currentIndex < filteredTracks.length - 1) {
            playTrack(filteredTracks[currentIndex + 1]);
          } else if (repeatMode === 'all') {
            playTrack(filteredTracks[0]);
          }
        }
      }
    })();
  }, [
    playbackStatus.didJustFinish,
    repeatMode,
    currentTrack,
    filteredTracks,
    sound,
    seekTo,
    playTrack,
    isShuffleOn
  ]);

  useEffect(() => {
    // Adjust zIndex when drawer opens/closes
    if (drawer) {
      Animated.timing(playerZIndex, {
        toValue: 99,
        duration: 0,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(playerZIndex, {
        toValue: 100,
        duration: 0,
        useNativeDriver: false,
      }).start();
    }
  }, [drawer]);

  const handleImageError = (key: string) => {
    setFailedImages(prev => new Set(prev).add(key));
  };

  const shouldShowIcon = (track: MusicItem) => {
    return failedImages.has(track.key) || getTrackType(track) === 'artist';
  };

  // Progress state
  const [progress, setProgress] = useState(0);

  // Update progress during playback
  useEffect(() => {
    if (playbackStatus.isLoaded) {
      setProgress(playbackStatus.positionMillis / playbackStatus.durationMillis);
    }
  }, [playbackStatus.positionMillis]);

  // Handle slider change
  const handleSliderChange = (value: number) => {
    if (playbackStatus.isLoaded) {
      seekTo(value);
    }
  };

  const getTrackUrl = (track: any) => {
    const baseUrl = 'https://pub-a52959f73e9942dd8c84e9b312ab8880.r2.dev';
    const albumName = getAlbumNameFromTrack(track);
    return `${baseUrl}/album/${albumName}/${track.name}`;
  };

  const handleDownload = async (track: MusicItem) => {
    if (downloading[track.key] || downloadedTracks.has(track.key)) return;

    setDownloading(prev => ({ ...prev, [track.key]: 0 }));

    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        getTrackUrl(track),
        FileSystem.cacheDirectory + track.name,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setDownloading(prev => ({ ...prev, [track.key]: progress }));
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result?.uri) {
        const canShare = await Share.isAvailableAsync();
        if (canShare) {
          await Share.shareAsync(result.uri, {
            mimeType: 'audio/mpeg',
            dialogTitle: `Save ${track.name}`,
            UTI: 'public.mp3'
          });
          setDownloadedTracks(prev => new Set(prev).add(track.key));
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Could not download the track. Please try again.');
    } finally {
      setDownloading(prev => {
        const newState = { ...prev };
        delete newState[track.key];
        return newState;
      });
    }
  };

  const DownloadButton = ({ track }: { track: MusicItem }) => {
    const [isDownloading, setIsDownloading] = useState(downloading[track.key] !== undefined);
    const [downloadProgress, setDownloadProgress] = useState(downloading[track.key] || 0);
    const [isDownloaded, setIsDownloaded] = useState(downloadedTracks.has(track.key));
    const progressAnim = useRef(new Animated.Value(downloadProgress)).current;

    useEffect(() => {
      setIsDownloading(downloading[track.key] !== undefined);
      setDownloadProgress(downloading[track.key] || 0);
      setIsDownloaded(downloadedTracks.has(track.key));

      Animated.timing(progressAnim, {
        toValue: downloading[track.key] || 0,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }, [downloading[track.key], downloadedTracks.has(track.key)]);

    const getButtonContent = () => {
      if (isDownloaded) {
        return (
          <View style={styles.downloadComplete}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
          </View>
        );
      }

      if (isDownloading) {
        return (
          <View style={styles.downloadProgress}>
            <Animated.View 
              style={[
                styles.progressFill,
                { 
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }
              ]} 
            />
            <Text style={styles.progressText}>
              {Math.round(downloadProgress * 100)}%
            </Text>
          </View>
        );
      }

      return (
        <Ionicons name="cloud-download-outline" size={24} color="#ffffff" />
      );
    };

    return (
      <TouchableOpacity 
        style={[
          styles.downloadButton,
          isDownloaded && styles.downloadedButton
        ]} 
        onPress={() => handleDownload(track)}
        disabled={isDownloaded || isDownloading}
      >
        {getButtonContent()}
      </TouchableOpacity>
    );
  };

  const FavoriteButton = ({ track }: { track: MusicItem }) => {
    const isTrackFavorite = favoriteTrackKeys.has(track.key);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handleFavoritePress = () => {
      toggleFavorite(track);
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    };

    return (
      <TouchableOpacity 
        style={[
          styles.favoriteButton,
          isTrackFavorite && styles.favoriteActive
        ]} 
        onPress={handleFavoritePress}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={isTrackFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isTrackFavorite ? '#FF3B30' : '#666'}
          />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const toggleFavorite = (track: MusicItem) => {
    setFavoriteTrackKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(track.key)) {
        newSet.delete(track.key);
      } else {
        newSet.add(track.key);
      }
      return newSet;
    });
  };

  const isFavorite = (track: MusicItem) => favoriteTrackKeys.has(track.key);

  // Load saved data from AsyncStorage
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedDownloads = await AsyncStorage.getItem('downloadedTracks');
        const savedFavorites = await AsyncStorage.getItem('favoriteTracks');
        
        if (savedDownloads) {
          setDownloadedTracks(new Set(JSON.parse(savedDownloads)));
        }
        if (savedFavorites) {
          setFavoriteTrackKeys(new Set(JSON.parse(savedFavorites)));
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };
    loadSavedData();
  }, []);

  // Save to AsyncStorage whenever downloads or favorites change
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('downloadedTracks', JSON.stringify(Array.from(downloadedTracks)));
        await AsyncStorage.setItem('favoriteTracks', JSON.stringify(Array.from(favoriteTrackKeys)));
      } catch (error) {
        console.error('Error saving data:', error);
      }
    };
    saveData();
  }, [downloadedTracks, favoriteTrackKeys]);

  const handleTabChange = (tab: 'albums' | 'artists') => {
    if (activeTab !== tab) {
      // Start entrance animation
      fadeAnim.setValue(0);
      slideAnim.setValue(tab === 'albums' ? 50 : -50);

      // Change tab
      setActiveTab(tab);
      setSelectedFilter(null);
      setFilteredTracks(filterTracksBySelection(null));

      // Run entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const toggleDownloadedPanel = () => {
    const toValue = showDownloaded ? 0 : 1;
    setShowDownloaded(!showDownloaded);
    Animated.spring(downloadedSlideAnim, {
      toValue,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const TrackTitle = ({ title }: { title: string }) => {
    const scrollAnim = useRef(new Animated.Value(0)).current;
    const [textWidth, setTextWidth] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const needsScroll = textWidth > containerWidth;

    useEffect(() => {
      if (needsScroll) {
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(scrollAnim, {
            toValue: -(textWidth - containerWidth),
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.delay(1000),
          Animated.timing(scrollAnim, {
            toValue: 0,
            duration: 8000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (needsScroll) {
            scrollAnim.setValue(0);
          }
        });
      }
    }, [needsScroll, textWidth, containerWidth]);

    return (
      <View 
        style={styles.trackTitleContainer}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        <Animated.Text
          style={[
            styles.trackTitle,
            needsScroll && { transform: [{ translateX: scrollAnim }] }
          ]}
          onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
        >
          {title.replace('.mp3', '')}
        </Animated.Text>
      </View>
    );
  };

  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);

  const togglePlayerExpansion = () => {
    const toValue = isPlayerExpanded ? 0 : 1;
    setIsPlayerExpanded(!isPlayerExpanded);
    Animated.spring(playerExpandAnim, {
      toValue,
      useNativeDriver: true,
      tension: 65,
      friction: 11
    }).start();
  };

  const [queue, setQueue] = useState<any[]>([]);
  const [shuffledQueue, setShuffledQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    if (currentTrack) {
      // Create initial queue from filtered tracks
      const filteredTracks = filterTracksBySelection(selectedFilter);
      const trackIndex = filteredTracks.findIndex(track => track.key === currentTrack.key);
      setCurrentIndex(trackIndex);
      setQueue(filteredTracks);
      
      // If shuffle is on, create shuffled queue
      if (isShuffleOn) {
        const shuffled = shuffleArray(filteredTracks);
        // Move current track to the start of shuffled queue
        const currentTrackIndex = shuffled.findIndex(track => track.key === currentTrack.key);
        if (currentTrackIndex !== -1) {
          shuffled.splice(currentTrackIndex, 1);
          shuffled.unshift(currentTrack);
        }
        setShuffledQueue(shuffled);
      }
    }
  }, [currentTrack, selectedFilter, isShuffleOn]);

  const playNextTrack = async () => {
    const currentQueue = isShuffleOn ? shuffledQueue : queue;
    if (currentQueue.length === 0) return;

    let nextIndex = currentIndex + 1;
    if (nextIndex >= currentQueue.length) {
      nextIndex = repeatMode === 'all' ? 0 : currentIndex;
    }

    if (nextIndex !== currentIndex || repeatMode === 'one') {
      const nextTrack = repeatMode === 'one' ? currentTrack : currentQueue[nextIndex];
      setCurrentIndex(nextIndex);
      await playTrack(nextTrack);
    }
  };

  const playPreviousTrack = async () => {
    const currentQueue = isShuffleOn ? shuffledQueue : queue;
    if (currentQueue.length === 0) return;

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = repeatMode === 'all' ? currentQueue.length - 1 : 0;
    }

    if (prevIndex !== currentIndex) {
      const prevTrack = currentQueue[prevIndex];
      setCurrentIndex(prevIndex);
      await playTrack(prevTrack);
    }
  };

  const handleShuffleToggle = () => {
    toggleShuffle();
    
    if (!isShuffleOn && currentTrack) {
      const shuffled = shuffleArray(queue);
      const currentIndex = shuffled.findIndex(track => track.key === currentTrack.key);
      if (currentIndex !== -1) {
        shuffled.splice(currentIndex, 1);
        shuffled.unshift(currentTrack);
      }
      setQueue(shuffled);
    }
  };

  useEffect(() => {
    if (playbackStatus?.didJustFinish) {
      playNextTrack();
    }
  }, [playbackStatus?.didJustFinish]);

  const [colorScheme, setColorScheme] = useState<string[]>(['#90CAF9', '#2196F3', '#1976D2']);

  useEffect(() => {
    const updateColors = async () => {
      if (currentTrack) {
        const imageUri = getAlbumImage(getAlbumNameFromTrack(currentTrack));
        if (imageUri) {
          const colors = await extractColors(imageUri);
          setColorScheme(colors);
        }
      }
    };

    updateColors();
  }, [currentTrack]);

  const handleClosePlayer = useCallback(async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    setCurrentTrack(null);
  }, [sound, setCurrentTrack]);

  const renderExpandedPlayer = () => 
    isPlayerExpanded && currentTrack ? (
      <Animated.View
        style={[
          styles.expandedPlayer,
          {
            transform: [
              {
                translateY: playerExpandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [SCREEN_HEIGHT, 0],
                }),
              },
            ],
            zIndex: playerZIndex,
          },
        ]}
      >
        <LinearGradient
          colors={['#0c1445', '#082654', '#0a3875']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.expandedPlayerHeader}>
          <TouchableOpacity 
            onPress={togglePlayerExpansion}
            style={[styles.headerButton, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
          >
            <Ionicons name="chevron-down" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.expandedPlayerTitle}>Now Playing</Text>
          <TouchableOpacity 
            onPress={handleClosePlayer}
            style={[styles.headerButton, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.expandedPlayerContent}>
          {!shouldShowIcon(currentTrack) ? (
            <Animated.Image
              source={{
                uri: getAlbumImage(getAlbumNameFromTrack(currentTrack)),
              }}
              style={[
                styles.expandedAlbumArt,
                {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 10,
                  borderRadius: 24,
                }
              ]}
              onError={() => handleImageError(currentTrack.key)}
            />
          ) : (
            <View style={[
              styles.trackIconContainer,
              styles.expandedAlbumArt,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 24,
              }
            ]}>
              <Ionicons name="musical-note" size={64} color="#FFFFFF" />
            </View>
          )}

          <View style={[styles.expandedTrackInfo, { alignItems: 'center' }]}>
            <Text style={[styles.expandedTrackTitle, { color: '#FFFFFF', fontSize: 24, fontWeight: '600' }]} numberOfLines={2}>
              {currentTrack.name}
            </Text>
            <Text style={[styles.expandedTrackArtist, { color: 'rgba(255, 255, 255, 0.8)', fontSize: 18 }]} numberOfLines={1}>
              {getTrackType(currentTrack) === 'album'
                ? getAlbumNameFromTrack(currentTrack)
                : getArtistNameFromTrack(currentTrack) || 'Unknown Artist'}
            </Text>
          </View>

          <View style={styles.expandedProgressContainer}>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0}
              maximumValue={1}
              value={progress}
              onValueChange={handleSliderChange}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
              thumbTintColor="#FFFFFF"
            />
            <View style={styles.expandedTimeContainer}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                {formatTime(playbackStatus?.positionMillis || 0)}
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                {formatTime(playbackStatus?.durationMillis || 0)}
              </Text>
            </View>
          </View>

          <View style={[styles.expandedControls, { marginTop: 20 }]}>
            <TouchableOpacity
              style={[styles.expandedControlButton, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
              onPress={handleShuffleToggle}
            >
              <Ionicons
                name="shuffle"
                size={28}
                color={isShuffleOn ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.expandedControlButton, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
              onPress={playPreviousTrack}
            >
              <Ionicons name="play-skip-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.expandedPlayButton,
                {
                  backgroundColor: '#FFFFFF',
                  shadowColor: 'rgba(0, 0, 0, 0.3)',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                }
              ]}
              onPress={togglePlayPause}
            >
              <Ionicons
                name={playbackStatus?.isPlaying ? 'pause' : 'play'}
                size={40}
                color="#082654"
                style={{ marginLeft: playbackStatus?.isPlaying ? 0 : 4 }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.expandedControlButton, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
              onPress={playNextTrack}
            >
              <Ionicons name="play-skip-forward" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.expandedControlButton, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
              onPress={toggleRepeat}
            >
              <Ionicons
                name={repeatMode === 'one' ? 'repeat-once' : 'repeat'}
                size={28}
                color={repeatMode !== 'off' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    ) : null;

  return (
    <>
      {/* Main Content Area - Contains album/artist lists and track listing */}
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.mainContent}>
            {/* Menu button */}
            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleMenuPress}
            >
              <Ionicons name="menu" size={24} color="#333" />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Music</Text>
              <Text style={styles.headerSubtitle}>Your favorite worship songs</Text>
            </View>

            {/* Search Bar Section */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search songs, albums, or artists"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#666"
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Main Scrollable Content */}
            <ScrollView 
              showsVerticalScrollIndicator={false}
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
            >
              {!isLoading && filteredTracks.length > 0 ? (
                <>
                  {/* Albums Horizontal Scroll Section */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Albums</Text>
                    {/* Album list content */}
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.horizontalScroll}
                    >
                      {albums.map((album) => (
                        <TouchableOpacity
                          key={album.key}
                          style={styles.horizontalCard}
                          onPress={() => {
                            setActiveTab('albums');
                            setSelectedFilter(album.name);
                          }}
                        >
                          {!failedImages.has(album.key) ? (
                            <Image
                              source={{ uri: getAlbumImage(album.name) }}
                              style={styles.horizontalAlbumImage}
                              onError={() => handleImageError(album.key)}
                            />
                          ) : (
                            <View style={[styles.horizontalAlbumImage, styles.placeholderImage]}>
                              <Ionicons name="musical-notes" size={40} color="#007AFF" />
                            </View>
                          )}
                          <View style={styles.horizontalCardInfo}>
                            <Text style={styles.horizontalCardTitle} numberOfLines={1}>
                              {album.name}
                            </Text>
                            <Text style={styles.horizontalCardSubtitle} numberOfLines={1}>
                              {allTracks.filter(track => 
                                track.key.startsWith(`album/${album.name}/`) && 
                                track.name.toLowerCase().endsWith('.mp3')
                              ).length} Songs
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Artists Horizontal Scroll Section */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Artists</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.horizontalScroll}
                    >
                      {artists.map((artist) => (
                        <TouchableOpacity
                          key={artist.key}
                          style={styles.horizontalCard}
                          onPress={() => {
                            setActiveTab('artists');
                            setSelectedFilter(artist.name);
                          }}
                        >
                          <View style={styles.horizontalArtistImage}>
                            <Ionicons name="person-circle" size={60} color="#007AFF" />
                          </View>
                          <View style={styles.horizontalCardInfo}>
                            <Text style={styles.horizontalCardTitle} numberOfLines={1}>
                              {artist.name}
                            </Text>
                            <Text style={styles.horizontalCardSubtitle} numberOfLines={1}>
                              {allTracks.filter(track => 
                                track.key.startsWith(`artist/${artist.name}/`) && 
                                track.name.toLowerCase().endsWith('.mp3')
                              ).length} Songs
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Tracks Section */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      {selectedFilter ? selectedFilter : 'All Tracks'}
                    </Text>
                    <View style={styles.tracksList}>
                      {filteredTracks.map((track: MusicItem) => (
                        <TouchableOpacity
                          key={track.key}
                          style={[
                            styles.trackCard,
                            currentTrack?.key === track.key && styles.activeTrackCard
                          ]}
                          onPress={() => playTrack(track)}
                        >
                          <View style={styles.trackInfoContainer}>
                            {!failedImages.has(track.key) ? (
                              <Image
                                source={{ 
                                  uri: getAlbumImage(getAlbumNameFromTrack(track)) || undefined 
                                }}
                                style={styles.trackAlbumImage}
                                onError={() => handleImageError(track.key)}
                              />
                            ) : (
                              <View style={styles.trackIconContainer}>
                                <Ionicons name="musical-notes" size={32} color="#007AFF" />
                              </View>
                            )}
                            <View style={styles.trackInfo}>
                              <Text style={styles.trackTitle} numberOfLines={1}>
                                {track.name.replace(/\.[^/.]+$/, '')}
                              </Text>
                              <Text style={styles.trackArtist} numberOfLines={1}>
                                {getTrackType(track) === 'album'
                                  ? getAlbumNameFromTrack(track)
                                  : getArtistNameFromTrack(track)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.trackActions}>
                            <FavoriteButton track={track} />
                            <DownloadButton track={track} />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              ) : searchQuery ? (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={64} color="#CBD5E1" />
                  <Text style={styles.noResultsTitle}>No matches found</Text>
                  <Text style={styles.noResultsText}>
                    No songs found matching "{searchQuery}".{'\n'}
                    Try searching for something else.
                  </Text>
                </View>
              ) : (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>

      {/* Mini Player Controls - Shows when a track is playing */}
      {currentTrack && (
        <Animated.View
          style={[
            styles.playerControls,
            {
              transform: [{ translateY: playerSlideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#0c1445', '#082654', '#0a3875']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              StyleSheet.absoluteFill,
              { 
                opacity: 0.98,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
              }
            ]}
          />
          
          {/* Close Button - Positioned absolutely in the top-right corner */}
          <TouchableOpacity
            style={styles.miniPlayerCloseButton}
            onPress={handleClosePlayer}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.playerContent,
              { 
                backgroundColor: 'transparent',
                paddingHorizontal: 16,
                paddingVertical: 12
              }
            ]}
            onPress={togglePlayerExpansion}
            activeOpacity={0.7}
          >
            {/* TRACK IMAGE */}
            {!failedImages.has(currentTrack.key) ? (
              <Animated.Image
                source={{
                  uri: getAlbumImage(getAlbumNameFromTrack(currentTrack)) || undefined,
                }}
                style={[
                  styles.playerAlbumImage,
                  {
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                  }
                ]}
                onError={() => handleImageError(currentTrack.key)}
              />
            ) : (
              <View style={[
                styles.playerIconContainer,
                {
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                }
              ]}>
                <Ionicons name="musical-note" size={28} color="#FFFFFF" />
              </View>
            )}

            {/* TRACK INFO */}
            <View style={[
              styles.playerInfo,
              {
                flex: 1,
                marginLeft: 16,
                justifyContent: 'center'
              }
            ]}>
              <Text style={[
                styles.playerTrackTitle,
                {
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 4
                }
              ]} numberOfLines={1}>
                {currentTrack.name}
              </Text>
              <Text style={[
                styles.playerAlbumName,
                {
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: 14,
                  fontWeight: '500'
                }
              ]} numberOfLines={1}>
                {getTrackType(currentTrack) === 'album'
                  ? getAlbumNameFromTrack(currentTrack)
                  : getArtistNameFromTrack(currentTrack)}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Playback Control Buttons */}
          <View style={[
            styles.playerButtons,
            {
              backgroundColor: 'transparent',
              paddingHorizontal: 16,
              paddingBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }
          ]}>
            <TouchableOpacity
              style={[
                styles.playerButton,
                {
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                }
              ]}
              onPress={handleShuffleToggle}
            >
              <Ionicons
                name="shuffle"
                size={24}
                color={isShuffleOn ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.playButton,
                {
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  marginHorizontal: 20,
                }
              ]}
              onPress={togglePlayPause}
            >
              <Ionicons
                name={playbackStatus?.isPlaying ? 'pause' : 'play'}
                size={32}
                color="#082654"
                style={{ 
                  marginLeft: playbackStatus?.isPlaying ? 0 : 2,
                  marginTop: 1
                }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.playerButton,
                {
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                }
              ]}
              onPress={toggleRepeat}
            >
              <Ionicons
                name={repeatMode === 'one' ? 'repeat-once' : 'repeat'}
                size={24}
                color={repeatMode !== 'off' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
              />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={[
            styles.progressBarContainer,
            {
              backgroundColor: 'transparent',
              paddingHorizontal: 16,
              paddingBottom: 16
            }
          ]}>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0}
              maximumValue={1}
              value={progress}
              onValueChange={handleSliderChange}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
              thumbTintColor="#FFFFFF"
              thumbStyle={{
                width: 16,
                height: 16,
                backgroundColor: '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}
            />
          </View>
        </Animated.View>
      )}

      {/* Expanded Player View - Full screen player with additional controls */}
      {renderExpandedPlayer()}

      {/* Side Drawer - Contains downloaded and favorite tracks */}
      <MusicDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        downloadedTracks={downloadedTracks}
        favoriteTrackKeys={favoriteTrackKeys}
        onTrackSelect={handleTrackSelect}
        onTrackDelete={handleTrackDelete}
        onFavoriteRemove={handleFavoriteRemove}
      />
    </>
  );
}
