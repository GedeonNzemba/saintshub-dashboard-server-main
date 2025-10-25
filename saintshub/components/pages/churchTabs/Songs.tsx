import { FlatList, Image, SafeAreaView, StyleSheet, TouchableOpacity, View, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../app/_layout";
import { Appbar, Divider, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Search from "../../sections/Search";
import YoutubePlayer from "react-native-youtube-iframe";
import Stream from "../../sections/Stream";
import { windowWidth } from "../../../utilities/types";
// import { ScrollView } from "react-native-gesture-handler";
import { songData } from "../../../utilities/tools";
import Loader from "../../sections/Loader";
import NoData from "../../sections/NoData";


const Songs = () => {
  const navigator = useNavigation();
  const dispatch = useDispatch();

  const { songs, churchName, title } = useSelector((state: RootState) => state.reducer.churchTabSlice.data);

  const [searchHeight, setSearchHeight] = useState<number>(0);
  const [state, setState] = useState<string[]>(songs);

  // SEARCH
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredData, setFilteredData] = useState<string[]>(songs);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSearch = (query: string) => {
    console.log("searched: ", loading);
  };

  useEffect(() => {
    if (songs !== undefined) {
      setState(songs);
      console.log("songs: ", songs);
    }
  }, [songs]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        height: "100%",
        marginBottom: 0,
        padding: 0,
        backgroundColor: "#ffffff",
      }}
    >
      <View style={{ flex: 1, height: "100%" }}>

        {/* HEADER */}
        <Appbar.Header style={{ zIndex: 99999}}>
          <Appbar.BackAction accessibilityLabel="Back" onPress={() => navigator.goBack()} />
          <Appbar.Content
            title="Back"
            titleStyle={{
              alignSelf: "flex-start",
              fontFamily: "RobotoMedium",
            }}
            onPress={() => navigator.goBack()}
          />
        </Appbar.Header>

        {/* SEARCH BAR */}
        <View
          style={{
            padding: 16,
            paddingTop: 0,
            width: "100%",
            zIndex: 99999,
            backgroundColor: "#ffffff",
          }}
          onLayout={({ nativeEvent }) => {
            const { x, y, width, height } = nativeEvent.layout;
            setSearchHeight(height);
          }}
        >
          <Search onSearch={handleSearch} />
        </View>

        {/* MAIN */}
        <View
          style={{
            flex: 1,
            paddingBottom: 0,
            alignItems: 'center',
          }}
        >
          {filteredData.length <= 1 && (
            <>
              <Loader mt={-100} />
              <Text style={{
                position: "absolute",
                bottom: 350,
                zIndex: 99999,
                textAlign: 'center',
                color: '#000',
                fontSize: 20,
                fontFamily: "RobotoMedium",
              }}>No Data</Text>
            </>
          )}

          {filteredData && filteredData.length >= 1 && (
             <ScrollView
             style={{
               paddingLeft: 20,
                paddingRight: 20,
                width: '100%',
             }}
            >
              {filteredData.map((item, index) => {
                return (
                  <React.Fragment key={index}>
                  <View style={styles.sermonsGrid}>
                    <Text variant="titleLarge" style={styles.title}>
                      Song {index} - name
                    </Text>
                    <Text variant="titleMedium" style={styles.preacher}>
                      The Author name
                    </Text>

                    <Stream churchName={churchName} title={title} stream={item} />
                  </View>

                  <Divider style={{ marginBottom: 15 }} />
                </React.Fragment>
               )
             })}
              </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Songs;

const styles = StyleSheet.create({
  sermonsGrid: {
    // backgroundColor: "#b3b3b3",
    marginBottom: 50,
    width: "100%",
    elevation: 5,
  },

  title: {
    fontFamily: "RobotoCondensedBold",
  },
  preacher: {
    fontFamily: "RobotoMedium",
    marginBottom: 10,
  },
});
