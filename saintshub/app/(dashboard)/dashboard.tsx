import { Alert, ImageBackground, StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import Menu from "@expo/vector-icons/MaterialIcons";
import { Avatar } from "react-native-paper";
import { ScrollView } from "react-native";
import { Button } from "react-native-paper";
import { ParamListBase, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/app/_layout";
import { setLoading } from "@/hooks/redux/loader/Loader";
import LoaderB from "../../components/sections/LoaderB";
import { Church, CHURCH_DB, shadowProps } from "@/utilities/tools";
import { getAllChurch } from "@/tools/dashboard/getAllChurch";
import { getChurch } from "@/tools/dashboard/getChurch";
import { FlatList } from "react-native";
import { FontAwesome } from '@expo/vector-icons';
import { REMOVE_CHURCH_FAIL } from "../../constants/userConstants";
import { removeChurch } from "@/tools/dashboard/removeChurch";
import { useRouter } from "expo-router";
import { Image as ExpoImage } from 'expo-image';
import GlobalStyles from "@/components/recycle/styles/GlobalStyles";

const Dashboard = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [user, setUser] = React.useState<{ name: string; avatar: { url: string } }>({
    name: "",
    avatar: {
      url: "",
    },
  });

  const [formData, setFormData] = React.useState<CHURCH_DB[]>([]);
  const [loader, setLoader] = React.useState<boolean>(true)

  // LOADING
  const { loading } = useSelector((state: RootState) => state.reducer.loading);
  const { name, email, avatar, password, surname } = useSelector((state: RootState) => state.reducer.updateUserData);

  const handleGetChurches = async () => {
    const token = await AsyncStorage.getItem("token");
    //console.log(token);

    if (!token) {
      router.push("/(auth)/login");
    } else {
      await getAllChurch(token)
        .then((data: CHURCH_DB[]) => setFormData(data))
        .finally(() => setLoader(false))
        .catch((error: Error) => console.error(error));
    }
  };

  const handleChurchClick = async (_id: string) => {
    setLoader(true)
    const token = await AsyncStorage.getItem("token");
    // console.log("ITEM ID: ", _id);

    if (token) {
      setTimeout(() => {
        getChurch({ authToken: token, id: _id })
          .then((data: Church) => {
            setLoader(false)
            //  console.log("TESTING: ", _id);
            router.push({
              pathname: "/church", 
              params: { data: JSON.stringify(data) }
            })
          })
          .catch((error: Error) => console.error(error?.message));
      }, 4000);
    }

    //router.push("SingleChurch")
  };

  const handleRemoveChurch = async (id: string) => {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");

    Alert.alert('DELETE CHURCH', 'You are about to DELETE this church Permanently. Are You Sure to proceed?', [
      {
        text: 'Cancel',
        onPress: () => {
          setLoading(false); // Set loading to false if user cancels
          console.log('Cancel Pressed');
        },
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: async () => {
          if (token) {
            await removeChurch({ authToken: token, id: id })
              .then(() => {
                // Success message or further actions after deletion
                handleGetChurches()
              })
              .catch((err: Error) => {
                Alert.alert(err.message); // Alert if removal fails
              });
          } else {
            alert(REMOVE_CHURCH_FAIL);
          }
          setLoading(false); // Set loading to false after removal
        }
      }
    ]);
  }

  React.useEffect(() => {
    setUser({ ...user, name: name, avatar: avatar });
  }, [name, avatar]);

  useEffect(() => {
    const resetSTorage = async () => {
      await AsyncStorage.multiRemove(["deaconData", "trusteeData", "pastServices", "liveServices", "songsServices"]);
      console.log("STORAGE RESET");
    };

    resetSTorage();
  }, []);

  useEffect(() => {
    handleGetChurches()
  }, []);

  if (!name && !avatar) {
    dispatch(setLoading(true));
  } else {
    dispatch(setLoading(false));
  }

  // useEffect(() => {
  //   setLoader(loading)
  // }, [loading, loader])

  // console.log("CHURCH DATA LISTko: ", JSON.stringify(formData));

  return (
    <ScrollView style={[GlobalStyles.SafeAreaPaddingTop, { position: "relative",  backgroundColor: "#E0E5E9", flex: 1, width: "100%" }]}>
      {loader ? (
        <LoaderB defaultVisible />
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.menu}>
              <TouchableOpacity style={styles.menuWrapper} onPress={() => router.back()}>
                <Menu name="arrow-back-ios" size={25} />
              </TouchableOpacity>
            </View>

            <View style={styles.avatar}>
              <Avatar.Image size={80} source={{ uri: user.avatar.url }} />
            </View>
          </View>

          <View style={styles.headerBottom}>
            <Text style={styles.headerText}>Hi {user.name}</Text>
            <Text style={styles.headerSubText}>Whats would you like to do ?</Text>
          </View>

          <View style={styles.space}>
            <Text style={styles.spaceWrapper}>Available Space</Text>
          </View>

          <View style={{ marginLeft: 8, marginTop: 16 }}>
              <FlatList
                scrollEnabled={true}
                //horizontal
                horizontal={true}
                //numColumns={2}
                showsHorizontalScrollIndicator={false}
                data={formData}
                renderItem={({ item, index }) => (
                  // <Item title={item.title} pastor={item.pastor} location={item.location} image={item.image} churchName={item.churchName} stream={item.stream} itemBg={itemBg} removeLive={removeLive} />
                  <TouchableOpacity style={[shadowProps, styles.itemContainer, { backgroundColor: "#ffffff" }]} key={index} onPress={() => handleChurchClick(item._id)}>
                    <View style={styles.logoWrapper}>
                      <ImageBackground
                        source={{ uri: item.logo }}
                        resizeMode="cover"
                        // imageStyle={{ backgroundColor: "#e7b10173" }}
                        style={{ width: 100, height: 100 }}
                      ></ImageBackground>
                    </View>

                    <View style={styles.heading}>
                      <Text style={styles.title}>{item.name}</Text>
                    </View>

                    <View style={[{ backgroundColor: '#be0404', padding: 15, borderRadius: 50, position: 'absolute', top: 8, right: 8 }, styles.raised]}>
                      <FontAwesome
                        size={20}
                        name="trash"
                        color="#ffffff"
                        onPress={() => handleRemoveChurch(item._id)}
                      />
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item._id}
                style={{ paddingBottom: 16 }}
              />
              {/* <Button
                mode="contained"
                onPress={() => router.push("/(dashboard)/createChurch")}
                style={[{
                  marginTop: 20,
                  marginHorizontal: 16,
                  backgroundColor: '#030303',
                  paddingVertical: 8,
                }, styles.buttonPressed]}
                labelStyle={{ color: '#fff', fontSize: 16 }}
              >
                Create Space
              </Button> */}
              <Button
                mode="contained"
                // onPress={() => router.push("/(dashboard)/(create)/church")}
                onPress={() => router.push("/(dashboard)/(create)/ChurchForm")}
                style={[{
                  marginTop: 20,
                  marginHorizontal: 16,
                  backgroundColor: '#030303',
                  paddingVertical: 8,
                }, styles.buttonPressed]}
                labelStyle={{ color: '#fff', fontSize: 16 }}
              >
                Create Space
              </Button>
            </View>
          
          <View style={[styles.space, { marginBottom: 40 }]}>
            <Text style={[styles.spaceWrapper, { marginBottom: 20 }]}>Created Space</Text>
            <View style={[shadowProps, styles.gifContainer]}>
              <ExpoImage 
                source={require("../../assets/animated/dashboard/created_space_not_available.gif")}
                style={{ width: 200, height: 200, alignSelf: 'center' }}
                contentFit="contain"
              />
              <Text style={styles.noSpaceText}>You have not created any Space</Text>
            </View>
          </View>
        </>

      )}
    </ScrollView>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#E0E5E9",
    flex: 1,
    width: "100%",
  },
  menu: {
    flex: 1,
  },
  menuWrapper: {
    padding: 8,
  },
  avatar: {
    marginRight: 16,
  },
  itemContainer: {
    padding: 16,
    borderRadius: 10,
    flexDirection: "column",
    justifyContent: "space-between",
    marginHorizontal: 10,
    position: "relative",
    elevation: 7,
    marginBottom: 10,
    //borderWidth: 1
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 0,
    paddingHorizontal: 16,
    backgroundColor: "#E0E5E9",
    width: "100%",
  },
  headerBottom: {
    paddingTop: 30,
    paddingLeft: 15,
    paddingRight: 15,
  },
  headerText: {
    fontSize: 28,
    lineHeight: 60,
    color: "#000000",
    fontFamily: "RobotoMedium",
  },
  headerSubText: {
    fontSize: 20,
    color: "#878893",
    fontFamily: "RobotoMedium",
  },
  space: {
    marginTop: 60,
    paddingLeft: 15,
    paddingRight: 15,
  },
  spaceWrapper: {
    fontSize: 20,
    color: "#000000",
    fontFamily: "RobotoMedium",
    textTransform: "uppercase",
  },
  heading: {},
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    // backgroundColor: "#ffffff",
  },
  image: {
    width: "100%",
    height: 100,
  },
  title: {
    fontSize: 15,
    color: "#000000",
    fontFamily: "RobotoMedium",
  },
  raised: {
    elevation: 3,
  },
  gifContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 5,
  },
  noSpaceText: {
    fontSize: 16,
    color: '#878893',
    fontFamily: 'RobotoMedium',
    textAlign: 'center',
    marginTop: 16
  },
  buttonPressed: {
    // Add styles for buttonPressed here
  }
});
