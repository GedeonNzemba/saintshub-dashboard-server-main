import React, { useRef, useState } from "react";
import {
  StyleSheet,
  Image,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from 'react-native-screens/lib/typescript/native-stack/types';

type RootStackParamList = {
  Eagle: undefined;
  Agapo: undefined;
  Documents: undefined;
  Bible: undefined;
};

export type StackNavigation = NativeStackNavigationProp<RootStackParamList>;

type ImageItem = {
  navigate: keyof RootStackParamList;
  banner: string;
  title: string;
  description: string;
};

const BannerWidth = Dimensions.get("window").width - 24; // Total screen width minus 24
const BannerHeight = 200;

const images: ImageItem[] = [
  {
    navigate: 'Eagle',
    banner: "https://res.cloudinary.com/locataire/image/upload/v1691177128/eagle_slice_gs4ifg.png",
    title: "Eagle Ministry",
    description: "Discover the power of prophetic ministry"
  },
  {
    navigate: 'Agapo',
    banner: "https://res.cloudinary.com/locataire/image/upload/v1691176419/agapo_slide_dyx79x.png",
    title: "Agapo Love",
    description: "Experience God's unconditional love"
  },
  {
    navigate: 'Documents',
    banner: "https://res.cloudinary.com/locataire/image/upload/v1691177128/docs_slice_tex7xz.png",
    title: "Documents",
    description: "Access important documents"
  },
  {
    navigate: 'Bible',
    banner: "https://res.cloudinary.com/locataire/image/upload/v1691177128/bible_slice_poes2m.png",
    title: "Bible",
    description: "Read the Bible"
  },
];

const SliderCard = () => {
  const navigation = useNavigation<StackNavigation>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const getContainerStyle = (index: number) => {
    const styles = [
      {
        backgroundColor: 'rgba(147, 51, 234, 0.85)',  // Vibrant Purple
        borderColor: 'rgba(216, 180, 254, 0.5)',
      },
      {
        backgroundColor: 'rgba(6, 182, 212, 0.85)',   // Bright Cyan
        borderColor: 'rgba(103, 232, 249, 0.5)',
      },
      {
        backgroundColor: 'rgba(16, 185, 129, 0.85)',  // Rich Emerald
        borderColor: 'rgba(110, 231, 183, 0.5)',
      },
      {
        backgroundColor: 'rgba(245, 158, 11, 0.85)',  // Warm Amber
        borderColor: 'rgba(252, 211, 77, 0.5)',
      },
      {
        backgroundColor: 'rgba(99, 102, 241, 0.85)',  // Indigo
        borderColor: 'rgba(165, 180, 252, 0.5)',
      }
    ];
    return styles[index % styles.length];
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (scrollViewRef.current) {
        const nextIndex = (currentIndex + 1) % images.length;
        scrollViewRef.current.scrollTo({
          x: nextIndex * BannerWidth,
          animated: true
        });
        setCurrentIndex(nextIndex);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <View style={styles.clipContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / BannerWidth);
              setCurrentIndex(newIndex);
            }}
            contentContainerStyle={styles.scrollViewContent}
            style={styles.scrollView}
          >
            {images.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => navigation.navigate(item.navigate)}
                style={styles.slide}
                activeOpacity={0.95}
              >
                <Image 
                  source={{ uri: item.banner }} 
                  style={styles.image}
                  resizeMode="contain"
                />
                <View style={[
                  styles.contentOverlay,
                  index % 2 === 0 ? styles.contentLeft : styles.contentRight
                ]}>
                  <View style={[
                    styles.contentContainer,
                    getContainerStyle(index)
                  ]}>
                    <View style={styles.textContainer}>
                      <Text style={[
                        styles.title,
                        index % 2 === 0 ? styles.textLeft : styles.textRight
                      ]}>{item.title}</Text>
                      <Text style={[
                        styles.description,
                        index % 2 === 0 ? styles.textLeft : styles.textRight
                      ]} numberOfLines={1}>{item.description}</Text>
                    </View>
                    <TouchableOpacity 
                      style={[
                        styles.button,
                        index % 2 === 0 ? styles.contentLeft : styles.contentRight
                      ]}
                      onPress={() => navigation.navigate(item.navigate)}
                    >
                      <Text style={styles.buttonText}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                currentIndex === index && styles.paginationDotActive
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default SliderCard;

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    marginVertical: 12,
    overflow: 'hidden',
  },
  container: {
    width: BannerWidth,
    alignSelf: 'center',
    ...Platform.select({
        ios: {
            shadowColor: "#1e293b",
            shadowOffset: {
                width: 0,
                height: 6,
            },
            shadowOpacity: 0.25,
            shadowRadius: 8,
        },
        android: {
            elevation: 0,
        }
    }),
    borderWidth: 0,
},
  clipContainer: {
    overflow: 'hidden',
    width: BannerWidth,
  },
  scrollView: {
    width: BannerWidth,
  },
  scrollViewContent: {
    alignItems: 'center',
  },
  slide: {
    width: BannerWidth,
    height: BannerHeight,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 24,
    width: '70%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    width: '100%',
  },
  textContainer: {
    flex: 0.7,
    marginRight: 12,
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    marginBottom: 3,
  },
  description: {
    color: '#ffffff',
    fontSize: 13,
    opacity: 0.95,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  button: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: 80,
    alignItems: 'center',
    flexShrink: 0,
  },
  buttonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    letterSpacing: 0.5,
  },
  contentLeft: {
    left: 16,
  },
  contentRight: {
    right: 16,
  },
  textLeft: {
    textAlign: 'left',
  },
  textRight: {
    textAlign: 'right',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    gap: Platform.select({
      ios: 8,
      android: 8,
    }),
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
    marginHorizontal: Platform.select({
      ios: 4,
      android: 4,
    }),
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: '#000000',
  }
});
