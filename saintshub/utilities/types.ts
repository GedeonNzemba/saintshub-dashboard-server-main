import { Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Animated } from "react-native";

export const windowWidth = Dimensions.get("window").width;
export const windowHeight = Dimensions.get("window").height;

export const sleep = (milliseconds: number ) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}
  
// Bibles
export const bibleKjv = 'https://www.bible.com/bible/1/GEN.1.KJV';
export const audibleBibleKjv = 'https://www.bible.com/audio-bible/1/GEN.1.KJV';
export const createChurch = 'https://saintshub-dashboard-frontend-aojxqfpm0-gedeonnzemba.vercel.app';

// bro Branham 
export const sermons = "https://branham.org/en/MessageAudio";
export const media_video = "https://branham.org/en/videos";
export const media_pictures = "https://branham.org/en/pictures";
export const quoteOfTheDay = "https://branham.org/fr/QuoteOfTheDay";

// verse of the day
export const verseOfTheDay = "https://www.bible.com/";

export const cloud_name = 'ddbiofmni';
export const api_key = '629285927862696';
export const api_secret = '7i7owfVVo3t860usBWvJqTITMHY';

