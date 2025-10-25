import { StyleSheet, Text, View } from "react-native";
import React from "react";
import Svg, { Circle, Path } from "react-native-svg";


const DailyScripture = () => {

    return (
      <View style={styles.dailyScripture} >
        <Text style={styles.heading}>Daily Scripture</Text>

        <View style={styles.dailyScriptureContainer}>
          <View style={styles.quoteShape}>
            <Svg width="35" height="28" viewBox="0 0 35 28" fill="none">
              <Path
                d="M28.5312 0.669922H6.42362C2.87362 0.669922 0 3.54354 0 7.09355V16.9032C0 20.4491 2.87362 23.3268 6.42362 23.3268H23.694V27.008C23.694 27.5573 24.1368 28 24.6861 28C25.014 28 25.3174 27.8402 25.5018 27.5737C26.0183 26.8194 27.0719 25.151 27.6622 23.3268H28.5312C32.0771 23.3268 34.9548 20.4532 34.9548 16.9032V7.09355C34.9548 3.54354 32.0771 0.669922 28.5312 0.669922Z"
                fill="#FEC300"
              />
              <Path
                d="M13.1668 9.56952C13.4373 8.58159 14.0604 7.82321 14.5031 7.38459C14.7614 7.13043 14.7737 6.7205 14.5318 6.45404L14.458 6.37206C14.2572 6.15069 13.9251 6.0851 13.6587 6.22448C8.35826 9.00792 8.42385 12.7793 8.47714 13.4188C8.47304 13.4885 8.46484 13.5582 8.46484 13.6319C8.46484 15.903 10.3054 17.7436 12.5765 17.7436C14.8475 17.7436 16.6881 15.903 16.6881 13.6319C16.6881 11.5659 15.159 9.85647 13.1668 9.56952Z"
                fill="#2C2F36"
              />
              <Path
                d="M22.9644 9.56958C23.2349 8.58165 23.858 7.82327 24.3007 7.38465C24.559 7.13049 24.5713 6.72056 24.3294 6.4541L24.2556 6.37212C24.0548 6.15075 23.7227 6.08517 23.4563 6.22454C18.1559 9.00798 18.2215 12.7793 18.2748 13.4188C18.2707 13.4885 18.2625 13.5582 18.2625 13.632C18.2625 15.903 20.103 17.7436 22.3741 17.7436C24.6451 17.7436 26.4857 15.903 26.4857 13.632C26.4857 11.5659 24.9525 9.85653 22.9644 9.56958Z"
                fill="#2C2F36"
              />
            </Svg>
          </View>

          <View style={styles.leftShape}>
            <Svg width="40" height="17" viewBox="0 0 40 17" fill="none">
              <Path
                d="M16.5424 5.74078C8.49824 4.2614 3.32697 2.11502 0 0V14.4831C0 15.8741 1.58714 17 3.54797 17H40C35.564 12.8298 28.1105 7.8672 16.5424 5.74078Z"
                fill="black"
              />
            </Svg>
          </View>

          <View style={styles.rightShape}>
            <Svg width="61" height="31" viewBox="0 0 61 31" fill="none">
              <Path
                d="M56.6754 0H0C0.91096 3.97021 4.78988 9.36071 17.4943 13.7982C34.8173 19.8474 51.0431 23.4312 61 31V3.24902C61 1.45709 59.0654 0 56.6754 0Z"
                fill="black"
              />
            </Svg>
          </View>
          <View style={styles.circleShape}>
            <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <Circle cx="15" cy="15" r="15" fill="#FF1A4B" />
            </Svg>
          </View>

          <Text style={styles.scripture}>
            The wicked flee when no one is pursuing, but the righteous are bold
            as a lion
          </Text>
          <View style={styles.shapter}>
            <Text style={styles.scriptureShapter}>Proverbs 28:1</Text>
          </View>
        </View>
        {/* <Svg width={20} height={20} viewBox="0 0 20 20">
          <Path d="M16.993 6.667H3.227l6.883 6.883 6.883-6.883z" fill="#000" />
        </Svg> */}
      </View>
    );
  }

export default DailyScripture;

const styles = StyleSheet.create({
  dailyScripture: {
    margin: 16,
  },
  heading: {
    fontFamily: "RobotoCondensedBold",
    fontSize: 22,
    marginBottom: 10,
  },
  dailyScriptureContainer: {
    position: "relative",
    padding: 30,
    backgroundColor: "#F2FBFF",
    borderRadius: 10,
    // overflow: "hidden",
  },
  scripture: {
    fontFamily: "RobotoMedium",
    fontSize: 18,
    lineHeight: 28,
  },
  shapter: {
    marginTop: 16,
    width: "100%",
    alignItems: "flex-end",
  },
  scriptureShapter: {
    fontFamily: "RobotoRegular",
    fontSize: 17,
  },
  rightShape: {
    position: "absolute",
    right: 0,
  },
  leftShape: {
    position: "absolute",
    left: 0,
    bottom: 0,
  },
  circleShape: {
    position: "absolute",
    right: 10,
    bottom: -6,
    overflow: "hidden",
  },
  quoteShape: {
    position: "absolute",
    left: "50%",
    top: -10,
    zIndex: 99,
    overflow: "visible",
  },
});
