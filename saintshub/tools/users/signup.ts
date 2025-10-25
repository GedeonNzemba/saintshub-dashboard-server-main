import axios from "axios";
import { SignUp, URI_domain, UserState } from "../../utilities/tools";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Backend response format
interface SignUpResponse {
  success: boolean;
  message: string;
  token: string;
  user: UserState;
}

export const handleSignUp = async ({
  name,
  surname,
  email,
  avatar,
  password,
  confirmPassword,
  language,
  role,
  selectedChurchId,
  otherChurchName,
}: SignUp) => {
  try {
    const response = await axios.post<SignUpResponse>(`${URI_domain}/api/signup`, {
      name: name,
      surname: surname,
      email: email,
      avatar: avatar,
      password: password,
      confirmPassword: confirmPassword,
      // Add required backend fields with defaults
      language: language || 'en',
      role: role || 'user',
      selectedChurchId: selectedChurchId || '',
      otherChurchName: otherChurchName || '',
    });

    const { token, user, success, message } = response.data;
    
    if (!success) {
      console.error("Sign Up Failed: ", message);
      return { success: false, error: message };
    }

    // Store token in AsyncStorage
    await AsyncStorage.setItem("token", token);
    console.info("TOKEN STORED SUCCESSFULLY!");
    
    return { success: true, token, newUser: user };
  } catch (error: any) {
    console.error("Sign Up Failed: ", error?.response?.data?.message || error?.message);
    const errorMessage = error?.response?.data?.message || error?.message || "Registration failed";
    return { success: false, error: errorMessage };
  }
};