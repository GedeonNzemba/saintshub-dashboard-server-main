import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  View,
  ScrollView,
  Platform
} from "react-native";
import React, { useEffect, useState } from "react";
import {  useSelector } from "react-redux";
import { RootState } from "../../../app/_layout";
import { Appbar, Text } from "react-native-paper";
import { ParamListBase, useNavigation } from "@react-navigation/native";
import Search from "../../sections/Search";
import Stream from "../../sections/Stream";
import { windowWidth } from "../../../utilities/types";
// import { ScrollView } from "react-native-gesture-handler";
import Loader from "../../sections/Loader";
import { ChurchSermonState, initialState } from "../../../hooks/redux/church/sermons";
import { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types";

// Define the Item interface
interface Item {
  preacher: string;
  sermon: string;
  title: string;
  cover: string;
}


const Sermons = () => {
  const navigator = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const [searchHeight, setSearchHeight] = useState<number>(0);

  const [formData, setFormData] = React.useState<ChurchSermonState>(initialState);

  const { oldServices } = useSelector((state: RootState) => state.reducer.getChurchSermonData);

  // SEARCH
  const [searchQuery, setSearchQuery] = useState<string>('');

  // LOADER
  const [loading, setLoading] = useState<boolean>(true);

  // SEARCH FUNCTIONS
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredServices = formData.oldServices.filter((service: Item) => {
    return (
      service.preacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.sermon.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.cover.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Define a separate component for the separator
const Separator = () => (
  <View
    style={{
      height: 1,
      width: "100%",
      backgroundColor: "#cccccc",
      marginBottom: 20,
    }}
  />
);

  useEffect(() => {
    setFormData({
      ...formData,
      oldServices: oldServices,
    });

    if (formData?.oldServices) {
      setLoading(false);
    }

    return () => {
      formData?.oldServices.length <= 1 ? setFormData(initialState) : null;
    };
  }, [oldServices, loading]);



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
      {loading && (
        <Loader />
      )}
      <View style={{ flex: 1, height: "100%" }}>
        <Appbar.Header>
          <Appbar.BackAction
            accessibilityLabel="Back"
            onPress={() => navigator.goBack()}
          />
          <Appbar.Content
            title="Back"
            titleStyle={{
              alignSelf: "flex-start",
              fontFamily: "RobotoMedium",
            }}
            onPress={() => navigator.goBack()}
          />
        </Appbar.Header>

        <View
          style={{
            padding: 16,
            paddingTop: 0,
            width: "100%",
            backgroundColor: "#ffffff",
          }}
          onLayout={({ nativeEvent }) => {
            const { x, y, width, height } = nativeEvent.layout;
            setSearchHeight(height);
          }}
        >
          <Search onSearch={handleSearch} />
        </View>

        <View
          style={{
            flex: 1,
            paddingBottom: 0,
          }}
        >
          <ScrollView
            style={{
              paddingLeft: 20,
              paddingRight: 20,
            }}
          >
            <FlatList
              ItemSeparatorComponent={
                Separator
                // Platform.OS !== 'android' &&
                // (({ highlighted }) => (
                //   <View
                //     style={[highlighted && { marginLeft: 0 }]}
                //   />
                // ))
              }
              data={filteredServices}
              renderItem={({ item, index, separators }) => (

                <View style={styles.sermonsGrid}>
                  <Text variant="titleLarge" style={styles.title}>
                    {item.title}
                  </Text>
                  <Text variant="titleMedium" style={styles.preacher}>
                    {item.preacher}
                  </Text>

                  <Stream
                    title={item.title}
                    sermonURL={item.sermon}
                    cover={item.cover}
                  />
                </View>
              )}
            />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Sermons;

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
