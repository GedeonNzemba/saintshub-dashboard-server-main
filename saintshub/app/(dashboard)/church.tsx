import { FlatList, Image, StyleSheet, Text, View, ScrollView, Alert, Dimensions } from "react-native";
import React, { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Appbar, FAB, TextInput } from "react-native-paper";
import { useSelector } from "react-redux";
import { useRouter, useLocalSearchParams } from "expo-router";
import { RootState } from "@/app/_layout";
import LoaderA from "@/components/sections/Loader";
import * as ImagePicker from "expo-image-picker";
import Spacer from "@/tools/Spacer";
import { Church as ChurchData, ResponseImageUploaded, URI_domain } from "@/utilities/tools";
import { updateChurch } from "@/tools/dashboard/updateChurch";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  REMOVE_CHURCH_FAIL, 
  REMOVE_CHURCH_SUCCESS,
  REMOVE_DEACON_FAIL,
  REMOVE_DEACON_SUCCESS,
  REMOVE_LIVE_SERVICE_FAIL,
  REMOVE_LIVE_SERVICE_SUCCESS,
  REMOVE_PAST_SERVICE_FAIL,
  REMOVE_PAST_SERVICE_SUCCESS,
  REMOVE_SONG_FAIL,
  REMOVE_SONG_SUCCESS,
  REMOVE_TRUSTEE_FAIL,
  REMOVE_TRUSTEE_SUCCESS,
  UPDATE_CHURCH_FAIL
} from "@/constants/userConstants";
import GalleryPicker from "@/components/recycle/imagePicker/Test";
import { 
  removeBannerImage, 
  removeGalleryImage, 
  removePastService, 
  removedDeacon,
  removedLive,
  removedSong,
  removedTrustee 
} from "@/tools/dashboard/removeGalleryImage";
import { FontAwesome } from '@expo/vector-icons';

const initialChurchState: ChurchData = {
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

interface initialStateDisabled {
  churchName: boolean;
  churchLocation: boolean;
  pastorName: boolean;
  wifeName: boolean;
  pastorWifeDescription: boolean;
  deaconName: boolean; // Change here
  deaconDescription: boolean;
  trusteeName: boolean;
  trusteeDescription: boolean;
  pastServiceTitle: boolean;
  pastServicePreacherName: boolean;
  pastServiceSermonUrl: boolean;
  liveServiceTitle: boolean,
  liveServicePreacherName: boolean,
  liveServiceSermonUrl: boolean,
  songTitle: boolean;
  songUrl: boolean;
}

interface DataProps {
  data: ChurchData;
}

const { width } = Dimensions.get("window");
const imageWidth = width * 0.4; // Adjust the percentage as needed

const BANNERS = "BANNERS";
const GALLERY = "GALLERY";
const DEACONS = "DEACONS";
const TRUSTEE = "TRUSTEE";

const Church = () => {
  const router = useRouter();
  const params = useLocalSearchParams() as unknown as DataProps;

  const [isHidden, setIsHidden] = useState(true);

  const [church, setChurch] = useState<ChurchData>(initialChurchState);
  const [editedChurchName, setEditedChurchName] = useState(church.name);
  const [editedChurcLocation, setEditedChurchLocation] = useState(church.location);
  const [editedChurchPastorName, setEditedChurchPastorName] = useState(church.principal.pastor);
  const [editedChurchWife, setEditedChurchWife] = useState(church.principal.wife);
  const [editedChurchDescription, setEditedChurchDescription] = useState(church.principal.description)

  const [loading, setLoading] = useState<boolean>(false);
  const [dataHasLoaded, setDataHasLoaded] = useState<boolean>(true);

  const [disabled, setDisabled] = useState<initialStateDisabled>({
    churchName: true,
    churchLocation: true,
    pastorName: true,
    wifeName: true,
    pastorWifeDescription: true,
    deaconName: true,
    deaconDescription: true,
    trusteeName: true,
    trusteeDescription: true,
    pastServiceTitle: true,
    pastServicePreacherName: true,
    pastServiceSermonUrl: true,
    liveServiceTitle: true,
    liveServicePreacherName: true,
    liveServiceSermonUrl: true,
    songTitle: true,
    songUrl: true,
  });

  const { pastorWifeImage } = useSelector((state: RootState) => state.reducer.getPastorWIfeIMage);
  const { churchImage } = useSelector((state: RootState) => state.reducer.getChurchImage);
  const { logo } = useSelector((state: RootState) => state.reducer.getLogo);


  const updateChurchNameDisabled = () => {
    setDisabled({ ...disabled, churchName: !disabled.churchName });
  };

  const updateChurchLocationDisabled = () => {
    setDisabled({ ...disabled, churchLocation: !disabled.churchLocation });
  };

  const updatePastorNameDisabled = () => {
    setDisabled({ ...disabled, pastorName: !disabled.pastorName });
  };

  const updateWifeNameDisabled = () => {
    setDisabled({ ...disabled, wifeName: !disabled.wifeName });
  };

  const updatePastorWifeDescriptionDisabled = () => {
    setDisabled({ ...disabled, pastorWifeDescription: !disabled.pastorWifeDescription });
  };

  const updateDeaconNameDisabled = () => {
    setDisabled({ ...disabled, deaconName: !disabled.deaconName });
  };

  const updateDeaconDescriptionDisabled = () => {
    setDisabled({ ...disabled, deaconDescription: !disabled.deaconDescription });
  };

  const updateTrusteeNameDisabled = () => {
    setDisabled({ ...disabled, trusteeName: !disabled.trusteeName });
  };

  const updateTrusteeDescriptionDisabled = () => {
    setDisabled({ ...disabled, trusteeDescription: !disabled.trusteeDescription });
  };

  // PAST & LIVE SERVICES
  const updatePastServiceTitleNameDisabled = () => {
    setDisabled({ ...disabled, pastServiceTitle: !disabled.pastServiceTitle });
  };

  const updateLiveServiceTitleNameDisabled = () => {
    setDisabled({ ...disabled, liveServiceTitle: !disabled.liveServiceTitle });
  };

  const updatePastServicePreacherNameDisabled = () => {
    setDisabled({ ...disabled, pastServicePreacherName: !disabled.pastServicePreacherName });
  };

  const updateLiveServicePreacherNameDisabled = () => {
    setDisabled({ ...disabled, liveServicePreacherName: !disabled.liveServicePreacherName });
  };

  const updatePastServiceSermonUrlDisabled = () => {
    setDisabled({ ...disabled, pastServiceSermonUrl: !disabled.pastServiceSermonUrl });
  };

  const updateLiveServiceSermonUrlDisabled = () => {
    setDisabled({ ...disabled, liveServiceSermonUrl: !disabled.liveServiceSermonUrl });
  };



  const updateSongTitleDisabled = () => {
    setDisabled({ ...disabled, songTitle: !disabled.songTitle });
  };

  const updateSongUrlDisabled = () => {
    setDisabled({ ...disabled, songUrl: !disabled.songUrl });
  };

  const handleUpdateChurch = async () => {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      updateChurch({ authToken: token, id: church._id, body: church })
        .then(() => Alert.alert("Updated successfully. Refresh the page."))
        .catch((error) => console.error('unable to save changes ', error.message));
    } else {
      Alert.alert(UPDATE_CHURCH_FAIL + ": NOT_AUTHENTICATED");
    }
  };

  const handleRemoveGalleryImage = async (index: number) => {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");

    if (token) {
      removeGalleryImage({ authToken: token, id: church._id, index: index })
        .then(() => {
          setLoading(false)
          console.log(REMOVE_CHURCH_SUCCESS)

          const updatedGallery = church.gallery.filter((_, i) => i !== index);
          setChurch({ ...church, gallery: updatedGallery });
          window.alert("Image removed successfully ! Please refresh")
        })
        .catch((error) => console.error(error));
    } else {
      alert(REMOVE_CHURCH_FAIL + ": REMOVE_CHURCH_FAIL");
      setLoading(false);
    }
  }

  const handleRemoveBannerImage = async (index: number) => {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");

    if (token) {
      removeBannerImage({ authToken: token, id: church._id, index: index })
        .then(() => {
          setLoading(false)
          console.log(REMOVE_CHURCH_SUCCESS)

          const updatedBanner = church.banner.filter((_, i) => i !== index);
          setChurch({ ...church, banner: updatedBanner });
          window.alert("Image removed successfully ! Please refresh")
        })
        .catch((error) => console.error(error));
    } else {
      alert(REMOVE_CHURCH_FAIL + ": REMOVE_CHURCH_FAIL");
      setLoading(false);
    }
  };

  const handleRemovePastService = async (index: number) => {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");

    if (token) {
      removePastService({ authToken: token, id: church._id, index: index })
        .then(() => {
          setLoading(false)
          console.log(REMOVE_PAST_SERVICE_SUCCESS)

          const updatedPastService = church.oldServices.filter((_, i) => i !== index);
          setChurch({ ...church, oldServices: updatedPastService });
          window.alert("Past Service removed successfully ! Please refresh")
        })
        .catch((error) => console.error(error));
    } else {
      alert(REMOVE_PAST_SERVICE_FAIL);
      setLoading(false);
    }
  };

  const handleRemoveSong = async (index: number) => {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");

    if (token) {
      removedSong({ authToken: token, id: church._id, index: index })
        .then(() => {
          setLoading(false)
          console.log(REMOVE_SONG_SUCCESS)

          const updatedSong = church.songs.filter((_, i) => i !== index);
          setChurch({ ...church, songs: updatedSong });
          window.alert("Song removed successfully ! Please refresh")
        })
        .catch((error) => console.error(error));
    } else {
      alert(REMOVE_SONG_FAIL);
      setLoading(false);
    }
  };

  const [text, setText] = React.useState("");

  // ADD NEW DEACON
  const addNewDeacon = () => {
    setLoading(true);
    const newDeacon = {
      names: "",
      descriptions: "",
      image: "https://placehold.co/600x400/000000/FFFFFF/png",
    };

    setChurch({
      ...church,
      securities: {
        ...church.securities,
        deacons: [...church.securities.deacons, newDeacon],
      },
    });
    setLoading(false);
  };

  const handleRemoveDeacon = async (index: number) => {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");

    if (token) {
      removedDeacon({ authToken: token, id: church._id, index: index })
        .then(() => {
          setLoading(false)
          console.log(REMOVE_DEACON_SUCCESS)

          const updatedDeacon = church.securities.deacons.filter((_, i) => i !== index);
          setChurch({ ...church, securities: { ...church.securities, deacons: updatedDeacon } });
          window.alert("Deacon removed successfully ! Please refresh")
        })
        .catch((error) => console.error(error));
    } else {
      alert(REMOVE_DEACON_FAIL);
      setLoading(false);
    }
  };

  const handleRemoveTrustee = async (index: number) => {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");

    if (token) {
      removedTrustee({ authToken: token, id: church._id, index: index })
        .then(() => {
          setLoading(false)
          console.log(REMOVE_TRUSTEE_SUCCESS)

          const updatedTrustee = church.securities.trustees.filter((_, i) => i !== index);
          setChurch({ ...church, securities: { ...church.securities, trustees: updatedTrustee } });
          window.alert("Trustee removed successfully ! Please refresh")
        })
        .catch((error) => console.error(error));
    } else {
      alert(REMOVE_TRUSTEE_FAIL);
      setLoading(false);
    }
  };

  const handleRemoveLiveService = async (index: number) => {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");

    if (token) {
      removedLive({ authToken: token, id: church._id, index: index })
        .then(() => {
          setLoading(false)
          console.log(REMOVE_LIVE_SERVICE_SUCCESS)

          const updatedLiveService = church.liveServices.filter((_, i) => i !== index);
          setChurch({ ...church, liveServices: updatedLiveService });
          window.alert("Live Service removed successfully ! Please refresh")
        })
        .catch((error) => console.error(error));
    } else {
      alert(REMOVE_LIVE_SERVICE_FAIL);
      setLoading(false);
    }
  };

  // TRUSTEE
  const addNewTrustee = () => {
    setLoading(true);
    const newTrustee = {
      names: "",
      descriptions: "",
      image: "https://placehold.co/600x400/000000/FFFFFF/png",
    };

    setChurch({
      ...church,
      securities: {
        ...church.securities,
        trustees: [...church.securities.trustees, newTrustee],
      },
    });
    setLoading(false);
  };

  // const removeTrustee = (index: number) => {
  //   setLoading(true);
  //   const updatedTrustee = [...church.securities.trustees];
  //   updatedTrustee.splice(index, 1);

  //   setChurch({
  //     ...church,
  //     securities: {
  //       ...church.securities,
  //       trustees: updatedTrustee,
  //     },
  //   });

  //   setTimeout(() => {
  //     setLoading(false);
  //   }, 1000);
  // };

  // PAST SERVICE
  const addNewPastService = () => {
    setLoading(true);
    const newOldService = {
      title: "",
      preacher: "",
      sermon: ""
    };

    setChurch({
      ...church,
      oldServices: [...church.oldServices, newOldService],
    });

    setLoading(false);
  };

  // SONGS
  const addNewSong = () => {
    setLoading(true);
    const newSong = {
      title: "",
      url: "",
    };

    setChurch({
      ...church,
      songs: [...church.songs, newSong],
    });

    setLoading(false);
  };

  // LIVE SERVICES
  const addNewLiveService = () => {
    setLoading(true);
    const newLiveService = {
      title: "",
      preacher: "",
      sermon: ""
    };

    setChurch({
      ...church,
      liveServices: [...church.liveServices, newLiveService],
    });

    setLoading(false);
  };


  const pickImageFromGallery = async (type: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    setLoading(true);

    if (!result.canceled) {
      if (type === BANNERS) {
        await uploadImage(result.assets[0].uri, BANNERS)
          .then((data) => {
            if (data) {
              const updatedBanner = [...church.banner, data];
              setChurch({ ...church, banner: updatedBanner });
              window.alert("Banner image added successfully. Please click Update Content !")
            }

          })
        setLoading(false);
      }

      if (type === GALLERY) {
        await uploadImage(result.assets[0].uri, GALLERY)
          .then((data) => {
            if (data) {
              const updatedGallery = [...church.gallery, data];
              setChurch({ ...church, gallery: updatedGallery });
              window.alert("Gallery image added successfully. Please click Update Content !")
            }
          })
        setLoading(false);
      }

    } else {
      setLoading(false);
    }
  };

  const uploadImage = async (uri: string, type?: string) => {
    const formData = new FormData();
    formData.append("profileImage", {
      uri,
      name: "image.jpg",
      type: "image/jpg",
    } as any);

    try {
      const response = await fetch(`${URI_domain}/api/upload-file-to-cloud`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const data: ResponseImageUploaded = await response.json();
      console.log(type === BANNERS ? `BANNER DATA: ${JSON.stringify(data)}` : type === GALLERY ? `GALLER DATA: ${JSON.stringify(data)}` : '')

      const { result } = data;

      if (type === BANNERS) {
        let updatedBanner = [...church.banner]; // Create a copy
        updatedBanner.push(result.secure_url); // Add to the copy
        console.log("NEW_BANNER PUSH: ", updatedBanner)
        setChurch({ ...church, banner: updatedBanner }); // Update state
        console.log("UPDATED_BANNER: ", updatedBanner)
      }

      if (type === GALLERY) {
        let updatedGallery = [...church.gallery]; // Create a copy
        updatedGallery.push(result.secure_url); // Add to the copy
        console.log("NEW_GALLERY PUSH: ", updatedGallery)
        setChurch({ ...church, gallery: updatedGallery }); // Update state
        console.log("UPDATED_GALLERY: ", updatedGallery)
      }

      if (type === DEACONS) {
        return result.secure_url;
        //setNewDeaconImage(data.secure_url);
      }

      if (type === TRUSTEE) {
        return result.secure_url;
        //setNewTrusteeImage(data.secure_url);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleDeaconImageUpdate = async (uri: string, index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    setLoading(true);

    if (!result.canceled) {
      console.log("INSIDE RESULT")
      await uploadImage(result.assets[0].uri, DEACONS)
        .then((imageUrl) => {
          if (imageUrl) {
            console.log("IMG: " + imageUrl);
            // Clone the church object
            const updatedChurch = { ...church };

            // Update the image URL of the deacon at the specified index
            if (index >= 0 && index < updatedChurch.securities.deacons.length) {
              updatedChurch.securities.deacons[index].image = imageUrl;
            }

            // Update the state with the modified church object
            setChurch(updatedChurch);
            // console.log("LATEST CHURCH___: ", church)
          }
        })
        .catch((error) => console.log("Unable to upload image: ", error));
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  const handleTrusteeImageUpdate = async (uri: string, index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    setLoading(true);

    if (!result.canceled) {
      console.log("INSIDE RESULT")
      await uploadImage(result.assets[0].uri, TRUSTEE)
        .then((imageUrl) => {
          if (imageUrl) {
            console.log("IMG: " + imageUrl);
            // Clone the church object
            const updatedChurch = { ...church };

            // Update the image URL of the deacon at the specified index
            if (index >= 0 && index < updatedChurch.securities.trustees.length) {
              updatedChurch.securities.trustees[index].image = imageUrl;
            }

            // Update the state with the modified church object
            setChurch(updatedChurch);
            // console.log("LATEST CHURCH___: ", church)
          }
        })
        .catch((error) => console.log("Unable to upload image: ", error));
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  const handleGalleryUpload = () => {
    pickImageFromGallery(GALLERY)
      .catch((error) => window.alert(`ERROR: ${error}`));
  }

  const handleBannerUpload = () => {
    pickImageFromGallery(BANNERS)
      .catch((error) => window.alert(`ERROR: ${error}`));
  }

  const handleDeaconNameChange = (text: string, index: number) => {
    const updatedDeacons = [...church.securities.deacons];
    updatedDeacons[index].names = text;
    setChurch(prevState => ({
      ...prevState,
      securities: {
        ...prevState.securities,
        deacons: updatedDeacons
      }
    }));
  };

  const handleTrusteeNameChange = (text: string, index: number) => {
    const updatedTrustees = [...church.securities.trustees];
    updatedTrustees[index].names = text;
    setChurch(prevState => ({
      ...prevState,
      securities: {
        ...prevState.securities,
        trustees: updatedTrustees
      }
    }));
  };

  const handleDeaconDescriptionChange = (text: string, index: number) => {
    const updatedDeacons = [...church.securities.deacons];
    updatedDeacons[index].descriptions = text;
    setChurch(prevState => ({
      ...prevState,
      securities: {
        ...prevState.securities,
        deacons: updatedDeacons
      }
    }));
  };

  const handleTrusteeDescriptionChange = (text: string, index: number) => {
    const updatedTrustees = [...church.securities.trustees];
    updatedTrustees[index].descriptions = text;
    setChurch(prevState => ({
      ...prevState,
      securities: {
        ...prevState.securities,
        trustees: updatedTrustees
      }
    }));
  };

  // past services & Live Service
  const handlePastServiceTitleChange = (text: string, index: number) => {
    const updatedServices = [...church.oldServices];
    updatedServices[index].title = text;
    setChurch(prevState => ({
      ...prevState,
      oldServices: updatedServices
    }));
  };

  const handleLiveServiceTitleChange = (text: string, index: number) => {
    const updatedServices = [...church.liveServices];
    updatedServices[index].title = text;
    setChurch(prevState => ({
      ...prevState,
      liveServices: updatedServices
    }));
  };

  const handlePastServicePreacherChange = (text: string, index: number) => {
    const updatedServices = [...church.oldServices];
    updatedServices[index].preacher = text;
    setChurch(prevState => ({
      ...prevState,
      oldServices: updatedServices
    }));
  };

  const handleLiveServicePreacherChange = (text: string, index: number) => {
    const updatedServices = [...church.liveServices];
    updatedServices[index].preacher = text;
    setChurch(prevState => ({
      ...prevState,
      liveServices: updatedServices
    }));
  };

  const handlePastServiceSermonChange = (text: string, index: number) => {
    const updatedServices = [...church.oldServices];
    updatedServices[index].sermon = text;
    setChurch(prevState => ({
      ...prevState,
      oldServices: updatedServices
    }));
  };

  const handleLiveServiceSermonChange = (text: string, index: number) => {
    const updatedServices = [...church.liveServices];
    updatedServices[index].sermon = text;
    setChurch(prevState => ({
      ...prevState,
      liveServices: updatedServices
    }));
  };


  // songs
  const handleSongTitleChange = (text: string, index: number) => {
    const updatedSongs = [...church.songs];
    updatedSongs[index].title = text;
    setChurch(prevState => ({
      ...prevState,
      songs: updatedSongs
    }));
  };



  const handleSongUrlChange = (text: string, index: number) => {
    const updatedSongs = [...church.songs];
    updatedSongs[index].url = text;
    setChurch(prevState => ({
      ...prevState,
      songs: updatedSongs
    }));
  };


  useEffect(() => {
    // console.log("CHURCH DATA: ", churchData?.data);
    const { data } = params;

    setChurch((prevChurch) => ({
      ...prevChurch,
      __v: data.__v,
      banner: data.banner,
      gallery: data.gallery,
      image: data.image,
      liveServices: data.liveServices,
      location: data.location,
      name: data.name,
      oldServices: data.oldServices,
      principal: data.principal,
      logo: data.logo,
      securities: data.securities,
      _id: data._id,
      songs: data.songs,
    }));

    if (church._id !== undefined) {
      console.log("Data has already been loaded")
      setDataHasLoaded(false);
    } else {
      setDataHasLoaded(true);
    }
    //console.log("CHURCH::: ", church);
  }, [params, dataHasLoaded]);

  useEffect(() => {
    if (editedChurchName !== church.name && !disabled.churchName) {
      setChurch({ ...church, name: editedChurchName });
    }

    if (editedChurcLocation !== church.location && !disabled.churchLocation) {
      setChurch({ ...church, location: editedChurcLocation });
    }

    if (editedChurchPastorName !== church.principal.pastor && !disabled.pastorName) {
      setChurch({ ...church, principal: { ...church.principal, pastor: editedChurchPastorName } });
    }

    if (editedChurchWife !== church.principal.wife && !disabled.wifeName) {
      setChurch({ ...church, principal: { ...church.principal, wife: editedChurchWife } });
    }

    if (editedChurchDescription !== church.principal.description && !disabled.pastorWifeDescription) {
      setChurch({ ...church, principal: { ...church.principal, description: editedChurchDescription } });
    }
  }, [editedChurchName, editedChurcLocation, editedChurchPastorName, editedChurchWife, editedChurchDescription]);

  useEffect(() => {

    if (logo) {
      setChurch({ ...church, logo: logo })
      // console.log("CHECK CHURCH: ", church)
    }

  }, [logo]);

  useEffect(() => {
    console.log("PAST_WIFE_IMAGE: ", pastorWifeImage);

    if (pastorWifeImage) {
      setChurch({ ...church, principal: { ...church.principal, image: pastorWifeImage } });
    }

  }, [pastorWifeImage]);

  useEffect(() => {
    console.log("CHURCH_IMAGE: ", churchImage);

    if (churchImage) {
      setChurch({ ...church, image: churchImage });
    }

  }, [churchImage]);




  return (
    <View>
      {loading && <LoaderA />}
      {/* {dataHasLoaded && <LoaderA />} */}
      {church && (
        <>
          <Appbar.Header>
            <Appbar.BackAction accessibilityLabel="Back" onPress={() => router.back()} />
            <Appbar.Content
              title="Back"
              titleStyle={{
                alignSelf: "flex-start",
                fontFamily: "Roboto_500Medium",
              }}
              onPress={() => router.back()}
            />
          </Appbar.Header>

          <ScrollView style={{ marginBottom: 80 }}>
            <View style={styles.headerBottom}>
              <Text style={styles.headerText}>Add Church</Text>
              <Text style={styles.headerSubText}>All fields should not be empty, Gedeon !</Text>
            </View>

            {/* LIVE */}
            <View style={styles.container}>
              <View style={styles.box}>
                <Text style={styles.boxHeader}>Live Services</Text>

                {church.liveServices.map((liveService, index) => (
                  <View style={styles.itemContainer} key={index}>
                    <View style={styles.boxItem}>
                      <TextInput
                        label="Title Name"
                        value={liveService.title}
                        onChangeText={(text) => handleLiveServiceTitleChange(text, index)} // Pass index to identify the service
                        // disabled={disabled.liveServiceTitle}
                        style={[styles.boxItemText, {width: '100%', backgroundColor: '#c7c7c7'}]}
                      />

                      {/* <View>
                            <View style={[{ backgroundColor: '#EBDEFA', padding: 15, borderRadius: 50 }, styles.raised]}>
                         <Icon
                          size={30}
                          name='pencil'
                          type='font-awesome'
                          color="#000"
                          onPress={updateLiveServiceTitleNameDisabled}
                        />
                        </View> 
                      </View>*/}
                    </View>

                    <Spacer />

                    <View style={styles.boxItem}>
                      <TextInput
                        label="Preacher Name"
                        value={liveService.preacher}
                        onChangeText={(text) => handleLiveServicePreacherChange(text, index)} // Pass index to identify the service
                        // disabled={disabled.liveServicePreacherName}
                        style={[styles.boxItemText, {width: '100%', backgroundColor: '#c7c7c7'}]}
                      />

                      {/* <View>
                        <View style={[{ backgroundColor: '#EBDEFA', padding: 15, borderRadius: 50 }, styles.raised]}>
                          <Icon
                            size={30}
                            name='pencil'
                            type='font-awesome'
                            color="#000000"
                            onPress={updateLiveServicePreacherNameDisabled}
                          />
                        </View>
                      </View> */}
                    </View>

                    <Spacer />

                    <View style={styles.boxItem}>
                      <TextInput
                        label="Sermon URL"
                        value={liveService.sermon}
                        onChangeText={(text) => handleLiveServiceSermonChange(text, index)} // Pass index to identify the service
                        // disabled={disabled.liveServiceSermonUrl}
                        style={[styles.boxItemText, {width: '100%'}]}
                      />

                      {/* <View>
                        <View style={[{ backgroundColor: '#EBDEFA', padding: 15, borderRadius: 50 }, styles.raised]}>
                          <Icon
                            size={30}
                            name='pencil'
                            type='font-awesome'
                            color="#000000"
                            onPress={updatePastServiceSermonUrlDisabled}
                          />
                        </View>
                      </View> */}
                    </View>

                    <Spacer />
                    <TouchableOpacity style={[styles.btn, { marginTop: 0, marginBottom: 15, backgroundColor: '#bd0606', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]} onPress={() => handleRemoveLiveService(index)}>
                      <FontAwesome
                        size={30}
                        name="trash"
                        color="#ffffff"
                      />
                      <Text style={styles.btnText}>Remove </Text>
                    </TouchableOpacity>
                  </View>
                ))}


                <Spacer />

                <TouchableOpacity style={[styles.btn, { marginTop: 0, marginBottom: 15 }]} onPress={handleUpdateChurch}>
                  <Text style={styles.btnText}>Update Content </Text>
                </TouchableOpacity>


                <View>
                  <FAB icon="update" label="Add New Live Service" style={styles.fab} onPress={addNewLiveService} />
                </View>
              </View>
            </View>

            <View style={styles.container}>
              <View style={styles.box}>
                <Text style={styles.boxHeader}>General</Text>

                <View style={styles.boxItem}>
                  <TextInput label="Church Name" value={church.name} onChangeText={setEditedChurchName} disabled={disabled.churchName} style={styles.boxItemText} />

                  <FAB icon="pen" style={styles.fab} onPress={updateChurchNameDisabled} />
                </View>

                <Spacer />

                <View style={styles.boxItem}>
                  <TextInput label="Church Location" value={church.location} onChangeText={setEditedChurchLocation} disabled={disabled.churchLocation} style={styles.boxItemText} />

                  <FAB icon="pen" style={styles.fab} onPress={updateChurchLocationDisabled} />
                </View>

                <Spacer />

                {!logo && <GalleryPicker actionType="CHURCH_LOGO" upload={() => setIsHidden(false)} img={church.logo} size={180} />}

                {logo && <GalleryPicker actionType="CHURCH_LOGO" upload={() => setIsHidden(false)} img={logo} size={180} />}

                <TouchableOpacity style={styles.btn} onPress={handleUpdateChurch}>
                  <Text style={styles.btnText}>Update Content </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.container}>
              <View style={styles.box}>
                <Text style={styles.boxHeader}>Principal</Text>

                <View style={styles.boxItem}>
                  <TextInput label="Pastor" value={church.principal?.pastor} onChangeText={setEditedChurchPastorName} disabled={disabled.pastorName} style={styles.boxItemText} />

                  <FAB icon="pen" style={styles.fab} onPress={updatePastorNameDisabled} />
                </View>

                <Spacer />

                <View style={styles.boxItem}>
                  <TextInput label="Wife" value={church.principal?.wife} onChangeText={setEditedChurchWife} disabled={disabled.wifeName} style={styles.boxItemText} />

                  <FAB icon="pen" style={styles.fab} onPress={updateWifeNameDisabled} />
                </View>

                <Spacer />

                <View style={styles.boxItem}>
                  <TextInput label="Description" multiline numberOfLines={5} value={church.principal?.description} onChangeText={setEditedChurchDescription} disabled={disabled.pastorWifeDescription} style={styles.boxItemText} />

                  <View>
                    <FAB icon="pen" style={styles.fab} onPress={updatePastorWifeDescriptionDisabled} />
                  </View>
                </View>

                <Spacer />

                <View style={styles.boxItemContainer}>
                  {/* <Image source={{ uri: church.principal.image }} style={styles.img} /> */}
                  <GalleryPicker actionType="PASTOR_WIFE_IMAGE" upload={() => setIsHidden(false)} img={church.principal.image} size={280} />
                 {/* {pastorWifeImage &&  <Image source={{ uri: pastorWifeImage }} style={styles.img} />} */}

                  <View>
                    <FAB icon="upload" label="Pastor & Wife" style={styles.fab} onPress={() => setDisabled({ ...disabled, churchLocation: !disabled.churchLocation })} />
                  </View>
                </View>

                <Spacer />
                <Spacer />



                {/* BANNERS */}
                <View style={{ borderWidth: 1, padding: 15, borderRadius: 25 }}>
                  <View style={styles.boxItemContainer}>
                    <View style={styles.multipleImageWrapper}>
                      <FlatList
                        data={church.banner}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item, index }) => (
                          <View style={styles.renderItem}>
                            <Image source={{ uri: item }} style={styles.image} />
                            <View style={[{ backgroundColor: '#EBDEFA', padding: 15, borderRadius: 50 }, styles.raised, styles.fabRenderItem]}>
                              <FontAwesome
                                size={30}
                                name="trash"
                                color="#ffffff"
                                onPress={() => handleRemoveBannerImage(index)}
                              />
                            </View>
                          </View>
                        )}
                      />
                    </View>
                    {/*  */}
                    <View>
                      <FAB icon="upload" label="Church Banners" style={styles.fab} onPress={handleBannerUpload} />
                    </View>
                  </View>

                  <TouchableOpacity style={styles.btn} onPress={handleUpdateChurch}>
                    <Text style={styles.btnText}>Update Content </Text>
                  </TouchableOpacity>
                </View>

                <Spacer />
                <Spacer />

                <View style={styles.boxItemContainer}>
                  {/* <Image source={{ uri: church.image }} style={styles.img} /> */}
                  <GalleryPicker actionType="CHURCH_IMAGE" upload={() => setIsHidden(false)} img={church.image} size={280} />

                  <View>
                    <FAB icon="upload" label="Church Image" style={styles.fab} onPress={() => setDisabled({ ...disabled, churchLocation: !disabled.churchLocation })} />
                  </View>
                </View>

                <Spacer />
                <Spacer />

                {/* GALLERY */}
                <View style={{ borderWidth: 1, padding: 15, borderRadius: 25 }}>
                  <View style={styles.boxItemContainer}>
                    <View style={styles.multipleImageWrapper}>
                      <FlatList
                        data={church.gallery}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item, index }) => (
                          <View style={styles.renderItem}>
                            <Image source={{ uri: item }} style={styles.image} />

                            <View style={[{ backgroundColor: '#EBDEFA', padding: 15, borderRadius: 50 }, styles.raised, styles.fabRenderItem]}>
                              <FontAwesome
                                size={30}
                                name="trash"
                                color="#ffffff"
                                onPress={() => handleRemoveGalleryImage(index)}
                              />
                            </View>
                          </View>
                        )}
                      />
                    </View>
                    {/*  */}
                    <View>
                      <FAB icon="upload" label="Church Gallery" style={styles.fab} onPress={handleGalleryUpload} />
                    </View>
                  </View>

                  <TouchableOpacity style={styles.btn} onPress={handleUpdateChurch}>
                    <Text style={styles.btnText}>Update Content </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.container}>
              <View style={styles.box}>
                <Text style={styles.boxHeader}>Deacon</Text>

                {church.securities.deacons.map((deacon, index) => (
                  <View style={styles.itemContainer} key={index}>
                    <View style={styles.boxItem}>
                      <TextInput label="Deacon Name" value={deacon.names} onChangeText={(text) => handleDeaconNameChange(text, index)} disabled={disabled.deaconName} style={styles.boxItemText} />

                      <View>
                        {/* <FAB icon="pen" size="small" style={styles.fab} onPress={updateDeaconNameDisabled} /> */}
                        <View style={[{ backgroundColor: '#EBDEFA', padding: 15, borderRadius: 50 }, styles.raised]}>
                          <FontAwesome
                            size={30}
                            name="pencil"
                            color="#000"
                            onPress={updateDeaconNameDisabled}
                          />
                        </View>
                      </View>
                    </View>

                    <Spacer />

                    <View style={styles.boxItem}>
                      <TextInput label="Description" multiline numberOfLines={5} value={deacon.descriptions} onChangeText={(text) => handleDeaconDescriptionChange(text, index)} disabled={disabled.deaconDescription} style={styles.boxItemText} />

                      <View>
                        {/* <FAB icon="pen" size="small" style={styles.fab} onPress={updateDeaconDescriptionDisabled} /> */}
                        <View style={[{ backgroundColor: '#EBDEFA', padding: 15, borderRadius: 50 }, styles.raised]}>
                          <FontAwesome
                            size={30}
                            name="pencil"
                            color="#000"
                            onPress={updateDeaconDescriptionDisabled}
                          />
                        </View>
                      </View>
                    </View>

                    <Spacer />

                    <View style={styles.boxItemContainer}>
                      <TouchableOpacity onPress={() => handleDeaconImageUpdate(deacon.image, index)}>
                        <Image source={{ uri: deacon.image }} style={styles.img} />
                      </TouchableOpacity>

                      <View>
                        {/* <FAB icon="delete" color="#fff" label="Remove Deacon" style={styles.delFab} onPress={() => removeDeacon(index)} /> */}
                        {/* <View style={[{ backgroundColor: '#EBDEFA', padding: 15, borderRadius: 50 }, styles.raised]}>
                         <Icon
                          size={30}
                          name='trash'
                          type='font-awesome'
                          color="#000"
                          onPress={() => removeDeacon(index)}
                        />
                        </View> */}

                        <TouchableOpacity style={[styles.btn, { marginTop: 0, marginBottom: 15, backgroundColor: '#bd0606', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]} onPress={() => handleRemoveDeacon(index)}>
                          <FontAwesome
                            size={30}
                            name="trash"
                            color="#ffffff"
                          />
                          <Text style={styles.btnText}>Remove </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}

                <Spacer />

                <TouchableOpacity style={[styles.btn, { marginTop: 0, marginBottom: 15 }]} onPress={handleUpdateChurch}>
                  <Text style={styles.btnText}>Update Content </Text>
                </TouchableOpacity>

                <View>
                  <FAB icon="update" label="Add New Deacon" style={styles.fab} onPress={addNewDeacon} />
                </View>
              </View>
            </View>

            <View style={styles.container}>
              <View style={styles.box}>
                <Text style={styles.boxHeader}>Trustee</Text>

                {church.securities.trustees.map((trustee, index) => (
                  <View style={styles.itemContainer} key={index}>
                    <View style={styles.boxItem}>
                      <TextInput label="Trustee Name" value={trustee.names} onChangeText={(text) => handleTrusteeNameChange(text, index)} disabled={disabled.trusteeName} style={styles.boxItemText} />

                      <View>
                        {/* <FAB icon="pen" size="small" style={styles.fab} onPress={updateTrusteeNameDisabled} /> */}
                        <View style={[{ backgroundColor: '#EBDEFA', padding: 15, borderRadius: 50 }, styles.raised]}>
                          <FontAwesome
                            size={30}
                            name="pencil"
                            color="#000"
                            onPress={updateTrusteeNameDisabled}
                          />
                        </View>
                      </View>
                    </View>

                    <Spacer />

                    <View style={styles.boxItem}>
                      <TextInput label="Description" multiline numberOfLines={5} value={trustee.descriptions} onChangeText={(text) => handleTrusteeDescriptionChange(text, index)} disabled={disabled.trusteeDescription} style={styles.boxItemText} />

                      <View>
                        {/* <FAB icon="pen" size="small" style={styles.fab} onPress={updateTrusteeDescriptionDisabled} /> */}
                        <View style={[{ backgroundColor: '#EBDEFA', padding: 15, borderRadius: 50 }, styles.raised]}>
                          <FontAwesome
                            size={30}
                            name="pencil"
                            color="#000"
                            onPress={updateTrusteeDescriptionDisabled}
                          />
                        </View>
                      </View>
                    </View>

                    <Spacer />

                    <View style={styles.boxItemContainer}>
                      <TouchableOpacity onPress={() => handleTrusteeImageUpdate(trustee.image, index)}>
                        <Image source={{ uri: trustee.image }} style={styles.img} />
                      </TouchableOpacity>

                      <View>
                        {/* <View style={[{ backgroundColor: '#EBDEFA', padding: 15, borderRadius: 50 }, styles.raised]}>
                         <Icon
                          size={30}
                          name='trash'
                          type='font-awesome'
                          color="#000"
                          onPress={() => removeTrustee(index)}
                        />
                        </View> */}

                        <TouchableOpacity style={[styles.btn, { marginTop: 0, marginBottom: 15, backgroundColor: '#bd0606', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]} onPress={() => handleRemoveTrustee(index)}>
                          <FontAwesome
                            size={30}
                            name="trash"
                            color="#ffffff"
                          />
                          <Text style={styles.btnText}>Remove </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}

                <Spacer />

                <TouchableOpacity style={[styles.btn, { marginTop: 0, marginBottom: 15 }]} onPress={handleUpdateChurch}>
                  <Text style={styles.btnText}>Update Content </Text>
                </TouchableOpacity>

                <View>
                  <FAB icon="update" label="Add New Trustee" style={styles.fab} onPress={addNewTrustee} />
                </View>
              </View>
            </View>

            <View style={styles.container}>
              <View style={styles.box}>
                <Text style={styles.boxHeader}>Past Services</Text>

                {church.oldServices.map((oldService, index) => (
                  <View style={styles.itemContainer} key={index}>
                    <View style={styles.boxItem}>
                      <TextInput
                        label="Title Name"
                        value={oldService.title}
                        onChangeText={(text) => handlePastServiceTitleChange(text, index)} // Pass index to identify the service
                        disabled={disabled.pastServiceTitle}
                        style={styles.boxItemText}
                      />

                      <View>
                        <View style={[{ backgroundColor: '#EBDEFA', padding: 15, borderRadius: 50 }, styles.raised]}>
                          <FontAwesome
                            size={30}
                            name="pencil"
                            color="#000"
                            onPress={updatePastServiceTitleNameDisabled}
                          />
                        </View>
                      </View>
                    </View>

                    <Spacer />

                    <View style={styles.boxItem}>
                      <TextInput
                        label="Preacher Name"
                        value={oldService.preacher}
                        onChangeText={(text) => handlePastServicePreacherChange(text, index)} // Pass index to identify the service
                        disabled={disabled.pastServicePreacherName}
                        style={styles.boxItemText}
                      />

                      <View>
                        <View style={[{ backgroundColor: '#EBDEFA', padding: 15, borderRadius: 50 }, styles.raised]}>
                          <FontAwesome
                            size={30}
                            name="pencil"
                            color="#000"
                            onPress={updatePastServicePreacherNameDisabled}
                          />
                        </View>
                      </View>
                    </View>

                    <Spacer />

                    <View style={styles.boxItem}>
                      <TextInput
                        label="Sermon URL"
                        value={oldService.sermon}
                        onChangeText={(text) => handlePastServiceSermonChange(text, index)} // Pass index to identify the service
                        disabled={disabled.pastServiceSermonUrl}
                        style={styles.boxItemText}
                      />

                      <View>
                        <View style={[{ backgroundColor: '#EBDEFA', padding: 15, borderRadius: 50 }, styles.raised]}>
                          <FontAwesome
                            size={30}
                            name="pencil"
                            color="#000"
                            onPress={updatePastServiceSermonUrlDisabled}
                          />
                        </View>
                      </View>
                    </View>

                    <Spacer />
                    <TouchableOpacity style={[styles.btn, { marginTop: 0, marginBottom: 15, backgroundColor: '#bd0606', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]} onPress={() => handleRemovePastService(index)}>
                      <FontAwesome
                        size={30}
                        name="trash"
                        color="#ffffff"
                      />
                      <Text style={styles.btnText}>Remove </Text>
                    </TouchableOpacity>
                  </View>
                ))}


                <Spacer />

                <TouchableOpacity style={[styles.btn, { marginTop: 0, marginBottom: 15 }]} onPress={handleUpdateChurch}>
                  <Text style={styles.btnText}>Update Content </Text>
                </TouchableOpacity>


                <View>
                  <FAB icon="update" label="Add Past Service" style={styles.fab} onPress={addNewPastService} />
                </View>
              </View>
            </View>

            <View style={styles.container}>
              <View style={styles.box}>
                <Text style={styles.boxHeader}>Songs</Text>

                {church.songs.map((song, index) => (
                  <View style={styles.itemContainer} key={index}>
                    <View style={styles.boxItem}>
                      <TextInput
                        label="Song Title"
                        value={song.title}
                        onChangeText={(text) => handleSongTitleChange(text, index)} // Pass index to identify the song
                        disabled={disabled.songTitle}
                        style={styles.boxItemText}
                      />

                      <View>
                        <View style={[{ backgroundColor: '#EBDEFA', padding: 15, borderRadius: 50 }, styles.raised]}>
                          <FontAwesome
                            size={30}
                            name="pencil"
                            color="#000"
                            onPress={updateSongTitleDisabled}
                          />
                        </View>
                      </View>
                    </View>

                    <Spacer />

                    <View style={styles.boxItem}>
                      <TextInput
                        label="Song URL"
                        value={song.url}
                        onChangeText={(text) => handleSongUrlChange(text, index)} // Pass index to identify the song
                        disabled={disabled.songUrl}
                        style={styles.boxItemText}
                      />

                      <View style={{ elevation: 8 }}>
                        <View style={[{ backgroundColor: '#EBDEFA', padding: 15, borderRadius: 50 }, styles.raised]}>
                          <FontAwesome
                            size={30}
                            name="pencil"
                            color="#000"
                            onPress={updateSongUrlDisabled}
                          />
                        </View>
                      </View>
                    </View>

                    <Spacer />

                    <TouchableOpacity style={[styles.btn, { marginTop: 0, marginBottom: 15, backgroundColor: '#bd0606', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]} onPress={() => handleRemoveSong(index)}>
                      <FontAwesome
                        size={30}
                        name="trash"
                        color="#ffffff"
                      />
                      <Text style={styles.btnText}>Remove </Text>
                    </TouchableOpacity>
                  </View>
                ))}


                <Spacer />

                <TouchableOpacity style={[styles.btn, { marginTop: 0, marginBottom: 15 }]} onPress={handleUpdateChurch}>
                  <Text style={styles.btnText}>Update Content </Text>
                </TouchableOpacity>


                <View>
                  <FAB icon="update" label="Add New Song" style={styles.fab} onPress={addNewSong} />
                </View>
              </View>
            </View>
          </ScrollView>
        </>
      )}

    </View>
  );
};

export default Church;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 25,
  },
  itemContainer: {
    borderWidth: 1.2,
    borderColor: "#121212",
    borderRadius: 25,
    padding: 15,
    marginBottom: 25,
  },
  box: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.39,
    shadowRadius: 8.3,

    elevation: 13,
  },
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
    paddingTop: 15,
  },
  headerText: {
    fontSize: 28,
    color: "#000000",
    fontFamily: "Roboto_500Medium",
  },
  boxHeader: {
    fontSize: 20,
    color: "#000000",
    fontFamily: "Roboto_500Medium",
    marginBottom: 15,
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
  btn: {
    backgroundColor: "#000000",
    marginTop: 25,
    borderRadius: 25,
  },
  btnText: {
    fontSize: 18,
    fontFamily: "Roboto_500Medium",
    padding: 15,
    color: "#ffffff",
    textAlign: "center",
  },
  boxItem: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  boxItemContainer: {
    display: "flex",
    flexDirection: "column",
    rowGap: 18,
    justifyContent: "space-between",
  },
  boxItemText: {
    width: "77%",
  },
  fab: {
    //margin: 16,
  },
  fabRenderItem: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#8e0606",
    borderRadius: 100,
  },
  img: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
    borderRadius: 50,
  },
  image: {
    width: imageWidth,
    height: imageWidth, // Set the height to maintain aspect ratio
    borderRadius: 8,
    margin: 5,
  },
  multipleImageWrapper: {
    marginVertical: 10,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  delFab: {
    backgroundColor: "#be0404",
  },
  renderItem: {
    position: "relative",
  },
  raised: {
    elevation: 3,
  }
});
