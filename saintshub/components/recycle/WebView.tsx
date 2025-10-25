import React, { useRef } from "react";
import { View, StyleSheet, Dimensions, Text, useWindowDimensions, PlatformWebStatic } from "react-native";
// import { WebView } from 'react-native-webview';
import WebView from "react-native-webview";

interface IProps {
  uri: string;
  runScript?: string;
}

const WebViewIframe = ({ uri, runScript }: IProps) => {
  const webViewRef = useRef();
  // const { width, height } = useWindowDimensions();

  // const contentWidth = Dimensions.get("screen").width * 1;
  // const contentHeight = Dimensions.get("screen").height;
  // let content = `<iframe src=${uri} allowfullscreen></iframe>`;

  // const onMessage = (event: any) => {
  //   // Handle the onMessage event here
  //   console.log("Received message:", event.nativeEvent.data);
  // };

  return (
    <View style={styles.container}>
      <WebView source={{ uri: uri }}
        injectedJavaScript={runScript}
        
        style={styles.webView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
  item: {
    borderColor: "blue",
    borderBottomWidth: 1,
    padding: 20,
    backgroundColor: "white",
  },
  informations: {
    flexDirection: "row",
    alignItems: "center",
  },
  creator: {
    fontWeight: "bold",
    fontFamily: "Lato-Bold",
    fontSize: 16,
    marginBottom: 5,
  },
  date: {
    color: "grey",
    width: Dimensions.get("screen").width * 0.75,
  },
  content: {
    marginTop: 10,
    height: 500,
    borderWidth: 3,
    borderColor: "blue",
  },
  contentMessage: {
    borderColor: "#000000",
    borderWidth: 8,
    height: Dimensions.get("screen").height,
  },
  container: {
    flex: 1,
  },
  webView: {
    flex: 1, // This will make the WebView take the full height of its container
    // You can also set a fixed height if you don't want it to take the full height
    // height: 200, // Set the desired height
  },
});

export default WebViewIframe;
