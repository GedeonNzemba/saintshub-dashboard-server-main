import AsyncStorage from "@react-native-async-storage/async-storage";
import { decodedToken } from "../tools/users/decodeToken";
import { Token } from "./tools";
import { router } from "expo-router";

// Add array of auth routes that should skip token validation
const AUTH_ROUTES = ['/(auth)/login', '/(auth)/signup'];

export const validateToken = async (currentPath?: string) => {
  // Skip validation for auth routes
  if (currentPath && AUTH_ROUTES.some(route => currentPath.includes(route))) {
    return true;
  }

  try {
    const token = await AsyncStorage.getItem("token");
    
    if (!token) {
      console.log("No token found - redirecting to signup");
      router.replace("/(auth)/signup");
      return false;
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const decoded = await decodedToken(token) as Token;

    if (!decoded.exp || currentTimestamp > decoded.exp) {
      console.log("Token expired - redirecting to login");
      await AsyncStorage.removeItem("token");
      router.replace("/(auth)/login");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Token validation error:", error);
    await AsyncStorage.removeItem("token");
    router.replace("/(auth)/login");
    return false;
  }
};

export const startTokenValidationInterval = () => {
  // Check token every 5 minutes
  const intervalId = setInterval(validateToken, 5 * 60 * 1000);
  return intervalId;
}; 