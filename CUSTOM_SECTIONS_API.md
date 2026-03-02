# Custom Sections API Documentation

## Overview

Custom Sections allow church admins to create flexible organizational sections beyond the default Deacons and Trustees. Examples: Musicians, Youth Leaders, Choir, Media Team, Ushers, etc.

**Base Path:** `/api/dashboard/churches/:churchId/custom-sections`

**Authentication:** All endpoints require JWT authentication and church ownership verification

---

## Data Structure

### CustomSection Object
```typescript
{
  sectionName: string;        // e.g., "Musicians", "Youth Leaders"
  members: CustomSectionMember[];
  createdAt: Date;
}
```

### CustomSectionMember Object
```typescript
{
  names: string;              // Member's full name
  descriptions: string;       // Rich text HTML bio/description
  image: string;              // Cloudinary URL for member photo
}
```

---

## API Endpoints

### 1. Create Custom Section

**POST** `/api/dashboard/churches/:churchId/custom-sections`

Creates a new custom section for the church.

**Request Body:**
```json
{
  "sectionName": "Musicians",
  "members": [
    {
      "names": "Sarah Johnson",
      "descriptions": "<p>Lead worship pianist with 10 years of experience.</p>",
      "image": "https://res.cloudinary.com/..."
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "message": "Custom section created successfully",
  "section": {
    "sectionName": "Musicians",
    "members": [...],
    "createdAt": "2025-11-08T10:00:00.000Z"
  },
  "totalSections": 3
}
```

**Error Responses:**
- `400` - Section name already exists or missing
- `401` - Not authenticated
- `403` - Not church owner
- `404` - Church not found

---

### 2. Add Member to Section

**POST** `/api/dashboard/churches/:churchId/custom-sections/:sectionIndex/members`

Adds a new member to an existing custom section.

**URL Parameters:**
- `churchId` - Church MongoDB ObjectId
- `sectionIndex` - Zero-based index of the section (0, 1, 2...)

**Request Body:**
```json
{
  "names": "Michael Davis",
  "descriptions": "<p>Drummer and percussion specialist.</p>",
  "image": "https://res.cloudinary.com/..."
}
```

**Response (201 Created):**
```json
{
  "message": "Member added successfully",
  "member": {
    "names": "Michael Davis",
    "descriptions": "<p>Drummer and percussion specialist.</p>",
    "image": "https://..."
  },
  "sectionName": "Musicians",
  "totalMembers": 2
}
```

**Error Responses:**
- `400` - Invalid section index or missing member name
- `404` - Church not found

---

### 3. Update Section Name

**PATCH** `/api/dashboard/churches/:churchId/custom-sections/:sectionIndex`

Updates the name of a custom section.

**URL Parameters:**
- `churchId` - Church MongoDB ObjectId
- `sectionIndex` - Zero-based index of the section

**Request Body:**
```json
{
  "sectionName": "Worship Team"
}
```

**Response (200 OK):**
```json
{
  "message": "Section name updated successfully",
  "oldName": "Musicians",
  "newName": "Worship Team"
}
```

**Error Responses:**
- `400` - Section name already exists or missing
- `404` - Church not found

---

### 4. Update Member Information

**PATCH** `/api/dashboard/churches/:churchId/custom-sections/:sectionIndex/members/:memberIndex`

Updates a member's information within a custom section.

**URL Parameters:**
- `churchId` - Church MongoDB ObjectId
- `sectionIndex` - Zero-based section index
- `memberIndex` - Zero-based member index

**Request Body (all fields optional):**
```json
{
  "names": "Sarah Johnson-Smith",
  "descriptions": "<p>Updated bio with new accomplishments.</p>",
  "image": "https://res.cloudinary.com/new-image"
}
```

**Response (200 OK):**
```json
{
  "message": "Member updated successfully",
  "member": {
    "names": "Sarah Johnson-Smith",
    "descriptions": "<p>Updated bio...</p>",
    "image": "https://..."
  },
  "sectionName": "Worship Team"
}
```

---

### 5. Delete Custom Section

**DELETE** `/api/dashboard/churches/:churchId/custom-sections/:sectionIndex`

Deletes an entire custom section and all its members.

**URL Parameters:**
- `churchId` - Church MongoDB ObjectId
- `sectionIndex` - Zero-based section index

**Response (200 OK):**
```json
{
  "message": "Custom section deleted successfully",
  "deletedSection": "Musicians",
  "remainingSections": 2
}
```

**Error Responses:**
- `400` - Invalid section index
- `404` - Church not found

---

### 6. Delete Member from Section

**DELETE** `/api/dashboard/churches/:churchId/custom-sections/:sectionIndex/members/:memberIndex`

Removes a member from a custom section.

**URL Parameters:**
- `churchId` - Church MongoDB ObjectId
- `sectionIndex` - Zero-based section index
- `memberIndex` - Zero-based member index

**Response (200 OK):**
```json
{
  "message": "Member deleted successfully",
  "deletedMember": "Michael Davis",
  "sectionName": "Musicians",
  "remainingMembers": 1
}
```

---

## Usage Examples

### Frontend Integration (React Native)

```typescript
import { apiClient } from '../services/api';

// Create a new custom section
const createSection = async (churchId: string) => {
  const response = await apiClient.post(
    `/churches/${churchId}/custom-sections`,
    {
      sectionName: "Youth Leaders",
      members: []
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

// Add member to section
const addMember = async (churchId: string, sectionIndex: number) => {
  const response = await apiClient.post(
    `/churches/${churchId}/custom-sections/${sectionIndex}/members`,
    {
      names: "John Doe",
      descriptions: "<p>Youth coordinator</p>",
      image: cloudinaryUrl
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

// Update member
const updateMember = async (
  churchId: string, 
  sectionIndex: number, 
  memberIndex: number,
  updates: Partial<CustomSectionMember>
) => {
  const response = await apiClient.patch(
    `/churches/${churchId}/custom-sections/${sectionIndex}/members/${memberIndex}`,
    updates,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

// Delete section
const deleteSection = async (churchId: string, sectionIndex: number) => {
  const response = await apiClient.delete(
    `/churches/${churchId}/custom-sections/${sectionIndex}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};
```

---

## Important Notes

### Index-Based Operations
⚠️ All operations use **zero-based indices** (0, 1, 2...). When a section/member is deleted, indices shift down.

**Example:**
```
Initial state: [Section0, Section1, Section2]
Delete Section1: [Section0, Section2]
                  (Section2 is now at index 1)
```

### Auto-Save Pattern
The frontend implements auto-save, so changes persist immediately without a manual "Update Church" button.

### Rich Text Processing
Member descriptions support rich text HTML with automatic base64 image conversion to Cloudinary URLs. This prevents large API responses.

### Ownership Verification
All endpoints use `checkChurchOwnership` middleware. Users can only modify their own churches.

### Section Name Uniqueness
Section names must be unique within a church (case-insensitive). Creating "Musicians" when "musicians" exists will fail.

---

## Common Use Cases

### 1. Church with Custom Organization
```typescript
customSections: [
  {
    sectionName: "Musicians",
    members: [/* worship team members */]
  },
  {
    sectionName: "Youth Leaders",
    members: [/* youth coordinators */]
  },
  {
    sectionName: "Media Team",
    members: [/* sound/video operators */]
  }
]
```

### 2. Simple Church (No Custom Sections)
```typescript
customSections: []  // Default empty array
```

### 3. Adding Section Later
Churches can start with default Deacons/Trustees and add custom sections as needed.

---

## Error Handling

```typescript
try {
  await createSection(churchId);
} catch (error) {
  if (error.response?.status === 400) {
    // Section name conflict or validation error
    Alert.alert('Error', error.response.data.message);
  } else if (error.response?.status === 403) {
    // Not church owner
    Alert.alert('Permission Denied', 'You can only edit your own church');
  }
}
```

---

## Testing with Postman

1. **Get church data** to find `customSections` array and indices
2. **Create section** with POST request
3. **Add members** one by one
4. **Update** section names or member info
5. **Delete** members or entire sections
6. **Verify** changes persist across requests

Collection: `SaintsHub-API-Tests.postman_collection.json`

---

## Related Endpoints

- **Get Church:** `GET /api/dashboard/church/:id` - Returns church with `customSections` array
- **Update Church:** `PATCH /api/dashboard/churches/:id` - Can update entire `customSections` array
- **File Upload:** `POST /api/auth/upload-file-to-cloud` - Upload member images

---

## Version History

- **v2.0.0** (Nov 2025) - Initial custom sections implementation
  - Full CRUD operations
  - Rich text support
  - Auto-save integration
  - Ownership verification
