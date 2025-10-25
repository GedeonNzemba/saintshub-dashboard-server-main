import { FlatList, ImageBackground, Pressable, Text, View, TouchableOpacity, ActivityIndicator, Animated, StyleSheet } from "react-native";
import React, { useEffect, useRef } from "react";
import { CHURCH_DB } from "../../utilities/tools";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAllChurch } from "../../tools/dashboard/getAllChurch";
import { liveModal } from "../../hooks/redux/liveModal";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface LiveProps {
  live: {
    title: string;
    preacher: string;
    sermon: string
  }[]
  churchImage: string
  churchName: string
}

const LiveIndicator = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.3,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, []);

  return (
    <View style={styles.liveIndicatorContainer}>
      <Animated.View
        style={[
          styles.liveDot,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
};

const LiveItem = ({ live, churchImage, churchName }: LiveProps) => {
  const dispatch = useDispatch();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleClick = () => {
    dispatch(
      liveModal({
        modalVisible: true,
        churchName: churchName,
        live: live
      })
    );
  };

  return (
    <Animated.View
      style={[
        styles.itemContainer,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handleClick}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.touchable}
      >
        <ImageBackground
          source={{ uri: churchImage }}
          resizeMode="cover"
          style={styles.backgroundImage}
          imageStyle={styles.backgroundImageStyle}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
            style={styles.overlay}
          >
            <View style={styles.contentContainer}>
              <LiveIndicator />
              
              <BlurView intensity={30} style={styles.churchInfoContainer}>
                <Text style={styles.churchName}>{churchName}</Text>
                {live[0] && (
                  <Text style={styles.sermonTitle} numberOfLines={2}>
                    {live[0].sermon}
                  </Text>
                )}
                <View style={styles.viewerInfo}>
                  <MaterialIcons name="people" size={16} color="#fff" />
                  <Text style={styles.viewerCount}>2.5K watching</Text>
                  <View style={styles.duration}>
                    <MaterialIcons name="schedule" size={14} color="#fff" />
                    <Text style={styles.durationText}>1:30:00</Text>
                  </View>
                </View>
              </BlurView>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
};

const EmptyState = () => (
  <View style={styles.emptyState}>
    <MaterialIcons name="church" size={48} color="#666" />
    <Text style={styles.emptyStateText}>No live services at the moment</Text>
    <Text style={styles.emptyStateSubtext}>Check back later for live streams</Text>
  </View>
);

const LatestLive = () => {
  const [formData, setFormData] = React.useState<CHURCH_DB[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const handleGetChurches = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("NO_TOKEN_FOUND");
        return;
      }
      const data = await getAllChurch(token);
      setFormData(data);
    } catch (error) {
      console.error("Failed to fetch churches:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    handleGetChurches();
  };

  useEffect(() => {
    handleGetChurches();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading live services...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>Live Now</Text>
          <View style={styles.churchCount}>
            <Text style={styles.churchCountText}>{formData.length}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>See All</Text>
          <MaterialIcons name="arrow-forward-ios" size={14} color="#666" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={formData}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <LiveItem
            live={item.liveServices}
            churchImage={item.logo}
            churchName={item.name}
          />
        )}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={EmptyState}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    </View>
  );
};

export default LatestLive;

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 8,
  },
  churchCount: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  churchCountText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '600',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  seeAllText: {
    color: '#666',
    fontSize: 14,
    marginRight: 4,
  },
  listContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  itemContainer: {
    width: 320,
    height: 220,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    backgroundColor: '#fff',
  },
  touchable: {
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    borderRadius: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  liveIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  churchInfoContainer: {
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  churchName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sermonTitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 8,
  },
  viewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewerCount: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    marginRight: 12,
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 320,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});
