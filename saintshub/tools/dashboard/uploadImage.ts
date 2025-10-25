import { ResponseImageUploaded, URI_domain } from "../../utilities/tools";

// IMAGE UPLOADER
export const uploadImage = async (uri: string) => {
  const formData = new FormData();
  formData.append("profileImage", {
    uri,
    name: "image.jpg",
    type: "image/jpg",
  } as any);

  try {
    const response = await fetch(`${URI_domain}/api/upload-file-to-cloud`, {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    const data: ResponseImageUploaded = await response.json();

    return data.secure_url;
  } catch (error) {
    console.error("Upload failed:", error);
  }
};
