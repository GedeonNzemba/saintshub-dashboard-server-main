import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Pressable,
    Platform,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { windowHeight, windowWidth } from '@/utilities/types';
import { ChurchInput } from '@/components/dashboard/ChurchInput';
import GlobalStyles from '@/components/recycle/styles/GlobalStyles';
import defaultLogo from '../../../assets/create church/logo.gif';
import galleryImageDemo from '../../../assets/create church/gallery.gif';
import pastorWifeImageDemo from '../../../assets/create church/pastorWife.gif';
import churchIMageDemo from '../../../assets/create church/church.gif';
import churchBannersDemo from '../../../assets/create church/banners.gif';
import * as yup from 'yup';
import Animated, {
    FadeInDown,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import * as DocumentPicker from 'expo-document-picker';
import { DocumentPickerResult } from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ButtonInput } from '@/components/dashboard/ChurchInput';
import { getVideoInfo, isValidVideoUrl } from '../../../utilities/videoUtils';
import DashboardImageUploader from '@/components/recycle/imagePicker/DashboardImageUploader';
import { CHURCH_IMAGE, CHURCH_LOGO, PASTOR_WIFE_IMAGE, CHURCH_BANNER_IMAGE, GALLERY_IMAGES, DEACONS_IMAGE, TRUSTEE_IMAGE } from '@/constants/userConstants';
import DashboardLoader from '@/components/sections/DashboardLoader';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../hooks/redux/types';
import { getChurchBannerImage, clearChurchBanners, removeChurchBannerByIndex } from "../../../hooks/redux/dashboard/getChurchBanners";
import { setDeaconImage } from '../../../hooks/redux/dashboard/getDeaconsData';
import AlertPopup from '@/components/AlertPopup';
import DeaconItem from '@/components/recycle/church/DeaconItem';

// Types
type DeaconsAndTrusteesItem = {
    names: string;
    descriptions: string;
    image: string;
};

type PastServicesItem = {
    title: string;
    preacher: string;
    sermon: string;
};

type SongsItem = {
    title: string;
    songUrl?: string;
    audioFile?: string;
    videoFile?: string;
    uploadType: 'url' | 'audio' | 'video';
    fileSize?: number;
};

interface FormData {
    churchName: string;
    churchLocation: string;
    churchLogo: string;
    principal: {
        pastor: string;
        wife: string;
        description: string;
        image: string;
    };
    pastor: string;
    wife: string;
    description: string;
    image: string;
    churchImage: string;
    churchBanners: string[];
    deacons: DeaconsAndTrusteesItem[];
    trustees: DeaconsAndTrusteesItem[];
    pastServices: PastServicesItem[];
    gallery: string[];
    songs: SongsItem[];
}

interface Principal {
    pastor: string;
    wife: string;
    description: string;
    image: string;
}

interface DocumentResult {
    type: 'success' | 'cancel';
    uri?: string;
    name?: string;
    size?: number;
}

const validationSchema = yup.object().shape({
    churchName: yup.string().required('Church name is required'),
    churchLocation: yup.string().required('Church location is required'),
    churchLogo: yup.string().required('Church logo is required'),
    principal: yup.object().shape({
        pastor: yup.string().required('Principal pastor name is required'),
        wife: yup.string().required('Principal wife name is required'),
        description: yup.string().required('Principal description is required'),
        image: yup.string().required('Principal image is required'),
    }),
    pastor: yup.string().required('Pastor name is required'),
    wife: yup.string().required('Wife name is required'),
    description: yup.string().required('Description is required'),
    image: yup.string().required('Image is required'),
    churchImage: yup.string().required('Church image is required'),
    churchBanners: yup.array().min(1, 'At least one church banner is required'),
    deacons: yup.array().of(
        yup.object().shape({
            names: yup.string().required('Deacon name is required'),
            descriptions: yup.string().required('Deacon description is required'),
            image: yup.string().required('Deacon image is required'),
        })
    ).min(1, 'At least one deacon is required'),
    trustees: yup.array().of(
        yup.object().shape({
            names: yup.string().required('Trustee name is required'),
            descriptions: yup.string().required('Trustee description is required'),
            image: yup.string().required('Trustee image is required'),
        })
    ).min(1, 'At least one trustee is required'),
    pastServices: yup.array().of(
        yup.object().shape({
            title: yup.string().required('Service title is required'),
            preacher: yup.string().required('Preacher name is required'),
            sermon: yup.string().required('Sermon is required'),
        })
    ).min(1, 'At least one past service is required'),
    gallery: yup.array().min(1, 'At least one gallery image is required'),
    songs: yup.array().of(
        yup.object().shape({
            title: yup.string().required('Song title is required'),
            uploadType: yup.string().required('Upload type is required'),
            songUrl: yup.string().when('uploadType', ([uploadType], schema) => {
                return uploadType === 'url' ? schema.required('Song URL is required') : schema;
            }),
            audioFile: yup.string().when('uploadType', ([uploadType], schema) => {
                return uploadType === 'audio' ? schema.required('Audio file is required') : schema;
            }),
            videoFile: yup.string().when('uploadType', ([uploadType], schema) => {
                return uploadType === 'video' ? schema.required('Video file is required') : schema;
            }),
        })
    ).min(1, 'At least one song is required'),
});

const Space: React.FC = () => {
    const dispatch = useDispatch();

    const [loading, setLoading] = useState(false);
    const [churchLogo, setChurchLogo] = useState<string | null>(null);
    const [pastorWife, setPastorWife] = useState<string | null>(null);
    const [churchImage, setChurchImage] = useState<string | null>(null);
    const [churchBanners, setChurchBanners] = useState<string[]>([]);

    // Animation values for gallery images
    const scaleValues = React.useRef(
        Array(20).fill(0).map(() => useSharedValue(1))
    ).current;

    const [gallery, setGallery] = useState<string[]>([]);

    // REDUX STATES
    const churchLogo_reduxState = useSelector((state: RootState) => state.reducer.getLogo.churchLogo);
    const principalImage_reduxState = useSelector((state: RootState) => state.reducer.getPastorWifesImage.pastorWifeImage);
    const churchImage_reduxState = useSelector((state: RootState) => state.reducer.getChurchImage.churchImage);
    const churchBanners_reduxState = useSelector((state: RootState) => state.reducer.getChurchBanners.churchBannerImage);
    const gallery_reduxState = useSelector((state: RootState) => state.reducer.getGalleries.churchGallery);
    const deacons_reduxState = useSelector((state: RootState) => state.reducer.deaconImages.images);
    const trustees_reduxState = useSelector((state: RootState) => state.reducer.trusteeImages.images);

    const pastServices_reduxState = useSelector((state: RootState) => state.reducer.getPastServices.pastServices);
    const songs_reduxState = useSelector((state: RootState) => state.reducer.getSongs.songs);

    //  ALERT
       const [showAlert, setShowAlert] = useState(false);
       const [alertMessage, setAlertMessage] = useState<string>("");

    useEffect(() => {
        if (loading) {
            // Add a small delay to ensure the UI updates properly
            const timer = setTimeout(() => {
                setLoading(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [gallery_reduxState, loading]);

    const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
        resolver: yupResolver(validationSchema) as any,
        defaultValues: {
            churchName: '',
            churchLocation: '',
            churchLogo: '',
            principal: {
                pastor: '',
                wife: '',
                description: '',
                image: '',
            },
            pastor: '',
            wife: '',
            description: '',
            image: '',
            churchImage: '',
            churchBanners: [],
            deacons: [{ names: '', descriptions: '', image: '' }],
            trustees: [{ names: '', descriptions: '', image: '' }],
            pastServices: [{ title: '', preacher: '', sermon: '' }],
            gallery: [],
            songs: [{ title: '', uploadType: 'url', songUrl: '', audioFile: '', videoFile: '' }],
        }
    });

    const handleLogoUploadStart = React.useCallback(() => {
        setLoading(true);
    }, []);

    const addArrayField = React.useCallback((field: keyof FormData) => {
        const currentValue = watch(field) as any[];
        let newItem;
        
        switch (field) {
            case 'deacons':
            case 'trustees':
                newItem = { names: '', descriptions: '', image: '' };
                // Clear the image in Redux for the new index
                if (field === 'deacons') {
                    dispatch(setDeaconImage({ deaconId: currentValue.length.toString(), imageUrl: '' }));
                }
                break;
            case 'pastServices':
                newItem = { title: '', preacher: '', sermon: '' };
                break;
            case 'songs':
                newItem = { title: '', uploadType: 'url', songUrl: '', audioFile: '', videoFile: '' };
                break;
            default:
                return;
        }
        
        setValue(field, [...currentValue, newItem]);
    }, [setValue, watch, dispatch]);

    const pickImage = React.useCallback(async (options: {
        multiple: boolean;
        field: keyof FormData | string;
        subField?: string
    }) => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Sorry, we need media library permissions to make this work!');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1,
                allowsMultipleSelection: options.multiple,
                selectionLimit: 10,
                exif: false,
                base64: false,
            });

            if (!result.canceled) {
                if (options.multiple) {
                    const processImages = async (assets: ImagePicker.ImagePickerAsset[]) => {
                        const processedUris: string[] = [];

                        for (const asset of assets) {
                            try {
                                // Convert image to JPEG format with error handling
                                let manipulatedImage;
                                try {
                                    manipulatedImage = await ImageManipulator.manipulateAsync(
                                        asset.uri,
                                        [{ resize: { width: 1200 } }],
                                        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
                                    );
                                } catch (manipulationError) {
                                    console.error('Image manipulation error:', manipulationError);
                                    // Fallback to original image if manipulation fails
                                    manipulatedImage = { uri: asset.uri };
                                }

                                // Generate a unique filename
                                const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
                                const destinationUri = `${FileSystem.cacheDirectory}${filename}`;

                                // Copy converted image to cache directory
                                await FileSystem.copyAsync({
                                    from: manipulatedImage.uri,
                                    to: destinationUri
                                });

                                processedUris.push(destinationUri);
                            } catch (error) {
                                console.error('Error processing image:', error);
                                // Try to use the original URI as fallback
                                try {
                                    processedUris.push(asset.uri);
                                } catch (fallbackError) {
                                    console.error('Fallback error:', fallbackError);
                                    continue;
                                }
                            }
                        }

                        return processedUris;
                    };

                    const processedUris = await processImages(result.assets);

                    if (processedUris.length === 0) {
                        Alert.alert('Error', 'Unable to process the selected images. Please try again.');
                        return;
                    }

                    if (Array.isArray(watch(options.field as keyof FormData))) {
                        if (options.field === 'gallery') {
                            const existingImages = watch('gallery') || [];
                            setValue('gallery', [...existingImages, ...processedUris], { shouldValidate: true });
                            setGallery(prev => [...prev, ...processedUris]);
                        } else if (options.field === 'churchBanners') {
                            // Get existing banners and append new ones
                            const existingBanners = watch('churchBanners') || [];
                            const updatedBanners = [...existingBanners, ...processedUris];
                            setValue('churchBanners', updatedBanners, { shouldValidate: true });
                            setChurchBanners(updatedBanners);
                        } else {
                            setValue(options.field as keyof FormData, processedUris, { shouldValidate: true });
                        }
                    } else {
                        Alert.alert('Error', 'Multiple selection not allowed for this field');
                    }
                } else {
                    try {
                        // Convert single image to JPEG format with error handling
                        let manipulatedImage;
                        try {
                            manipulatedImage = await ImageManipulator.manipulateAsync(
                                result.assets[0].uri,
                                [{ resize: { width: 1200 } }],
                                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
                            );
                        } catch (manipulationError) {
                            console.error('Image manipulation error:', manipulationError);
                            // Fallback to original image if manipulation fails
                            manipulatedImage = { uri: result.assets[0].uri };
                        }

                        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
                        const destinationUri = `${FileSystem.cacheDirectory}${filename}`;

                        await FileSystem.copyAsync({
                            from: manipulatedImage.uri,
                            to: destinationUri
                        });

                        if (options.subField) {
                            setValue(`${options.field}.${options.subField}` as any, destinationUri, { shouldValidate: true });

                            if (options.field === 'principal' && options.subField === 'image') {
                                setPastorWife(destinationUri);
                            }
                        } else {
                            setValue(options.field as any, destinationUri, { shouldValidate: true });

                            if (options.field === 'churchLogo') {
                                setChurchLogo(destinationUri);
                            } else if (options.field === 'churchImage') {
                                setChurchImage(destinationUri);
                            }
                        }
                    } catch (error) {
                        console.error('File processing error:', error);
                        Alert.alert('Error', 'Unable to process the selected image. Please try again.');
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Failed to process image. Please try again.');
        }
    }, [setValue, watch]);

    const pickMediaFile = React.useCallback(async (index: number, type: 'audio' | 'video') => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Sorry, we need media library permissions to make this work!');
                return;
            }

            const result = await DocumentPicker.getDocumentAsync({
                type: type === 'audio' ? ['audio/*'] : ['video/*'],
                copyToCacheDirectory: false,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                // Check file size (15MB = 15 * 1024 * 1024 bytes)
                const maxSize = 15 * 1024 * 1024;

                // Use FileSystem to get file size
                const fileInfo = await FileSystem.getInfoAsync(asset.uri);
                const fileSize = 'size' in fileInfo ? fileInfo.size : 0;

                if (fileSize > maxSize) {
                    Alert.alert(
                        'File Too Large',
                        'Please select a file smaller than 15MB',
                        [{ text: 'OK' }]
                    );
                    return;
                }

                // Update the form with the file URI and size
                setValue(`songs.${index}.${type}File`, asset.uri);
                setValue(`songs.${index}.fileSize`, fileSize);
                setValue(`songs.${index}.uploadType`, type);
            } else if (result.canceled) {
                // Handle cancellation if needed
                console.log('Document picking was cancelled');
            }
        } catch (error) {
            Alert.alert('Error picking media file');
            console.error(error);
        }
    }, [setValue]);

    const onSubmit = React.useCallback(async (data: FormData) => {
        try {
            setLoading(true);
            // Debug logs
            console.log('churchLogo_reduxState:', churchLogo_reduxState);
            console.log('data.churchLogo:', data.churchLogo);

            // Update form data with latest Cloudinary URLs from Redux
            const updatedData = {
                churchName: data.churchName,
                churchLocation: data.churchLocation,
                churchLogo: churchLogo_reduxState || data.churchLogo,
                principal: {
                    pastor: data.principal.pastor,
                    wife: data.principal.wife,
                    description: data.principal.description,
                    image: principalImage_reduxState || data.principal.image
                },
                pastor: data.pastor,
                wife: data.wife,
                description: data.description,
                image: data.image,
                churchImage: churchImage_reduxState || data.churchImage,
                churchBanners: churchBanners_reduxState || data.churchBanners,
                deacons: deacons_reduxState || data.deacons,
                trustees: trustees_reduxState || data.trustees,
                pastServices: pastServices_reduxState || data.pastServices,
                gallery: gallery_reduxState || data.gallery,
                songs: songs_reduxState || data.songs
            };

            // Log the complete form data with updated image URLs
            console.log('Submitting form data:', updatedData);
            Alert.alert('Success', 'Form submitted successfully');
        } catch (error) {
            console.error('Form submission error:', error);
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit form');
        } finally {
            setLoading(false);
        }
    }, [churchLogo_reduxState, churchImage_reduxState, principalImage_reduxState, churchBanners_reduxState, deacons_reduxState, trustees_reduxState, pastServices_reduxState, gallery_reduxState, songs_reduxState]);

    const handleButtonPress = React.useCallback(() => {
        // Get all form values
        const formValues = watch();
        console.log('All form values:', formValues);

        handleSubmit(
            (data) => {
                // Success callback
                console.log('Valid form data:', {
                    churchName: data.churchName,
                    churchLocation: data.churchLocation,
                    churchLogo: data.churchLogo,
                    principal: data.principal,
                    pastor: data.pastor,
                    wife: data.wife,
                    description: data.description,
                    image: data.image,
                    churchImage: data.churchImage,
                    churchBanners: data.churchBanners,
                    deacons: data.deacons,
                    trustees: data.trustees,
                    pastServices: data.pastServices,
                    gallery: data.gallery,
                    songs: data.songs
                });
                Alert.alert('Success', 'Form data is valid and has been logged to console');
                onSubmit(data);
            },
            (errors) => {
                // Error callback
                console.log('Form validation errors:', errors);
                const errorMessages = Object.entries(errors)
                    .map(([key, value]) => `${key}: ${value.message}`)
                    .join('\n');
                Alert.alert('Validation Error', `Please fix the following errors:\n${errorMessages}`);
            }
        )();
    }, [handleSubmit, onSubmit, watch]);

    const removeChurchBanner = React.useCallback((index: number) => {
        dispatch(removeChurchBannerByIndex(index));
    }, [dispatch]);

    const removeGalleryImage = React.useCallback((indexToRemove: number) => {
        const currentGallery = watch('gallery') || [];
        const updatedGallery = currentGallery.filter((_, index) => index !== indexToRemove);
        setValue('gallery', updatedGallery, { shouldValidate: true });
        setGallery(updatedGallery);
    }, [setValue, watch]);

    // GRADIENT COLOR BORDER
    const GradientBorderContainer = ({ children }: { children: React.ReactNode }) => (
        <View style={styles.gradientBorder}>
            <LinearGradient
                colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    borderRadius: 24,
                }}
            />
            <View style={styles.innerContainer}>
                {children}
            </View>
        </View>
    );

    useEffect(() => {
        console.log('Form errors:', errors);
    }, [errors]);

    useEffect(() => {
        if (churchLogo_reduxState) {
            setLoading(false);
            setChurchLogo(churchLogo_reduxState);
            setValue('churchLogo', churchLogo_reduxState);
        }
    }, [churchLogo_reduxState]);

    useEffect(() => {
        if (churchImage_reduxState) {
            setLoading(false);
            setChurchImage(churchImage_reduxState);
            setValue('churchImage', churchImage_reduxState);
        }
    }, [churchImage_reduxState]);

    useEffect(() => {
        if (principalImage_reduxState) {
            setLoading(false);
            setPastorWife(principalImage_reduxState);
            setValue('principal.image', principalImage_reduxState);
        }
    }, [principalImage_reduxState]);

    useEffect(() => {
        if (churchBanners_reduxState) {
            setLoading(false);
            setChurchBanners(churchBanners_reduxState);
            setValue('churchBanners', churchBanners_reduxState);
        }
    }, [churchBanners_reduxState]);

    useEffect(() => {
        if (gallery_reduxState) {
            setLoading(false);
            setGallery(gallery_reduxState);
            setValue('gallery', gallery_reduxState);
        }
    }, [gallery_reduxState]);

    useEffect(() => {
        if (deacons_reduxState) {
            const deacons = watch('deacons') || [];
            Object.entries(deacons_reduxState).forEach(([deaconId, imageUrl]) => {
                const index = parseInt(deaconId);
                if (!isNaN(index) && index < deacons.length) {
                    // Only update if the image URL has changed
                    const currentImage = deacons[index]?.image;
                    if (imageUrl && imageUrl !== currentImage) {
                        setValue(`deacons.${index}.image`, imageUrl);
                    }
                }
            });
        }
    }, [deacons_reduxState, setValue, watch]);

    useEffect(() => {
        setChurchLogo(null);
        dispatch({ type: 'GET_LOGO', payload: { churchLogo: null } });
        dispatch(clearChurchBanners());
        // Initialize the first deacon's image in Redux
        dispatch(setDeaconImage({ deaconId: '0', imageUrl: '' }));
    }, []);

    const DeaconsSection = React.useMemo(() => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deacons</Text>
            {watch('deacons').map((deacon, index) => (
                <Animated.View
                    key={index}
                    entering={FadeInDown.delay(index * 100).springify()}
                    style={styles.itemContainer}
                >
                    <View style={styles.itemHeader}>
                        <MaterialCommunityIcons name="account-tie" size={24} color="#052b4e" />
                        <Text style={styles.itemHeaderText}>Deacon {index + 1}</Text>
                    </View>
                    <Controller
                        control={control}
                        name={`deacons.${index}.names`}
                        render={({ field: { onChange, value } }) => (
                            <ChurchInput
                                label="Deacon Name"
                                keyboardType="default"
                                placeholder="Deacon Name"
                                value={value}
                                onChangeText={onChange}
                                error={errors.deacons?.[index]?.names?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name={`deacons.${index}.descriptions`}
                        render={({ field: { onChange, value } }) => (
                            <ChurchInput
                                label="Description"
                                keyboardType="default"
                                placeholder="Description"
                                value={value}
                                onChangeText={onChange}
                                multiline={true}
                                numberOfLines={4}
                                error={errors.deacons?.[index]?.descriptions?.message}
                            />
                        )}
                    />

                    <GradientBorderContainer>
                        <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 20 }}>
                            {deacon.image ? (
                                <ExpoImage
                                    source={{ uri: deacon.image }}
                                    style={{ width: "100%", height: 200 }}
                                    contentFit="contain"
                                />
                            ) : (
                                <ExpoImage
                                    source={defaultLogo}
                                    style={{ width: "100%", height: 200 }}
                                    contentFit="contain"
                                />
                            )}
                            <DashboardImageUploader
                                name={deacon.image ? 'Change Deacon Image' : 'Select Deacon Image'}
                                actionType={DEACONS_IMAGE}
                                onUploadStart={handleLogoUploadStart}
                                index={index}
                            />
                        </View>
                    </GradientBorderContainer>
                </Animated.View>
            ))}
            <ButtonInput
                name='Add New Deacon'
                onPress={() => addArrayField('deacons')}
            />
        </View>
    ), [watch('deacons'), control, errors, handleLogoUploadStart, addArrayField, deacons_reduxState]);

    return (
        <SafeAreaView style={[GlobalStyles.SafeAreaPaddingTop, { backgroundColor: "#E0E5E9", height: windowHeight, paddingBottom: 20 }]}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center' }}>
                {/* GENERAL */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>General</Text>
                    <Controller
                        control={control}
                        name="churchName"
                        render={({ field: { onChange, value } }) => (
                            <ChurchInput
                                label="Church Name"
                                keyboardType="default"
                                placeholder="Church Name"
                                value={value}
                                onChangeText={onChange}
                                error={errors.churchName?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="churchLocation"
                        render={({ field: { onChange, value } }) => (
                            <ChurchInput
                                label="Church Location"
                                keyboardType="default"
                                placeholder="Church Location"
                                value={value}
                                onChangeText={onChange}
                                error={errors.churchLocation?.message}
                            />
                        )}
                    />

                    <GradientBorderContainer>
                        <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 20 }}>
                            {churchLogo && (
                                <ExpoImage
                                    source={churchLogo}
                                    style={{ width: "100%", height: 200 }}
                                    contentFit="fill"
                                />
                            )}

                            {!churchLogo && (
                                <ExpoImage
                                    source={defaultLogo}
                                    style={{ width: "100%", height: 200 }}
                                    contentFit="fill"
                                />
                            )}

                            <DashboardImageUploader
                                name="Select Church Logo"
                                actionType={CHURCH_LOGO}
                                onUploadStart={handleLogoUploadStart}
                            />
                        </View>
                    </GradientBorderContainer>
                </View>

                {/* PRINCIPAL */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Principal</Text>
                    <Controller
                        control={control}
                        name="principal.pastor"
                        render={({ field: { onChange, value } }) => (
                            <ChurchInput
                                label="Pastor Name"
                                keyboardType="default"
                                placeholder="Pastor Name"
                                value={value}
                                onChangeText={onChange}
                                error={errors.principal?.pastor?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="principal.wife"
                        render={({ field: { onChange, value } }) => (
                            <ChurchInput
                                label="Wife Name"
                                keyboardType="default"
                                placeholder="Wife name"
                                value={value}
                                onChangeText={onChange}
                                error={errors.principal?.wife?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="principal.description"
                        render={({ field: { onChange, value } }) => (
                            <ChurchInput
                                label="Description"
                                keyboardType="default"
                                placeholder="Description"
                                value={value}
                                onChangeText={onChange}
                                multiline={true}
                                numberOfLines={4}
                                error={errors.principal?.description?.message}
                            />
                        )}
                    />

                    <GradientBorderContainer>
                        <View style={{ backgroundColor: "#fff", padding: 25, borderRadius: 20 }}>
                            {pastorWife ? (
                                <ExpoImage
                                    source={{ uri: pastorWife }}
                                    style={{ width: "100%", height: 200 }}
                                    contentFit="fill"
                                />
                            ) : (
                                <ExpoImage
                                    source={pastorWifeImageDemo}
                                    style={{ width: "100%", height: 200 }}
                                    contentFit="fill"
                                />
                            )}

                            <DashboardImageUploader
                                name="Select Pastor & Wife Image"
                                actionType={PASTOR_WIFE_IMAGE}
                                onUploadStart={handleLogoUploadStart}
                            />
                        </View>
                    </GradientBorderContainer>

                    <GradientBorderContainer>
                        <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 20 }}>
                            {churchImage ? (
                                <ExpoImage
                                    source={{ uri: churchImage }}
                                    style={{ width: "100%", height: 200 }}
                                    contentFit="fill"
                                />
                            ) : (
                                <ExpoImage
                                    source={churchIMageDemo}
                                    style={{ width: "100%", height: 200 }}
                                    contentFit="fill"
                                />
                            )}

                            <DashboardImageUploader
                                name="Select Church Image"
                                actionType={CHURCH_IMAGE}
                                onUploadStart={handleLogoUploadStart}
                            />
                        </View>
                    </GradientBorderContainer>

                    <GradientBorderContainer>
                        <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 20 }}>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
                                {Array.isArray(churchBanners_reduxState) && churchBanners_reduxState.length > 0 ? (
                                    churchBanners_reduxState.map((banner, index) => (
                                        <View key={index} style={{ width: "48%", marginBottom: 10, position: "relative" }}>
                                            <ExpoImage
                                                source={{ uri: banner }}
                                                style={{ width: "100%", height: 100, borderRadius: 8 }}
                                                contentFit="cover"
                                            />
                                            <Pressable
                                                onPress={() => removeChurchBanner(index)}
                                                style={{
                                                    position: "absolute",
                                                    top: 5,
                                                    right: 5,
                                                    backgroundColor: "rgba(255, 0, 0, 0.7)",
                                                    borderRadius: 12,
                                                    width: 24,
                                                    height: 24,
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <MaterialCommunityIcons name="close" size={18} color="white" />
                                            </Pressable>
                                        </View>
                                    ))
                                ) : (
                                    <ExpoImage
                                    source={churchBannersDemo}
                                    style={{ width: "100%", height: 200 }}
                                    contentFit="fill"
                                />
                                )}
                            </View>

                            <DashboardImageUploader
                                name="Select Church Banners"
                                actionType={CHURCH_BANNER_IMAGE}
                                onUploadStart={handleLogoUploadStart}
                                multiple={true}
                            />
                        </View>
                    </GradientBorderContainer>
                </View>

                {/* GALLERY */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Gallery</Text>
                    <GradientBorderContainer>
                        <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 20 }}>
                            {watch('gallery').length > 0 ? (
                                <View style={styles.galleryGrid}>
                                    {watch('gallery').map((image, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.galleryItem,
                                                index % 3 === 0 && styles.galleryItemLarge,
                                            ]}
                                        >
                                            <ExpoImage
                                                source={{ uri: image }}
                                                style={[
                                                    styles.galleryImage,
                                                    index % 3 === 0 ? { height: 250 } : { height: 180 }
                                                ]}
                                                contentFit="cover"
                                                transition={1000}
                                            />
                                            <LinearGradient
                                                colors={['transparent', 'rgba(0,0,0,0.3)']}
                                                style={styles.imageOverlay}
                                            />
                                            <Pressable
                                                onPress={() => removeGalleryImage(index)}
                                                style={{
                                                    position: "absolute",
                                                    top: 5,
                                                    right: 5,
                                                    backgroundColor: "rgba(255, 0, 0, 0.7)",
                                                    borderRadius: 12,
                                                    width: 24,
                                                    height: 24,
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    zIndex: 2,
                                                }}
                                            >
                                                <MaterialCommunityIcons name="close" size={18} color="white" />
                                            </Pressable>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.emptyGallery}>
                                    <ExpoImage
                                        source={require('../../../assets/images/gallery.png')}
                                        style={{ width: 100, height: 100, opacity: 0.5 }}
                                        contentFit="contain"
                                    />
                                    <Text style={styles.emptyGalleryText}>No images in gallery</Text>
                                </View>
                            )}

                            <DashboardImageUploader
                                name={watch('gallery').length > 0 ? 'Add More Images' : 'Add Gallery Images'}
                                actionType={GALLERY_IMAGES}
                                onUploadStart={handleLogoUploadStart}
                                multiple={true}
                            />
                        </View>
                    </GradientBorderContainer>
                </View>

                {DeaconsSection}

                {/* TRUSTEES */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Trustees</Text>
                    {watch('trustees').map((trustee, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInDown.delay(index * 100).springify()}
                            style={styles.itemContainer}
                        >
                            <View style={styles.itemHeader}>
                                <MaterialCommunityIcons name="account-group" size={24} color="#052b4e" />
                                <Text style={styles.itemHeaderText}>Trustee {index + 1}</Text>
                            </View>
                            <Controller
                                control={control}
                                name={`trustees.${index}.names`}
                                render={({ field: { onChange, value } }) => (
                                    <ChurchInput
                                        label="Trustee Name"
                                        keyboardType="default"
                                        placeholder="Trustee Name"
                                        value={value}
                                        onChangeText={onChange}
                                        error={errors.trustees?.[index]?.names?.message}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name={`trustees.${index}.descriptions`}
                                render={({ field: { onChange, value } }) => (
                                    <ChurchInput
                                        label="Description"
                                        keyboardType="default"
                                        placeholder="Description"
                                        value={value}
                                        onChangeText={onChange}
                                        multiline={true}
                                        numberOfLines={4}
                                        error={errors.trustees?.[index]?.descriptions?.message}
                                    />
                                )}
                            />

                            <GradientBorderContainer>
                                <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 20 }}>
                                    {watch(`trustees.${index}.image`) ? (
                                        <ExpoImage
                                            source={{ uri: watch(`trustees.${index}.image`) }}
                                            style={{ width: "100%", height: 200 }}
                                            contentFit="contain"
                                        />
                                    ) : (
                                        <ExpoImage
                                            source={defaultLogo}
                                            style={{ width: "100%", height: 200 }}
                                            contentFit="contain"
                                        />
                                    )}
                                    <DashboardImageUploader
                                        name={watch(`trustees.${index}.image`) ? 'Change Trustee Image' : 'Select Trustee Image'}
                                        actionType={TRUSTEE_IMAGE}
                                        onUploadStart={handleLogoUploadStart}
                                        index={index}
                                    />
                                </View>
                            </GradientBorderContainer>
                        </Animated.View>
                    ))}
                    <ButtonInput
                        name='Add New Trustee'
                        onPress={() => addArrayField('trustees')}
                    />
                </View>

                {/* PAST SERVICES */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Past Services</Text>
                    {watch('pastServices').map((service, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInDown.delay(index * 100).springify()}
                            style={styles.itemContainer}
                        >
                            <View style={styles.itemHeader}>
                                <MaterialCommunityIcons name="church" size={24} color="#052b4e" />
                                <Text style={styles.itemHeaderText}>Service {index + 1}</Text>
                            </View>
                            <Controller
                                control={control}
                                name={`pastServices.${index}.title`}
                                render={({ field: { onChange, value } }) => (
                                    <ChurchInput
                                        label="Title"
                                        keyboardType="default"
                                        placeholder="Title"
                                        value={value}
                                        onChangeText={onChange}
                                        error={errors.pastServices?.[index]?.title?.message}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name={`pastServices.${index}.preacher`}
                                render={({ field: { onChange, value } }) => (
                                    <ChurchInput
                                        label="Preacher"
                                        keyboardType="default"
                                        placeholder="Preacher"
                                        value={value}
                                        onChangeText={onChange}
                                        error={errors.pastServices?.[index]?.preacher?.message}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name={`pastServices.${index}.sermon`}
                                render={({ field: { onChange, value } }) => {
                                    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

                                    const handleUrlChange = (text: string) => {
                                        onChange(text);
                                        try {
                                            const videoInfo = getVideoInfo(text);
                                            if (videoInfo.platform) {
                                                setPreviewUrl(videoInfo.thumbnailUrl);
                                            } else {
                                                setPreviewUrl(null);
                                            }
                                        } catch (error) {
                                            setPreviewUrl(null);
                                        }
                                    };

                                    return (
                                        <View>
                                            <ChurchInput
                                                label="Sermon"
                                                keyboardType="default"
                                                placeholder="Sermon (Paste video URL)"
                                                value={value}
                                                onChangeText={handleUrlChange}
                                                error={errors.pastServices?.[index]?.sermon?.message}
                                            />
                                            {previewUrl && (
                                                <GradientBorderContainer>
                                                    <View style={{ backgroundColor: "#fff", padding: 15, borderRadius: 20 }}>
                                                        <View style={styles.videoPreviewContainer}>
                                                            <Image
                                                                source={{ uri: previewUrl }}
                                                                style={{ width: '100%', height: 200, borderRadius: 8 }}
                                                                resizeMode="cover"
                                                            />
                                                            <View style={styles.videoOverlay}>
                                                                <MaterialCommunityIcons
                                                                    name="play-circle"
                                                                    size={50}
                                                                    color="#fff"
                                                                />
                                                            </View>
                                                        </View>
                                                    </View>
                                                </GradientBorderContainer>
                                            )}
                                        </View>
                                    );
                                }}
                            />
                        </Animated.View>
                    ))}
                    <ButtonInput
                        name='Add New Past Service'
                        onPress={() => addArrayField('pastServices')}
                    />
                </View>

                {/* SONGS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Songs</Text>
                    {watch('songs').map((song, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInDown.delay(index * 100).springify()}
                            style={styles.songContainer}
                        >
                            <View style={styles.songHeader}>
                                <MaterialCommunityIcons name="music-note" size={24} color="#052b4e" />
                                <Text style={styles.songHeaderText}>Song {index + 1}</Text>
                            </View>

                            <Controller
                                control={control}
                                name={`songs.${index}.title`}
                                render={({ field: { onChange, value } }) => (
                                    <ChurchInput
                                        label="Song Title"
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder="Enter song title"
                                    />
                                )}
                            />

                            <View style={styles.uploadTypeContainer}>
                                <Text style={styles.uploadTypeLabel}>Upload Type</Text>
                                <View style={styles.uploadTypeButtons}>
                                    <Pressable
                                        style={[
                                            styles.uploadTypeButton,
                                            (watch(`songs.${index}.uploadType`) ?? 'url') === 'url' && styles.uploadTypeButtonActive
                                        ]}
                                        onPress={() => setValue(`songs.${index}.uploadType`, 'url')}
                                    >
                                        <MaterialCommunityIcons
                                            name="link-variant"
                                            size={20}
                                            color={(watch(`songs.${index}.uploadType`) ?? 'url') === 'url' ? '#fff' : '#666'}
                                        />
                                        <Text style={[
                                            styles.uploadTypeButtonText,
                                            (watch(`songs.${index}.uploadType`) ?? 'url') === 'url' && styles.uploadTypeButtonTextActive
                                        ]}>URL</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[
                                            styles.uploadTypeButton,
                                            (watch(`songs.${index}.uploadType`) ?? 'url') === 'audio' && styles.uploadTypeButtonActive
                                        ]}
                                        onPress={() => setValue(`songs.${index}.uploadType`, 'audio')}
                                    >
                                        <MaterialCommunityIcons
                                            name="file-music-outline"
                                            size={20}
                                            color={(watch(`songs.${index}.uploadType`) ?? 'url') === 'audio' ? '#fff' : '#666'}
                                        />
                                        <Text style={[
                                            styles.uploadTypeButtonText,
                                            (watch(`songs.${index}.uploadType`) ?? 'url') === 'audio' && styles.uploadTypeButtonTextActive
                                        ]}>Audio File</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[
                                            styles.uploadTypeButton,
                                            (watch(`songs.${index}.uploadType`) ?? 'url') === 'video' && styles.uploadTypeButtonActive
                                        ]}
                                        onPress={() => setValue(`songs.${index}.uploadType`, 'video')}
                                    >
                                        <MaterialCommunityIcons
                                            name="video-outline"
                                            size={20}
                                            color={(watch(`songs.${index}.uploadType`) ?? 'url') === 'video' ? '#fff' : '#666'}
                                        />
                                        <Text style={[
                                            styles.uploadTypeButtonText,
                                            (watch(`songs.${index}.uploadType`) ?? 'url') === 'video' && styles.uploadTypeButtonTextActive
                                        ]}>Video File</Text>
                                    </Pressable>
                                </View>
                            </View>

                            <View style={styles.uploadContainer}>
                                {watch(`songs.${index}.uploadType`) === 'url' && (
                                    <Controller
                                        control={control}
                                        name={`songs.${index}.songUrl`}
                                        render={({ field: { onChange, value } }) => {
                                            const [previewUrl, setPreviewUrl] = useState<string | null>(null);

                                            const handleUrlChange = (text: string) => {
                                                onChange(text);
                                                try {
                                                    const videoInfo = getVideoInfo(text);
                                                    if (videoInfo.platform) {
                                                        setPreviewUrl(videoInfo.thumbnailUrl);
                                                    } else {
                                                        setPreviewUrl(null);
                                                    }
                                                } catch (error) {
                                                    setPreviewUrl(null);
                                                }
                                            };

                                            return (
                                                <View>
                                                    <ChurchInput
                                                        label="Song URL"
                                                        keyboardType="default"
                                                        placeholder="Enter song URL (YouTube/Vimeo)"
                                                        value={value ?? ''}
                                                        onChangeText={handleUrlChange}
                                                        error={errors.songs?.[index]?.songUrl?.message}
                                                    />
                                                    {previewUrl && (
                                                        <GradientBorderContainer>
                                                            <View style={{ backgroundColor: "#fff", padding: 15, borderRadius: 20 }}>
                                                                <View style={styles.videoPreviewContainer}>
                                                                    <Image
                                                                        source={{ uri: previewUrl }}
                                                                        style={{ width: '100%', height: 200, borderRadius: 8 }}
                                                                        resizeMode="cover"
                                                                    />
                                                                    <View style={styles.videoOverlay}>
                                                                        <MaterialCommunityIcons
                                                                            name="play-circle"
                                                                            size={50}
                                                                            color="#fff"
                                                                        />
                                                                    </View>
                                                                </View>
                                                            </View>
                                                        </GradientBorderContainer>
                                                    )}
                                                </View>
                                            );
                                        }}
                                    />
                                )}
                                {watch(`songs.${index}.uploadType`) === 'audio' && (
                                    <View style={styles.fileUploadContainer}>
                                        {watch(`songs.${index}.audioFile`) ? (
                                            <View style={styles.selectedFileContainer}>
                                                <MaterialCommunityIcons name="file-music" size={24} color="#052b4e" />
                                                {watch(`songs.${index}.audioFile`) ? (
                                                    <Text style={styles.selectedFileName}>
                                                        {(watch(`songs.${index}.audioFile`) || '').split('/').pop()}
                                                    </Text>
                                                ) : null}
                                                <Text style={styles.selectedFileSize}>
                                                    {((watch(`songs.${index}.fileSize`) || 0) / (1024 * 1024)).toFixed(2)} MB
                                                </Text>
                                            </View>
                                        ) : null}
                                        <ButtonInput
                                            name={watch(`songs.${index}.audioFile`) ? 'Change Audio File' : 'Select Audio File'}
                                            onPress={() => pickMediaFile(index, 'audio')}
                                        />
                                    </View>
                                )}
                                {watch(`songs.${index}.uploadType`) === 'video' && (
                                    <View style={styles.fileUploadContainer}>
                                        {watch(`songs.${index}.videoFile`) ? (
                                            <View style={styles.selectedFileContainer}>
                                                <MaterialCommunityIcons name="video" size={24} color="#052b4e" />
                                                {watch(`songs.${index}.videoFile`) ? (
                                                    <Text style={styles.selectedFileName}>
                                                        {(watch(`songs.${index}.videoFile`) || '').split('/').pop()}
                                                    </Text>
                                                ) : null}
                                                <Text style={styles.selectedFileSize}>
                                                    {((watch(`songs.${index}.fileSize`) || 0) / (1024 * 1024)).toFixed(2)} MB
                                                </Text>
                                            </View>
                                        ) : null}
                                        <ButtonInput
                                            name={watch(`songs.${index}.videoFile`) ? 'Change Video File' : 'Select Video File'}
                                            onPress={() => pickMediaFile(index, 'video')}
                                        />
                                    </View>
                                )}
                            </View>

                            <Pressable
                                style={styles.removeSongButton}
                                onPress={() => {
                                    const songs = watch('songs');
                                    if (songs.length > 1) {
                                        const newSongs = [...songs];
                                        newSongs.splice(index, 1);
                                        setValue('songs', newSongs, { shouldValidate: true });
                                    }
                                }}
                            >
                                <MaterialCommunityIcons
                                    name="delete-outline"
                                    size={20}
                                    color={watch('songs').length <= 1 ? "#cccccc" : "#ff4444"}
                                />
                                <Text style={[
                                    styles.removeSongButtonText,
                                    watch('songs').length <= 1 && { color: '#cccccc' }
                                ]}>Remove Song</Text>
                            </Pressable>
                        </Animated.View>
                    ))}
                    <ButtonInput
                        name='Add New Song'
                        onPress={() => addArrayField('songs')}
                        icon="plus"
                    />
                </View>

                {/* Submit Button */}
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                    <ButtonInput
                        name={loading ? 'Submitting...' : 'Submit'}
                        onPress={handleButtonPress}
                        disabled={loading}
                    />
                </View>
            </ScrollView>

            {loading && <DashboardLoader />}

            <AlertPopup
        visible={showAlert}
        message={alertMessage}
        onClose={() => setShowAlert(false)}
      />
        </SafeAreaView>
    );
};

export default Space;

const styles = StyleSheet.create({
    section: {
        padding: 20,
        borderRadius: 20,
        backgroundColor: '#f7f7f7',
        width: windowWidth - 40,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 24,
        fontFamily: 'RobotoBold',
        marginBottom: 20,
        color: '#052b4e',
    },
    itemContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemHeaderText: {
        fontSize: 20,
        fontFamily: 'RobotoBold',
        color: '#052b4e',
        marginLeft: 10,
    },
    deaconContainer: {
        marginBottom: 20,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradientBorder: {
        marginTop: 20,
        // marginBottom: 20,
        borderRadius: 24,
        padding: 4,
        position: 'relative',
    },
    innerContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        margin: 2,
    },
    galleryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
        justifyContent: 'space-between',
    },
    galleryItem: {
        width: '32%',
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        marginBottom: 8,
    },
    galleryItemLarge: {
        width: '49%',
    },
    galleryImage: {
        width: '100%',
        backgroundColor: '#f0f0f0',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    emptyGallery: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: '#f8f9fa',
        borderRadius: 15,
        marginBottom: 20,
    },
    emptyGalleryText: {
        marginTop: 15,
        color: '#6c757d',
        fontSize: 16,
    },
    songContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    songHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    songHeaderText: {
        fontSize: 20,
        fontFamily: 'RobotoBold',
        color: '#052b4e',
        marginLeft: 10,
    },
    uploadTypeContainer: {
        marginVertical: 20,
    },
    uploadTypeLabel: {
        fontSize: 16,
        fontFamily: 'RobotoMedium',
        color: '#333',
        marginBottom: 12,
    },
    uploadTypeButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    uploadTypeButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    uploadTypeButtonActive: {
        backgroundColor: '#052b4e',
        borderColor: '#052b4e',
    },
    uploadTypeButtonText: {
        fontSize: 14,
        fontFamily: 'RobotoMedium',
        color: '#666',
    },
    uploadTypeButtonTextActive: {
        color: '#fff',
    },
    uploadContainer: {
        marginTop: 15,
    },
    fileUploadContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
    },
    selectedFileContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    selectedFileName: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'RobotoMedium',
        color: '#333',
    },
    selectedFileSize: {
        fontSize: 12,
        fontFamily: 'RobotoRegular',
        color: '#666',
    },
    removeSongButton: {
        backgroundColor: '#fff0f0',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#ffdddd',
    },
    removeSongButtonDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#e0e0e0',
    },
    removeSongButtonText: {
        fontSize: 14,
        fontFamily: 'RobotoMedium',
        color: '#ff4444',
        marginLeft: 8,
    },
    removeSongButtonTextDisabled: {
        color: '#cccccc',
    },
    videoPreviewContainer: {
        position: 'relative',
        width: '100%',
        height: 200,
        borderRadius: 15,
        overflow: 'hidden',
        marginTop: 10,
    },
    videoThumbnail: {
        width: '100%',
        height: '100%',
    },
    videoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoInfoContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 15,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    videoTitle: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'RobotoBold',
        marginBottom: 5,
    },
    videoPreacher: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'RobotoRegular',
        opacity: 0.8,
    },
    platformBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        paddingHorizontal: 10,
    },
    platformText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'RobotoMedium',
        marginLeft: 5,
    },
});