# ✅ Post-Fix Testing Checklist

## Date: October 19, 2025
## Purpose: Verify all bug fixes and improvements work as expected

---

## 🎯 Testing Overview

**Total Tests:** 27
**Estimated Time:** 40-60 minutes
**Prerequisites:** 
- Postman collection imported (`Saintshub_API.postman_collection.json`)
- Environment configured with `base_url`
- Server running on http://localhost:3003

---

## 📝 Test Suite

### 1️⃣ Authentication Tests

#### Test 1.1: Sign Up with Regular User
- [ ] Endpoint: `POST /api/signup`
- [ ] Role: `"user"`
- [ ] Expected: 201 Created, token saved
- [ ] Verify: `isAdminCandidate: false`

#### Test 1.2: Sign Up with Pastor Role
- [ ] Endpoint: `POST /api/signup`
- [ ] Role: `"pastor"`
- [ ] Email: Different from previous
- [ ] Expected: 201 Created
- [ ] Verify: `isAdminCandidate: true`
- [ ] Note: Admin notification email would be sent (check server logs)

#### Test 1.3: Sign In
- [ ] Endpoint: `POST /api/signin`
- [ ] Use regular user credentials
- [ ] Expected: 200 OK, token saved
- [ ] Verify: Token stored in environment

---

### 2️⃣ User Profile Tests

#### Test 2.1: Get User Profile
- [ ] Endpoint: `GET /api/user`
- [ ] Expected: 200 OK
- [ ] Verify Response Contains:
  - [ ] `name`, `surname`, `email`
  - [ ] `avatar` with `public_id` and `url`
  - [ ] `churches` array (may be empty)
  - [ ] `_meta` object with `churchSelectionInfo`
  - [ ] NO `password` field

#### Test 2.2: Update User Info (Success)
- [ ] Endpoint: `PUT /api/user/update-user`
- [ ] Body: `{ "name": "Updated Name", "surname": "Updated Surname" }`
- [ ] Expected: 200 OK
- [ ] Verify: Name and surname changed
- [ ] Verify: Email remains unchanged

#### Test 2.3: Update User Info (Email Attempt - Should Fail)
- [ ] Endpoint: `PUT /api/user/update-user`
- [ ] Body: `{ "name": "Test", "surname": "User", "email": "newemail@example.com" }`
- [ ] Expected: Email ignored or error returned
- [ ] Verify: Email NOT changed

#### Test 2.4: Update Avatar (Success)
- [ ] Endpoint: `PUT /api/user/update-avatar`
- [ ] Body: 
```json
{
  "avatar": {
    "public_id": "test-public-id-123",
    "url": "https://randomuser.me/api/portraits/women/65.jpg"
  }
}
```
- [ ] Expected: 200 OK
- [ ] Verify: Both `public_id` and `url` saved

#### Test 2.5: Update Avatar (Missing public_id - Should Fail)
- [ ] Endpoint: `PUT /api/user/update-avatar`
- [ ] Body: `{ "avatar": { "url": "https://example.com/image.jpg" } }`
- [ ] Expected: 400 Bad Request
- [ ] Verify: Error message mentions `public_id` required

---

### 3️⃣ Password Change Tests

#### Test 3.1: Change Password (Success)
- [ ] Endpoint: `PUT /api/user/update-password`
- [ ] Body:
```json
{
  "currentPassword": "TestPassword123!",
  "password": "NewTestPassword123!",
  "confirmPassword": "NewTestPassword123!"
}
```
- [ ] Expected: 200 OK
- [ ] Verify: Password changed successfully

#### Test 3.2: Change Password (Wrong Current Password)
- [ ] Endpoint: `PUT /api/user/update-password`
- [ ] Body: Use wrong `currentPassword`
- [ ] Expected: 401 Unauthorized
- [ ] Verify: Error message says "Current password is incorrect"

#### Test 3.3: Change Password (Missing Current Password)
- [ ] Endpoint: `PUT /api/user/update-password`
- [ ] Body:
```json
{
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```
- [ ] Expected: 400 Bad Request
- [ ] Verify: Error mentions `currentPassword` required

#### Test 3.4: Change Password (Password Mismatch)
- [ ] Endpoint: `PUT /api/user/update-password`
- [ ] Body:
```json
{
  "currentPassword": "NewTestPassword123!",
  "password": "NewPassword123!",
  "confirmPassword": "DifferentPassword123!"
}
```
- [ ] Expected: 400 Bad Request
- [ ] Verify: Error says passwords don't match

#### Test 3.5: Change Password (Too Short)
- [ ] Endpoint: `PUT /api/user/update-password`
- [ ] Body: Use password with less than 8 characters
- [ ] Expected: 400 Bad Request
- [ ] Verify: Error mentions minimum length

---

### 4️⃣ Logout & Token Invalidation Tests

#### Test 4.1: Logout
- [ ] Endpoint: `GET /api/user/logout`
- [ ] Expected: 200 OK
- [ ] Verify: Success message received

#### Test 4.2: Access Protected Route After Logout (Should Fail)
- [ ] Endpoint: `GET /api/user`
- [ ] Expected: 401 Unauthorized
- [ ] Verify: Error message mentions "Token has been invalidated"
- [ ] Verify: Reason is "logout"

#### Test 4.3: Sign In Again
- [ ] Endpoint: `POST /api/signin`
- [ ] Expected: 200 OK
- [ ] Verify: New token saved

#### Test 4.4: Access Protected Route with New Token (Should Work)
- [ ] Endpoint: `GET /api/user`
- [ ] Expected: 200 OK
- [ ] Verify: User data returned

---

### 5️⃣ Account Deletion Tests

#### Test 5.1: Delete Account (Fail - Wrong Password)
- [ ] Endpoint: `DELETE /api/user/delete-account`
- [ ] Body: `{ "password": "WrongPassword123!" }`
- [ ] Expected: 401 Unauthorized
- [ ] Verify: Error says "Incorrect password"

#### Test 5.2: Delete Account (Fail - Missing Password)
- [ ] Endpoint: `DELETE /api/user/delete-account`
- [ ] Body: `{}`
- [ ] Expected: 400 Bad Request
- [ ] Verify: Error mentions password is required

#### Test 5.3: Create Test User for Deletion
- [ ] Endpoint: `POST /api/signup`
- [ ] Create new user: `deletetest@example.com`
- [ ] Expected: 201 Created
- [ ] Save token for this user

#### Test 5.4: Create Church as Test User (If Admin)
- [ ] Sign up as pastor role or skip this test
- [ ] Create a test church
- [ ] Note church ID for verification later

#### Test 5.5: Delete Account (Success)
- [ ] Endpoint: `DELETE /api/user/delete-account`
- [ ] Body: `{ "password": "correct-password" }`
- [ ] Expected: 200 OK
- [ ] Verify Response Contains:
  - [ ] `userDeleted: true`
  - [ ] `churchesDeleted` count
  - [ ] `tokenInvalidated: true`

#### Test 5.6: Verify Account No Longer Exists
- [ ] Endpoint: `POST /api/signin`
- [ ] Use deleted user credentials
- [ ] Expected: 404 Not Found or 401 Unauthorized
- [ ] Verify: Cannot sign in with deleted account

#### Test 5.7: Verify Token Invalidated
- [ ] Endpoint: `GET /api/user`
- [ ] Use old token from deleted account
- [ ] Expected: 401 Unauthorized
- [ ] Verify: Token is blacklisted

---

### 6️⃣ Church Creation Tests (Admin Required)

#### Test 6.1: Sign In as Pastor/Admin User
- [ ] Endpoint: `POST /api/signin`
- [ ] Use pastor credentials from Test 1.2
- [ ] Expected: 200 OK
- [ ] Verify: Token for admin candidate saved

#### Test 6.2: Create Church (Success - Admin User)
- [ ] Endpoint: `POST /api/dashboard/create-church`
- [ ] Body: Use sample church data (NO user field)
```json
{
  "name": "Test Community Church",
  "principal": {
    "pastor": "Pastor Test",
    "wife": "Mrs Test",
    "image": "https://randomuser.me/api/portraits/men/50.jpg",
    "description": "Test description"
  },
  "location": "123 Test Street",
  "image": "https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800",
  "banner": [],
  "securities": { "deacons": [], "trustees": [] },
  "oldServices": [],
  "liveServices": [],
  "gallery": [],
  "songs": [],
  "logo": "https://via.placeholder.com/200"
}
```
- [ ] Expected: 201 Created
- [ ] Verify Response Contains:
  - [ ] Church data
  - [ ] `user` object with creator info (auto-populated)
  - [ ] `user._id` matches logged-in user

#### Test 6.3: Get User Profile (Verify Churches Array)
- [ ] Endpoint: `GET /api/user`
- [ ] Expected: 200 OK
- [ ] Verify: `churches` array contains the church created in Test 6.2

#### Test 6.4: Sign In as Regular User
- [ ] Endpoint: `POST /api/signin`
- [ ] Use regular user credentials from Test 1.1
- [ ] Expected: 200 OK

#### Test 6.5: Create Church (Fail - Regular User)
- [ ] Endpoint: `POST /api/dashboard/create-church`
- [ ] Body: Same as Test 5.2
- [ ] Expected: 403 Forbidden
- [ ] Verify: Error message mentions "administrative privileges"
- [ ] Verify: `userRole` object shows `isAdmin: false`, `isAdminCandidate: false`

---

## 🔍 Additional Verification Tests

### Test 7: Get All Churches (Protected)
- [ ] Endpoint: `GET /api/dashboard/churches`
- [ ] Expected: 200 OK
- [ ] Verify: Array of churches returned

### Test 8: Get Public Church List (No Auth)
- [ ] Remove Authorization header
- [ ] Endpoint: `GET /api/dashboard/public/churches`
- [ ] Expected: 200 OK
- [ ] Verify: Only `_id` and `name` fields returned

### Test 9: Get Single Church
- [ ] Endpoint: `GET /api/dashboard/church/{{church_id}}`
- [ ] Expected: 200 OK
- [ ] Verify: Complete church details returned

---

## 📊 Expected Results Summary

### ✅ Should SUCCEED
- Sign up with any role
- Sign in with correct credentials
- Update user name/surname (NOT email)
- Update avatar with both public_id and url
- Change password with correct current password
- Logout
- Admin/admin candidate creates church
- Get user profile includes churches array
- Access public endpoints without auth

### ❌ Should FAIL
- Update email address
- Update avatar without public_id
- Change password without current password
- Change password with wrong current password
- Access protected routes after logout
- Regular user creates church
- Access protected routes without token

---

## 🐛 Troubleshooting

### Issue: 401 Unauthorized on all requests
**Solution:** Sign in again to get fresh token

### Issue: Can't create church as admin
**Solution:** Verify `isAdminCandidate: true` or `admin: true` in user profile

### Issue: Old token still works after logout
**Solution:** Restart server to clear in-memory blacklist

### Issue: Churches array not showing
**Solution:** Make sure you're logged in as the user who created the churches

---

## 📝 Test Results Template

Copy this for tracking your test results:

```
=== TEST RESULTS ===
Date: ___________
Tester: ___________

Authentication Tests:
[ ] 1.1 - Sign Up Regular User
[ ] 1.2 - Sign Up Pastor
[ ] 1.3 - Sign In

User Profile Tests:
[ ] 2.1 - Get User Profile
[ ] 2.2 - Update User Info (Success)
[ ] 2.3 - Update User Info (Email Attempt)
[ ] 2.4 - Update Avatar (Success)
[ ] 2.5 - Update Avatar (Missing public_id)

Password Tests:
[ ] 3.1 - Change Password (Success)
[ ] 3.2 - Wrong Current Password
[ ] 3.3 - Missing Current Password
[ ] 3.4 - Password Mismatch
[ ] 3.5 - Password Too Short

Logout Tests:
[ ] 4.1 - Logout
[ ] 4.2 - Access After Logout (Fail)
[ ] 4.3 - Sign In Again
[ ] 4.4 - Access with New Token

Account Deletion Tests:
[ ] 5.1 - Delete Account (Wrong Password)
[ ] 5.2 - Delete Account (Missing Password)
[ ] 5.3 - Create Test User
[ ] 5.4 - Create Church as Test User
[ ] 5.5 - Delete Account (Success)
[ ] 5.6 - Verify Account Deleted
[ ] 5.7 - Verify Token Invalidated

Church Creation Tests:
[ ] 6.1 - Sign In as Pastor
[ ] 6.2 - Create Church (Success)
[ ] 6.3 - Verify Churches Array
[ ] 6.4 - Sign In as Regular User
[ ] 6.5 - Create Church (Fail)

Additional Tests:
[ ] 7 - Get All Churches
[ ] 8 - Get Public Church List
[ ] 9 - Get Single Church

Total Passed: ____ / 27
Total Failed: ____ / 27

Notes:
_________________________________
_________________________________
```

---

## ✨ Success Criteria

**All tests must pass** for the fixes to be considered complete.

If any test fails:
1. Document the failure
2. Check server logs
3. Verify request format
4. Report issue with details

---

## 🎉 After All Tests Pass

1. ✅ All security fixes verified
2. ✅ All functionality working as expected
3. ✅ Ready for integration testing
4. ✅ Ready for mobile app integration
5. ✅ Ready for production deployment (after full QA)

---

**Happy Testing! 🚀**
