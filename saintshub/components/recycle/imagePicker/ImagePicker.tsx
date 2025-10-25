import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Avatar } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { getUserImage } from "../../../hooks/redux/registration/getProfileImage";
import { ResponseImage } from "@/utilities/tools";
import { URI_domain } from "@/utilities/tools";
import { updateUserData } from "@/hooks/redux/user/userData";
import { RootState } from "@/app/_layout";
import { useAuth } from "@/contexts/AuthContext";
import { UPDATE_USER } from "@/constants/productConstants";
import AlertPopup from "@/components/AlertPopup";
import { updateUserInfo } from "@/tools/users/updateUser";

interface GalleryPickerProps {
  upload?: () => void;
  onImageSelected?: (imageUri: string) => void;
}

const GalleryPicker: React.FC<GalleryPickerProps> = ({ onImageSelected, upload }) => {
  const dispatch = useDispatch();
  const [image, setImage] = useState<string | ArrayBuffer | null>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Add state for alert message
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Add state for alert
  const [showAlert, setShowAlert] = useState(false);

  // FORM STATE
  const [formData, setFormData] = useState<{ avatar: string | ArrayBuffer | null; authToken: string; targetUpdate: string }>({
    avatar: image,
    authToken: "",
    targetUpdate: UPDATE_USER.AVATAR,
  });

  const userData = useSelector((state: RootState) => state.reducer.updateUserData);

  const { token } = useAuth();

  // AVATAR
  const randomAvatar = "https://gravatar.com/avatar/746891088b02a7cd04e88c2e21e2d869?s=400&d=retro&r=x";

  //handle convert file to base64
  const setFileToBase = (base64String: string) => {
    const reader = new FileReader();
    const blob = new Blob([base64String], { type: "image/jpeg" });
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      setImage(base64String);
      console.info("image File: ", base64String);
    };
    console.info("setFileToBase File: ", image);
  };

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        console.log("Permission denied to access media library");
        return;
      }

      const result: ImagePicker.ImagePickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        base64: true,
      });

      if (!result.canceled && result.assets[0].uri) {
        const selectedUri = result.assets[0].uri;
        setSelectedImage(selectedUri);

        await uploadImage(selectedUri);

        if (onImageSelected) {
          onImageSelected(selectedUri);
        }

        if (upload) {
          upload();
        }

        dispatch(getUserImage(selectedUri));
      }
    } catch (error) {
      console.log("Failed to pick image:", error);
    }
  };

  const uploadImage = async (uri: string) => {
    const formData = new FormData();
    formData.append("profileImage", {
      uri,
      name: "image.jpg",
      type: "image/jpeg",
    } as any);

    try {
      const response = await fetch(`${URI_domain}/api/upload-file-to-cloud`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      await response.json()
        .then(({ result }: ResponseImage) => {
          let { secure_url } = result;
          console.log('RESPONSE IMAGE: ', secure_url)

          if (token) {
            updateUserInfo({ avatar: {url: secure_url}, authToken: token, targetUpdate: UPDATE_USER.AVATAR }).then((data) => {
              console.log("LE DATA: ", JSON.stringify(data))
              // UPDATE_REDUX_USER_STATE
              dispatch(updateUserData({
                ...userData,
                avatar: {
                  url: data.avatar.url
                },
                // avatar: {
                //   url: data.avatar
                // },
              }));

            })
          }

          if (!token) {
            setAlertMessage("Token is not available");
            setShowAlert(true);
          }
        })
        .catch((error) => {
          setAlertMessage(error.message);
          setShowAlert(true);
        })

    } catch(error: any) {
        setAlertMessage(error.message);
        setShowAlert(true);
    }
  };

  const handleAlertClose = () => {
    setShowAlert(false);
  };

  return (
    <View>
      <TouchableOpacity style={[styles.avatarContainer, { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }]} onPress={pickImageFromGallery}>
        <Avatar.Image size={125} source={{ uri: !!selectedImage ? selectedImage : randomAvatar }} style={styles.avatar} />
      </TouchableOpacity>

      <AlertPopup
        visible={showAlert}
        message={alertMessage || ''}
        onClose={handleAlertClose}
      />
    </View>
  );
};

export default GalleryPicker;

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
    borderColor: "#ffffffda",
  },
  avatar: {
    zIndex: 1000,
  },
});


// GET THE SECURED_URL IMAGE  FROM HERE AND THEN CONSOLE LOG IT IN THE AVATAR COMPONENT.
// IF SUCCESS, MAKE SURE TO NOW UPDATE THE AVATAR REDUX STATE WITH THE IMAGE.