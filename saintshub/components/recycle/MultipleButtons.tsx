import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import React, { useState } from "react";
import { StyleProp } from "react-native";

// import { IProps } from "react-native-modalize/lib/options";

type IProps = {
  titles: string[];
  btnStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<ViewStyle>;
  headers?: string[];
  disabledButtons?: boolean[];
  onButtonPress?: (content: string) => void;
  handleClick?: (index: number) => void;
};


const MultipleButtons = ({ titles, btnStyle, titleStyle, headers, disabledButtons, handleClick }: IProps) => {
  const [activeButton, setActiveButton] = useState<boolean>(false);
  const [selectedButtonIndex, setSelectedButtonIndex] = useState<number | null>(null);

  const handleButtonPress = (index: number) => {
    setActiveButton(!activeButton);
    setSelectedButtonIndex(index);
    handleClick(index);
    console.log('ACTIVE: ', activeButton)
    console.log(`Button ${index} pressed`)

  };



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
      {titles &&
        titles.map((item, index) => (
          <TouchableOpacity
            key={index}
            disabled={disabledButtons[index]}
            style={[btnStyle, styles.shortBtn, selectedButtonIndex === index && activeButton && styles.btn_active, disabledButtons[index] && styles.disabledButton]}
            onPress={() => handleButtonPress(index)}
          >
            <Text style={[titleStyle, styles.sBtn, selectedButtonIndex === index && activeButton && styles.sBtn_active]}>{item}</Text>
          </TouchableOpacity>
        ))}
    </ScrollView>
  );
};

export default MultipleButtons;

const styles = StyleSheet.create({
  btn_active: {
    backgroundColor: "#FF1A4B",
  },
  sBtn_active: {
    color: "#ffffff",
  },
  disabledButton: {
    opacity: 0.5, // You can adjust the opacity to visually indicate the button is disabled
  },
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
    backgroundColor: "#000000",
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
