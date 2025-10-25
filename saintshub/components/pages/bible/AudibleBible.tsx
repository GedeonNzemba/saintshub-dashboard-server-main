import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity } from "react-native";
import React from "react";
import GlobalStyles from "../../recycle/styles/GlobalStyles";
import { audibleBibleKjv } from "../../../utilities/types";
import WebView from "react-native-webview";
import { Appbar } from "react-native-paper";
import bibleIcon from "../../../assets/images/bibleicon.png";
import { useRouter } from "expo-router";

const AudibleBible = () => {
  const router = useRouter();

  const targetElementHeader = "body header";

  const code = `
    // Add CSS styles
    var customStyle = document.createElement('style');
    customStyle.innerHTML = 'body main { margin-block-start: unset !important; } main div div.sticky {top: 0} #bottom-widgets {display: none} footer {display: none !important} .flex.flex-col.bg-gray-10.rounded-1.p-3.gap-y-4.gap-x-2 {display: none !important} .flex.justify-center.items-center.gap-x-3.w-full {display: none !important} .hidden {display: flex !important} main .container .hidden > a {display: none !important} .flex.flex-col.gap-y-4 .flex.flex-col.justify-center.items-center.gap-y-4 {display: none !important} iframe#branch-banner-iframe {display: none !important} .cc-banner { display: none !important } .ChapterContent_bible-reader__LmLUa > div:nth-child(2) { display: none !important }';
    document.head.appendChild(customStyle);

    // Add JavaScript logic
    var elementToRemove = document.querySelector('${targetElementHeader}');
if (elementToRemove) {
elementToRemove.remove();
}
  `;

  return (
    <SafeAreaView style={[GlobalStyles.droidSafeArea]}>
      <Appbar.Header style={{ backgroundColor: "transparent" }}>
        <Appbar.BackAction accessibilityLabel="Back" iconColor="#000000" onPress={() => router.back()} />
        <Appbar.Content
          title="Back"
          titleStyle={{
            alignSelf: "flex-start",
            fontFamily: "RobotoMedium",
            color: "#000000",
          }}
          onPress={() => router.back()}
        />
      </Appbar.Header>

      <TouchableOpacity style={styles.titleWrapper}>
        <Text style={styles.title}>Audible Bible</Text>
        <Image
          source={bibleIcon}
          style={{
            width: "25%",
            height: 40,
          }}
        />
      </TouchableOpacity>

      <WebView source={{ uri: audibleBibleKjv }} injectedJavaScript={code} javascriptenabled={true} style={styles.webview} />
    </SafeAreaView>
  );
};

export default AudibleBible;

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
