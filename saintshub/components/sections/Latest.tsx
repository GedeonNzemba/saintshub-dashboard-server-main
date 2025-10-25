import { FlatList, ImageBackground, ImageSourcePropType, Pressable, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React, { useEffect } from "react";
import { shadowProps } from "../../utilities/tools";
import Strips from "./Strips";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../app/_layout";
import { showModal } from "../../hooks/redux/videoModalSlice";
import { OPEN_MODAL } from "../../constants/modalConstant";
import { DATA } from "../../utilities/data";

interface ItemProps {
  title: string;
  pastor: string;
  location: string;
  image: ImageSourcePropType;
  churchName: string;
  stream: string;
  itemBg?: string;
  removeLive?: boolean;
}

interface IProps {
  itemBg?: string;
  removeLive?: boolean;
}

const Item = ({ churchName, stream, title, pastor, location, image, itemBg, removeLive }: ItemProps) => {
  const count = useSelector((state: RootState) => state.reducer.modal.modalVisible);
  const dispatch = useDispatch();

  const handleClick = () => {
    console.log("clicked");
    dispatch(
      showModal({
        modalVisible: OPEN_MODAL,
        churchName: churchName,
        title: title,
        stream: stream,
      })
    );
  };

  return (
    <TouchableOpacity style={[shadowProps, styles.itemContainer, {backgroundColor: itemBg ? itemBg : '#e6e6e6'}]} onPress={() => handleClick()}>
      <View style={styles.logoWrapper}>
        <ImageBackground
          source={image}
          resizeMode="cover"
          // imageStyle={{ backgroundColor: "#e7b10173" }}
          style={styles.image}
        ></ImageBackground>
      </View>

      <View style={styles.heading}>
        <Text style={styles.title}>{churchName}</Text>
      </View>

      {!removeLive && <Strips title="Live" />}
    </TouchableOpacity>
  );
};

const Latest = ({ itemBg, removeLive = false }: IProps) => {
  // const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  // const [formData, setFormData] = React.useState<CHURCH_DB[]>([]);

  const { modalVisible, title } = useSelector((state: RootState) => state.reducer.modal);

  // const handleGetChurches = async () => {
  //   const token = await AsyncStorage.getItem("token");
  //   //console.log(token);

  //   if (!token) {
  //     navigation.navigate("Init");
  //   } else {
  //     await getAllChurch(token)
  //       .then((data) => setFormData(data))
  //       .catch((error) => console.error(error));
  //   }
  // };

  useEffect(() => {
    // console.log("UseEff =", modalVisible);
    // console.log("Title =", title);
  }, [modalVisible, title]);

  return (
    <View style={{ marginLeft: 8, marginTop: 16 }}>
      <FlatList
        scrollEnabled={true}
        //horizontal
        horizontal={true}
        //numColumns={2}
        showsHorizontalScrollIndicator={false}
        data={DATA}
        renderItem={({ item }) => <Item title={item.title} pastor={item.pastor} location={item.location} image={item.image} churchName={item.churchName} stream={item.stream} itemBg={itemBg} removeLive={removeLive} />}
        keyExtractor={(item) => item.title}
        style={{ paddingBottom: 16 }}
      />
    </View>
  );
};

export default Latest;

const styles = StyleSheet.create({
  church: {},
  itemContainer: {
    padding: 16,
    borderRadius: 10,
    flexDirection: "column",
    justifyContent: "space-between",
    marginHorizontal: 10,
    position: "relative",
    elevation: 7,
    marginBottom: 10
    //borderWidth: 1
  },
  heading: {},
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    // backgroundColor: "#ffffff",
  },
  image: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 15,
    color: "#000000",
    fontFamily: "RobotoMedium",
  },
});
