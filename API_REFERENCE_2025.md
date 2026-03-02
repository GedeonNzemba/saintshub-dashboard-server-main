# 🚀 SaintsHub API Reference - 2025 Edition

**Complete Backend API Documentation**

**Server Base URL:** `http://localhost:3003`  
**API Version:** 2.0.0  
**Last Updated:** October 29, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Church Management API](#church-management-api)
4. [User Management API](#user-management-api)
5. [File Upload API](#file-upload-api)
6. [Admin Management API](#admin-management-api)
7. [Error Codes](#error-codes)
8. [Frontend Integration Guide](#frontend-integration-guide)

---

## 🌟 Overview

### Tech Stack
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Cache:** Redis (5-minute TTL)
- **File Storage:** Cloudinary
- **Authentication:** JWT (Bearer Token)
- **Rate Limiting:** 100 requests/15min per IP
- **Email:** Nodemailer with custom templates

### Key Features
✅ JWT-based authentication with token blacklisting  
✅ Role-based access control (User, Admin)  
✅ Redis caching for frequently accessed data  
✅ Image uploads to Cloudinary  
✅ Email notifications (welcome, password reset)  
✅ Rate limiting for security  
✅ Comprehensive error handling  
✅ Health check endpoint for monitoring  

---

## 🔐 Authentication

### Headers Required

All authenticated endpoints require:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Token Management

**Token Storage:** Store in secure storage (AsyncStorage/SecureStore)  
**Token Expiration:** 7 days  
**Refresh Strategy:** Re-login when expired  

---

## 🏛️ Church Management API

Base Path: `/api/dashboard`

### 1. Create Church

**POST** `/api/dashboard/create-church`

**Authentication:** Required (Admin only)

**Description:** Creates a new church profile. User information is automatically populated from the authenticated session.

**Request Body:**
```json
{
  "name": "Grace Community Church",
  "location": "123 Main St, New York, NY 10001",
  "principal": {
    "pastor": "John Smith",
    "wife": "Jane Smith",
    "image": "https://res.cloudinary.com/...",
    "description": "<p>Rich text description...</p>"
  },
  "logo": "https://res.cloudinary.com/...",
  "image": "https://res.cloudinary.com/...",
  "banner": ["https://res.cloudinary.com/...", "..."],
  "gallery": ["https://res.cloudinary.com/...", "..."],
  "securities": {
    "deacons": [
      {
        "names": "Robert Johnson",
        "descriptions": "<p>Bio...</p>",
        "image": "https://res.cloudinary.com/..."
      }
    ],
    "trustees": [
      {
        "names": "Michael Brown",
        "descriptions": "<p>Bio...</p>",
        "image": "https://res.cloudinary.com/..."
      }
    ]
  },
  "liveServices": [
    {
      "title": "Sunday Worship",
      "preacher": "Pastor John Smith",
      "sermon": "https://youtube.com/..."
    }
  ],
  "oldServices": [
    {
      "title": "Easter Service 2024",
      "preacher": "Pastor John Smith",
      "sermon": "https://youtube.com/..."
    }
  ],
  "songs": [
    {
      "title": "Amazing Grace",
      "url": "https://youtube.com/..."
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "message": "Church created successfully!",
  "church": {
    "_id": "507f191e810c19729de860ea",
    "name": "Grace Community Church",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John",
      "email": "john@example.com",
      "image": "https://..."
    },
    "createdAt": "2025-10-29T10:00:00.000Z",
    ...
  }
}
```

**Errors:**
- `400` - Missing required fields (name, principal, location)
- `401` - Not authenticated
- `403` - Not authorized (non-admin)
- `404` - User not found

---

### 2. Get All Churches (Protected)

**GET** `/api/dashboard/churches`

**Authentication:** Required

**Caching:** 5 minutes (300 seconds)

**Description:** Retrieves all churches created by all users.

**Response (200 OK):**
```json
[
  {
    "_id": "507f191e810c19729de860ea",
    "name": "Grace Community Church",
    "location": "123 Main St, New York, NY",
    "logo": "https://res.cloudinary.com/...",
    "principal": {
      "pastor": "John Smith",
      "wife": "Jane Smith",
      "image": "https://...",
      "description": "..."
    },
    "banner": ["..."],
    "gallery": ["..."],
    "securities": {...},
    "liveServices": [...],
    "oldServices": [...],
    "songs": [...],
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John",
      "email": "john@example.com"
    },
    "createdAt": "2025-10-29T10:00:00.000Z",
    "__v": 0
  }
]
```

---

### 3. Get Public Churches List

**GET** `/api/dashboard/public/churches`

**Authentication:** Not required

**Description:** Returns minimal church data for public access (signup/church selection).

**Response (200 OK):**
```json
[
  {
    "_id": "507f191e810c19729de860ea",
    "name": "Grace Community Church"
  },
  {
    "_id": "507f191e810c19729de860eb",
    "name": "Faith Baptist Church"
  }
]
```

---

### 4. Get Single Church

**GET** `/api/dashboard/church/:id`

**Authentication:** Required

**Parameters:**
- `id` - Church MongoDB ObjectId

**Response (200 OK):**
```json
{
  "_id": "507f191e810c19729de860ea",
  "name": "Grace Community Church",
  "location": "123 Main St, New York, NY",
  "logo": "https://res.cloudinary.com/...",
  "image": "https://res.cloudinary.com/...",
  "principal": {
    "pastor": "John Smith",
    "wife": "Jane Smith",
    "image": "https://...",
    "description": "<p>Leadership description...</p>"
  },
  "banner": ["https://res.cloudinary.com/..."],
  "gallery": ["https://res.cloudinary.com/..."],
  "securities": {
    "deacons": [
      {
        "names": "Robert Johnson",
        "descriptions": "<p>Deacon bio...</p>",
        "image": "https://res.cloudinary.com/..."
      }
    ],
    "trustees": [...]
  },
  "liveServices": [
    {
      "title": "Sunday Worship",
      "preacher": "Pastor John Smith",
      "sermon": "https://youtube.com/..."
    }
  ],
  "oldServices": [...],
  "songs": [
    {
      "title": "Amazing Grace",
      "url": "https://youtube.com/..."
    }
  ],
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John",
    "email": "john@example.com",
    "image": "https://..."
  },
  "createdAt": "2025-10-29T10:00:00.000Z",
  "__v": 0
}
```

**Errors:**
- `404` - Church not found
- `401` - Not authenticated

---

### 5. Update Church (Full Update)

**PATCH** `/api/dashboard/churches/:id`

**Authentication:** Required

**Cache Invalidation:** Clears cache for `/churches` route

**Description:** Updates multiple fields in a church document.

**Parameters:**
- `id` - Church MongoDB ObjectId

**Request Body:** (Any combination of fields)
```json
{
  "name": "Updated Church Name",
  "location": "New Address",
  "principal": {
    "pastor": "Updated Pastor Name",
    "wife": "Updated Wife Name",
    "image": "https://res.cloudinary.com/new-image...",
    "description": "<p>Updated description...</p>"
  },
  "logo": "https://res.cloudinary.com/...",
  "image": "https://res.cloudinary.com/...",
  "banner": ["https://..."],
  "gallery": ["https://..."],
  "securities": {
    "deacons": [...],
    "trustees": [...]
  },
  "liveServices": [...],
  "oldServices": [...],
  "songs": [...]
}
```

**Response (200 OK):**
```json
{
  "message": "Church updated successfully",
  "church": {
    "_id": "507f191e810c19729de860ea",
    "name": "Updated Church Name",
    ...
  }
}
```

**Errors:**
- `400` - No data provided or validation error
- `401` - Not authenticated
- `404` - Church not found

---

### 6. Update Single Field

**PATCH** `/api/dashboard/churches/:id/:field`

**Authentication:** Required

**Description:** Updates a specific field in the church document.

**Parameters:**
- `id` - Church MongoDB ObjectId
- `field` - Field name (e.g., "name", "location", "logo")

**Request Body:**
```json
{
  "name": "New Church Name"
}
```

**Response (200 OK):**
```json
{
  "message": "Church name updated successfully",
  "church": {...}
}
```

**Errors:**
- `400` - Missing field value
- `401` - Not authenticated
- `404` - Church not found

---

### 7. Delete Church

**DELETE** `/api/dashboard/church/:id`

**Authentication:** Required

**Description:** Permanently deletes a church.

**Parameters:**
- `id` - Church MongoDB ObjectId

**Response (200 OK):**
```json
{
  "message": "Church deleted successfully",
  "deletedChurchId": "507f191e810c19729de860ea",
  "deletedChurchName": "Grace Community Church"
}
```

**Errors:**
- `404` - Church not found

---

### 8. Delete Gallery Image

**DELETE** `/api/dashboard/churches/:churchId/gallery/:imageIndex`

**Authentication:** Required

**Description:** Removes an image from the church gallery by index.

**Parameters:**
- `churchId` - Church MongoDB ObjectId
- `imageIndex` - Array index (0-based)

**Response (200 OK):**
```json
{
  "message": "Gallery image deleted successfully",
  "remainingImages": 4
}
```

**Errors:**
- `400` - Invalid index
- `404` - Church not found

---

### 9. Delete Banner Image

**DELETE** `/api/dashboard/churches/:churchId/banner/:imageIndex`

**Authentication:** Required

**Description:** Removes a banner image by index.

**Response (200 OK):**
```json
{
  "message": "Banner image deleted successfully",
  "remainingBanners": 2
}
```

---

### 10. Delete Past Service

**DELETE** `/api/dashboard/churches/:churchId/past-service/:serviceIndex`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "message": "Past service deleted successfully",
  "remainingServices": 5
}
```

---

### 11. Delete Deacon

**DELETE** `/api/dashboard/churches/:churchId/deacon/:deaconIndex`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "message": "Deacon deleted successfully",
  "remainingDeacons": 3
}
```

---

### 12. Delete Trustee

**DELETE** `/api/dashboard/churches/:churchId/trustee/:trusteeIndex`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "message": "Trustee deleted successfully",
  "remainingTrustees": 4
}
```

---

### 13. Delete Song

**DELETE** `/api/dashboard/churches/:churchId/song/:songIndex`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "message": "Song deleted successfully",
  "remainingSongs": 10
}
```

---

### 14. Delete Live Service

**DELETE** `/api/dashboard/churches/:churchId/live/:liveIndex`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "message": "Live service deleted successfully",
  "remainingLiveServices": 2
}
```

---

## 👤 User Management API

Base Path: `/api`

### 1. Sign Up

**POST** `/api/signup`

**Rate Limit:** 5 requests/15 minutes

**Request Body:**
```json
{
  "name": "John",
  "surname": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "avatar": "https://randomuser.me/api/portraits/men/1.jpg",
  "language": "en",
  "role": "user",
  "churchSelection": "507f191e810c19729de860ea",
  "otherChurchName": ""
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully! Please check your email.",
  "userId": "507f1f77bcf86cd799439011",
  "email": "john@example.com"
}
```

---

### 2. Sign In

**POST** `/api/signin`

**Rate Limit:** 10 requests/15 minutes

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John",
    "surname": "Doe",
    "email": "john@example.com",
    "role": "user",
    "avatar": {
      "public_id": "avatars/xxx",
      "url": "https://res.cloudinary.com/..."
    },
    "language": "en",
    "churchSelection": "507f191e810c19729de860ea",
    "createdAt": "2025-10-29T10:00:00.000Z"
  }
}
```

---

### 3. Sign Out

**POST** `/api/signout`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "message": "Signout successful"
}
```

---

### 4. Get Current User

**GET** `/api/user`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John",
  "surname": "Doe",
  "email": "john@example.com",
  "role": "user",
  "avatar": {
    "public_id": "avatars/xxx",
    "url": "https://res.cloudinary.com/..."
  },
  "language": "en",
  "churchSelection": "507f191e810c19729de860ea",
  "churches": [
    {
      "_id": "507f191e810c19729de860ea",
      "name": "Grace Community Church",
      "location": "123 Main St, New York, NY",
      "logo": "https://res.cloudinary.com/...",
      "createdAt": "2025-10-29T10:00:00.000Z"
    }
  ],
  "createdAt": "2025-10-29T10:00:00.000Z",
  "updatedAt": "2025-10-29T12:00:00.000Z"
}
```

---

### 5. Update User Avatar

**PATCH** `/api/user/avatar`

**Authentication:** Required

**Request Body:**
```json
{
  "avatarUrl": "https://res.cloudinary.com/new-avatar..."
}
```

**Response (200 OK):**
```json
{
  "message": "Avatar updated successfully",
  "avatar": {
    "public_id": "avatars/new_xxx",
    "url": "https://res.cloudinary.com/new-avatar..."
  }
}
```

---

### 6. Update User Password

**PATCH** `/api/user/password`

**Authentication:** Required

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password updated successfully"
}
```

---

### 7. Delete User Account

**DELETE** `/api/user`

**Authentication:** Required

**Request Body:**
```json
{
  "password": "CurrentPass123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Account deleted successfully"
}
```

---

## 📤 File Upload API

### Upload Image to Cloudinary

**POST** `/api/upload-file-to-cloud`

**Authentication:** Not required (but recommended to add)

**Content-Type:** `multipart/form-data`

**Request Body (FormData):**
```javascript
const formData = new FormData();
formData.append("profileImage", {
  uri: "file://path/to/image.jpg",
  name: "image.jpg",
  type: "image/jpg"
});
```

**Response (200 OK):**
```json
{
  "result": {
    "public_id": "uploads/xxx",
    "secure_url": "https://res.cloudinary.com/ddbiofmni/image/upload/v1234567890/uploads/xxx.jpg",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "resource_type": "image",
    "created_at": "2025-10-29T10:00:00Z",
    "bytes": 245678
  }
}
```

**Errors:**
- `400` - No file uploaded
- `500` - Upload failed

---

## 👑 Admin Management API

Base Path: `/api/admin`

### 1. Get All Users

**GET** `/api/admin/users`

**Authentication:** Required (Admin only)

**Response (200 OK):**
```json
{
  "totalUsers": 50,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John",
      "surname": "Doe",
      "email": "john@example.com",
      "role": "user",
      "isAdminCandidate": false,
      "avatar": {...},
      "createdAt": "2025-10-29T10:00:00.000Z"
    }
  ]
}
```

---

### 2. Update User Role

**PATCH** `/api/admin/users/:userId/role`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response (200 OK):**
```json
{
  "message": "User role updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

---

### 3. Get Admin Candidates

**GET** `/api/admin/candidates`

**Authentication:** Required (Admin only)

**Description:** Returns users who requested admin access during signup.

**Response (200 OK):**
```json
{
  "totalCandidates": 5,
  "candidates": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John",
      "surname": "Doe",
      "email": "john@example.com",
      "role": "user",
      "isAdminCandidate": true,
      "candidateReason": "Pastor - IT",
      "createdAt": "2025-10-29T10:00:00.000Z"
    }
  ]
}
```

---

### 4. Approve Admin Candidate

**PATCH** `/api/admin/candidates/:userId/approve`

**Authentication:** Required (Admin only)

**Response (200 OK):**
```json
{
  "message": "User promoted to admin successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "role": "admin",
    "isAdminCandidate": false
  }
}
```

---

## 🔔 Password Reset API

Base Path: `/api/password`

### 1. Request Password Reset

**POST** `/api/password/forgot`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset email sent successfully"
}
```

---

### 2. Reset Password

**POST** `/api/password/reset/:token`

**Parameters:**
- `token` - Reset token from email

**Request Body:**
```json
{
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

---

## ❌ Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Not authorized |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Responses

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional error details"
}
```

---

## 🎯 Frontend Integration Guide

### React Native Example - Upload & Update Church

```typescript
// church.tsx - Modern Implementation
import AsyncStorage from "@react-native-async-storage/async-storage";
import { URI_domain } from "@/utilities/tools";

// 1. Upload Image to Cloudinary
const uploadImageToCloud = async (imageUri: string): Promise<string | null> => {
  try {
    setUpdating(true);
    const formData = new FormData();
    formData.append("profileImage", {
      uri: imageUri,
      name: "image.jpg",
      type: "image/jpg",
    } as any);

    const response = await fetch(`${URI_domain}/api/upload-file-to-cloud`, {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    const { result } = await response.json();
    setUpdating(false);
    return result.secure_url;
  } catch (error) {
    console.error("Upload error:", error);
    Alert.alert("Error", "Failed to upload image");
    setUpdating(false);
    return null;
  }
};

// 2. Update Church Data
const handleUpdateChurch = async () => {
  if (!church) return;
  
  setUpdating(true);
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${URI_domain}/api/dashboard/churches/${church._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(church),
    });

    if (response.ok) {
      setShowSuccessSnackbar(true);
    } else {
      const errorData = await response.json();
      Alert.alert("Error", errorData.message || "Failed to update church");
    }
  } catch (error) {
    console.error("Update error:", error);
    Alert.alert("Error", "Network error occurred");
  } finally {
    setUpdating(false);
  }
};

// 3. Fetch Church by ID
const fetchChurchData = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${URI_domain}/api/dashboard/church/${churchId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch church data");
    }

    const data = await response.json();
    setChurch(data);
  } catch (error) {
    console.error("Error fetching church:", error);
    Alert.alert("Error", "Failed to load church data");
  } finally {
    setLoading(false);
  }
};
```

### Key Integration Points

1. **Authentication Flow:**
   - Login → Store JWT token in AsyncStorage
   - Include token in Authorization header for all protected routes
   - Handle 401 errors by redirecting to login

2. **Image Upload Flow:**
   - Pick image with expo-image-picker
   - Upload to Cloudinary via `/api/upload-file-to-cloud`
   - Get secure_url from response
   - Update church object with new URL
   - Send PATCH request to update church

3. **Error Handling:**
   - Show loading indicators during operations
   - Display user-friendly error messages
   - Log errors for debugging
   - Handle network failures gracefully

4. **Performance Tips:**
   - Cache church list (5-minute TTL)
   - Lazy load images in galleries
   - Debounce text input updates
   - Show loading overlays during uploads

---

## 🏥 Health Check

**GET** `/health`

**Authentication:** Not required

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2025-10-29T12:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "services": {
    "database": {
      "status": "connected",
      "connected": true
    },
    "redis": {
      "status": "connected",
      "connected": true
    },
    "cache": {
      "stats": {
        "hits": 1250,
        "misses": 150,
        "keys": 45
      }
    }
  },
  "system": {
    "memory": {
      "used": 128,
      "total": 512
    },
    "cpu": {...}
  }
}
```

---

## 📝 Notes

### Security Recommendations

1. **Always use HTTPS in production**
2. **Never expose Cloudinary credentials in frontend**
3. **Validate all user inputs on backend**
4. **Rate limit all endpoints appropriately**
5. **Use environment variables for secrets**
6. **Implement CORS properly for production**
7. **Sanitize rich text content**
8. **Validate file uploads (type, size)**

### Performance Optimization

1. **Use Redis caching for frequently accessed data**
2. **Implement pagination for large datasets**
3. **Compress responses with gzip**
4. **Optimize database queries with indexes**
5. **Use CDN for static assets**
6. **Lazy load images in frontend**

### Testing

Use Postman collection: `Saintshub_API.postman_collection.json`

---

**End of API Reference** 🎉

For questions or issues, contact the development team.
