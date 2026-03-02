# 🚀 React Native Integration Guide - SaintsHub API

**Step-by-step guide for implementing SaintsHub API in React Native Expo**

**Project Location:** `C:\Users\nzemb\Documents\saintshub-v3\saintshub`

---

## 📋 Table of Contents

1. [Project Setup](#project-setup)
2. [Folder Structure](#folder-structure)
3. [Dependencies](#dependencies)
4. [Configuration](#configuration)
5. [Implementation Steps](#implementation-steps)
6. [Complete Code Examples](#complete-code-examples)
7. [Testing Guide](#testing-guide)

---

## 🛠️ Project Setup

### Required Dependencies

```bash
# Core dependencies
npm install @react-native-async-storage/async-storage
npm install @react-navigation/native
npm install @react-navigation/native-stack
npm install axios

# For image picking
npm install expo-image-picker

# For form validation
npm install formik yup
```

---

## 📁 Folder Structure

```
saintshub/
├── src/
│   ├── config/
│   │   └── api.js                 # API configuration
│   ├── context/
│   │   └── AuthContext.js         # Authentication state management
│   ├── services/
│   │   ├── api.js                 # Base API service
│   │   ├── auth.js                # Authentication services
│   │   ├── user.js                # User management services
│   │   ├── password.js            # Password reset services
│   │   ├── admin.js               # Admin services
│   │   └── upload.js              # File upload services
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── SignUpScreen.js
│   │   │   ├── SignInScreen.js
│   │   │   ├── ForgotPasswordScreen.js
│   │   │   └── ResetPasswordScreen.js
│   │   ├── profile/
│   │   │   ├── ProfileScreen.js
│   │   │   ├── EditProfileScreen.js
│   │   │   └── ChangePasswordScreen.js
│   │   └── admin/
│   │       ├── AdminDashboardScreen.js
│   │       └── PendingRequestsScreen.js
│   ├── utils/
│   │   ├── errorHandler.js        # Error handling utilities
│   │   ├── validators.js          # Input validation
│   │   └── storage.js             # AsyncStorage helpers
│   └── components/
│       ├── LoadingButton.js
│       ├── ErrorMessage.js
│       └── SuccessMessage.js
└── App.js
```

---

## ⚙️ Configuration

### 1. API Configuration (`src/config/api.js`)

```javascript
import Constants from 'expo-constants';

const ENV = {
  dev: {
    apiUrl: 'http://localhost:3003',
  },
  staging: {
    apiUrl: 'https://staging-api.saintshub.com',
  },
  prod: {
    apiUrl: 'https://api.saintshub.com',
  },
};

const getEnvVars = (env = Constants.manifest.releaseChannel) => {
  // Development by default
  if (__DEV__) {
    return ENV.dev;
  } else if (env === 'staging') {
    return ENV.staging;
  } else if (env === 'prod') {
    return ENV.prod;
  }
  return ENV.dev;
};

export default getEnvVars();
```

### 2. Base API Service (`src/services/api.js`)

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../config/api';

class ApiService {
  constructor() {
    this.baseURL = ENV.apiUrl;
    this.timeout = 30000;
  }

  async getToken() {
    return await AsyncStorage.getItem('userToken');
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    
    const config = {
      timeout: this.timeout,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      // Check rate limit headers
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      if (rateLimitRemaining && parseInt(rateLimitRemaining) < 5) {
        console.warn(`⚠️ Rate limit warning: ${rateLimitRemaining} requests remaining`);
      }

      if (!response.ok) {
        const error = new Error(data.message || data.error || 'Request failed');
        error.response = response;
        error.data = data;
        error.status = response.status;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your internet connection');
      }
      
      console.error(`❌ API Error [${endpoint}]:`, error.message);
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint, body) {
    return this.request(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async uploadFile(endpoint, file) {
    const token = await this.getToken();
    
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || 'upload.jpg',
    });

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error(`❌ Upload Error [${endpoint}]:`, error.message);
      throw error;
    }
  }
}

export default new ApiService();
```

### 3. Authentication Service (`src/services/auth.js`)

```javascript
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const signUp = async (userData) => {
  try {
    const response = await api.post('/api/signup', userData);
    
    // Store token and user data
    await AsyncStorage.setItem('userToken', response.token);
    await AsyncStorage.setItem('userData', JSON.stringify(response.user));
    
    return response;
  } catch (error) {
    throw error;
  }
};

export const signIn = async (email, password) => {
  try {
    const response = await api.post('/api/signin', { email, password });
    
    // Store token and user data
    await AsyncStorage.setItem('userToken', response.token);
    await AsyncStorage.setItem('userData', JSON.stringify(response.user));
    
    return response;
  } catch (error) {
    throw error;
  }
};

export const signOut = async () => {
  try {
    // Call API to blacklist token
    await api.post('/api/signout');
  } catch (error) {
    console.error('Logout API error:', error);
    // Continue with local cleanup even if API fails
  } finally {
    // Always clear local storage
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/user');
    
    // Update stored user data
    await AsyncStorage.setItem('userData', JSON.stringify(response));
    
    return response;
  } catch (error) {
    throw error;
  }
};
```

### 4. User Service (`src/services/user.js`)

```javascript
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const updateProfile = async (updates) => {
  try {
    const response = await api.put('/api/user/update-user', updates);
    
    // Update stored user data
    await AsyncStorage.setItem('userData', JSON.stringify(response.user));
    
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateAvatar = async (avatarUrl) => {
  try {
    const response = await api.put('/api/user/update-avatar', { avatar: avatarUrl });
    
    // Update stored user data with new avatar
    const userData = JSON.parse(await AsyncStorage.getItem('userData'));
    userData.avatar = response.avatar;
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    
    return response;
  } catch (error) {
    throw error;
  }
};

export const updatePassword = async (currentPassword, newPassword, confirmPassword) => {
  try {
    const response = await api.put('/api/user/update-password', {
      currentPassword,
      password: newPassword,
      confirmPassword,
    });
    
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteAccount = async (password) => {
  try {
    const response = await api.delete('/api/user/delete-account', { password });
    
    // Clear local storage
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    
    return response;
  } catch (error) {
    throw error;
  }
};
```

### 5. Password Service (`src/services/password.js`)

```javascript
import api from './api';

export const requestPasswordReset = async (email) => {
  try {
    const response = await api.post('/api/password/forgot-password', { email });
    return response;
  } catch (error) {
    throw error;
  }
};

export const verifyResetToken = async (token) => {
  try {
    const response = await api.get(`/api/password/verify-reset-token/${token}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post('/api/password/reset-password', {
      token,
      newPassword,
    });
    return response;
  } catch (error) {
    throw error;
  }
};
```

### 6. Admin Service (`src/services/admin.js`)

```javascript
import api from './api';

export const getPendingRequests = async () => {
  try {
    const response = await api.get('/api/admin/pending-requests');
    return response;
  } catch (error) {
    throw error;
  }
};

export const getAllAdmins = async () => {
  try {
    const response = await api.get('/api/admin/all-admins');
    return response;
  } catch (error) {
    throw error;
  }
};

export const approveAdmin = async (userId) => {
  try {
    const response = await api.put(`/api/admin/approve/${userId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const revokeAdmin = async (userId) => {
  try {
    const response = await api.put(`/api/admin/revoke/${userId}`);
    return response;
  } catch (error) {
    throw error;
  }
};
```

### 7. Upload Service (`src/services/upload.js`)

```javascript
import api from './api';
import * as ImagePicker from 'expo-image-picker';

export const pickImage = async () => {
  // Request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== 'granted') {
    throw new Error('Permission to access photos was denied');
  }

  // Pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled) {
    return result.assets[0];
  }

  return null;
};

export const uploadToCloudinary = async (image) => {
  try {
    const response = await api.uploadFile('/api/upload-file-to-cloud', {
      uri: image.uri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    });
    
    return response.secure_url || response.url;
  } catch (error) {
    throw error;
  }
};
```

### 8. Error Handler (`src/utils/errorHandler.js`)

```javascript
export const handleApiError = (error) => {
  // Network error
  if (!error.response && !error.status) {
    return {
      title: 'Network Error',
      message: 'Please check your internet connection and try again.',
      action: 'retry',
    };
  }

  const status = error.status || error.response?.status;
  const message = error.message || error.data?.message || error.data?.error;

  // Handle by status code
  switch (status) {
    case 400:
      return {
        title: 'Invalid Input',
        message: message || 'Please check your input and try again.',
        action: 'fix',
      };
    
    case 401:
      return {
        title: 'Session Expired',
        message: 'Your session has expired. Please login again.',
        action: 'logout',
      };
    
    case 403:
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action.',
        action: 'dismiss',
      };
    
    case 404:
      return {
        title: 'Not Found',
        message: 'The requested resource was not found.',
        action: 'dismiss',
      };
    
    case 409:
      return {
        title: 'Already Exists',
        message: message || 'This resource already exists.',
        action: 'fix',
      };
    
    case 429:
      return {
        title: 'Too Many Attempts',
        message: 'You\'ve made too many requests. Please wait a few minutes and try again.',
        action: 'wait',
      };
    
    case 500:
    default:
      return {
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.',
        action: 'retry',
      };
  }
};
```

### 9. Validators (`src/utils/validators.js`)

```javascript
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password) => {
  // Min 8 chars, at least one uppercase, one lowercase, one number
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return {
    valid: minLength && hasUppercase && hasLowercase && hasNumber,
    errors: {
      minLength: !minLength ? 'Password must be at least 8 characters' : null,
      hasUppercase: !hasUppercase ? 'Password must contain an uppercase letter' : null,
      hasLowercase: !hasLowercase ? 'Password must contain a lowercase letter' : null,
      hasNumber: !hasNumber ? 'Password must contain a number' : null,
    },
  };
};

export const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};
```

### 10. Auth Context (`src/context/AuthContext.js`)

```javascript
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/auth';
import * as userService from '../services/user';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('userData'),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Refresh user data from server
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          // If token is invalid, clear auth
          if (error.status === 401) {
            await clearAuth();
          }
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  const clearAuth = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  };

  const signUp = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.signUp(userData);
      setToken(response.token);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const response = await authService.signIn(email, password);
      setToken(response.token);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      await clearAuth();
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local data anyway
      await clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      throw error;
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      const response = await userService.updateProfile(updates);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        initializing,
        signUp,
        signIn,
        signOut,
        refreshUser,
        updateUserProfile,
        isAuthenticated: !!token,
        isAdmin: user?.admin || false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

---

## 📱 Complete Screen Examples

### Sign Up Screen (`src/screens/auth/SignUpScreen.js`)

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../context/AuthContext';
import { handleApiError } from '../../utils/errorHandler';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
} from '../../utils/validators';

export default function SignUpScreen({ navigation }) {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    language: 'en',
    role: 'user',
    selectedChurchId: '',
    otherChurchName: '',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    const nameError = validateRequired(formData.name, 'First name');
    if (nameError) newErrors.name = nameError;

    // Surname validation
    const surnameError = validateRequired(formData.surname, 'Last name');
    if (surnameError) newErrors.surname = surnameError;

    // Email validation
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      const firstError = Object.values(passwordValidation.errors).find(err => err !== null);
      newErrors.password = firstError;
    }

    // Password match validation
    if (!validatePasswordMatch(formData.password, formData.confirmPassword)) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before continuing');
      return;
    }

    try {
      setLoading(true);
      await signUp(formData);

      Alert.alert(
        'Success! 🎉',
        'Your account has been created successfully. Check your email for a welcome message.',
        [
          {
            text: 'Get Started',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      const errorInfo = handleApiError(error);
      Alert.alert(errorInfo.title, errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join the SaintsHub community</Text>

      <View style={styles.form}>
        <TextInput
          placeholder="First Name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          style={[styles.input, errors.name && styles.inputError]}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <TextInput
          placeholder="Last Name"
          value={formData.surname}
          onChangeText={(text) => setFormData({ ...formData, surname: text })}
          style={[styles.input, errors.surname && styles.inputError]}
        />
        {errors.surname && <Text style={styles.errorText}>{errors.surname}</Text>}

        <TextInput
          placeholder="Email"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, errors.email && styles.inputError]}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <TextInput
          placeholder="Password"
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          secureTextEntry
          autoCapitalize="none"
          style={[styles.input, errors.password && styles.inputError]}
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        <TextInput
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
          secureTextEntry
          autoCapitalize="none"
          style={[styles.input, errors.confirmPassword && styles.inputError]}
        />
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

        <Text style={styles.label}>I am a:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value })}
            style={styles.picker}
          >
            <Picker.Item label="Church Member" value="user" />
            <Picker.Item label="Pastor" value="pastor" />
            <Picker.Item label="IT Administrator" value="it" />
          </Picker>
        </View>

        <Text style={styles.label}>Preferred Language:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.language}
            onValueChange={(value) => setFormData({ ...formData, language: value })}
            style={styles.picker}
          >
            <Picker.Item label="English" value="en" />
            <Picker.Item label="Français" value="fr" />
          </Picker>
        </View>

        <TouchableOpacity
          onPress={handleSignUp}
          disabled={loading}
          style={[styles.button, loading && styles.buttonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 32,
  },
  form: {
    marginBottom: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: -12,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
    color: '#6b7280',
  },
  linkBold: {
    color: '#6366f1',
    fontWeight: '600',
  },
});
```

---

## ✅ Testing Checklist

### Manual Testing Steps

1. **Sign Up Flow**
   ```
   ✓ Open sign up screen
   ✓ Fill all required fields
   ✓ Select role as "pastor"
   ✓ Submit form
   ✓ Verify success message
   ✓ Check email for welcome + admin request emails
   ✓ Verify redirect to home screen
   ```

2. **Sign In Flow**
   ```
   ✓ Open sign in screen
   ✓ Enter valid credentials
   ✓ Submit form
   ✓ Verify token stored in AsyncStorage
   ✓ Verify user data in context
   ✓ Verify redirect to home screen
   ```

3. **Error Handling**
   ```
   ✓ Test with invalid email → Show validation error
   ✓ Test with weak password → Show password requirements
   ✓ Test with mismatched passwords → Show mismatch error
   ✓ Test with existing email → Show 409 error
   ✓ Test with wrong password → Show 401 error
   ✓ Test without internet → Show network error
   ```

4. **Token Management**
   ```
   ✓ Sign in and verify token saved
   ✓ Close app and reopen → User still logged in
   ✓ Sign out and verify token removed
   ✓ Make authenticated request → Token in header
   ✓ Token expires → Redirect to login
   ```

---

## 🎯 Integration Checklist

- [ ] Install all dependencies
- [ ] Create folder structure
- [ ] Set up API configuration
- [ ] Implement base API service
- [ ] Implement auth service
- [ ] Implement user service
- [ ] Implement password service
- [ ] Implement admin service
- [ ] Implement upload service
- [ ] Create error handler
- [ ] Create validators
- [ ] Set up Auth Context
- [ ] Create sign up screen
- [ ] Create sign in screen
- [ ] Create profile screen
- [ ] Create password reset screens
- [ ] Test all flows
- [ ] Handle edge cases
- [ ] Add loading states
- [ ] Add error messages
- [ ] Test offline scenarios

---

## 📞 Support

**Backend Server:** `C:\Users\nzemb\OneDrive\Documents\Web Development\Projects\saintshub-dashboard-server-main`

**Frontend App:** `C:\Users\nzemb\Documents\saintshub-v3\saintshub`

**Full API Docs:** `FRONTEND_API_DOCUMENTATION.md`

**Quick Reference:** `API_QUICK_REFERENCE.md`

---

**Ready to integrate! Follow this guide step-by-step for a smooth implementation. 🚀**

**Last Updated:** October 23, 2025
