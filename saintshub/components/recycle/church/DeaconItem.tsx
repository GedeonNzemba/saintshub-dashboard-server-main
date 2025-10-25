import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { Control, Controller } from 'react-hook-form';
import { ChurchInput } from '../../../app/(dashboard)/(create)/churchInput';
import DashboardImageUploader from '../imagePicker/DashboardImageUploader';
import { DEACONS_IMAGE } from '@/constants/userConstants';
import defaultLogo from '../../../assets/create church/logo.gif';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientBorderContainer } from '@/components/recycle/containers/GradientBorderContainer';

interface DeaconItemProps {
    index: number;
    control: Control<any>;
    watch: any;
    errors: any;
    handleLogoUploadStart: () => void;
}

const DeaconItem: React.FC<DeaconItemProps> = ({ 
    index, 
    control, 
    watch, 
    errors,
    handleLogoUploadStart 
}) => {
    return (
        <Animated.View
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
                    {watch(`deacons.${index}.image`) ? (
                        <ExpoImage
                            source={{ uri: watch(`deacons.${index}.image`) }}
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
                        name={watch(`deacons.${index}.image`) ? 'Change Deacon Image' : 'Select Deacon Image'}
                        actionType={DEACONS_IMAGE}
                        onUploadStart={handleLogoUploadStart}
                        index={index}
                    />
                </View>
            </GradientBorderContainer>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    itemContainer: {
        marginBottom: 20,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    itemHeaderText: {
        marginLeft: 10,
        fontSize: 18,
        fontFamily: 'RobotoMedium',
        color: '#052b4e',
    },
});

export default memo(DeaconItem);
