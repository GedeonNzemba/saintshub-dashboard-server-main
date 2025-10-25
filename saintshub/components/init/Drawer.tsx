// import * as React from "react";
// import { createDrawerNavigator } from "@react-navigation/drawer";
// import Login from "../../components/init/Login";
// import SignUp from "../../components/init/Signup";
// import { StackNavigation, StackParamList, Token } from "../../utilities/tools";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { decodedToken } from "../../tools/users/decodeToken";
// import { ParamListBase, RouteProp, useNavigation, useRoute } from "@react-navigation/native";
// import { TouchableOpacity } from "react-native";
// import { IconButton } from 'react-native-paper';


// const Drawer = createDrawerNavigator<StackParamList>();

// export default function DrawerComponent() {
//   const navigation = useNavigation<StackNavigation>();
//   const route = useRoute<RouteProp<ParamListBase>>();

//   async function isTokenExpired() {
//     const token = await AsyncStorage.getItem("token");
//     const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds

//     const userAuth = async () => {

//       if (token !== null) {
//         const decoded = (await decodedToken(token)) as Token;
//         const { exp } = decoded;

//         if (exp && currentTimestamp > exp) {
//           // Token has expired
//           console.log("isTokenExpirede: EXPIRED");
//           return navigation.navigate("SignUp");
//         }

//         // Token is still valid
//         console.log("isTokenExpired: VALID");
//         return true;
//         //return navigation.navigate("Page", {token: token});
//       } else {
//         console.log("isTokenExpired: EXPIRED or INVALID");
//         return navigation.navigate("SignUp");
//       }

//     }

//     if (route.name !== 'SignUp' || route.name !== 'Init' || route.name !== 'Login') {
//       userAuth();
//     }

//   }

//   // React.useEffect(() => {
//   //   const intervalId = setInterval(async () => {
//   //     await isTokenExpired();
//   //   }, 60 * 1000); // Check every 1 minute

//   //   // Clean up the interval when the component is unmounted
//   //   return () => clearInterval(intervalId);
//   // }, [navigation]);

//   // removed useLegacyImplementation
//   return (
// <Drawer.Navigator initialRouteName="Login">
//   <Drawer.Screen
//     name="Login"
//     options={{
//       headerTransparent: true,
//       headerTitle: '',
//       headerLeft: () => null,
//     }}
//     component={Login}
//   />
//   <Drawer.Screen
//     name="SignUp"
//     options={{
//       headerTransparent: true,
//       headerTitle: '',
//       headerLeft: () => null,
//     }}
//     component={SignUp}
//   />
// </Drawer.Navigator>
//   );
// }
