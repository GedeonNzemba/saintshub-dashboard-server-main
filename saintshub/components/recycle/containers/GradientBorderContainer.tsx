import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientBorderContainerProps {
    children: React.ReactNode;
}

export const GradientBorderContainer: React.FC<GradientBorderContainerProps> = ({ children }) => (
    <View style={styles.gradientBorder}>
        <LinearGradient
            colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
        />
        {children}
    </View>
);

const styles = StyleSheet.create({
    gradientBorder: {
        borderRadius: 20,
        padding: 2,
        position: 'relative',
        overflow: 'hidden',
        marginVertical: 10,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
});
