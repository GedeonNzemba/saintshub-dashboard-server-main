import axios, { AxiosResponse } from "axios";
import { URI_domain, UserState } from "../../utilities/tools";

// Backend response format
interface GetUserResponse {
  success: boolean;
  user: UserState;
}

export const getUser = async (authToken: string): Promise<UserState> => {
  try {
    const response: AxiosResponse<GetUserResponse> = await axios.get(`${URI_domain}/api/user`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    // Extract user from new backend response format
    const { user } = response.data;

    // Handle the user data
    console.log("USER DATA ", user);

    return user;
  } catch (error) {
    // Handle errors
    console.error("Error fetching user:", error);
    // You might want to throw the error or return a default user state here
    throw error;
  }
};

