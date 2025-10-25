import React, { useCallback, useMemo, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Button } from "react-native-paper";
import { ShopModalTypes } from "../../../utilities/tools";
import { useDispatch } from "react-redux";
import { updateSheet, updateSheetContent } from "../../../hooks/redux/detachedBottomSheet";
import { Image } from "react-native";
import { ScrollView } from "react-native";
import { BottomSheetDefaultBackdropProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types";

const ShopModal = ({
  headerText_primary,
  headerText_secondary,
  bodyText_one,
  bodyText_two,
  bodyText_three,
  bodyText_four,
  bodyText_five,
  sub_image,
  multipleContent
}: ShopModalTypes) => {
  const dispatch = useDispatch();
  // ref
  const bottomSheetRef = useRef<BottomSheet>(null);

  // variables
  const snapPoints = useMemo(() => ["25%", "50%"], []);
  //const snapPoints = useMemo(() => ["25%"], []);

  // callbacks
  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  // Close Modal
  const handleClosePress = () => {
    dispatch(updateSheet());
    dispatch(updateSheetContent({
      image: '',
      sub_image: '',
      headerText_primary: '',
      headerText_secondary: '',
      bodyText_one: '',
      bodyText_two: '',
      bodyText_three: '',
      bodyText_four: '',
      bodyText_five: '',
      multipleContent: []
    }))
    bottomSheetRef.current?.close();
  };

  // BACKDROP
  const renderBackdrop = useCallback(
    (props: React.JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  //  HANDLE CLOSE
  const handleClose = () => {
    // update modal state to false
    dispatch(updateSheet());
    dispatch(updateSheetContent({
      image: '',
      sub_image: '',
      headerText_primary: '',
      headerText_secondary: '',
      bodyText_one: '',
      bodyText_two: '',
      bodyText_three: '',
      bodyText_four: '',
      bodyText_five: '',
      multipleContent: []
    }))
    console.log("handleClose");
  };

  // renders
  return (
    <BottomSheet
      ref={bottomSheetRef}
      //index={1}
      snapPoints={snapPoints}
      //onChange={handleSheetChanges}
      detached={true}
      bottomInset={50}
      backdropComponent={renderBackdrop}
      onClose={handleClose}
      style={styles.sheetContainer}
    >
      <ScrollView>
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {headerText_primary}{" "}
            <Text style={{ fontFamily: "RobotoMedium" }}>
              {headerText_secondary}
            </Text>
          </Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.bodyText}>{bodyText_one}</Text>
          {sub_image && (
            <Image
            resizeMode="contain"
                source={{ uri: sub_image }}
                style={{ width: '100%',
                  height: 250,
                  objectFit: "fill",
                  resizeMode: "cover",
                  marginTop: 16,
                marginBottom: 16}}
          />
          )}
          {multipleContent && (
            <View>
              {multipleContent.map((item, index) => (
                <Text key={index} style={styles.bodyText}>{index}. {item}</Text>
              ))
              }
            </View>
          )}
          <Text style={styles.bodyText}>{bodyText_two}</Text>
          <Text style={styles.bodyText}>{bodyText_three}</Text>
          <Text style={styles.bodyText}>{bodyText_four}</Text>
          <Text style={styles.bodyText}>{bodyText_five}</Text>
        </View>

        <View style={styles.footer}>
          <Button
            icon="close"
            mode="contained"
            onPress={handleClosePress}
            style={styles.button}
          >
            Close Modal
          </Button>
        </View>
      </View>
     </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#00000065",
    //height: '50%',
  },
  contentContainer: {
    flex: 1,
    //alignItems: 'center',
    justifyContent: "center",
    padding: 24,
  },
  sheetContainer: {
    // add horizontal space
    marginHorizontal: 24,
    //flex: 1
  },
  header: {
    //flex: 0.3,
  },
  headerText: {
    fontSize: 24,
    fontFamily: "RobotoBlack",
    color: "#000000",
  },
  body: {
    flex: 1,
  },
  bodyText: {
    fontSize: 16,
    fontFamily: "RobotoRegular",
    color: "#000000",
    marginVertical: 10,
  },
  footer: {
    //flex: 0.5,
    justifyContent: "flex-end",
  },
  button: {
    backgroundColor: "#000000",
    fontFamily: "RobotoBlack",
    color: "#ffffff",
    borderRadius: 15,
  },
});

export default ShopModal;
