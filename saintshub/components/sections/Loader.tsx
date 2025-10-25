import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

interface IProps {
  mt?: number;

}

export default function Loader({mt}: IProps) {
  return (
    <View style={[{marginTop: mt}, styles.loaderContainer]}>
    <ActivityIndicator size="large" color="#FE7940" />
  </View>
  )
  

}


const styles = StyleSheet.create({
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    zIndex: 9999
  },
});
