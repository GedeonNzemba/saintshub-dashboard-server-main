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
import DashboardLoader from "../../sections/DashboardLoader";
import { CHURCH_BANNER_IMAGE, CHURCH_IMAGE, CHURCH_LOGO, DEACONS_IMAGE, GALLERY_IMAGES, PASTOR_WIFE, PASTOR_WIFE_IMAGE, TRUSTEE_IMAGE } from "../../../constants/userConstants";
import { getPrincipalImage } from "../../../hooks/redux/dashboard/getPrincipalImage";
import { getPastorWifesImage } from "../../../hooks/redux/dashboard/getPastorWIfeIMage";
import { getChurchBannerImage } from "../../../hooks/redux/dashboard/getChurchBanners";
import { getChurchLogo } from "../../../hooks/redux/dashboard/getChurchLogo";
import { handleFileUpload } from "../../../utilities/functionality";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native";
import { getChurchImage } from "@/hooks/redux/dashboard/getChurchImage";
import { getChurchGallery } from "@/hooks/redux/dashboard/getGalleries";
import { updateDeacons } from "@/hooks/redux/action";
import { setDeaconImage } from '../../../hooks/redux/dashboard/deaconImages';
import { setTrusteeImage } from "@/hooks/redux/dashboard/trusteeImages";

interface IProps {
    name: string;
    actionType: string;
    onUploadStart?: () => void;
    multiple?: boolean;
    index?: number;
}

const DashboardImageUploader: React.FC<IProps> = ({ name, actionType, onUploadStart, multiple = false, index }) => {
    const dispatch = useDispatch();

    // State for managing the selected image URL and loading state
    const [isLoading, setIsLoading] = useState(false);

    // Get avatar data from Redux store
    const { avatar } = useSelector((state: RootState) => state.reducer.updateUserData);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: !multiple,
            aspect: [4, 3],
            quality: 1,
            allowsMultipleSelection: multiple,
            selectionLimit: multiple ? 10 : 1,
        });

        if (!result.canceled) {
            onUploadStart?.();
            setIsLoading(true);

            if (multiple) {
                // Handle multiple images
                for (const asset of result.assets) {
                    await uploadImage(asset.uri);
                }
            } else {
                // Handle single image
                await uploadImage(result.assets[0].uri);
            }

            setIsLoading(false);
        }
    };

    const uploadImage = async (uri: string) => {
        const formData = new FormData();
        formData.append("profileImage", {
            uri,
            name: "image.jpg",
            type: "image/jpg",
        } as any);

        await fetch(`${URI_domain}/api/upload-file-to-cloud`, {
            method: "POST",
            headers: {
                "Content-Type": "multipart/form-data",
            },
            body: formData,
        })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error('Error uploading file to cloud');
                }
                const { result }: ResponseImage = data;
                let { secure_url } = result;

                console.log("Upload success:", secure_url);

                switch (actionType) {
                    case CHURCH_LOGO:
                        dispatch(getChurchLogo(secure_url));
                        break;
                    case PASTOR_WIFE_IMAGE:
                        dispatch(getPastorWifesImage(secure_url));
                        break;
                    case CHURCH_IMAGE:
                        dispatch(getChurchImage(secure_url));
                        break;
                    case CHURCH_BANNER_IMAGE:
                        dispatch(getChurchBannerImage(secure_url));
                        break;
                    case DEACONS_IMAGE:
                        if (index !== undefined) {
                            dispatch(setDeaconImage({ deaconId: index.toString(), imageUrl: secure_url }));
                        }
                        break;
                    case TRUSTEE_IMAGE:
                        if (index !== undefined) {
                            dispatch(setTrusteeImage({ trusteeId: name, imageUrl: secure_url }));
                        }
                        break;
                    case GALLERY_IMAGES:
                        dispatch(getChurchGallery(secure_url));
                        break;
                    default:
                        dispatch(getUserImage(secure_url));
                }
            })
            .catch((error: Error) => {
                console.info("File size too large. Maximum is 10mb");
                console.log("Error uploading imagep:", error.message);

            });
    };

    return (
        <React.Fragment>
            <View>
                <TouchableOpacity
                    onPress={pickImage}
                    style={[
                        styles.buttonContainer,
                    ]}
                >
                    <View style={styles.buttonContent}>
                        <MaterialCommunityIcons
                            name={'upload'}
                            size={20}
                            color={"#fff"}
                            style={styles.buttonIcon}
                        />
                        <Text style={styles.buttonText}>{name}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </React.Fragment>
    );
};

export default DashboardImageUploader;

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
    buttonContainer: {
        backgroundColor: '#052b4e',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 10,
    },
    buttonText: {
        color: 'white',
        fontFamily: 'RobotoRegular',
        fontSize: 16,
    },
    buttonIcon: {
        color: 'white',
        fontFamily: 'RobotoRegular',
        fontSize: 16,
        marginRight: 5,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    }
});
