import { useState, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  SignIn,
  UserState,
} from "../../utilities/tools";
import { handleSignIn } from "../../tools/users/signin";
import { View, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, Text, TextInput as RNTextInput, TouchableOpacity } from "react-native";
import { StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { updateUserData } from "../../hooks/redux/user/userData";
import { RootState } from "../../app/_layout";
import { setLoading } from "../../hooks/redux/loader/Loader";
import LoginCarousel from "../../components/carousel/Login";
import { BottomSheetModal, useBottomSheetModal } from '@gorhom/bottom-sheet';
import { windowHeight, windowWidth } from "@/utilities/types";
import { useRouter } from "expo-router";
import AlertPopup from "../../components/AlertPopup";
import LoaderB from "@/components/loaders/LoaderB";
import { Ionicons } from '@expo/vector-icons';

function Login({ }): JSX.Element {
  const dispatch = useDispatch();
  const router = useRouter();

  // Add state for alert
  const [showAlert, setShowAlert] = useState(false);

  // Add state for alert message
  const [alertMessage, setAlertMessage] = useState<string>("");

  const { control, handleSubmit } = useForm<SignIn>();

  // LOADING
  const { loading } = useSelector((state: RootState) => state.reducer.loading);

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
      
      if (user && user._id) {
        dispatch(updateUserData({
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: { url: user.avatar?.url || '' },
          password: user.password,
          surname: user.surname,
          __v: user.__v,
          type: user.type,
          admin: user.admin
        }));

        setAlertMessage("You are now Logged In!");
        setShowAlert(true);

        setTimeout(() => {
          router.replace("/(app)/home");
        }, 2000);
      } else {
        setAlertMessage("Invalid credentials. Please check your email and password.");
        setShowAlert(true);
        dispatch(setLoading(false));
      }
    } catch (error: any) {
      // Extract error message - handleSignIn now throws Error objects
      let errorMessage = "Login failed. Please try again.";
      
      if (error instanceof Error && error.message) {
        errorMessage = error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setAlertMessage(errorMessage);
      setShowAlert(true);
      dispatch(setLoading(false));
    }
  };

  const [buttonPressed, setButtonPressed] = useState(false);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { dismiss } = useBottomSheetModal();
  const [validationError, setValidationError] = useState<string>("");

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E9ECEF" />
      
      {/* Fixed Carousel at top */}
      <View style={styles.carouselContainer}>
        <LoginCarousel />
      </View>

      {/* Full screen centered loader */}
      {loading && (
        <View style={styles.loaderOverlay}>
          <LoaderB />
        </View>
      )}

      {/* Scrollable form content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.formContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                Login Now
              </Text>
              <Text style={styles.headerSubtitle}>
                Welcome back! Please enter your credentials
              </Text>
            </View>

            <View style={styles.inputStack}>
              <Controller
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <RNTextInput
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      placeholder="Enter your email"
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      textContentType="emailAddress"
                      style={styles.textInput}
                    />
                  </View>
                )}
                name="email"
                rules={{ required: false }}
                defaultValue=""
              />

              <Controller
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <Text style={styles.inputLabel}>Password</Text>
                    <RNTextInput
                      secureTextEntry
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      placeholder="Enter your password"
                      placeholderTextColor="#999"
                      autoCapitalize="none"
                      autoComplete="password"
                      textContentType="password"
                      style={styles.textInput}
                    />
                  </View>
                )}
                name="password"
                rules={{ required: false }}
                defaultValue=""
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                onPressIn={() => setButtonPressed(true)}
                onPressOut={() => setButtonPressed(false)}
                style={[
                  styles.loginButton,
                  buttonPressed && styles.buttonPressed
                ]}
                activeOpacity={0.8}
              >
                <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.loginButtonLabel}>Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(auth)/signup")}
                style={styles.signupButton}
              >
                <Text style={styles.signupButtonLabel}>
                  Don't have an account? Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertPopup
        visible={showAlert}
        message={alertMessage}
        onClose={() => setShowAlert(false)}
      />
    </View>
  );
}

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9ECEF',
  },
  carouselContainer: {
    height: windowHeight * 0.35,
    width: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  formContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  headerTitle: {
    color: '#000',
    fontFamily: 'RobotoBlack',
    letterSpacing: 0.5,
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#666',
    fontFamily: 'RobotoRegular',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 0.25,
  },
  inputStack: {
    width: '100%',
    marginBottom: 10,
  },
  inputLabel: {
    color: '#000',
    fontFamily: 'RobotoMedium',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ccc',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'RobotoRegular',
    color: '#000',
    marginBottom: 16,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButton: {
    backgroundColor: "#030303",
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonLabel: {
    color: '#fff',
    fontFamily: 'RobotoBold',
    fontSize: 16,
    letterSpacing: 1,
  },
  buttonPressed: {
    backgroundColor: '#1a1a1a',
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.25,
    elevation: 6,
  },
  signupButton: {
    marginTop: 20,
    paddingVertical: 12,
  },
  signupButtonLabel: {
    color: '#030303',
    textDecorationLine: 'underline',
    fontFamily: 'RobotoMedium',
    fontSize: 15,
    letterSpacing: 0.25,
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(233, 236, 239, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
});
