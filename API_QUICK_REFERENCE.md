# 🎯 SaintsHub API Quick Reference Card

**For React Native Developers - Print & Keep Handy!**

---

## 🔗 Base URL

```
Development: http://localhost:3003
Production:  https://api.saintshub.com
```

---

## 📡 Endpoints Overview

### Authentication (No Auth Required)

| Method | Endpoint | Purpose | Rate Limit |
|--------|----------|---------|-----------|
| POST | `/api/signup` | Register new user | 5/15min |
| POST | `/api/signin` | Login user | 5/15min |
| POST | `/api/password/forgot-password` | Request password reset | 100/15min |
| GET | `/api/password/verify-reset-token/:token` | Verify reset token | 100/15min |
| POST | `/api/password/reset-password` | Reset password | 100/15min |

### User Management (Auth Required)

| Method | Endpoint | Purpose | Admin Only |
|--------|----------|---------|-----------|
| GET | `/api/user` | Get current user | No |
| PUT | `/api/user/update-user` | Update profile | No |
| PUT | `/api/user/update-avatar` | Update avatar | No |
| PUT | `/api/user/update-password` | Change password | No |
| DELETE | `/api/user/delete-account` | Delete account | No |
| POST | `/api/signout` | Logout | No |
| GET | `/api/user/logout` | Logout (alt) | No |

### Admin Routes (Auth + Admin Required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/pending-requests` | Get pending admin requests |
| GET | `/api/admin/all-admins` | Get all admins |
| PUT | `/api/admin/approve/:userId` | Approve user as admin |
| PUT | `/api/admin/revoke/:userId` | Revoke admin access |

### File Management

| Method | Endpoint | Purpose | Rate Limit |
|--------|----------|---------|-----------|
| POST | `/api/upload-file` | Upload to local | 20/15min |
| POST | `/api/upload-file-to-cloud` | Upload to Cloudinary | 20/15min |
| GET | `/api/documents` | Get user's documents | 100/15min |

---

## 🔐 Authentication Header

```javascript
headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...',
  'Content-Type': 'application/json'
}
```

---

## 📝 Common Request Bodies

### Sign Up
```json
{
  "name": "John",
  "surname": "Doe",
  "email": "john@example.com",
  "password": "Pass123!",
  "confirmPassword": "Pass123!",
  "avatar": "https://url.jpg",
  "language": "en",
  "role": "user",
  "selectedChurchId": "",
  "otherChurchName": ""
}
```

### Sign In
```json
{
  "email": "john@example.com",
  "password": "Pass123!"
}
```

### Update Profile
```json
{
  "name": "John",
  "surname": "Smith",
  "email": "new@email.com",
  "language": "fr"
}
```

### Update Password
```json
{
  "currentPassword": "OldPass123!",
  "password": "NewPass456!",
  "confirmPassword": "NewPass456!"
}
```

### Password Reset Request
```json
{
  "email": "john@example.com"
}
```

### Password Reset Confirm
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewPass123!"
}
```

---

## ✅ Success Responses

### Sign Up (201)
```json
{
  "token": "eyJhbGc...",
  "user": {
    "_id": "507f...",
    "name": "John",
    "email": "john@example.com",
    "admin": false,
    "isAdminCandidate": false
  }
}
```

### Sign In (200)
```json
{
  "token": "eyJhbGc...",
  "user": { /* full user object */ }
}
```

### Get User (200)
```json
{
  "_id": "507f...",
  "name": "John",
  "churches": [ /* user's churches */ ],
  "admin": false
}
```

### Update User (200)
```json
{
  "message": "User updated successfully",
  "user": { /* updated user */ }
}
```

### Password Reset Request (200)
```json
{
  "message": "If an account exists with this email, you will receive a password reset link shortly."
}
```

### Password Reset Confirm (200)
```json
{
  "message": "Password reset successful. You can now login with your new password."
}
```

---

## ❌ Common Errors

| Code | Message | What It Means | Action |
|------|---------|---------------|--------|
| 400 | "Please fill in all required fields." | Missing data | Check form inputs |
| 400 | "Passwords do not match." | Password mismatch | Verify passwords match |
| 400 | "Invalid language selected." | Bad language value | Use "en" or "fr" |
| 400 | "Invalid role selected." | Bad role value | Use "user", "pastor", or "it" |
| 401 | "Invalid Email credentials." | Email not found | Check email spelling |
| 401 | "Invalid Password credentials." | Wrong password | Check password |
| 401 | "Unauthorized" | Token missing/invalid | Re-authenticate |
| 403 | "Forbidden - Admin access required" | Not admin | User doesn't have permission |
| 404 | "User not found." | User doesn't exist | User may be deleted |
| 409 | "User already exists." | Email taken | Use different email |
| 429 | "Too many requests..." | Rate limited | Wait 15 minutes |
| 500 | "Server error." | Server issue | Try again later |

---

## 🚦 Rate Limits

| Route Type | Limit | Window |
|-----------|-------|--------|
| All API routes | 100 req | 15 min |
| Auth (signup/signin) | 5 req | 15 min |
| Uploads | 20 req | 15 min |

**Headers:**
- `X-RateLimit-Limit`: Max requests
- `X-RateLimit-Remaining`: Requests left
- `X-RateLimit-Reset`: Reset timestamp

---

## 📧 Email Triggers

| Event | Email(s) Sent |
|-------|--------------|
| User signup (any) | Welcome email |
| Pastor/IT signup | Welcome + Admin Request Pending |
| Password reset | Reset link email (1hr expiry) |
| Admin approval | Admin Approved email |

**Sender:** saintshub@gedeonchrist.com

---

## 🎨 User Roles

| Role | Value | Admin Candidate | Notes |
|------|-------|-----------------|-------|
| Regular User | `"user"` | No | Standard access |
| Pastor | `"pastor"` | Yes | Needs admin approval |
| IT Admin | `"it"` | Yes | Needs admin approval |

---

## 🌍 Languages

| Language | Code |
|----------|------|
| English | `"en"` |
| French | `"fr"` |

---

## 🔑 Token Lifespans

| Token Type | Duration |
|-----------|----------|
| Signup JWT | 1 hour |
| Signin JWT | 5 hours |
| Password Reset | 1 hour |

---

## 📱 React Native Code Snippets

### Fetch with Auth
```javascript
const token = await AsyncStorage.getItem('userToken');

const response = await fetch(`${API_URL}/api/user`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Handle Errors
```javascript
if (!response.ok) {
  const data = await response.json();
  
  if (response.status === 401) {
    // Redirect to login
    await AsyncStorage.removeItem('userToken');
    navigation.navigate('Login');
  }
  
  throw new Error(data.message || 'Request failed');
}
```

### Upload File
```javascript
const formData = new FormData();
formData.append('file', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'photo.jpg'
});

const response = await fetch(`${API_URL}/api/upload-file-to-cloud`, {
  method: 'POST',
  body: formData,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

---

## 🛠️ Validation Rules

### Password
- Min 8 characters
- Must have uppercase
- Must have lowercase
- Must have number

### Email
- Valid email format
- Unique (not already registered)

### Required Fields (Signup)
- name
- surname
- email
- password
- confirmPassword
- avatar
- language
- role

---

## 🎯 Testing Checklist

**Authentication:**
- [ ] Sign up with valid data
- [ ] Sign up with existing email (409)
- [ ] Sign in with valid credentials
- [ ] Sign in with wrong password (401)
- [ ] Access protected route without token (401)
- [ ] Logout invalidates token

**Password Reset:**
- [ ] Request reset email
- [ ] Verify valid token
- [ ] Verify expired token (400)
- [ ] Reset password successfully

**Profile Management:**
- [ ] Update user profile
- [ ] Update avatar
- [ ] Change password
- [ ] Delete account

**Admin:**
- [ ] Get pending requests (admin only)
- [ ] Approve user (admin only)
- [ ] Access as non-admin (403)

---

## 📞 Quick Help

**Full Documentation:** `FRONTEND_API_DOCUMENTATION.md`

**Server Location:** `C:\Users\nzemb\OneDrive\Documents\Web Development\Projects\saintshub-dashboard-server-main`

**React Native App:** `C:\Users\nzemb\Documents\saintshub-v3\saintshub`

---

**Print this card and keep it next to your keyboard! 📌**

**Last Updated:** October 23, 2025
