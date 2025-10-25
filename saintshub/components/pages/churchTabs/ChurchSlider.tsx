import { StyleSheet, View, ImageBackground  } from "react-native";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/_layout";
// import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import CustomSlider from "../../sections/CustomSlider";

type IProps = {
  gallery: string[]
}

const ChurchSlider = ({gallery}: IProps) => {
  const { data } = useSelector((state: RootState) => state.reducer.churchTabSlice);

  // console.log("ChurchSlider ", JSON.stringify(data));

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        // borderColor: "#080683a0",
        // borderWidth: 5,
        // backgroundColor: "#080683a0",
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 9,
      }}
    >
      {gallery.length <= 1 && (
        <ImageBackground
        source={{uri: 'https://res.cloudinary.com/locataire/image/upload/v1711975286/My-Image_l9qcn4.png'}}
        resizeMode="cover"
        imageStyle={{

        }}
        style={styles.bg}
      ></ImageBackground>
      )}
     
     {gallery.length >= 2 &&  <CustomSlider imageUrls={gallery } />}
    </View>
  );
};

export default ChurchSlider;

const styles = StyleSheet.create({
  bg: {
    width: '100%',
    height: '100%',
  }
});
