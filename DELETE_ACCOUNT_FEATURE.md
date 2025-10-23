# 🗑️ Delete Account Feature Documentation

## Date: October 19, 2025
## Feature: User Account Deletion

---

## 📋 Overview

Users can now **permanently delete their accounts** with a secure password verification process. This feature ensures data privacy compliance (GDPR, etc.) and gives users control over their data.

---

## 🔐 Security Features

### 1. Password Verification Required
- Users **must provide their current password** to delete their account
- Prevents unauthorized account deletion if device is left unlocked
- Verifies that the account owner is performing the action

### 2. Token Invalidation
- Auth token is immediately added to blacklist upon deletion
- Prevents any further API access with the deleted account's token
- Token becomes unusable even if deletion occurs mid-session

### 3. Complete Data Cleanup
- User account permanently removed from database
- All churches created by the user are deleted
- No orphaned data left in the system

---

## ⚙️ How It Works

### API Endpoint
```
DELETE /api/user/delete-account
```

### Authentication
- **Required**: Yes (Bearer token in Authorization header)
- **Middleware**: `authMiddleware`

### Request Body
```json
{
  "password": "UserCurrentPassword123!"
}
```

### Response (Success - 200 OK)
```json
{
  "message": "Account deleted successfully.",
  "details": {
    "userDeleted": true,
    "churchesDeleted": 2,
    "tokenInvalidated": true
  },
  "info": "All your data has been permanently removed. We're sorry to see you go!"
}
```

### Error Responses

#### 400 Bad Request - Missing Password
```json
{
  "message": "Password is required to delete your account.",
  "hint": "Please provide your current password to verify this action."
}
```

#### 401 Unauthorized - Wrong Password
```json
{
  "message": "Incorrect password.",
  "hint": "Please enter your correct current password to delete your account."
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User not found.",
  "hint": "Your session may be invalid. Please sign in again."
}
```

#### 500 Server Error
```json
{
  "message": "Server error while deleting account.",
  "hint": "Please try again later or contact support if the problem persists."
}
```

---

## 🔄 Process Flow

```
1. User Request
   ↓
2. Verify Authentication (authMiddleware)
   ↓
3. Validate Password Provided
   ↓
4. Find User in Database
   ↓
5. Verify Password Matches (bcrypt)
   ↓
6. Delete All User's Churches
   ↓
7. Delete User Account
   ↓
8. Invalidate Auth Token (blacklist)
   ↓
9. Return Success Response
```

---

## 📊 Data Cleanup Behavior

### Current Implementation: **Delete All Churches**
```typescript
await ChurchModel.deleteMany({ 'user._id': req.userId });
```

**Result**: All churches created by this user are permanently deleted.

### Alternative Options (Commented in Code)

#### Option 1: Remove User Reference Only
```typescript
await ChurchModel.updateMany(
  { 'user._id': req.userId },
  { $set: { user: null } }
);
```
**Result**: Churches remain but are "orphaned" (no owner).

#### Option 2: Reassign to Admin (Future Enhancement)
```typescript
// Transfer ownership to main admin account
await ChurchModel.updateMany(
  { 'user._id': req.userId },
  { $set: { user: mainAdminUser } }
);
```
**Result**: Churches transferred to system admin for management.

### Choosing the Right Behavior

**Delete All Churches (Current)** - Best for:
- Small user base
- Personal churches
- Users who created churches only for themselves

**Keep Churches Orphaned** - Best for:
- Large community churches
- Multiple administrators
- Historical preservation

**Reassign to Admin** - Best for:
- Enterprise deployment
- Managed church accounts
- Compliance requirements

---

## 🧪 Testing the Feature

### Test Case 1: Successful Deletion
```bash
# 1. Sign up a test user
POST /api/signup
Body: { email, password, ... }

# 2. Create some churches (if admin/pastor)
POST /api/dashboard/create-church
Body: { name, location, ... }

# 3. Delete account
DELETE /api/user/delete-account
Headers: Authorization: Bearer <token>
Body: { "password": "correct-password" }

# Expected: 200 OK, account deleted

# 4. Try to sign in again
POST /api/signin
Body: { email, password }

# Expected: 404 or 401 (user no longer exists)
```

### Test Case 2: Wrong Password
```bash
DELETE /api/user/delete-account
Body: { "password": "wrong-password" }

# Expected: 401 Unauthorized
```

### Test Case 3: Missing Password
```bash
DELETE /api/user/delete-account
Body: {}

# Expected: 400 Bad Request
```

### Test Case 4: Token Invalidation
```bash
# 1. Delete account
DELETE /api/user/delete-account
Body: { "password": "correct-password" }

# 2. Try to access protected route with same token
GET /api/user
Headers: Authorization: Bearer <old-token>

# Expected: 401 Unauthorized (token blacklisted)
```

---

## 🎯 Frontend Integration Guide

### React/React Native Example

```typescript
const deleteAccount = async (password: string) => {
  try {
    // Show confirmation dialog first
    const confirmed = await showConfirmationDialog({
      title: "Delete Account?",
      message: "This action cannot be undone. All your data will be permanently deleted.",
      confirmText: "Delete My Account",
      cancelText: "Cancel",
      isDestructive: true
    });

    if (!confirmed) return;

    // Make API request
    const response = await fetch(`${API_BASE}/api/user/delete-account`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle errors
      if (response.status === 401) {
        showError("Incorrect password. Please try again.");
      } else if (response.status === 400) {
        showError(data.message || "Please provide your password.");
      } else {
        showError("Failed to delete account. Please try again.");
      }
      return;
    }

    // Success - clear local data and redirect
    await clearAuthToken();
    await clearLocalStorage();
    showSuccess("Your account has been deleted. We're sorry to see you go!");
    navigateToWelcomeScreen();

  } catch (error) {
    console.error("Delete account error:", error);
    showError("Network error. Please check your connection.");
  }
};
```

### Key Frontend Considerations

1. **Double Confirmation**: Always confirm with user before deleting
2. **Password Input**: Use secure password input field
3. **Loading State**: Show loading indicator during deletion
4. **Error Handling**: Display user-friendly error messages
5. **Success Action**: Clear local storage and redirect to welcome/login
6. **Offline Handling**: Check network before attempting deletion

---

## 🚨 Important Warnings

### For Users
⚠️ **THIS ACTION IS IRREVERSIBLE**
- Your account will be permanently deleted
- All churches you created will be deleted
- You cannot recover your data after deletion
- You will need to create a new account to use the app again

### For Developers
⚠️ **Production Considerations**
- Consider implementing a "soft delete" with grace period
- Send confirmation email before final deletion
- Keep deletion audit logs for compliance
- Consider GDPR "right to be forgotten" requirements
- Test thoroughly before deploying to production

---

## 🔧 Configuration Options

### Modify Deletion Behavior

**Location**: `src/controllers/userController.ts` → `deleteUserAccount` function

**Current**: Line ~410
```typescript
const churchDeletionResult = await ChurchModel.deleteMany({ 'user._id': req.userId });
```

**To Keep Churches**: Replace with:
```typescript
const churchUpdateResult = await ChurchModel.updateMany(
  { 'user._id': req.userId },
  { $set: { user: null } }
);
```

**To Reassign Churches**: Replace with:
```typescript
const SYSTEM_ADMIN_ID = 'your-admin-user-id';
const churchReassignResult = await ChurchModel.updateMany(
  { 'user._id': req.userId },
  { $set: { 'user._id': SYSTEM_ADMIN_ID } }
);
```

---

## 📈 Future Enhancements

### 1. Soft Delete with Grace Period
- Mark account as "deleted" but keep data for 30 days
- Allow account recovery within grace period
- Permanent deletion after 30 days

### 2. Data Export Before Deletion
- Generate JSON/PDF export of user data
- Email data export link before deletion
- Comply with GDPR data portability

### 3. Deletion Scheduling
- Allow users to schedule deletion for future date
- Send reminder emails before scheduled deletion
- Cancel scheduled deletion option

### 4. Admin Override
- Allow system admins to prevent certain account deletions
- Require admin approval for accounts with active subscriptions
- Audit trail for all deletion actions

### 5. Transfer Church Ownership
- Allow users to transfer churches to another admin before deleting
- Notify new admin of ownership transfer
- Ensure churches aren't orphaned

---

## 🧾 Database Impact

### Collections Affected

1. **Users Collection**
   - Document permanently removed
   - Indexes automatically updated

2. **Churches Collection (Space)**
   - All churches with matching `user._id` deleted
   - Cascade deletion of church data

3. **Token Blacklist (In-Memory)**
   - User's token added to blacklist
   - Cleaned up after token expiration

### Optimization Tips

- Consider adding `onDelete: 'cascade'` for related documents
- Index the `user._id` field in Church model for faster deletion
- Monitor deletion performance with large church counts

---

## ✅ Implementation Checklist

- [x] Create `deleteUserAccount` controller function
- [x] Add password verification with bcrypt
- [x] Implement church deletion logic
- [x] Add token blacklist integration
- [x] Create DELETE route in authRoutes
- [x] Add comprehensive error handling
- [x] Add detailed comments for maintainability
- [x] Update Postman collection
- [x] Update testing checklist
- [x] Create feature documentation
- [ ] Add frontend confirmation dialog (mobile app)
- [ ] Test with real users
- [ ] Monitor deletion metrics
- [ ] Consider GDPR compliance review

---

## 📞 Support

### For Users
If you need help or changed your mind after deleting your account, contact support immediately:
- Email: support@saintshub.com
- Note: Data recovery may not be possible after deletion

### For Developers
Questions about this feature? Check:
- `src/controllers/userController.ts` - Implementation details
- `src/routes/authRoutes.ts` - Route definition
- `TESTING_CHECKLIST.md` - Test procedures
- `FIXES_IMPLEMENTATION_SUMMARY.md` - Related security features

---

**Feature Status**: ✅ Production Ready (after testing)
**Last Updated**: October 19, 2025
**Version**: 1.0.0
