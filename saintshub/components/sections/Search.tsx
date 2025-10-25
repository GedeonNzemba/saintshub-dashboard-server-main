import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SearchIcon from "@expo/vector-icons/Feather";
import Svg, { Circle, Rect } from "react-native-svg";

interface SearchProps {
  onSearch: (query: string) => void;
}

const Search = ({onSearch}: SearchProps) => {

  return (
    <View style={styles.container}>
      <View style={styles.searchIconPlaceholder}>

        {/* SEARCH ICON */}
        <TouchableOpacity style={styles.search} disabled>
          <SearchIcon
            name="search"
            size={30}
            color="#FE7940"
          />
        </TouchableOpacity>

        {/* SEARCH INPUT */}
        <View style={styles.placeholder}>
          <TextInput placeholder="Search..." style={styles.placeholderText} onChangeText={(text) => onSearch(text)} />
        </View>
      </View>

      {/* FILTER ICON [ FOR FUTURE USAGE/IMPLEMENTATION ] */}
      <TouchableOpacity style={styles.filter} disabled>
        <Svg width={50} height={50} viewBox="0 0 33 33" fill="none">
          <Rect x="9" y="11" width="16" height="1" fill="#474747" />
          <Rect x="9" y="16" width="16" height="1" fill="#474747" />
          <Rect x="9" y="21" width="16" height="1" fill="#474747" />
          <Circle cx="19.5" cy="21.5" r="1.5" fill="#474747" />
          <Circle cx="14.5" cy="16.5" r="1.5" fill="#474747" />
          <Circle cx="21.5" cy="11.5" r="1.5" fill="#474747" />
        </Svg>
      </TouchableOpacity>
    </View>
  );
};

export default Search;

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#ffffff",
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 20,
    paddingRight: 20,
    justifyContent: "space-between",
    alignItems: "center",
    height: 60,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIconPlaceholder: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  search: {
    marginRight: 20,
  },
  placeholder: {
    width: '72%',
  },
  placeholderText: {
    fontFamily: "RobotoRegular",
    fontSize: 18,
  },
});
