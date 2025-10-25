import jwtDecode from "jwt-decode";
import { Token } from "../../utilities/tools";

export const decodedToken = (token: string): Token => {
  return jwtDecode(token);
};

export const isTokenExpired = (exp: number) => {
  try {
    // Get the expiration timestamp from the token
    const expirationTime = exp * 1000; // Convert to milliseconds

    // Get the current timestamp
    const currentTime = Date.now();

    // Compare the expiration time with the current time
    return currentTime > expirationTime;
  } catch (error) {
    // If there's an error decoding the token, it's not valid
    return true;
  }
};


// Example token (replace this with your actual token)
//const token = 'your.jwt.token';

// Decode the token to get the payload data
//const decodedToken = jwtDecode(token);

// Access the ID or any other data you need from the token
//const userId = decodedToken.id; // Replace 'id' with the key corresponding to the ID in your token payload
