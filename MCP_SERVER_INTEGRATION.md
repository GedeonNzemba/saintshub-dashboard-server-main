# 🤖 SaintsHub API - MCP Server Integration Guide

**Complete API Documentation for GitHub Copilot MCP Server Integration**

**Server Base URL (Development):** `http://localhost:3003`  
**Server Base URL (Production):** `https://your-production-domain.com`  
**API Version:** 2.0.0  
**Last Updated:** October 31, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication System](#authentication-system)
3. [API Endpoints Summary](#api-endpoints-summary)
4. [Authentication & User Management](#authentication--user-management)
5. [Church Management API](#church-management-api)
6. [Admin Management API](#admin-management-api)
7. [Password Reset API](#password-reset-api)
8. [File Upload API](#file-upload-api)
9. [Request/Response Examples](#requestresponse-examples)
10. [Error Handling](#error-handling)
11. [Rate Limiting](#rate-limiting)
12. [Security Best Practices](#security-best-practices)

---

## 🌟 Overview

### Tech Stack
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Cache:** Redis (5-minute TTL for church listings)
- **File Storage:** Cloudinary
- **Authentication:** JWT Bearer Tokens (5-hour expiration)
- **Rate Limiting:** 
  - General API: 100 requests/15min
  - Auth endpoints: 5 requests/15min
  - Upload endpoints: 20 requests/15min
- **Email Service:** Nodemailer with Hostinger SMTP

### Key Features
✅ JWT-based authentication with secure token management  
✅ Role-based access control (User, Pastor, IT, Admin)  
✅ Redis caching for optimized performance  
✅ Cloudinary image upload with automatic optimization  
✅ Email notifications (welcome, admin requests, password reset)  
✅ Church ownership verification middleware  
✅ Comprehensive validation and error handling  
✅ Health monitoring endpoint  

---

## 🔐 Authentication System

### JWT Token Structure

**Required Header for Authenticated Endpoints:**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Token Details:**
- **Expiration:** 5 hours
- **Storage:** Store in secure storage (AsyncStorage, SecureStore, or httpOnly cookies)
- **Format:** `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Token Payload:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "iat": 1635529200,
  "exp": 1635547200
}
```

### User Roles
- **user** - Regular user (view-only access)
- **pastor** - Church pastor (admin candidate)
- **it** - IT staff (admin candidate)
- **admin** - Full administrative access

---

## 📚 API Endpoints Summary

### Authentication & User Management (`/api`)

| Method | Endpoint | Auth Required | Rate Limit | Description |
|--------|----------|---------------|------------|-------------|
| POST | `/signup` | No | 5/15min | Create new user account |
| POST | `/signin` | No | 5/15min | User login |
| POST | `/signout` | Yes | 100/15min | User logout |
| GET | `/user` | Yes | 100/15min | Get current user info |
| GET | `/user/logout` | Yes | 100/15min | Logout user (alias) |
| PUT | `/user/update-user` | Yes | 100/15min | Update user profile |
| PUT | `/user/update-avatar` | Yes | 100/15min | Update profile picture |
| PUT | `/user/update-password` | Yes | 100/15min | Change password |
| DELETE | `/user/delete-account` | Yes | 100/15min | Delete user account |
| GET | `/documents` | Yes | 100/15min | Get user documents |

### Church Management (`/api/dashboard`)

| Method | Endpoint | Auth Required | Admin Required | Description |
|--------|----------|---------------|----------------|-------------|
| POST | `/create-church` | Yes | Yes | Create new church |
| GET | `/churches` | Yes | No | Get all churches (cached 5min) |
| GET | `/public/churches` | No | No | Get public church list |
| GET | `/church/:id` | Yes | No | Get single church details |
| PATCH | `/churches/:id` | Yes | Owner | Update church (full) |
| PATCH | `/churches/:id/:field` | Yes | Owner | Update single field |
| DELETE | `/church/:id` | Yes | Owner | Delete church |
| DELETE | `/churches/:id/gallery/:index` | Yes | Owner | Delete gallery image |
| DELETE | `/churches/:id/banner/:index` | Yes | Owner | Delete banner image |
| DELETE | `/churches/:id/past-service/:index` | Yes | Owner | Delete past service |
| DELETE | `/churches/:id/deacon/:index` | Yes | Owner | Delete deacon |
| DELETE | `/churches/:id/trustee/:index` | Yes | Owner | Delete trustee |
| DELETE | `/churches/:id/song/:index` | Yes | Owner | Delete song |
| DELETE | `/churches/:id/live/:index` | Yes | Owner | Delete live service |

### Admin Management (`/api/admin`)

| Method | Endpoint | Auth Required | Admin Required | Description |
|--------|----------|---------------|----------------|-------------|
| GET | `/pending-requests` | Yes | Yes | Get admin requests |
| GET | `/all-admins` | Yes | Yes | Get all admins |
| PUT | `/approve/:userId` | Yes | Yes | Approve admin request |
| PUT | `/revoke/:userId` | Yes | Yes | Revoke admin access |

### Password Reset (`/api/password`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/forgot-password` | No | Request password reset |
| POST | `/reset-password` | No | Reset password with token |
| GET | `/verify-reset-token/:token` | No | Verify reset token validity |

### File Upload (`/api`)

| Method | Endpoint | Auth Required | Rate Limit | Description |
|--------|----------|---------------|------------|-------------|
| POST | `/upload-file` | No | 20/15min | Upload to local storage |
| POST | `/upload-file-to-cloud` | No | 20/15min | Upload to Cloudinary |

### System (`/`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/health` | No | Server health check |

---

## 🔐 Authentication & User Management

### 1. User Signup

**POST** `/api/signup`

**Rate Limit:** 5 requests per 15 minutes

**Description:** Creates a new user account. Sends welcome email automatically. If user selects `pastor` or `it` role, also sends admin request pending email.

**Request Body:**
```json
{
  "name": "John",
  "surname": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "avatar": "https://res.cloudinary.com/ddbiofmni/image/upload/v1234567890/avatar.jpg",
  "language": "en",
  "role": "user",
  "selectedChurchId": "507f191e810c19729de860ea",
  "otherChurchName": "My New Church"
}
```

**Field Validations:**
- `name` - Required, string
- `surname` - Required, string
- `email` - Required, valid email format, unique
- `password` - Required, min 8 characters, must match confirmPassword
- `confirmPassword` - Required, must match password
- `avatar` - Required, valid Cloudinary URL
- `language` - Required, enum: `"en"` or `"fr"`
- `role` - Required, enum: `"user"`, `"pastor"`, or `"it"`
- `selectedChurchId` - Optional, MongoDB ObjectId (existing church)
- `otherChurchName` - Optional, string (for new church name)

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John",
    "surname": "Doe",
    "email": "john.doe@example.com",
    "avatar": {
      "public_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "url": "https://res.cloudinary.com/..."
    },
    "language": "en",
    "admin": false,
    "isAdminCandidate": false
  }
}
```

**Automated Emails:**
- ✅ Welcome email sent to user
- ✅ Admin request pending email (if role is `pastor` or `it`)

**Errors:**
- `400` - Missing required fields or validation failed
- `409` - User already exists with this email
- `500` - Server error

---

### 2. User Signin

**POST** `/api/signin`

**Rate Limit:** 5 requests per 15 minutes

**Description:** Authenticates existing user and returns JWT token.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John",
    "surname": "Doe",
    "email": "john.doe@example.com",
    "avatar": {
      "public_id": "uuid",
      "url": "https://res.cloudinary.com/..."
    },
    "admin": false,
    "language": "en",
    "isAdminCandidate": false,
    "churchSelection": "507f191e810c19729de860ea"
  }
}
```

**Errors:**
- `400` - Missing email or password
- `401` - Invalid email or password
- `500` - Server error

---

### 3. User Signout

**POST** `/api/signout`

**Authentication:** Required

**Description:** Logs out current user and clears token cookie.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "message": "Sign-out successful."
}
```

---

### 4. Get Current User

**GET** `/api/user`

**Authentication:** Required

**Description:** Retrieves currently authenticated user's information.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John",
  "surname": "Doe",
  "email": "john.doe@example.com",
  "avatar": {
    "public_id": "uuid",
    "url": "https://res.cloudinary.com/..."
  },
  "admin": false,
  "language": "en",
  "isAdminCandidate": false,
  "churchSelection": "507f191e810c19729de860ea",
  "createdAt": "2025-10-31T10:00:00.000Z",
  "updatedAt": "2025-10-31T10:00:00.000Z"
}
```

**Errors:**
- `401` - Not authenticated
- `404` - User not found
- `500` - Server error

---

### 5. Update User Profile

**PUT** `/api/user/update-user`

**Authentication:** Required

**Description:** Updates user's profile information (name, surname, email).

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John",
  "surname": "Smith",
  "email": "john.smith@example.com"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John",
  "surname": "Smith",
  "email": "john.smith@example.com",
  "avatar": {
    "public_id": "uuid",
    "url": "https://res.cloudinary.com/..."
  },
  "admin": false,
  "language": "en",
  "updatedAt": "2025-10-31T12:30:00.000Z"
}
```

**Errors:**
- `400` - Missing required fields
- `401` - Not authenticated
- `404` - User not found
- `500` - Server error

---

### 6. Update User Avatar

**PUT** `/api/user/update-avatar`

**Authentication:** Required

**Description:** Updates user's profile picture.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "avatar": "https://res.cloudinary.com/ddbiofmni/image/upload/v1234567890/new-avatar.jpg"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John",
  "surname": "Doe",
  "email": "john.doe@example.com",
  "avatar": {
    "public_id": "uuid",
    "url": "https://res.cloudinary.com/ddbiofmni/image/upload/v1234567890/new-avatar.jpg"
  },
  "updatedAt": "2025-10-31T13:00:00.000Z"
}
```

**Errors:**
- `400` - Missing avatar URL
- `401` - Not authenticated
- `404` - User not found
- `500` - Server error

---

### 7. Update Password

**PUT** `/api/user/update-password`

**Authentication:** Required

**Description:** Changes user's password. New password must be different from current password.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "password": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password has been updated !",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "updatedAt": "2025-10-31T14:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Passwords do not match or new password same as current
- `401` - Not authenticated
- `404` - User not found
- `500` - Server error

---

### 8. Delete User Account

**DELETE** `/api/user/delete-account`

**Authentication:** Required

**Description:** Permanently deletes the user's account. This action cannot be undone.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "message": "Account deleted successfully"
}
```

**Errors:**
- `401` - Not authenticated
- `404` - User not found
- `500` - Server error

---

## 🏛️ Church Management API

### 1. Create Church

**POST** `/api/dashboard/create-church`

**Authentication:** Required (Admin or isAdminCandidate only)

**Description:** Creates a new church. User information is automatically populated from authenticated session.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Grace Community Church",
  "location": "123 Main Street, New York, NY 10001",
  "logo": "https://res.cloudinary.com/ddbiofmni/image/upload/v1234567890/logo.jpg",
  "image": "https://res.cloudinary.com/ddbiofmni/image/upload/v1234567890/church.jpg",
  "banner": [
    "https://res.cloudinary.com/ddbiofmni/image/upload/v1234567890/banner1.jpg",
    "https://res.cloudinary.com/ddbiofmni/image/upload/v1234567890/banner2.jpg"
  ],
  "gallery": [
    "https://res.cloudinary.com/ddbiofmni/image/upload/v1234567890/gallery1.jpg",
    "https://res.cloudinary.com/ddbiofmni/image/upload/v1234567890/gallery2.jpg"
  ],
  "principal": {
    "pastor": "Pastor John Smith",
    "wife": "Jane Smith",
    "image": "https://res.cloudinary.com/ddbiofmni/image/upload/v1234567890/pastor.jpg",
    "description": "<p>Rich text description of the pastor...</p>"
  },
  "securities": {
    "deacons": [
      {
        "names": "Robert Johnson",
        "descriptions": "<p>Deacon bio in rich text...</p>",
        "image": "https://res.cloudinary.com/ddbiofmni/image/upload/v1234567890/deacon1.jpg"
      }
    ],
    "trustees": [
      {
        "names": "Michael Brown",
        "descriptions": "<p>Trustee bio in rich text...</p>",
        "image": "https://res.cloudinary.com/ddbiofmni/image/upload/v1234567890/trustee1.jpg"
      }
    ]
  },
  "liveServices": [
    {
      "title": "Sunday Worship Service",
      "preacher": "Pastor John Smith",
      "sermon": "https://youtube.com/watch?v=..."
    }
  ],
  "oldServices": [
    {
      "title": "Easter Service 2024",
      "preacher": "Pastor John Smith",
      "sermon": "https://youtube.com/watch?v=..."
    }
  ],
  "songs": [
    {
      "title": "Amazing Grace",
      "url": "https://youtube.com/watch?v=..."
    }
  ]
}
```

**Field Validations:**
- `name` - **Required**, string
- `location` - **Required**, string
- `principal` - **Required**, object with pastor, wife (optional), image, description
- `logo` - Optional, Cloudinary URL
- `image` - Optional, Cloudinary URL
- `banner` - Optional, array of Cloudinary URLs
- `gallery` - Optional, array of Cloudinary URLs
- `securities` - Optional, object with deacons and trustees arrays
- `liveServices` - Optional, array of service objects
- `oldServices` - Optional, array of service objects
- `songs` - Optional, array of song objects

**User Auto-Population:**
The `user` field is automatically populated by the system from the authenticated user:
```json
{
  "user": {
    "name": "John",
    "email": "john@example.com",
    "_id": "507f1f77bcf86cd799439011",
    "image": "https://res.cloudinary.com/..."
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Church created successfully!",
  "church": {
    "_id": "507f191e810c19729de860ea",
    "name": "Grace Community Church",
    "location": "123 Main Street, New York, NY 10001",
    "logo": "https://res.cloudinary.com/...",
    "image": "https://res.cloudinary.com/...",
    "banner": ["https://res.cloudinary.com/..."],
    "gallery": ["https://res.cloudinary.com/..."],
    "principal": {
      "pastor": "Pastor John Smith",
      "wife": "Jane Smith",
      "image": "https://res.cloudinary.com/...",
      "description": "<p>...</p>"
    },
    "securities": {
      "deacons": [...],
      "trustees": [...]
    },
    "liveServices": [...],
    "oldServices": [...],
    "songs": [...],
    "user": {
      "name": "John",
      "email": "john@example.com",
      "_id": "507f1f77bcf86cd799439011",
      "image": "https://res.cloudinary.com/..."
    },
    "createdAt": "2025-10-31T10:00:00.000Z",
    "updatedAt": "2025-10-31T10:00:00.000Z",
    "__v": 0
  }
}
```

**Errors:**
- `400` - Missing required fields (name, principal, location)
- `401` - Not authenticated
- `403` - Not authorized (not admin or isAdminCandidate)
- `404` - User not found
- `500` - Server error

---

### 2. Get All Churches

**GET** `/api/dashboard/churches`

**Authentication:** Required

**Caching:** Redis cache for 5 minutes (300 seconds)

**Description:** Retrieves all churches with full details. Cached for performance optimization.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
[
  {
    "_id": "507f191e810c19729de860ea",
    "name": "Grace Community Church",
    "location": "123 Main Street, New York, NY 10001",
    "logo": "https://res.cloudinary.com/...",
    "image": "https://res.cloudinary.com/...",
    "banner": ["..."],
    "gallery": ["..."],
    "principal": {
      "pastor": "Pastor John Smith",
      "wife": "Jane Smith",
      "image": "https://res.cloudinary.com/...",
      "description": "<p>...</p>"
    },
    "securities": {
      "deacons": [...],
      "trustees": [...]
    },
    "liveServices": [...],
    "oldServices": [...],
    "songs": [...],
    "user": {
      "name": "John",
      "email": "john@example.com",
      "_id": "507f1f77bcf86cd799439011",
      "image": "https://res.cloudinary.com/..."
    },
    "createdAt": "2025-10-31T10:00:00.000Z",
    "updatedAt": "2025-10-31T10:00:00.000Z",
    "__v": 0
  }
]
```

**Cache Headers:**
- `X-Cache: HIT` - Served from cache
- `X-Cache: MISS` - Served from database

**Errors:**
- `401` - Not authenticated
- `500` - Server error

---

### 3. Get Public Church List

**GET** `/api/dashboard/public/churches`

**Authentication:** Not required

**Description:** Returns minimal church data (ID and name only) for public access during signup.

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

**Errors:**
- `500` - Server error

---

### 4. Get Single Church

**GET** `/api/dashboard/church/:id`

**Authentication:** Required

**Description:** Retrieves detailed information for a specific church. Includes ownership information.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**URL Parameters:**
- `id` - Church MongoDB ObjectId

**Example:**
```
GET /api/dashboard/church/507f191e810c19729de860ea
```

**Response (200 OK):**
```json
{
  "_id": "507f191e810c19729de860ea",
  "name": "Grace Community Church",
  "location": "123 Main Street, New York, NY 10001",
  "logo": "https://res.cloudinary.com/...",
  "image": "https://res.cloudinary.com/...",
  "banner": ["..."],
  "gallery": ["..."],
  "principal": {
    "pastor": "Pastor John Smith",
    "wife": "Jane Smith",
    "image": "https://res.cloudinary.com/...",
    "description": "<p>...</p>"
  },
  "securities": {
    "deacons": [
      {
        "names": "Robert Johnson",
        "descriptions": "<p>...</p>",
        "image": "https://res.cloudinary.com/..."
      }
    ],
    "trustees": [...]
  },
  "liveServices": [
    {
      "title": "Sunday Worship Service",
      "preacher": "Pastor John Smith",
      "sermon": "https://youtube.com/watch?v=..."
    }
  ],
  "oldServices": [...],
  "songs": [
    {
      "title": "Amazing Grace",
      "url": "https://youtube.com/watch?v=..."
    }
  ],
  "user": {
    "name": "John",
    "email": "john@example.com",
    "_id": "507f1f77bcf86cd799439011",
    "image": "https://res.cloudinary.com/..."
  },
  "isOwner": true,
  "createdAt": "2025-10-31T10:00:00.000Z",
  "updatedAt": "2025-10-31T10:00:00.000Z"
}
```

**Ownership Flag:**
- `isOwner: true` - Current user created this church
- `isOwner: false` - Current user did not create this church

**Errors:**
- `401` - Not authenticated
- `404` - Church not found
- `500` - Server error

---

### 5. Update Church (Full Update)

**PATCH** `/api/dashboard/churches/:id`

**Authentication:** Required (Owner only)

**Cache Invalidation:** Clears `/churches` cache after successful update

**Description:** Updates multiple fields of a church. Only the church owner can update.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**URL Parameters:**
- `id` - Church MongoDB ObjectId

**Request Body** (any combination of fields):
```json
{
  "name": "Updated Church Name",
  "location": "New Address",
  "logo": "https://res.cloudinary.com/new-logo.jpg",
  "principal": {
    "pastor": "Pastor John Smith Jr.",
    "wife": "Jane Smith",
    "image": "https://res.cloudinary.com/...",
    "description": "<p>Updated description...</p>"
  },
  "liveServices": [
    {
      "title": "New Service",
      "preacher": "Guest Speaker",
      "sermon": "https://youtube.com/..."
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "message": "Church updated successfully",
  "church": {
    "_id": "507f191e810c19729de860ea",
    "name": "Updated Church Name",
    "location": "New Address",
    "updatedAt": "2025-10-31T15:00:00.000Z"
  }
}
```

**Errors:**
- `400` - No data provided or validation failed
- `401` - Not authenticated
- `403` - Not church owner
- `404` - Church not found
- `500` - Server error

---

### 6. Update Single Church Field

**PATCH** `/api/dashboard/churches/:id/:field`

**Authentication:** Required (Owner only)

**Description:** Updates a single field of a church. Useful for partial updates.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**URL Parameters:**
- `id` - Church MongoDB ObjectId
- `field` - Field name to update (e.g., `name`, `location`, `logo`)

**Request Body:**
```json
{
  "name": "New Church Name"
}
```

**Example:**
```
PATCH /api/dashboard/churches/507f191e810c19729de860ea/name
Body: { "name": "New Church Name" }
```

**Response (200 OK):**
```json
{
  "message": "Church name updated successfully",
  "church": {
    "_id": "507f191e810c19729de860ea",
    "name": "New Church Name",
    "updatedAt": "2025-10-31T15:30:00.000Z"
  }
}
```

**Errors:**
- `400` - Missing field value
- `401` - Not authenticated
- `403` - Not church owner
- `404` - Church not found
- `500` - Server error

---

### 7. Delete Church

**DELETE** `/api/dashboard/church/:id`

**Authentication:** Required (Owner only)

**Description:** Permanently deletes a church. Only the church owner can delete.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**URL Parameters:**
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
- `401` - Not authenticated
- `403` - Not church owner
- `404` - Church not found
- `500` - Server error

---

### 8. Delete Gallery Image

**DELETE** `/api/dashboard/churches/:churchId/gallery/:imageIndex`

**Authentication:** Required (Owner only)

**Description:** Removes a specific image from church gallery by index.

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**URL Parameters:**
- `churchId` - Church MongoDB ObjectId
- `imageIndex` - Zero-based index of image to delete

**Example:**
```
DELETE /api/dashboard/churches/507f191e810c19729de860ea/gallery/2
```

**Response (200 OK):**
```json
{
  "message": "Gallery image deleted successfully",
  "remainingImages": 4
}
```

**Errors:**
- `400` - Invalid image index
- `401` - Not authenticated
- `403` - Not church owner
- `404` - Church not found
- `500` - Server error

---

### 9. Delete Banner Image

**DELETE** `/api/dashboard/churches/:churchId/banner/:imageIndex`

**Authentication:** Required (Owner only)

**Description:** Removes a specific banner image by index.

**URL Parameters:**
- `churchId` - Church MongoDB ObjectId
- `imageIndex` - Zero-based index of banner to delete

**Response (200 OK):**
```json
{
  "message": "Banner image deleted successfully",
  "remainingBanners": 2
}
```

**Errors:**
- `400` - Invalid banner index
- `401` - Not authenticated
- `403` - Not church owner
- `404` - Church not found
- `500` - Server error

---

### 10. Delete Past Service

**DELETE** `/api/dashboard/churches/:churchId/past-service/:serviceIndex`

**Authentication:** Required (Owner only)

**Description:** Removes a specific past service by index.

**URL Parameters:**
- `churchId` - Church MongoDB ObjectId
- `serviceIndex` - Zero-based index of service to delete

**Response (200 OK):**
```json
{
  "message": "Past service deleted successfully",
  "remainingServices": 10
}
```

---

### 11. Delete Deacon

**DELETE** `/api/dashboard/churches/:churchId/deacon/:deaconIndex`

**Authentication:** Required (Owner only)

**Response (200 OK):**
```json
{
  "message": "Deacon deleted successfully",
  "remainingDeacons": 5
}
```

---

### 12. Delete Trustee

**DELETE** `/api/dashboard/churches/:churchId/trustee/:trusteeIndex`

**Authentication:** Required (Owner only)

**Response (200 OK):**
```json
{
  "message": "Trustee deleted successfully",
  "remainingTrustees": 3
}
```

---

### 13. Delete Song

**DELETE** `/api/dashboard/churches/:churchId/song/:songIndex`

**Authentication:** Required (Owner only)

**Response (200 OK):**
```json
{
  "message": "Song deleted successfully",
  "remainingSongs": 15
}
```

---

### 14. Delete Live Service

**DELETE** `/api/dashboard/churches/:churchId/live/:liveIndex`

**Authentication:** Required (Owner only)

**Response (200 OK):**
```json
{
  "message": "Live service deleted successfully",
  "remainingLiveServices": 1
}
```

---

## 👑 Admin Management API

### 1. Get Pending Admin Requests

**GET** `/api/admin/pending-requests`

**Authentication:** Required (Admin only)

**Description:** Returns list of users who selected `pastor` or `it` role during signup.

**Headers:**
```http
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "pendingRequests": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John",
      "surname": "Doe",
      "email": "john.doe@example.com",
      "avatar": {
        "url": "https://res.cloudinary.com/..."
      },
      "language": "en",
      "isAdminCandidate": true,
      "churchSelection": "507f191e810c19729de860ea",
      "createdAt": "2025-10-30T10:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not admin
- `500` - Server error

---

### 2. Get All Admins

**GET** `/api/admin/all-admins`

**Authentication:** Required (Admin only)

**Description:** Returns list of all users with admin privileges.

**Headers:**
```http
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "admins": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Admin",
      "surname": "User",
      "email": "admin@example.com",
      "admin": true,
      "createdAt": "2025-10-01T10:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not admin
- `500` - Server error

---

### 3. Approve Admin Request

**PUT** `/api/admin/approve/:userId`

**Authentication:** Required (Admin only)

**Description:** Approves a user's admin request. Sends approval email to user.

**Headers:**
```http
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameters:**
- `userId` - MongoDB ObjectId of user to approve

**Example:**
```
PUT /api/admin/approve/507f1f77bcf86cd799439011
```

**Response (200 OK):**
```json
{
  "message": "User promoted to admin successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "admin": true,
    "isAdminCandidate": false
  }
}
```

**Automated Email:**
- ✅ Admin approved email sent to user

**Errors:**
- `401` - Not authenticated
- `403` - Not admin
- `404` - User not found
- `500` - Server error

---

### 4. Revoke Admin Access

**PUT** `/api/admin/revoke/:userId`

**Authentication:** Required (Admin only)

**Description:** Removes admin privileges from a user.

**Headers:**
```http
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameters:**
- `userId` - MongoDB ObjectId of admin to revoke

**Response (200 OK):**
```json
{
  "message": "Admin privileges revoked successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "admin": false
  }
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not admin
- `404` - User not found
- `500` - Server error

---

## 🔑 Password Reset API

### 1. Request Password Reset

**POST** `/api/password/forgot-password`

**Authentication:** Not required

**Description:** Sends password reset email with secure token link.

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Validation:**
- `email` - Required, valid email format

**Response (200 OK):**
```json
{
  "message": "Password reset email sent successfully"
}
```

**Automated Email:**
- ✅ Password reset email with token link sent to user

**Token Details:**
- **Expiration:** 1 hour
- **Format:** JWT with reset purpose
- **Link Example:** `https://your-app.com/reset-password?token=eyJhbGc...`

**Errors:**
- `400` - Invalid email format
- `404` - User not found (returns success for security)
- `500` - Server error

---

### 2. Verify Reset Token

**GET** `/api/password/verify-reset-token/:token`

**Authentication:** Not required

**Description:** Validates if a password reset token is still valid.

**URL Parameters:**
- `token` - Reset token from email

**Example:**
```
GET /api/password/verify-reset-token/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK - Valid):**
```json
{
  "valid": true,
  "message": "Token is valid"
}
```

**Response (400 Bad Request - Invalid/Expired):**
```json
{
  "valid": false,
  "message": "Invalid or expired reset token"
}
```

---

### 3. Reset Password

**POST** `/api/password/reset-password`

**Authentication:** Not required (uses token)

**Description:** Resets user password using the token from email.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewSecurePass123!"
}
```

**Validation:**
- `token` - Required, valid reset token
- `newPassword` - Required, min 8 characters, must contain uppercase, lowercase, and number

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

**Errors:**
- `400` - Invalid token or password requirements not met
- `404` - User not found
- `500` - Server error

---

## 📤 File Upload API

### 1. Upload File to Cloudinary

**POST** `/api/upload-file-to-cloud`

**Authentication:** Not required (but recommended)

**Rate Limit:** 20 uploads per 15 minutes

**Content-Type:** `multipart/form-data`

**Description:** Uploads image to Cloudinary and returns secure URL.

**Request Body (FormData):**
```javascript
const formData = new FormData();
formData.append("profileImage", {
  uri: "file://path/to/image.jpg",
  name: "image.jpg",
  type: "image/jpeg"
});
```

**Response (200 OK):**
```json
{
  "result": {
    "public_id": "logo",
    "secure_url": "https://res.cloudinary.com/ddbiofmni/image/upload/v1234567890/logo.jpg",
    "url": "http://res.cloudinary.com/ddbiofmni/image/upload/v1234567890/logo.jpg",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "resource_type": "image",
    "created_at": "2025-10-31T10:00:00Z",
    "bytes": 245678,
    "type": "upload",
    "etag": "abc123def456"
  }
}
```

**Supported Formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

**File Size Limit:** 50MB

**Errors:**
- `400` - No file uploaded or invalid format
- `429` - Rate limit exceeded
- `500` - Upload failed

---

### 2. Upload File to Local Storage

**POST** `/api/upload-file`

**Authentication:** Not required

**Rate Limit:** 20 uploads per 15 minutes

**Content-Type:** `multipart/form-data`

**Description:** Uploads file to local server storage (primarily for testing).

**Response (200 OK):**
```json
{
  "ok": true
}
```

**Note:** For production, use Cloudinary upload endpoint instead.

---

## 🏥 Health Check

**GET** `/health`

**Authentication:** Not required

**Description:** Comprehensive server health monitoring endpoint.

**Response (200 OK - Healthy):**
```json
{
  "status": "ok",
  "timestamp": "2025-10-31T12:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "services": {
    "database": {
      "status": "healthy",
      "connected": true
    },
    "redis": {
      "status": "healthy",
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
    "cpu": {
      "user": 12345,
      "system": 6789
    }
  }
}
```

**Response (503 Service Unavailable - Degraded):**
```json
{
  "status": "degraded",
  "timestamp": "2025-10-31T12:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "services": {
    "database": {
      "status": "unhealthy",
      "connected": false
    },
    "redis": {
      "status": "healthy",
      "connected": true
    }
  }
}
```

**Use Cases:**
- Load balancer health checks
- Monitoring tools (Datadog, New Relic)
- DevOps automation
- Uptime monitoring

---

## 📊 Request/Response Examples

### Complete User Journey Example

```javascript
// 1. SIGNUP
const signupResponse = await fetch('http://localhost:3003/api/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John',
    surname: 'Doe',
    email: 'john@example.com',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!',
    avatar: 'https://res.cloudinary.com/avatar.jpg',
    language: 'en',
    role: 'pastor',
    selectedChurchId: '507f191e810c19729de860ea'
  })
});

const { token, user } = await signupResponse.json();
console.log('Signup successful!', user);

// 2. GET USER INFO
const userResponse = await fetch('http://localhost:3003/api/user', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const userData = await userResponse.json();
console.log('User data:', userData);

// 3. CREATE CHURCH (Admin only)
const churchResponse = await fetch('http://localhost:3003/api/dashboard/create-church', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Grace Community Church',
    location: '123 Main St, NY',
    principal: {
      pastor: 'Pastor John Doe',
      wife: 'Jane Doe',
      image: 'https://res.cloudinary.com/pastor.jpg',
      description: '<p>About our pastor...</p>'
    }
  })
});

const { church } = await churchResponse.json();
console.log('Church created:', church);

// 4. GET ALL CHURCHES
const churchesResponse = await fetch('http://localhost:3003/api/dashboard/churches', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const churches = await churchesResponse.json();
console.log('All churches:', churches);

// 5. UPDATE CHURCH
const updateResponse = await fetch(`http://localhost:3003/api/dashboard/churches/${church._id}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Updated Church Name',
    location: 'New Address'
  })
});

const updatedChurch = await updateResponse.json();
console.log('Church updated:', updatedChurch);

// 6. SIGNOUT
const signoutResponse = await fetch('http://localhost:3003/api/signout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

console.log('Signed out successfully');
```

---

## ❌ Error Handling

### Standard Error Response Format

All API errors return this consistent structure:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": "Additional error details (optional)"
}
```

### HTTP Status Codes

| Code | Meaning | When It Occurs |
|------|---------|----------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data, missing fields, validation failed |
| 401 | Unauthorized | Not authenticated, invalid/expired token |
| 403 | Forbidden | Authenticated but not authorized (not admin/owner) |
| 404 | Not Found | Resource doesn't exist (user, church, etc.) |
| 409 | Conflict | Resource already exists (duplicate email) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Database or Redis connection failed |

### Common Error Scenarios

**Authentication Errors:**
```json
// 401 - Missing token
{
  "error": "Unauthorized",
  "message": "Authentication token required"
}

// 401 - Invalid token
{
  "error": "Unauthorized",
  "message": "Invalid authentication token"
}

// 401 - Expired token
{
  "error": "Unauthorized",
  "message": "Token has expired. Please log in again."
}
```

**Authorization Errors:**
```json
// 403 - Not admin
{
  "error": "Forbidden",
  "message": "Admin access required"
}

// 403 - Not church owner
{
  "error": "Forbidden",
  "message": "You do not have permission to modify this church"
}
```

**Validation Errors:**
```json
// 400 - Missing fields
{
  "error": "Bad Request",
  "message": "Please fill in all required fields.",
  "required": ["name", "principal", "location"]
}

// 400 - Invalid data
{
  "error": "Validation Error",
  "message": "Password must contain at least one uppercase letter, one lowercase letter, and one number"
}

// 409 - Duplicate email
{
  "error": "Conflict",
  "message": "User already exists."
}
```

**Rate Limit Errors:**
```json
// 429 - Too many requests
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again in 15 minutes."
}
```

---

## 🚦 Rate Limiting

### Rate Limit Configuration

| Route Pattern | Requests | Window | Purpose |
|--------------|----------|--------|---------|
| `/api/*` | 100 | 15 minutes | General API protection |
| `/api/signup` | 5 | 15 minutes | Prevent account spam |
| `/api/signin` | 5 | 15 minutes | Prevent brute force attacks |
| `/api/upload-*` | 20 | 15 minutes | Prevent storage abuse |
| `/api/password/forgot-password` | 5 | 15 minutes | Prevent email spam |

### Rate Limit Response Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635529200
```

### Rate Limit Error Response

**HTTP 429 Too Many Requests:**
```json
{
  "error": "Too Many Requests",
  "message": "You have exceeded the rate limit. Please try again later.",
  "retryAfter": 900
}
```

### Best Practices

1. **Monitor headers** - Check `X-RateLimit-Remaining` before making multiple requests
2. **Implement backoff** - If rate limit hit, wait for `retryAfter` seconds
3. **Batch operations** - Combine multiple updates into single PATCH request
4. **Cache responses** - Store frequently accessed data client-side

---

## 🔒 Security Best Practices

### For MCP Server Integration

1. **Always use HTTPS in production**
   - Development: `http://localhost:3003`
   - Production: `https://your-domain.com`

2. **Secure token storage**
   ```javascript
   // Store JWT securely
   await SecureStore.setItemAsync('userToken', token);
   
   // Retrieve JWT
   const token = await SecureStore.getItemAsync('userToken');
   ```

3. **Token refresh strategy**
   - Tokens expire after 5 hours
   - Implement automatic re-login when token expires
   - Store user credentials securely for seamless re-auth

4. **Validate all inputs**
   ```javascript
   // Email validation
   const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
   
   // Password strength
   const isStrongPassword = (password) => 
     password.length >= 8 &&
     /[A-Z]/.test(password) &&
     /[a-z]/.test(password) &&
     /\d/.test(password);
   ```

5. **Handle errors gracefully**
   ```javascript
   try {
     const response = await fetch(url, options);
     if (!response.ok) {
       const error = await response.json();
       throw new Error(error.message);
     }
     return await response.json();
   } catch (error) {
     console.error('API Error:', error);
     // Show user-friendly message
     Alert.alert('Error', error.message);
   }
   ```

6. **Respect rate limits**
   ```javascript
   // Check rate limit headers
   const remaining = response.headers.get('X-RateLimit-Remaining');
   if (remaining < 10) {
     console.warn('Rate limit almost exceeded');
   }
   ```

7. **Never expose secrets**
   ```javascript
   // ❌ BAD - Hardcoded
   const API_KEY = 'abc123';
   
   // ✅ GOOD - Environment variable
   const API_KEY = process.env.CLOUDINARY_API_KEY;
   ```

8. **Sanitize rich text content**
   - All HTML content should be sanitized on backend
   - Use DOMPurify or similar library for rich text display

9. **Validate file uploads**
   ```javascript
   // Check file type
   const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
   if (!allowedTypes.includes(file.type)) {
     throw new Error('Invalid file type');
   }
   
   // Check file size (50MB max)
   if (file.size > 50 * 1024 * 1024) {
     throw new Error('File too large');
   }
   ```

10. **Implement CORS properly**
    - Backend already configured for CORS
    - Ensure frontend domain is whitelisted in production

---

## 🎯 MCP Server Integration Checklist

### Setup Requirements

- [ ] Server running on `http://localhost:3003` or production URL
- [ ] MongoDB database connected and accessible
- [ ] Redis cache server running (optional but recommended)
- [ ] Cloudinary account configured with API keys
- [ ] Email service (Hostinger SMTP) configured
- [ ] Environment variables properly set

### Testing Checklist

- [ ] User signup with welcome email
- [ ] User signin and token receipt
- [ ] Get current user info
- [ ] Update user profile
- [ ] Update user avatar
- [ ] Change password
- [ ] Request password reset
- [ ] Verify reset token
- [ ] Reset password with token
- [ ] Create church (admin)
- [ ] Get all churches (with caching)
- [ ] Get single church
- [ ] Update church (owner)
- [ ] Delete church items (owner)
- [ ] Delete church (owner)
- [ ] Upload image to Cloudinary
- [ ] Get pending admin requests (admin)
- [ ] Approve admin request (admin)
- [ ] Revoke admin access (admin)
- [ ] Health check endpoint

### Production Deployment

- [ ] Update `FRONTEND_URL` in environment variables
- [ ] Enable HTTPS
- [ ] Configure production database
- [ ] Set up Redis in production
- [ ] Configure production email service
- [ ] Update CORS whitelist
- [ ] Set up monitoring (health endpoint)
- [ ] Configure backup strategy
- [ ] Set up logging (Winston)
- [ ] Test all endpoints in production
- [ ] Load testing and performance optimization

---

## 📞 Support & Documentation

**Main API Documentation:** `API_REFERENCE_2025.md`  
**Quick Reference:** `API_ROUTES_REFERENCE.md`  
**Email System:** `EMAIL_SYSTEM_GUIDE.md`  
**Postman Collection:** `Saintshub_API.postman_collection.json`

**Server Status:** Check `/health` endpoint  
**Version:** 2.0.0  
**Last Updated:** October 31, 2025

---

**End of MCP Server Integration Guide** 🎉

For GitHub Copilot MCP Server integration, use this documentation as the complete API reference. All endpoints, request/response formats, authentication mechanisms, and error handling are production-ready and tested.
