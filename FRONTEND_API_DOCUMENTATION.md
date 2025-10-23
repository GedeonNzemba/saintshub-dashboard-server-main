# 📱 SaintsHub API Documentation for React Native Frontend

**Complete API Reference for Frontend Developers**

**Server Base URL:** `http://localhost:3003`  
**API Version:** 1.0.0  
**Last Updated:** October 23, 2025

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication Flow](#authentication-flow)
3. [API Endpoints](#api-endpoints)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Email System](#email-system)
7. [React Native Integration Examples](#react-native-integration-examples)

---

## 🚀 Quick Start

### Base Configuration

```javascript
// config/api.js
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3003',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json'
  }
};

// For production
// BASE_URL: 'https://api.saintshub.com'
```

### Authentication Header

All authenticated requests must include:

```javascript
headers: {
  'Authorization': `Bearer ${userToken}`,
  'Content-Type': 'application/json'
}
```

---

## 🔐 Authentication Flow

### Complete User Journey

```
┌─────────────┐
│   Sign Up   │ → Welcome Email + Admin Request Email (if Pastor/IT)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Sign In   │ → Receive JWT Token
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Use App     │ → Token in Authorization Header
│ (Auth Req)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Sign Out   │ → Token Blacklisted
└─────────────┘
```

---

## 📡 API Endpoints

### 1️⃣ User Registration (Sign Up)

**Endpoint:** `POST /api/signup`  
**Rate Limit:** 5 requests per 15 minutes  
**Authentication:** Not required

#### Request Body

```javascript
{
  "name": "John",                    // Required: string
  "surname": "Doe",                  // Required: string
  "email": "john@example.com",       // Required: valid email
  "password": "SecurePass123!",      // Required: min 8 chars
  "confirmPassword": "SecurePass123!", // Required: must match password
  "avatar": "https://url-to-avatar.jpg", // Required: valid URL
  "language": "en",                  // Required: "en" or "fr"
  "role": "user",                    // Required: "user", "pastor", or "it"
  "selectedChurchId": "",            // Optional: MongoDB ObjectId of existing church
  "otherChurchName": "My Church"     // Optional: Name if creating new church
}
```

#### Success Response (201 Created)

```javascript
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John",
    "surname": "Doe",
    "email": "john@example.com",
    "avatar": {
      "public_id": "4c9df4c7-13d9-46ce-801b-02b1868cd32c",
      "url": "https://url-to-avatar.jpg"
    },
    "language": "en",
    "admin": false,
    "isAdminCandidate": false  // true if role is "pastor" or "it"
  }
}
```

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **400** | `{ "message": "Please fill in all required fields." }` | Missing required fields |
| **400** | `{ "message": "Invalid language selected." }` | Language not "en" or "fr" |
| **400** | `{ "message": "Invalid role selected." }` | Role not "user", "pastor", or "it" |
| **400** | `{ "message": "Passwords do not match." }` | password ≠ confirmPassword |
| **409** | `{ "message": "User already exists." }` | Email already registered |
| **429** | `{ "message": "Too many requests, please try again later." }` | Rate limit exceeded |
| **500** | `{ "message": "An unexpected error occurred during signup." }` | Server error |

#### Email Notifications

- ✅ **All users:** Welcome email sent to user's email
- ✅ **Pastor/IT roles:** Admin request pending email also sent

#### Frontend Implementation

```javascript
// services/auth.js
export const signUp = async (userData) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/signup`, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific errors
      switch (response.status) {
        case 400:
          throw new Error(data.message || 'Invalid input');
        case 409:
          throw new Error('This email is already registered');
        case 429:
          throw new Error('Too many attempts. Please try again later.');
        default:
          throw new Error('Registration failed');
      }
    }

    // Save token to AsyncStorage
    await AsyncStorage.setItem('userToken', data.token);
    await AsyncStorage.setItem('userData', JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};
```

---

### 2️⃣ User Login (Sign In)

**Endpoint:** `POST /api/signin`  
**Rate Limit:** 5 requests per 15 minutes  
**Authentication:** Not required

#### Request Body

```javascript
{
  "email": "john@example.com",    // Required: registered email
  "password": "SecurePass123!"    // Required: user's password
}
```

#### Success Response (200 OK)

```javascript
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John",
    "surname": "Doe",
    "email": "john@example.com",
    "avatar": {
      "public_id": "4c9df4c7-13d9-46ce-801b-02b1868cd32c",
      "url": "https://url-to-avatar.jpg"
    },
    "language": "en",
    "admin": false,
    "isAdminCandidate": false,
    "churchSelection": "My Church Name",  // If provided during signup
    "role": "user",
    "createdAt": "2025-10-23T10:30:00.000Z",
    "updatedAt": "2025-10-23T10:30:00.000Z"
  }
}
```

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **400** | `{ "message": "Please fill in all fields." }` | Missing email or password |
| **401** | `{ "message": "Invalid Email credentials." }` | Email not found |
| **401** | `{ "message": "Invalid Password credentials." }` | Wrong password |
| **429** | `{ "message": "Too many requests, please try again later." }` | Rate limit exceeded (5 attempts) |
| **500** | `{ "message": "Server error." }` | Server error |

#### Frontend Implementation

```javascript
// services/auth.js
export const signIn = async (email, password) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/signin`, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific errors for better UX
      if (response.status === 401) {
        if (data.message.includes('Email')) {
          throw new Error('No account found with this email');
        } else {
          throw new Error('Incorrect password');
        }
      }
      throw new Error(data.message || 'Login failed');
    }

    // Save token and user data
    await AsyncStorage.setItem('userToken', data.token);
    await AsyncStorage.setItem('userData', JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};
```

---

### 3️⃣ Get Current User

**Endpoint:** `GET /api/user`  
**Authentication:** Required  
**Rate Limit:** 100 requests per 15 minutes

#### Request Headers

```javascript
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

#### Success Response (200 OK)

```javascript
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John",
  "surname": "Doe",
  "email": "john@example.com",
  "avatar": {
    "public_id": "4c9df4c7-13d9-46ce-801b-02b1868cd32c",
    "url": "https://url-to-avatar.jpg"
  },
  "language": "en",
  "admin": false,
  "isAdminCandidate": false,
  "churchSelection": "My Church Name",
  "role": "user",
  "churches": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "First Baptist Church",
      "location": "New York, NY",
      "logo": "https://cloudinary.com/church-logo.jpg",
      "createdAt": "2025-10-20T10:30:00.000Z"
    }
  ],
  "_meta": {
    "churchSelectionInfo": "This is the church the user indicated during signup (for admin verification)"
  },
  "createdAt": "2025-10-23T10:30:00.000Z",
  "updatedAt": "2025-10-23T10:30:00.000Z"
}
```

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **401** | `{ "message": "Unauthorized - Invalid or expired token" }` | Token missing, invalid, or expired |
| **401** | `{ "message": "Token has been revoked" }` | User logged out (token blacklisted) |
| **404** | `{ "message": "User not found." }` | User deleted or doesn't exist |
| **500** | `{ "message": "Server error while retrieving user information." }` | Server error |

#### Frontend Implementation

```javascript
// services/user.js
export const getCurrentUser = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid - redirect to login
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(data.message || 'Failed to fetch user');
    }

    // Update stored user data
    await AsyncStorage.setItem('userData', JSON.stringify(data));

    return data;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};
```

---

### 4️⃣ Update User Profile

**Endpoint:** `PUT /api/user/update-user`  
**Authentication:** Required  
**Rate Limit:** 100 requests per 15 minutes

#### Request Headers

```javascript
{
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "application/json"
}
```

#### Request Body

```javascript
{
  "name": "John",           // Optional
  "surname": "Smith",       // Optional
  "email": "newemail@example.com", // Optional
  "language": "fr"          // Optional: "en" or "fr"
}
```

**Note:** Only include fields you want to update. Omitted fields remain unchanged.

#### Success Response (200 OK)

```javascript
{
  "message": "User updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John",
    "surname": "Smith",
    "email": "newemail@example.com",
    "avatar": {
      "public_id": "4c9df4c7-13d9-46ce-801b-02b1868cd32c",
      "url": "https://url-to-avatar.jpg"
    },
    "language": "fr",
    "admin": false,
    "updatedAt": "2025-10-23T12:00:00.000Z"
  }
}
```

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **400** | `{ "message": "Email already in use by another account" }` | Email conflict |
| **400** | `{ "message": "Invalid language. Must be 'en' or 'fr'" }` | Invalid language |
| **401** | `{ "message": "Unauthorized" }` | Token missing or invalid |
| **404** | `{ "message": "User not found" }` | User doesn't exist |
| **500** | `{ "message": "Failed to update user" }` | Server error |

#### Frontend Implementation

```javascript
// services/user.js
export const updateProfile = async (updates) => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/update-user`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    // Update stored user data
    await AsyncStorage.setItem('userData', JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};
```

---

### 5️⃣ Update Avatar

**Endpoint:** `PUT /api/user/update-avatar`  
**Authentication:** Required  
**Rate Limit:** 100 requests per 15 minutes

#### Request Headers

```javascript
{
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "application/json"
}
```

#### Request Body

```javascript
{
  "avatar": "https://new-avatar-url.jpg"  // Required: valid image URL
}
```

#### Success Response (200 OK)

```javascript
{
  "message": "Avatar updated successfully",
  "avatar": {
    "public_id": "new-uuid-12345",
    "url": "https://new-avatar-url.jpg"
  }
}
```

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **400** | `{ "message": "Avatar URL is required" }` | Missing avatar in request |
| **401** | `{ "message": "Unauthorized" }` | Token missing or invalid |
| **404** | `{ "message": "User not found" }` | User doesn't exist |
| **500** | `{ "message": "Failed to update avatar" }` | Server error |

---

### 6️⃣ Update Password

**Endpoint:** `PUT /api/user/update-password`  
**Authentication:** Required  
**Rate Limit:** 100 requests per 15 minutes

#### Request Headers

```javascript
{
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "application/json"
}
```

#### Request Body

```javascript
{
  "currentPassword": "OldPass123!",  // Required: current password
  "password": "NewSecurePass456!",   // Required: new password (min 8 chars)
  "confirmPassword": "NewSecurePass456!" // Required: must match new password
}
```

#### Success Response (200 OK)

```javascript
{
  "message": "Password updated successfully"
}
```

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **400** | `{ "message": "All fields are required" }` | Missing fields |
| **400** | `{ "message": "New passwords do not match" }` | password ≠ confirmPassword |
| **400** | `{ "message": "New password must be at least 8 characters" }` | Password too short |
| **401** | `{ "message": "Unauthorized" }` | Token missing or invalid |
| **401** | `{ "message": "Current password is incorrect" }` | Wrong current password |
| **404** | `{ "message": "User not found" }` | User doesn't exist |
| **500** | `{ "message": "Failed to update password" }` | Server error |

#### Frontend Implementation

```javascript
// services/user.js
export const updatePassword = async (currentPassword, newPassword, confirmPassword) => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/update-password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword,
        password: newPassword,
        confirmPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Provide user-friendly error messages
      if (response.status === 401 && data.message.includes('Current password')) {
        throw new Error('Your current password is incorrect');
      }
      throw new Error(data.message || 'Failed to update password');
    }

    return data;
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
};
```

---

### 7️⃣ Delete Account

**Endpoint:** `DELETE /api/user/delete-account`  
**Authentication:** Required  
**Rate Limit:** 100 requests per 15 minutes

#### Request Headers

```javascript
{
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "application/json"
}
```

#### Request Body

```javascript
{
  "password": "UserPassword123!"  // Required: password confirmation
}
```

#### Success Response (200 OK)

```javascript
{
  "message": "Account deleted successfully"
}
```

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **400** | `{ "message": "Password is required to delete account" }` | Missing password |
| **401** | `{ "message": "Unauthorized" }` | Token missing or invalid |
| **401** | `{ "message": "Invalid password" }` | Wrong password |
| **404** | `{ "message": "User not found" }` | User doesn't exist |
| **500** | `{ "message": "Failed to delete account" }` | Server error |

---

### 8️⃣ Logout

**Endpoint:** `POST /api/signout` or `GET /api/user/logout`  
**Authentication:** Required  
**Rate Limit:** 100 requests per 15 minutes

#### Request Headers

```javascript
{
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "application/json"
}
```

#### Success Response (200 OK)

```javascript
{
  "message": "Logout successful"
}
```

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **401** | `{ "message": "Unauthorized" }` | Token missing or invalid |
| **500** | `{ "message": "Server error during logout" }` | Server error |

#### Frontend Implementation

```javascript
// services/auth.js
export const logout = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    if (token) {
      // Call logout endpoint to blacklist token
      await fetch(`${API_CONFIG.BASE_URL}/api/signout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }

    // Clear local storage regardless of API response
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local data even if API call fails
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    return { success: true };
  }
};
```

---

### 9️⃣ Password Reset - Request

**Endpoint:** `POST /api/password/forgot-password`  
**Authentication:** Not required  
**Rate Limit:** 100 requests per 15 minutes

#### Request Body

```javascript
{
  "email": "john@example.com"  // Required: registered email
}
```

#### Success Response (200 OK)

```javascript
{
  "message": "If an account exists with this email, you will receive a password reset link shortly."
}
```

**Note:** For security, the response is the same whether email exists or not.

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **400** | `{ "error": "Email is required" }` | Missing email |
| **500** | `{ "error": "Failed to process password reset request" }` | Server error |

#### Email Sent

- ✅ Password reset email with token link (expires in 60 minutes)
- Link format: `${FRONTEND_URL}/reset-password?token=RESET_TOKEN`

#### Frontend Implementation

```javascript
// services/password.js
export const requestPasswordReset = async (email) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/password/forgot-password`, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to request password reset');
    }

    return data;
  } catch (error) {
    console.error('Password reset request error:', error);
    throw error;
  }
};
```

---

### 🔟 Password Reset - Verify Token

**Endpoint:** `GET /api/password/verify-reset-token/:token`  
**Authentication:** Not required  
**Rate Limit:** 100 requests per 15 minutes

#### URL Parameter

- `token`: The reset token from the email link

#### Example Request

```
GET /api/password/verify-reset-token/a1b2c3d4e5f6789...
```

#### Success Response (200 OK)

```javascript
{
  "valid": true,
  "message": "Token is valid"
}
```

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **400** | `{ "error": "Token is required" }` | Missing token |
| **400** | `{ "valid": false, "message": "Invalid or expired reset token" }` | Token invalid/expired |
| **500** | `{ "error": "Failed to verify reset token" }` | Server error |

---

### 1️⃣1️⃣ Password Reset - Confirm

**Endpoint:** `POST /api/password/reset-password`  
**Authentication:** Not required  
**Rate Limit:** 100 requests per 15 minutes

#### Request Body

```javascript
{
  "token": "a1b2c3d4e5f6789...",  // Required: token from email
  "newPassword": "NewSecurePass123!" // Required: min 8 chars
}
```

#### Success Response (200 OK)

```javascript
{
  "message": "Password reset successful. You can now login with your new password."
}
```

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **400** | `{ "error": "Token and new password are required" }` | Missing fields |
| **400** | `{ "error": "Password must be at least 8 characters long" }` | Password too short |
| **400** | `{ "error": "Invalid or expired reset token" }` | Token invalid/expired |
| **500** | `{ "error": "Failed to reset password" }` | Server error |

#### Frontend Implementation

```javascript
// services/password.js
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/password/reset-password`, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify({ token, newPassword })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to reset password');
    }

    return data;
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};
```

---

### 1️⃣2️⃣ Admin - Get Pending Requests

**Endpoint:** `GET /api/admin/pending-requests`  
**Authentication:** Required (Admin only)  
**Rate Limit:** 100 requests per 15 minutes

#### Request Headers

```javascript
{
  "Authorization": "Bearer ADMIN_TOKEN",
  "Content-Type": "application/json"
}
```

#### Success Response (200 OK)

```javascript
{
  "count": 2,
  "requests": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Pastor",
      "surname": "John",
      "email": "pastor@example.com",
      "role": "Pastor",
      "churchSelection": "First Baptist Church",
      "createdAt": "2025-10-23T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "IT",
      "surname": "Admin",
      "email": "it@example.com",
      "role": "IT",
      "churchSelection": "Second Church",
      "createdAt": "2025-10-22T08:15:00.000Z"
    }
  ]
}
```

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **401** | `{ "message": "Unauthorized" }` | Token missing or invalid |
| **403** | `{ "message": "Forbidden - Admin access required" }` | User is not admin |
| **500** | `{ "error": "Failed to fetch pending admin requests" }` | Server error |

---

### 1️⃣3️⃣ Admin - Approve User

**Endpoint:** `PUT /api/admin/approve/:userId`  
**Authentication:** Required (Admin only)  
**Rate Limit:** 100 requests per 15 minutes

#### Request Headers

```javascript
{
  "Authorization": "Bearer ADMIN_TOKEN",
  "Content-Type": "application/json"
}
```

#### URL Parameter

- `userId`: MongoDB ObjectId of user to approve

#### Example Request

```
PUT /api/admin/approve/507f1f77bcf86cd799439011
```

#### Success Response (200 OK)

```javascript
{
  "message": "Admin access granted successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Pastor",
    "surname": "John",
    "email": "pastor@example.com",
    "role": "Pastor",
    "admin": true
  }
}
```

#### Email Sent

- ✅ Admin approved email sent to user

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **400** | `{ "error": "User ID is required" }` | Missing userId |
| **400** | `{ "error": "User is already an admin" }` | Already approved |
| **401** | `{ "message": "Unauthorized" }` | Token missing or invalid |
| **403** | `{ "message": "Forbidden - Admin access required" }` | User is not admin |
| **404** | `{ "error": "User not found" }` | User doesn't exist |
| **500** | `{ "error": "Failed to approve admin access" }` | Server error |

---

### 1️⃣4️⃣ Admin - Revoke Admin Access

**Endpoint:** `PUT /api/admin/revoke/:userId`  
**Authentication:** Required (Admin only)  
**Rate Limit:** 100 requests per 15 minutes

#### Request Headers

```javascript
{
  "Authorization": "Bearer ADMIN_TOKEN",
  "Content-Type": "application/json"
}
```

#### URL Parameter

- `userId`: MongoDB ObjectId of user to revoke

#### Success Response (200 OK)

```javascript
{
  "message": "Admin privileges revoked successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Pastor",
    "surname": "John",
    "email": "pastor@example.com",
    "admin": false
  }
}
```

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **400** | `{ "error": "User ID is required" }` | Missing userId |
| **400** | `{ "error": "User is not an admin" }` | Already not admin |
| **401** | `{ "message": "Unauthorized" }` | Token missing or invalid |
| **403** | `{ "message": "Forbidden - Admin access required" }` | User is not admin |
| **404** | `{ "error": "User not found" }` | User doesn't exist |
| **500** | `{ "error": "Failed to revoke admin privileges" }` | Server error |

---

### 1️⃣5️⃣ Admin - Get All Admins

**Endpoint:** `GET /api/admin/all-admins`  
**Authentication:** Required (Admin only)  
**Rate Limit:** 100 requests per 15 minutes

#### Request Headers

```javascript
{
  "Authorization": "Bearer ADMIN_TOKEN",
  "Content-Type": "application/json"
}
```

#### Success Response (200 OK)

```javascript
{
  "count": 3,
  "admins": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Super",
      "surname": "Admin",
      "email": "admin@saintshub.com",
      "role": "Admin",
      "admin": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Pastor",
      "surname": "John",
      "email": "pastor@example.com",
      "role": "Pastor",
      "admin": true,
      "createdAt": "2025-10-20T10:30:00.000Z"
    }
  ]
}
```

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **401** | `{ "message": "Unauthorized" }` | Token missing or invalid |
| **403** | `{ "message": "Forbidden - Admin access required" }` | User is not admin |
| **500** | `{ "error": "Failed to fetch admins" }` | Server error |

---

### 1️⃣6️⃣ File Upload (Local)

**Endpoint:** `POST /api/upload-file`  
**Authentication:** Not required  
**Rate Limit:** 20 uploads per 15 minutes

#### Request Headers

```javascript
{
  "Content-Type": "multipart/form-data"
}
```

#### Request Body (FormData)

```javascript
const formData = new FormData();
formData.append('file', {
  uri: fileUri,
  type: 'image/jpeg',
  name: 'photo.jpg'
});
```

#### Success Response (200 OK)

```javascript
{
  "ok": true
}
```

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **400** | `{ "error": "No file uploaded" }` | Missing file |
| **429** | `{ "message": "Too many uploads" }` | Rate limit exceeded |
| **500** | `{ "error": "Upload failed" }` | Server error |

---

### 1️⃣7️⃣ File Upload (Cloudinary)

**Endpoint:** `POST /api/upload-file-to-cloud`  
**Authentication:** Not required  
**Rate Limit:** 20 uploads per 15 minutes

#### Request Headers

```javascript
{
  "Content-Type": "multipart/form-data"
}
```

#### Request Body (FormData)

```javascript
const formData = new FormData();
formData.append('file', {
  uri: fileUri,
  type: 'image/jpeg',
  name: 'photo.jpg'
});
```

#### Success Response (200 OK)

```javascript
{
  "url": "https://res.cloudinary.com/ddbiofmni/image/upload/v1729685432/file_abc123.jpg",
  "public_id": "file_abc123",
  "secure_url": "https://res.cloudinary.com/ddbiofmni/image/upload/v1729685432/file_abc123.jpg",
  "format": "jpg",
  "width": 1920,
  "height": 1080,
  "resource_type": "image"
}
```

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **400** | `{ "error": "No file uploaded" }` | Missing file |
| **429** | `{ "message": "Too many uploads" }` | Rate limit exceeded |
| **500** | `{ "error": "Upload failed" }` | Server or Cloudinary error |

#### Frontend Implementation

```javascript
// services/upload.js
import * as ImagePicker from 'expo-image-picker';

export const uploadToCloudinary = async (imageUri) => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'upload.jpg'
    });

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/upload-file-to-cloud`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.secure_url;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
```

---

### 1️⃣8️⃣ Get User Documents

**Endpoint:** `GET /api/documents`  
**Authentication:** Required  
**Rate Limit:** 100 requests per 15 minutes

#### Request Headers

```javascript
{
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "application/json"
}
```

#### Success Response (200 OK)

```javascript
{
  "documents": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "filename": "document.pdf",
      "url": "https://cloudinary.com/document.pdf",
      "uploadedAt": "2025-10-23T10:30:00.000Z",
      "fileType": "application/pdf",
      "size": 1048576
    }
  ]
}
```

#### Error Responses

| Status Code | Response | Cause |
|------------|----------|-------|
| **401** | `{ "message": "Unauthorized" }` | Token missing or invalid |
| **500** | `{ "error": "Failed to fetch documents" }` | Server error |

---

## ⚠️ Error Handling

### Global Error Structure

All API errors follow this structure:

```javascript
{
  "message": "Error description",  // User-friendly message
  "error": "Technical error",      // Technical details (sometimes)
  "code": "ERROR_CODE"             // Error code (sometimes)
}
```

### Common HTTP Status Codes

| Code | Meaning | When to Show |
|------|---------|-------------|
| **200** | Success | ✅ Operation completed |
| **201** | Created | ✅ Resource created (signup) |
| **400** | Bad Request | ⚠️ Invalid input - show error to user |
| **401** | Unauthorized | 🔒 Redirect to login |
| **403** | Forbidden | 🚫 Show "Access denied" |
| **404** | Not Found | ❓ Resource doesn't exist |
| **409** | Conflict | ⚠️ Duplicate data (email exists) |
| **429** | Too Many Requests | ⏱️ Rate limit - ask user to wait |
| **500** | Server Error | ❌ Show "Something went wrong" |

### Recommended Error Handling Pattern

```javascript
// utils/errorHandler.js
export const handleApiError = (error, response) => {
  // Network error
  if (!response) {
    return {
      title: 'Network Error',
      message: 'Please check your internet connection',
      action: 'retry'
    };
  }

  // Handle by status code
  switch (response.status) {
    case 400:
      return {
        title: 'Invalid Input',
        message: error.message || 'Please check your input',
        action: 'fix'
      };
    
    case 401:
      return {
        title: 'Session Expired',
        message: 'Please login again',
        action: 'logout'
      };
    
    case 403:
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission for this action',
        action: 'dismiss'
      };
    
    case 404:
      return {
        title: 'Not Found',
        message: 'The requested resource was not found',
        action: 'dismiss'
      };
    
    case 409:
      return {
        title: 'Already Exists',
        message: error.message || 'This resource already exists',
        action: 'fix'
      };
    
    case 429:
      return {
        title: 'Too Many Attempts',
        message: 'Please wait a few minutes and try again',
        action: 'wait'
      };
    
    case 500:
    default:
      return {
        title: 'Server Error',
        message: 'Something went wrong. Please try again later.',
        action: 'retry'
      };
  }
};
```

### Example Usage in Component

```javascript
// screens/SignUpScreen.js
import { handleApiError } from '../utils/errorHandler';

const handleSignUp = async () => {
  try {
    setLoading(true);
    const result = await signUp(formData);
    
    // Success
    Alert.alert('Success', 'Account created! Check your email.');
    navigation.navigate('Home');
    
  } catch (error) {
    const errorInfo = handleApiError(error, error.response);
    
    Alert.alert(errorInfo.title, errorInfo.message, [
      {
        text: 'OK',
        onPress: () => {
          if (errorInfo.action === 'logout') {
            navigation.navigate('Login');
          }
        }
      }
    ]);
  } finally {
    setLoading(false);
  }
};
```

---

## 🚦 Rate Limiting

### Rate Limit Rules

| Route Pattern | Limit | Window |
|--------------|-------|--------|
| **All `/api/*`** | 100 requests | 15 minutes |
| **Auth routes** (`/api/signup`, `/api/signin`) | 5 requests | 15 minutes |
| **Upload routes** (`/api/upload-*`) | 20 requests | 15 minutes |

### Rate Limit Headers

All responses include these headers:

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1729685432000
```

### Handling Rate Limits

```javascript
// utils/rateLimitHandler.js
export const checkRateLimit = (response) => {
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
  const resetTime = parseInt(response.headers.get('X-RateLimit-Reset') || '0');
  
  if (remaining <= 1) {
    const resetDate = new Date(resetTime);
    const minutesUntilReset = Math.ceil((resetDate - new Date()) / 60000);
    
    return {
      warning: true,
      message: `Rate limit almost reached. Resets in ${minutesUntilReset} minutes.`
    };
  }
  
  return { warning: false };
};
```

---

## 📧 Email System

### Automatic Email Triggers

| Event | Email Type | Sender | Template |
|-------|-----------|--------|----------|
| User signup (any role) | Welcome | SaintsHub | Modern responsive HTML |
| User signup (Pastor/IT) | Admin Request Pending | SaintsHub Admin | Modern responsive HTML |
| Password reset request | Password Reset | SaintsHub | Reset link with token |
| Admin approval | Admin Approved | SaintsHub Admin | Congratulations email |

### Email Configuration

All emails are sent from: **saintshub@gedeonchrist.com**

Display names vary:
- "SaintsHub" - Welcome, Password Reset
- "SaintsHub Admin" - Admin-related emails

### Email Template Features

✅ Responsive design (mobile-friendly)  
✅ Beautiful gradients and modern styling  
✅ SaintsHub logo integration  
✅ Call-to-action buttons  
✅ Professional Inter font  
✅ Security warnings where appropriate

### Password Reset Email Flow

```
User → Request Reset → API validates email
                     ↓
               Generates token (crypto)
                     ↓
               Hashes & stores token
                     ↓
          Sends email with reset link
                     ↓
User clicks link → Frontend shows reset form
                     ↓
          User enters new password
                     ↓
          API validates token & updates password
```

**Token Expiry:** 60 minutes (1 hour)

---

## 📱 React Native Integration Examples

### 1. Complete Auth Context

```javascript
// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/auth';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData) => {
    try {
      const response = await authService.signUp(userData);
      setToken(response.token);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const response = await authService.signIn(email, password);
      setToken(response.token);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.logout();
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local data anyway
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = async (updates) => {
    try {
      const response = await authService.updateProfile(updates);
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
        signUp,
        signIn,
        signOut,
        updateUser,
        isAuthenticated: !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### 2. API Service Layer

```javascript
// services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_CONFIG = {
  BASE_URL: 'http://localhost:3003',
  TIMEOUT: 30000
};

class ApiService {
  async request(endpoint, options = {}) {
    const token = await AsyncStorage.getItem('userToken');
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      }
    };

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || data.error || 'Request failed');
        error.response = response;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  delete(endpoint, body) {
    return this.request(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined
    });
  }
}

export default new ApiService();
```

### 3. Sign Up Screen Example

```javascript
// screens/SignUpScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';

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
    otherChurchName: ''
  });

  const handleSignUp = async () => {
    // Validation
    if (!formData.name || !formData.surname || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      await signUp(formData);
      
      Alert.alert(
        'Success!',
        'Account created successfully. Check your email for a welcome message.',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
    } catch (error) {
      Alert.alert(
        'Sign Up Failed',
        error.message || 'An error occurred during sign up'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Create Account
      </Text>

      <TextInput
        placeholder="First Name"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        style={styles.input}
      />

      <TextInput
        placeholder="Last Name"
        value={formData.surname}
        onChangeText={(text) => setFormData({ ...formData, surname: text })}
        style={styles.input}
      />

      <TextInput
        placeholder="Email"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
        secureTextEntry
        style={styles.input}
      />

      <TextInput
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
        secureTextEntry
        style={styles.input}
      />

      <Text style={{ marginTop: 10, marginBottom: 5 }}>Role:</Text>
      <Picker
        selectedValue={formData.role}
        onValueChange={(value) => setFormData({ ...formData, role: value })}
        style={styles.picker}
      >
        <Picker.Item label="User" value="user" />
        <Picker.Item label="Pastor" value="pastor" />
        <Picker.Item label="IT Administrator" value="it" />
      </Picker>

      <Text style={{ marginTop: 10, marginBottom: 5 }}>Language:</Text>
      <Picker
        selectedValue={formData.language}
        onValueChange={(value) => setFormData({ ...formData, language: value })}
        style={styles.picker}
      >
        <Picker.Item label="English" value="en" />
        <Picker.Item label="Français" value="fr" />
      </Picker>

      <TouchableOpacity
        onPress={handleSignUp}
        disabled={loading}
        style={[styles.button, loading && styles.buttonDisabled]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
        <Text style={{ textAlign: 'center', marginTop: 20, color: '#6366f1' }}>
          Already have an account? Sign In
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    marginTop: 20
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af'
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600'
  }
};
```

### 4. Password Reset Flow

```javascript
// screens/ForgotPasswordScreen.js
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import api from '../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/password/forgot-password', { email });
      
      Alert.alert(
        'Check Your Email',
        'If an account exists with this email, you will receive a password reset link shortly.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Reset Password
      </Text>
      
      <Text style={{ marginBottom: 10, color: '#666' }}>
        Enter your email address and we'll send you a link to reset your password.
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 12,
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 16
        }}
      />

      <TouchableOpacity
        onPress={handleResetRequest}
        disabled={loading}
        style={{
          backgroundColor: '#6366f1',
          padding: 16,
          borderRadius: 8
        }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' }}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 🔒 Security Best Practices

### For Frontend Developers

1. **Never Store Sensitive Data**
   ```javascript
   // ❌ DON'T
   await AsyncStorage.setItem('password', userPassword);
   
   // ✅ DO
   await AsyncStorage.setItem('userToken', token);
   ```

2. **Always Use HTTPS in Production**
   ```javascript
   const API_URL = __DEV__ 
     ? 'http://localhost:3003'
     : 'https://api.saintshub.com';
   ```

3. **Handle Token Expiration**
   ```javascript
   if (error.response?.status === 401) {
     // Clear auth data and redirect to login
     await AsyncStorage.removeItem('userToken');
     navigation.navigate('Login');
   }
   ```

4. **Validate Input Before Sending**
   ```javascript
   const validateEmail = (email) => {
     const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     return regex.test(email);
   };
   ```

5. **Show User-Friendly Errors**
   ```javascript
   // ❌ DON'T show technical errors
   Alert.alert('Error', 'TypeError: Cannot read property...');
   
   // ✅ DO show user-friendly messages
   Alert.alert('Oops!', 'Something went wrong. Please try again.');
   ```

---

## 📊 Testing Checklist

### Authentication Flow
- [ ] Sign up with valid data → Success
- [ ] Sign up with existing email → Error 409
- [ ] Sign up with mismatched passwords → Error 400
- [ ] Sign up with invalid email → Error 400
- [ ] Sign in with valid credentials → Success
- [ ] Sign in with wrong password → Error 401
- [ ] Sign in with non-existent email → Error 401
- [ ] Sign out → Token invalidated

### Protected Routes
- [ ] Access protected route without token → Error 401
- [ ] Access protected route with valid token → Success
- [ ] Access protected route with expired token → Error 401
- [ ] Access admin route as non-admin → Error 403

### Password Reset
- [ ] Request reset for existing email → Email sent
- [ ] Request reset for non-existent email → Same response (security)
- [ ] Verify valid token → Success
- [ ] Verify expired token → Error 400
- [ ] Reset with valid token → Success
- [ ] Reset with used token → Error 400

### Rate Limiting
- [ ] Make 6 signup requests → 6th request blocked
- [ ] Wait 15 minutes → Requests allowed again
- [ ] Check rate limit headers → Present

---

## 🎯 Quick Reference

### Common Response Codes

```javascript
200 → Success
201 → Created (signup successful)
400 → Bad Request (invalid input)
401 → Unauthorized (login required)
403 → Forbidden (not admin)
404 → Not Found
409 → Conflict (email exists)
429 → Rate Limited
500 → Server Error
```

### Required Headers

```javascript
// Authenticated requests
{
  'Authorization': 'Bearer YOUR_TOKEN',
  'Content-Type': 'application/json'
}

// File uploads
{
  'Content-Type': 'multipart/form-data'
}
```

### Token Lifespan

- **Signup token:** 1 hour
- **Signin token:** 5 hours
- **Password reset token:** 1 hour

---

## 📞 Support & Contact

**API Issues:** Create an issue in the repository  
**Email Questions:** Contact backend team  
**Documentation Updates:** Submit PR with changes

---

**Last Updated:** October 23, 2025  
**API Version:** 1.0.0  
**Maintained By:** SaintsHub Backend Team

---

## 🚀 Ready to Build!

This documentation covers 100% of the API endpoints. Use it as your reference when building the React Native app. All error codes, success messages, and response formats are documented here.

**Happy Coding! 🎉**
