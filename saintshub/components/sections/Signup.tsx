import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/_layout";
import { handleSignUp } from "../../tools/users/signup";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  View,
} from "react-native";
import signUpImage from "../../images/branham_0.png";
import { StyleSheet } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { StackNavigation, shadowProps } from "../../utilities/tools";
import GalleryPicker from "../recycle/imagePicker/Test";
import { setLoading } from "../../hooks/redux/loader/Loader";
import LoaderB from "./LoaderB";

type FormData = {
  avatar: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function SignUp({ }) {
  const dispatch = useDispatch();
  const navigation = useNavigation<StackNavigation>();

  // LOADING
  const { loading } = useSelector((state: RootState) => state.reducer.loading);

  // FORM STATE
  const [formData, setFormData] = useState<FormData>({
    avatar: "",
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Getting the New User Image [ REDUX STATE ]
  const { userImage } = useSelector(
    (state: RootState) => state.reducer.getProfileImage
  );

  useEffect(() => {
    console.info("SignUp Redux State userImage => ", userImage);
    setFormData({ ...formData, avatar: userImage });
  }, [userImage]);

  const validateForm = () => {
    let isValid = true;

    // Validate name field
    if (formData.name.trim() === "") {
      isValid = false;
      console.log("First name is required");
    }

    // Validate username field
    if (formData.surname.trim() === "") {
      isValid = false;
      console.log("Surname is required");
    }

    // Validate email field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      isValid = false;
      console.log("Invalid email format");
    }

    // Validate password field
    if (formData.password.length < 6) {
      isValid = false;
      console.log("Password must be at least 6 characters long");
    }

    // Validate confirm password field
    if (formData.password !== formData.confirmPassword) {
      isValid = false;
      console.log("Passwords do not match");
    }

    return isValid;
  };

  // HANDLE AFTER SIGN UP
  const handleAfterSignUp = (token: string) => {
    dispatch(setLoading(false));
    navigation.navigate('Home', { token: token });
  }

  const handleSubmit = () => {
    // Perform form validation
    if (validateForm()) {
      dispatch(setLoading(true));
      handleSignUp(formData).then((token) => handleAfterSignUp(token));
    }
  };

  return (
    <SafeAreaView>
        <ImageBackground
      source={signUpImage}
      resizeMode="cover"
      imageStyle={{ backgroundColor: "#e7b10173" }}
      style={styles.image}
      >
        {loading && <LoaderB />}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          {/* IMAGE PICKER */}
         <GalleryPicker />

          <View style={styles.header}>
            <Text variant="displayMedium">Sign Up </Text>
          </View>

          {/* <UploadButton /> */}

          {/* {!!image && (
            <TouchableOpacity style={styles.avatarContainer}>
              <Avatar.Image
                size={125}
                source={{ uri: image }}
                style={styles.avatar}
              />
            </TouchableOpacity>
          )} */}

          <View style={styles.inputStack}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                marginBottom: 18,
              }}
            >
              <TextInput
                activeOutlineColor="gold"
                label="First Name"
                keyboardType="default"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                style={{
                  marginRight: 20,
                  backgroundColor: "transparent",
                  width: 135,
                }}
              />

              <TextInput
                activeOutlineColor="gold"
                label="Surname"
                keyboardType="default"
                placeholder=""
                value={formData.surname}
                onChangeText={(text) =>
                  setFormData({ ...formData, surname: text })
                }
                style={{ backgroundColor: "transparent", width: 135 }}
              />
            </View>

            <TextInput
              activeOutlineColor="gold"
              label="Email Address"
              keyboardType="default"
              placeholder=""
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              style={styles.textInput}
            />

            <TextInput
              label="Password"
              placeholder=""
              value={formData.password}
              onChangeText={(text) =>
                setFormData({ ...formData, password: text })
              }
              style={styles.textInput}
            />

            <TextInput
              label="Confirm Password"
              placeholder=""
              value={formData.confirmPassword}
              onChangeText={(text) =>
                setFormData({ ...formData, confirmPassword: text })
              }
              style={styles.textInput}
            />
          </View>

          <Button
            icon="login"
            mode="contained"
            onPress={handleSubmit}
            style={{ backgroundColor: "#030303" }}
          >
            Sign Up
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate("Login")}
            style={{ marginTop: 15 }}
          >
            Have an account? Login
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  </SafeAreaView>
  );
}

export default SignUp;

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
    borderWidth: 6,
    borderColor: "#03630bda",
  },
  avatar: {
    zIndex: 1000,
  },
});
