import React from "react";
import Carousel from "react-native-banner-carousel";
import {
  StyleSheet,
  Image,
  View,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigation } from "../../utilities/tools";

const BannerWidth = Dimensions.get("window").width;
const BannerHeight = 200;

const images = [
  {
    navigate: 'Eagle',
    banner: "https://res.cloudinary.com/locataire/image/upload/v1691177128/eagle_slice_gs4ifg.png"
  },
  {
    navigate: 'Agapo',
    banner: "https://res.cloudinary.com/locataire/image/upload/v1691176419/agapo_slide_dyx79x.png"
  },
  {
    navigate: 'Documents',
    banner: "https://res.cloudinary.com/locataire/image/upload/v1691177128/docs_slice_tex7xz.png"
  },
  {
    navigate: 'Bible',
    banner: "https://res.cloudinary.com/locataire/image/upload/v1691177128/bible_slice_poes2m.png"
  },
];

interface IProps {
  image: string;
  index: React.Key;
  onPress: () => void
}

const Item = ({ image, index, onPress }: IProps) => {
  return (
    <TouchableOpacity
      key={index}
      style={styles.imageContainer}
      onPress={onPress}
    >
      <View>
        <Image
          resizeMode="contain"
          style={{ width: BannerWidth, height: BannerHeight }}
          source={{ uri: image }}
        />
      </View>
    </TouchableOpacity>
  );
};

const Slider = () => {
  const navigation = useNavigation<StackNavigation>();

  return (
    <View style={styles.container}>
      <Carousel
        autoplay
        autoplayTimeout={5000}
        loop
        index={0}
        pageSize={BannerWidth}
        useNativeDriver={true}
        pageIndicatorContainerStyle={{
          position: "absolute",
          bottom: 20,
          left: 15,
        }}
        pageIndicatorStyle={{
          height: 10,
        }}
      >
        {images.map((item, index) => (
          <Item image={item.banner} index={index} onPress={() => navigation.navigate(`${item.navigate}`)} />
        ))}
      </Carousel>
    </View>
  );
};

export default Slider;
// styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fff',
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.17,
    shadowRadius: 3.05,
    elevation: 4,
    position: "relative",
  },
  imageContainer: {},
});
