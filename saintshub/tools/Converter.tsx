import {
  launchImageLibraryAsync,
  MediaTypeOptions,
  ImagePickerResult,
} from "expo-image-picker";
import { Cloudinary } from "cloudinary-core";
import React from "react";
import { Button } from "react-native";

interface ImagePickerResponse {
  cancelled: boolean;
  uri: string;
}

const cloudinary = new Cloudinary({ cloud_name: "ddbiofmni" });

const handleImageUpload = async () => {
  const imagePickerOptions = {
    mediaTypes: MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1] as [number, number],
    quality: 1,
  };

  const result: ImagePickerResponse | ImagePickerResult =
    await launchImageLibraryAsync(imagePickerOptions);

  if (!result.cancelled) {
    const formData = new FormData();
    formData.append("file", {
      uri: result.uri,
      type: "image/jpeg",
      name: "upload.jpg",
    } as any);

    formData.append("upload_preset", "ml_default");

    try {
      const response = await fetch(cloudinary.url("image", {}), {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log(responseData.secure_url);
      } else {
        console.log("Image upload failed");
      }
    } catch (error) {
      console.log("Image upload error:", error);
    }
  }
};

const UploadButton = () => {
  return <Button title="Upload Image" onPress={handleImageUpload} />;
};

export default UploadButton;
