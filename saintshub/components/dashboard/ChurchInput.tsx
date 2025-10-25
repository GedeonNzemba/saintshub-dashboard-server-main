import { StyleSheet, View, ViewStyle, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { TextInput } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface InputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    containerStyle?: ViewStyle;
    multiline?: boolean;
    numberOfLines?: number;
    editable?: boolean;
    error?: string;
}

interface ButtonInputProps {
    name: string;
    onPress: (e?: React.BaseSyntheticEvent<object, any, any> | undefined) => Promise<void> | void;
    disabled?: boolean;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

const ChurchInput: React.FC<InputProps> = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    containerStyle,
    multiline,
    numberOfLines,
    editable,
    error
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            <TextInput
                activeOutlineColor="#000"
                label={label}
                keyboardType={keyboardType}
                placeholder={placeholder || label}
                value={value}
                onChangeText={onChangeText}
                mode='outlined'
                multiline={multiline}
                numberOfLines={numberOfLines}
                editable={editable}
                error={!!error}
                textColor="#000"
                contentStyle={multiline ? { height: 120, textAlignVertical: 'top' } : undefined}
                style={[styles.textInput, {
                    borderRadius: 8,
                    fontFamily: 'RobotoRegular',
                    backgroundColor: '#fff',
                }]}
                outlineStyle={{
                    borderRadius: 8,
                }}
                theme={{
                    colors: {
                        primary: error ? 'red' : '#000',
                        text: '#000',
                        placeholder: '#666',
                        onSurface: '#000',
                        onSurfaceVariant: '#000',
                    }
                }}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    )
}

const ButtonInput: React.FC<ButtonInputProps> = ({ name, onPress, disabled = false, icon }) => {
    return (
        <TouchableOpacity 
            onPress={onPress} 
            disabled={disabled}
            style={[
                styles.buttonContainer, 
                disabled && styles.disabledButton
            ]}
        >
            <View style={styles.buttonContent}>
                {icon && (
                    <MaterialCommunityIcons
                        name={icon}
                        size={20} 
                        color={"#fff"} 
                        style={styles.buttonIcon}
                    />
                )}
                <Text style={styles.buttonText}>{name}</Text>
            </View>
        </TouchableOpacity>
    )
}

export { ChurchInput, ButtonInput }

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 10,
    },
    textInput: {
        backgroundColor: 'white',
    },
    buttonContainer: {
        backgroundColor: '#052b4e',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 10,
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    buttonText: {
        color: 'white',
        fontFamily: 'RobotoRegular',
        fontSize: 16,
    },
    buttonIcon: {
        color: 'white',
        fontFamily: 'RobotoRegular',
        fontSize: 16,
        marginRight: 5,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    }
})