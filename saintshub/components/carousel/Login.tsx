import * as React from 'react';
import { Dimensions, Image, StyleSheet, Text, View, ImageSourcePropType } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

interface ImageItem {
    source: ImageSourcePropType;
}

function LoginCarousel() {
    const images: ImageItem[] = [
        {source: require('../../assets/images/loginBg1.jpg')},
        {source: require('./../../assets/images/loginBg2.jpeg')},
        {source: require('./../../assets/images/loginBg3.jpeg')}
        // Add more images here
      ];

    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;
    
    // Use fixed, whole numbers for dimensions
    const carouselWidth = Math.floor(windowWidth);
    const carouselHeight = Math.floor(windowHeight * 0.35); // 35% of screen height

    return (
        <View style={styles.loginImage}>
            <Carousel
                loop
                width={carouselWidth}
                height={carouselHeight}
                autoPlay={true}
                data={images}
                scrollAnimationDuration={1000}
                autoPlayInterval={3000}
                renderItem={({ item }: { item: ImageItem }) => (
                    <View style={styles.carouselItem}>
                      <Image 
                        source={item.source} 
                        style={styles.carouselImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}
            />
        </View>
    );
}

export default LoginCarousel;

const styles = StyleSheet.create({
    loginImage: {
        flex: 1,
        width: "100%",
        height: "100%",
        borderBottomLeftRadius: 125,
        borderBottomRightRadius: 125,
        overflow: 'hidden',
        zIndex: 9
    },
    carouselItem: {
        flex: 1,
        justifyContent: 'center',
        opacity: 0.8,
    },
    carouselImage: {
        width: '100%',
        height: '100%',
    }
  });