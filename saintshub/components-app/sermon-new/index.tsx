// PATH: saintshub\app\(app)\components\sermon-new\index.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  StatusBar,
  Modal,
  Image,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert,
  ScrollView,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { SegmentedButtons } from 'react-native-paper';
// import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { DAILY_SCRIPTURE_AND_QUOTE_URI } from '@/utilities/tools';
import { LinearGradient } from 'expo-linear-gradient';
import WebView from 'react-native-webview';
import { router, useFocusEffect } from 'expo-router';
// import MainPlayer from './components/player/MainPlayer';
import { AudioProvider } from './contexts/AudioContext';

// Import custom hooks for data fetching with caching
// Using the hooks from the sermon directory
// import {
//   useLanguages,
//   useSermons,
//   useSermonsByYear,
//   useSermonsByLength,
//   useSermonsBySeries
// } from '../sermon/hooks/useSermonData';
// import { clearOldSermonCaches, prefetchCommonSermonData } from './utils/cacheUtils';

// Import components
// import SafeLanguageSelector from './components/languages/SafeLanguageSelector';
// import SermonListWrapper, { SermonListSermon } from './components/sermon/SermonListWrapper';
// import PlayBottomSheet, { PlayBottomSheetHandle } from './components/modals/PlayBottomSheet';
import FilterModal from './components/filter/FilterModal';
// import FilterOptions from './components/filter/FilterOptions';
import { styles } from './utils/styles';
import { Language } from './types';

// Define interfaces
interface Sermon {
  _id: string;
  title: string;
  code: string;
  speaker: string;
  date: string;
  location: string;
  duration: string;
  audioUrl: string;
  pdfUrl: string;
  streamUrl: string;
  language?: string;
  year?: string;
  length?: 'SHORT' | 'MEDIUM' | 'LONG';
  series?: string;
  openPdf?: boolean; // Flag to indicate if PDF should be opened immediately
}

// Define the sermon response structure to match the API
interface SermonFormat {
  sermons: Sermon[];
}

interface LanguageSermonData {
  audio?: SermonFormat;
  book?: SermonFormat;
}

interface SermonsResponse {
  sermons?: Sermon[];
  [languageCode: string]: LanguageSermonData | Sermon[] | undefined;
}

type FilterType = 'language' | 'year' | 'length' | 'series' | 'search';

// Constants
const FAVORITES_STORAGE_KEY = '@SermonLibrary:favorites';

// DEVICE HEIGHT
const DEVICE_HEIGHT = Dimensions.get('window').height;

// Main component
interface SermonLibraryProps {
  presentPlayBottomSheet?: (sermon: any) => void;
}

const SermonLibrary: React.FC<SermonLibraryProps> = ({ presentPlayBottomSheet }) => {
  // Get React Query client for prefetching
  // const queryClient = useQueryClient(); // Temporarily disabled - package not installed
  
  // We'll handle sermon playback through the PlayBottomSheet component

  // Refs
  const soundRef = useRef<Audio.Sound | null>(null);
  const statusUpdateHandlerRef = useRef<((status: any) => void) | null>(null);
  const isAudioOperationInProgressRef = useRef(false);
  const justOpenedPdfRef = useRef(false);
  const playBottomSheetRef = useRef<any>(null); // PlayBottomSheetHandle type temporarily unavailable

  // Tab navigation state
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'browse', title: 'Browse' },
    { key: 'search', title: 'Search' },
    { key: 'favorites', title: 'Favorites' },
  ]);

  // Filter state
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [activeFilterType, setActiveFilterType] = useState<FilterType>('language');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Sermon[]>([]);
  const [languageSearchTerm, setLanguageSearchTerm] = useState('');

  // Filter values
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [lengthFilter, setLengthFilter] = useState<string | null>(null);
  const [seriesFilter, setSeriesFilter] = useState<string | null>(null);

  // Audio state
  const [currentSermon, setCurrentSermon] = useState<Sermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isMainPlayerVisible, setIsMainPlayerVisible] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log('[SermonLibrary] Screen focused. justOpenedPdfRef.current:', justOpenedPdfRef.current);
      if (justOpenedPdfRef.current) {
        console.log('[SermonLibrary] Returning from PDF, re-showing MainPlayer.');
        setIsMainPlayerVisible(true); // Re-show MainPlayer
        justOpenedPdfRef.current = false; // Reset the flag
      }
      return () => {
        // console.log('[SermonLibrary] Screen blurred.');
      };
    }, [setIsMainPlayerVisible])
  );

  // Use React Query hooks for data fetching
  // Temporarily using mock data until React Query is properly installed
  const languagesData: any = { languages: [] };
  const isLoadingLanguages = false;
  const languagesError = null;
  
  // Mock sermon data
  const sermonsData: any = undefined;
  const isLoadingSermons = false;
  const sermonsError = null;

  // Map the languages data from React Query to our component
  const languages = languagesData?.languages || [];

  // Extract sermons from the data structure
  const sermons = React.useMemo<Sermon[]>(() => {
    if (!sermonsData) return [];

    console.log('Processing sermon data:', sermonsData);

    // Check for 'd' property which is the primary API response format
    if (sermonsData.d && Array.isArray(sermonsData.d)) {
      console.log(`Found ${sermonsData.d.length} sermons in 'd' property`);
      // Ensure each sermon has an _id property
      return sermonsData.d.map((sermon: any) => ({
        ...sermon,
        _id: sermon._id || sermon.code || `sermon-${Math.random().toString(36).substring(2, 9)}`
      }));
    }
    // Check if sermonsData has a sermons property that is an array
    else if (sermonsData.sermons && Array.isArray(sermonsData.sermons)) {
      console.log(`Found ${sermonsData.sermons.length} sermons in flat structure`);
      // Ensure each sermon has an _id property
      return sermonsData.sermons.map((sermon: any) => ({
        ...sermon,
        _id: sermon._id || sermon.code || `sermon-${Math.random().toString(36).substring(2, 9)}`
      }));
    }
    // Legacy nested structure handling
    else if (typeof sermonsData === 'object' && sermonsData !== null) {
      // Try to handle the legacy nested structure
      const languageCode = selectedLanguage?.code;
      if (languageCode &&
        sermonsData[languageCode as keyof typeof sermonsData] &&
        typeof sermonsData[languageCode as keyof typeof sermonsData] === 'object') {

        // Use type assertion to safely access the nested structure
        const languageData = sermonsData[languageCode as keyof typeof sermonsData] as LanguageSermonData;

        // Format-specific sermons (audio or book)
        const formatData = languageData.audio || languageData.book;
        if (formatData?.sermons && Array.isArray(formatData.sermons)) {
          console.log(`Found ${formatData.sermons.length} sermons in nested structure`);
          // Ensure each sermon has an _id property
          return formatData.sermons.map(sermon => ({
            ...sermon,
            _id: sermon._id || sermon.code || `sermon-${Math.random().toString(36).substring(2, 9)}`
          }));
        }
      }
    }

    console.log('No sermons found in data structure, returning empty array');
    // Default empty array if no sermons found
    return [] as Sermon[];
  }, [sermonsData, selectedLanguage?.code]);

  // Clean up audio on component unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  // Effect to handle currentSermon changes for mini player visibility
  useEffect(() => {
    if (!currentSermon) {
      setShowMiniPlayer(false);
      setIsPlaying(false);
      // Optionally, you might want to call cleanupAudio() here if no sermon is active
      // cleanupAudio(); 
    }
  }, [currentSermon]);

  // Helper function to format time in MM:SS format
  const formatTime = useCallback((milliseconds: number): string => {
    if (!milliseconds) return '0:00';

    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, []);

  // Handle search
  const handleSearch = async () => {
    if (!selectedLanguage || !searchQuery.trim()) return;

    // Filter sermons based on search query - temporarily disabled
    // Will need to implement once React Query is properly configured
    console.log('Search functionality temporarily disabled');
    return [];
  };

  // Function to handle filter changes
  const handleFilterChange = (filterType: FilterType, value: string) => {
    console.log(`Filter changed: ${filterType} = ${value}`);

    // Reset other filters when changing one
    // This simplifies the UX by only allowing one filter at a time
    if (filterType !== 'year') setYearFilter(null);
    if (filterType !== 'length') setLengthFilter(null);
    if (filterType !== 'series') setSeriesFilter(null);

    // Set the appropriate filter
    switch (filterType) {
      case 'year':
        setYearFilter(value);
        // Query invalidation temporarily disabled - React Query not installed
        break;
      case 'length':
        setLengthFilter(value);
        // Query invalidation temporarily disabled - React Query not installed
        break;
      case 'series':
        setSeriesFilter(value);
        // Query invalidation temporarily disabled - React Query not installed
        break;
      default:
        break;
    }

    // Reset search when applying filters
    setSearchQuery('');

    // Set the active filter type for UI
    setActiveFilterType(filterType);
  };

  // No need for a separate fetchLanguages function as we're using the useLanguages hook
  // The languagesData, isLoadingLanguages, and languagesError are already provided by the hook

  // Function to handle language selection
  const handleLanguageSelect = (language: Language) => {
    console.log('Language selected:', language);
    setSelectedLanguage(language);

    // No need to manually fetch sermons - the useSermons hook will handle this
    // when selectedLanguage changes
  };

  // Audio state is already declared above, no need to redeclare

  // Function to clean up audio resources
  const cleanupAudio = async () => {
    try {
      console.log('Cleaning up audio resources');
      if (soundRef.current) {
        // First pause to stop any sound immediately
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            await soundRef.current.pauseAsync();
          }
        } catch (e) {
          console.warn('Error pausing during cleanup:', e);
        }

        // Then stop and unload
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        statusUpdateHandlerRef.current = null;
      }
      // Ensure the UI reflects that audio is stopped
      setIsPlaying(false);
    } catch (error) {
      console.error('Error cleaning up audio:', error);
    }
  };

  // Function to load audio from a URL
  const loadAudio = async (audioUrl: string) => {
    // Prevent multiple simultaneous audio operations
    if (isAudioOperationInProgressRef.current) {
      console.log('Audio operation already in progress, skipping');
      return;
    }

    isAudioOperationInProgressRef.current = true;
    setIsAudioLoading(true);

    try {
      console.log('Loading audio from URL:', audioUrl);

      // CRITICAL: Make sure to properly clean up any existing audio FIRST
      // This is essential to prevent multiple audio instances playing simultaneously
      await cleanupAudio();

      // Set up audio mode for better playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        allowsRecordingIOS: false,
        playThroughEarpieceAndroid: false,
      });

      // Create a status update handler with improved error handling
      const statusUpdateHandler = (status: any) => {
        if (status.isLoaded) {
          setPlaybackPosition(status.positionMillis);
          setPlaybackDuration(status.durationMillis || 0);
          setIsPlaying(status.isPlaying);

          // Handle playback completion
          if (status.didJustFinish && !status.isLooping) {
            console.log('Playback finished');
            setIsPlaying(false);
            // Reset position to beginning
            setShowMiniPlayer(false); // Hide mini player when playback finishes
            if (soundRef.current) {
              soundRef.current.setPositionAsync(0).catch(e =>
                console.warn('Error resetting position:', e)
              );
            }
          }
        } else if (status.error) {
          console.error(`Playback error: ${status.error}`);
          setIsAudioLoading(false);
          setShowMiniPlayer(false); // Hide mini player on playback error
        }
      };

      // Wait a moment to ensure any previous audio is fully cleaned up
      await new Promise(resolve => setTimeout(resolve, 100));

      // Store the handler in ref for cleanup
      statusUpdateHandlerRef.current = statusUpdateHandler;

      // Create and load the audio with improved error handling
      console.log('Creating new sound object');
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        {
          shouldPlay: false,  // Important: Don't auto-play
          progressUpdateIntervalMillis: 500,
          positionMillis: 0,
          volume: 1.0
        },
        statusUpdateHandler
      );

      // Store the sound object in ref
      soundRef.current = sound;

      console.log('Sound created successfully');

      // Wait to ensure everything is properly initialized
      await new Promise(resolve => setTimeout(resolve, 200));

      // Now play the audio
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.playAsync();
          setIsPlaying(true);
          console.log('Started playing audio');
        } else {
          console.error('Sound loaded but status shows not loaded');
        }
      } else {
        console.error('Sound reference lost after creation');
      }
    } catch (error) {
      console.error('Error loading audio:', error);
      setIsPlaying(false);
      await cleanupAudio(); // Clean up on error
    } finally {
      setIsAudioLoading(false);
      isAudioOperationInProgressRef.current = false;
    }
  };

  // Function to toggle playback
  const togglePlayback = async () => {
    // Prevent multiple simultaneous audio operations
    if (isAudioOperationInProgressRef.current) {
      console.log('Cannot toggle playback: operation in progress');
      return;
    }

    isAudioOperationInProgressRef.current = true;

    try {
      console.log('Toggle playback called, current playing state:', isPlaying);

      // If there's no sound object, we need to load the audio first
      if (!soundRef.current && currentSermon?.audioUrl) {
        console.log('No sound object available, loading audio first');
        await loadAudio(currentSermon.audioUrl);
        return; // loadAudio will handle playing
      }

      if (!soundRef.current) {
        console.error('No sound object available and no audio URL to load');
        return;
      }

      // Get current status
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) {
        console.error('Sound object not loaded');
        return;
      }

      // Toggle playback based on current state
      if (status.isPlaying) {
        // If playing, pause it
        await soundRef.current.pauseAsync();
        console.log('Audio paused');
        setIsPlaying(false);
      } else {
        // If paused, resume it - DO NOT reload the audio
        await soundRef.current.playAsync();
        console.log('Audio resumed');
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      // On error, make sure UI is in a consistent state
      setIsPlaying(false);
    } finally {
      isAudioOperationInProgressRef.current = false;
    }
  };

  // Function to skip forward
  const skipForward = async () => {
    if (isAudioOperationInProgressRef.current || !soundRef.current) {
      return;
    }

    isAudioOperationInProgressRef.current = true;

    try {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;

      // Skip forward by 30 seconds
      const newPosition = Math.min(status.positionMillis + 30000, status.durationMillis || 0);
      await soundRef.current.setPositionAsync(newPosition);
      console.log('Skipped forward to:', newPosition);
    } catch (error) {
      console.error('Error skipping forward:', error);
    } finally {
      isAudioOperationInProgressRef.current = false;
    }
  };

  // Function to skip backward
  const skipBackward = async () => {
    if (isAudioOperationInProgressRef.current || !soundRef.current) {
      return;
    }

    isAudioOperationInProgressRef.current = true;

    try {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;

      // Skip backward by 15 seconds
      const newPosition = Math.max(status.positionMillis - 15000, 0);
      await soundRef.current.setPositionAsync(newPosition);
      console.log('Skipped backward to:', newPosition);
    } catch (error) {
      console.error('Error skipping backward:', error);
    } finally {
      isAudioOperationInProgressRef.current = false;
    }
  };

  // Helper function to handle PDF opening and navigation
  const handleOpenPdfNavigation = async () => {
    console.log('[SermonLibrary] handleOpenPdfNavigation entered.'); // New log
    if (currentSermon && currentSermon.pdfUrl) {
      console.log('[SermonLibrary] Opening PDF for:', currentSermon.title, currentSermon.pdfUrl);

      justOpenedPdfRef.current = true; // Flag that we are navigating to PDF
      setIsMainPlayerVisible(false); // Hide MainPlayer to allow navigation
      console.log('[SermonLibrary] MainPlayer hidden, navigating to PDF. justOpenedPdfRef set to true.');
      router.push({
        pathname: '/pdf',
        params: {
          pdfUrl: currentSermon.pdfUrl,
          sermonTitle: currentSermon.title,
          isDarkMode: isDarkMode.toString(),
        },
      });
    } else {
      console.error('[SermonLibrary] No currentSermon or no pdfUrl to open.');
      Alert.alert('No PDF', 'This sermon does not have an associated PDF document.');
    }
  };

  // Function to handle sermon selection and playback
  const handlePlaySermon = (sermon: Sermon | null) => {
    console.log('Playing sermon:', sermon?.title);
    setCurrentSermon(sermon);
    
    if (sermon) {
      // Present the PlayBottomSheet modal using the ref
      // The PlayBottomSheet will handle playing the sermon through its AudioProvider
      if (playBottomSheetRef.current) {
        playBottomSheetRef.current.present();
      }
    } else {
      // If sermon is null, dismiss the bottom sheet
      if (playBottomSheetRef.current) {
        playBottomSheetRef.current.dismiss();
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#6a11cb', '#8e44ad']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.headerGradient, { marginHorizontal: 0 }]}
      >
        <SafeAreaView style={styles.safeAreaHeader}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="book-outline" size={24} color="#ffffff" />
              <Text style={styles.headerTitle}>Sermon Library</Text>
            </View>
            <View style={styles.headerIconContainer}>
              <TouchableOpacity style={styles.headerIcon}>
                <Ionicons name="search-outline" size={22} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIcon}>
                <Ionicons name="menu-outline" size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Main content container */}
      <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <View style={{ flex: 1 }}>
          {/* Tab navigation */}
          <View style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#ffffff',
            borderRadius: 12,
            marginHorizontal: 16,
            marginTop: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
            zIndex: 10
          }}>
            <View style={{
              flexDirection: 'row',
              backgroundColor: '#f1f5f9',
              borderRadius: 12,
              padding: 4,
              height: 60,
              borderWidth: 1,
              borderColor: 'rgba(106, 17, 203, 0.08)'
            }}>
              {routes.map((route, i) => {
                const isActive = index === i;
                const icons: Record<string, string> = {
                  browse: 'library-outline',
                  search: 'search-outline',
                  favorites: 'heart-outline'
                };

                return (
                  <TouchableOpacity
                    key={route.key}
                    style={{
                      flex: 1,
                      borderRadius: 10,
                      backgroundColor: isActive ? '#ffffff' : 'transparent',
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingVertical: 10,
                      shadowColor: isActive ? '#000' : 'transparent',
                      shadowOffset: { width: 0, height: isActive ? 2 : 0 },
                      shadowOpacity: isActive ? 0.1 : 0,
                      shadowRadius: isActive ? 4 : 0,
                      elevation: isActive ? 2 : 0,
                      transform: [{ scale: isActive ? 1.02 : 1 }]
                    }}
                    onPress={() => setIndex(i)}
                  >
                    <LinearGradient
                      colors={isActive ? ['#6a11cb', '#8e44ad'] : ['transparent', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        position: 'absolute',
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        opacity: isActive ? 0.15 : 0
                      }}
                    />
                    <Ionicons
                      name={route.key === 'browse' ? 'library-outline' :
                        route.key === 'search' ? 'search-outline' :
                          'heart-outline'}
                      size={22}
                      color={isActive ? '#6a11cb' : '#94a3b8'}
                      style={{ marginBottom: 4 }}
                    />
                    <Text style={{
                      fontSize: 13,
                      fontWeight: isActive ? '600' : '500',
                      color: isActive ? '#6a11cb' : '#64748b',
                      letterSpacing: 0.2
                    }}>
                      {route.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Tab content */}
          {index === 0 && (
            <View style={{
              minHeight: DEVICE_HEIGHT - 250,
              padding: 16,
              backgroundColor: '#ffffff',
              borderRadius: 12,
              margin: 16,
              marginTop: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 3
            }}>
              {!selectedLanguage ? (
                <>
                  <Text style={styles.sectionTitle}>
                    Select a Language
                  </Text>
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#64748b', textAlign: 'center' }}>
                      Language selector component temporarily unavailable.
                      {'\n'}Please ensure all required packages are installed.
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.selectedLanguageContainer}>
                    <View style={styles.languageBadge}>
                      <Ionicons name="globe-outline" size={18} color="#0ea5e9" style={{ marginRight: 8 }} />
                      <Text style={styles.selectedLanguageText}>
                        {selectedLanguage.name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.changeButton}
                      onPress={() => setSelectedLanguage(null)}
                    >
                      <Text style={styles.changeButtonText}>
                        Change
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#64748b', textAlign: 'center' }}>
                      Sermon list components temporarily unavailable.
                      {'\n'}Please ensure all required packages and components are installed.
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}

          {index === 1 && (
            <View style={{
              minHeight: DEVICE_HEIGHT - 250,
              padding: 16,
              backgroundColor: '#ffffff',
              borderRadius: 12,
              margin: 16,
              marginTop: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 3
            }}>
              {!selectedLanguage ? (
                <>
                  <Text style={styles.sectionTitle}>
                    Select a Language First
                  </Text>
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#64748b', textAlign: 'center' }}>
                      Language selector component temporarily unavailable.
                      {'\n'}Please ensure all required packages are installed.
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                      <Ionicons name="search" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search for sermons..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.searchButton}
                      onPress={handleSearch}
                    >
                      <Text style={styles.searchButtonText}>Search</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#64748b', textAlign: 'center' }}>
                      Sermon list components temporarily unavailable.
                      {'\n'}Please ensure all required packages and components are installed.
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}

          {index === 2 && (
            <View style={{
              minHeight: DEVICE_HEIGHT - 250,
              padding: 16,
              backgroundColor: '#ffffff',
              borderRadius: 12,
              margin: 16,
              marginTop: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 3
            }}>
              <Text style={styles.sectionTitle}>
                Your Favorites
              </Text>

              {favorites.length === 0 ? (
                <View style={styles.emptyContainerBase}>
                  <Ionicons name="heart-outline" size={60} color="#d1d5db" />
                  <Text style={styles.emptyTextBase}>
                    You haven't added any sermons to your favorites yet.
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => setIndex(0)}
                  >
                    <Text style={styles.retryButtonText}>
                      Browse Sermons
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#64748b', textAlign: 'center' }}>
                    Sermon list components temporarily unavailable.
                    {'\n'}Please ensure all required packages and components are installed.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Filter modal */}
      <FilterModal />

      {/* Main Player Modal - Component temporarily unavailable */}
      {isMainPlayerVisible && (
        <View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.8)', 
          justifyContent: 'center', 
          alignItems: 'center',
          zIndex: 1000 
        }}>
          <View style={{ backgroundColor: '#1e293b', padding: 20, borderRadius: 10, margin: 20 }}>
            <Text style={{ color: '#fff', fontSize: 18, marginBottom: 10 }}>
              Main Player Component Unavailable
            </Text>
            <Text style={{ color: '#64748b', marginBottom: 20 }}>
              The audio player component is temporarily unavailable.
              {'\n'}Please ensure all required packages are installed.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#0ea5e9', padding: 10, borderRadius: 5, alignItems: 'center' }}
              onPress={() => {
                setIsMainPlayerVisible(false);
                if (currentSermon) {
                  setShowMiniPlayer(true);
                }
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// Wrap SermonLibrary with AudioProvider to make useAudio hook available
const SermonLibraryWithAudio = () => {
  // PlayBottomSheet component temporarily unavailable
  // Commenting out ref and present function
  // const playBottomSheetRef = useRef<any>(null);

  // Function to present the PlayBottomSheet with a sermon
  const presentPlayBottomSheet = useCallback((sermon: any) => {
    console.log('[SermonLibraryWithAudio] presentPlayBottomSheet called with sermon:', sermon?.title);
    console.log('[SermonLibraryWithAudio] PlayBottomSheet component is temporarily unavailable');
    // if (playBottomSheetRef.current) {
    //   playBottomSheetRef.current.present(sermon);
    // }
  }, []);

  return (
    <AudioProvider>
      <SermonLibrary presentPlayBottomSheet={presentPlayBottomSheet} />
      
      {/* PlayBottomSheet - Component temporarily unavailable */}
      {/* <PlayBottomSheet
        ref={playBottomSheetRef}
        onOpenPDF={() => {
          // Handle opening PDF if needed
        }}
        onDismiss={() => {
          // Handle dismiss if needed
        }}
      /> */}
    </AudioProvider>
  );
};

export default SermonLibraryWithAudio;
