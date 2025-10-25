import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { Text } from "react-native";
import AnimatedLoader from "react-native-animated-loader";

function LoaderB() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setInterval(() => {
      setVisible(!visible);
    }, 2000);
  }, []);

  return (
    <AnimatedLoader
      visible={visible}
      overlayColor="rgba(255,255,255,0.75)"
      animationStyle={styles.lottie}
      speed={1}
    >
      <Text>Loading...</Text>
    </AnimatedLoader>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    borderWidth: 3,
    borderColor: "#1e08af",
    zIndex: 999,
  },
  lottie: {
    width: 100,
    height: 100,
  },
});

export default LoaderB;
