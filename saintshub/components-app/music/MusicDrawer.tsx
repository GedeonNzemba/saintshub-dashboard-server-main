import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Text,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.85;

interface MusicDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  downloadedTracks: Set<string>;
  favoriteTrackKeys: Set<string>;
  onTrackSelect?: (track: string) => void;
  onTrackDelete?: (track: string) => void;
  onFavoriteRemove?: (track: string) => void;
}

const MusicDrawer = ({ 
  isOpen, 
  onClose, 
  downloadedTracks,
  favoriteTrackKeys,
  onTrackSelect,
  onTrackDelete,
  onFavoriteRemove
}: MusicDrawerProps) => {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [downloadExpanded, setDownloadExpanded] = useState(true);
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View style={[styles.backdropOverlay, { opacity: fadeAnim }]} />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#3B3B87', '#4B3B87', '#5F3B87']}
          start={{ x: 0.0, y: 0.0 }}
          end={{ x: 0.0, y: 1.0 }}
          style={StyleSheet.absoluteFill}
        />
        
        <SafeAreaView style={styles.drawerContent}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Your Library</Text>
              <Text style={styles.headerSubtitle}>
                {downloadedTracks.size + favoriteTrackKeys.size} tracks
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionContainer}>
              <TouchableOpacity 
                style={styles.sectionHeader}
                onPress={() => setDownloadExpanded(!downloadExpanded)}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="cloud-download" size={24} color="#FFFFFF" />
                  <Text style={styles.sectionTitle}>Downloads</Text>
                </View>
                <View style={styles.sectionHeaderRight}>
                  <Text style={styles.sectionCount}>{downloadedTracks.size}</Text>
                  <Animated.View style={{
                    transform: [{
                      rotate: downloadExpanded ? '0deg' : '-90deg'
                    }]
                  }}>
                    <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
                  </Animated.View>
                </View>
              </TouchableOpacity>

              {downloadExpanded && (
                <View style={styles.sectionContent}>
                  {Array.from(downloadedTracks).map((track) => (
                    <View key={track} style={styles.trackItem}>
                      <Ionicons name="musical-note" size={20} color="#FFFFFF" style={styles.trackIcon} />
                      <Text style={styles.trackTitle} numberOfLines={1}>{track}</Text>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => onTrackDelete?.(track)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.sectionContainer}>
              <TouchableOpacity 
                style={styles.sectionHeader}
                onPress={() => setFavoritesExpanded(!favoritesExpanded)}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="heart" size={24} color="#FFFFFF" />
                  <Text style={styles.sectionTitle}>Favorites</Text>
                </View>
                <View style={styles.sectionHeaderRight}>
                  <Text style={styles.sectionCount}>{favoriteTrackKeys.size}</Text>
                  <Animated.View style={{
                    transform: [{
                      rotate: favoritesExpanded ? '0deg' : '-90deg'
                    }]
                  }}>
                    <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
                  </Animated.View>
                </View>
              </TouchableOpacity>

              {favoritesExpanded && (
                <View style={styles.sectionContent}>
                  {Array.from(favoriteTrackKeys).map((track) => (
                    <View key={track} style={styles.trackItem}>
                      <Ionicons name="musical-note" size={20} color="#FFFFFF" style={styles.trackIcon} />
                      <Text style={styles.trackTitle} numberOfLines={1}>{track}</Text>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => onFavoriteRemove?.(track)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#3B3B87',
  },
  drawerContent: {
    flex: 1,
    paddingTop: Dimensions.get('window').height < 600 ? 20 : 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  sectionCount: {
    fontSize: 18,
    color: '#FFFFFF',
    marginRight: 8,
  },
  sectionContent: {
    marginTop: 8,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  trackIcon: {
    marginRight: 12,
    opacity: 0.8,
  },
  trackTitle: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 12,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MusicDrawer;
