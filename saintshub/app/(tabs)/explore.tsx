import { SafeAreaView, Text } from 'react-native';

export default function TabTwoScreen() {
  return (
    <SafeAreaView>
      <Text style={{ fontFamily: 'RobotoBold' }}>Roboto Bold</Text>
      <Text style={{ fontFamily: 'RobotoRegular' }}>Roboto Regular</Text>
      <Text style={{ fontFamily: 'RobotoMedium' }}>Roboto Light</Text>
    </SafeAreaView>
  );
}