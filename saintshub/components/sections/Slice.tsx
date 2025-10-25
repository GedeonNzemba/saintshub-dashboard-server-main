import React, { useState, useEffect } from "react";
import { View, Image, Text, Dimensions, StyleSheet, TouchableOpacity, Alert } from "react-native";
import DetachModal from "../recycle/modals/DetachedModal";
import { useDispatch } from "react-redux";
import { updateSheet, updateSheetContent } from "../../hooks/redux/detachedBottomSheet";

const { width } = Dimensions.get("window");

interface Slide {
  image: string;
  title: string;
  phrase: string;
}

interface ImageSliderProps {
  slides: {
    image: string;
    headerText_primary: string;
    headerText_secondary: string;
    bodyText_one: string;
    bodyText_two: string;
    bodyText_three?: string;
    bodyText_four?: string;
    bodyText_five?: string;
    sub_image?: string;
    multipleContent?: string[];
  }[];
  autoplayInterval?: number;
}

const ImageSlider: React.FC<ImageSliderProps> = ({ slides, autoplayInterval = 3000 }) => {
  const dispatch = useDispatch();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [state, setState] = useState<{ image: string; headerText_primary: string; headerText_secondary: string; bodyText_one: string; bodyText_two: string; bodyText_three?: string; bodyText_four?: string; bodyText_five?: string }>({
    headerText_primary: "",
    headerText_secondary: "",
    bodyText_one: "",
    bodyText_two: "",
    bodyText_three: "",
    bodyText_four: "",
    bodyText_five: "",
    image: "",
  });

  const handlePaginationPress = (index: number) => {
    setCurrentIndex(index);
  };

  const handleImagePress = () => {
    const { headerText_primary, headerText_secondary, bodyText_one, bodyText_two, bodyText_three, bodyText_four, bodyText_five, image, sub_image, multipleContent } = slides[currentIndex];

    const data = slides[currentIndex];

    dispatch(updateSheet());

    dispatch(
      updateSheetContent({
        image: data.image,
        sub_image: data.sub_image,
        headerText_primary: data.headerText_primary,
        headerText_secondary: data.headerText_secondary,
        bodyText_one: data.bodyText_one,
        bodyText_two: data.bodyText_two,
        bodyText_three: data.bodyText_three,
        bodyText_four: data.bodyText_four,
        bodyText_five: data.bodyText_five,
        multipleContent: data.multipleContent,
      })
    );

    console.log(headerText_primary);
    console.log(headerText_secondary);
    console.log(bodyText_one);
    console.log(bodyText_five);

    // how to sestate with prevState
    setState(data);

    //Alert.alert(bodyText_one, bodyText_two);
  };

  // Show Modal
  const OpenModal = () => {
    return <View>{}</View>;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % slides.length;
      setCurrentIndex(nextIndex);
    }, autoplayInterval);

    return () => {
      clearInterval(interval);
    };
  }, [currentIndex, autoplayInterval, slides.length]);

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity onPress={handleImagePress}>
          <Image source={{ uri: slides[currentIndex].image }} style={styles.image} />
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{slides[currentIndex].headerText_primary}</Text>
          <Text style={styles.phrase}>{slides[currentIndex].headerText_secondary}</Text>
        </View>

        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <TouchableOpacity key={index} onPress={() => handlePaginationPress(index)} style={[styles.paginationDot, index === currentIndex && styles.paginationDotActive]} />
          ))}
        </View>
      </View>
      {/* <View style={{flex: 1, borderWidth: 2, borderColor: 'red'}}>
          <DetachModal
            headerText_primary={state.headerText_primary}
            headerText_secondary={state.headerText_secondary}
            bodyText_one={state.bodyText_one}
            bodyText_two={state.bodyText_two}
            bodyText_three={state.bodyText_three}
            bodyText_four={state.bodyText_four}
            bodyText_five={state.bodyText_five}
          />
      </View> */}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: width,
    height: 250,
    objectFit: "fill",
    resizeMode: "cover",
  },
  contentContainer: {
    position: "absolute",
    bottom: 20,
    paddingHorizontal: 20,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 10,
    width: width - 40,
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  phrase: {
    color: "white",
    fontSize: 16,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    marginHorizontal: 5,
  },
  paginationDotActive: {
    backgroundColor: "rgba(255, 255, 255, 1)",
  },
});

export default ImageSlider;
