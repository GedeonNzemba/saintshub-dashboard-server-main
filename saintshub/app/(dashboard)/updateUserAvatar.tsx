import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/_layout";
import { Alert, KeyboardAvoidingView, Platform, View } from "react-native";
import { StyleSheet } from "react-native";
import { Appbar, Button, Text } from "react-native-paper";
import { StackNavigation, shadowProps } from "../../utilities/tools";
import { updateUserInfo } from "../../tools/users/updateUser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UPDATE_USER } from "../../constants/productConstants";
import { updateUserData } from "../../hooks/redux/user/userData";
import LoaderB from "@/components/sections/LoaderB";
import GalleryPicker from "@/components/recycle/imagePicker/ImagePicker";
import AlertPopup from "@/components/AlertPopup";

function UpdateUserAvatar() {
  const dispatch = useDispatch();
  const router = useRouter();

  const [image, setImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);


  const userData = useSelector((state: RootState) => state.reducer.updateUserData);
  const { userImage } = useSelector((state: RootState) => state.reducer.getProfileImage);
  //const { avatar } = useSelector((state: RootState) => state.reducer.updateUserData);

  const handleImageSelected = (imageUri: string) => {
    setSelectedImage(imageUri);
  };

  // Add state for alert message
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Add state for alert
  const [showAlert, setShowAlert] = useState(false);

  // FORM STATE
  // const [formData, setFormData] = useState<{ avatar: string; authToken: string; targetUpdate: string }>({
  //   avatar: image,
  //   authToken: "",
  //   targetUpdate: UPDATE_USER.AVATAR,
  // });

  // useEffect(() => {
  //   setFormData({ ...formData, avatar: image });
  // }, [image]);

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

  useEffect(() => {
    setImage(userImage);
    console.log("IMAGE ", image);
  }, [userImage]);

  const validateForm = () => {
    let isValid = true;

    // Validate password field
    if (!formData.avatar) {
      isValid = false;
      //window.alert("Image not selected !");
      setAlertMessage("Image not selected");
      setShowAlert(true);
    }

    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setIsLoading(true)

      updateUserInfo(formData).then((data) => {
        //window.alert("Image Updated Successfully !");
        

        // UPDATE_REDUX_USER_STATE
        dispatch(updateUserData({
          ...userData,
          avatar: {
            url: data.avatar
          },
        }));

        setIsLoading(false);
      }).finally(() => {
        setAlertMessage("Image Updated Successfully");
        setShowAlert(true);
        router.back()
      });
    }
  };

  const handleAlertClose = () => {
    setShowAlert(false);
    setTimeout(() => {
      router.back(); // Call router.back() after the alert is closed
    }, 3000);
  };

  return (
    <View style={styles.image}>
      <Appbar.Header style={{ backgroundColor: "transparent" }}>
        <Appbar.BackAction accessibilityLabel="Back" onPress={() => router.back()} />
        <Appbar.Content
          title="Back"
          titleStyle={{
            alignSelf: "flex-start",
            fontFamily: "Roboto_500Medium",
          }}
          onPress={() => router.back()}
        />
      </Appbar.Header>

      {isLoading && <LoaderB />}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          {/* IMAGE PICKER */}
          {/* <ImgPicker /> */}
          <GalleryPicker 
            upload={() => {
              setAlertMessage("Image Updated Successfully");
              setShowAlert(true)
            }}
            // onImageSelected={handleImageSelected} 
          />

          <View style={styles.header}>
            <Text variant="displayMedium">Update Image</Text>
          </View>

          <View style={styles.inputStack} />

          {/* {selectedImage !== null && (
            <Button
              icon="update"
              mode="contained"
              onPress={handleSubmit}
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
              Update
            </Button>
          )} */}


        </View>

        {showAlert && (
          <AlertPopup
            visible={showAlert}
            message={alertMessage || ''}
            onClose={handleAlertClose}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

export default UpdateUserAvatar;

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
});
