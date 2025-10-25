import { useEffect, useState, useRef } from "react";
import { ScrollView, ActivityIndicator } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { handleSignUp } from "../../tools/users/signup";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  View,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import signUpImage from "../../assets/images/bg1.png";
import { Button, Text, TextInput } from "react-native-paper";
import { UserState } from "../../utilities/tools";
// import GalleryPicker from "../../components/GalleryPicker";
import { setLoading } from "../../hooks/redux/loader/Loader";
import LoaderB from "@/components/loaders/LoaderB";
import { RootState } from "@/app/_layout";
import GalleryPicker from "@/components/recycle/imagePicker/Test";
import { BottomSheetModal, useBottomSheetModal } from '@gorhom/bottom-sheet';
import { windowHeight, windowWidth } from "@/utilities/types";
import AlertPopup from "@/components/AlertPopup";
import { updateUserData } from "@/hooks/redux/user/userData";
import { useRouter } from "expo-router";
import { URI_domain } from "@/utilities/tools";

type FormData = {
  avatar: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
  language: string;
  role: 'user' | 'pastor' | 'it';
  selectedChurchId: string;
  otherChurchName: string;
};

type ChurchOption = {
  _id: string;
  name: string;
};

function SignUp({ }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [buttonPressed, setButtonPressed] = useState(false);

   // Add state for alert message
   const [alertMessage, setAlertMessage] = useState<string>("");

  // LOADING
  const { loading } = useSelector((state: RootState) => state.reducer.loading);


  // FORM STATE
  const [formData, setFormData] = useState<FormData>({
    avatar: "",
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
    language: "en",
    role: "user",
    selectedChurchId: "",
    otherChurchName: "",
  });

  // Church list state
  const [churchList, setChurchList] = useState<ChurchOption[]>([]);
  const [churchLoading, setChurchLoading] = useState(false);
  // Fetch church list on mount
  useEffect(() => {
    setChurchLoading(true);
    fetch(`${URI_domain}/public/churches`)
      .then(res => res.json())
      .then((data: ChurchOption[]) => {
        setChurchList(data);
        setChurchLoading(false);
      })
      .catch(() => setChurchLoading(false));
  }, []);

  // Getting the New User Image [ REDUX STATE ]
  const { userImage } = useSelector(
    (state: RootState) => state.reducer.getProfileImage
  );

  useEffect(() => {
    console.info("SignUp Redux State userImage => ", userImage);
    setFormData({ ...formData, avatar: userImage });
  }, [userImage]);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { dismiss } = useBottomSheetModal();
  const [validationError, setValidationError] = useState<string>("");
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // Add state for alert
  const [showAlert, setShowAlert] = useState(false);

  const validateForm = () => {
    if (formData.name.trim() === "") {
      setValidationError("Please enter your first name");
      bottomSheetModalRef.current?.present();
      return false;
    }

    if (formData.surname.trim() === "") {
      setValidationError("Please enter your surname");
      bottomSheetModalRef.current?.present();
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setValidationError("Please enter a valid email address");
      bottomSheetModalRef.current?.present();
      return false;
    }

    if (formData.password.length < 6) {
      setValidationError("Password must be at least 6 characters long");
      bottomSheetModalRef.current?.present();
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords do not match");
      bottomSheetModalRef.current?.present();
      return false;
    }

    return true;
  };

  const handleBottomSheetChange = (index: number) => {
    setIsBottomSheetOpen(index === 0);
  };

  // HANDLE AFTER SIGN UP
  const handleAfterSignUp = (response: { success: boolean, token?: string, error?: any }) => {
    dispatch(setLoading(false));
    
    if (response.success && response.token) {
      setAlertMessage("You are now registered."); // Success message
      setShowAlert(true);
      // setTimeout to navigate after showing the alert
      setTimeout(() => {
        // setShowAlert(false);
        router.push({
          pathname: "/(app)/home",
          params: { token: JSON.stringify(response.token) }
        });
      }, 2000);
    } else {
      // Handle error case - you might want to show error in the bottom sheet
      setValidationError(response.error?.message || "Registration failed");
      setAlertMessage("Registration failed"); // Success message
      setShowAlert(true);
    }
  };

  const handleAfterSignUp_User = (response: { success: boolean, token?: string, newUser?: UserState, error?: unknown }) => {
    dispatch(setLoading(false));

    if (response.success && response.newUser) {
      let user = response.newUser;

      dispatch(updateUserData({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: {
          url: user.avatar.url
        },
        password: user.password,
        surname: user.surname,
        __v: user.__v,
        type: user.type,
        admin: user.admin
      }));

      dispatch(setLoading(false));
      setAlertMessage("You are now registered."); // Success message
      setShowAlert(true);

      setTimeout(() => {
        router.push({
          pathname: "/(app)/home",
          params: { data: JSON.stringify(user) }
        });
      }, 2000);
    } else {
      dispatch(setLoading(false));
      console.error("Sign Up Failed: ", response.error);
      const errorMsg = typeof response.error === 'string' 
        ? response.error 
        : response.error instanceof Error 
          ? response.error.message 
          : "Registration failed. Please try again.";
      setAlertMessage(errorMsg);
      setShowAlert(true);
    }
  };

  const handleSubmit = () => {
    // Perform form validation
    if (validateForm()) {
      dispatch(setLoading(true));
      handleSignUp(formData).then((response) => handleAfterSignUp_User(response));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={signUpImage}
        resizeMode="cover"
        resizeMethod="scale"
        style={[styles.image]}
        imageStyle={{ zIndex: 1 }}
      >
        {loading && <LoaderB />}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, zIndex: 99 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", backgroundColor: '#86868649', paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* IMAGE PICKER */}
            <GalleryPicker />

            <View style={styles.header}>
              <Text variant="displayMedium" style={{ color: '#000', fontFamily: 'RobotoMedium' }}>Sign Up </Text>
            </View>

            <View style={styles.inputStack}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",
                  marginBottom: 18,
                }}
              >
                <TextInput
                  activeOutlineColor="gold"
                  label="First Name"
                  keyboardType="default"
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  style={[styles.textInput, {
                    backgroundColor: 'transparent',
                    borderRadius: 8,
                    fontFamily: 'RobotoRegular',
                    width: 135
                  }]}
                  outlineStyle={{
                    borderRadius: 8,
                    borderWidth: 1,
                  }}
                  theme={{
                    colors: {
                      primary: '#000',
                      onSurfaceVariant: '#000',
                    },
                    fonts: {
                      bodyLarge: {
                        fontFamily: 'RobotoMedium',
                      }
                    }
                  }}
                />

                <TextInput
                activeOutlineColor="gold"
                label="Surname"
                keyboardType="default"
                placeholder=""
                value={formData.surname}
                onChangeText={(text) =>
                  setFormData({ ...formData, surname: text })
                }
                style={[styles.textInput, {
                  backgroundColor: 'transparent',
                  borderRadius: 8,
                  fontFamily: 'RobotoRegular',
                  width: 135
                }]}
                outlineStyle={{
                  borderRadius: 8,
                  borderWidth: 1,
                }}
                theme={{
                  colors: {
                    primary: '#000',
                    onSurfaceVariant: '#000',
                  },
                  fonts: {
                    bodyLarge: {
                      fontFamily: 'RobotoMedium',
                    }
                  }
                }}
              />
            </View>

            <TextInput
              activeOutlineColor="gold"
              label="Email Address"
              keyboardType="default"
              placeholder=""
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              style={[styles.textInput, {
                    backgroundColor: 'transparent',
                    borderRadius: 8,
                    fontFamily: 'RobotoRegular',
                  }]}
                  outlineStyle={{
                    borderRadius: 8,
                    borderWidth: 1,
                  }}
                  theme={{
                    colors: {
                      primary: '#000',
                      onSurfaceVariant: '#000',
                    },
                    fonts: {
                      bodyLarge: {
                        fontFamily: 'RobotoMedium',
                      }
                    }
                  }}
            />

            <TextInput
              label="Password"
              placeholder=""
              secureTextEntry
              value={formData.password}
              onChangeText={(text) =>
                setFormData({ ...formData, password: text })
              }
              style={[styles.textInput, {
                    backgroundColor: 'transparent',
                    borderRadius: 8,
                    fontFamily: 'RobotoRegular',
                  }]}
                  outlineStyle={{
                    borderRadius: 8,
                    borderWidth: 1,
                  }}
                  theme={{
                    colors: {
                      primary: '#000',
                      onSurfaceVariant: '#000',
                    },
                    fonts: {
                      bodyLarge: {
                        fontFamily: 'RobotoMedium',
                      }
                    }
                  }}
            />

            <TextInput
              label="Confirm Password"
              placeholder=""
              secureTextEntry
              value={formData.confirmPassword}
              onChangeText={(text) =>
                setFormData({ ...formData, confirmPassword: text })
              }
              style={[styles.textInput, {
                    backgroundColor: 'transparent',
                    borderRadius: 8,
                    fontFamily: 'RobotoRegular',
                  }]}
                  outlineStyle={{
                    borderRadius: 8,
                    borderWidth: 1,
                  }}
                  theme={{
                    colors: {
                      primary: '#000',
                      onSurfaceVariant: '#000',
                    },
                    fonts: {
                      bodyLarge: {
                        fontFamily: 'RobotoMedium',
                      }
                    }
                  }}
            />

            {/* Language Selection */}
            <View style={{ marginBottom: 18 }}>
              <Text style={{ fontFamily: 'RobotoMedium', fontSize: 14, marginBottom: 8, color: '#000' }}>
                Preferred Language
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, language: 'en' })}
                  style={[
                    styles.radioButton,
                    formData.language === 'en' && styles.radioButtonActive
                  ]}
                >
                  <Text style={[
                    styles.radioButtonText,
                    formData.language === 'en' && styles.radioButtonTextActive
                  ]}>
                    English
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, language: 'fr' })}
                  style={[
                    styles.radioButton,
                    formData.language === 'fr' && styles.radioButtonActive
                  ]}
                >
                  <Text style={[
                    styles.radioButtonText,
                    formData.language === 'fr' && styles.radioButtonTextActive
                  ]}>
                    French
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Role Selection */}
            <View style={{ marginBottom: 18 }}>
              <Text style={{ fontFamily: 'RobotoMedium', fontSize: 14, marginBottom: 8, color: '#000' }}>
                Select Your Role
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, role: 'user' })}
                  style={[
                    styles.radioButton,
                    formData.role === 'user' && styles.radioButtonActive
                  ]}
                >
                  <Text style={[
                    styles.radioButtonText,
                    formData.role === 'user' && styles.radioButtonTextActive
                  ]}>
                    User
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, role: 'pastor' })}
                  style={[
                    styles.radioButton,
                    formData.role === 'pastor' && styles.radioButtonActive
                  ]}
                >
                  <Text style={[
                    styles.radioButtonText,
                    formData.role === 'pastor' && styles.radioButtonTextActive
                  ]}>
                    Pastor
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, role: 'it' })}
                  style={[
                    styles.radioButton,
                    formData.role === 'it' && styles.radioButtonActive
                  ]}
                >
                  <Text style={[
                    styles.radioButtonText,
                    formData.role === 'it' && styles.radioButtonTextActive
                  ]}>
                    IT
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Church Selection */}
            <View style={{ marginBottom: 18 }}>
              <Text style={{ fontFamily: 'RobotoMedium', fontSize: 14, marginBottom: 8, color: '#000' }}>
                Select Your Church
              </Text>
              {churchLoading ? (
                <ActivityIndicator size="small" color="#030303" />
              ) : (
                <View style={{ borderWidth: 1, borderRadius: 8, borderColor: '#ccc', backgroundColor: '#fff', paddingHorizontal: 8 }}>
                  {/* Picker for church selection */}
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontFamily: 'RobotoRegular', marginBottom: 4 }}>Choose from list:</Text>
                    <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#fff' }}>
                      <Picker
                        selectedValue={formData.selectedChurchId}
                        onValueChange={(itemValue: string, itemIndex: number) => {
                          setFormData({
                            ...formData,
                            selectedChurchId: itemValue,
                            otherChurchName: itemValue === '' ? formData.otherChurchName : (churchList.find(c => c._id === itemValue)?.name || '')
                          });
                        }}
                        style={{ height: 44, width: '100%' }}
                      >
                        <Picker.Item label="Select a church..." value="" />
                        {churchList.map((church) => (
                          <Picker.Item key={church._id} label={church.name} value={church._id} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <TextInput
                    label="Other Church Name (Optional)"
                    placeholder="Enter church name if not listed"
                    value={formData.otherChurchName}
                    onChangeText={(text) => setFormData({ ...formData, otherChurchName: text, selectedChurchId: "" })}
                    style={{ backgroundColor: 'transparent', borderRadius: 8, fontFamily: 'RobotoRegular', marginTop: 8 }}
                    outlineStyle={{ borderRadius: 8, borderWidth: 1 }}
                    theme={{ colors: { primary: '#000', onSurfaceVariant: '#000' }, fonts: { bodyLarge: { fontFamily: 'RobotoMedium' } } }}
                  />
                </View>
              )}
            </View>
          </View>

          <Button
            icon="login"
            mode="contained"
            onPress={handleSubmit}
            onPressIn={() => setButtonPressed(true)}
            onPressOut={() => setButtonPressed(false)}
            style={[{
              backgroundColor: "#030303",
              paddingHorizontal: 20,
              paddingVertical: 8,
              transform: [{ scale: buttonPressed ? 0.95 : 1 }],
            }, buttonPressed && styles.buttonPressed]}
            labelStyle={{
              color: '#fff',
              fontFamily: 'RobotoBold',
              fontSize: 16,
              letterSpacing: 1,
            }}
            contentStyle={{
              flexDirection: 'row-reverse',
              gap: 8,
            }}
            theme={{
              colors: { primary: '#fff' }
            }}
          >
            Sign Up
          </Button>

          <Button
            mode="outlined"
            textColor="#000000"
            buttonColor="#ffffff4d"
            onPress={() => router.push("/(auth)/login")}
            style={{
              marginTop: 15,
              borderColor: '#ffffff',
              borderRadius: 30,
              borderWidth: 2,
            }}
            labelStyle={{
              fontSize: 16,
              fontFamily: 'RobotoRegular',
            }}
          >
            Have an account? Login
          </Button>
       
          {/* End form container */}
        </ScrollView>
      {/* Overlay and modals should be outside ScrollView but inside KeyboardAvoidingView */}
      {isBottomSheetOpen && (
        <Pressable
          style={[StyleSheet.absoluteFill, {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: windowHeight,
            width: windowWidth,
          }]}
          onPress={() => {
            dismiss();
            setIsBottomSheetOpen(false);
          }}
        />
      )}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={['25%']}
        onChange={handleBottomSheetChange}
        enablePanDownToClose={true}
        enableOverDrag={true}
        backgroundStyle={{
          borderRadius: 24,
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
        handleIndicatorStyle={{ backgroundColor: '#000', width: 40 }}
      >
        <View style={styles.bottomSheetContent}>
          <Text style={{ fontSize: 18, marginBottom: 12, fontFamily: 'RobotoBold', color: '#FF3B30' }}>
            Form Validation Error
          </Text>
          <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20, fontFamily: 'RobotoRegular', color: '#000' }}>
            {validationError}
          </Text>
          <Button
            mode="contained"
            onPress={() => dismiss()}
            style={{ backgroundColor: '#030303', paddingHorizontal: 32, paddingVertical: 8, borderRadius: 8 }}
            labelStyle={{ color: '#fff', fontSize: 16, fontFamily: 'RobotoMedium', letterSpacing: 0.5 }}
          >
            Close
          </Button>
        </View>
      </BottomSheetModal>
      <AlertPopup
        visible={showAlert}
        message={alertMessage}
        onClose={() => setShowAlert(false)}
      />
      </KeyboardAvoidingView>
    </ImageBackground>
  </View>
  );
}

export default SignUp;

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: "100%",
  },
  loginImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderBottomLeftRadius: 125,
    borderBottomRightRadius: 125,
  },
  header: {
    marginBottom: 15,
  },
  inputStack: {
    width: "90%",
    padding: 15,
    marginBottom: 15
  },
  textInput: {
    marginBottom: 18,
    backgroundColor: "transparent",
  },
  buttonPressed: {
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  avatarContainer: {
    marginBottom: 15,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    // shadowProps,
    borderWidth: 6,
    borderColor: "#03630bda",
  },
  avatar: {
    zIndex: 1000,
  },
  bottomSheetContent: {
    padding: 20,
    alignItems: 'center',
  },
  radioButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  radioButtonActive: {
    backgroundColor: '#030303',
    borderColor: '#030303',
  },
  radioButtonText: {
    fontSize: 14,
    fontFamily: 'RobotoMedium',
    color: '#000',
  },
  radioButtonTextActive: {
    color: '#fff',
  },
});
