import { Platform, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { Appbar, Avatar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Church, LiveService } from "../../utilities/tools";
import * as ImagePicker from "expo-image-picker";
import { uploadImage } from "@/tools/dashboard/uploadImage";
import { useDispatch, useSelector } from "react-redux";
import LoaderB from "../../components/sections/LoaderB";
import { GALLARY, BANNER } from "../../constants/userConstants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WebViewIframe from "../../components/dashboard/iframe/WebView";
import { useRouter } from "expo-router";
import { handleCreateChurch } from "@/tools/dashboard/createChurch";
import { setLoading } from "@/hooks/redux/loader/Loader";
import { RootState } from "../_layout";

const initialChurchState: Church = {
  logo: "",
  _id: "",
  name: "",
  principal: {
    description: "",
    image: "",
    pastor: "",
    wife: "",
  },
  location: "",
  image: "",
  banner: [],
  securities: {
    deacons: [],
    trustees: [],
  },
  oldServices: [],
  liveServices: [],
  gallery: [],
  songs: [],
  __v: 0,
};
interface Security {
  names: string;
  descriptions: string;
  image: string;
}

const CreateChurch = () => {
  const router = useRouter()
  const dispatch = useDispatch();

  const [pastorNwife, setPastorNwife] = useState<string>("");
  const [churchPicture, setChurchPicture] = useState<string>("");
  const [galleryImages__form, setGalleryImages__form] = useState<string[]>([]);
  const [bannerImages__form, setBannerImages__form] = useState<string[]>([]);

  const [formData, setFormData] = useState<Church>(initialChurchState);

  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [bannerImages, setBannerImages] = useState<string[]>([]);
  const [user, setUser] = React.useState<{ name: string; avatar: { url: string } }>({
    name: "",
    avatar: {
      url: "",
    },
  });

  const [deaconss, setDeacons] = useState<Security[]>([]);
  const [oldService, setOldServices] = useState<LiveService[]>([]);
  const [liveService, setLiveServices] = useState<LiveService[]>([]);
  const [songsServices, setSongsServices] = useState<string[]>([]);

  const [trusteess, setTrustees] = useState<Security[]>([
    {
      names: "",
      descriptions: "",
      image: "",
    },
  ]);

  // LOADING
  const { loading } = useSelector((state: RootState) => state.reducer.loading);
  const { name, email, avatar, password, surname } = useSelector((state: RootState) => state.reducer.updateUserData);

  const { principalImage } = useSelector((state: RootState) => state.reducer.getPrincipalImage);
  const { churchImage } = useSelector((state: RootState) => state.reducer.getChurchImage);
  const { deaconsImage } = useSelector((state: RootState) => state.reducer.getDeaconsImage);

  const handleSongSubmission = (songs: { title: string; url: string }[]) => {
    console.log("Submitted Songs:", songs);
  };

  const handlePastServiceSubmission = (pastServices: { preacher: string; sermon: string; title: string }[]) => {
    console.log("Submitted Past Services:", pastServices);
  };

  const handleLiveServiceSubmission = (liveServices: { preacher: string; sermon: string; title: string }[]) => {
    console.log("Submitted Live Services:", liveServices);
  };

  const handleSubmit = () => {
    console.log("Deacons:", deaconss);
    console.log("Trustees:", trusteess);
  };

  const openImagePicker = async (actionType: typeof GALLARY | typeof BANNER) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri as string;
      if (actionType === GALLARY) {
        setGalleryImages((prevImages) => [...prevImages, uri]);
        console.log("1 done ", galleryImages);
      } else if (actionType === BANNER) {
        setBannerImages((prevImages) => [...prevImages, uri]);
        console.log("2 done ", bannerImages);
      } else {
        console.log("NOT IN RANGE");
      }
    }
  };

  const handleUploadImages = async (actionType: typeof GALLARY | typeof BANNER) => {
    dispatch(setLoading(true));
    const uploadedImageUrls__gallery: string[] = [];
    const uploadedImageUrls__banner: string[] = [];

    if (actionType === GALLARY) {
      console.log("INSIDE: ", GALLARY);
      for (const uri of galleryImages) {
        await uploadImage(uri)
          .then((imageUrl: string) => {
            if (imageUrl) uploadedImageUrls__gallery.push(imageUrl);
          })
          .finally(() => {
            setFormData((prevData) => ({
              ...prevData,
              gallery: uploadedImageUrls__gallery,
            }));
          });
      }

      console.log("Uploaded Image URLs GALLARY:", uploadedImageUrls__gallery);
      console.log("Uploaded Image URLs GALLARY FORM:", galleryImages__form);
    }

    if (actionType === BANNER) {
      console.log("INSIDE: ", BANNER);
      for (const uri of bannerImages) {
        await uploadImage(uri)
          .then((imageUrl: string) => {
            if (imageUrl) uploadedImageUrls__banner.push(imageUrl);
          })
          .finally(() => {
            setFormData((prevData) => ({
              ...prevData,
              banner: uploadedImageUrls__banner,
            }));
          });
      }
    }

    dispatch(setLoading(false));
  };

  const uploadNewChurchData = (formData: Church) => {
    handleCreateChurch(formData).then((data: Church) => console.info("CREATED CHURCH: ", JSON.stringify(data)))
      .then(() => window.alert("Submitted Successfully !"))
      .catch((error: any) => console.log('UNABLE TO CREATE CHURCH: ', error));
  }

  const fetchData = async () => {
    try {
      dispatch(setLoading(true));

      const deaconState = await AsyncStorage.getItem("deaconData");
      const trusteeState = await AsyncStorage.getItem("trusteeData");
      const pastServices = await AsyncStorage.getItem("pastServices");
      const liveServices = await AsyncStorage.getItem("liveServices");
      const songsServices = await AsyncStorage.getItem("songsServices");

      console.log("DEACONS_STATE: ", deaconState);
      console.log("TRUSTEES_STATE: ", trusteeState);
      console.log("PAST_SERVICES: ", pastServices);
      console.log("LIVE_SERVICES: ", liveServices);
      console.log("SONGS_SERVICES: ", songsServices);

      // Parse deaconData and set deaconState
      if (deaconState) {
        const parsedDeaconData: Security[] = JSON.parse(deaconState);
        setDeacons(parsedDeaconData);
        console.log("parsedDeaconData: ", parsedDeaconData);

        setFormData((prevFormData) => ({
          ...prevFormData,
          securities: {
            ...prevFormData.securities,
            deacons: parsedDeaconData,
          },
        }));
      }

      if (trusteeState) {
        const parsedTrusteeData: Security[] = JSON.parse(trusteeState);
        setDeacons(parsedTrusteeData);
        console.log("parsedTrusteeData: ", parsedTrusteeData);

        setFormData((prevFormData) => ({
          ...prevFormData,
          securities: {
            ...prevFormData.securities,
            trustees: parsedTrusteeData,
          },
        }));
      }

      if (pastServices) {
        const parsedPastServicesData: LiveService[] = JSON.parse(pastServices);
        setOldServices(parsedPastServicesData);
        console.log("parsedPastServicesData: ", parsedPastServicesData);

        setFormData((prevFormData) => ({
          ...prevFormData,
          oldServices: parsedPastServicesData,
        }));
      }

      if (liveServices) {
        const parsedLiveServicesData: LiveService[] = JSON.parse(liveServices);
        setLiveServices(parsedLiveServicesData);
        console.log("parsedLiveServicesData: ", parsedLiveServicesData);

        setFormData((prevFormData) => ({
          ...prevFormData,
          liveServices: parsedLiveServicesData,
        }));
      }

      if (songsServices) {
        const parsedSongsServicesData: string[] = JSON.parse(songsServices);
        setSongsServices(parsedSongsServicesData);
        console.log("parsedSongsServicesData: ", parsedSongsServicesData);
      }

      setTimeout(() => {
        uploadNewChurchData(formData);
      }, 4000);

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleButtonClick = () => {
    dispatch(setLoading(true));
    fetchData();
    dispatch(setLoading(false));
  };

  useEffect(() => {
    // Check and request permission
    const requestPermission = async () => {
      if (Platform.OS === "android" || Platform.OS === "ios") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          console.log("Permission denied");
        }
      }
    };

    requestPermission();
  }, []);

  useEffect(() => {
    if (principalImage) setFormData({ ...formData, principal: { ...formData.principal, image: principalImage } });
  }, [principalImage]);

  useEffect(() => {
    if (churchImage) setFormData({ ...formData, image: churchImage });
  }, [churchImage]);

  useEffect(() => {
    if (deaconsImage) {
      setFormData((prevData) => ({
        ...prevData,
        securities: {
          ...prevData.securities,
          deacons: [
            {
              ...prevData.securities.deacons[0],
              image: deaconsImage,
            },
          ],
        },
      }));
    }
  }, [deaconsImage]);

  useEffect(() => {
    console.log("CHECKING FORMDATA: ", JSON.stringify(formData));
  }, [formData]);

  React.useEffect(() => {
    setUser({ ...user, name: name, avatar: avatar });
  }, [name, avatar]);

  if (!name && !avatar) {
    dispatch(setLoading(true));
  } else {
    dispatch(setLoading(false));
  }

  const webUrl = 'https://saintshub-dashboard-frontend-rirscga9u-gedeonnzemba.vercel.app/';

  if (!webUrl) {
    return <Text>Error: Web URL is empty</Text>;
  }

  const targetElementHeader = "body header";

  const code = `
    // Add CSS styles
    var customStyle = document.createElement('style');
    customStyle.innerHTML = 'body main { margin-block-start: unset !important; } main div div.sticky {top: 0} #bottom-widgets {display: none} footer {display: none !important} ';
    document.head.appendChild(customStyle);

    // Add JavaScript logic
    var elementToRemove = document.querySelector('${targetElementHeader}');
if (elementToRemove) {
elementToRemove.remove();
}
  `;

  return (
    <View style={styles.wrapper}>
      {loading && <LoaderB />}
      <View style={styles.header}>
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuWrapper}>
            <Appbar.BackAction accessibilityLabel="Back" iconColor="#000000" onPress={() => router.back()} />
          </TouchableOpacity>
        </View>

        <View style={styles.avatar}>
          <Avatar.Image size={100} source={{ uri: user.avatar.url }} />
        </View>
      </View>

      <View style={styles.headerBottom}>
        <Text style={styles.headerText}>Add Church</Text>
        <Text style={styles.headerSubText}>All fields should not be empty, {user.name} !</Text>
      </View>

      {/* IFRAME */}
      <WebViewIframe />
    </View>
  );
};

export default CreateChurch;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#E0E5E9",
    height: "100%",
    width: "100%",
  },
  webview: {
    flex: 1,
  },
  menu: {},
  menuWrapper: {},
  avatar: {},

  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 45,
    paddingLeft: 15,
    paddingRight: 15,
  },
  headerBottom: {
    paddingLeft: 15,
    paddingRight: 15,
  },
  headerText: {
    fontSize: 28,
    color: "#000000",
    fontFamily: "Roboto_500Medium",
  },
  headerSubText: {
    fontSize: 20,
    color: "#878893",
    fontFamily: "Roboto_500Medium",
    paddingBottom: 15,
  },
  space: {
    marginTop: 40,
    paddingLeft: 15,
    paddingRight: 15,
  },
  spaceWrapper: {
    fontSize: 20,
    color: "#000000",
    fontFamily: "Roboto_500Medium",
    textTransform: "uppercase",
  },
});
