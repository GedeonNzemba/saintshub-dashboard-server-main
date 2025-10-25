import axios, { AxiosResponse } from "axios";
import { SignIn, URI_domain, UserState } from "../../utilities/tools";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Backend response format
interface SignInResponse {
  token?: string;
  user?: UserState;
  message?: string; // For error responses
}

export const handleSignIn = async ({ email, password }: SignIn) => {
  let headersList = {
    Accept: "*/*",
    "Content-Type": "application/json",
  };

  let bodyContent = JSON.stringify({
    email: email,
    password: password,
  });

  let reqOptions = {
    url: `${URI_domain}/api/signin`,
    method: "POST",
    headers: headersList,
    data: bodyContent,
  };
  
  try {
    const response: AxiosResponse<SignInResponse> = await axios.request(reqOptions);
    const { token, user } = response.data;

    if (!token || !user) {
      throw new Error(response.data.message || "Invalid response from server");
    }

    // Store token in AsyncStorage
    await AsyncStorage.setItem("token", token);

    return user;
  } catch (error: any) {
    // Extract and throw a clean error message
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred");
  }
};
