import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { router, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { LogBox } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistReducer } from "redux-persist";
import { combineReducers, compose, configureStore } from "@reduxjs/toolkit";
import rootReducer from "../hooks/redux/reducer";
import LoaderB from '@/components/sections/LoaderB';
import { Provider, useDispatch } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Provider as ProviderModal, Portal as PortalModal } from "react-native-paper";
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { decodedToken } from '@/tools/users/decodeToken';
import { Token, UserState } from '@/utilities/tools';
import { setLoading } from '@/hooks/redux/loader/Loader';
import { getUser } from '@/tools/users/getUser';
import { updateUserData } from '@/hooks/redux/user/userData';
import { Host } from 'react-native-portalize';
import "../global.css";

// Suppress Reanimated strict mode warnings from carousel
LogBox.ignoreLogs([
  'Reading from `value`',
  '[Reanimated]',
  'Reanimated',
]);

// Override console.warn to filter out Reanimated warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('[Reanimated]') || 
     message.includes('Reading from `value`'))
  ) {
    return; // Suppress this warning
  }
  originalWarn(...args);
};


declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

const reducers = combineReducers({
  reducer: rootReducer,
});

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["userState"],
};

const persistedReducer = persistReducer(persistConfig, reducers);
const isDevelopment = process.env.NODE_ENV === "development";

const composeEnhancers = isDevelopment && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : compose;

const store = configureStore({
  reducer: persistedReducer,
  devTools: isDevelopment,
});

export interface RootState {
  reducer: {
    todos: any
    modal: any
    churchTabSlice: any
    getPastorWifesImage: {
      pastorWifeImage: string
    }
    getGalleries: {
      churchGallery: string[]
    }
    getPastServices: {
      pastServices: any[]
    }
    getSongs: {
      songs: any[]
    }
    getChurchData: any
    getChurchSermonData: any
    sermonsSongsSlice: any
    liveModal: any
    bottomSheet: any
    sermonsSlice: any
    getProfileImage: any
    getDeaconsImage: any
    getTrusteesImage: any
    getPastorWIfeIMage: any
    getLogo: {
      churchLogo: string
    }
    getDeaconsData: {
      deacons: any[]
    }
    getTrusteesData: {
      trustees: any[]
    }
    getPrincipalImage: any
    getChurchImage: {
      churchImage: string
    }
    getChurchBanners: {
      churchBannerImage: string[]
    }
    updateUserData: any
    detachedBottomSheet: any
    mainDrawer: any
    loading: any
  }
}
export type AppDispatch = typeof store.dispatch;

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    RobotoBlack: require('../assets/fonts/Roboto-Black.ttf'),
    RobotoBlackItalic: require('../assets/fonts/Roboto-BlackItalic.ttf'),
    RobotoBold: require('../assets/fonts/Roboto-Bold.ttf'),
    RobotoBoldItalic: require('../assets/fonts/Roboto-BoldItalic.ttf'),
    RobotoMedium: require('../assets/fonts/Roboto-Medium.ttf'),
    RobotoMediumItalic: require('../assets/fonts/Roboto-MediumItalic.ttf'),
    RobotoCondensedBold: require('../assets/fonts/RobotoCondensed-Bold.ttf'),
    RobotoCondensedBoldItalic: require('../assets/fonts/RobotoCondensed-BoldItalic.ttf'),
    RobotoRegular: require('../assets/fonts/Roboto-Regular.ttf')
  });

  // Handle both font loading and initial routing
  useEffect(() => {
    async function prepare() {
      try {
        // Wait for fonts to load
        if (loaded) {
          // Hide the splash screen
          await SplashScreen.hideAsync();
          
          // Then check authentication and route accordingly
          // const token = await AsyncStorage.getItem("token");
          // if (token) {
          //   router.replace('/(auth)/login');
          // }
        }
      } catch (error) {
        console.error('Error during app preparation:', error);
      }
    }

    prepare();
  }, [loaded]); // Only run when loaded changes

  // Show loader while fonts are loading
  if (!loaded) {
    return <LoaderB />;
  }

  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <ProviderModal>
            <PortalModal>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Host>
                  <AuthProvider>
                    <InitialLayout />
                  </AuthProvider>
                </Host>
              </ThemeProvider>
            </PortalModal>
          </ProviderModal>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}

function InitialLayout() {
  const { isAuthenticated, isLoading, token } = useAuth();
  const segments = useSegments();
  const dispatch = useDispatch();
  const router = useRouter();

  // ON PAGE RELOAD
  const fetchUserData = (data: UserState) => {
    dispatch(updateUserData({
      avatar: {
        url: data.avatar.url
      },
      _id: data._id,
      name: data.name,
      surname: data.surname,
      email: data.email,
      password: data.password,
      __v: data.__v,
      type: data.type,
      admin: data.admin
    }));

    dispatch(setLoading(false));
  }

  const homeScreen = async () => {
    const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds

    if (token !== null) {
      const decoded = (await decodedToken(token)) as Token;
      const { exp } = decoded;

      if (exp && currentTimestamp > exp) {
        // Token has expired
        return true;
      }

      // Token is still valid
      dispatch(setLoading(true));
      getUser(token).then((data) => fetchUserData(data))
        .finally(() =>  
          router.push({
            pathname: "/(app)/home",
            params: { token: JSON.stringify(token) }
          })
        )
        .catch((error) => console.log("UNABLE TO GO HOME: ", error));
    }
  }

  useEffect(() => {
    if (!isLoading) {
      const inAuthGroup = segments[0]?.startsWith('(auth)');
      
      console.log('Current segment:', segments[0]);
      console.log('Is authenticated:', isAuthenticated);

      if (isAuthenticated && !segments[1] || isAuthenticated && inAuthGroup) {
        // If authenticated but no specific route, go to home
        // If authenticated and trying to access auth screens, go to home
        homeScreen();
      } else if (!isAuthenticated && !inAuthGroup) {
        // If not authenticated and trying to access non-auth screens, go to login
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, isLoading]);

  return (
    // Add a loader 
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
