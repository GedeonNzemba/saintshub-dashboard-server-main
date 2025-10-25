import React from "react";
import { View, StyleSheet, Button } from "react-native";
// import { WebView } from 'react-native-webview';
import { SafeAreaView } from "react-native";
import WebViewIframe from "../../recycle/WebView";
import Loader from "../Loader";
import { sleep } from "../../../utilities/types";

const VGR = () => {
  const [isLoading, setIsLoading] = React.useState(true);

  const loadWebView = async () => {
    await sleep(3000)
    setIsLoading(false)
  }

  React.useEffect(() => {
    setIsLoading(true)
    loadWebView()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
       {isLoading && (
        <Loader
        />
      )}

      {!isLoading && <WebViewIframe uri="https://branham.org/en/music" />}
   </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  webview: {
    flex: 1,
  },
});

export default VGR;


// _reactNative.NativeModules.RNCWe(...)ouldStartLoadWithRequestCallback is not a fun
// ction (it is undefined), js engine: hermes
