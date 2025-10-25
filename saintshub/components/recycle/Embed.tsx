import React from "react";
import { View, StyleSheet, Dimensions, Text, useWindowDimensions } from "react-native";
// import { WebView } from 'react-native-webview';
import IframeRenderer from "@native-html/iframe-plugin";
import RenderHTML from "react-native-render-html";
import WebView from "react-native-webview";

interface IProps {
  uri: string;
}

const renderers = {
  iframe: IframeRenderer,
};

const Embed = ({ uri }: IProps) => {
  const { width, height } = useWindowDimensions();

  const contentWidth = Dimensions.get("screen").width * 1;
  const contentHeight = Dimensions.get("screen").height;
  let content = `<iframe src=${uri} allowfullscreen></iframe>`;


  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={{height: 500, borderWidth: 4, borderColor: 'pink'}} >
        <RenderHTML
          renderers={renderers}
          WebView={WebView}
          source={{
            html: content,
          }}
            contentWidth={width}
          defaultWebViewProps={{}}

            renderersProps={{
              iframe: {
                scalesPageToFit: true,

                webViewProps: {
                  allowsFullScreen: true,
                },
              },
            }}
            baseStyle={styles.contentMessage}
            tagsStyles={{
              iframe: {
                marginTop: 15,
                borderRadius: 5,
                marginHorizontal: 0,
                borderWidth: 3,
                height: contentHeight,
                borderColor: 'blue'
              },
            }}
        />
        </Text>
       
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "red",
    height: 400,
    flex: 1,
  },
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
});

export default Embed;
