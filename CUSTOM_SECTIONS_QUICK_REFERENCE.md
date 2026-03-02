# Custom Sections - Quick Reference Card

## 🎯 What It Is
Flexible church organizational sections beyond Deacons/Trustees. Examples: Musicians, Youth Leaders, Choir, Media Team, Ushers, etc.

---

## 📱 Frontend Usage

### Create Section
1. Tap "Add Custom Section" button
2. Enter name (e.g., "Musicians")
3. Section created with empty members

### Add Member
1. Tap "Add Member" in section
2. Enter member name
3. Tap "Edit" for description (rich text)
4. Upload photo (optional)
5. Auto-saves immediately

### Edit Member
- **Name:** Type directly in field
- **Description:** Tap "Edit" button → rich text editor
- **Photo:** Tap image → pick new / tap X to remove

### Manage Section
- **Rename:** Tap "Rename" button → enter new name
- **Delete:** Tap "Delete Section" → confirm deletion

---

## 🔌 API Endpoints

### Base URL
`/api/dashboard/churches/:churchId/custom-sections`

### Operations
```
POST   /                                      - Create section
POST   /:sectionIndex/members                 - Add member
PATCH  /:sectionIndex                         - Rename section
PATCH  /:sectionIndex/members/:memberIndex    - Update member
DELETE /:sectionIndex                         - Delete section
DELETE /:sectionIndex/members/:memberIndex    - Delete member
```

### Authentication
All endpoints require:
- JWT token in `Authorization: Bearer <token>` header
- Church ownership (user must own the church)

---

## 💾 Data Structure

### Section
```json
{
  "sectionName": "Musicians",
  "members": [...],
  "createdAt": "2025-11-08T10:00:00.000Z"
}
```

### Member
```json
{
  "names": "Sarah Johnson",
  "descriptions": "<p>Lead pianist...</p>",
  "image": "https://res.cloudinary.com/..."
}
```

---

## ✨ Key Features

### ✅ Auto-Save
All changes save immediately - no manual "Update" button needed

### ✅ Rich Text
Member descriptions support full HTML formatting with images

### ✅ Image Upload
Members can have profile photos stored in Cloudinary

### ✅ Ownership Protected
Only church creators can edit - others view in read-only mode

### ✅ Validation
- Unique section names per church
- Required fields validated
- Error messages shown

---

## 🎨 UI Components

### Section Card
```
┌─────────────────────────────┐
│ Musicians (2 members)       │
│ [Rename] [Delete Section]   │
├─────────────────────────────┤
│ Member 1                [X] │
│ Name: Sarah Johnson         │
│ Description: [Edit]         │
│ Photo: [Upload]             │
├─────────────────────────────┤
│ Member 2                [X] │
│ ...                         │
├─────────────────────────────┤
│ [+ Add Member]              │
└─────────────────────────────┘
```

### Add Section Button
```
┌─────────────────────────────┐
│ ⊕ Add Custom Section        │
│   Create sections like      │
│   Musicians, Youth...       │
└─────────────────────────────┘
```

---

## 🔒 Security

### Backend
- JWT authentication required
- Ownership verification on all operations
- Input validation and sanitization
- Index-based operations (not IDs in URLs)

### Frontend
- Read-only mode for non-owners
- Confirmation prompts for deletions
- Error handling with toast notifications
- Secure state management

---

## 📊 State Management

### Church Object
```typescript
church: {
  customSections: [
    {
      sectionName: "Musicians",
      members: [
        { names: "...", descriptions: "...", image: "..." }
      ],
      createdAt: "..."
    }
  ]
}
```

### Updates
```typescript
// Auto-save on every change
autoSave('customSections', updatedSections);

// Local state updates immediately
setChurch({ ...church, customSections: updated });
```

---

## 🐛 Troubleshooting

### Section Not Saving
- ✅ Check network connection
- ✅ Verify JWT token valid
- ✅ Confirm you own the church
- ✅ Check console for errors

### Images Not Displaying
- ✅ Verify Cloudinary URL valid
- ✅ Check image uploaded successfully
- ✅ Confirm network connection
- ✅ Try re-uploading image

### Rich Text Not Rendering
- ✅ Check HTML content valid
- ✅ Verify RichTextDisplay component
- ✅ Confirm colors prop passed
- ✅ Check for base64 images (should be URLs)

### Duplicate Section Name Error
- ✅ Section names must be unique per church
- ✅ Check existing sections
- ✅ Comparison is case-insensitive
- ✅ Use different name

---

## 📝 Examples

### Create "Musicians" Section
```typescript
// Frontend
addCustomSection() → prompt("Musicians") → auto-saves

// Backend receives
POST /churches/:id/custom-sections
Body: { sectionName: "Musicians", members: [] }

// Response
{ message: "Custom section created", section: {...} }
```

### Add Member to Section
```typescript
// Frontend
addCustomSectionMember(0) → new member appears → user fills info

// Backend receives (on each field change)
PATCH /churches/:id/custom-sections/0/members/0
Body: { names: "Sarah Johnson" }

// Response
{ message: "Member updated", member: {...} }
```

---

## 📚 Related Files

### Backend
- `src/models/Space.ts` - Schema definition
- `src/routes/authDashboard.ts` - API routes
- `src/utils/processRichTextImages.ts` - Image processing

### Frontend
- `saintshub/utilities/tools.ts` - TypeScript types
- `saintshub/app/(dashboard)/church.tsx` - UI & logic

### Documentation
- `CUSTOM_SECTIONS_API.md` - Full API reference
- `CUSTOM_SECTIONS_IMPLEMENTATION_SUMMARY.md` - Detailed guide
- `API_REFERENCE_2025.md` - Complete API docs

---

## ⚡ Quick Tips

1. **Section names** are unique per church (case-insensitive)
2. **All changes auto-save** - no manual update needed
3. **Rich text descriptions** support full HTML formatting
4. **Index-based operations** - indices shift after deletions
5. **Ownership required** - only church creators can edit
6. **Toast notifications** confirm actions (success/error)
7. **Animated UI** with staggered entrance delays
8. **Read-only mode** for viewing churches you don't own
9. **Image uploads** go to Cloudinary, not base64
10. **Delete confirmations** prevent accidental removals

---

## 🎉 Success Criteria

### Backend
✅ All 6 CRUD endpoints working
✅ Authentication and ownership verified
✅ Rich text images converted to URLs
✅ Validation errors returned clearly
✅ Auto-saves persist across sessions

### Frontend
✅ Create/rename/delete sections
✅ Add/edit/delete members
✅ Rich text editor integration
✅ Image upload/remove working
✅ Auto-save on all changes
✅ Toast notifications showing
✅ Read-only mode for non-owners
✅ Changes persist after navigation

---

**Version:** 1.0.0  
**Date:** November 8, 2025  
**Status:** ✅ COMPLETE
