/**
 * GalleryPicker Component
 * A reusable component for handling image selection and upload functionality.
 * It supports various image types (deacons, trustees, pastor, church images, etc.)
 */

import React, { useEffect, useState } from "react";
import { TouchableOpacity, View, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Avatar, Divider } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { getUserImage } from "../../../hooks/redux/registration/getProfileImage";
import { RANDOM_AVATAR_URI, ResponseImage, ResponseImageUploaded, URI_domain } from "../../../utilities/tools";
import { RootState } from "../../../app/_layout";
import LoaderB from "../../sections/LoaderB";
import { CHURCH_BANNER_IMAGE, CHURCH_IMAGE, CHURCH_LOGO, DEACONS_IMAGE, PASTOR_WIFE, PASTOR_WIFE_IMAGE, TRUSTEE_IMAGE } from "../../../constants/userConstants";
import {getPrincipalImage} from "../../../hooks/redux/dashboard/getPrincipalImage";
import { getPastorWifesImage } from "../../../hooks/redux/dashboard/getPastorWIfeIMage";
import { getChurchBannerImage } from "../../../hooks/redux/dashboard/getChurchBanners";
import {getChurchLogo} from "../../../hooks/redux/dashboard/getChurchLogo";
import { handleFileUpload } from "../../../utilities/functionality";
import { setDeaconImage } from "@/hooks/redux/dashboard/deaconImages";

/**
 * Interface defining the props for the GalleryPicker component
 * @param img - Optional initial image URL
 * @param imgs - Optional array of image URLs
 * @param size - Optional size for the avatar image
 * @param upload - Optional callback function after successful upload
 * @param actionType - Type of image being uploaded (deacon, trustee, pastor, etc.)
 */
interface IProps {
  img?: string;
  imgs?: string[];
  size?: number;
  upload?: () => void;
  actionType?: typeof DEACONS_IMAGE | typeof TRUSTEE_IMAGE | typeof PASTOR_WIFE | typeof CHURCH_IMAGE | typeof PASTOR_WIFE_IMAGE | typeof CHURCH_BANNER_IMAGE | typeof CHURCH_LOGO;
}

// API key for image upload service
const api_key = "yahxkJ1UbAHVcqb7TdP8swu5";

/**
 * GalleryPicker Component
 * @param {Object} props - Component props
 * @param {Function} props.upload - Callback function after successful upload
 * @param {string} props.actionType - Type of image being uploaded
 * @param {string} props.img - Initial image URL
 * @param {number} props.size - Size of the avatar image
 */
const GalleryPicker = ({ upload, actionType, img, size }: IProps) => {
  const dispatch = useDispatch();
  // State for managing the selected image URL and loading state
  const [image, setImage] = useState<string>(img || RANDOM_AVATAR_URI);
  const [isLoading, setIsLoading] = useState(false);

  // Get avatar data from Redux store
  const { avatar } = useSelector((state: RootState) => state.reducer.updateUserData);

  /**
   * Opens the device gallery and handles image selection
   * Processes the selected image and initiates upload
   */
  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setIsLoading(true);
      setImage(result.assets[0].uri);

      // Special handling for church logo uploads
      if (actionType === CHURCH_LOGO) {
        try {
          const data = await handleFileUpload(result.assets[0].uri);
          if (data) {
            await uploadImage(data);
          }
        } catch (error) {
          console.log(error);
        }
      } else {
        await uploadImage(result.assets[0].uri);
      }

      // Execute callback if provided
      if (upload) {
        upload();
      }
      setIsLoading(false);
    }
  };

  /**
   * Handles the image upload process to the server
   * @param {string} uri - URI of the image to be uploaded
   */
  const uploadImage = async (uri: string) => {
    const formData = new FormData();
    formData.append("profileImage", {
      uri,
      name: "image.jpg",
      type: "image/jpg",
    } as any);

    try {
      // Upload image to cloud storage
      const response = await fetch(`${URI_domain}/api/upload-file-to-cloud`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const { result }: ResponseImage = await response.json();
      let { secure_url } = result;
      console.log("Upload success:", secure_url);

      setImage(secure_url);

      // Dispatch appropriate action based on image type
      if (actionType === DEACONS_IMAGE) {
       console.log("DEACONS_IMAGE: ", secure_url)
      } else if (actionType === TRUSTEE_IMAGE) {
       console.log("TRUSTEE_IMAGE: ", secure_url)
      } else if (actionType === PASTOR_WIFE) {
        dispatch(getPrincipalImage(secure_url));
      } else if (actionType === CHURCH_IMAGE) {
       console.log("CHURCH_IMAGE: ", secure_url)
      } else if (actionType === PASTOR_WIFE_IMAGE) {
        dispatch(getPastorWifesImage(secure_url));
      } else if (actionType === CHURCH_BANNER_IMAGE) {
        dispatch(getChurchBannerImage(secure_url));
      } else if (actionType === CHURCH_LOGO) {
        console.log("CHURCH_LOGO: ", secure_url)
      } else {
        dispatch(getUserImage(secure_url));
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setIsLoading(false);
    }
  };

  // Update image when avatar changes in Redux store
  useEffect(() => {
    if (avatar?.url) {
      setImage(avatar.url);
    }
  }, [avatar]);

  return (
    <View>
      {isLoading && <LoaderB />}
      <TouchableOpacity style={styles.avatarContainer} onPress={pickImageFromGallery}>
        <Avatar.Image 
          size={size ? size : 125} 
          source={{ uri: image }} 
          style={styles.avatar} 
        />
      </TouchableOpacity>
    </View>
  );
};

export default GalleryPicker;

// Styles for the component
const styles = StyleSheet.create({
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
