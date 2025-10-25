import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import React from "react";

export default function ButtonsTab() {
  return (
    <ScrollView
      horizontal={true}
      contentContainerStyle={{ flexGrow: 1, alignItems: "center" }}
      showsHorizontalScrollIndicator={false}
      style={{
        maxHeight: 62,
        marginTop: 10,
      }}
    >
      <TouchableOpacity
        style={[
          { backgroundColor: "#FF1A4B", marginRight: 12 },
          styles.shortBtn_active,
        ]}
        onPress={() => console.log("clicked")}
      >
        <Text style={styles.sBtn}>All Services</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.shortBtn}
        onPress={() => console.log("clicked")}
      >
        <Text style={styles.sBtn}>Offline</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.shortBtn}
        onPress={() => console.log("clicked")}
      >
        <Text style={styles.sBtn}>Music</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.shortBtn}
        onPress={() => console.log("clicked")}
      >
        <Text style={styles.sBtn}>Bible</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.shortBtn}
        onPress={() => console.log("clicked")}
      >
        <Text style={styles.sBtn}>Youth</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  shortBtn_active: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    height: 50,
    // marginRight: 0,
  },
  shortBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: "black",
    height: 50,
    marginRight: 12,
  },
  sBtn: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.25,
    color: "white",
  },
});
