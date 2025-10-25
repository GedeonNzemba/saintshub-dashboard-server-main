import { Animated, Easing, Pressable, StyleSheet, View, TouchableOpacity } from "react-native";
import React, {  useEffect, useRef, useState } from "react";
import Icon from "react-native-vector-icons/SimpleLineIcons";
import { Text } from "react-native-paper";

type IProps = {
  title: string;
  icon: JSX.Element | string;
  content: JSX.Element;
};

const Accordance = ({ title, icon, content }: IProps) => {
  const [isOpen, setisOpen] = useState<boolean>(false);

  const moveAnim = useRef(new Animated.Value(0)).current;

  const openAccordion = () => {
    setisOpen(!isOpen);
    console.log("isOpen ", isOpen);
  };

  useEffect(() => {
    Animated.timing(moveAnim, {
      toValue: 1,
      duration: 1000, // Duration of the transition in milliseconds
      easing: Easing.inOut(Easing.ease), // Easing function for smooth transition
      useNativeDriver: true, // Enable native driver for better performance
    }).start();
  }, [moveAnim]);

  return (
    <View>
      <Pressable style={styles.insightHeading} onPress={openAccordion}>
        <View>
          <Text style={styles.insightHeadingText}>{title}</Text>
        </View>

        <TouchableOpacity onPress={openAccordion}>
          {isOpen ? (
            <Icon
              name="arrow-up"
              size={20}
              adjustsFontSizeToFit
              style={{ fontFamily: "RobotoBlack" }}
            />
          ) : (
            <Icon
              name="arrow-down"
              size={20}
              adjustsFontSizeToFit
              style={{ fontFamily: "RobotoBlack" }}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[
          styles.insightHeadingIcon,
          {
            shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
          }
          ]} onPress={openAccordion}>
          {icon}
        </TouchableOpacity>
      </Pressable>

      {isOpen && (
        <Animated.View
          style={{
            transform: [
              {
                translateY: moveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [200, 0], // Interpolate from 200 units offscreen to 0
                }),
              },
            ],
          }}
        >
          <View
            style={{
              backgroundColor: "#f2f2f2",
              paddingLeft: 15,
              paddingRight: 15,
              borderRadius: 10,
            }}
          >
            {content}
          </View>
        </Animated.View>
      )}
    </View>
  );
};

export default Accordance;

const styles = StyleSheet.create({
  insightHeading: {
    borderBottomColor: "#DE8A68",
    borderBottomWidth: 2,
    borderStyle: "solid",
    paddingBottom: 18,
    marginBottom: 12,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  insightHeadingText: {
    color: "#000000",
    fontFamily: "RobotoCondensedBold",
    fontSize: 20,
    letterSpacing: -0.165,
  },
  insightHeadingIcon: {
    position: "relative",
    backgroundColor: "#eeeeee",
    borderRadius: 50,
    width: 50,
    height: 50,
    elevation: 4,
  },
});
