import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const Remover = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [isUpload, setIsUpload] = useState<boolean>(false);

  const handleFileInputChange = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission denied');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedFile(result.assets[0].uri);
    }
  };

  const handleFileUpload = async () => {
    setIsUpload(true);
    const formData = new FormData();
    formData.append('image_file', {
      uri: selectedFile!,
      type: 'image/jpeg',
      name: 'image.jpg',
    } as any);
    formData.append('size', 'auto');

    const api_key = 'yahxkJ1UbAHVcqb7TdP8swu5';

    try {
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': api_key,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setFinalUrl(url);
    } catch (error) {
      console.error('Error uploading file:', error);
    }

    setIsUpload(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.removerContainer}>
        <TouchableOpacity style={styles.infoContainer} onPress={handleFileInputChange}>
          <Text style={styles.infoText}>Select a File</Text>
        </TouchableOpacity>
        {!isUpload ? (
          <TouchableOpacity style={styles.btnUpload} onPress={handleFileUpload}>
            <Text style={styles.btnText}>Upload</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.btnUpload, styles.btnDisabled]} disabled>
            <Text style={styles.btnText}>Uploading...</Text>
          </TouchableOpacity>
        )}
      </View>
      {finalUrl && (
        <TouchableOpacity onPress={() => {}} style={styles.btnDownload}>
          <Text style={styles.btnText}>Download</Text>
        </TouchableOpacity>
      )}
      {finalUrl && (
        <View style={styles.finalImageArea}>
            <View style={styles.imageContainer}>
          <Image source={{ uri: finalUrl }} style={styles.finalImage} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  infoContainer: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
  },
  btnUpload: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: 'white',
    fontSize: 16,
  },
  btnDownload: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  finalImageArea: {
    marginTop: 20,
  },
  finalImage: {
    width: 200,
    height: 200,
  },
  imageContainer: {
    backgroundColor: '#c4911987',
    padding: 10,
    borderRadius: 5,
  }
});

export default Remover;
