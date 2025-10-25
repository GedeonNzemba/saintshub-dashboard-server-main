import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import { View } from "react-native";
import { TextInput, Button } from "react-native-paper";

interface PastServiceFormProps {
  onSubmit: (pastServices: { preacher: string; sermon: string; title: string }[]) => void;
}

const PastServiceForm = () => {
  const [pastServices, setPastServices] = useState<{ preacher: string; sermon: string; title: string }[]>([{ preacher: "", sermon: "", title: "" }]);

  const addServiceField = () => {
    setPastServices((prevPastServices) => [...prevPastServices, { preacher: "", sermon: "", title: "" }]);
  };

  const handleServiceChange = (index: number, field: keyof (typeof pastServices)[0], value: string) => {
    const updatedPastServices = [...pastServices];
    updatedPastServices[index][field] = value;
    setPastServices(updatedPastServices);
  };

  const handleSubmit = async () => {
    // Remove entries with all empty fields
    const filteredPastServices = pastServices.filter((service) => Object.values(service).some((value) => value.trim() !== ""));

    const key = "pastServices";
    const dataToSave = JSON.stringify(filteredPastServices);

    // Save to local storage
    await AsyncStorage.setItem(key, dataToSave);

    console.log("collected data for #pastServices", filteredPastServices);
  };

  return (
    <View>
      {pastServices.map((service, index) => (
        <View key={index}>
          <TextInput label={`Title ${index + 1}`} value={service.title} onChangeText={(text) => handleServiceChange(index, "title", text)} mode="outlined" style={{ marginTop: 10, marginBottom: 10, backgroundColor: "transparent" }} keyboardType="default" />
          <TextInput label={`Preacher ${index + 1}`} value={service.preacher} onChangeText={(text) => handleServiceChange(index, "preacher", text)} mode="outlined" style={{ marginTop: 10, marginBottom: 10, backgroundColor: "transparent" }} keyboardType="default" />
          <TextInput label={`Sermon ${index + 1}`} value={service.sermon} onChangeText={(text) => handleServiceChange(index, "sermon", text)} mode="outlined" style={{ marginTop: 10, marginBottom: 30, backgroundColor: "transparent" }} keyboardType="default" />
        </View>
      ))}
      <Button onPress={addServiceField} mode="elevated"  elevation={4}>Add New Service</Button>
      <Button onPress={handleSubmit} mode="elevated" textColor="#fff" buttonColor="#09269c" elevation={4} style={{marginTop: 15}}>Submit</Button>
    </View>
  );
};

export default PastServiceForm;
