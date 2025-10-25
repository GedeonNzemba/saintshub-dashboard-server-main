import { StyleSheet, View, ViewStyle, TouchableOpacity, Alert } from 'react-native'
import React from 'react'
import { Button, Text } from 'react-native-paper'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

interface InputProps {
    name: string;
    onPress: () => void;
    icon?: string;
    disabled?: boolean;
}

const ButtonInput: React.FC<InputProps> = ({
    name,
    onPress,
    icon,
    disabled = false,
}) => {
    const handlePress = () => {
        console.log('Button pressed:', name);
        Alert.alert('Button pressed', name); // Visual feedback
        if (onPress) {
            onPress();
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={disabled}
            style={{
                marginTop: 30,
                backgroundColor: disabled ? "#666666" : "#030303",
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 10,
                borderRadius: 4,
                gap: 8,
                opacity: disabled ? 0.7 : 1,
            }}
        >
            {icon && <MaterialIcons name={icon as any} size={24} color="#ffffff" />}
            <Text style={{
                color: '#ffffff',
                fontFamily: 'RobotoBold',
                fontSize: 16,
                letterSpacing: 1,
            }}>{name}</Text>
        </TouchableOpacity>
    )
}

export default ButtonInput

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 16,
    },
    textInput: {
        backgroundColor: '#fff',
    }
});