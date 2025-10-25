import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import { View } from "react-native";
import { TextInput, Button } from "react-native-paper";

interface SongFormProps {
  onSubmit: (songs: { title: string; url: string }[]) => void;
}

const SongForm: React.FC<SongFormProps> = ({ onSubmit }) => {
  const [songs, setSongs] = useState<{ title: string; url: string }[]>([{ title: '', url: '' }]);

  const addSongField = () => {
    setSongs((prevSongs) => [...prevSongs, { title: '', url: '' }]);
  };

  const handleSongTitleChange = (index: number, title: string) => {
    const updatedSongs = [...songs];
    updatedSongs[index].title = title;
    setSongs(updatedSongs);
  };

  const handleSongUrlChange = (index: number, url: string) => {
    const updatedSongs = [...songs];
    updatedSongs[index].url = url;
    setSongs(updatedSongs);
  };

  const handleSubmit = async () => {
    // Remove entries with all empty fields
    const filteredSongs = songs.filter(
      (song) => song.title.trim() !== '' || song.url.trim() !== ''
    );

    const dataToSave = JSON.stringify(filteredSongs);
    const key = "songsServices";

    await AsyncStorage.setItem(key, dataToSave);
    console.log("collected data for #songsServices", filteredSongs);

    // Submit the array of songs
  };

  return (
    <View style={{marginBottom: 40}}>
    {songs.map((song, index) => (
      <View key={index}>
        <TextInput
          label={`Song Title ${index + 1}`}
          value={song.title}
          onChangeText={(text) => handleSongTitleChange(index, text)}
          mode="outlined" 
          style={{ marginTop: 10, marginBottom: 10, backgroundColor: "transparent" }} 
          keyboardType="default"
        />
        <TextInput
          label={`Song URL ${index + 1}`}
          value={song.url}
          onChangeText={(text) => handleSongUrlChange(index, text)}
          mode="outlined" 
          style={{ marginTop: 10, marginBottom: 10, backgroundColor: "transparent" }} 
          keyboardType="default"
        />
      </View>
    ))}
   <Button onPress={addSongField} mode="elevated"  elevation={4}>Add New Song</Button>
   <Button onPress={handleSubmit} mode="elevated" textColor="#fff" buttonColor="#09269c" elevation={4} style={{marginTop: 15}}>Submit</Button>
  </View>
  );
};

export default SongForm;
