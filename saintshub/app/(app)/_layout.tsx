import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <ProtectedRoute>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="bible" />
        <Stack.Screen name="audibleBible" />
      </Stack>
    </ProtectedRoute>
  );
} 