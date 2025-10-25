import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../_layout";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { StyleSheet } from "react-native";
import { Appbar, Button, Text, TextInput } from "react-native-paper";
import { StackNavigation, shadowProps } from "../../utilities/tools";
import { updateUserInfo } from "../../tools/users/updateUser";
import LoaderB from "../../components/sections/LoaderB";
import { UPDATE_USER } from "../../constants/productConstants";
import { windowWidth } from "@/utilities/types";
import DrawerModal from "../../components/recycle/modals/DrawerModal";
import { useAuth } from "@/contexts/AuthContext";
import { UPDATE_PASSWORD_REQUEST, UPDATE_PASSWORD_SUCCESS } from "@/constants/userConstants";
import { updateUserData } from "@/hooks/redux/user/userData";
import AlertPopup from "@/components/AlertPopup";

function UpdateUserSecurity() {
  const dispatch = useDispatch();
  const navigation = useNavigation<StackNavigation>();

  const [image, setImage] = useState<String>();
  const [isLoading, setIsLoading] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const userData = useSelector((state: RootState) => state.reducer.updateUserData);
  const { password } = useSelector((state: RootState) => state.reducer.updateUserData);
  const { name, email, surname, avatar } = useSelector((state: RootState) => state.reducer.updateUserData);

  const { token } = useAuth();

  // FORM STATE
  const [formData, setFormData] = useState<{ password: string, authToken: string, confirmPassword: string, targetUpdate: string }>({
    password: password || '',
    authToken: '',
    confirmPassword: '',
    targetUpdate: UPDATE_USER.PASSWORD
  });

  // Add state for alert message
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Add state for alert
  const [showAlert, setShowAlert] = useState(false);


  // useEffect(() => {
  //   async function update() {
  //     const token = await AsyncStorage.getItem("token");

  //     if (token) {
  //       setFormData({ ...formData, authToken: token });
  //       console.log("setFormData TOKEN ", formData.authToken);
  //     }
  //   }

  //   update();
  // }, [formData.authToken]);

  const validateForm = () => {
    let isValid = true;

    // Validate password field
    if (formData.password.length < 6) {
      isValid = false;
      setShowValidationModal(true);
      console.log("Password must be at least 6 characters long");
    }

    // Validate confirm password field
    if (formData.password !== formData.confirmPassword) {
      isValid = false;
      setShowValidationModal(true);
      console.log("Passwords do not match");
    }

    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setIsLoading(true)

      if (token) {
        console.log(UPDATE_PASSWORD_REQUEST)
        setFormData({ ...formData, authToken: token, targetUpdate: UPDATE_USER.PASSWORD });

        updateUserInfo(formData).then((data) => {
          console.log(UPDATE_PASSWORD_SUCCESS, JSON.stringify(data));

          dispatch(updateUserData({
            ...userData,
            password: formData.password
          }));
        })
          .finally(() => {
            setAlertMessage("Password Updated Successfully");
            setShowAlert(true);
          })
          .catch((error) => {
            setAlertMessage(error.message);
            setShowAlert(true);
          });

        setIsLoading(false);
      }

      if (!token) {
        setAlertMessage("Token is not available");
        setShowAlert(true);
      }
    }
  };

  const handleAlertClose = () => {
    setShowAlert(false);
  };

  return (
    <View style={styles.image}>
      <Appbar.Header style={{ backgroundColor: "transparent" }}>
        <Appbar.BackAction
          accessibilityLabel="Back"
          iconColor="#000"
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content
          title="Back"
          titleStyle={{ alignSelf: "flex-start", color: '#000', fontFamily: 'RobotoRegular', letterSpacing: 0.5 }}
          onPress={() => navigation.goBack()}
        />
      </Appbar.Header>

      {isLoading && <LoaderB />}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 25}
      >
        <View style={{ flex: 1, justifyContent: "center" }}>
          <View style={[
            styles.innerWraper,
            shadowProps,
            {
              alignSelf: "center",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ecf0f1",
              width: windowWidth - 40,
              borderRadius: 20,
              paddingVertical: 20,
            }
          ]}>
            <View style={styles.header}>
              <Text variant="displayMedium" style={{ color: '#000', fontFamily: 'RobotoBlack', letterSpacing: 0.5, fontSize: 32 }}>Update Security</Text>
            </View>

            <View style={[styles.inputStack, { width: '100%', paddingHorizontal: 20 }]}>
              <TextInput
                style={[styles.input]}
                label="Password"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
                mode="flat"
                theme={{
                  colors: {
                    primary: '#000',
                    onSurfaceVariant: '#000',
                    placeholder: '#000',
                    text: '#000'
                  },
                  fonts: {
                    bodyLarge: {
                      fontFamily: 'RobotoMedium',
                    }
                  }
                }}
              />

              <TextInput
                style={[styles.input]}
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                secureTextEntry
                mode="flat"
                theme={{
                  colors: {
                    primary: '#000',
                    onSurfaceVariant: '#000',
                    placeholder: '#000',
                    text: '#000'
                  },
                  fonts: {
                    bodyLarge: {
                      fontFamily: 'RobotoMedium',
                    }
                  }
                }}
              />
            </View>

            <Button
              icon="update"
              mode="contained"
              onPress={handleSubmit}
              style={[{
                backgroundColor: "#000000",
                paddingHorizontal: 20,
                paddingVertical: 8,
                marginTop: 15,
                marginBottom: 25,
              }]}
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
              Update
            </Button>

          </View>
        </View>
      </KeyboardAvoidingView>

      {showValidationModal && (
        <DrawerModal
          heading={"Password Validation"}
          subheading={"Mismatched Entries"}
          bodyText_one={"The passwords you entered do not match. Please ensure both password fields contain the same password and try again."}
          onDismiss={() => setShowValidationModal(false)}
        />
      )}

      <AlertPopup
        visible={showAlert}
        message={alertMessage || ''}
        onClose={handleAlertClose}
      />
    </View>
  );
}

export default UpdateUserSecurity;

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#c7c7c7",
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
  input: {
    marginBottom: 18,
    backgroundColor: "transparent",
    color: '#000'
  },
  innerWraper: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  avatar: {
    zIndex: 1000,
  },
});
