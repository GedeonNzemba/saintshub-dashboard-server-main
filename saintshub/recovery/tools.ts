import { ImageSourcePropType } from "react-native";
import { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types";

export const URI_domain = "https://4d200ca3c002.ngrok-free.app"; // 3003 - MAIN SERVER FOR THE APP [ DASHBOARD-SERVER-MAIN ]
export let RANDOM_AVATAR_URI = "https://avatar.iran.liara.run/public";
export let DAILY_SCRIPTURE_AND_QUOTE_URI = "https://2652bf95a5f8.ngrok-free.app"; // 5000 - BIBLE AND SERMON SERVER [ TEST 2 - FOLDER ]
export let MUSICKIT_URI = "https://music-server-three.vercel.app";

// ngrok config add-authtoken 2oiPNuq74Cjs2Y8SPCPkTC9zJqk_2V69VGfQ3ZPsZ8ZRzY3MV


export const shadowProps = {
  shadowColor: "#171717",
  shadowOffset: { width: -2, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 3,
};

export interface UserState {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: {
    public_id: string;
    url: string;
    _id?: string;
  };
  role?: string;
  admin?: boolean;
  type?: string;
  __v?: number;
  language?: string;
  churchSelection?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface User {
  avatar: {
    url: string;
  };
  name: string;
  surname: string;
  email: string;
  admin: boolean
}

export interface UpdateUserInfoProps {
  firstName: string;
  lastName: string;
  email: string;
  targetUpdate: string;
  authToken: string;
}

export interface UpdateUserSecurityProps {
  avatar: {
    url: string;
  };
  password: string;
}

export interface liveData {
  preacher: string;
  title: string;
  sermon: string;
}

export interface liveDataProps {
  preacher?: string;
  Title: string;
  Title_URL: string;
  cover?: string;
}

export interface allServices {
  sermons: string[];
  loading: boolean;
  status: string | undefined;
  error: string | null;
}

export interface songData {
  songs: string[];
}

export interface documentsData {
  title: string;
  url: string;
}

// export interface ItemProps {
//   data: {
//     title: string;
//     pastor: string;
//     wife: string;
//     pastorAndWife: string;
//     description: string;
//     location: string;
//     image?: ImageSourcePropType | string;
//     churchName: string;
//     stream: string;
//     churchOrder: {
//       deacons: {
//         names: string[];
//         descriptions: string[];
//         images: string[];
//       };
//       trustees: {
//         names: string[];
//         images: string[];
//       };
//     };
//     live: [liveDataProps];
//     gallery?: string[];
//     songs: string[];
//   };
// }

export interface ItemProps {
  data: CHURCH_DB
}

export interface SermonsSongsStates {
  isSermons: boolean;
  isSongs: boolean;
}

export interface AllChurches {
  allChurches: string[];
}

export interface SignIn {
  email: string;
  password: string;
}

export interface SignUp {
  avatar: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Types for Stack Navigator.
 */
export type StackParamList = {
  Init: { userId: string };
  Login: undefined;
  SignUp: undefined;
  Home: { token: string};
  FindChurch: undefined;
  AllServices: undefined;
  Church: undefined;
  Sermons: undefined;
  Songs: undefined;
  Documents: undefined;
  Gedeon: undefined;
};

export interface TokenPayload {
  id: string;
  // Add other fields as needed
}

export type idObject = { id: string };

export interface Token {
  userId: string;
  iat: number;
  exp: number;
}

export interface UserToken {
  token: string
}

export interface SignInResponse {
  status: string;
  token: string;
  data: {
    user: UserState;
  };
}

export interface ShopModalTypes {
  headerText_primary: string;
  headerText_secondary: string;
  bodyText_one: string;
  bodyText_two: string;
  bodyText_three?: string;
  bodyText_four?: string;
  bodyText_five?: string;
  sub_image?: string;
  multipleContent?: string[]
}

export interface DrawerModaltypes {
  heading: string;
  subheading: string;
  bodyText_one: string;
  bodyText_two?: string;
  bodyText_three?: string;
  onDismiss?: () => void;
}

export interface ResponseImageUploaded {
  result: {
    access_mode: string;
    api_key: string;
    asset_id: string;
    bytes: string;
   created_at: string;
     etag: string;
     folder: string;
     format: string;
    height: number;
      original_filename: string;
    placeholder: false;
     public_id: string;
     resource_type: string;
     secure_url: string;
     signature: string;
    tags: [];
     type: string;
     url: string;
    version: number;
     version_id: string;
     width: number
  }
}

export interface ResponseImage {
  result: {
    access_mode: string;
  api_key: string;
  asset_id: string;
  bytes: string;
 created_at: string;
   etag: string;
   folder: string;
   format: string;
  height: number;
    original_filename: string;
  placeholder: false;
   public_id: string;
   resource_type: string;
   secure_url: string;
   signature: string;
  tags: [];
   type: string;
   url: string;
  version: number;
   version_id: string;
   width: number
  }
}

// DASHBOARD
export interface Principal {
  pastor: string;
  wife: string;
  image: string;
  description: string;
}

export interface Deacon {
  names: string;
  descriptions: string;
  image: string;
}

export interface Trustee {
  names: string;
  descriptions: string;
  image: string;
}

export interface Securities {
  deacons: Deacon[];
  trustees: Trustee[];
}

export interface Security {
  names: string;
  descriptions: string;
  image: string;
}


export interface LiveService {
  title: string;
  preacher: string;
  sermon: string;
}

export interface ChurchDoc {
  name: string;
  logo: string;
  principal: Principal;
  location: string;
  image: string;
  banner: string[];
  securities: Securities;
  oldServices: LiveService[];
  liveServices: LiveService[];
  gallery: string[];
  songs:  {
    title: string;
    url: string;
  }[];
}

export interface CHURCH_DB {
  logo: string;
  _id: string;
  name: string;
  principal: { description: string; image: string; pastor: string; wife: string };
  location: string;
  image: string;
  banner: string[];
  securities: {
    deacons: [{ names: string; descriptions: string; image: string }];
    trustees: [{ names: string; descriptions: string; image: string }];
  };
  oldServices: [{ preacher: string; sermon: string; title: string, cover: string }];
  liveServices: [{ preacher: string; sermon: string; title: string }];
  gallery: string[];
  songs: [{ title: string; url: string }];
  __v: number;
}

// **************** CHURCH [ GET ] ********************************

type Church_Deacon = {
  names: string;
  descriptions: string;
  image: string;
};

type Church_Trustee = {
  names: string;
  descriptions: string;
  image: string;
};

type Church_Security = {
  deacons: Church_Deacon[];
  trustees: Church_Trustee[];
};

type Service = {
  preacher: string;
  sermon: string;
  title: string;
};

export type ChurchUpdate = {
  logo: string;
  name: string;
  principal: {
    description: string;
    image: string;
    pastor: string;
    wife: string;
  };
  location: string;
  image: string;
  banner: string[];
  securities: Church_Security;
  oldServices: Service[];
  liveServices: Service[];
  gallery: string[];
  songs: {
    title: string;
    url: string;
  }[];
};

export type Church = {
  logo: string;
  _id: string;
  name: string;
  principal: {
    description: string;
    image: string;
    pastor: string;
    wife: string;
  };
  location: string;
  image: string;
  banner: string[];
  securities: Church_Security;
  oldServices: Service[];
  liveServices: Service[];
  gallery: string[];
  songs: {
    title: string;
    url: string;
  }[];
  __v: number;
};


export type StackNavigation = NativeStackNavigationProp<StackParamList>;


// REDUX STATE FOR CHURCH DATA FROM --> COLLECT FROM --> FIND_CHURCH COMPONENT

// Function to format milliseconds to m:ss time format
export const formatMillisToTime = (millis: number): string => {
  if (isNaN(millis) || millis < 0) {
    return '0:00';
  }
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};