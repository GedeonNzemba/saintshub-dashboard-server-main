import axios, { AxiosResponse } from "axios";
import { Church, URI_domain, UserState } from "../../utilities/tools";

interface IProps {
  authToken: string, id: string
}

export const getChurch = async ({authToken, id}:IProps): Promise<Church> => {
  try {
    // console.log("CHECK ID: ", id)
    // console.log("CHECK authToken: ", authToken)

    const response: AxiosResponse<Church> = await axios.get(`${URI_domain}/api/dashboard/church/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    // Assuming the API response contains the user data
    const church: Church = response.data;

    // Handle the user data
    // console.log("CHURCH DATA ", JSON.stringify(church));

    return church;
  } catch (error) {
    // Handle errors
    console.error("Error fetching church:", error);
    // You might want to throw the error or return a default user state here
    throw error;
  }
};
