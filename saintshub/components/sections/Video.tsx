import React, { useEffect, useState } from "react";
import { Alert, Modal, StyleSheet, Text, Pressable, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/_layout";
import { CLOSE_MODAL, OPEN_MODAL } from "../../constants/modalConstant";
import { hideModal } from "../../hooks/redux/videoModalSlice";

const VideoPlay = () => {
  const [hide, setHide] = useState<boolean | undefined>(undefined);

  const { modalVisible } = useSelector((state: RootState) => state.reducer.modal);
  const dispatch = useDispatch();

  //   if (modalVisible === OPEN_MODAL) {
  //     //console.log("COUNT", modalVisible);
  //     setShow(true);
  //   }

  // if (modalVisible === CLOSE_MODAL) {
  //     setShow(false);
  // }

  return (
    <View style={styles.centeredView}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible === OPEN_MODAL ? true : false}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Hello World!</Text>
            <Pressable
              onPress={() => dispatch(hideModal())}
              style={[styles.button, styles.buttonClose]}
            >
              <Text style={styles.textStyle}>Hide Modal</Text>
            </Pressable>
            <View style={{ marginTop: 16 }} />
          </View>
        </View>
      </Modal>
      {/* <Pressable
                style={[styles.button, styles.buttonOpen]}
                onPress={() => setModalVisible(true)}>
                <Text style={styles.textStyle}>Show Modal</Text>
            </Pressable> */}
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
});

export default VideoPlay;
