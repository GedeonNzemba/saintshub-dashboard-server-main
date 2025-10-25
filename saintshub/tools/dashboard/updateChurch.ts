import axios, { AxiosResponse } from "axios";
import { ChurchUpdate, URI_domain, UserState } from "../../utilities/tools";

interface IProps {
  authToken: string;
  id: string;
  body: ChurchUpdate;
}

export const updateChurch = async ({ authToken, id, body }: IProps): Promise<ChurchUpdate> => {
  try {
    console.log("HERE IT IS")
    console.log("TOKEN: ", authToken)
    console.log("ID: ", id)
    console.log("body: ", body)

    const response = await fetch(`${URI_domain}/api/dashboard/churches/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to update church: ${response.statusText}`);
    }


    const church = await response.json();
    return church;
  } catch (error) {
    console.error("Error updating church:", error);
    throw error;
  }
};
