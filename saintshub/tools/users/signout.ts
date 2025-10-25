import axios, { AxiosResponse } from "axios";
import { URI_domain, UserState } from "../../utilities/tools";

export const logoutUser = async (authToken: string) => {
  try {
    const response: AxiosResponse = await axios.get(`${URI_domain}/api/user/logout`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    // Assuming the API response contains the user data
    const user = response.data;

    // Handle the user data
    console.log("USER REMOVED ", user);

  } catch (error) {
    // Handle errors
    console.error("Error REMOVING user:", error);
    // You might want to throw the error or return a default user state her
    throw error;
  }
};