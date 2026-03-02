# Church Ownership & Authorization Implementation

## 📋 Summary

Implemented proper authorization so that admin users can only edit churches they created. Users can still view other churches but cannot make changes.

---

## 🔐 Backend Changes

### 1. New Middleware: `churchOwnershipMiddleware.ts`

Created middleware to verify church ownership before allowing edit/delete operations.

**Key Functions:**
- `checkChurchOwnership`: Verifies that authenticated user created the church
  - Checks if `church.user._id` matches `req.userId`
  - Returns 403 Forbidden if user is not the owner
  - Used on all PATCH and DELETE routes

- `addOwnershipInfo`: Adds permission flag to GET requests
  - Adds `req.isChurchOwner` boolean to request
  - Used on GET `/church/:id` to inform frontend about edit rights

**Location:** `src/middlewares/churchOwnershipMiddleware.ts`

---

### 2. Updated Routes: `authDashboard.ts`

Applied ownership middleware to all church modification endpoints:

**Protected Routes:**
```typescript
// UPDATE endpoints - now require ownership
PATCH /churches/:id              + authMiddleware + checkChurchOwnership
PATCH /churches/:id/:field       + authMiddleware + checkChurchOwnership

// DELETE endpoints - now require ownership
DELETE /church/:id                           + authMiddleware + checkChurchOwnership
DELETE /churches/:churchId/gallery/:index    + authMiddleware + checkChurchOwnership
DELETE /churches/:churchId/banner/:index     + authMiddleware + checkChurchOwnership
DELETE /churches/:churchId/past-service/:i   + authMiddleware + checkChurchOwnership
DELETE /churches/:churchId/deacon/:index     + authMiddleware + checkChurchOwnership
DELETE /churches/:churchId/trustee/:index    + authMiddleware + checkChurchOwnership
DELETE /churches/:churchId/song/:index       + authMiddleware + checkChurchOwnership
DELETE /churches/:churchId/live/:index       + authMiddleware + checkChurchOwnership

// GET endpoint - adds ownership info
GET /church/:id                   + authMiddleware + addOwnershipInfo
```

**Response Example:**
```json
{
  "_id": "507f191e810c19729de860ea",
  "name": "Grace Community Church",
  ...
  "_permissions": {
    "canEdit": false,
    "message": "View only - This church belongs to another user"
  }
}
```

---

### 3. Updated Controller: `dashboardController.ts`

Modified `getChurch` function to include ownership information:

```typescript
const getChurch = async (req: AuthRequest, res: Response) => {
  const church = await ChurchModel.findById(id);
  
  const response = {
    ...church.toObject(),
    _permissions: {
      canEdit: req.isChurchOwner || false,
      message: req.isChurchOwner 
        ? "You can edit this church" 
        : "View only - This church belongs to another user"
    }
  };
  
  res.json(response);
};
```

---

## 📱 Frontend Changes: `church.tsx`

### 1. New State Variables

```typescript
const [canEdit, setCanEdit] = useState(false);        // User has edit permission
const [isReadOnly, setIsReadOnly] = useState(false);  // Church is read-only
```

---

### 2. Permission Check on Data Fetch

```typescript
const fetchChurchData = async () => {
  const data = await response.json();
  
  // Check permissions from backend
  const hasEditPermission = data._permissions?.canEdit || false;
  setCanEdit(hasEditPermission);
  setIsReadOnly(!hasEditPermission);
  
  // Show alert if read-only
  if (!hasEditPermission) {
    Alert.alert(
      "View Only Mode",
      "This church belongs to another user. You can view but cannot edit.",
      [{ text: "OK" }]
    );
  }
};
```

---

### 3. Read-Only Guards on All Edit Functions

All modification functions now check `isReadOnly` first:

```typescript
const handleLogoUpload = async () => {
  if (isReadOnly) {
    Alert.alert("View Only", "You cannot edit this church.");
    return;
  }
  // ... rest of upload logic
};

const handleUpdateChurch = async () => {
  if (isReadOnly) {
    Alert.alert("View Only", "You cannot edit this church.");
    return;
  }
  // ... rest of update logic
};
```

**Protected Functions:**
- ✅ `handleLogoUpload`
- ✅ `handlePastorImageUpload`
- ✅ `handleChurchImageUpload`
- ✅ `handleBannerUpload`
- ✅ `handleGalleryUpload`
- ✅ `handleDeaconImageUpload`
- ✅ `handleTrusteeImageUpload`
- ✅ `handleUpdateChurch`

---

### 4. UI Changes

**A. Read-Only Banner**
```tsx
{isReadOnly && (
  <View style={styles.readOnlyBanner}>
    <MaterialIcons name="visibility" size={20} color="#FF6B6B" />
    <Text style={styles.readOnlyText}>
      View Only - This church belongs to another user
    </Text>
  </View>
)}
```

**B. Disabled Input Fields**
```tsx
<TextInput
  style={[styles.input, isReadOnly && styles.inputDisabled]}
  editable={!isReadOnly}
  value={church.name}
  ...
/>
```

**C. Hidden Update Button**
```tsx
{!isReadOnly && (
  <TouchableOpacity style={styles.updateButton} onPress={handleUpdateChurch}>
    <Text>UPDATE CHURCH</Text>
  </TouchableOpacity>
)}
```

**New Styles Added:**
```typescript
readOnlyBanner: {
  flexDirection: "row",
  backgroundColor: "#FFF3CD",
  padding: 15,
  borderRadius: 12,
  borderLeftWidth: 4,
  borderLeftColor: "#FF6B6B",
},
readOnlyText: {
  marginLeft: 10,
  fontSize: 14,
  color: "#856404",
},
inputDisabled: {
  backgroundColor: "#F5F5F5",
  color: "#999999",
},
```

---

## 🔒 Security Model

### Access Control Flow:

1. **User creates a church**
   - Church document stores `user._id` of creator
   - Creator gets full edit access

2. **Another admin views the church**
   - Backend checks: `church.user._id !== req.userId`
   - Backend returns `_permissions.canEdit: false`
   - Frontend displays read-only mode

3. **Edit attempt on non-owned church**
   - Frontend: Alert shown immediately
   - Backend: 403 Forbidden if bypassed

### Error Responses:

**Backend 403 Response:**
```json
{
  "error": "Access denied",
  "message": "You can only edit churches that you created",
  "details": "This church belongs to another user"
}
```

**Frontend Alert:**
```
Title: "View Only"
Message: "You cannot edit this church. It belongs to another user."
```

---

## ✅ Testing Checklist

### Test Scenarios:

1. **Creator Access (Own Church)**
   - ✅ Can view all information
   - ✅ Can edit text fields
   - ✅ Can upload images
   - ✅ Can add/remove deacons, trustees, services
   - ✅ Can update church
   - ✅ UPDATE button visible

2. **Non-Owner Access (Other's Church)**
   - ✅ Can view all information
   - ✅ Read-only banner displayed
   - ✅ Input fields disabled (gray background)
   - ✅ Upload attempts show alert
   - ✅ Update button hidden
   - ✅ Add/Remove buttons trigger alerts

3. **Backend Protection**
   - ✅ PATCH requests return 403 for non-owners
   - ✅ DELETE requests return 403 for non-owners
   - ✅ GET requests include permission info
   - ✅ Ownership verified before any modification

---

## 📚 Documentation Updates

### API Reference Updated:

All church modification endpoints now documented as requiring ownership:

```
PATCH /api/dashboard/churches/:id
- Authentication: Required
- Authorization: Must be church creator
- Response: 403 if not owner
```

---

## 🚀 Deployment Notes

### Build Command:
```bash
npm run build
```

### Files Modified:
- **Backend:**
  - `src/middlewares/churchOwnershipMiddleware.ts` (NEW)
  - `src/routes/authDashboard.ts` (UPDATED)
  - `src/controllers/dashboardController.ts` (UPDATED)

- **Frontend:**
  - `saintshub/app/(dashboard)/church.tsx` (UPDATED)

### Database Changes:
- No migration needed (uses existing `user._id` field)

### Redis/Cache:
- No changes to caching logic

---

## 💡 Key Benefits

1. **Security:** Users can only modify churches they created
2. **Data Integrity:** Prevents accidental edits to other churches
3. **User Experience:** Clear visual feedback about permissions
4. **Scalability:** Middleware can be reused for other resources
5. **Auditability:** Ownership tracked via `user._id` field

---

## 📖 Usage Example

### Scenario: Pastor John vs Pastor Mary

**Setup:**
- Pastor John created "Grace Church" (ID: 123)
- Pastor Mary created "Faith Church" (ID: 456)

**Pastor John Views Grace Church (123):**
```
✅ Full Edit Access
- Can edit all fields
- Can upload images
- Can save changes
- UPDATE button visible
```

**Pastor John Views Faith Church (456):**
```
⚠️ View Only Mode
- Yellow banner displayed
- Input fields grayed out
- Upload attempts blocked
- UPDATE button hidden
```

---

## 🔧 Future Enhancements

Potential improvements:

1. **Multi-User Collaboration**
   - Add `editors` array to church model
   - Allow creator to grant edit access to specific users

2. **Role-Based Permissions**
   - Fine-grained permissions (view, edit, delete)
   - Different roles: Owner, Editor, Viewer

3. **Audit Log**
   - Track who made what changes
   - Display change history

4. **Transfer Ownership**
   - Allow creator to transfer church to another admin
   - Requires confirmation from both parties

---

## 📞 Support

For questions about this implementation:
- Check `API_REFERENCE_2025.md` for endpoint details
- Review middleware logic in `churchOwnershipMiddleware.ts`
- Test with different user accounts to verify permissions

---

**Implementation Date:** October 29, 2025  
**Status:** ✅ Complete and Tested
