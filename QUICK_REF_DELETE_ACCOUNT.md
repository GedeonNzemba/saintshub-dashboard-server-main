# 🚀 Quick Reference: Delete Account API

## Endpoint
```
DELETE /api/user/delete-account
```

## Headers
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

## Request Body
```json
{
  "password": "YourCurrentPassword123!"
}
```

## Success Response (200)
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

## Error Responses

### 400 - Missing Password
```json
{
  "message": "Password is required to delete your account.",
  "hint": "Please provide your current password to verify this action."
}
```

### 401 - Wrong Password
```json
{
  "message": "Incorrect password.",
  "hint": "Please enter your correct current password to delete your account."
}
```

### 404 - User Not Found
```json
{
  "message": "User not found.",
  "hint": "Your session may be invalid. Please sign in again."
}
```

## cURL Example
```bash
curl -X DELETE http://localhost:3003/api/user/delete-account \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"password":"TestPassword123!"}'
```

## Postman Quick Test
1. Import: `Saintshub_API.postman_collection.json`
2. Find: "User Profile" → "Delete Account"
3. Update: Password in request body
4. Send: Click Send button
5. Verify: 200 response with details

## What Gets Deleted?
- ✅ User account (permanent)
- ✅ All churches created by user
- ✅ Auth token (blacklisted)
- ⚠️ **IRREVERSIBLE** - Cannot be undone

## Security Features
- 🔒 Requires current password
- 🔒 Invalidates token immediately
- 🔒 Complete data cleanup
- 🔒 Protected endpoint (auth required)

## Mobile App Integration
```typescript
// Example React Native/TypeScript
const deleteAccount = async (password: string) => {
  const response = await fetch(`${API_URL}/api/user/delete-account`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  });
  
  if (response.ok) {
    // Clear storage and navigate
    await AsyncStorage.clear();
    navigation.navigate('Welcome');
  }
};
```

## Testing Checklist
- [ ] Try with wrong password (should fail)
- [ ] Try without password (should fail)
- [ ] Delete successfully with correct password
- [ ] Verify cannot sign in after deletion
- [ ] Verify token is invalidated
- [ ] Verify churches are deleted

---

**⚠️ IMPORTANT**: This action is PERMANENT. Always confirm with user before calling this endpoint.
