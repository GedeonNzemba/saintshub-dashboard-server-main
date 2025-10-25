import React, { useState, useCallback } from "react";
import {  View, Alert, StyleSheet, Text, TouchableOpacity } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { liveData, songData } from "../../utilities/tools";
import { Image } from "react-native";

type IProps = {
  stream?: [liveData] | [songData] | string;
  cover?: string;
  title?: string;
  sermonURL?: string;
  preacher?: string;
  hideButton?: boolean;
};

export default function Stream({ stream, title, cover, sermonURL, preacher, hideButton = false }: IProps) {
  const [playing, setPlaying] = useState(false);

  console.log("STREAM: ", sermonURL);

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
      Alert.alert("video has finished playing!");
    }
  }, []);

  const togglePlaying = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  //ttps://youtu.be/HGq3qXTn8YM
function extractYouTubeId(sermonURL: string) {
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = sermonURL.match(regExp);
  console.log("MATCH_!", match);
  return match && match[1] ? match[1] : null;
}


  return (
    <View>
      {!playing && cover && (
        <TouchableOpacity onPress={togglePlaying}>
          <Image source={{uri: cover}} style={styles.coverImage} resizeMode="contain" />
        </TouchableOpacity>
      )}

      {!playing && (
        <YoutubePlayer
        //height={300}
        height={250}
        play={playing}
        videoId={sermonURL && extractYouTubeId(sermonURL)}
        onChangeState={onStateChange}
      />
      )}

{playing && (
        <YoutubePlayer
        //height={300}
        height={250}
        play={playing}
        videoId={sermonURL && extractYouTubeId(sermonURL)}
        onChangeState={onStateChange}
      />
      )}

      
      {/* <Button title={playing ? "pause" : "play"} /> */}

      {!hideButton && (
        <TouchableOpacity
          style={[
            {
              backgroundColor: "#000000",
            },
            styles.shortBtn,
          ]}
          onPress={togglePlaying}
        >
          <Text style={styles.sBtn}>{playing ? "Pause" : "Play"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shortBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    height: 50,
    //marginRight: 12,
  },
  sBtn: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.25,
    color: "white",
  },
  coverImage: {
    width: '100%',
    height: 250,
  },
});
