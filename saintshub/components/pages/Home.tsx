// import {
//     StyleSheet,
//     Text,
//     View,
//     SafeAreaView,
//     TouchableOpacity,
//     LayoutChangeEvent,
//     ScrollView,
//     Animated,
//     Easing,
//     NativeSyntheticEvent,
//     NativeScrollEvent,
// } from "react-native";

// import React, { useEffect } from "react";
// import {
//     ParamListBase,
//     useNavigation,
// } from "@react-navigation/native";
// import Menu from "@expo/vector-icons/Feather";
// import CloseIcon from "@expo/vector-icons/Fontisto";

// import Profile from "@expo/vector-icons/FontAwesome5";
// import { UserToken, UserState, shadowProps } from "../../utilities/tools";
// // import Latest from "../sections/Latest";
// // import DailyScripture from "../sections/DailyScripture";
// // import ModalBox from "../sections/Modal";
// import { useDispatch, useSelector } from "react-redux";
// import { updateSheet } from "../../hooks/redux/bottomSheet";
// import Loader from "../loaders/Loader";
// import SimpleContent from "../../components/sections/BottomSheet";
// import { windowHeight } from "../../utilities/types";
// import Stream from "../sections/Stream";
// import MultipleButtons from "../recycle/MultipleButtons";
// import {
//     DATA,
//     churches,
//     musicCategories,
//     offlines,
// } from "../../utilities/data";
// import MainDrawer from "../drawer/MainDrawer";
// import { Avatar, Card } from "react-native-paper";
// import LoaderB from "../sections/LoaderB";
// import SliderCard from "../drawer/SliderCard";
// import ComingSoonIcon from "../recycle/ComingSoonIcon";
// import VGR from "../sections/music/VGR";
// import GlobalStyles from "../recycle/styles/GlobalStyles";
// import musicBg from "../../assets/images/musicBg.jpg";
// import bibleBg from "../../assets/images/bible.png";
// import quote from "../../assets/images/quote.png";
// import sermon from "../../assets/images/sermon.png";
// import media from "../../assets/images/media.png";
// import audibleBible from "../../assets/images/audible_bible.png";
// import thebible from "../../assets/images/the_bible.png";
// import video_img from "../../assets/images/video.png";
// import pictures_img from "../../assets/images/pictures.png";
// import QhoteOfTheDay from "./quote/QuoteOfTheDay";
// import { openDrawer } from "../../hooks/redux/drawer/mainDrawer";
// import { setLoading } from "../../hooks/redux/loader/Loader";
// import LatestLive from "../sections/LatestLive";
// import VerseOfTheDay from "../sections/DayVerse";
// import Spacer from "../../tools/Spacer";
// import LiveModal from "../recycle/modals/LiveModal";
// import { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types";
// import { RootState } from "@/app/_layout";
// import { useRouter } from "expo-router";
// import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

// const Home = () => {
//     const dispatch = useDispatch();
//     const router = useRouter();

//     const [isLoading, setLoader] = React.useState<boolean>(true);
//     const [allSermons, setAllSermons] = React.useState<string[]>();
//     const [headerHeight, setHeaderHeight] = React.useState<number>(0);
//     const [isOffline, setIsOffline] = React.useState<Boolean>(false);
//     const [isDrawerOppen, setIsDrawerOpen] = React.useState<Boolean>(false);
//     const [services, setServices] = React.useState<string[]>();
//     const [musicButtons, setMusicButtons] = React.useState<number | null>(null);
//     const [allServicesButtonClicked, setAllServicesButtonClicked] =
//         React.useState<boolean>(false);
//     const [scrollValue, setScrollValue] = React.useState<number>(0);
//     const [headerBg, setHeaderBg] = React.useState<string>("#ffffff");
//     const [sideDrawer, setSideDrawer] = React.useState<boolean>(false);
//     const [openLiveModal, setOpenLiveModal] = React.useState<boolean>(false);

//     // LOADING
//     const { loading } = useSelector((state: RootState) => state.reducer.loading);

//     // USER DATA -> from redux state
//     const userData = useSelector((state: RootState) => state.reducer.updateUserData);
//     const { name, email, avatar, _id, surname, type } = userData;

//     const { sheetStatus, state } = useSelector(
//         (state: RootState) => state.reducer.bottomSheet
//     );
//     const { drawer } = useSelector(
//         (state: RootState) => state.reducer.mainDrawer
//     );

//     // **** ALL SERMONS ****
//     const { error, status, sermons } = useSelector(
//         (state: RootState) => state.reducer.sermonsSlice
//     );

//     const { modalVisible } = useSelector(
//         (state: RootState) => state.reducer.liveModal
//     );

//     // GET THE HEADER HEIGHT
//     const getHeaderHeight = (event: LayoutChangeEvent) => {
//         if (event.nativeEvent.layout.height > 0) {
//             setHeaderHeight(event.nativeEvent.layout.height);
//         }
//     };

//     const handleDrawer = () => {
//         dispatch(openDrawer());
//     };

//     const handleBible = () => {
//         dispatch(
//             updateSheet({
//                 sheetStatus: !sheetStatus,
//                 value: "bible",
//                 state: {
//                     allServices: false,
//                     offline: false,
//                     music: false,
//                     bible: true,
//                     media: false,
//                     quoteOfTheDay: false,
//                 },
//             })
//         );
//     };

//     const handleMedia = () => {
//         dispatch(
//             updateSheet({
//                 sheetStatus: !sheetStatus,
//                 value: "media",
//                 state: {
//                     allServices: false,
//                     offline: false,
//                     music: false,
//                     bible: false,
//                     media: true,
//                     quoteOfTheDay: false,
//                 },
//             })
//         );
//     };

//     const handleQuoteOfTheDay = () => {
//         dispatch(
//             updateSheet({
//                 sheetStatus: !sheetStatus,
//                 value: "QuoteOfTheDay",
//                 state: {
//                     allServices: false,
//                     offline: false,
//                     music: false,
//                     bible: false,
//                     media: false,
//                     quoteOfTheDay: true,
//                 },
//             })
//         );
//     };

//     const handleCloseQuote = () => {
//         dispatch(
//             updateSheet({
//                 sheetStatus: !sheetStatus,
//                 value: "QuoteOfTheDay",
//                 state: {
//                     allServices: false,
//                     offline: false,
//                     music: false,
//                     bible: false,
//                     media: false,
//                     quoteOfTheDay: false,
//                 },
//             })
//         );
//     };

//     // console.log("USER IMAGE " + JSON.stringify(user));

//     const handleAllServicesButtons = (index: number) => {
//         // console.log("USER IMAGE " + user);
//         // console.log('urls ' + JSON.stringify(DATA[index].sermons))
//         setAllServicesButtonClicked(!allServicesButtonClicked);
//         setServices(DATA[index].sermons);
//     };

//     const handleMusicButtons = (index: number) => {
//         setMusicButtons(index);
//         // You can add additional logic here if needed
//     };

//     const scrollY = useSharedValue(0);

//     const headerAnimatedStyle = useAnimatedStyle(() => {
//         if (scrollY.value >= 20) {
//             return {
//                 backgroundColor: withTiming("#f7f7f7f9")
//             };
//         }
//         return {
//             backgroundColor: withTiming("#ffffff")
//         };
//     });

//     const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
//         scrollY.value = event.nativeEvent.contentOffset.y;
//     };

//     React.useEffect(() => {
//         if (!userData || !Object.keys(userData).length) {
//             dispatch(setLoading(true));
//         } else {
//             dispatch(setLoading(false));
//         }
//     }, [userData, dispatch]);

//     // React.useEffect(() => {
//     //     handleScroll();
//     // }, [scrollValue]);

//     React.useEffect(() => {
//         setOpenLiveModal(modalVisible);
//     }, [modalVisible]);


//     useEffect(() => {
//         setSideDrawer(drawer);
//         console.log("DRWAER init: ", drawer);
//         console.log("DRWAER now: ", sideDrawer);
//     }, [drawer, sideDrawer]);

//     // const fadeAnim = React.useRef(new Animated.Value(0)).current;

//     // React.useEffect(() => {
//     //     Animated.timing(fadeAnim, {
//     //         toValue: 1,
//     //         duration: 1000, // in milliseconds
//     //         easing: Easing.ease, // Easing function, you can customize this
//     //         useNativeDriver: true, // set to true if you're using the native driver
//     //     }).start();
//     // }, [fadeAnim]);

//     // BIBLE
//     const bibleView = () => [
//         <View style={{ padding: 16 }}>
//             <Text style={styles.viewTitle}>Select Bible</Text>
//         </View>,

//         <Card
//             style={{
//                 marginLeft: 16,
//                 marginRight: 16,
//                 marginBottom: 16,
//                 marginTop: 16,
//             }}
//             onPress={() => router.push("/(bible)audibleBible")}
//         >
//             <Card.Cover
//                 source={audibleBible}
//                 resizeMode="stretch"
//                 style={{ height: 150 }}
//             />
//         </Card>,

//         <Card
//             style={{
//                 marginLeft: 16,
//                 marginRight: 16,
//                 marginBottom: 16,
//                 marginTop: 16,
//             }}
//             onPress={() =>router.push("/(bible)\bible")}
//         >
//             <Card.Cover
//                 source={thebible}
//                 resizeMode="stretch"
//                 style={{ height: 150 }}
//             />
//         </Card>,
//     ];

//     // MEDIA
//     const mediaView = () => [
//         <View style={{ padding: 16 }}>
//             <Text style={styles.viewTitle}>Select Media</Text>
//         </View>,

//         <Card
//             style={{
//                 marginLeft: 16,
//                 marginRight: 16,
//                 marginBottom: 16,
//                 marginTop: 16,
//             }}
//             onPress={() =>router.push("Video")}
//         >
//             <Card.Cover source={video_img} resizeMode="contain" />
//         </Card>,

//         <Card
//             style={{
//                 marginLeft: 16,
//                 marginRight: 16,
//                 marginBottom: 16,
//                 marginTop: 16,
//             }}
//             onPress={() =>router.push("Pictures")}
//         >
//             <Card.Cover source={pictures_img} resizeMode="contain" />
//         </Card>,
//     ];

//     // QUOTE
//     const quoteOfTheDay = () => [<QhoteOfTheDay />];

//     // All Services
//     const allServices = () => [
//         <View style={s.content__header} key="0">
//             <Text style={s.content__heading}>All Services</Text>
//             <Text style={s.content__subheading}>List of all sermons</Text>
//         </View>,

//         <View style={s.content__inside} key="1">
//             {status !== "loading" && (
//                 <MultipleButtons
//                     titles={churches}
//                     handleClick={handleAllServicesButtons}
//                 />
//             )}

//             <View>
//                 {status === "loading" && (
//                     <View
//                         style={{
//                             marginTop: 20,
//                             alignItems: "flex-start",
//                             alignContent: "flex-start",
//                             height: windowHeight / 2,
//                         }}
//                     >
//                         <LoaderB />
//                     </View>
//                 )}
//                 {status === "failed" && <Text>Error: {error}</Text>}
//             </View>

//             {status === "succeeded" && !allServicesButtonClicked && (
//                 <View
//                     style={{
//                         marginTop: 20,
//                     }}
//                 >
//                     {sermons.map((sermon, index) => (
//                         <View key={index}>
//                             <Stream hideButton stream={sermon} />
//                         </View>
//                     ))}
//                 </View>
//             )}

//             {status === "succeeded" && allServicesButtonClicked && (
//                 <View
//                     style={{
//                         marginTop: 20,
//                     }}
//                 >
//                     {!allServicesButtonClicked && <LoaderB />}

//                     {services?.map((service, index) => (
//                         <View key={index}>
//                             <Stream hideButton stream={service} />
//                         </View>
//                     ))}
//                 </View>
//             )}
//         </View>,
//     ];

//     // Offline
//     const offline = () => [
//         <View style={s.content__header} key="0">
//             <Text style={s.content__heading}>Your Downloads</Text>
//             <Text style={s.content__subheading}>Watch without internet</Text>
//         </View>,

//         <View style={s.content__inside} key="1">
//             {status !== "loading" && <MultipleButtons titles={offlines} />}

//             <View
//                 style={{
//                     marginTop: 20,
//                 }}
//             >
//                 {offlines.map((item, index) => (
//                     <View key={index}>
//                         <Text style={{ color: "#000000" }}>{item}</Text>
//                     </View>
//                 ))}
//             </View>
//         </View>,
//     ];

//     // Music
//     const music = () => [
//         <View style={s.content__header} key="0">
//             <Text style={s.content__heading}>All Music</Text>
//             <Text style={s.content__subheading}>List of all musics</Text>
//         </View>,

//         <View style={s.content__inside} key="1">
//             {status !== "loading" && (
//                 <MultipleButtons
//                     titles={musicCategories}
//                     disabledButtons={[true, false, true]}
//                     handleClick={handleMusicButtons}
//                 />
//             )}
//             {/* {status !== "loading" && <MultipleButtons titles={musicCategories}  disabledButtons={[false, true, false]} />} */}

//             <View>
//                 {status === "loading" && (
//                     <View
//                         style={{
//                             marginTop: 20,
//                             alignItems: "flex-start",
//                             alignContent: "flex-start",
//                             height: windowHeight / 2,
//                         }}
//                     >
//                         <Loader />
//                     </View>
//                 )}
//                 {status === "failed" && <Text>Error: {error}</Text>}
//             </View>

//             {status === "succeeded" && (
//                 <View
//                     style={{
//                         marginTop: 20,
//                     }}
//                 >
//                     <Text style={s.content__subheading}>DEMO</Text>
//                     <Text style={s.content__subheading}>DEMO</Text>
//                 </View>
//             )}

//             {musicButtons !== null && (
//                 <View style={{ marginTop: 20 }}>
//                     {/* Render the relevant component based on selectedButtonIndex */}
//                     {musicButtons === 0 && (
//                         <Text style={{ color: "red" }}>Component for Category 1</Text>
//                     )}
//                     {musicButtons === 1 && <VGR />}
//                     {musicButtons === 2 && (
//                         <Text style={{ color: "red" }}>Component for Category 3</Text>
//                     )}
//                 </View>
//             )}
//         </View>,
//     ];

//     return (
//         <View
//             style={{
//                 flex: 1,
//                 flexGrow: 1,
//                 zIndex: 1,
//                 position: "relative",
//             }}
//         >
//             {loading ? (
//                 <LoaderB />
//             ) : (
//                 <>
//                     {/* DRAWER */}
//                     {drawer && <MainDrawer />}

//                     <SafeAreaView style={[GlobalStyles.droidSafeArea, { position: "relative" }]}>
//                         {/* HEADER */}
//                         <View style={[GlobalStyles.SafeAreaPaddingTop, styles.header]} onLayout={getHeaderHeight}>
//                             <TouchableOpacity style={styles.menu} onPress={handleDrawer}>
//                                 <Menu name="menu" size={32} />
//                             </TouchableOpacity>

//                             <TouchableOpacity style={styles.profile}>
//                                 {avatar?.url ? (
//                                     <Avatar.Image size={45} source={{ uri: avatar.url }} />
//                                 ) : (
//                                     <View style={styles.profileContainer}>
//                                         <View style={[shadowProps, styles.profileWrapper]}>
//                                             <Profile name="user-alt" size={18} color="#ffffff" />
//                                         </View>
//                                     </View>
//                                 )}
//                             </TouchableOpacity>
//                         </View>

//                         {/* Main Content */}
//                         <ScrollView
//                             onScroll={handleScroll}
//                             scrollEventThrottle={16}
//                             style={{ paddingTop: 0 }}
//                         >
//                             <View style={{ flex: 1 }}>
//                                 <View style={[{ marginTop: headerHeight - 40 }, styles.headerTitlte]}>
//                                     <Text style={styles.Htitle}>
//                                         God bless, {name || "Guest"}
//                                     </Text>
//                                 </View>

//                                 {/* <View style={styles.update}>
//                                     <SliderCard />
//                                 </View> */}

                               
//                             </View>

//                             {/* <VideoPlay /> */}

//                             <View style={styles.article}>
//                                 <LatestLive />

//                                 <Card
//                                     style={{
//                                         marginLeft: 16,
//                                         marginRight: 16,
//                                         marginBottom: 16,
//                                         marginTop: 16,
//                                     }}
//                                     onPress={() => handleBible()}
//                                 >
//                                     <Card.Cover source={bibleBg} resizeMode="stretch" />
//                                 </Card>

//                                 <VerseOfTheDay />

//                                 <Spacer />

//                                 {/* <DailyScripture /> */}

//                                 <Card
//                                     style={{
//                                         marginLeft: 16,
//                                         marginRight: 16,
//                                         marginBottom: 20,
//                                         marginTop: 20,
//                                     }}
//                                     onPress={() =>router.push("VGR")}
//                                 >
//                                     <Card.Cover source={musicBg} />
//                                 </Card>

//                                 <Card
//                                     style={{ margin: 16 }}
//                                     onPress={() => handleQuoteOfTheDay()}
//                                 >
//                                     <Card.Cover source={quote} resizeMode="stretch" />
//                                 </Card>

//                                 <Card
//                                     style={{ margin: 16 }}
//                                     onPress={() =>router.push("Sermon")}
//                                 >
//                                     <Card.Cover source={sermon} resizeMode="stretch" />
//                                 </Card>

//                                 <Card
//                                     style={{ margin: 16, marginBottom: 40 }}
//                                     onPress={() => handleMedia()}
//                                 >
//                                     <Card.Cover source={media} resizeMode="stretch" />
//                                 </Card>
//                             </View>
//                         </ScrollView>
//                         {/* <ModalBox /> */}

//                         {/* <BottomSheet /> */}
//                         {state.quoteOfTheDay && (
//                             <>
//                                 <QhoteOfTheDay />
//                                 <View style={styles.overlay}>
//                                     <CloseIcon
//                                         name="close-a"
//                                         size={32}
//                                         onPress={() => handleCloseQuote()}
//                                         color="#fff"
//                                         style={styles.closeIcon}
//                                     />
//                                 </View>
//                             </>
//                         )}
//                     </SafeAreaView>

//                     {state.allServices && <SimpleContent components={allServices()} />}
//                     {state.offline && <SimpleContent components={offline()} />}
//                     {/* {state.music && <SimpleContent components={music()} />} */}

//                     {/* {sheetStatus && <SimpleContent components={allServices()} />}
//         {isOffline && <SimpleContent components={offline()} />} */}

//                     {state.bible && <SimpleContent components={bibleView()} />}
//                     {state.media && <SimpleContent components={mediaView()} />}
//                     {openLiveModal && <LiveModal />}
//                 </>
//             )}
//         </View>
//     );
// };

// export default Home;

// const styles = StyleSheet.create({
//     overlay: {
//         position: "absolute",
//         backgroundColor: "#363636",
//         width: "100%",
//         height: "100%",
//         opacity: 0.8,
//     },
//     loginImage: {
//         width: 100,
//         height: 100,
//         resizeMode: "contain",
//         // borderBottomLeftRadius: 125,
//         // borderBottomRightRadius: 125,
//     },
//     yTube: {
//         position: "absolute",
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         justifyContent: "center",
//         alignItems: "center",
//     },
//     shortBtn_active: {
//         alignItems: "center",
//         justifyContent: "center",
//         paddingVertical: 12,
//         paddingHorizontal: 32,
//         borderRadius: 4,
//         elevation: 3,
//         height: 50,
//         // marginRight: 0,
//     },
//     shortBtn: {
//         alignItems: "center",
//         justifyContent: "center",
//         paddingVertical: 12,
//         paddingHorizontal: 32,
//         borderRadius: 4,
//         elevation: 3,
//         backgroundColor: "black",
//         height: 50,
//         marginRight: 12,
//     },
//     sBtn: {
//         fontSize: 16,
//         fontWeight: "bold",
//         letterSpacing: 0.25,
//         color: "white",
//     },
//     sBtn__comingSoon: {
//         position: "absolute",
//         top: -10,
//         left: 0,
//         fontSize: 16,
//         fontWeight: "bold",
//         letterSpacing: 0.25,
//         color: "red",
//     },
//     header: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         alignItems: "center",
//         flex: 0.2,
//         padding: 16,
//         position: "absolute",
//         top: 0,
//         width: "100%",
//         zIndex: 9,
//         backgroundColor: "#ffffff",
//         // backgroundColor: 'transparent',
//         // 	blurEffect: 'systemMaterialLight',
//         //   headerTranslucent: Platform.OS === 'ios',
//         // statusBarStyle: 'dark',
//         // headerHideShadow: true,
//     },
//     headerTitlte: {
//         // backgroundColor: "#1b79b0",
//         width: "100%",
//         paddingTop: 5,
//         paddingLeft: 16,
//         paddingBottom: 5,
//         paddingRight: 16,
//     },
//     Htitle: {
//         fontSize: 24,
//         color: "#000000",
//         fontFamily: "RobotoMedium",
//     },
//     viewTitle: {
//         fontSize: 32,
//         color: "#000000",
//         fontFamily: "RobotoBlack",
//     },
//     menu: {},
//     profile: {},
//     profileContainer: {
//         backgroundColor: "#ffffff",
//         padding: 2,
//         borderRadius: 50,
//     },
//     profileWrapper: {
//         backgroundColor: "#FF1A4B",
//         padding: 8,
//         borderRadius: 50,
//     },
//     update: {
//         flex: 1,
//         //padding: 16,
//         // backgroundColor: "#475c29",
//     },
//     imageBox: {
//         resizeMode: "cover",
//         justifyContent: "center",
//         position: "relative",
//         borderRadius: 15,
//         height: 200,
//     },
//     boxTitle: {
//         padding: 8,
//         backgroundColor: "#FF1A4B",
//         color: "#000000",
//         width: 80,
//         borderRadius: 8,
//         marginBottom: 12,
//     },
//     bTitle: {
//         color: "#ffffff",
//         fontSize: 21,
//         fontFamily: "RobotoRegular",
//         textAlign: "center",
//     },
//     boxContent: {
//         marginBottom: 12,
//     },
//     bContent: {
//         color: "#ffffff",
//         fontSize: 16,
//         fontFamily: "RobotoMedium",
//     },
//     boxProps: {
//         flexDirection: "row",
//         justifyContent: "flex-start",
//         width: 70,
//         alignItems: "center",
//     },
//     boxWrapper: {
//         // flex: 1,
//         // backgroundColor: "#00000043",
//         // borderRadius: 15,
//         position: "absolute",
//         bottom: 15,
//         left: 16,
//     },
//     boxWrapper_i: {
//         backgroundColor: "#00000083",
//         borderRadius: 15,
//         height: 200,
//     },
//     bProps_1: {
//         backgroundColor: "#FF1A4B",
//         width: 30,
//         height: 6,
//         marginRight: 5,
//         borderRadius: 50,
//     },
//     bProps_2: {
//         backgroundColor: "#d0d0d0",
//         width: 10,
//         height: 8,
//         marginRight: 5,
//         borderRadius: 50,
//     },
//     bProps_3: {
//         backgroundColor: "#d0d0d0",
//         width: 10,
//         height: 8,
//         marginRight: 5,
//         borderRadius: 50,
//     },
//     bProps_4: {
//         backgroundColor: "#d0d0d0",
//         width: 10,
//         height: 8,
//         borderRadius: 50,
//     },
//     article: {
//         flex: 1,
//         // backgroundColor: "#0a461b",
//     },
//     closeIcon: {
//         position: "absolute",
//         right: 20,
//         top: 20,
//     },
// });

// // Sheet
// const s = StyleSheet.create({
//     content__header: {
//         padding: 15,
//         paddingBottom: 0,

//         backgroundColor: "rgba(255, 255, 255, 0.85)",
//         borderTopLeftRadius: 15,
//         borderTopRightRadius: 15,
//     },

//     content__heading: {
//         marginBottom: 2,

//         fontSize: 24,
//         fontWeight: "600",
//         color: "#333",
//     },

//     content__subheading: {
//         marginBottom: 20,

//         fontSize: 16,
//         color: "#ccc",
//     },

//     content__inside: {
//         padding: 15,
//     },

//     content__paragraph: {
//         fontSize: 15,
//         fontWeight: "200",
//         lineHeight: 22,
//         color: "#000",
//     },

//     content__scrollview: {
//         marginVertical: 20,
//     },

//     content__block: {
//         width: 200,
//         height: 80,

//         marginRight: 20,

//         backgroundColor: "#ccc",
//     },

//     content__input: {
//         paddingVertical: 15,
//         marginBottom: 10,

//         width: "100%",

//         borderWidth: 1,
//         borderColor: "transparent",
//         borderBottomColor: "#cdcdcd",
//         borderRadius: 6,
//     },
// });
