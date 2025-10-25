import axios, { AxiosResponse } from "axios";
import { Church, URI_domain, UserState } from "../../utilities/tools";
import { Alert } from "react-native";

interface IProps {
  authToken: string;
  id: string;
  index: number;
}

export const removeGalleryImage = async ({ authToken, id, index }: IProps) => {
  try {
    const response = await fetch(`${URI_domain}/api/dashboard/churches/${id}/gallery/${index}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      }
    });

    const church = await response.json();
    console.log("IMAGE DELETED: ", church)
  } catch (error) {
    console.error("Error removing gallery image:", error);
    throw error;
  }
};

export const removeBannerImage = async ({ authToken, id, index }: IProps) => {
  try {
    const response = await fetch(`${URI_domain}/api/dashboard/churches/${id}/banner/${index}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      }
    });

    const church = await response.json();
    console.log("IMAGE DELETED: ", church)
  } catch (error) {
    console.error("Error removing gallery image:", error);
    throw error;
  }
};

export const removePastService = async ({ authToken, id, index }: IProps) => {
  try {
    const response = await fetch(`${URI_domain}/api/dashboard/churches/${id}/past-service/${index}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      }
    });

    const church = await response.json();
    console.log("PAST SERVICE DELETED: ", church)
  } catch (error) {
    console.error("Error removing past service:", error);
    throw error;
  }
};

export const removedDeacon = async ({ authToken, id, index }: IProps) => {
  try {
    const response = await fetch(`${URI_domain}/api/dashboard/churches/${id}/deacon/${index}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      }
    });

    const church = await response.json();
    console.log("DEACON DELETED: ", church)
  } catch (error) {
    console.error("Error removing deacon :", error);
    throw error;
  }
};

export const removedTrustee = async ({ authToken, id, index }: IProps) => {
  try {
    const response = await fetch(`${URI_domain}/api/dashboard/churches/${id}/trustee/${index}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      }
    });

    const church = await response.json();
    console.log("TRUSTEE DELETED: ", church)
  } catch (error) {
    console.error("Error removing trustee :", error);
    throw error;
  }
};

export const removedSong = async ({ authToken, id, index }: IProps) => {
  try {
    const response = await fetch(`${URI_domain}/api/dashboard/churches/${id}/song/${index}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      }
    });

    const church = await response.json();
    console.log("SONG DELETED: ", church)
  } catch (error) {
    console.error("Error removing song :", error);
    throw error;
  }
};

export const removedLive = async ({ authToken, id, index }: IProps) => {
  try {
    console.log("TOKEN: ", authToken)
    console.log("ID: ", id)
    console.log("INDEX: ", index)

    const response = await fetch(`${URI_domain}/api/dashboard/churches/${id}/live/${index}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      }
    });

    const church = await response.json();
    console.log("Live Service DELETED: ", church)
  } catch (error) {
    console.error("Error removing Live Service :", error);
    throw error;
  }
};