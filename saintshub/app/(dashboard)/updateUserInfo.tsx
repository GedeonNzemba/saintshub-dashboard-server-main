import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/_layout";
import { updateUserInfo } from "../../tools/users/updateUser";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { StyleSheet } from "react-native";
import { Appbar, Button, Text, TextInput } from "react-native-paper";
import { StackNavigation, UpdateUserInfoProps, shadowProps } from "../../utilities/tools";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UPDATE_USER } from "../../constants/productConstants";
import { UPDATE_USER_SUCCESS } from "../../constants/userConstants";
import { setLoading } from "../../hooks/redux/loader/Loader";
import { updateUserData } from "../../hooks/redux/user/userData";
import LoaderB from "@/components/sections/LoaderB";
import AlertPopup from "@/components/AlertPopup";

function UpdateUserInfo() {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [user, setUser] = useState<{name: string, surname: string, email: string}>({
    name: params.name as string || "",
    surname: params.surname as string || "",
    email: params.email as string || ""
  });

  // Add state for alert message
  const [alertMessage, setAlertMessage] = useState<string>("");

  // Add state for alert
  const [showAlert, setShowAlert] = useState(false);

  // LOADING
  const { loading } = useSelector((state: RootState) => state.reducer.loading);
  const { name, email, surname } = useSelector((state: RootState) => state.reducer.updateUserData);

  // FORM STATE
  const [formData, setFormData] = useState<UpdateUserInfoProps>({
    name: name,
    surname: surname,
    email: email,
    authToken: '',
    targetUpdate: UPDATE_USER.INFO
  });

  useEffect(() => {
    async function update() {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        setFormData({ ...formData, authToken: token });
      }
    }

    update();
  }, [formData.authToken]);

  useEffect(() => {
    setUser({ ...user, name: name, surname: surname, email: email });
  }, [name, surname, email])

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

    // Validate
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      isValid = false;
      console.log("Invalid email format");
    }

    if (formData.name === name && formData.email === email && formData.surname === surname) {
      isValid = false;
      //window.alert("You have not changed anything !")
      setAlertMessage("You have not changed anything !");
      setShowAlert(true);
    }

    return isValid;
  };
  

  const handleSubmit = () => {
    if (validateForm()) {
      //TURN LOADER ON
      dispatch(setLoading(true));

      updateUserInfo(formData).then((data) => {
        window.alert("Successfully Updated !");
        console.log(UPDATE_USER_SUCCESS, data);

        // UPDATE_REDUX_USER_STATE
        dispatch(updateUserData({
          _id: data._id,
          name: data.name,
          email: data.email,
          avatar: {
            url: data.avatar.url
          },
          password: data.password,
          surname: data.surname,
          __v: data.__v,
          type: data.type,
          admin: data.admin
        }));
      }).finally(() => {
        //TURN LOADER OFF
        dispatch(setLoading(false));

        router.back();
      });
    }
  };

  // if (!name && !email && !surname) {
  //   dispatch(setLoading(true));
  // } else {
  //   dispatch(setLoading(false));
  // }

  return (
    <View style={styles.image}>
      {loading ? <LoaderB /> :
        (
          <>

            <Appbar.Header style={{ backgroundColor: "transparent" }}>
              <Appbar.BackAction
                accessibilityLabel="Back"
                onPress={() => router.back()}
              />
              <Appbar.Content
                title="Back"
                titleStyle={{
                  alignSelf: "flex-start",
                  fontFamily: "Roboto_500Medium",
                }}
                onPress={() => router.back()}
              />
            </Appbar.Header>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>

                <View style={styles.header}>
                  <Text variant="displayMedium">Update Info</Text>
                </View>

                <View style={styles.inputStack}>

                  <TextInput
                    activeOutlineColor="gold"
                    label="First Name"
                    keyboardType="default"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    style={styles.textInput}
                  />

                  <TextInput activeOutlineColor="gold" label="Surname" keyboardType="default" placeholder="" value={formData.surname} onChangeText={(text) => setFormData({ ...formData, surname: text })} style={styles.textInput} />

                  <TextInput activeOutlineColor="gold" label="Email Address" keyboardType="default" placeholder="" value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} style={styles.textInput} />

                </View>

                {/* <Button icon="update" mode="contained" onPress={handleSubmit} style={{ backgroundColor: "#030303" }}>
                  Update
                </Button> */}

                <Button
              icon="update"
              mode="contained"
              onPress={handleSubmit}
              style={[{
                backgroundColor: "#030303",
                paddingHorizontal: 20,
                paddingVertical: 8,
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

              <AlertPopup
                visible={showAlert}
                message={alertMessage}
                onClose={() => setShowAlert(false)}
            />
            </KeyboardAvoidingView>
          </>
        )}
    </View>
  );
}

export default UpdateUserInfo;

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
  avatar: {
    zIndex: 1000,
  },
});
