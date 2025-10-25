import { Image as ExpoImage } from 'expo-image';
import React from "react";
import { StyleSheet, View, Dimensions, Text, Animated } from "react-native";

const { width, height } = Dimensions.get('window');

function DashboardLoader() {
    const [opacity] = React.useState(new Animated.Value(0.4));

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.4,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.backdrop} />
            <View style={styles.loaderContainer}>
                <ExpoImage
                    source={require("../../assets/animated/loader/cloud-loader.gif")}
                    style={styles.loader}
                    contentFit="cover"
                />
                <Animated.Text style={[styles.loadingText, { opacity }]}>
                    Loading...
                </Animated.Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(5px)',
        zIndex: 998,
    },
    loaderContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 30,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    loader: {
        width: 250,
        height: 250,
    },
    loadingText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 20,
        letterSpacing: 1,
    },
});

export default DashboardLoader;
