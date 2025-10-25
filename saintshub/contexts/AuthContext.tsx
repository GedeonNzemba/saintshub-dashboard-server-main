import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decodedToken } from '@/tools/users/decodeToken';
import { router } from 'expo-router';
import { Token, URI_domain } from '@/utilities/tools';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const storedToken = await AsyncStorage.getItem('token');
      
      if (!storedToken) {
        setIsAuthenticated(false);
        setToken(null);
        return false;
      }

      const decoded = await decodedToken(storedToken) as Token;
      const currentTimestamp = Math.floor(Date.now() / 1000);

      if (!decoded.exp || currentTimestamp > decoded.exp) {
        await logout();
        return false;
      }

      //console.log("STORED TOKEN: ", storedToken)

      setToken(storedToken);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Auth status check failed:', error);
      await logout();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call backend signout endpoint
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          await fetch(`${URI_domain}/api/signout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (apiError) {
          console.error('Backend logout failed:', apiError);
          // Continue with local cleanup even if API call fails
        }
      }

      // Clear local storage
      await AsyncStorage.removeItem('token');
      setToken(null);
      setIsAuthenticated(false);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force cleanup even on error
      await AsyncStorage.removeItem('token');
      setToken(null);
      setIsAuthenticated(false);
      router.replace('/(auth)/login');
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, logout, checkAuthStatus, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 