import { StyleSheet, Text, View } from "react-native";
import React from "react";

interface IProps {
  title: string;
}

const Strips = ({ title }: IProps) => {

  return (
    <View style={styles.boxTitle}>
      <Text style={styles.bTitle}>{title}</Text>
    </View>
  );
};

export default Strips;

const styles = StyleSheet.create({
  boxTitle: {
    padding: 10,
    backgroundColor: "red",
    // width: 80,
    borderRadius: 50,
    marginBottom: 12,
    position: "absolute",
    top: 10,
    right: 10,
  },
  bTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "RobotoCondensedBold",
    textAlign: "center",
  },
});
