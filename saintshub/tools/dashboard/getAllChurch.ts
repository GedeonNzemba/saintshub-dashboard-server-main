import axios, { AxiosResponse } from "axios";
import { URI_domain, CHURCH_DB } from "../../utilities/tools";

export const getAllChurch = async (authToken: string): Promise<CHURCH_DB[]> => {
  try {
    const response: AxiosResponse<CHURCH_DB[]> = await axios.get(`${URI_domain}/api/dashboard/churches`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    // Assuming the API response contains the user data
    const churches = response.data;

    // Handle the user data
    // console.log("CHURCHES DATA ", churches);

    return churches;
  } catch (error) {
    // Handle errors
    console.error("Error fetching churches:", error);
    // You might want to throw the error or return a default user state here
    throw error;
  }
};
