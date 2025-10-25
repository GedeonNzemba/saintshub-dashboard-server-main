import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import GlobalStyles from "../../recycle/styles/GlobalStyles";
import { media_pictures, quoteOfTheDay, windowHeight, windowWidth } from "../../../utilities/types";
import { WebView } from "react-native-webview";
import { Appbar } from "react-native-paper";
import sermonIcon from "../../../assets/images/sermon_img.png";
import { useNavigation } from "@react-navigation/native";

const QhoteOfTheDay = () => {
  const navigation = useNavigation();
  const targetElementHeader = "body header";

  const code = `
    // Add CSS styles
    var customStyle = document.createElement('style');
    customStyle.innerHTML = '.mainsitearea div.row > div:nth-child(1) {display: none !important} .toptop { position: fixed; width: 100%; top: 0; left: 0; z-index: 9999999; } .menu_container { position: fixed; width: 100%; top: 3px; left: 0; z-index: 9999999; height: auto !important } .f-dropdown {padding: 1rem !important} .menu label {display: none !important} a.fancybox { width: fit-content; } .mainsitearea div.row:not(#results_nextQuote div.row) img {display: none !important} span#results_nextQuote div.row:first-child {margin-top: 80px !important} .copyrightArea {display: none !important}';
    document.head.appendChild(customStyle);

    // Add JavaScript logic
  `;

  return (
      <View style={[{position: 'absolute', top: 145, left: 0, zIndex: 9, right: 0, height: windowHeight / 1.5, marginBottom: 40 },GlobalStyles.droidSafeArea]}>
        {/* <Appbar.Header style={{ backgroundColor: "transparent" }}>
        <Appbar.BackAction accessibilityLabel="Back" iconColor="#000000" onPress={() => navigation.goBack()} />
        <Appbar.Content
          title="Back"
          titleStyle={{
            alignSelf: "flex-start",
            fontFamily: "RobotoMedium",
            color: "#000000",
          }}
          onPress={() => navigator.goBack()}
        />
      </Appbar.Header> */}

      <TouchableOpacity style={styles.titleWrapper}>
        <Text style={styles.title}>Quote Of The Day</Text>
        <Image
                  source={sermonIcon}
                  resizeMode="contain"
          style={{
            width: "100%",
            height: 70,
          }}
        />
          </TouchableOpacity>
          
         

<WebView source={{ uri: quoteOfTheDay }} injectedJavaScript={code} javascriptenabled={true} style={styles.webview}  />
    </View>
  );
};

export default QhoteOfTheDay;

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
    // fontSize: 24,
    // color: "#000000",
      // fontFamily: "RobotoMedium",
      fontSize: 24,
      textTransform: 'uppercase',
      color: "#000000",
      fontFamily: "RobotoBlack",
  },
});
