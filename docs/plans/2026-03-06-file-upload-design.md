# File Upload System Design

**Date:** 2026-03-06
**Status:** Approved
**Approach:** Simple Direct Upload

## Overview

Implement file upload functionality for banner images and videos using direct FormData upload to public/uploads directory.

## Requirements

- **Photos:** jpg, jpeg, png, webp, avif (NO gif)
- **Videos:** mp4, webm, mov
- **Max Size:** 20MB for images, 100MB for videos
- **Storage:** Local filesystem `/public/uploads/`
- **Cleanup:** Manual (user triggered)
- **Validation:** Both client-side and server-side
- **File Replacement:** Delete old file automatically on edit

## Architecture

```
┌─────────────┐     FormData      ┌──────────────┐
│  Browser    │ ─────────────────→│ /api/upload  │
│  (FormData) │                   │              │
└─────────────┘                   └──────┬───────┘
                                          │
                                          ↓
                                   ┌──────────────┐
                                   │ /public/     │
                                   │ uploads/     │
                                   │ 20250306-    │
                                   │ abc123.jpg   │
                                   └──────────────┘
```

## Components & Files

### New Files

1. **`src/app/api/upload/route.ts`**
   - POST endpoint for file upload
   - Validate format & size
   - Save to `/public/uploads/`
   - Return file path
   - DELETE endpoint for cleanup (optional)

2. **`src/lib/file-validation.ts`**
   - Format validation constants
   - Size validation helpers
   - Magic number validation
   - Shared between client & server

### Modified Files

1. **`src/app/banner/_hooks/use-banner-setting.ts`**
   - Add `handleUpload` function
   - Add state: `isUploading`, `uploadedFilePath`
   - Update `handleAddItem` to use uploaded file path
   - Update `handleSaveEdit` to use uploaded file path

2. **`src/app/banner/_components/BannerForm.tsx`**
   - Add file input (hidden)
   - Add upload trigger button
   - Show image/video preview after upload
   - Display uploaded file name

3. **`src/app/api/banner/[id]/route.ts`**
   - Add old file deletion logic on update
   - Add file deletion on banner delete

4. **`src/app/api/banner/route.ts`**
   - Handle file path in banner creation

## Data Flow

### Upload Flow (Add Banner)

```
User select file → Client validation → Upload to /api/upload →
Server validation → Save to /public/uploads/ → Return path →
Path stored in state → Form submit → Path saved to banners table
```

### Edit Flow (Replace File)

```
User edit banner → Select new file → Upload → Get new path →
Form submit → PUT /api/banner/[id] → Server deletes old file →
Update path in database
```

### Delete Flow

```
User delete banner → DELETE /api/banner/[id] →
Server deletes banner → Server deletes file from disk
```

## Validation Strategy

### Client-side (Browser)
- Check file extension before upload
- Check file size before upload
- Show error toast on failure

### Server-side (API)
- Double-check format (magic numbers)
- Double-check size
- Return 400 on validation failure

### Allowed Formats

**Images:**
- `.jpg`, `.jpeg` - JPEG images
- `.png` - PNG images
- `.webp` - WebP images
- `.avif` - AVIF images
- ❌ `.gif` - NOT allowed

**Videos:**
- `.mp4` - MP4 video
- `.webm` - WebM video
- `.mov` - QuickTime video

### Size Limits

| Type | Max Size |
|------|----------|
| Images | 20 MB |
| Videos | 100 MB |

## File Naming

Generate unique filenames to prevent conflicts:
```
{timestamp}-{randomString}{extension}
```

Example: `20250306-abc123.jpg`

## Database Changes

No database schema changes needed. File path stored in existing `url` field:
- Type `image`, `gdrive`, `video` → URL (existing)
- Type `upload` → `/uploads/filename.ext` (new)

## Error Handling

### Client Errors
- File too large → Toast error with size limit
- Invalid format → Toast error with allowed formats
- Upload failed → Toast error with server message

### Server Errors
- 400 Bad Request → Invalid file or size
- 500 Internal Error → Filesystem error

## Edge Cases

1. **Concurrent uploads** - Each upload gets unique filename
2. **Edit without new file** - Keep existing file path
3. **Delete banner with missing file** - Log warning, continue
4. **Disk full** - Return 500 error with message
5. **Invalid magic number** - Reject even if extension is valid

## Security Considerations

- Validate both extension AND magic numbers
- Never trust client-side validation alone
- Sanitize filenames (prevent path traversal)
- Store files outside web root if possible (future enhancement)
- Rate limiting (future enhancement)

## Future Enhancements

- Progress bar for large file uploads
- Image compression/optimization
- Video thumbnail generation
- Automatic cleanup of unused files
- CDN integration
- S3/cloud storage integration
