import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { TextInput, Button, Divider } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/_layout";
import { DEACONS_IMAGE, TRUSTEE_IMAGE } from "../../constants/userConstants";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";
import { ResponseImageUploaded, URI_domain } from "../../utilities/tools";
import { getDeaconsImage } from "../../hooks/redux/dashboard/getDeaconImage";
import { getTrusteesImage } from "../../hooks/redux/dashboard/getTrusteeImage";
import LoaderB from "../sections/LoaderB";
import { setLoading } from "../../hooks/redux/loader/Loader";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Security {
  names: string;
  descriptions: string;
  image: string;
}

interface IProps {
  deacons: Security[];
  trustees: Security[];
}

interface Type {
  type: "deacons" | "trustees";
}

// interface SecurityFormProps {
//   securities: IProps;
//   setSecurities: React.Dispatch<React.SetStateAction<IProps>>;
//   type: "deacons" | "trustees";
//   deaconImage: string; // assuming you have a state variable for the dynamic image
//   setDeaconImage: React.Dispatch<React.SetStateAction<string>>;
// }

interface SecurityFormProps {
  securities: Security[];
  setSecurities: React.Dispatch<React.SetStateAction<Security[]>>;
  type: "deacons" | "trustees";
}

const SecurityForm: React.FC<SecurityFormProps> = ({ securities, setSecurities, type }) => {
  const dispatch = useDispatch();

  const [image, setImage] = useState<string>("");

  // LOADING
  const { loading } = useSelector((state: RootState) => state.reducer.loading);

  const addSecurity = () => {
    const newSecurity: Security = {
      names: "",
      descriptions: "",
      image: "",
    };

    setSecurities((prevSecurities) => [...prevSecurities, newSecurity]);
  };

  const handleInputChange = (index: number, field: keyof Security, value: string | undefined) => {
    setSecurities((prevSecurities) => {
      const updatedSecurities = [...prevSecurities];
      updatedSecurities[index] = {
        ...updatedSecurities[index],
        [field]: value,
      };
      return updatedSecurities;
    });
  };

  const handleImageSelect = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    dispatch(setLoading(true));

    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      await uploadImage(result.uri, index === 0 ? DEACONS_IMAGE : TRUSTEE_IMAGE)
        .then((data) => {
          console.log("AFTER_UPLOAD: ", data);
          handleInputChange(index, "image", data);
        })
        .catch((error) => console.error(error));

      //handleInputChange(index, 'image', result.assets[0].uri);
      console.log("OUTSIDE_UPLOAD: ", image);

      dispatch(setLoading(false));
    }
  };

  // IMAGE UPLOADER
  const uploadImage = async (uri: string, actionType: typeof DEACONS_IMAGE | typeof TRUSTEE_IMAGE) => {
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

      if (actionType === DEACONS_IMAGE) {
        dispatch(getDeaconsImage(data.secure_url));
        console.log("Upload DEACONS_IMAGE: ", data.secure_url);
        return data.secure_url;
      }

      if (actionType === TRUSTEE_IMAGE) {
        dispatch(getTrusteesImage(data.secure_url));
        console.log("Upload TRUSTEE_IMAGE: ", data.secure_url);
        return data.secure_url;
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleSubmit = async () => {
    dispatch(setLoading(true));
    // Save securities data based on the type (deacons or trustees)
    const key = type === "deacons" ? "deaconData" : "trusteeData";
    const dataToSave = JSON.stringify(securities);

    // Save to local storage
    await AsyncStorage.setItem(key, dataToSave);
    dispatch(setLoading(false));

    console.log(`Collected ${type} data:`, securities);
  };

  return (
    <View>
      {securities.map((security, index) => (
        <View key={index}>
          <TextInput placeholder="Name" value={security.names} onChangeText={(text) => handleInputChange(index, "names", text)} mode="outlined" style={{ marginTop: 10, marginBottom: 10, backgroundColor: "transparent" }} keyboardType="default" />
          <TextInput placeholder="Description" value={security.descriptions} onChangeText={(text) => handleInputChange(index, "descriptions", text)} multiline numberOfLines={5} mode="outlined" style={{ marginTop: 10, marginBottom: 10, backgroundColor: "transparent" }} keyboardType="default" />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput placeholder="Image URL" value={security.image} onChangeText={(text) => handleInputChange(index, "image", text)} mode="outlined" style={{ width: "54%", marginTop: 10, marginBottom: 10, backgroundColor: "transparent" }} keyboardType="default" />
            <Button onPress={() => handleImageSelect(index)} mode="elevated" elevation={4} style={{ width: "40%", marginLeft: "6%" }}>
              Select Image
            </Button>
          </View>
          {security.image && <Image source={{ uri: security.image }} style={{ width: 100, height: 100 }} />}
        </View>
      ))}
      <View style={{}}>
        <Button onPress={addSecurity} mode="elevated" elevation={4} style={{ marginTop: 10 }}>
          Add New
        </Button>
        <Button onPress={handleSubmit} mode="contained" style={{marginTop: 15}}>Save</Button>
      </View>

      {loading && <LoaderB />}
    </View>
  );
  // const [securities, setSecurities] = useState({
  //   deacons: [
  //     {
  //       names: '',
  //       descriptions: '',
  //       image: '',
  //     },
  //   ],
  //   trustees: [
  //     {
  //       names: '',
  //       descriptions: '',
  //       image: '',
  //     },
  //   ],
  // });

  // const [deaconImage, setDeaconImage] = useState<string>('');
  // const [trusteeImage, setTrusteeImage] = useState<string>('');

  // const { deaconsImage } = useSelector((state: RootState) => state.reducer.getDeaconsImage);
  // const { trusteesImage } = useSelector((state: RootState) => state.reducer.getTrusteesImage);

  // const addSecurity = () => {
  //   const newSecurity: Security = {
  //     names: "",
  //     descriptions: "",
  //     image: "",
  //   };

  //   setSecurities((prevSecurities) => ({
  //     ...prevSecurities,
  //     [type]: [...prevSecurities[type], newSecurity],
  //   }));
  // };

  // const handleInputChange = (index: number, field: keyof Security, value: string) => {
  //   console.log("VALUE: ", value);
  //   setSecurities((prevSecurities) => {
  //     const updatedSecurities = [...prevSecurities[type]];
  //     updatedSecurities[index] = {
  //       ...updatedSecurities[index],
  //       [field]: value,
  //     };
  //     return { ...prevSecurities, [type]: updatedSecurities };
  //   });
  // };

  // const handleSubmit = () => {
  //   console.log("Collected data:", securities);
  // };

  // // const onChange = (deaconsImage: string) => {
  // //   setDeaconImage(deaconsImage)
  // // }

  // useEffect(() => {
  //   if (deaconsImage) setDeaconImage(deaconsImage);
  //   if (trusteesImage) setTrusteeImage(trusteesImage);

  //   console.log('DEACON: ', deaconImage)
  //   console.log('TRUSTEE: ', trusteeImage)

  // }, [deaconsImage, trusteesImage])

  // return (
  //   <View>
  //     {securities[type].map((security, index) => (
  //         <View key={index} style={{backgroundColor: `#f${index}f${index}f${index}`}}>

  //         <TextInput placeholder="Name"  mode="outlined" style={{ marginTop: 10, backgroundColor: "transparent", }}  keyboardType="default" value={security.names} onChangeText={(text) => handleInputChange(index, "names", text)} />
  //         <TextInput placeholder="Description" mode="outlined" style={{ marginTop: 10, backgroundColor: "transparent", }} multiline numberOfLines={5} keyboardType="default" value={security.descriptions} onChangeText={(text) => handleInputChange(index, "descriptions", text)} />
  //         {type === "deacons" && <TextInput placeholder="Image URL" mode="outlined" style={{ marginTop: 10, marginBottom: 10, backgroundColor: "transparent", }} keyboardType="default"  value={security.image} onChangeText={(text) => handleInputChange(index, "image", text)} />}
  //         {type === "trustees" && <TextInput disabled placeholder="Image URL" mode="outlined" style={{ marginTop: 10, marginBottom: 10, backgroundColor: "transparent", }} keyboardType="default" value={trusteeImage} onChangeText={(text) => handleInputChange(index, "image", text)} />}

  //         <GalleryPicker actionType={type === "deacons" ? DEACONS_IMAGE : TRUSTEE_IMAGE} />
  //         <Divider bold  />
  //         </View>
  //     ))}
  //     <Button  onPress={addSecurity} mode="outlined" style={{marginTop: 15}}>{`Add another ${type}`}</Button>
  //     <Button onPress={handleSubmit} mode="contained" style={{marginTop: 15}}>Save</Button>
  //   </View>
  // );
};

export default SecurityForm;
