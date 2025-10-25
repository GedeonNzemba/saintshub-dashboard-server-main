import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import GlobalStyles from "../../recycle/styles/GlobalStyles";
import { Appbar } from "react-native-paper";
import sermonIcon from "../../../assets/images/sermon_img.png";
import { useNavigation } from "@react-navigation/native";
import WebView from "react-native-webview";
import { ActivityIndicator } from "react-native";

const SERMON_URL = "https://branham.org/en/MessageAudio";

const Sermon = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);

  const injectedJavaScript = `
    // Add CSS styles
    var customStyle = document.createElement('style');
    customStyle.innerHTML = \`
      #banner_img { display: none !important }
      .toptop { 
        position: fixed;
        width: 100%;
        top: 0;
        left: 0;
        z-index: 9999999;
      }
      .menu_container { 
        position: fixed;
        width: 100%;
        top: 3px;
        left: 0;
        z-index: 9999999;
        height: auto !important 
      }
      .hide-for-desktop { display: none !important }
      ul#Ul1 { padding: 1rem !important }
      #display_area { padding-top: 55px !important }
      .copyrightArea { display: none !important }
    \`;
    document.head.appendChild(customStyle);
    true;
  `;

  return (
    <SafeAreaView style={[GlobalStyles.droidSafeArea, styles.container]}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction 
          accessibilityLabel="Back" 
          iconColor="#000000" 
          onPress={() => navigation.goBack()} 
        />
        <Appbar.Content
          title="Back"
          titleStyle={styles.headerTitle}
          onPress={() => navigation.goBack()}
        />
      </Appbar.Header>

      <View style={styles.titleWrapper}>
        <Text style={styles.title}>Sermon</Text>
        <Image
          source={sermonIcon}
          resizeMode="contain"
          style={styles.titleImage}
        />
      </View>

      <View style={styles.webviewContainer}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        )}
        <WebView 
          source={{ uri: SERMON_URL }}
          injectedJavaScript={injectedJavaScript}
          onLoadEnd={() => setIsLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          style={styles.webview}
        />
      </View>
    </SafeAreaView>
  );
};

export default Sermon;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: "transparent",
    elevation: 0,
  },
  headerTitle: {
    alignSelf: "flex-start",
    fontFamily: "RobotoMedium",
    color: "#000000",
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    zIndex: 1,
  },
  titleWrapper: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: "#000000",
    fontFamily: "RobotoMedium",
  },
  titleImage: {
    width: 100,
    height: 70,
  },
});
