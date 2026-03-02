# Base64 Image Processing System

## Problem Statement

Rich text editors (like the one used in the dashboard) save images and videos as base64-encoded data URLs embedded directly in HTML:

```html
<img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..." />
```

**Impact:**
- Single image: 50-500 KB of base64 data
- Multiple images in descriptions: 1-5 MB per church record
- API response for Grace Community Church: **~2.8 MB** (crashed mobile app)
- Mobile app cannot handle responses > 500 KB efficiently

## Solution

Automatically extract base64 images/videos from rich text HTML, upload to Cloudinary, and replace with URLs.

### Before Processing
```html
<p>Welcome to our church!</p>
<img src="data:image/jpeg;base64,/9j/4AAQSkZJ..." width="300" />
<p>Join us for worship!</p>
```
**Size:** ~500 KB

### After Processing
```html
<p>Welcome to our church!</p>
<img src="https://res.cloudinary.com/saintshub/image/upload/v1234/church-image.jpg" width="300" />
<p>Join us for worship!</p>
```
**Size:** ~2 KB (99.6% reduction)

## Implementation

### 1. Core Utility: `processRichTextImages.ts`

**Location:** `src/utils/processRichTextImages.ts`

**Functions:**
- `extractBase64Images(html)` - Find all base64 images in HTML
- `extractBase64Videos(html)` - Find all base64 videos in HTML
- `uploadBase64ToCloudinary(base64Data, mimeType, resourceType)` - Upload to Cloudinary
- `processRichTextImages(html)` - Replace all base64 with URLs in HTML string
- `processChurchDescriptions(churchData)` - Process all description fields in church object

**Supported Formats:**
- **Images:** JPEG, PNG, GIF, WebP
- **Videos:** MP4, WebM, OGG

**Cloudinary Optimization:**
- Images stored in: `saintshub/rich-text-images/`
- Videos stored in: `saintshub/rich-text-videos/`
- Auto quality optimization: `quality: auto:good`
- Auto format: `fetch_format: auto` (WebP for browsers that support it)
- Max width: 1200px (responsive)

### 2. Updated Endpoints

#### `POST /api/dashboard/create-church`
**Change:** Processes descriptions before saving to database

```typescript
// BEFORE (saved raw base64)
const newChurch = await ChurchModel.create(churchData);

// AFTER (processes base64 → URLs)
const processedChurchData = await processChurchDescriptions(churchData);
const newChurch = await ChurchModel.create(processedChurchData);
```

#### `PATCH /api/dashboard/churches/:id`
**Change:** Processes descriptions before updating

```typescript
// AFTER
const processedData = await processChurchDescriptions(updatedData);
const updatedChurch = await ChurchModel.findByIdAndUpdate(churchId, processedData, ...);
```

#### `PATCH /api/dashboard/churches/:id/:field`
**Change:** Processes single field updates

```typescript
const processedData = await processChurchDescriptions(updateData);
const updatedChurch = await ChurchModel.findByIdAndUpdate(id, processedData, ...);
```

### 3. Processed Fields

The system automatically processes base64 content in these fields:

1. **`principal.description`** - Pastor/wife description
2. **`securities.deacons[].descriptions`** - Each deacon's bio
3. **`securities.trustees[].descriptions`** - Each trustee's bio
4. **`description`** - General church description (if used)

## Migration for Existing Data

### Run Migration Script

**Purpose:** Process existing churches that already have base64 images

```powershell
# Development
npx ts-node src/scripts/migrateBase64Images.ts

# Production (after building)
node dist/scripts/migrateBase64Images.js
```

**What it does:**
1. Connects to MongoDB
2. Finds all churches
3. Checks each for base64 content
4. Processes and uploads to Cloudinary
5. Updates database with new URLs
6. Provides summary report

**Sample Output:**
```
🚀 Starting base64 image migration...
✅ Connected to MongoDB
📊 Found 15 churches to process

[1/15] Processing: Grace Community Church (68f53d6c274df991152f5601)
  🔄 Processing base64 content...
  🔍 Found 3 base64 images in HTML
  📤 Uploading image to Cloudinary (450.23 KB)...
  ✅ Uploaded to Cloudinary: https://res.cloudinary.com/...
  📊 Original HTML size: 1500.45 KB
  📊 Processed HTML size: 2.12 KB
  📉 Size reduction: 99.9%
  ✅ Successfully processed and saved

[2/15] Processing: Faith Baptist Church (...)
  ⏭️  No base64 content found - skipping

============================================================
📊 MIGRATION SUMMARY
============================================================
Total Churches: 15
✅ Processed: 5
⏭️  Skipped (no base64): 9
❌ Errors: 1
============================================================
```

## Testing

### 1. Test Create Church with Base64 Image

```bash
POST /api/dashboard/create-church
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "Test Church",
  "location": "Test City",
  "principal": {
    "pastor": "Pastor John",
    "wife": "Jane Doe",
    "image": "",
    "description": "<p>Welcome!</p><img src=\"data:image/jpeg;base64,/9j/4AAQ...\" />"
  }
}
```

**Expected:**
- Church created successfully
- Console shows: "🔄 Processing rich text descriptions..."
- Console shows: "🔍 Found 1 base64 images in HTML"
- Console shows: "✅ Uploaded to Cloudinary: https://..."
- Saved description contains Cloudinary URL, not base64

### 2. Test Update Church

```bash
PATCH /api/dashboard/churches/68f53d6c274df991152f5601
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "principal": {
    "description": "<p>Updated bio</p><img src=\"data:image/png;base64,iVBORw0K...\" />"
  }
}
```

**Expected:**
- Same processing as create
- Base64 replaced with Cloudinary URL before saving

### 3. Verify Mobile App Response Size

```bash
GET /api/dashboard/church/68f53d6c274df991152f5601
Authorization: Bearer YOUR_TOKEN
```

**Before Fix:**
- Response size: ~2.8 MB
- Mobile app: CRASH

**After Fix:**
- Response size: ~10-50 KB (depending on data)
- Mobile app: Loads successfully ✅

## Performance Impact

### API Response Times

- **Image extraction:** ~5ms per image
- **Cloudinary upload:** ~200-500ms per image (async)
- **HTML replacement:** ~2ms per image

**Example:**
- Church with 5 base64 images in descriptions
- Total processing time: ~2-3 seconds (acceptable for create/update)
- Future API calls: Instant (URLs already processed)

### Storage

- **Before:** Base64 stored in MongoDB (expensive, slow queries)
- **After:** URLs stored in MongoDB (cheap, fast queries)
- **Cloudinary:** Optimized images with CDN delivery

## Error Handling

### Cloudinary Upload Fails

If Cloudinary upload fails for any image:
1. Error logged to console
2. Original base64 content preserved
3. Processing continues for other images
4. Church save operation succeeds

```typescript
try {
  const cloudinaryUrl = await uploadBase64ToCloudinary(...);
  processedHtml = processedHtml.replace(image.full, newImgTag);
} catch (error) {
  console.error('❌ Failed to process image, keeping original:', error);
  // Original base64 remains in HTML
}
```

### Invalid Base64 Data

- Regex extracts only valid base64 patterns
- Invalid data is ignored
- No impact on save operation

## Monitoring

### Console Logs (Development)

```
🔄 Processing rich text descriptions...
📝 Processing principal.description...
🔍 Found 2 base64 images in HTML
📊 Original HTML size: 850.34 KB
📤 Uploading image to Cloudinary (420.12 KB)...
✅ Uploaded to Cloudinary: https://res.cloudinary.com/saintshub/...
📤 Uploading image to Cloudinary (380.45 KB)...
✅ Uploaded to Cloudinary: https://res.cloudinary.com/saintshub/...
📊 Processed HTML size: 1.89 KB
📉 Size reduction: 99.8%
📝 Processing 3 deacon descriptions...
✅ Church description processing complete
```

### Production Monitoring

Check logs for:
- `❌ Failed to upload` - Cloudinary issues
- `Error processing rich text images` - Unexpected errors
- Track response sizes before/after migration

## Cloudinary Configuration

Required environment variables:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Configured in:** `src/utils/cloudinary.ts`

## Rollback Plan

If issues arise:

1. **Disable processing temporarily:**
   ```typescript
   // In authDashboard.ts, comment out:
   // const processedData = await processChurchDescriptions(updatedData);
   // Use original data instead:
   const processedData = updatedData;
   ```

2. **Restore from backup:**
   - MongoDB backups should be taken before migration
   - Restore: `mongorestore --uri="..." --drop dump/`

3. **Manual fix specific church:**
   ```javascript
   db.spaces.updateOne(
     { _id: ObjectId("68f53d6c274df991152f5601") },
     { $set: { "principal.description": "..." } }
   )
   ```

## Future Enhancements

1. **Batch Processing:** Process multiple images in parallel
2. **Progress Indicators:** Real-time upload progress for users
3. **Image Variants:** Generate thumbnails automatically
4. **Lazy Migration:** Process on-demand when church is accessed
5. **Analytics:** Track total space saved, upload success rate

## Related Files

- `src/utils/processRichTextImages.ts` - Core utility
- `src/routes/authDashboard.ts` - Updated endpoints
- `src/scripts/migrateBase64Images.ts` - Migration script
- `src/utils/cloudinary.ts` - Cloudinary configuration

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify Cloudinary credentials in `.env`
3. Test with small base64 image first
4. Review migration script output
