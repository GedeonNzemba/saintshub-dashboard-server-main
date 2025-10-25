import React, { memo } from "react";
import LottieView from "lottie-react-native";
import { StyleSheet, View } from "react-native";

const LiveIconA = () => {
  return (
    <View style={styles.container}>
      <LottieView
        source={require("../../utilities/live/live2.json")}
        style={styles.lottieView}
        autoPlay
        loop
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: "#ffd0d0",
    borderRadius: 50,
    marginBottom: 12,
    position: "absolute",
    top: 10,
    right: 10,
    elevation: 7
  },
  lottieView: {
    width: 50,
  },
});

export default memo(LiveIconA);
