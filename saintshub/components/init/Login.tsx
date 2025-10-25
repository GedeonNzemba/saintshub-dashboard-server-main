import { ParamListBase, RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  SignIn,
  StackNavigation,
  Token,
  UserState,
} from "../../utilities/tools";
import { handleSignIn } from "../../tools/users/signin";
import { View, Image, KeyboardAvoidingView, Platform, Alert, Pressable } from "react-native";
import { StyleSheet } from "react-native";
import loginImage from "../../assets/images/login_1.png";
import { Button, Text, TextInput } from "react-native-paper";
import { shadowProps } from "../../utilities/tools";
import LoaderB from "../loaders/LoaderB";
import { useDispatch, useSelector } from "react-redux";
import { updateUserData } from "../../hooks/redux/user/userData";
import { RootState } from "../../app/_layout";
import { setLoading } from "../../hooks/redux/loader/Loader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decodedToken } from "../../tools/users/decodeToken";
import { getUser } from "../../tools/users/getUser";
import LoginCarousel from "../carousel/Login";
import { BottomSheetModal, useBottomSheetModal } from '@gorhom/bottom-sheet';
import { windowHeight, windowWidth } from "@/utilities/types";
import { useRouter } from "expo-router";
import AlertPopup from "../AlertPopup";
import { validateToken } from "@/utilities/auth";

function Login({ }): JSX.Element {
  const dispatch = useDispatch();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(false);

    // Add state for alert
    const [showAlert, setShowAlert] = useState(false);

  // Add state for alert message
  const [alertMessage, setAlertMessage] = useState<string>("");

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

  // ON CLICK
  const onSubmit = async (data: SignIn) => {
    try {
      dispatch(setLoading(true));
      const user = await handleSignIn({ email: data.email, password: data.password });

      if (user) {
        dispatch(updateUserData({
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: { url: user.avatar.url },
          password: user.password,
          surname: user.surname,
          __v: user.__v,
          type: user.type,
          admin: user.admin
        }));

        dispatch(setLoading(false));
        setAlertMessage("You are now Logged In!");
        setShowAlert(true);

        setTimeout(() => {
          setShowAlert(false);
          router.replace("/(app)/home");
        }, 2000);
      } else {
        dispatch(setLoading(false));
        setAlertMessage("Invalid credentials");
        setShowAlert(true);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      dispatch(setLoading(false));
      const errorMessage = error?.response?.data?.message || error?.message || "Login failed";
      setAlertMessage(errorMessage);
      setShowAlert(true);
    }
  };

  const [buttonPressed, setButtonPressed] = useState(false);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { dismiss } = useBottomSheetModal();
  const [validationError, setValidationError] = useState<string>("");
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // Add this function to handle form validation
  const validateForm = (data: SignIn) => {
    if (!data?.email && !data?.password) {
      setValidationError("Please enter both email and password");
      return false;
    }
    if (!data?.email) {
      setValidationError("Please enter your email address");
      console.log("VALIDATION: ", false);
      return false;
    }
    if (!data?.password) {
      setValidationError("Please enter your password");
      console.log("VALIDATION: ", false);
      return false;
    }

    console.log("VALIDATION: ", true);
    return true;
  };

  // Add this function to handle bottom sheet changes
  const handleBottomSheetChange = (index: number) => {
    setIsBottomSheetOpen(index === 0);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#E9ECEF' }}>
      <LoginCarousel />
      {/* <View style={{ flex: 1 }}>
        <Image style={styles.loginImage} source={loginImage} />
      </View> */}

      {loading && <LoaderB />}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <View style={styles.header}>
            <Text
              variant="displayMedium"
              style={{
                color: '#000',
                fontFamily: 'RobotoBlack',
                letterSpacing: 0.5,
                fontSize: 32,
              }}
            >
              Login Now
            </Text>
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
                  style={[styles.textInput, {
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    fontFamily: 'RobotoRegular',
                  }]}
                  outlineStyle={{
                    borderRadius: 8,
                    borderWidth: 1,
                  }}
                  theme={{
                    colors: {
                      primary: '#000',
                      onSurfaceVariant: '#000',
                    },
                    fonts: {
                      bodyLarge: {
                        fontFamily: 'RobotoMedium',
                      }
                    }
                  }}
                />
              )}
              name="email"
              rules={{ required: false }}
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
                  style={[styles.textInput, {
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    fontFamily: 'RobotoRegular',
                  }]}
                  outlineStyle={{
                    borderRadius: 8,
                    borderWidth: 1,
                  }}
                  theme={{
                    colors: {
                      primary: '#000',
                      onSurfaceVariant: '#000',
                    },
                    fonts: {
                      bodyLarge: {
                        fontFamily: 'RobotoMedium',
                      }
                    }
                  }}
                />
              )}
              name="password"
              rules={{ required: false }}
              defaultValue=""
            />
          </View>

          <Button
            icon="login"
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            onPressIn={() => setButtonPressed(true)}
            onPressOut={() => setButtonPressed(false)}
            style={[{
              backgroundColor: "#030303",
              paddingHorizontal: 20,
              paddingVertical: 8,
              transform: [{ scale: buttonPressed ? 0.95 : 1 }],
            }, buttonPressed && styles.buttonPressed]}
            labelStyle={{
              color: '#fff',
              fontFamily: 'RobotoBold',
              fontSize: 16,
              letterSpacing: 1,
            }}
            contentStyle={{
              flexDirection: 'row-reverse',
              gap: 8,
            }}
            theme={{
              colors: { primary: '#fff' }
            }}
          >
            Login
          </Button>



          <Button
            mode="text"
            onPress={() => router.push("/(auth)/signup")}
            style={{
              marginTop: 15,
            }}
            labelStyle={{
              color: '#030303',
              textDecorationLine: 'underline',
              fontFamily: 'RobotoMedium',
              fontSize: 14,
              letterSpacing: 0.25,
            }}
          >
            Don't have an account? Sign Up
          </Button>
        </View>
      </KeyboardAvoidingView>

      <AlertPopup
        visible={showAlert}
        message={alertMessage}
        onClose={() => setShowAlert(false)}
      />

      {/* Update the overlay */}
      {isBottomSheetOpen && (
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 99,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              height: windowHeight,
              width: windowWidth,
            },
          ]}
          onPress={() => {
            dismiss();
            setIsBottomSheetOpen(false);
          }}
        />
      )}

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={['25%']}
        onChange={handleBottomSheetChange}
        enablePanDownToClose={true}
        enableOverDrag={true}
        backgroundStyle={[styles.bottomSheetBackground, {
          borderRadius: 24,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }]}
        handleIndicatorStyle={{
          backgroundColor: '#000',
          width: 40,
        }}
      >
        <View style={styles.bottomSheetContent}>
          <Text style={[styles.errorTitle, {
            fontFamily: 'RobotoBold',
            color: '#FF3B30',
          }]}>
            Form Validation Error
          </Text>
          <Text style={[styles.errorMessage, {
            fontFamily: 'RobotoRegular',
            color: '#000',
          }]}>
            {validationError}
          </Text>
          <Button
            mode="contained"
            onPress={() => dismiss()}
            style={[styles.closeButton, {
              paddingHorizontal: 32,
              paddingVertical: 8,
              borderRadius: 8,
            }]}
            labelStyle={[styles.closeButtonText, {
              fontFamily: 'RobotoMedium',
              letterSpacing: 0.5,
            }]}
          >
            Close
          </Button>
        </View>
      </BottomSheetModal>
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
    // shadowProps,
    borderWidth: 6,
    borderColor: "#03630bda",
  },
  avatar: {
    zIndex: 1000,
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
  },
  bottomSheetBackground: {
    backgroundColor: '#fff',
  },
  bottomSheetContent: {
    padding: 20,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#030303',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    width: '100%',
  },
});
