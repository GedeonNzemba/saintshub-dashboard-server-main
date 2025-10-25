# 🔄 React Native App - API Integration Update Summary

**Date:** October 23, 2025  
**Production API:** https://saintshub-dashboard-server-main.onrender.com

---

## ✅ What Has Been Updated

### 1. **API Configuration** ✅
**File:** `utilities/tools.ts`

**Changes:**
- ✅ Updated `URI_domain` from ngrok URL to production Render URL
- ✅ Added comments for development/production switching

```typescript
// Before:
export const URI_domain = "https://2814-105-213-4-57.ngrok-free.app";

// After:
export const URI_domain = "https://saintshub-dashboard-server-main.onrender.com";
```

---

### 2. **Centralized API Service** ✅ NEW
**File:** `services/api.ts` (NEW FILE)

**Features:**
- ✅ Axios instance with base URL configuration
- ✅ Request interceptor - automatically adds Authorization token
- ✅ Response interceptor - handles 401, 403, 429, 500 errors
- ✅ Automatic token expiration handling
- ✅ Network error handling
- ✅ Development logging

**Usage:**
```typescript
import api from '@/services/api';

// All requests automatically include token if available
const response = await api.get('/api/user');
const response = await api.post('/api/signin', data);
```

---

### 3. **Authentication Service** ✅ NEW
**File:** `services/authService.ts` (NEW FILE)

**Functions:**
- ✅ `signIn(email, password)` - Login user
- ✅ `signUp(userData)` - Register new user
- ✅ `signOut()` - Logout user
- ✅ `getCurrentUser()` - Get current user profile
- ✅ `isAuthenticated()` - Check if user has valid token
- ✅ `getToken()` - Get stored token
- ✅ `getStoredUser()` - Get stored user data

**Response Format Matches Backend:**
```typescript
{
  success: boolean;
  message: string;
  token: string;
  user: {
    _id: string;
    name: string;
    surname: string;
    email: string;
    avatar: { url: string };
    role: 'user' | 'pastor' | 'it' | 'admin';
    isAdminApproved: boolean;
    language: string;
  }
}
```

---

## 📋 Files That Need Updating (Next Steps)

### 4. **Update Signin Handler** ⏳
**File:** `tools/users/signin.ts`

**Current State:** Uses old axios call directly  
**Needs:** Update to use new `authService.signIn()`

**Action Required:**
```typescript
// Replace handleSignIn function to use:
import { authService } from '@/services/authService';

export const handleSignIn = async ({ email, password }) => {
  return await authService.signIn({ email, password });
};
```

---

### 5. **Update Signup Handler** ⏳
**File:** `tools/users/signup.ts`

**Current State:** Missing fields required by backend  
**Needs:** Update to include all required fields

**Missing Fields:**
- ❌ `language` (required: 'en' or 'fr')
- ❌ `role` (required: 'user', 'pastor', or 'it')
- ❌ `selectedChurchId` (optional)
- ❌ `otherChurchName` (optional)

**Action Required:**
```typescript
import { authService } from '@/services/authService';

export const handleSignUp = async (data) => {
  return await authService.signUp({
    ...data,
    language: data.language || 'en',
    role: data.role || 'user',
  });
};
```

---

### 6. **Update AuthContext** ⏳
**File:** `contexts/AuthContext.tsx`

**Current State:** Logout only clears local storage  
**Needs:** Call backend logout endpoint

**Action Required:**
```typescript
import { authService } from '@/services/authService';

const logout = async () => {
  await authService.signOut(); // Calls backend + clears storage
  router.replace('/(auth)/login');
};
```

---

### 7. **Update User Types** ⏳
**File:** `utilities/tools.ts`

**Current State:** Missing new backend fields  
**Needs:** Add role, isAdminApproved, language fields

**Action Required:**
```typescript
export interface UserState {
  _id: string;
  name: string;
  surname: string;
  email: string;
  avatar: { url: string };
  role: 'user' | 'pastor' | 'it' | 'admin'; // NEW
  isAdminApproved: boolean; // NEW
  language: string; // NEW
  admin: boolean; // Legacy
}
```

---

### 8. **Update Login Screen** ⏳
**File:** `app/(auth)/login.tsx`

**Current State:** Uses old handleSignIn  
**Needs:** Update to handle new response format

**Key Changes:**
- ✅ Response now includes `success` and `message` fields
- ✅ Better error handling with try/catch
- ✅ Display success/error messages to user

---

### 9. **Update Signup Screen** ⏳
**File:** `app/(auth)/signup.tsx`

**Current State:** Missing required fields  
**Needs:** Add language and role selectors

**New Fields Needed:**
- Language selector (EN/FR)
- Role selector (User/Pastor/IT)
- Church selection (optional)

---

### 10. **Create Password Reset Service** ⏳ NEW
**File:** `services/passwordService.ts` (TO CREATE)

**Functions to Create:**
- `forgotPassword(email)` - Send reset email
- `resetPassword(token, newPassword)` - Reset with token
- `verifyResetToken(token)` - Check if token is valid

---

### 11. **Create User Profile Service** ⏳ NEW
**File:** `services/userService.ts` (TO CREATE)

**Functions to Create:**
- `updateProfile(name, surname, email)` - Update user info
- `updateAvatar(imageUri)` - Update profile picture
- `updatePassword(oldPassword, newPassword)` - Change password
- `deleteAccount()` - Delete user account

---

### 12. **Create Password Reset Screens** ⏳ NEW
**Files to Create:**
- `app/(auth)/forgot-password.tsx` - Enter email
- `app/(auth)/reset-password.tsx` - Enter new password

---

## 🎯 Integration Priority

### Phase 1: Core Authentication (CURRENT) ✅
1. ✅ Update API URL
2. ✅ Create centralized API service
3. ✅ Create authentication service
4. ⏳ Update signin handler
5. ⏳ Update signup handler
6. ⏳ Update login screen
7. ⏳ Update signup screen
8. ⏳ Test authentication flow

### Phase 2: User Management
9. ⏳ Create user profile service
10. ⏳ Create profile update screens
11. ⏳ Test profile update flow

### Phase 3: Password Reset
12. ⏳ Create password service
13. ⏳ Create forgot password screen
14. ⏳ Create reset password screen
15. ⏳ Test password reset flow

---

## 🧪 Testing Checklist

### Authentication Flow
- [ ] User can sign up with all required fields
- [ ] User receives welcome email
- [ ] User can sign in with credentials
- [ ] Token is stored in AsyncStorage
- [ ] User data is stored in AsyncStorage
- [ ] Protected routes require authentication
- [ ] User can log out
- [ ] Token is cleared on logout
- [ ] User is redirected to login after logout

### Error Handling
- [ ] Invalid credentials show error message
- [ ] Network errors show user-friendly message
- [ ] Rate limiting shows retry message
- [ ] Token expiration redirects to login

### User Experience
- [ ] Loading states during API calls
- [ ] Success messages after actions
- [ ] Error messages are clear
- [ ] No console errors

---

## 📝 Backend API Endpoints Reference

All endpoints are available at:
```
https://saintshub-dashboard-server-main.onrender.com
```

### Authentication
- `POST /api/signup` - Register new user
- `POST /api/signin` - Login user
- `POST /api/signout` - Logout user
- `GET /api/user` - Get current user

### User Management
- `PUT /api/user/update-user` - Update profile
- `PUT /api/user/update-avatar` - Update avatar
- `PUT /api/user/update-password` - Change password
- `DELETE /api/user/delete-account` - Delete account

### Password Reset
- `POST /api/password/forgot-password` - Request reset
- `POST /api/password/reset-password` - Reset password
- `GET /api/password/verify-reset-token/:token` - Verify token

### Admin (Future)
- `GET /api/admin/pending-requests`
- `PUT /api/admin/approve/:userId`
- `PUT /api/admin/revoke/:userId`
- `GET /api/admin/all-admins`

---

## 📚 Documentation Reference

**Complete Backend Documentation:**
```
C:\Users\nzemb\OneDrive\Documents\Web Development\Projects\saintshub-dashboard-server-main\
```

**Key Files:**
- `FRONTEND_API_DOCUMENTATION.md` - Complete API reference
- `REACT_NATIVE_INTEGRATION_GUIDE.md` - Integration guide
- `API_PRODUCTION_REFERENCE.md` - Production info
- `API_QUICK_REFERENCE.md` - Quick lookup

---

## ✅ Next Actions

**Right Now:**
1. Update `tools/users/signin.ts` to use new authService
2. Update `tools/users/signup.ts` with all required fields
3. Update login screen to handle new response format
4. Update signup screen to collect all required fields
5. Test signin and signup flows

**After Core Auth Works:**
6. Create password reset service and screens
7. Create user profile service and screens
8. Add admin features (if needed)

---

**Status:** Phase 1 - 3/8 Complete (37.5%)  
**Last Updated:** October 23, 2025  
**Next Task:** Update signin handler
