import { Link, Stack, usePathname } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';


export default function NotFoundScreen() {
  const pathname = usePathname();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text>This screen doesn't exist.</Text>
        <Text>Path: {pathname}</Text>
        <Link href="/(app)/home" style={styles.link}>
          <Text>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
