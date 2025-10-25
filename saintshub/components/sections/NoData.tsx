import React, { useEffect, useRef } from "react";
import LottieView from "lottie-react-native";

export default function NoData() {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    animationRef.current?.play();

    // Or set a specific startFrame and endFrame with:
    animationRef.current?.play(30, 120);
  }, []);

  return (
    <LottieView
      ref={animationRef}
      source={require("../../images/nodata.gif")}
    />
  );
}