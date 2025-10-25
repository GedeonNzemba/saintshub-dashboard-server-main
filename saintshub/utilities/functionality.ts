import { decodedToken } from "@/tools/users/decodeToken";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigation, Token } from "./tools";
import { ParamListBase, RouteProp } from "@react-navigation/native";

export const handleFileUpload = async (selectedFile: string) => {
    const formData = new FormData();
    formData.append('image_file', {
      uri: selectedFile!,
      type: 'image/jpeg',
      name: 'image.jpg',
    } as any);
    formData.append('size', 'auto');

    const api_key = 'yahxkJ1UbAHVcqb7TdP8swu5';

    try {
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': api_key,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      return url;
    } catch (error) {
      console.error('Error uploading file:', error);
    }
};

export  async function isTokenExpired(navigation: StackNavigation, route: RouteProp<ParamListBase>) {
  const token = await AsyncStorage.getItem("token");
  const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds

  const userAuth = async () => {

    if (token !== null) {
      const decoded = (await decodedToken(token)) as Token;
      const { exp } = decoded;

      if (exp && currentTimestamp > exp) {
        // Token has expired
        console.log("isTokenExpired: EXPIRED");
        return navigation.navigate("SignUp");
      }

      // Token is still valid
      console.log("isTokenExpired: VALID");
      return true;
      //return navigation.navigate("Page", {token: token});
    } else {
      console.log("isTokenExpired: EXPIRED or INVALID");
      return navigation.navigate("SignUp");
    }

  }

  if (route.name !== 'index') {
    userAuth();
    console.log('Router: ', route.name);
  }

}