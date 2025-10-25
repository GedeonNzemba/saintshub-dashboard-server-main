import React from "react";
import { Modal, Portal, Text, Button, Provider } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/_layout";
import { OPEN_MODAL } from "../../constants/modalConstant";
import { hideModal } from "../../hooks/redux/videoModalSlice";
import { View, StyleSheet } from "react-native";
import Stream from "./Stream";
import { sleep, windowHeight, windowWidth } from "../../utilities/types";
import Loader from "./Loader";
import { ScrollView } from "react-native-gesture-handler";
import Spacer from "../../tools/Spacer";
import { getRandomColor } from "../../tools/randomColor";

const ModalBox = () => {
  const [visible, setVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const { modalVisible, live, churhName } = useSelector((state: RootState) => state.reducer.modal);
  const dispatch = useDispatch();

  const isClosed = () => {
    setVisible(false);
    dispatch(hideModal());
  };

  const containerStyle = {
    backgroundColor: "#ffffff",
    padding: 20,
    height: windowHeight - 200,
    width: windowWidth - 25,
    position: 'absolute',
    top: '15%',
    left: '15%',
    borderRadius: 20,
    overflow: 'hidden'
  };

  // LOADER
  const loadWebView = async () => {
    await sleep(5000);
    setIsLoading(false);
  };

  React.useEffect(() => {
    setIsLoading(true);
    loadWebView();
  }, []);

  React.useEffect(() => {
    // console.log("churchName: ", churchName);
    // console.log("title: ", title);
    // console.log("stream URL: ", stream);
    live.forEach(element => {
      console.log("title: ", element.title);
      console.log("preacher: ", element.preacher);
      console.log("stream url: ", element.sermon);
    });
    console.log("stream URL: ", modalVisible);
  }, [live, modalVisible, churhName]);

  return (
    <Modal visible={modalVisible === OPEN_MODAL ? true : false} onDismiss={isClosed} contentContainerStyle={containerStyle} style={styles.modalStyles}>
      {isLoading && <Loader />}

      {!isLoading && (
        <ScrollView>
          { live.map((item, index) => {
            const randomColor = getRandomColor();
            return (
              <View key={index} style={{padding: 15, marginBottom: 25, borderRadius: 25, borderWidth: 1.5, borderColor: randomColor}}>
                <View style={styles.container}>
                  <Text style={styles.heading}>Church</Text>
                  <Text style={styles.props}>{churhName}</Text>
                </View>

                <View style={styles.container}>
                  <Text style={styles.heading}>Sermon</Text>
                  <Text style={styles.props}>{item.title}</Text>
                </View>
                {/* <Stream churchName={churchName} title={title} stream={stream} /> */}
                <Stream title={item.title} sermonURL={item.sermon} preacher={item.preacher} />
                <Spacer />
              </View>
            )
          })}
        </ScrollView>
      )}
    </Modal>
  );
};

export default ModalBox;

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 16,
  },
  heading: {
    fontFamily: "RobotoCondensedBold",
    fontSize: 16,
    color: "#000000",
    textTransform: "uppercase",
    marginRight: 16,
  },
  props: {
    fontFamily: "RobotoRegular",
    fontSize: 16,
    color: "#000000",
  },
  modalStyles: {
    transform: [{ translateX: -50 as number }, { translateY: -0 as number}]
  }
});
