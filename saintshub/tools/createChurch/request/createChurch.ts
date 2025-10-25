import axios from 'axios'
import { uriDomain } from '../util'
import { ChurchDoc } from '../tools'

export const handleCreateChurch = async ({
  logo,
  name,
  principal,
  location,
  image,
  banner,
  securities,
  oldServices,
  gallery,
  songs,
}: ChurchDoc) => {
  try {
    const response = await axios.post(
      `${uriDomain}/api/dashboard/create-church`,
      {
        logo: logo,
        name: name,
        principal: principal,
        location: location,
        image: image,
        banner: banner,
        securities: securities,
        oldServices: oldServices,
        gallery: gallery,
        songs: songs,
      }
    )

    const data = await response.data

    // Save the token to local storage or Redux state for future use
    return data
  } catch (error) {
    console.error('CREATED CHURCH ERROR: ', error)
    // Handle error
  }
}
