import { StyleSheet, Platform } from 'react-native';

// const colorScheme = useColorScheme();
// const backgroundColor = colorScheme === 'dark' ? '#000' : '#fff';
  
export default StyleSheet.create({
    droidSafeArea: {
        paddingTop: Platform.OS === 'android' ? 10 : 0
    },
    SafeAreaPaddingTop: {
        paddingTop: Platform.OS === 'ios' ? 10 : 10
    },
});