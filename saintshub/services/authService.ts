/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls:
 * - Sign in
 * - Sign up
 * - Sign out
 * - Get current user
 */

import api, { handleApiError, handleApiResponse } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== TYPES ====================

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface SignUpRequest {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
  avatar: string;
  language: string;
  role: 'user' | 'pastor' | 'it';
  selectedChurchId?: string;
  otherChurchName?: string;
}

export interface SignUpResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface User {
  _id: string;
  name: string;
  surname: string;
  email: string;
  avatar: {
    url: string;
  };
  role: 'user' | 'pastor' | 'it' | 'admin';
  isAdminApproved: boolean;
  language: string;
  admin: boolean; // Legacy field
}

export interface GetUserResponse {
  success: boolean;
  user: User;
}

// ==================== AUTH SERVICE ====================

export const authService = {
  /**
   * Sign In
   * POST /api/signin
   */
  async signIn(data: SignInRequest): Promise<SignInResponse> {
    try {
      const response = await api.post<SignInResponse>('/api/signin', data);
      const result = handleApiResponse(response);

      // Store token in AsyncStorage
      if (result.token) {
        await AsyncStorage.setItem('token', result.token);
        console.info('✅ Token stored successfully');
      }

      // Store user in AsyncStorage
      if (result.user) {
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        console.info('✅ User data stored successfully');
      }

      return result;
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return handleApiError(error);
    }
  },

  /**
   * Sign Up
   * POST /api/signup
   */
  async signUp(data: SignUpRequest): Promise<SignUpResponse> {
    try {
      const response = await api.post<SignUpResponse>('/api/signup', data);
      const result = handleApiResponse(response);

      // Store token in AsyncStorage
      if (result.token) {
        await AsyncStorage.setItem('token', result.token);
        console.info('✅ Token stored successfully');
      }

      // Store user in AsyncStorage
      if (result.user) {
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        console.info('✅ User data stored successfully');
      }

      return result;
    } catch (error) {
      console.error('❌ Sign up error:', error);
      return handleApiError(error);
    }
  },

  /**
   * Sign Out
   * POST /api/signout
   */
  async signOut(): Promise<void> {
    try {
      // Call backend signout endpoint
      await api.post('/api/signout');

      // Clear local storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      console.info('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      
      // Even if API call fails, clear local storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Don't throw error on signout
    }
  },

  /**
   * Get Current User
   * GET /api/user
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<GetUserResponse>('/api/user');
      const result = handleApiResponse(response);

      // Update stored user data
      if (result.user) {
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
      }

      return result.user;
    } catch (error) {
      console.error('❌ Get current user error:', error);
      return handleApiError(error);
    }
  },

  /**
   * Check if token exists and is valid
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('token');
      return !!token;
    } catch (error) {
      console.error('❌ Auth check error:', error);
      return false;
    }
  },

  /**
   * Get stored token
   */
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('❌ Get token error:', error);
      return null;
    }
  },

  /**
   * Get stored user
   */
  async getStoredUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('❌ Get stored user error:', error);
      return null;
    }
  },
};

export default authService;
