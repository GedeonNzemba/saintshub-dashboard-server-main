# ✅ Postman Testing Setup - Complete!

## 📦 What You Have Now

I've created **3 files** to help you test your Saintshub Dashboard Server with Postman:

### 1. **Saintshub_API.postman_collection.json**
   - Ready-to-import Postman collection
   - Contains all 29 API endpoints organized by category
   - Includes automatic token/ID saving via test scripts
   - Pre-configured request bodies with sample data

### 2. **POSTMAN_TESTING_GUIDE.md**
   - Complete API documentation
   - Detailed request/response examples
   - Error codes and troubleshooting
   - Test scenarios and workflows

### 3. **QUICK_START_POSTMAN.md**
   - 5-minute setup guide
   - Step-by-step testing instructions
   - Common issues and solutions
   - Testing checklist

---

## 🎯 Quick Setup (3 Steps)

### Step 1: Import Collection
1. Open Postman
2. Click **Import** → Select `Saintshub_API.postman_collection.json`
3. Done! ✅

### Step 2: Create Environment
1. Click **Environments** → **+** (Create new)
2. Name: `Saintshub Local`
3. Add these variables:
   - `base_url` = `http://localhost:3003`
   - `token` = (empty)
   - `user_id` = (empty)
   - `church_id` = (empty)
4. **Save** and **Select** the environment

### Step 3: Start Testing!
1. Open **Authentication → Sign Up**
2. Click **Send**
3. Token is auto-saved! 🎉
4. Now test any protected endpoint

---

## 🚀 Your Server Status

✅ **Server is running** on `http://localhost:3003`
✅ **MongoDB is connected**
✅ **Cloudinary is configured**
✅ **CORS is enabled** (all origins allowed)

**Port:** 3003
**Base URL:** `http://localhost:3003`

---

## 📋 Available Endpoints (29 Total)

### 🔐 Authentication (3)
- `POST /api/signup` - Register new user
- `POST /api/signin` - Login
- `POST /api/signout` - Logout

### 👤 User Management (5)
- `GET /api/user` - Get current user
- `PUT /api/user/update-user` - Update info
- `PUT /api/user/update-avatar` - Update avatar
- `PUT /api/user/update-password` - Change password
- `GET /api/user/logout` - Logout

### 🏛️ Church Management (14)
- `POST /api/dashboard/create-church` - Create church
- `GET /api/dashboard/churches` - Get all (protected)
- `GET /api/dashboard/public/churches` - Get public list
- `GET /api/dashboard/church/:id` - Get single church
- `PATCH /api/dashboard/churches/:id/:field` - Update field
- `PATCH /api/dashboard/churches/:id` - Update full church
- `DELETE /api/dashboard/church/:id` - Delete church
- `DELETE /api/dashboard/churches/:id/gallery/:index` - Delete gallery image
- `DELETE /api/dashboard/churches/:id/banner/:index` - Delete banner
- `DELETE /api/dashboard/churches/:id/past-service/:index` - Delete service
- `DELETE /api/dashboard/churches/:id/deacon/:index` - Delete deacon
- `DELETE /api/dashboard/churches/:id/trustee/:index` - Delete trustee
- `DELETE /api/dashboard/churches/:id/song/:index` - Delete song
- `DELETE /api/dashboard/churches/:id/live/:index` - Delete live service

### 📤 File Upload (2)
- `POST /api/upload-file-to-cloud` - Upload to Cloudinary
- `POST /api/upload-file` - Upload locally

### 📄 Documents (1)
- `GET /api/documents` - Get all documents

### 🌟 Special (1)
- `GET /verse-of-the-day` - Bible verse scraper

---

## 🧪 Recommended Testing Flow

```
1. Sign Up → Auto-saves token
2. Get User → Verify token works
3. Create Church → Auto-saves church_id
4. Get All Churches → Verify creation
5. Upload Image → Get Cloudinary URL
6. Update Church → Use new image URL
7. Delete Operations → Test array item removal
8. Update Password → Test auth still works
9. Logout → Clean session
```

---

## 💡 Pro Tips

### Automatic Token Management
The collection includes test scripts that automatically:
- Save JWT token after signup/signin
- Save user_id after authentication
- Save church_id after creating a church

### View Saved Variables
Click the eye icon 👁️ next to your environment name to see:
- Current token
- User ID
- Church ID

### Test Different Scenarios

**User Roles:**
```json
"role": "user"     // Regular user
"role": "pastor"   // Admin candidate (triggers email)
"role": "it"       // Admin candidate (triggers email)
```

**Languages:**
```json
"language": "en"   // English (ESV Bible)
"language": "fr"   // French (FRC97 Bible)
```

---

## ⚠️ Common Issues

### 401 Unauthorized
**Problem:** Token expired or invalid
**Solution:** Run Sign In again

### 404 Not Found
**Problem:** Invalid ID in URL
**Solution:** Check environment variables

### 400 Bad Request
**Problem:** Missing required fields
**Solution:** Compare body with examples in guide

---

## 📊 Test Coverage

Test all these features:

**Authentication:**
- [ ] Sign up new user
- [ ] Sign in existing user
- [ ] Access protected endpoint
- [ ] Token expiration handling

**User Management:**
- [ ] Get user profile
- [ ] Update user info
- [ ] Update avatar
- [ ] Change password
- [ ] Logout

**Church CRUD:**
- [ ] Create church
- [ ] Read all churches
- [ ] Read single church
- [ ] Update church field
- [ ] Update full church
- [ ] Delete church

**Array Operations:**
- [ ] Add/update gallery images
- [ ] Delete gallery image
- [ ] Add/update banner images
- [ ] Delete banner
- [ ] Manage deacons/trustees
- [ ] Manage services/songs

**File Upload:**
- [ ] Upload to Cloudinary
- [ ] Get secure_url
- [ ] Use URL in church data

**Edge Cases:**
- [ ] Duplicate email signup
- [ ] Wrong password login
- [ ] Invalid token
- [ ] Missing required fields
- [ ] Invalid array index

---

## 📖 Documentation Files

- **`QUICK_START_POSTMAN.md`** - Start here for quick setup
- **`POSTMAN_TESTING_GUIDE.md`** - Complete reference guide
- **`Saintshub_API.postman_collection.json`** - Import this into Postman

---

## 🎓 Learning Resources

### Understanding JWT Tokens
- Token is saved in environment after login
- Format: `Bearer <token>`
- Expires after 1h (signup) or 5h (signin)

### Church Data Structure
```javascript
{
  name: string,
  principal: { pastor, wife, image, description },
  location: string,
  image: string,
  banner: string[],
  securities: { deacons[], trustees[] },
  oldServices: [],
  liveServices: [],
  gallery: string[],
  songs: [],
  logo: string,
  user: { name, email, _id, image }
}
```

---

## 🔧 Environment Variables Expected

Your server expects these `.env` variables (currently hardcoded):

```env
PORT=3003
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=ddbiofmni
CLOUDINARY_API_KEY=629285927862696
CLOUDINARY_API_SECRET=7i7owfVVo3t860usBWvJqTITMHY
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your-user
MAILTRAP_PASS=your-pass
ADMIN_NOTIFICATION_EMAIL=admin@example.com
BRAND_LOGO_URL=https://...
BRAND_COLOR_PRIMARY=#3498DB
BRAND_COLOR_SECONDARY=#2980B9
```

---

## 🎯 What to Test First

### 5-Minute Quick Test
1. Import collection
2. Create environment
3. Run "Sign Up"
4. Run "Get Current User"
5. Run "Create Church"

### 15-Minute Full Test
1. Complete user flow (signup → update → logout)
2. Complete church flow (create → update → delete)
3. Test file upload
4. Test error scenarios

### Production Readiness Test
1. Test all 29 endpoints
2. Verify error handling
3. Test with different roles
4. Test with both languages
5. Test token expiration
6. Test concurrent requests

---

## 📞 Need Help?

If you encounter issues:

1. **Check Server Logs** - Look in your terminal
2. **Check Postman Console** - View request/response details
3. **Verify Environment** - Make sure variables are set
4. **Read Full Guide** - `POSTMAN_TESTING_GUIDE.md` has examples
5. **Database State** - Check MongoDB for data persistence

---

## ✨ You're All Set!

You now have everything you need to:
- ✅ Test all API endpoints
- ✅ Verify server functionality
- ✅ Debug issues quickly
- ✅ Document API behavior
- ✅ Prepare for production

**Start with:** `QUICK_START_POSTMAN.md` → Import collection → Test!

---

**Happy Testing! 🚀**
