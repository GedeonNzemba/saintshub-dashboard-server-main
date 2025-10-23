# 🚀 Quick Start - Testing with Postman

## Step 1: Import the Collection

1. Open Postman
2. Click **Import** (top left)
3. Select the file: `Saintshub_API.postman_collection.json`
4. The collection will appear in your Collections sidebar

## Step 2: Set Up Environment

1. Click **Environments** (left sidebar)
2. Click **+** to create a new environment
3. Name it: `Saintshub Local`
4. Add these variables:

| Variable | Type | Initial Value | Current Value |
|----------|------|---------------|---------------|
| `base_url` | default | `http://localhost:3003` | `http://localhost:3003` |
| `token` | secret | _(leave empty)_ | _(leave empty)_ |
| `user_id` | default | _(leave empty)_ | _(leave empty)_ |
| `church_id` | default | _(leave empty)_ | _(leave empty)_ |

5. **Save** the environment
6. Select it from the dropdown (top right)

## Step 3: Test Basic Flow

### A. Sign Up a User

1. Open: **Authentication → Sign Up**
2. Check the Body tab - change the email if needed
3. Click **Send**
4. ✅ Expected: 201 Created
5. ✅ Token and user_id are automatically saved to your environment

### B. Get User Info

1. Open: **User Management → Get Current User**
2. Click **Send**
3. ✅ Expected: 200 OK with your user details
4. Notice the Authorization header uses `{{token}}` automatically

### C. Create a Church

1. Open: **Church Management → Create Church**
2. Review the body (already has sample data)
3. Click **Send**
4. ✅ Expected: 201 Created
5. ✅ church_id is automatically saved

### D. Get All Churches

1. Open: **Church Management → Get All Churches**
2. Click **Send**
3. ✅ Expected: 200 OK with array of churches

### E. Update Church

1. Open: **Church Management → Update Church Field (Name)**
2. Modify the name in the body
3. Click **Send**
4. ✅ Expected: 200 OK with updated church

## Step 4: Test File Upload

1. Open: **File Upload → Upload to Cloudinary**
2. In the Body tab:
   - Make sure `form-data` is selected
   - Click on the `profileImage` row
   - Click **Select Files** and choose an image
3. Click **Send**
4. ✅ Expected: 200 OK with Cloudinary response
5. Copy the `secure_url` from response to use in church/user data

## Common Issues & Solutions

### ❌ 401 Unauthorized
- **Cause:** Token expired or missing
- **Solution:** Run **Sign In** again to get a fresh token

### ❌ 404 Not Found
- **Cause:** Invalid church_id or user_id
- **Solution:** Check your environment variables have the correct IDs

### ❌ 400 Bad Request
- **Cause:** Missing required fields
- **Solution:** Check the request body matches the expected format

### ❌ Connection Refused
- **Cause:** Server not running
- **Solution:** You mentioned the server is always running, but verify it's on port 3003

## Testing Checklist

- [ ] Import collection successfully
- [ ] Create and activate environment
- [ ] Sign up a new user (token saved)
- [ ] Get user info (token works)
- [ ] Create a church (church_id saved)
- [ ] Update church details
- [ ] Get all churches
- [ ] Upload an image to Cloudinary
- [ ] Test delete operations (gallery, banner, etc.)
- [ ] Test password update
- [ ] Test logout

## Pro Tips

### Auto-Save Tokens
The collection already has test scripts that auto-save:
- JWT tokens after signup/signin
- User ID after signup/signin
- Church ID after creating a church

### View Environment Variables
- Click the eye icon 👁️ next to environment name
- You'll see current values of token, user_id, church_id

### Test Different Roles
Try signing up with different roles:
```json
"role": "user"     // Regular user
"role": "pastor"   // Admin candidate
"role": "it"       // Admin candidate
```

### Language Support
Test both languages:
```json
"language": "en"   // English
"language": "fr"   // French
```

## Next Steps

1. **Read the full guide:** `POSTMAN_TESTING_GUIDE.md`
2. **Test all endpoints** in the collection
3. **Create test scenarios** with multiple churches
4. **Test error cases** (invalid data, expired tokens)
5. **Document any bugs** you find

---

**Happy Testing! 🎉**

If you need help, refer to `POSTMAN_TESTING_GUIDE.md` for detailed documentation.
