# 🚀 Quick Start - Testing Your App

## ✅ Integration Complete!

Your React Native app is now connected to production API:
```
https://saintshub-dashboard-server-main.onrender.com
```

---

## 📋 What Was Changed

### 6 Files Updated ✅

1. **`utilities/tools.ts`**
   - API URL → Production Render
   - Added `role`, `isAdminApproved`, `language` to UserState

2. **`tools/users/getUser.ts`**
   - Handles `{ success, user }` response

3. **`tools/users/signin.ts`**
   - Handles `{ success, message, token, user }` response

4. **`tools/users/signup.ts`**
   - Sends `language='en'` and `role='user'` by default
   - Handles new response format

5. **`contexts/AuthContext.tsx`**
   - Calls `/api/signout` on logout

6. **`services/api.ts`** (NEW)
   - Centralized axios instance with interceptors

---

## 🧪 How to Test

### 1. Start Your App
```bash
cd saintshub
npm start
```

### 2. Test Sign Up
- Fill form with:
  - Name, Surname
  - Email (new, not used before)
  - Password (min 8 chars, uppercase, lowercase, number, special)
  - Avatar (optional)
- Submit
- ✅ Should show success message
- ✅ Should navigate to home
- ✅ Check email for welcome message

### 3. Test Sign In
- Enter email/password
- Submit
- ✅ Should navigate to home
- ✅ User data should load

### 4. Test Auto-Login
- Close app
- Reopen app
- ✅ Should auto-navigate to home (if token valid)

### 5. Test Logout
- Click logout
- ✅ Should return to login screen
- ✅ Token cleared

---

## 🐛 Common Issues

### Issue: "Network Error"
**Solution:** Check API is live:
```bash
curl https://saintshub-dashboard-server-main.onrender.com/health
```

### Issue: "Invalid credentials"
**Solution:** Verify user exists, password correct

### Issue: "Email already exists"
**Solution:** Use different email or sign in with existing one

---

## 📊 Console Logs to Watch

**Successful Signup:**
```
TOKEN FROM SERVER: eyJhbGc...
USER FROM SERVER: {...}
TOKEN STORED SUCCESSFULLY!
You are now registered.
```

**Successful Signin:**
```
TOKEN FROM SERVER: eyJhbGc...
USER FROM SERVER: {...}
TOKEN STORED SUCCESSFULLY!
USER DATA {...}
```

---

## 🎯 What Works Now

✅ Sign Up → Welcome Email → Auto Login  
✅ Sign In → Load User Data → Navigate Home  
✅ Auto-Login → Check Token → Load User  
✅ Logout → Clear Token → Return to Login  

---

## 📝 Default Values

Users are automatically assigned:
- **Language:** `en` (English)
- **Role:** `user` (Standard user)
- **Admin Approved:** `false` (Pastor/IT need approval)

---

## 📞 Quick Help

**API Health:**
https://saintshub-dashboard-server-main.onrender.com/health

**Full Documentation:**
- `INTEGRATION_COMPLETE.md` - Complete implementation details
- `API_INTEGRATION_STATUS.md` - Integration status

**Backend Docs:**
```
C:\Users\nzemb\OneDrive\Documents\Web Development\Projects\saintshub-dashboard-server-main\
```
- `FRONTEND_API_DOCUMENTATION.md`
- `REACT_NATIVE_INTEGRATION_GUIDE.md`

---

## ✅ Ready to Test!

Just run:
```bash
cd saintshub
npm start
```

Then test signup, signin, and logout! 🎉
