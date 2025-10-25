import axios, { AxiosResponse } from "axios";
import { Church, URI_domain, UserState } from "../../utilities/tools";
import { Alert } from "react-native";

interface IProps {
  authToken: string, id: string
}

export const removeChurch = async ({authToken, id}:IProps): Promise<void> => {
  try {
    await axios.delete(`${URI_domain}/api/dashboard/church/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    return Alert.alert('Church deleted successfully!')
  } catch (error) {
    console.error("Error fetching church:", error);
    throw error;
  }
};
