import axios from "axios";
import { ChurchDoc, URI_domain } from "../../utilities/tools";


export const handleCreateChurch = async ({name, logo, principal, location, image, banner, securities, oldServices, liveServices, gallery, songs }: ChurchDoc) => {
  try {
    const response = await axios.post(`${URI_domain}/api/dashboard/create-church`, {
        name: name,
        logo: logo,
        principal:principal,
        location: location,
        image: image,
        banner: banner,
        securities: securities,
        oldServices: oldServices,
        liveServices: liveServices,
        gallery: gallery,
        songs: songs
    });

    const data = await response.data;

    // Save the token to local storage or Redux state for future use
    return data
  } catch (error) {
    console.error("CREATED CHURCH ERROR: ", error);
    // Handle error
  }
};
