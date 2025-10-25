import { StyleSheet, View, Text, Image, Animated, TouchableOpacity, Dimensions, Share, ActivityIndicator } from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Modalize } from 'react-native-modalize';
import { Portal } from 'react-native-portalize';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ViewShot from "react-native-view-shot";
import loaderGif from "../../assets/animated/loader/bouncy-hourglass-and-loading.gif";
import errorGif from "../../assets/animated/loader/sammy-line-no-connection.gif";
import { windowWidth } from "@/utilities/types";
// import LinearGradient from 'react-native-linear-gradient';

interface DailyVerse {
  verseDate: string;
  verseImage: string;
  verseText: string;
  referenceText: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VerseOfTheDay = () => {
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const modalizeRef = useRef<Modalize>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);

  const onOpen = () => {
    modalizeRef.current?.open();
  };

  const onShare = async () => {
    try {
      if (!verse || !viewShotRef.current) return;
      
      setSharing(true);
      
      const uri = await viewShotRef.current.capture();
      
      const result = await Share.share({
        message: `${verse.verseText}\n${verse.referenceText}\nShared from SaintsHub`,
        url: uri,
        title: 'Daily Verse',
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('shared with activity type');
        } else {
          console.log('shared');
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSharing(false);
    }
  };

  useEffect(() => {
    const fetchVerse = async () => {
      try {
        const response = await fetch("https://saintshub-bible-api.onrender.com/api/daily-verse");
        if (!response.ok) throw new Error("Failed to fetch verse");
        const data = await response.json();
        
        // Transform the image URL if it's a relative path
        const transformedData = {
          ...data,
          verseImage: data.verseImage.startsWith('/')
            ? `https://www.bible.com${data.verseImage}`
            : data.verseImage
        };
        
        setVerse(transformedData);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchVerse();
  }, [fadeAnim]);

  const renderContent = () => {
    return (
      <View style={styles.modalContent}>
        <ViewShot
          ref={viewShotRef}
          options={{
            format: "jpg",
            quality: 0.9,
            result: "data-uri"
          }}
        >
          <View style={styles.shareCard}>
            <Image
              source={{ uri: verse?.verseImage }}
              style={styles.modalImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.8)"]}
              style={styles.modalGradient}
            />
            <View style={styles.modalTextContent}>
              <Text style={styles.modalDate}>{verse?.verseDate}</Text>
              <Text style={styles.modalVerse}>{verse?.verseText}</Text>
              <Text style={styles.modalReference}>{verse?.referenceText}</Text>
              <View style={styles.watermark}>
                <MaterialCommunityIcons name="church" size={20} color="#ffffff" />
                <Text style={styles.watermarkText}>SaintsHub</Text>
              </View>
            </View>
          </View>
        </ViewShot>
        <View style={styles.modalDivider} />
        <TouchableOpacity 
          style={[
            styles.shareButton,
            sharing && styles.shareButtonDisabled
          ]} 
          onPress={onShare}
          disabled={sharing}
        >
          {sharing ? (
            <ActivityIndicator color="#6366f1" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="share-variant" size={24} color="#6366f1" />
              <Text style={styles.shareButtonText}>Share Verse</Text>
            </>
          )}
        </TouchableOpacity>
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
      <>
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <View style={styles.imageContainer}>
            <Image 
              source={errorGif} 
              style={styles.errorGif}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.errorText}>Failed to load daily verse</Text>
        <Text style={styles.errorSubText}>Please check your connection and try again</Text>
        </View>
      </View>
      </>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {verse && (
          <TouchableOpacity 
            activeOpacity={0.95} 
            onPress={onOpen}
            style={styles.touchableContainer}
          >
            <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
              <Image
                source={{ uri: verse.verseImage }}
                style={styles.backgroundImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={[
                  "rgba(0,0,0,0)",
                  "rgba(0,0,0,0.5)",
                  "rgba(0,0,0,0.85)",
                  "rgba(0,0,0,0.95)"
                ]}
                style={styles.gradient}
              >
                <BlurView intensity={25} tint="dark" style={styles.blurContainer}>
                  <View style={styles.content}>
                    <View style={styles.header}>
                      <Text style={styles.date}>{verse.verseDate}</Text>
                      <View style={styles.badge}>
                        <Text style={styles.dailyVerseLabel}>Daily Verse</Text>
                      </View>
                    </View>
                    <Text style={styles.verseText}>{verse.verseText}</Text>
                    <Text style={styles.referenceText}>{verse.referenceText}</Text>
                  </View>
                </BlurView>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>

      <Portal>
        <Modalize
          ref={modalizeRef}
          modalHeight={700}
          modalStyle={styles.modalContainer}
          overlayStyle={styles.overlay}
          handleStyle={styles.modalHandle}
          handlePosition="inside"
          scrollViewProps={{
            showsVerticalScrollIndicator: false,
          }}
        >
          {renderContent()}
        </Modalize>
      </Portal>
    </>
  );
};

export default VerseOfTheDay;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  touchableContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1f2937',
    minHeight: 400,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blurContainer: {
    padding: 24,
  },
  content: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#e2e8f0',
    fontFamily: 'RobotoMedium',
    letterSpacing: 0.5,
    opacity: 0.9,
  },
  badge: {
    backgroundColor: '#6366f120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6366f140',
  },
  dailyVerseLabel: {
    fontSize: 12,
    color: '#818cf8',
    fontFamily: 'RobotoMedium',
    letterSpacing: 0.5,
  },
  verseText: {
    fontSize: 20,
    lineHeight: 30,
    color: '#ffffff',
    fontFamily: 'RobotoMedium',
    letterSpacing: 0.3,
  },
  referenceText: {
    fontSize: 15,
    color: '#94a3b8',
    fontFamily: 'RobotoMedium',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  // Modal Styles
  modalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  modalHandle: {
    backgroundColor: "#ffffff",
    width: 40,
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: 400,
  },
  modalGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
  },
  modalTextContent: {
    padding: 24,
    paddingTop: 32,
  },
  modalDate: {
    fontSize: 14,
    color: "#6b7280",
    fontFamily: "RobotoMedium",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  modalVerse: {
    fontSize: 28,
    lineHeight: 38,
    color: "#111827",
    fontFamily: "RobotoBlack",
    marginBottom: 12,
  },
  modalReference: {
    fontSize: 18,
    color: "#4b5563",
    fontFamily: "RobotoMedium",
    marginBottom: 24,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 24,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonDisabled: {
    opacity: 0.7,
  },
  shareButtonText: {
    fontSize: 16,
    color: "#6366f1",
    fontFamily: "RobotoMedium",
  },
  shareCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  watermark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  watermarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'RobotoMedium',
    opacity: 0.9,
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
    borderRadius: 20,
    padding: 24,
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 45,
  },
  loaderGif: {
    width: 80,
    height: 80,
  },
  errorGif: {
    width: 200,
    height: 150
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    letterSpacing: 0.3,
    //add fonts
    fontFamily: 'RobotoMedium',
  },
  errorContainer: {
    height: 450,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    borderRadius: 24,
    padding: 24,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 18,
    fontFamily: "RobotoMedium",
    marginBottom: 8,
  },
  errorSubText: {
    color: "#ef4444",
    fontSize: 14,
    fontFamily: "RobotoRegular",
    opacity: 0.8,
  },
  gradiente: {
    flex: 1,
  },
  overlaye: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
});
