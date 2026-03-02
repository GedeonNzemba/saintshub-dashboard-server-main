# 🚀 SaintsHub API - Production Reference for React Native

**Last Updated:** October 23, 2025  
**Backend Repository:** `saintshub-dashboard-server-main`  
**API Documentation Location:** Same repository, root directory

---

## 📍 Production API Information

### Live API Base URL
```
https://saintshub-dashboard-server-main.onrender.com
```

### Health Check Endpoint
```
GET https://saintshub-dashboard-server-main.onrender.com/health
```

**Status:** ✅ LIVE and OPERATIONAL
- MongoDB: Connected
- Redis: Connected  
- Email Service: Configured (Hostinger SMTP)
- Uptime: Monitored via Render Dashboard

---

## 📚 Complete Documentation Files

**All documentation is located in the backend repository:**

```
C:\Users\nzemb\OneDrive\Documents\Web Development\Projects\saintshub-dashboard-server-main\
```

### Main Documentation Files (10 total)

| File | Purpose | Size |
|------|---------|------|
| **FRONTEND_API_DOCUMENTATION.md** | Complete API reference for all 18 endpoints | ~15,000 words |
| **REACT_NATIVE_INTEGRATION_GUIDE.md** | Step-by-step React Native integration | ~8,000 words |
| **API_QUICK_REFERENCE.md** | Quick lookup card with tables | ~2,000 words |
| **API_ROUTES_REFERENCE.md** | All routes with cURL examples | ~5,000 words |
| **README_DOCUMENTATION.md** | Master index and navigation | ~1,000 words |
| **EMAIL_SYSTEM_GUIDE.md** | Email implementation details | ~3,000 words |
| **EMAIL_QUICK_REFERENCE.md** | Email functions reference | ~1,000 words |
| **EMAIL_CONFIGURATION_FIX.md** | SMTP troubleshooting | ~2,000 words |
| **RENDER_DEPLOYMENT.md** | Deployment guide (Render.com) | ~5,000 words |
| **DEPLOYMENT_GUIDE.md** | Multi-platform deployment | ~5,000 words |

**Total Documentation:** ~46,000 words

---

## 🎯 Quick Start - Essential Information

### API Configuration for React Native

**File to create: `src/config/api.js`**

```javascript
import Constants from 'expo-constants';

const ENV = {
  dev: {
    apiUrl: 'http://localhost:3003',
    debug: true,
  },
  prod: {
    apiUrl: 'https://saintshub-dashboard-server-main.onrender.com',
    debug: false,
  },
};

const getEnvVars = () => {
  if (__DEV__) {
    return ENV.dev;
  }
  return ENV.prod;
};

export default getEnvVars();
```

---

## 📋 All 18 API Endpoints Summary

### Authentication Routes (`/api`)

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/signup` | Register new user | No |
| POST | `/api/signin` | Login user | No |
| POST | `/api/signout` | Logout user | Yes |
| GET | `/api/user` | Get current user profile | Yes |

### User Management Routes (`/api/user`)

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| PUT | `/api/user/update-user` | Update profile info | Yes |
| PUT | `/api/user/update-avatar` | Update avatar image | Yes |
| PUT | `/api/user/update-password` | Change password | Yes |
| DELETE | `/api/user/delete-account` | Delete account | Yes |

### Password Reset Routes (`/api/password`)

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/password/forgot-password` | Request reset link | No |
| POST | `/api/password/reset-password` | Reset with token | No |
| GET | `/api/password/verify-reset-token/:token` | Verify token validity | No |

### Admin Management Routes (`/api/admin`)

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/admin/pending-requests` | Get pending admin requests | Admin only |
| GET | `/api/admin/all-admins` | Get all admin users | Admin only |
| PUT | `/api/admin/approve/:userId` | Approve admin request | Admin only |
| PUT | `/api/admin/revoke/:userId` | Revoke admin privileges | Admin only |

### Dashboard Routes (`/api/dashboard`)

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/dashboard/overview` | Get dashboard stats | Yes |
| POST | `/api/dashboard/upload` | Upload files | Yes |
| GET | `/api/dashboard/files` | Get user files | Yes |

---

## 🔑 Authentication Flow

### 1. Signup Request

```javascript
POST https://saintshub-dashboard-server-main.onrender.com/api/signup

Body:
{
  "name": "John",
  "surname": "Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "avatar": "https://example.com/avatar.jpg",
  "language": "en",
  "role": "user", // or "pastor" or "it"
  "selectedChurchId": "", // Optional
  "otherChurchName": "" // Optional
}

Response:
{
  "success": true,
  "message": "User registered successfully! Welcome email sent.",
  "user": {
    "id": "...",
    "name": "John",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "eyJhbGc..."
}
```

### 2. Signin Request

```javascript
POST https://saintshub-dashboard-server-main.onrender.com/api/signin

Body:
{
  "email": "john@example.com",
  "password": "Password123!"
}

Response:
{
  "success": true,
  "message": "Signin successful",
  "user": { /* user object */ },
  "token": "eyJhbGc..."
}
```

### 3. Using the Token

**All authenticated requests require:**

```javascript
Headers:
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

---

## 🛡️ Error Handling

### Standard Error Response Format

```javascript
{
  "success": false,
  "message": "Error description",
  "error": "Technical error details" // Only in development
}
```

### Common HTTP Status Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 200 | Success | Request completed successfully |
| 201 | Created | New resource created |
| 400 | Bad Request | Invalid input/validation failed |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry (email exists) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Backend issue |

---

## 📧 Email System Features

### Automatic Emails Sent

1. **Welcome Email** - After successful signup (all users)
2. **Admin Request Pending** - After signup with Pastor/IT role
3. **Admin Approved** - When admin approves request
4. **Password Reset** - When user requests password reset
5. **Profile Update** - When user updates profile info
6. **Security Alert** - For important security events

### Email Configuration
- **Provider:** Hostinger SMTP
- **Sender:** saintshub@gedeonchrist.com
- **Display Names:** "SaintsHub" or "SaintsHub Admin"
- **Templates:** Responsive HTML with Indigo gradient theme

---

## 🔐 Password Requirements

### Validation Rules

```javascript
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)
```

### Example Valid Passwords
- `Password123!`
- `MyP@ssw0rd`
- `Secure#Pass1`

---

## 👤 User Roles

| Role | Access Level | Requires Approval |
|------|--------------|-------------------|
| **user** | Basic access | No |
| **pastor** | Admin access | Yes - pending approval |
| **it** | Admin access | Yes - pending approval |
| **admin** | Full access | Granted after approval |

### Role Workflow

1. User signs up with role: `pastor` or `it`
2. Admin receives notification email
3. Admin approves via: `PUT /api/admin/approve/:userId`
4. User receives approval email
5. User role updated to: `admin`

---

## 📱 React Native Service Layer (Quick Copy)

### Complete API Service Example

```javascript
// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/api';

const api = axios.create({
  baseURL: config.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - logout user
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Authentication Service

```javascript
// src/services/authService.js
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  // Signup
  async signup(userData) {
    const response = await api.post('/api/signup', userData);
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Signin
  async signin(email, password) {
    const response = await api.post('/api/signin', { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Signout
  async signout() {
    await api.post('/api/signout');
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  },

  // Get current user
  async getCurrentUser() {
    const response = await api.get('/api/user');
    return response.data;
  },

  // Forgot password
  async forgotPassword(email) {
    const response = await api.post('/api/password/forgot-password', { email });
    return response.data;
  },

  // Reset password
  async resetPassword(token, newPassword) {
    const response = await api.post('/api/password/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },
};
```

---

## 🔗 Important Links

### Production URLs
- **API Base:** https://saintshub-dashboard-server-main.onrender.com
- **Health Check:** https://saintshub-dashboard-server-main.onrender.com/health
- **Render Dashboard:** https://dashboard.render.com

### MongoDB Atlas
- **Cluster:** cluster0.4fqga.mongodb.net
- **Database:** saintsHub
- **Connection:** Configured in Render environment variables

### Cloudinary
- **Cloud Name:** ddbiofmni
- **Upload Endpoint:** Configured in backend
- **Usage:** File uploads (avatars, documents)

### Redis Cloud
- **Host:** redis-19140.c57.us-east-1-4.ec2.redns.redis-cloud.com:19140
- **Usage:** Token blacklist, caching

---

## 📊 Rate Limiting

### Limits per IP Address (15-minute window)

| Route Category | Requests | Time Window |
|----------------|----------|-------------|
| General API | 100 | 15 minutes |
| Authentication | 5 | 15 minutes |
| Password Reset | 3 | 15 minutes |
| File Upload | 10 | 15 minutes |

### Rate Limit Headers

Response headers include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698075600
```

### Handling 429 Errors

```javascript
if (error.response?.status === 429) {
  const resetTime = error.response.headers['x-ratelimit-reset'];
  const waitTime = resetTime - Math.floor(Date.now() / 1000);
  // Show user: "Too many requests. Try again in {waitTime} seconds"
}
```

---

## 🧪 Testing Endpoints

### Using cURL (PowerShell)

```powershell
# Health Check
curl https://saintshub-dashboard-server-main.onrender.com/health

# Signup
curl -X POST https://saintshub-dashboard-server-main.onrender.com/api/signup `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test\",\"surname\":\"User\",\"email\":\"test@example.com\",\"password\":\"Test123!\",\"confirmPassword\":\"Test123!\",\"avatar\":\"https://randomuser.me/api/portraits/men/1.jpg\",\"language\":\"en\",\"role\":\"user\"}'

# Signin
curl -X POST https://saintshub-dashboard-server-main.onrender.com/api/signin `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\"}'
```

---

## 🎨 Brand Assets

### Colors
- **Primary:** `#6366f1` (Indigo)
- **Secondary:** `#4f46e5` (Darker Indigo)

### Logo
```
https://res.cloudinary.com/locataire/image/upload/v1744489734/Screenshot_2025-04-12_222728_i2fm7v.png
```

### URLs
- **Website:** https://www.gedeonchrist.com/saintshub
- **App:** https://app.saintshub.com
- **Dashboard:** https://admin.saintshub.com

---

## 🔍 Where to Find More Details

### For Complete Endpoint Details
**Open:** `FRONTEND_API_DOCUMENTATION.md`
- Full request/response examples
- All error codes
- Validation rules
- React Native code examples

### For Integration Steps
**Open:** `REACT_NATIVE_INTEGRATION_GUIDE.md`
- Complete folder structure
- Service layer implementation
- Auth Context setup
- Screen examples
- Error handling utilities

### For Quick Reference
**Open:** `API_QUICK_REFERENCE.md`
- Tables of all endpoints
- Common patterns
- Quick code snippets

### For Email System
**Open:** `EMAIL_SYSTEM_GUIDE.md` or `EMAIL_QUICK_REFERENCE.md`
- Email templates
- SMTP configuration
- Troubleshooting

---

## 📞 Support & Troubleshooting

### Backend Repository Location
```
C:\Users\nzemb\OneDrive\Documents\Web Development\Projects\saintshub-dashboard-server-main
```

### Frontend Repository Location
```
C:\Users\nzemb\Documents\saintshub-v3\saintshub
```

### Common Issues

**Issue:** API not responding
- **Check:** Health endpoint: https://saintshub-dashboard-server-main.onrender.com/health
- **Solution:** If down, check Render dashboard for logs

**Issue:** CORS errors
- **Check:** `FRONTEND_URL` environment variable in Render
- **Solution:** Update to your React Native app URL

**Issue:** Authentication failing
- **Check:** Token format in Authorization header
- **Solution:** Must be `Bearer YOUR_TOKEN`

**Issue:** Emails not sending
- **Check:** Render logs for email errors
- **Solution:** Verify Hostinger SMTP credentials in environment variables

---

## ✅ Integration Checklist

### Before You Start
- [ ] API is deployed and health check passes
- [ ] Have production API URL
- [ ] Have access to all documentation files
- [ ] React Native project is set up

### During Integration
- [ ] Create `src/config/api.js` with production URL
- [ ] Install required packages: `axios`, `@react-native-async-storage/async-storage`
- [ ] Create service layer (`src/services/`)
- [ ] Set up Auth Context for global state
- [ ] Implement token storage with AsyncStorage
- [ ] Add axios interceptors for token handling
- [ ] Create screens (SignUp, SignIn, ForgotPassword, etc.)
- [ ] Test all authentication flows
- [ ] Handle errors gracefully
- [ ] Add loading states

### After Integration
- [ ] Test signup flow
- [ ] Test signin flow
- [ ] Test password reset flow
- [ ] Test protected routes
- [ ] Test token expiration handling
- [ ] Test offline scenarios
- [ ] Test rate limiting
- [ ] Verify email receipts

---

## 🚀 Quick Command to Reference Documentation

**When working in React Native project, to access backend docs:**

```powershell
# Open backend project in new VS Code window
code "C:\Users\nzemb\OneDrive\Documents\Web Development\Projects\saintshub-dashboard-server-main"
```

Then navigate to any documentation file you need!

---

## 📝 Notes

- **Token Lifespan:** JWT tokens expire after 1-5 hours (configurable)
- **Password Reset:** Tokens expire after 1 hour
- **File Upload Limit:** 50MB per request
- **Supported Image Formats:** JPEG, PNG, WebP, GIF
- **Rate Limiting:** Per IP address, resets every 15 minutes

---

## 🎉 You're All Set!

This document contains everything you need to integrate the SaintsHub API into your React Native app.

**For detailed implementation steps, open the backend project and read:**
- `REACT_NATIVE_INTEGRATION_GUIDE.md` - Your main guide
- `FRONTEND_API_DOCUMENTATION.md` - Complete API reference

**Happy coding!** 🚀

---

**Last Updated:** October 23, 2025  
**API Status:** ✅ LIVE  
**Backend Version:** 1.0.0  
**Documentation Version:** 1.0.0
