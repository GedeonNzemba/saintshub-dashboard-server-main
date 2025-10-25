import { ParamListBase, RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  SignIn,
  StackNavigation,
  Token,
  UserState,
} from "../../utilities/tools";
import { handleSignIn } from "../../tools/users/signin";
import { View, Image, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { StyleSheet } from "react-native";
import loginImage from "../../images/login_1.png";
import { Button, Text, TextInput } from "react-native-paper";
import { shadowProps } from "../../utilities/tools";
import LoaderB from "./LoaderB";
import { useDispatch, useSelector } from "react-redux";
import { updateUserData } from "../../hooks/redux/user/userData";
import { RootState } from "../../app/_layout";
import { setLoading } from "../../hooks/redux/loader/Loader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decodedToken } from "../../tools/users/decodeToken";
import { getUser } from "../../tools/users/getUser";

function Login({}): JSX.Element {
  const dispatch = useDispatch();
  const route = useRoute<RouteProp<ParamListBase>>();

  const navigation = useNavigation<StackNavigation>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { control, handleSubmit } = useForm<SignIn>();

  // LOADING
  const { loading } = useSelector((state: RootState) => state.reducer.loading);

  // const navigateHome = async () => {
  //   // check for token
  //   const userToken = await AsyncStorage.getItem("token");
    
  //   if (userToken) {
  //     const decodeToken = decodedToken(userToken);
  //     console.log("TOKEN decodeToken ", decodeToken);
  //     const expired = isTokenExpired(decodeToken.exp);
  //     console.log("TOKEN EXPIRED ", expired);

  //     if (expired === false) {
  //      // navigation.navigate('Home', { token: userToken });
  //       setIsLoading(false);
  //     } else {
  //       console.log("TOKEN EXPIRED ", expired)
  //     }
  //   } else {
  //     console.info("No token: ", userToken);
  //     setIsLoading(false);
  //   }
  // };
  //navigation.navigate('Home', {})

  // ON REFRESH
  const fetchUserData = (data: UserState) => {
    console.log("Fetched USER DATA LOGIN: " + JSON.stringify(data));

    dispatch(updateUserData({
      avatar: {
        url: data.avatar.url
      },
      _id: data._id,
      name: data.name,
      surname: data.surname,
      email: data.email,
      password: data.password,
      __v: data.__v,
      type: data.type,
      admin: data.admin
    }));

    dispatch(setLoading(false));
  }

  async function isTokenExpired() {
    const token = await AsyncStorage.getItem("token");
    const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds

    if (token !== null) {
      const decoded = (await decodedToken(token)) as Token;
      const { exp } = decoded;

      if (exp && currentTimestamp > exp) {
        // Token has expired
        console.log("isTokenExpirede LOGIN: EXPIRED");
        return true;
      }

      // Token is still valid
      console.log("isTokenExpired LOGIN: VALID");
      dispatch(setLoading(true));
      getUser(token).then((data) => fetchUserData(data)).finally(() =>  navigation.navigate("Home", {token: token})).catch((error) => console.log("LOGIN ERROR: ", error));
      //return navigation.navigate("Page", {token: token});
    } else {
      console.log("isTokenExpired LOGIN: EXPIRED or INVALID");
      return  navigation.navigate("SignUp");
    }
  }

  // ON CLICK
  const onSubmit = (data: SignIn) => {
    dispatch(setLoading(true));
    console.log("Login => ", JSON.stringify(data));

    let email = data.email;
    let password = data.password;

    handleSignIn({ email, password }).then((user) => {
      console.info("USER_FROM_LOGIN: ", user);

      if (user !== undefined) {
        dispatch(updateUserData({
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: {
            url: user.avatar.url
          },
          password: user.password,
          surname: user.surname,
          __v: user.__v,
          type: user.type,
          admin: user.admin
        }));

        dispatch(setLoading(false));
        navigation.navigate("Home", {data: user})
      }

      if (!user) {
        dispatch(setLoading(false));
        Alert.alert("User does not exist");
        
      }
    }).catch((error) => { console.log("ERROR: ", error); });
  };

  useEffect(() => {
    isTokenExpired()
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Image style={styles.loginImage} source={loginImage} />
      </View>

      {loading && <LoaderB />}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <View style={styles.header}>
            <Text variant="displayMedium">Login </Text>
          </View>

          <View style={styles.inputStack}>
            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  mode="outlined"
                  label="Email Address"
                  style={styles.textInput}
                />
              )}
              name="email"
              rules={{ required: true }}
              defaultValue=""
            />

            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  secureTextEntry
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  mode="outlined"
                  label="Password"
                  right={<TextInput.Affix text="/100" />}
                  style={styles.textInput}
                />
              )}
              name="password"
              rules={{ required: true }}
              defaultValue=""
            />
          </View>

          <Button
            icon="login"
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            // onPress={() =>  navigation.navigate('Home')}
            style={{ backgroundColor: "#030303" }}
          >
            Login
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate("Sign Up")}
            style={{ marginTop: 15 }}
          >
            Don't have an account? Sign Up
          </Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default Login;

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: "100%",
  },
  loginImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderBottomLeftRadius: 125,
    borderBottomRightRadius: 125,
  },
  header: {
    marginBottom: 15,
  },
  inputStack: {
    width: "90%",
    padding: 15,
  },
  textInput: {
    marginBottom: 18,
    backgroundColor: "transparent",
  },
  avatarContainer: {
    marginBottom: 15,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowProps,
    borderWidth: 6,
    borderColor: "#03630bda",
  },
  avatar: {
    zIndex: 1000,
  },
});
