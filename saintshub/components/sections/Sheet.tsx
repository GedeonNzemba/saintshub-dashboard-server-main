import React, { useRef } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  TouchableHighlight,
  Text,
} from "react-native";
// import ActionSheet
import ActionSheet from "react-native-actionsheet";

const Sheet = (sheetItems: Array<{}>) => {
  let actionSheet = useRef();
  var optionArray = ["Option 1", "Option 2", "Option 3", "Option 4", "Cancel"];

  const showActionSheet = () => {
    //To show the Bottom ActionSheet
    if (actionSheet.current !== undefined) {
      actionSheet.current?.show();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <Text style={styles.titleStyle}>React Native Bottom Action Menu</Text>
        <TouchableHighlight
          style={styles.buttonStyle}
          onPress={showActionSheet}
        >
          <Text style={styles.buttonTextStyle}>Open Buttom ActionSheet</Text>
        </TouchableHighlight>
        <Text style={styles.titleStyle}>www.aboutreact.com</Text>
        <ActionSheet
          ref={actionSheet}
          // Title of the Bottom Sheet
          title={"Which one do you like ?"}
          // Options Array to show in bottom sheet
          options={optionArray}
          // Define cancel button index in the option array
          // This will take the cancel option in bottom
          // and will highlight it
          cancelButtonIndex={4}
          // Highlight any specific option
          destructiveButtonIndex={1}
          onPress={(index) => {
            // Clicking on the option will give you alert
            alert(optionArray[index]);
          }}
        />
      </View>
    </SafeAreaView>
  );
};
export default Sheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
    textAlign: "center",
    paddingTop: 30,
    backgroundColor: "#307ecc",
    padding: 16,
  },
  buttonStyle: {
    width: "100%",
    height: 40,
    padding: 10,
    backgroundColor: "#f5821f",
    marginTop: 30,
  },
  buttonTextStyle: {
    color: "white",
    textAlign: "center",
  },
  titleStyle: {
    color: "white",
    textAlign: "center",
    fontSize: 20,
    marginTop: 10,
  },
});
