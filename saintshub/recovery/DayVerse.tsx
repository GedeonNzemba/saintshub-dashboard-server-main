// PATH: saintshub\components\sections\DayVerse.tsx
import { StyleSheet, View, Text, Image, Animated, TouchableOpacity, Dimensions, Share, ActivityIndicator, Modal, ScrollView } from "react-native";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import ViewShot from "react-native-view-shot";
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import loaderGif from "../../assets/animated/loader/bouncy-hourglass-and-loading.gif";
import errorGif from "../../assets/animated/loader/sammy-line-no-connection.gif";
import { windowWidth } from "@/utilities/types";
import { DAILY_SCRIPTURE_AND_QUOTE_URI } from "@/utilities/tools";
import * as FileSystem from 'expo-file-system';

// Updated interface to match the new API response structure
interface DailyVerse {
  reference: string;
  text: string;
  imageUrls: string[];
  referenceFr: string;
  textFr: string;
  imageUrlsFr: string[];
  // We'll keep track of which image to display
  selectedImageIndex: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VerseOfTheDay = () => {
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'fr'>('en');
  const [retryCount, setRetryCount] = useState(0);
  const [showRetryBanner, setShowRetryBanner] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const panStateRef = useRef({ lastOffset: 0 });
  const [cacheBustedImageUrl, setCacheBustedImageUrl] = useState<string | null>(null);
  const [shareFormat, setShareFormat] = useState<'image' | 'text'>('image');
  const [shareProgress, setShareProgress] = useState(0);
  const prevImageUrlRef = useRef<string | null>(null);

  const onOpen = () => {
    setModalVisible(true);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'fr' : 'en');
    // Reset image error when language changes
    setImageError(false);
  };

  // Get the current verse data based on selected language
  const getCurrentVerseData = () => {
    if (!verse) return null;
    
    const isEnglish = language === 'en';
    const imageArray = isEnglish ? verse.imageUrls : verse.imageUrlsFr;
    const safeIndex = verse.selectedImageIndex < imageArray.length 
      ? verse.selectedImageIndex 
      : 0;
    
    return {
      reference: isEnglish ? verse.reference : verse.referenceFr,
      text: isEnglish ? verse.text : verse.textFr,
      imageUrl: imageArray[safeIndex],
      totalImages: imageArray.length,
      currentImageIndex: safeIndex
    };
  };

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
    
    // Try to cycle to next image if available
    if (verse) {
      const currentImages = language === 'en' ? verse.imageUrls : verse.imageUrlsFr;
      if (currentImages.length > 1) {
        const nextIndex = (verse.selectedImageIndex + 1) % currentImages.length;
        setVerse({
          ...verse,
          selectedImageIndex: nextIndex
        });
      }
    }
  };

  // Change to next image in the array
  const cycleImage = (direction: 'next' | 'prev' = 'next') => {
    if (!verse) return;
    
    const currentImages = language === 'en' ? verse.imageUrls : verse.imageUrlsFr;
    if (currentImages.length <= 1) return;
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (verse.selectedImageIndex + 1) % currentImages.length;
    } else {
      nextIndex = verse.selectedImageIndex === 0 
        ? currentImages.length - 1 
        : verse.selectedImageIndex - 1;
    }
    
    // Animate the slide transition
    const toValue = direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH;
    
    Animated.timing(translateX, {
      toValue: toValue,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setVerse({
        ...verse,
        selectedImageIndex: nextIndex
      });
      
      // Reset the animation position
      translateX.setValue(0);
      
      // Reset image error state when cycling
      setImageError(false);
    });
  };

  // Handle pan gesture for swiping
  const handlePanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  // Handle the end of a pan gesture to determine if it should change the image
  const handlePanStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;
      const threshold = SCREEN_WIDTH * 0.25; // 25% of screen width
      
      if (translationX > threshold) {
        // Swipe right - go to previous image
        cycleImage('prev');
      } else if (translationX < -threshold) {
        // Swipe left - go to next image
        cycleImage('next');
      } else {
        // Not enough swipe distance, reset position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  // Function to ensure image is properly loaded for sharing
  const prepareImageForSharing = useCallback(async (imageUrl: string) => {
    if (!imageUrl) return null;
    
    try {
      // If we've already processed this URL and it's in cache, return it
      if (prevImageUrlRef.current === imageUrl && cacheBustedImageUrl) {
        return cacheBustedImageUrl;
      }
      
      setShareProgress(10);
      
      // Add a cache busting parameter
      const cacheBustedUrl = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}cache=${Date.now()}`;
      
      // Try to download the image to local file system
      const localFilePath = `${FileSystem.cacheDirectory}share-image-${Date.now()}.jpg`;
      
      setShareProgress(30);
      
      // Download the image
      const downloadResult = await FileSystem.downloadAsync(cacheBustedUrl, localFilePath);
      
      setShareProgress(70);
      
      if (downloadResult.status !== 200) {
        console.error('Failed to download image:', downloadResult);
        // If download fails, return the original URL with cache busting
        setCacheBustedImageUrl(cacheBustedUrl);
        return cacheBustedUrl;
      }
      
      // If download succeeds, return the local file URL
      console.log('Image downloaded to:', localFilePath);
      setCacheBustedImageUrl(localFilePath);
      prevImageUrlRef.current = imageUrl;
      
      setShareProgress(100);
      return localFilePath;
    } catch (error) {
      console.error('Error preparing image:', error);
      // Fallback to cache busted URL
      const fallbackUrl = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}cache=${Date.now()}`;
      setCacheBustedImageUrl(fallbackUrl);
      return fallbackUrl;
    }
  }, []);

  const onShare = async () => {
    try {
      const currentVerse = getCurrentVerseData();
      if (!verse || !currentVerse) return;
      
      setSharing(true);
      setShareProgress(0);
      
      // Create share text message
      const shareMessage = `${currentVerse.text}\n\n${currentVerse.reference}\n\nShared from SaintsHub`;
      
      // If sharing as text only, share directly
      if (shareFormat === 'text') {
        const result = await Share.share({
          message: shareMessage,
          title: 'Daily Verse',
        });
        
        if (result.action === Share.sharedAction) {
          console.log('Successfully shared text');
        }
        setSharing(false);
        return;
      }
      
      // Prepare image for ViewShot
      if (currentVerse.imageUrl) {
        await prepareImageForSharing(currentVerse.imageUrl);
      }
      
      // Add a delay to ensure the updated image is rendered
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (!viewShotRef.current) {
        console.error('ViewShot ref is null');
        setSharing(false);
        return;
      }
      
      setShareProgress(80);
      console.log('Capturing ViewShot...');
      
      try {
        const uri = await viewShotRef.current.capture?.();
        console.log('ViewShot capture result:', uri ? 'Success' : 'Failed');
        
        if (!uri) {
          throw new Error('Failed to capture image');
        }
        
        setShareProgress(90);
        
        const result = await Share.share({
          message: shareMessage,
          url: uri,
          title: 'Daily Verse',
        });
        
        if (result.action === Share.sharedAction) {
          console.log('Successfully shared with image');
        }
      } catch (captureError) {
        console.error('Error capturing or sharing:', captureError);
        
        // Fallback to text-only sharing if image sharing fails
        const textResult = await Share.share({
          message: shareMessage,
          title: 'Daily Verse',
        });
        
        if (textResult.action === Share.sharedAction) {
          console.log('Fallback to text sharing successful');
        }
      }
    } catch (error) {
      console.error('Error in share process:', error);
    } finally {
      setSharing(false);
      setShareProgress(0);
    }
  };

  const fetchVerse = useCallback(async (retry = false) => {
    try {
      if (!retry) {
        setLoading(true);
      }
      setError(null);
      setShowRetryBanner(false);
      setImageError(false);
      
      // Try both with and without trailing slash to handle URL formatting issues
      const baseUrl = DAILY_SCRIPTURE_AND_QUOTE_URI.endsWith('/') 
        ? DAILY_SCRIPTURE_AND_QUOTE_URI.slice(0, -1) 
        : DAILY_SCRIPTURE_AND_QUOTE_URI;
      
      // Using the new API endpoint that returns both languages
      const url = `${baseUrl}/api/v4/verse-of-the-day-combined`;
      
      console.log('Fetching verse from URL:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        // If we get a 404, try the alternative URL format
        if (response.status === 404 && retryCount < 3) {
          const alternativeUrl = DAILY_SCRIPTURE_AND_QUOTE_URI.endsWith('/') 
            ? DAILY_SCRIPTURE_AND_QUOTE_URI 
            : `${DAILY_SCRIPTURE_AND_QUOTE_URI}/`;
          
          console.log('Trying alternative URL:', `${alternativeUrl}api/v4/verse-of-the-day-combined`);
          const alternativeResponse = await fetch(`${alternativeUrl}api/v4/verse-of-the-day-combined`);
          
          if (!alternativeResponse.ok) {
            throw new Error(`HTTP error! status: ${alternativeResponse.status}`);
          }
          
          const data = await alternativeResponse.json();
          console.log('Verse data from alternative URL:', data);
          
          // Validate image URLs exist
          if (!data.imageUrls || !data.imageUrls.length) {
            throw new Error('No image URLs found in response');
          }
          
          // Randomly select an initial image index
          const randomImageIndex = Math.floor(Math.random() * data.imageUrls.length);
          
          setVerse({
            ...data,
            imageUrls: data.imageUrls || [],
            imageUrlsFr: data.imageUrlsFr || [],
            selectedImageIndex: randomImageIndex
          });
          
          setRetryCount(0); // Reset retry count on success
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }).start();
          return;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Verse data:', data);
      
      // Validate image URLs exist
      if (!data.imageUrls || !data.imageUrls.length) {
        throw new Error('No image URLs found in response');
      }
      
      // Randomly select an initial image index
      const randomImageIndex = Math.floor(Math.random() * data.imageUrls.length);
      
      setVerse({
        ...data,
        imageUrls: data.imageUrls || [],
        imageUrlsFr: data.imageUrlsFr || [],
        selectedImageIndex: randomImageIndex
      });
      
      setRetryCount(0); // Reset retry count on success
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error('Error fetching verse:', err);
      setError("Failed to load daily verse");
      setShowRetryBanner(true);
      
      // Auto-retry logic with exponential backoff
      if (retryCount < 3 && !retry) {
        setRetryCount(prev => prev + 1);
        const backoffTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
        setTimeout(() => fetchVerse(true), backoffTime);
      }
    } finally {
      setLoading(false);
    }
  }, [fadeAnim, retryCount]);
  
  const handleRetry = () => {
    setRetryCount(0);
    fetchVerse();
  };

  // Only fetch verse when component mounts, not on language change
  useEffect(() => {
    fetchVerse();
  }, [fetchVerse]);

  const renderContent = () => {
    const currentVerse = getCurrentVerseData();
    if (!currentVerse) return null;
    
    const today = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric'
    });
    
    // Create a shorter version of verse text for sharing if needed
    const shareText = currentVerse.text.length > 300 
      ? currentVerse.text.substring(0, 300) + '...' 
      : currentVerse.text;
    
    // Get the image URL to use (cached if available)
    const imageUrlToUse = cacheBustedImageUrl || currentVerse.imageUrl;
    
    return (
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Daily Verse</Text>
          <TouchableOpacity 
            style={styles.modalCloseButton} 
            onPress={() => setModalVisible(false)}
          >
            <MaterialCommunityIcons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
        
        {/* Image Card - Detached from text */}
        <View style={styles.imageCard}>
          <Image
            source={{ uri: currentVerse.imageUrl }}
            style={styles.modalImage}
            resizeMode="cover"
            onError={handleImageError}
          />
        </View>
        
        {/* Verse Text Card - Separate from image */}
        <View style={styles.verseCard}>
          <Text style={styles.modalDate}>{today}</Text>
          <Text style={styles.modalVerse}>{currentVerse.text}</Text>
          <Text style={styles.modalReference}>{currentVerse.reference}</Text>
        </View>
        
        <View style={styles.modalFooter}>
          {/* Share format toggle */}
          <View style={styles.shareFormatToggle}>
            <TouchableOpacity
              style={[
                styles.formatButton,
                shareFormat === 'image' && styles.activeFormatButton
              ]}
              onPress={() => setShareFormat('image')}
              disabled={sharing}
            >
              <FontAwesome name="image" size={16} color={shareFormat === 'image' ? "#9333ea" : "#64748b"} />
              <Text style={[
                styles.formatButtonText,
                shareFormat === 'image' && styles.activeFormatText
              ]}>Image</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.formatButton,
                shareFormat === 'text' && styles.activeFormatButton
              ]}
              onPress={() => setShareFormat('text')}
              disabled={sharing}
            >
              <FontAwesome name="file-text-o" size={16} color={shareFormat === 'text' ? "#9333ea" : "#64748b"} />
              <Text style={[
                styles.formatButtonText,
                shareFormat === 'text' && styles.activeFormatText
              ]}>Text Only</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.shareButton,
              sharing && styles.shareButtonDisabled
            ]} 
            onPress={onShare}
            disabled={sharing}
          >
            {sharing ? (
              <View style={styles.sharingProgress}>
                <ActivityIndicator color="#ffffff" size="small" />
                {shareProgress > 0 && (
                  <Text style={styles.progressText}>{shareProgress}%</Text>
                )}
              </View>
            ) : (
              <>
                <MaterialCommunityIcons 
                  name={shareFormat === 'image' ? "share-variant" : "text-box-outline"} 
                  size={22} 
                  color="#ffffff" 
                />
                <Text style={styles.shareButtonText}>
                  {shareFormat === 'image' ? 'Share with Image' : 'Share Text Only'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {/* ViewShot component for sharing - positioned off-screen */}
        <View style={styles.viewShotContainer}>
          <ViewShot
            ref={viewShotRef}
            options={{
              format: "jpg",
              quality: 0.9,
              result: "data-uri",
              width: 600,
              height: 800
            }}
          >
            <View style={styles.shareCard}>
              <Image
                source={{ uri: imageUrlToUse }}
                style={styles.shareImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.85)"]}
                style={styles.shareGradient}
              />
              <View style={styles.shareTextContent}>
                <Text style={styles.shareDate}>{today}</Text>
                <Text style={styles.shareVerse}>{shareText}</Text>
                <Text style={styles.shareReference}>{currentVerse.reference}</Text>
                <View style={styles.watermark}>
                  <MaterialCommunityIcons name="church" size={18} color="#ffffff" />
                  <Text style={styles.watermarkText}>SaintsHub</Text>
                </View>
              </View>
            </View>
          </ViewShot>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <View style={styles.imageContainer}>
            <Image 
              source={loaderGif} 
              style={styles.loaderGif}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.loadingText}>Loading verse</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.errorContainer}>
          <Image 
            source={errorGif} 
            style={styles.errorGif}
            resizeMode="contain"
          />
          <Text style={styles.errorText}>Connection Error</Text>
          <Text style={styles.errorSubText}>Failed to load daily verse</Text>
          
          {showRetryBanner && (
            <View style={styles.retryContainer}>
              <TouchableOpacity 
                onPress={handleRetry}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>
                  Retry Now
                </Text>
              </TouchableOpacity>
              <Text style={styles.retrySubText}>
                You can also try restarting the app if the issue persists.
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  const currentVerse = getCurrentVerseData();
  if (!currentVerse) return null;
  
  const today = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric'
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      {verse && (
        <TouchableOpacity 
          activeOpacity={0.95} 
          onPress={onOpen}
          style={styles.touchableContainer}
        >
          <View style={styles.card}>
            <PanGestureHandler
              onGestureEvent={handlePanGestureEvent}
              onHandlerStateChange={handlePanStateChange}
              enabled={currentVerse.totalImages > 1}
            >
              <Animated.View 
                style={[
                  styles.cardContent,
                  { transform: [{ translateX }] },
                  { opacity: fadeAnim }
                ]}
              >
                {/* Background Image */}
                <Image
                  source={{ uri: currentVerse.imageUrl }}
                  style={styles.backgroundImage}
                  resizeMode="cover"
                  onError={handleImageError}
                />
                
                {/* Gradient Overlay */}
                <LinearGradient
                  colors={[
                    "rgba(0,0,0,0)",
                    "rgba(0,0,0,0.4)",
                    "rgba(0,0,0,0.75)",
                    "rgba(0,0,0,0.92)"
                  ]}
                  style={styles.gradient}
                >
                  <BlurView intensity={15} tint="dark" style={styles.blurContainer}>
                    <View style={styles.content}>
                      <View style={styles.header}>
                        <Text style={styles.date}>{today}</Text>
                        <View style={styles.badge}>
                          <Text style={styles.dailyVerseLabel}>Daily Verse</Text>
                        </View>
                      </View>
                      <Text style={styles.verseText}>{currentVerse.text}</Text>
                      <Text style={styles.referenceText}>{currentVerse.reference}</Text>
                    </View>
                  </BlurView>
                </LinearGradient>
              </Animated.View>
            </PanGestureHandler>
            
            {/* Controls - Top */}
            <View style={styles.controlsTopContainer}>
              {/* Language toggle button */}
              <TouchableOpacity 
                style={styles.languageButton}
                onPress={toggleLanguage}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.languageText}>
                  {language === 'en' ? '🇫🇷' : '🇬🇧'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Navigation Controls - Side buttons for next/prev */}
            {currentVerse.totalImages > 1 && (
              <>
                {/* Left arrow */}
                <TouchableOpacity 
                  style={[styles.navButton, styles.leftNavButton]}
                  onPress={() => cycleImage('prev')}
                >
                  <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                
                {/* Right arrow */}
                <TouchableOpacity 
                  style={[styles.navButton, styles.rightNavButton]}
                  onPress={() => cycleImage('next')}
                >
                  <Ionicons name="chevron-forward" size={24} color="#fff" />
                </TouchableOpacity>
              </>
            )}

            {/* Pagination dots */}
            {currentVerse.totalImages > 1 && (
              <View style={styles.paginationContainer}>
                {Array.from({ length: currentVerse.totalImages }).map((_, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.paginationDotTouchable}
                    onPress={() => {
                      if (index !== currentVerse.currentImageIndex) {
                        const direction = index > currentVerse.currentImageIndex ? 'next' : 'prev';
                        setVerse({
                          ...verse,
                          selectedImageIndex: index
                        });
                      }
                    }}
                  >
                    <View 
                      style={[
                        styles.paginationDot,
                        index === currentVerse.currentImageIndex && styles.paginationDotActive
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {/* Swipe instruction hint - only show first time */}
            {currentVerse.totalImages > 1 && (
              <View style={styles.swipeHintContainer}>
                <Text style={styles.swipeHintText}>
                  <Ionicons name="hand-left" size={16} color="#fff" /> Swipe to see more images
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {renderContent()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
};

export default VerseOfTheDay;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  touchableContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    height: 290,
    position: 'relative',
  },
  cardContent: {
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    aspectRatio: 16/9,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blurContainer: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 50, // Increased to allow more space for the gradient effect
  },
  content: {
    flex: 1,
    gap: 8,
    justifyContent: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#ffffff',
    letterSpacing: 0.5,
    opacity: 0.9,
    fontFamily: 'RobotoMedium',
  },
  badge: {
    backgroundColor: 'rgba(147, 51, 234, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.4)',
  },
  dailyVerseLabel: {
    fontSize: 11,
    color: '#d8b4fe',
    fontFamily: 'RobotoMedium',
    letterSpacing: 0.5,
  },
  verseText: {
    fontSize: 18,
    lineHeight: 24,
    color: '#ffffff',
    fontFamily: 'RobotoMedium',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    maxHeight: 120, // Limit text height to prevent overflow
  },
  referenceText: {
    fontSize: 14,
    color: '#e9d5ff', // Slightly brighter purple for better visibility
    fontFamily: 'RobotoMedium',
    letterSpacing: 0.3,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  // Controls for top language
  controlsTopContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  languageButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  languageText: {
    fontSize: 16,
  },
  // Navigation buttons
  navButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    top: '50%',
    marginTop: -16,
    zIndex: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  leftNavButton: {
    left: 12,
  },
  rightNavButton: {
    right: 12,
  },
  // Pagination indicators
  paginationContainer: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 6,
    zIndex: 5,
  },
  paginationDotTouchable: {
    padding: 6, // Larger touch area
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  paginationDotActive: {
    width: 8,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  // Swipe hint
  swipeHintContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  swipeHintText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontFamily: 'RobotoMedium',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modalContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "#f8fafc",
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'RobotoBold',
    color: '#1e293b',
    letterSpacing: 0.5,
  },
  modalCloseButton: {
    backgroundColor: "#f1f5f9",
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  // Image card - separate from text
  imageCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    height: 240,
    backgroundColor: '#1e293b',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  // Verse card - separate from image
  verseCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalDate: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "RobotoMedium",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  modalVerse: {
    fontSize: 26,
    lineHeight: 36,
    color: "#1e293b",
    fontFamily: "RobotoBold",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  modalReference: {
    fontSize: 18,
    color: "#9333ea",
    fontFamily: "RobotoMedium",
    marginBottom: 4,
  },
  modalFooter: {
    marginTop: 10,
    gap: 16,
  },
  // Share format toggle
  shareFormatToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4,
  },
  formatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    backgroundColor: '#f1f5f9',
    gap: 6,
  },
  activeFormatButton: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.3)',
  },
  formatButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'RobotoMedium',
  },
  activeFormatText: {
    color: '#9333ea',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9333ea',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 10,
    width: '100%',
    shadowColor: '#9333ea',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  shareButtonDisabled: {
    opacity: 0.7,
  },
  shareButtonText: {
    fontSize: 16,
    color: "#ffffff",
    fontFamily: "RobotoMedium",
  },
  sharingProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'RobotoMedium',
  },
  // ViewShot container for sharing
  viewShotContainer: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    width: 600,
    height: 800,
    backgroundColor: '#1e293b',
    zIndex: -1
  },
  shareCard: {
    width: 600,
    height: 800,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
  },
  shareImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  shareGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  shareTextContent: {
    padding: 30,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
  },
  shareDate: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.95)",
    fontFamily: "RobotoMedium",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  shareVerse: {
    fontSize: 24,
    lineHeight: 32,
    color: "#ffffff",
    fontFamily: "RobotoBold",
    marginBottom: 16,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  shareReference: {
    fontSize: 18,
    color: "#e9d5ff",
    fontFamily: "RobotoBold",
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  watermark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignSelf: 'center',
  },
  watermarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'RobotoBold',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: windowWidth,
    marginHorizontal: 24,
    marginTop: 10,
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    width: '100%',
  },
  imageContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  loaderGif: {
    width: 70,
    height: 70,
  },
  errorGif: {
    width: 180,
    height: 130
  },
  loadingText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
    letterSpacing: 0.3,
    fontFamily: 'RobotoMedium',
  },
  errorContainer: {
    width: '100%',
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    borderRadius: 20,
    padding: 20,
    paddingVertical: 30,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 17,
    fontFamily: "RobotoMedium",
    marginBottom: 6,
    marginTop: 12,
  },
  errorSubText: {
    color: "#ef4444",
    fontSize: 13,
    fontFamily: "RobotoRegular",
    opacity: 0.8,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  retryContainer: {
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  retryButton: {
    backgroundColor: '#9333ea',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'RobotoMedium',
    textAlign: 'center',
  },
  retrySubText: {
    color: '#dc2626',
    fontSize: 12,
    fontFamily: 'RobotoRegular',
    textAlign: 'center',
    marginTop: 6,
    marginHorizontal: 16,
  },
});

