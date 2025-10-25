import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity } from "react-native";
import React from "react";
import GlobalStyles from "../../recycle/styles/GlobalStyles";
import { media_video } from "../../../utilities/types";
import { WebView } from "react-native-webview";
import { Appbar } from "react-native-paper";
import sermonIcon from "../../../images/sermon_img.png";
import { useNavigation } from "@react-navigation/native";

const Video = () => {
  const navigation = useNavigation();
  const targetElementHeader = "body header";

  const code = `
    // Add CSS styles
    var customStyle = document.createElement('style');
    customStyle.innerHTML = '.mainsitearea div.row > div:nth-child(1) {display: none !important} .toptop { position: fixed; width: 100%; top: 0; left: 0; z-index: 9999999; } .menu_container { position: fixed; width: 100%; top: 3px; left: 0; z-index: 9999999; height: auto !important } .f-dropdown {padding: 1rem !important} .menu label {display: none !important} .mainsitearea div.row > div:nth-child(2) {margin-top: 40px !important} .bbbb {display: none !important} .videoplayerarea a.link {display: none !important} .copyrightArea {display: none !important}';
    document.head.appendChild(customStyle);

    // Add JavaScript logic
  `;

  return (
    <SafeAreaView style={[GlobalStyles.droidSafeArea]}>
        <Appbar.Header style={{ backgroundColor: "transparent" }}>
        <Appbar.BackAction accessibilityLabel="Back" iconColor="#000000" onPress={() => navigation.goBack()} />
        <Appbar.Content
          title="Back"
          titleStyle={{
            alignSelf: "flex-start",
            fontFamily: "RobotoMedium",
            color: "#000000",
          }}
          onPress={() => navigation.goBack()}
        />
      </Appbar.Header>

      <TouchableOpacity style={styles.titleWrapper}>
        <Text style={styles.title}>Video</Text>
        <Image
                  source={sermonIcon}
                  resizeMode="contain"
          style={{
            width: "100%",
            height: 70,
          }}
        />
      </TouchableOpacity>

<WebView source={{ uri: media_video }} injectedJavaScript={code} javascriptenabled={true} style={styles.webview} />
    </SafeAreaView>
  );
};

export default Video;

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
