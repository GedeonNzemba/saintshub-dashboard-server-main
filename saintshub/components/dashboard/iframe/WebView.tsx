import {SafeAreaView, StyleSheet } from "react-native";
import React from "react";
import GlobalStyles from "../../recycle/styles/GlobalStyles";
import {createChurch } from "../../../utilities/types";
import WebView from "react-native-webview";
import { useNavigation } from "@react-navigation/native";

const WebViewIframe = () => {
  const navigation = useNavigation();
  const targetElementHeader = "body header";

  const code = `
    // Add CSS styles
    var customStyle = document.createElement('style');
    customStyle.innerHTML = 'body main { margin-block-start: unset !important; } main div div.sticky {top: 0} #bottom-widgets {display: none} footer {display: none !important} ';
    document.head.appendChild(customStyle);

    // Add JavaScript logic
    var elementToRemove = document.querySelector('${targetElementHeader}');
if (elementToRemove) {
elementToRemove.remove();
}
  `;

  return (
    <SafeAreaView style={[GlobalStyles.droidSafeArea, {paddingTop: 0}]}>

<WebView source={{ uri: createChurch }} injectedJavaScript={code} javascriptenabled={true} style={styles.webview} />
    </SafeAreaView>
  );
};

export default WebViewIframe;

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
  titleWrapper: {
    paddingTop: 16,
    paddingLeft: 16,
    paddingRight: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    color: "#000000",
    fontFamily: "RobotoMedium",
  },
});
