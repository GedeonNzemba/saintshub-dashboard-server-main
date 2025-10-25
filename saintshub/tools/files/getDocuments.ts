import axios, { AxiosResponse } from "axios";
import { URI_domain, documentsData } from "../../utilities/tools";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const handleGetDocuments = async (userToken: string) => {
  // check for token
 

  let headersList = {
    Accept: "*/*",
    "User-Agent": "Thunder Client (https://www.thunderclient.com)",
    Authorization: `Bearer ${userToken}`,
  };

  let reqOptions = {
    url: `${URI_domain}/api/documents/`,
    method: "GET",
    headers: headersList,
  };

  try {
    const response: AxiosResponse<documentsData[]> = await axios.request(
      reqOptions
    );

    const data = response.data;

    // Save the token to local storage or Redux state for future use
    console.info("DOCUMENTS: ", data);

    return data;
  } catch (error) {
    console.error("getDocuments: ", error);
    // Handle error
  }
};
