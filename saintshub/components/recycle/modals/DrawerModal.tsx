import React, { useCallback, useMemo, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Button, Icon } from "react-native-paper";
import { DrawerModaltypes } from "../../../utilities/tools";
import { useDispatch } from "react-redux";
import { updateSheet, updateSheetContent } from "../../../hooks/redux/detachedBottomSheet";
import { Image } from "react-native";
import { ScrollView } from "react-native";
import { BottomSheetDefaultBackdropProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types";
import { relative } from "path";

const DrawerModal = ({
  heading,
  subheading,
  bodyText_one,
  bodyText_two,
  bodyText_three,
  onDismiss
}: DrawerModaltypes) => {
  const dispatch = useDispatch();
  // ref
  const bottomSheetRef = useRef<BottomSheet>(null);

  // variables
  const snapPoints = useMemo(() => ["45%"], []);
  //const snapPoints = useMemo(() => ["25%"], []);

  // callbacks
  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  // Close Modal
  const handleClosePress = () => {
    dispatch(updateSheet());
    dispatch(updateSheetContent({
      heading: '',
      subheading: '',
      bodyText_one: '',
      bodyText_two: '',
      bodyText_three: ''
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
      heading: '',
      subheading: '',
      bodyText_one: '',
      bodyText_two: '',
      bodyText_three: ''
    }))
    console.log("handleClose");
  };

  // renders
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      detached={true}
      bottomInset={50}
      enablePanDownToClose={true}
      enableOverDrag={true}
      backdropComponent={renderBackdrop}
      onClose={() => {
        handleClose();
        onDismiss?.();
      }}
      style={styles.sheetContainer}
    >
      <ScrollView>
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.headerText}>
                {heading}
              </Text>
              <Icon source="alert-circle" size={24} color="#d32f2f" />
            </View>

            <Text style={{ fontSize: 20, fontFamily: "RobotoMedium", color: "rgba(0, 0, 0, 0.781)", marginTop: 10 }}>
              {subheading}
            </Text>
          </View>

          <View style={styles.body}>
            {/* {sub_image && (
              <Image
                resizeMode="contain"
                source={{ uri: sub_image }}
                style={{ width: '100%',
                  height: 250,
                  objectFit: "fill",
                  resizeMode: "cover",
                  marginTop: 16,
                marginBottom: 16 }}
              />
            )} */}

            {bodyText_one && (<Text style={styles.bodyText}>{bodyText_one}</Text>)}
            {bodyText_two && (<Text style={styles.bodyText}>{bodyText_two}</Text>)}
            {bodyText_three && (<Text style={styles.bodyText}>{bodyText_three}</Text>)}
          </View>

          <View style={styles.footer}>
            <Button
              icon="close"
              mode="contained"
              onPress={handleClosePress}
              style={styles.button}
              labelStyle={{ fontFamily: "RobotoMedium", color: "#fff" }}
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
    marginBottom: 24,
  },
  headerText: {
    fontSize: 24,
    fontFamily: "RobotoBlack",
    color: "#000000",
    lineHeight: 40,
  },
  body: {
    flex: 1,
  },
  bodyText: {
    fontSize: 16,
    fontFamily: "RobotoRegular",
    color: "#000000",
    marginVertical: 10,
    lineHeight: 24
  },
  footer: {
    //flex: 0.5,
    marginTop: 60

  },
  button: {
    backgroundColor: "#000000",
    fontFamily: "RobotoBlack",
    color: "#ffffff",
    borderRadius: 15,
  },
});

export default DrawerModal;
