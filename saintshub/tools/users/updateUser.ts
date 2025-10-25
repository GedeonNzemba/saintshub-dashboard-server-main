import axios, { AxiosResponse } from "axios";
import { URI_domain, UserState } from "../../utilities/tools";
interface IProps {
  name?: string;
  surname?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  avatar?: {
    url: string
  };
  authToken: string;
  targetUpdate: string
}

export const updateUserInfo = async ({ name, surname, email, password, avatar, confirmPassword, targetUpdate, authToken }: IProps) => {
  try {
    console.error("THE TOKEN: ", authToken);
    // Make a PUT request to update user data
    const response = await axios.put(`${URI_domain}/api/user/update-${targetUpdate}`,
      {
        name: name,
        surname: surname,
        email: email,
        avatar: {
          url: avatar?.url
        },
        password: password,
        confirmPassword
        // Other fields as needed
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    // Log or handle the response as needed
    //console.log("PUT RES: ", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
  }
};
