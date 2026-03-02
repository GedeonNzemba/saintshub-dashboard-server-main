# 🧪 Postman Testing Guide - Saintshub Dashboard Server

## 📋 Table of Contents
1. [Setup](#setup)
2. [Base URL](#base-url)
3. [Authentication Flow](#authentication-flow)
4. [API Endpoints](#api-endpoints)
5. [Test Scenarios](#test-scenarios)

---

## 🔧 Setup

### Postman Environment Variables
Create a new environment in Postman with these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `http://localhost:3003` | `http://localhost:3003` |
| `token` | _(empty)_ | _(will be set after login)_ |
| `user_id` | _(empty)_ | _(will be set after login)_ |
| `church_id` | _(empty)_ | _(will be set after creating church)_ |

---

## 🌐 Base URL

**Local Development:**
```
http://localhost:3003
```

**With ngrok (for mobile testing):**
```
https://your-ngrok-url.ngrok-free.app
```

---

## 🔐 Authentication Flow

### Step 1: Sign Up a New User

**Endpoint:** `POST {{base_url}}/api/signup`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "John",
  "surname": "Doe",
  "email": "john.doe@example.com",
  "password": "TestPassword123!",
  "confirmPassword": "TestPassword123!",
  "avatar": "https://randomuser.me/api/portraits/men/1.jpg",
  "language": "en",
  "role": "user",
  "selectedChurchId": "",
  "otherChurchName": ""
}
```

**Role Options:**
- `"user"` - Regular user (no admin privileges)
- `"pastor"` - Pastor (becomes admin candidate, triggers admin notification email)
- `"it"` - IT role (becomes admin candidate, triggers admin notification email)

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
      "public_id": "uuid-here",
      "url": "https://randomuser.me/api/portraits/men/1.jpg"
    },
    "language": "en",
    "admin": false,
    "isAdminCandidate": false
  }
}
```

**Postman Test Script:**
```javascript
// Save token to environment
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("token", response.token);
    pm.environment.set("user_id", response.user._id);
    console.log("Token saved:", response.token);
}
```

---

### Step 2: Sign In (Existing User)

**Endpoint:** `POST {{base_url}}/api/signin`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "john.doe@example.com",
  "password": "TestPassword123!"
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
    "password": "$2b$10$...",
    "admin": false,
    "avatar": {
      "public_id": "uuid",
      "url": "https://..."
    },
    "language": "en",
    "isAdminCandidate": false,
    "createdAt": "2025-10-19T10:00:00.000Z",
    "updatedAt": "2025-10-19T10:00:00.000Z"
  }
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.token);
    pm.environment.set("user_id", response.user._id);
}
```

---

## 📡 API Endpoints

### 🔒 Protected Endpoints
All protected endpoints require the JWT token in the Authorization header:

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

---

## 👤 User Management Endpoints

### 1. Get Current User

**Endpoint:** `GET {{base_url}}/api/user`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John",
  "surname": "Doe",
  "email": "john.doe@example.com",
  "admin": false,
  "avatar": {
    "public_id": "uuid",
    "url": "https://..."
  },
  "language": "en",
  "isAdminCandidate": false,
  "createdAt": "2025-10-19T10:00:00.000Z",
  "updatedAt": "2025-10-19T10:00:00.000Z"
}
```

---

### 2. Update User Info

**Endpoint:** `PUT {{base_url}}/api/user/update-user`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "John Updated",
  "surname": "Doe Updated",
  "email": "john.updated@example.com"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Updated",
  "surname": "Doe Updated",
  "email": "john.updated@example.com",
  "avatar": { ... },
  "language": "en",
  ...
}
```

---

### 3. Update User Avatar

**Endpoint:** `PUT {{base_url}}/api/user/update-avatar`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "avatar": {
    "public_id": "new-uuid",
    "url": "https://new-avatar-url.com/image.jpg"
  }
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "avatar": {
    "public_id": "new-uuid",
    "url": "https://new-avatar-url.com/image.jpg"
  },
  ...
}
```

---

### 4. Update Password

**Endpoint:** `PUT {{base_url}}/api/user/update-password`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password has been updated !",
  "user": { ... }
}
```

---

### 5. Logout

**Endpoint:** `GET {{base_url}}/api/user/logout`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

---

### 6. Sign Out (Clear Cookie)

**Endpoint:** `POST {{base_url}}/api/signout`

**Response (200 OK):**
```json
{
  "message": "Sign-out successful."
}
```

---

## 🏛️ Church Management Endpoints

### 1. Create a Church

**Endpoint:** `POST {{base_url}}/api/dashboard/create-church`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Grace Community Church",
  "principal": {
    "pastor": "Pastor David Smith",
    "wife": "Sarah Smith",
    "image": "https://example.com/pastor.jpg",
    "description": "Leading our community in faith for 15 years"
  },
  "location": "123 Main Street, New York, NY 10001",
  "image": "https://example.com/church-main.jpg",
  "banner": [
    "https://example.com/banner1.jpg",
    "https://example.com/banner2.jpg"
  ],
  "securities": {
    "deacons": [
      {
        "names": "Michael Johnson",
        "descriptions": "Head Deacon, serving since 2015",
        "image": "https://example.com/deacon1.jpg"
      }
    ],
    "trustees": [
      {
        "names": "Robert Williams",
        "descriptions": "Financial oversight and property management",
        "image": "https://example.com/trustee1.jpg"
      }
    ]
  },
  "oldServices": [
    {
      "title": "Easter Sunday Service 2024",
      "preacher": "Pastor David Smith",
      "sermon": "The Power of Resurrection"
    }
  ],
  "liveServices": [
    {
      "title": "Sunday Morning Worship",
      "preacher": "Pastor David Smith",
      "sermon": "Walking in Faith"
    }
  ],
  "gallery": [
    "https://example.com/gallery1.jpg",
    "https://example.com/gallery2.jpg",
    "https://example.com/gallery3.jpg"
  ],
  "songs": [
    {
      "title": "Amazing Grace",
      "songUrl": "https://example.com/songs/amazing-grace.mp3"
    },
    {
      "title": "How Great Thou Art",
      "songUrl": "https://example.com/songs/how-great.mp3"
    }
  ],
  "logo": "https://example.com/church-logo.png",
  "user": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "_id": "507f1f77bcf86cd799439011",
    "image": "https://example.com/user.jpg"
  }
}
```

**Response (201 Created):**
```json
{
  "_id": "507f191e810c19729de860ea",
  "name": "Grace Community Church",
  "principal": { ... },
  "location": "123 Main Street, New York, NY 10001",
  ...
  "createdAt": "2025-10-19T10:00:00.000Z"
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("church_id", response._id);
    console.log("Church ID saved:", response._id);
}
```

---

### 2. Get All Churches (Protected)

**Endpoint:** `GET {{base_url}}/api/dashboard/churches`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200 OK):**
```json
[
  {
    "_id": "507f191e810c19729de860ea",
    "name": "Grace Community Church",
    "principal": { ... },
    "location": "123 Main Street, New York, NY 10001",
    ...
  },
  {
    "_id": "507f191e810c19729de860eb",
    "name": "Faith Baptist Church",
    ...
  }
]
```

---

### 3. Get Public Church List (No Auth)

**Endpoint:** `GET {{base_url}}/api/dashboard/public/churches`

**No headers required**

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

**Endpoint:** `GET {{base_url}}/api/dashboard/church/{{church_id}}`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200 OK):**
```json
{
  "_id": "507f191e810c19729de860ea",
  "name": "Grace Community Church",
  "principal": {
    "pastor": "Pastor David Smith",
    "wife": "Sarah Smith",
    "image": "https://...",
    "description": "..."
  },
  "location": "123 Main Street, New York, NY 10001",
  ...
}
```

---

### 5. Update Church Field

**Endpoint:** `PATCH {{base_url}}/api/dashboard/churches/{{church_id}}/name`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Grace Community Church - Updated"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f191e810c19729de860ea",
  "name": "Grace Community Church - Updated",
  ...
}
```

**Other fields you can update:**
- `/churches/:id/principal`
- `/churches/:id/location`
- `/churches/:id/image`
- `/churches/:id/banner`
- `/churches/:id/securities`
- `/churches/:id/oldServices`
- `/churches/:id/liveServices`
- `/churches/:id/gallery`
- `/churches/:id/songs`
- `/churches/:id/logo`

---

### 6. Update Full Church

**Endpoint:** `PATCH {{base_url}}/api/dashboard/churches/{{church_id}}`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Updated Church Name",
  "location": "New Address",
  "image": "https://new-image.com/church.jpg"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f191e810c19729de860ea",
  "name": "Updated Church Name",
  "location": "New Address",
  "image": "https://new-image.com/church.jpg",
  ...
}
```

---

### 7. Delete Church

**Endpoint:** `DELETE {{base_url}}/api/dashboard/church/{{church_id}}`

**Response (200 OK):**
```json
{
  "message": "Church deleted successfully"
}
```

---

### 8. Delete Gallery Image

**Endpoint:** `DELETE {{base_url}}/api/dashboard/churches/{{church_id}}/gallery/0`

Replace `0` with the index of the image to delete.

**Response (200 OK):**
```json
{
  "message": "Image deleted successfully"
}
```

---

### 9. Delete Banner Image

**Endpoint:** `DELETE {{base_url}}/api/dashboard/churches/{{church_id}}/banner/0`

**Response (200 OK):**
```json
{
  "message": "Image deleted successfully"
}
```

---

### 10. Delete Past Service

**Endpoint:** `DELETE {{base_url}}/api/dashboard/churches/{{church_id}}/past-service/0`

**Response (200 OK):**
```json
{
  "message": "Service deleted successfully"
}
```

---

### 11. Delete Deacon

**Endpoint:** `DELETE {{base_url}}/api/dashboard/churches/{{church_id}}/deacon/0`

**Response (200 OK):**
```json
{
  "message": "deacon deleted successfully"
}
```

---

### 12. Delete Trustee

**Endpoint:** `DELETE {{base_url}}/api/dashboard/churches/{{church_id}}/trustee/0`

**Response (200 OK):**
```json
{
  "message": "trustee deleted successfully"
}
```

---

### 13. Delete Song

**Endpoint:** `DELETE {{base_url}}/api/dashboard/churches/{{church_id}}/song/0`

**Response (200 OK):**
```json
{
  "message": "song deleted successfully"
}
```

---

### 14. Delete Live Service

**Endpoint:** `DELETE {{base_url}}/api/dashboard/churches/{{church_id}}/live/0`

**Response (200 OK):**
```json
{
  "message": "Live Service deleted successfully"
}
```

---

## 📄 Document Endpoints

### Get All Documents

**Endpoint:** `GET {{base_url}}/api/documents`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Church Constitution",
    "url": "https://example.com/documents/constitution.pdf"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Annual Report 2024",
    "url": "https://example.com/documents/report-2024.pdf"
  }
]
```

---

## 📤 File Upload Endpoints

### 1. Upload File to Cloudinary

**Endpoint:** `POST {{base_url}}/api/upload-file-to-cloud`

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (form-data):**
- Key: `profileImage`
- Type: File
- Value: Select an image file

**Response (200 OK):**
```json
{
  "result": {
    "public_id": "logo",
    "version": 1697712000,
    "signature": "...",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "resource_type": "image",
    "created_at": "2025-10-19T10:00:00Z",
    "tags": [],
    "bytes": 245678,
    "type": "upload",
    "etag": "...",
    "placeholder": false,
    "url": "http://res.cloudinary.com/ddbiofmni/image/upload/v1697712000/logo.jpg",
    "secure_url": "https://res.cloudinary.com/ddbiofmni/image/upload/v1697712000/logo.jpg",
    ...
  }
}
```

---

### 2. Upload File Locally

**Endpoint:** `POST {{base_url}}/api/upload-file`

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (form-data):**
- Key: `image` (or any field name)
- Type: File
- Value: Select a file

**Response (200 OK):**
```json
{
  "ok": true
}
```

---

## 🌟 Special Endpoints

### Get Verse of the Day

**Endpoint:** `GET {{base_url}}/verse-of-the-day`

**No headers required**

**Response (200 OK):**
```html
<html>
  <head>
    <title>Hello</title>
    <style></style>
  </head>
  <body>
    <!-- Bible verse HTML content -->
  </body>
</html>
```

---

## 🧪 Test Scenarios

### Test Scenario 1: Complete User Flow

1. **Sign Up** a new user (role: "user")
2. **Sign In** with the new credentials
3. **Get User** info to verify login
4. **Update User** name and email
5. **Update Password**
6. **Logout**

---

### Test Scenario 2: Church Management Flow

1. **Sign In** as admin/pastor
2. **Create Church** with full details
3. **Get All Churches** to verify creation
4. **Get Single Church** by ID
5. **Update Church** name and location
6. **Add Images** to gallery (using update endpoint)
7. **Delete Gallery Image** by index
8. **Delete Church**

---

### Test Scenario 3: Authentication Testing

**Test Invalid Login:**
```json
{
  "email": "wrong@example.com",
  "password": "wrongpassword"
}
```
Expected: 401 Unauthorized

**Test Missing Fields:**
```json
{
  "email": "test@example.com"
}
```
Expected: 400 Bad Request

**Test Protected Endpoint Without Token:**
- Remove Authorization header
- Try to access `GET /api/user`
- Expected: 401 Unauthorized

---

### Test Scenario 4: Pastor/IT Role Flow

1. **Sign Up** with role: "pastor" or "it"
2. Check `isAdminCandidate: true` in response
3. Verify admin notification email would be sent
4. User should NOT have `admin: true` yet (requires manual verification)

---

## 📊 Expected Error Responses

### 400 Bad Request
```json
{
  "message": "Please fill in all required fields."
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized."
}
```

### 404 Not Found
```json
{
  "message": "User not found."
}
```
or
```json
{
  "error": "Church not found"
}
```

### 409 Conflict
```json
{
  "message": "User already exists."
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error."
}
```
or
```json
{
  "error": "Internal Server Error"
}
```

---

## 💡 Tips for Testing

1. **Use Environment Variables:** Store `token`, `user_id`, and `church_id` in Postman environment
2. **Test Scripts:** Add the provided JavaScript snippets to automatically save tokens
3. **Collections:** Organize endpoints into folders (Authentication, User Management, Church Management)
4. **Pre-request Scripts:** Auto-add Authorization header:
   ```javascript
   pm.request.headers.add({
       key: 'Authorization',
       value: 'Bearer ' + pm.environment.get('token')
   });
   ```
5. **Test Database State:** After deletions, verify with GET requests
6. **Language Testing:** Test both `"en"` and `"fr"` language options
7. **File Uploads:** Use actual image files for upload testing

---

## 🚀 Quick Start Checklist

- [ ] Server running on `http://localhost:3003`
- [ ] MongoDB connected
- [ ] Postman installed
- [ ] Environment created with `base_url` variable
- [ ] Sign up a test user
- [ ] Token saved to environment
- [ ] Test protected endpoints
- [ ] Create a test church
- [ ] Test CRUD operations
- [ ] Test file uploads
- [ ] Test error scenarios

---

## 📝 Notes

- **JWT Expiration:** Tokens expire after 1h (signup) or 5h (signin). Re-login if you get 401 errors.
- **Database:** Uses MongoDB Atlas (connection string in `src/utils/db.ts`)
- **Cloudinary:** Images uploaded to `ddbiofmni` cloud
- **Email:** Emails are sent via Mailtrap (check your .env configuration)
- **CORS:** Currently allows all origins (`app.use(cors())`)

---

**Happy Testing! 🎉**

If you encounter any issues, check:
1. Server console for errors
2. MongoDB connection status
3. Environment variables are set correctly
4. Token is valid and not expired
