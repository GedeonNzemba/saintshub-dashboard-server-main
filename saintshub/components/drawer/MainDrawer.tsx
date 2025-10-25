import * as React from "react";
import { ImageBackground, Platform, SafeAreaView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, Button, Drawer } from "react-native-paper";
import { windowHeight, windowWidth } from "../../utilities/types";
import { Animated } from "react-native";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/_layout";
import Icon from "@expo/vector-icons/FontAwesome";
import IconA from "@expo/vector-icons/MaterialCommunityIcons";
import IconB from "@expo/vector-icons/MaterialIcons";
import Menu from "@expo/vector-icons/Fontisto";
import { Text } from "react-native";
import { ParamListBase, useFocusEffect, useNavigation } from "@react-navigation/native";
import { logoutUser } from "../../tools/users/signout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RANDOM_AVATAR_URI, StackNavigation, User } from "../../utilities/tools";
import LoaderB from "../sections/LoaderB";
import { closeDrawer } from "../../hooks/redux/drawer/mainDrawer";
import { setLoading } from "../../hooks/redux/loader/Loader";
import { LOGOUT_FAIL } from "../../constants/userConstants";
import LottieView from "lottie-react-native";
import { BlurView } from 'expo-blur';
import { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";

const MainDrawer: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [buttonStates, setButtonStates] = React.useState({
    dashboard: false,
    signOut: false
  });

  const { loading } = useSelector((state: RootState) => state.reducer.loading, shallowEqual);
  const userData = useSelector((state: RootState) => state.reducer.updateUserData, shallowEqual);
  
  const user = React.useMemo(() => ({
    name: userData.name || "",
    surname: userData.surname || "",
    email: userData.email || "",
    avatar: {
      url: userData.avatar?.url || ""
    },
    admin: userData.admin || false
  }), [userData]);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const handleSignOut = React.useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.push("/(auth)/login");
        return;
      }

      dispatch(setLoading(true));
      await logoutUser(token);
      await AsyncStorage.removeItem("token");
      router.push("/(auth)/login");
    } catch (error) {
      console.error(LOGOUT_FAIL, error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, router]);

  const handleDrawer = React.useCallback(() => {
    dispatch(closeDrawer());
  }, [dispatch]);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();

    return () => {
      fadeAnim.setValue(0);
    };
  }, [fadeAnim]);

  React.useEffect(() => {
    const hasUserData = Boolean(userData.name && userData.email && userData.password && userData.avatar);
    dispatch(setLoading(!hasUserData));
  }, [userData, dispatch]);

  const Content = React.memo(() => (
    <React.Fragment>
      {/* CLOSE BUTTON */}
      <View style={{ position: 'absolute', right: 25, top: 50, zIndex: 999 }}>
        <TouchableOpacity style={styles.menu} onPress={() => handleDrawer()}>
          <Menu name="close-a" color={"#fff"} size={18} />
        </TouchableOpacity>
      </View>

      <SafeAreaView style={{ paddingTop: insets.top,  justifyContent: 'space-evenly', height: windowHeight }}>
        {/* AVATAR */}
        <Drawer.Section style={[styles.drawerSection, {  paddingLeft: 25, paddingRight: 25, marginBottom: 25}]}>
          <TouchableOpacity style={[styles.rowContainer, { marginTop: 20, marginBottom: 20, paddingLeft: 0 }]}>
          <View style={styles.profileimage}>

            {user.avatar.url && (
              <Avatar.Image
                size={84}
                source={{ uri: user.avatar.url }}
              />
            )}

            {!user.avatar.url && (
              <Avatar.Image
              size={84}
              source={{ uri: RANDOM_AVATAR_URI }}
            />
            )}

            {/* <View style={styles.accountMasterIcon}>
              <LottieView source={require("../../assets/images/user_account.json")} autoPlay loop />
            </View> */}
          </View>
          </TouchableOpacity>
        </Drawer.Section>

        {/* My Information */}
        <Drawer.Section style={[styles.drawerSection, { paddingLeft: 25, paddingRight: 25, marginBottom: 25}]}>
          <Text style={[styles.headerTitle, {marginBottom: 15}]}>My Information</Text>

          <TouchableOpacity style={[styles.rowContainer, { marginTop: 18, paddingLeft: 0 }]}>
            <View style={styles.rowContainer}>
              <View style={styles.iconWrapper}>
                <Icon name="user" color={"#010101"} size={24} />
              </View>
              <View style={styles.titleWrapper}>
                <Text style={styles.title}>{`${user.name} ${user.surname}`}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.rowContainer, { marginTop: 18, paddingLeft: 0 }]}>
            <View style={[styles.rowContainer]}>
              <View style={styles.iconWrapper}>
                <IconA name="email" color={"#010101"} size={24} />
              </View>
              <View style={styles.titleWrapper}>
                <Text style={styles.title}>{`${user.email}`}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.rowContainer, { marginTop: 18, marginBottom: 25, paddingLeft: 0 }]}>
            <View style={[styles.rowContainer]}>
              <View style={styles.iconWrapper}>
                <IconB name="admin-panel-settings" color={"#010101"} size={24} />
              </View>
              <View style={styles.titleWrapper}>
                <Text style={styles.title}>Admin</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Drawer.Section>

        {/* Account Settings */}
        <Drawer.Section style={[styles.drawerSection, { paddingLeft: 25, paddingRight: 25, marginBottom: 25}]}>
          <Text style={[styles.headerTitle, {marginBottom: 15}]}>Account Settings</Text>

          <TouchableOpacity style={[styles.rowContainer, { marginTop: 18, paddingLeft: 0 }]} onPress={() => router.push({ pathname: "/(dashboard)/updateUserSecurity", params: { password: userData.password } })}>
            <View style={styles.iconWrapper}>
              <IconA name="security" color={"#010101"} size={24} />
            </View>
            <View style={styles.titleWrapper}>
              <Text style={styles.title}>Update Password</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.rowContainer, { marginTop: 18, paddingLeft: 0 }]} onPress={() => router.push({ pathname: "/(dashboard)\\updateUserAvatar", params: { avatar: userData.avatar.url }})}>
            <View style={styles.iconWrapper}>
              <IconA name="face-man-profile" color={"#010101"} size={24} />
            </View>
            <View style={styles.titleWrapper}>
              <Text style={styles.title}>Avatar Profile</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.rowContainer, { marginTop: 18, marginBottom: 25, paddingLeft: 0 }]} onPress={() => router.push({ pathname: "/(dashboard)\\updateUserInfo", params: { name: userData.name, surname: userData.surname, email: userData.email }})}>
            <View style={styles.iconWrapper}>
              <IconA name="card-account-details-star-outline" color={"#010101"} size={24} />
            </View>
            <View style={styles.titleWrapper}>
              <Text style={styles.title}>Personal details</Text>
            </View>
          </TouchableOpacity>
        </Drawer.Section>

        {/* ACTION */}
        <Drawer.Section style={[styles.drawerSection, { paddingLeft: 25, paddingRight: 25, justifyContent: 'space-between' }]}>
          <Text style={[styles.headerTitle, {marginBottom: 15}]}>Action</Text>
          <Button
            icon="update"
            mode="contained"
            onPress={() => router.push("/(dashboard)/dashboard")}
            style={[styles.actionButton, buttonStates.dashboard && styles.buttonPressed]}
            labelStyle={styles.buttonLabel}
            contentStyle={styles.buttonContent}
            theme={{ colors: { primary: '#fff' } }}
          >
            Dashboard
          </Button>

          <Button
            icon="logout"
            mode="contained"
            onPress={handleSignOut}
            style={[styles.actionButton, styles.signOutButton, buttonStates.signOut && styles.buttonPressed]}
            labelStyle={styles.buttonLabel}
            contentStyle={styles.buttonContent}
            theme={{ colors: { primary: '#fff' } }}
          >
            Sign Out
          </Button>
        </Drawer.Section>
      </SafeAreaView>
    </React.Fragment>
  ));

  return (
    <>
      {loading && <LoaderB />}
      {!loading && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.animatedContainer,
            { opacity: fadeAnim }
          ]}
        >
          {Platform.OS === 'android' ? (
            <View style={[styles.blurWrapperAndroid, styles.androidBackground]}>
              <Content />
            </View>
          ) : (
            <BlurView intensity={100} tint="light" style={styles.blurWrapper}>
              <Content />
            </BlurView>
          )}
        </Animated.View>
      )}
    </>
  );
};

export default React.memo(MainDrawer);

const styles = StyleSheet.create({
  drawerSection: {
    // borderWidth: 2,
    // borderColor: "#1e08af",
  },
  profileimage: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    position: "relative",
  },
  rowContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: 'center'
  },
  menu: {
    backgroundColor: "#000000",
    borderRadius: 50,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  iconWrapper: {},
  titleWrapper: {
    marginLeft: 16,
    // whiteSpace: 'nowrap',
    overflow: 'hidden',
    // textOverflow: 'ellipsis',
    maxWidth: 200,
  },
  title: {
    fontSize: 18,
    color: "#000000",
    fontFamily: "RobotoMedium",
  },
  headerTitle: {
    fontSize: 20,
    color: "#000000",
    fontFamily: "RobotoCondensedBold",
  },
  accountMasterIcon: {
    position: 'absolute',
    bottom: -40,
    right: 30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff14'
  },
  actionBtns: {
    display: "flex",
    flexDirection: "column",
    columnGap: 15,
    gap: 15,
    justifyContent: "center",
    alignItems: 'center',
    marginTop: 16,
  },
  btn: {
    maxWidth: windowWidth - 150,
    backgroundColor: '#000000',
  },
  // blur effect
  mainContainer: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 300, // Adjust based on your container's width
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
  },
  blurContainer: {
    flex: 1,
  },
  menuButton: {
    // ... your menu button styles
  },
  blurWrapper: {
    backgroundColor: "#ffffff75",
    elevation: 6,
    width: "100%",
    maxWidth: windowWidth / 1.5,
    maxHeight: windowHeight,
    height: '100%',
  },
  blurWrapperAndroid: {
    width: "100%",
    maxWidth: windowWidth / 1.5,
    height: '100%',
    overflow: "hidden",
  },
  animatedContainer: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 99,
  },
  androidBackground: {
    backgroundColor: "rgba(255, 255, 255, 0.97)"
  },
  actionButton: {
    backgroundColor: "#164f0e",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  signOutButton: {
    backgroundColor: "#5c1111",
    marginTop: 15,
    marginBottom: 25,
  },
  buttonLabel: {
    color: '#fff',
    fontFamily: 'RobotoBold',
    fontSize: 16,
    letterSpacing: 1,
  },
  buttonContent: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  buttonPressed: {
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  }
});
