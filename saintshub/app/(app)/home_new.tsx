import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RootState } from '@/app/_layout';
import { setLoading } from '@/hooks/redux/loader/Loader';
import { openDrawer } from '@/hooks/redux/drawer/mainDrawer';
import LoaderB from '@/components/loaders/LoaderB';
import VerseOfTheDay from '@/components/sections/DayVerse';
import QuoteOfTheDay from '@/components-app/quotes/quoteOfTheDay';
import DailyBread from '@/components-app/quotes/dailyBread';

const { width: windowWidth } = Dimensions.get('window');

interface QuickActionCard {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
  iconSet: 'ionicons' | 'material';
  colors: [string, string, ...string[]];
  route: string;
}

const Home = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  
  const [refreshing, setRefreshing] = useState(false);
  
  // Redux state
  const { loading } = useSelector((state: RootState) => state.reducer.loading);
  const userData = useSelector((state: RootState) => state.reducer.updateUserData);
  const { name, surname, avatar } = userData;

  const quickActions: QuickActionCard[] = [
    {
      id: '1',
      title: 'Bible',
      icon: 'book',
      iconSet: 'ionicons',
      colors: ['#3b82f6', '#1d4ed8'],
      route: '/(bible)/audibleBible',
    },
    {
      id: '2',
      title: 'Sermons',
      icon: 'headset',
      iconSet: 'material',
      colors: ['#8b5cf6', '#6d28d9'],
      route: '/sermon-new',
    },
    {
      id: '3',
      title: 'Music',
      icon: 'musical-notes',
      iconSet: 'ionicons',
      colors: ['#ec4899', '#be185d'],
      route: '/music',
    },
    {
      id: '4',
      title: 'Live Stream',
      icon: 'play-circle',
      iconSet: 'ionicons',
      colors: ['#f59e0b', '#d97706'],
      route: '/(live)/stream',
    },
    {
      id: '5',
      title: 'Videos',
      icon: 'videocam',
      iconSet: 'ionicons',
      colors: ['#10b981', '#059669'],
      route: '/(media)/videos',
    },
    {
      id: '6',
      title: 'Gallery',
      icon: 'images',
      iconSet: 'ionicons',
      colors: ['#06b6d4', '#0891b2'],
      route: '/(media)/gallery',
    },
  ];

  useEffect(() => {
    if (!userData || !Object.keys(userData).length) {
      dispatch(setLoading(true));
    } else {
      dispatch(setLoading(false));
    }
  }, [userData, dispatch]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const handleDrawerOpen = () => {
    dispatch(openDrawer());
  };

  const handleCardPress = (route: string) => {
    router.push(route as any);
  };

  const getInitials = () => {
    if (name && surname) {
      return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
    }
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Loader */}
      {loading && (
        <View style={styles.loaderOverlay}>
          <LoaderB />
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={handleDrawerOpen}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={28} color="#030303" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Saint's Hub</Text>
          <Text style={styles.headerSubtitle}>Welcome back!</Text>
        </View>

        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => router.push('/(app)/profile' as any)}
          activeOpacity={0.7}
        >
          {avatar?.url ? (
            <Image source={{ uri: avatar.url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>
            Hello, {name || 'Friend'} 👋
          </Text>
          <Text style={styles.greetingSubtext}>
            How can we bless you today?
          </Text>
        </View>

        {/* Daily Verse */}
        <View style={styles.sectionContainer}>
          <VerseOfTheDay />
        </View>

        {/* Quote of the Day */}
        <View style={styles.sectionContainer}>
          <QuoteOfTheDay />
        </View>

        {/* Daily Bread */}
        <View style={styles.sectionContainer}>
          <DailyBread />
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => handleCardPress(action.route)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={action.colors}
                  style={styles.actionCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.actionIconContainer}>
                    {action.iconSet === 'ionicons' ? (
                      <Ionicons
                        name={action.icon as any}
                        size={32}
                        color="#fff"
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={action.icon as any}
                        size={32}
                        color="#fff"
                      />
                    )}
                  </View>
                  <Text style={styles.actionCardTitle}>{action.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'RobotoBold',
    color: '#030303',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'RobotoRegular',
    color: '#64748b',
    marginTop: 2,
  },
  avatarButton: {
    width: 44,
    height: 44,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#030303',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'RobotoBold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  greetingSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  greetingText: {
    fontSize: 28,
    fontFamily: 'RobotoBlack',
    color: '#030303',
    marginBottom: 4,
  },
  greetingSubtext: {
    fontSize: 16,
    fontFamily: 'RobotoRegular',
    color: '#64748b',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'RobotoBold',
    color: '#030303',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  actionCard: {
    width: (windowWidth - 48) / 2,
    padding: 8,
  },
  actionCardGradient: {
    borderRadius: 16,
    padding: 20,
    minHeight: 140,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardTitle: {
    fontSize: 16,
    fontFamily: 'RobotoBold',
    color: '#fff',
    marginTop: 12,
    letterSpacing: 0.5,
  },
});
