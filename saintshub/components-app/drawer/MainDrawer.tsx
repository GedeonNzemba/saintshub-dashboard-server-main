import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  Text,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { closeDrawer } from '../../../../hooks/redux/drawer/mainDrawer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { RootState } from '@/app/_layout';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.85;

const MainDrawer = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { drawer } = useSelector((state: RootState) => state.reducer.mainDrawer);

  useEffect(() => {
    if (drawer) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.5,
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
  }, [drawer]);

  const handleClose = () => {
    dispatch(closeDrawer());
  };

  const menuItems = [
    { 
      icon: 'cloud-download-outline', 
      label: 'Downloads', 
      subtext: 'No downloaded tracks yet',
      route: '/downloads' 
    },
    { 
      icon: 'list', 
      label: 'Playlists', 
      subtext: 'Create and manage playlists',
      route: '/playlists' 
    },
    { 
      icon: 'heart', 
      label: 'Favorites', 
      subtext: 'Your favorite tracks',
      route: '/favorites' 
    },
  ];

  const navigateTo = (route: string) => {
    router.push(route);
    handleClose();
  };

  if (!drawer) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
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
          colors={['#ffffff', '#f8f9fa']}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Library</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => navigateTo(item.route)}
                >
                  <Ionicons name={item.icon} size={24} color="#333" />
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemText}>{item.label}</Text>
                    <Text style={styles.menuItemSubtext}>{item.subtext}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  menuItemContent: {
    marginLeft: 16,
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  menuItemSubtext: {
    fontSize: 13,
    color: '#666',
  },
});

export default MainDrawer;
