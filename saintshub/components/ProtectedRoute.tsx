import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuthStatus } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await checkAuthStatus();
      if (!isValid) {
        router.replace('/login');
      }
    };

    checkAuth();
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}