import React, { useRef, forwardRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
} from "react-native";
import { Modalize } from "react-native-modalize";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/_layout";
import { updateSheet } from "../../hooks/redux/bottomSheet";

interface Props {
  components: JSX.Element[];
}

const SimpleContent: React.FC<Props> = ({ components }) => {
  const dispatch = useDispatch();

  const { sheetStatus } = useSelector((state: RootState) => state.reducer.bottomSheet);

  const modalizeRef = useRef<Modalize>(null);

  const resetModalStatus = () => {
    dispatch(
      updateSheet({
        sheetStatus: !sheetStatus,
        value: "",
        state: {
          allServices: false,
          offline: false,
          music: false,
        },
      })
    );
    //dispatch(closeSheet);
    console.info("Modal closed");
  };

  // const onOpen = () => {
  //   modalizeRef.current?.open();
  // };

  React.useEffect(() => {
    modalizeRef.current?.open();

    return () => {
      modalizeRef.current?.close();
    };
  }, []);

  const renderContent = () => [
    <View style={s.content__header} key="0">
      <Text style={s.content__heading}>Article title</Text>
      <Text style={s.content__subheading}>November 11st 2018</Text>
    </View>,

    <View style={s.content__inside} key="1">
      <Text style={s.content__paragraph}>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi magni
        ratione accusantium quis ipsa qui tenetur unde obcaecati voluptatum,
        maxime eos natus impedit, odio nesciunt saepe? Quae quis atque
        voluptates optio, inventore vel nam reprehenderit iure nulla?
        Necessitatibus, accusantium illo.
      </Text>
      <Text style={[s.content__subheading, { marginTop: 30 }]}>
        Horizontal ScrollView
      </Text>

      <ScrollView style={s.content__scrollview} horizontal>
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <View key={i} style={s.content__block} />
          ))}
      </ScrollView>

      <Text style={s.content__paragraph}>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Culpa provident
        impedit eius at dignissimos nulla consectetur minima, minus maxime.
        Vitae minima molestiae magnam accusamus sapiente eveniet vero unde. Nemo
        porro natus nihil eaque dolore impedit tempora illo repellendus
        reiciendis fugit cum sapiente iste exercitationem suscipit nobis libero,
        pariatur assumenda iusto?
      </Text>

      <Text style={s.content__paragraph}>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Exercitationem
        corporis cumque dolore dolor excepturi corrupti!
      </Text>

      <TextInput
        style={s.content__input}
        placeholder="Type your username"
        clearButtonMode="while-editing"
      />
    </View>,
  ];

  return (
    // <View
    //   style={{
    //     height: windowHeight,
    //     // borderColor: "red",
    //     // borderWidth: 3,
    //   }}
    // >
    // {/* <TouchableOpacity
    //   style={{
    //     backgroundColor: "#25054f",
    //     padding: 10,
    //     maxWidth: 150,
    //     borderRadius: 10,
    //   }}
    //   onPress={onOpen}
    // >
    //   <Text style={{ color: "#ffffff" }}>Open the modal</Text>
    // </TouchableOpacity> */}

    <Modalize
      ref={modalizeRef}
      snapPoint={550}
      //adjustToContentHeight
      scrollViewProps={{
        showsVerticalScrollIndicator: false,
        stickyHeaderIndices: [0],
      }}
      onClose={() => resetModalStatus()}
    >
      {components}
    </Modalize>
    // </View>
  );
};
export default SimpleContent;

const s = StyleSheet.create({
  content__header: {
    padding: 15,
    paddingBottom: 0,

    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },

  content__heading: {
    marginBottom: 2,

    fontSize: 24,
    fontWeight: "600",
    color: "#333",
  },

  content__subheading: {
    marginBottom: 20,

    fontSize: 16,
    color: "#ccc",
  },

  content__inside: {
    padding: 15,
  },

  content__paragraph: {
    fontSize: 15,
    fontWeight: "200",
    lineHeight: 22,
    color: "#000",
  },

  content__scrollview: {
    marginVertical: 20,
  },

  content__block: {
    width: 200,
    height: 80,

    marginRight: 20,

    backgroundColor: "#ccc",
  },

  content__input: {
    paddingVertical: 15,
    marginBottom: 10,

    width: "100%",

    borderWidth: 1,
    borderColor: "transparent",
    borderBottomColor: "#cdcdcd",
    borderRadius: 6,
  },
});
