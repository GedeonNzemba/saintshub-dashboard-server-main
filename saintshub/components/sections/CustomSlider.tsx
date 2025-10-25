import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Text,
} from "react-native";

interface CarouselProps {
  imageUrls: string[];
  autoplayInterval?: number;
}

const Carousel: React.FC<CarouselProps> = ({
  imageUrls,
  autoplayInterval = 3000,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // console.log("IMAGES_URLS: ", JSON.stringify(imageUrls));

  useEffect(() => {
    if (autoplayInterval > 0) {
      const autoplayTimer = setInterval(() => {
        if (currentPage < imageUrls?.length - 1) {
          scrollToPage(currentPage + 1);
        } else {
          scrollToPage(0);
        }
      }, autoplayInterval);

      return () => {
        clearInterval(autoplayTimer);
      };
    }
  }, [autoplayInterval, currentPage, imageUrls?.length]);

  const scrollToPage = (index: number) => {
    setCurrentPage(index);
    scrollRef.current?.scrollTo({ x: index * windowWidth, animated: true });
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / windowWidth);
    setCurrentPage(page);
  };

  return (
    <View style={styles.container}>
      {/* <Text>Hello World</Text> */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {imageUrls &&
          imageUrls.map((imageUrl, index) => (
            <Image
              key={index}
              source={{ uri: imageUrl }}
              resizeMode="stretch"
              resizeMethod="resize"
              style={styles.image}
            />
          ))}
      </ScrollView>

      <View style={styles.pagination}>
        {imageUrls &&
          imageUrls.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationDot,
                index === currentPage && styles.activeDot,
              ]}
              onPress={() => scrollToPage(index)}
            />
          ))}
      </View>
    </View>
  );
};

const windowWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: windowWidth,
    height: "100%",
  },
  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: "gray",
  },
  activeDot: {
    backgroundColor: "black",
  },
});

export default Carousel;
