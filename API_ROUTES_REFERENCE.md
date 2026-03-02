# 📚 SaintsHub API Routes Reference

Complete reference for all available API endpoints in the SaintsHub Dashboard Server.

**Base URL:** `http://localhost:3003`

---

## 🔐 Authentication & User Management

### User Registration & Login

#### **POST** `/api/signup`
Create a new user account. Automatically sends:
- Welcome email to all users
- Admin request pending email (for Pastor/IT roles)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "1234567890",
  "role": "user",  // Options: "user", "pastor", "it"
  "preferredLanguage": "en"  // Optional: "en" or "fr"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": "507f1f77bcf86cd799439011",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Emails Sent:**
- ✅ Welcome email to user
- ✅ Admin request pending email (if role is "pastor" or "it")

---

#### **POST** `/api/signin`
Authenticate an existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "admin": false,
    "role": "user"
  }
}
```

---

#### **POST** `/api/signout`
Log out the current user. **Requires authentication.**

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

---

### User Profile Management

#### **GET** `/api/user`
Get current user information. **Requires authentication.**

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "admin": false,
  "role": "user",
  "preferredLanguage": "en",
  "avatar": "https://cloudinary.com/..."
}
```

---

#### **PUT** `/api/user/update-user`
Update user profile information. **Requires authentication.**

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "9876543210",
  "preferredLanguage": "fr"
}
```

**Response:**
```json
{
  "message": "User updated successfully",
  "user": { /* updated user object */ }
}
```

---

#### **PUT** `/api/user/update-avatar`
Update user profile picture. **Requires authentication.**

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
avatar: [image file]
```

**Response:**
```json
{
  "message": "Avatar updated successfully",
  "avatarUrl": "https://cloudinary.com/..."
}
```

---

#### **PUT** `/api/user/update-password`
Change user password. **Requires authentication.**

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

---

#### **DELETE** `/api/user/delete-account`
Permanently delete user account. **Requires authentication.**

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "message": "Account deleted successfully"
}
```

---

## 🔑 Password Reset

#### **POST** `/api/password/forgot-password`
Request a password reset email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset email sent. Please check your inbox."
}
```

**Email Sent:**
- ✅ Password reset email with secure token link

---

#### **GET** `/api/password/verify-reset-token/:token`
Verify if a password reset token is valid.

**URL Parameter:**
- `token`: The reset token from the email link

**Example:**
```
GET /api/password/verify-reset-token/a1b2c3d4e5f6...
```

**Response (Valid):**
```json
{
  "valid": true,
  "message": "Token is valid"
}
```

**Response (Invalid/Expired):**
```json
{
  "valid": false,
  "message": "Invalid or expired reset token"
}
```

---

#### **POST** `/api/password/reset-password`
Reset password using the token from email.

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f6...",
  "newPassword": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "message": "Password reset successful. You can now login with your new password."
}
```

---

## 👑 Admin Management

**Note:** All admin routes require authentication + admin privileges.

#### **GET** `/api/admin/pending-requests`
Get list of users requesting admin access. **Requires admin.**

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Response:**
```json
{
  "pendingRequests": [
    {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "Pastor",
      "lastName": "Smith",
      "email": "pastor@example.com",
      "role": "pastor",
      "createdAt": "2025-10-22T10:30:00Z"
    }
  ]
}
```

---

#### **GET** `/api/admin/all-admins`
Get list of all users with admin privileges. **Requires admin.**

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Response:**
```json
{
  "admins": [
    {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Admin",
      "email": "admin@example.com",
      "role": "Admin",
      "admin": true
    }
  ]
}
```

---

#### **PUT** `/api/admin/approve/:userId`
Approve a user's admin request. **Requires admin.**

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameter:**
- `userId`: The ID of the user to approve

**Example:**
```
PUT /api/admin/approve/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "message": "User approved as admin successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "admin": true,
    "role": "Pastor"
  }
}
```

**Email Sent:**
- ✅ Admin approved email to the user

---

#### **PUT** `/api/admin/revoke/:userId`
Revoke a user's admin privileges. **Requires admin.**

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameter:**
- `userId`: The ID of the user whose admin access to revoke

**Example:**
```
PUT /api/admin/revoke/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "message": "Admin privileges revoked successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "admin": false
  }
}
```

---

## 📁 File Management

#### **POST** `/api/upload-file`
Upload a file to local storage. **Rate limited: 20 uploads per 15 minutes.**

**Headers:**
```
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
file: [file to upload]
```

**Response:**
```json
{
  "ok": true
}
```

---

#### **POST** `/api/upload-file-to-cloud`
Upload a file to Cloudinary. **Rate limited: 20 uploads per 15 minutes.**

**Headers:**
```
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
file: [file to upload]
```

**Response:**
```json
{
  "url": "https://res.cloudinary.com/...",
  "public_id": "file_12345",
  "secure_url": "https://res.cloudinary.com/..."
}
```

---

#### **GET** `/api/documents`
Get user's uploaded documents. **Requires authentication.**

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "documents": [
    {
      "id": "507f1f77bcf86cd799439011",
      "filename": "document.pdf",
      "url": "https://cloudinary.com/...",
      "uploadedAt": "2025-10-22T10:30:00Z"
    }
  ]
}
```

---

## 📊 Dashboard

#### **GET** `/api/dashboard/stats`
Get dashboard statistics. **Requires authentication.**

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "totalUsers": 1250,
  "totalDocuments": 3400,
  "activeUsers": 890,
  "storageUsed": "45.2 GB"
}
```

---

## 🏥 Health Check

#### **GET** `/health`
Check if the server is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-22T10:30:00Z",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected",
  "email": "configured"
}
```

---

## 📧 Email System Integration

### Automatic Email Triggers

The following emails are sent automatically:

| Action | Endpoint | Emails Sent |
|--------|----------|-------------|
| User signup (regular) | `POST /api/signup` | 1. Welcome email |
| User signup (Pastor/IT) | `POST /api/signup` | 1. Welcome email<br>2. Admin request pending |
| Password reset request | `POST /api/password/forgot-password` | Password reset email |
| Admin approval | `PUT /api/admin/approve/:userId` | Admin approved email |
| Profile update | `PUT /api/user/update-user` | Profile update confirmation |
| Security alert | (Triggered by system) | Security alert email |

---

## 🔒 Rate Limiting

Rate limits are applied to prevent abuse:

| Route Pattern | Limit | Window |
|--------------|-------|--------|
| `/api/*` | 100 requests | 15 minutes |
| `/api/signup`, `/api/signin` | 5 requests | 15 minutes |
| `/api/upload-*` | 20 requests | 15 minutes |

**Rate Limit Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when the limit resets

---

## 🧪 Testing Examples

### 1. Complete User Registration Flow

```bash
# 1. Sign up as a Pastor
curl -X POST http://localhost:3003/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Pastor",
    "lastName": "John",
    "email": "pastor@example.com",
    "password": "SecurePass123!",
    "phone": "1234567890",
    "role": "pastor"
  }'

# Expected emails: Welcome + Admin Request Pending
```

### 2. Password Reset Flow

```bash
# 1. Request password reset
curl -X POST http://localhost:3003/api/password/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pastor@example.com"
  }'

# 2. Check email for reset link
# 3. Verify token (optional)
curl http://localhost:3003/api/password/verify-reset-token/YOUR_TOKEN

# 4. Reset password
curl -X POST http://localhost:3003/api/password/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN",
    "newPassword": "NewSecurePass456!"
  }'
```

### 3. Admin Approval Flow

```bash
# 1. Admin logs in
curl -X POST http://localhost:3003/api/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@saintshub.com",
    "password": "AdminPass123!"
  }'

# 2. Get pending requests
curl http://localhost:3003/api/admin/pending-requests \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 3. Approve a user
curl -X PUT http://localhost:3003/api/admin/approve/USER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Expected email: Admin Approved
```

---

## 🛠️ Environment Variables Required

Make sure these are set in your `.env` file:

```env
# Server
PORT=3003
NODE_ENV=development
JWT_SECRET=your-secret-key

# Database
MONGODB_URI=mongodb://localhost:27017/saintshub

# Email (Hostinger SMTP)
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_USER=saintshub@gedeonchrist.com
EMAIL_PASS="M#deon@102030"
EMAIL_SECURE=true
EMAIL_FROM_NOREPLY="SaintsHub <noreply@saintshub.com>"
EMAIL_FROM_ADMIN="SaintsHub Admin <admin@saintshub.com>"

# Frontend
FRONTEND_URL=http://localhost:3000

# Branding
BRAND_LOGO_URL=https://your-logo-url.com/logo.png
BRAND_COLOR_PRIMARY=#6366f1
BRAND_COLOR_SECONDARY=#4f46e5

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 📝 Notes

- All authenticated routes require a valid JWT token in the `Authorization` header
- Admin routes require both authentication AND admin privileges
- Password must be at least 8 characters with uppercase, lowercase, and number
- Email addresses must be unique
- File uploads are limited to 50MB
- Images are automatically optimized when uploaded to Cloudinary
- All emails are sent using beautiful responsive HTML templates

---

## 🚀 Quick Start Testing

```bash
# 1. Start the server
npm run dev

# 2. Test signup
curl -X POST http://localhost:3003/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "Test123!",
    "phone": "1234567890",
    "role": "user"
  }'

# 3. Check your email for the welcome message!
```

---

**Last Updated:** October 22, 2025  
**Server Version:** 1.0.0  
**Documentation:** Complete ✅
