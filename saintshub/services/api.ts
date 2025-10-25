/**
 * API Service - Centralized Axios Instance
 * 
 * This service provides a configured axios instance for all API calls
 * with automatic token injection and error handling.
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { URI_domain } from '../utilities/tools';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: URI_domain,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Request Interceptor
 * Automatically adds Authorization token to all requests
 */
api.interceptors.request.use(
  async (config: AxiosRequestConfig | any) => {
    try {
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      
      if (token && config.headers) {
        // Add token to Authorization header
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log request in development
      if (__DEV__) {
        console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        if (config.data) {
          console.log('📦 Request Data:', config.data);
        }
      }

      return config;
    } catch (error) {
      console.error('❌ Error in request interceptor:', error);
      return config;
    }
  },
  (error: AxiosError) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles responses and errors globally
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (__DEV__) {
      console.log(`📥 API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
      console.log('✅ Status:', response.status);
    }

    return response;
  },
  async (error: AxiosError) => {
    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      const data: any = error.response.data;

      // Log error in development
      if (__DEV__) {
        console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
        console.error('Status:', status);
        console.error('Data:', data);
      }

      // Handle 401 Unauthorized - Token expired or invalid
      if (status === 401) {
        console.warn('🔒 Unauthorized - Token expired or invalid');
        
        // Clear auth data
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');

        // Note: Navigation will be handled by AuthContext
        // You can emit an event here if needed
      }

      // Handle 403 Forbidden - Insufficient permissions
      if (status === 403) {
        console.warn('🚫 Forbidden - Insufficient permissions');
      }

      // Handle 429 Too Many Requests - Rate limit exceeded
      if (status === 429) {
        console.warn('⏸️ Rate limit exceeded - Please wait before retrying');
        const retryAfter = error.response.headers['x-ratelimit-reset'];
        if (retryAfter) {
          const waitTime = parseInt(retryAfter) - Math.floor(Date.now() / 1000);
          console.warn(`⏳ Retry after ${waitTime} seconds`);
        }
      }

      // Handle 500 Internal Server Error
      if (status === 500) {
        console.error('💥 Server error - Please try again later');
      }

      // Return structured error
      return Promise.reject({
        status,
        message: data?.message || 'An error occurred',
        error: data?.error || error.message,
      });
    }

    // Handle network errors (no response from server)
    if (error.request) {
      console.error('🌐 Network error - No response from server');
      return Promise.reject({
        status: 0,
        message: 'Network error - Please check your internet connection',
        error: 'No response from server',
      });
    }

    // Handle other errors
    console.error('⚠️ Unexpected error:', error.message);
    return Promise.reject({
      status: -1,
      message: error.message || 'An unexpected error occurred',
      error: error.message,
    });
  }
);

/**
 * Helper function to handle API responses
 */
export const handleApiResponse = <T>(response: AxiosResponse<T>): T => {
  return response.data;
};

/**
 * Helper function to handle API errors
 */
export const handleApiError = (error: any): never => {
  // Extract error message
  const message = error?.message || error?.error || 'An error occurred';
  
  // Throw formatted error
  throw new Error(message);
};

export default api;
