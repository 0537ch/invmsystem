# File Upload Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement file upload functionality for banner images and videos with client/server validation, automatic cleanup, and direct file storage.

**Architecture:** Simple Direct Upload - Browser sends FormData to `/api/upload`, server validates and saves to `/public/uploads/`, returns file path which is stored in database.

**Tech Stack:** Next.js 16.1.4 App Router, TypeScript, postgres, FormData API, Node.js fs/promises

---

## Task 1: Create File Validation Library

**Files:**
- Create: `src/lib/file-validation.ts`

**Step 1: Create validation constants and helpers**

Write file with format validation, size limits, and magic number checking:

```typescript
// src/lib/file-validation.ts

// Size limits in bytes
export const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Allowed file extensions
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];
export const ALLOWED_EXTENSIONS = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS];

// Magic numbers (file signatures) for validation
const MAGIC_NUMBERS: Record<string, string[]> = {
  '.jpg': ['ffd8ff'],
  '.jpeg': ['ffd8ff'],
  '.png': ['89504e47'],
  '.webp': ['52494646', '524946461c57eb5a'], // RIFF...WEBP
  '.avif': ['000000186674797061766966'], // ftypavif
  '.mp4': ['00000018667479706d703432'], // ftypmp42
  '.webm': ['1a45dfa3'], // EBML header
  '.mov': ['6d6f6f76'], // moov atom
};

export type FileType = 'image' | 'video';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Get file type from extension
 */
export function getFileType(filename: string): FileType | null {
  const ext = getFileExtension(filename);
  if (ALLOWED_IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (ALLOWED_VIDEO_EXTENSIONS.includes(ext)) return 'video';
  return null;
}

/**
 * Get file extension with dot
 */
export function getFileExtension(filename: string): string {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ext.startsWith('.') ? ext : `.${ext}`;
}

/**
 * Check if file extension is allowed
 */
export function isAllowedExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Check if file is GIF (explicitly not allowed)
 */
export function isGifFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ext === '.gif';
}

/**
 * Get max size for file type
 */
export function getMaxSize(fileType: FileType): number {
  return fileType === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): ValidationResult {
  const fileType = getFileType(file.name);

  if (!fileType) {
    return { valid: false, error: 'Unknown file type' };
  }

  const maxSize = getMaxSize(fileType);

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size for ${fileType}s is ${formatBytes(maxSize)}`
    };
  }

  return { valid: true };
}

/**
 * Validate file extension
 */
export function validateFileExtension(filename: string): ValidationResult {
  if (isGifFile(filename)) {
    return { valid: false, error: 'GIF files are not allowed' };
  }

  if (!isAllowedExtension(filename)) {
    return {
      valid: false,
      error: `Invalid file format. Allowed: images (${ALLOWED_IMAGE_EXTENSIONS.join(', ')}) and videos (${ALLOWED_VIDEO_EXTENSIONS.join(', ')})`
    };
  }

  return { valid: true };
}

/**
 * Read file magic number from buffer
 */
async function readMagicNumber(file: File): Promise<string> {
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate magic number matches extension
 */
export async function validateMagicNumber(file: File): Promise<ValidationResult> {
  const ext = getFileExtension(file.name);

  // Skip validation for extensions without magic number check
  if (!MAGIC_NUMBERS[ext]) {
    return { valid: true };
  }

  try {
    const magicNumber = await readMagicNumber(file);
    const validMagicNumbers = MAGIC_NUMBERS[ext];

    // Check if file starts with any of the valid magic numbers for this extension
    const isValid = validMagicNumbers.some(valid =>
      magicNumber.startsWith(valid)
    );

    if (!isValid) {
      return {
        valid: false,
        error: `File content does not match ${ext} format`
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to read file for validation'
    };
  }
}

/**
 * Complete client-side validation
 */
export async function validateFileForUpload(file: File): Promise<ValidationResult> {
  // Check extension
  const extResult = validateFileExtension(file.name);
  if (!extResult.valid) return extResult;

  // Check size
  const sizeResult = validateFileSize(file);
  if (!sizeResult.valid) return sizeResult;

  // Check magic number
  const magicResult = await validateMagicNumber(file);
  if (!magicResult.valid) return magicResult;

  return { valid: true };
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalFilename: string): string {
  const ext = getFileExtension(originalFilename);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext}`;
}

/**
 * Get human-readable error message for validation result
 */
export function getValidationErrorMessage(result: ValidationResult): string {
  return result.error || 'Unknown validation error';
}
```

**Step 2: Verify file compiles**

Run: `npx tsc --noEmit --skipLibCheck src/lib/file-validation.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/file-validation.ts
git commit -m "feat: add file validation library

- Add format validation for images (jpg, png, webp, avif) and videos (mp4, webm, mov)
- Add size limits: 20MB for images, 100MB for videos
- Add magic number validation for security
- Helper functions for file type detection and error formatting
"
```

---

## Task 2: Create Upload API Route

**Files:**
- Create: `src/app/api/upload/route.ts`

**Step 1: Create upload endpoint**

```typescript
// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import {
  validateFileExtension,
  validateFileSize,
  validateMagicNumber,
  generateUniqueFilename,
  getValidationErrorMessage,
  type ValidationResult
} from '@/lib/file-validation';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure uploads directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Parse file from FormData
 */
async function parseFormData(request: Request): Promise<{ file: File; error?: string }> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return { file: null as any, error: 'No file provided' };
    }

    return { file };
  } catch (error) {
    return {
      file: null as any,
      error: 'Failed to parse form data'
    };
  }
}

/**
 * Validate file on server-side
 */
async function validateFile(file: File): Promise<ValidationResult> {
  // Check extension
  const extResult = validateFileExtension(file.name);
  if (!extResult.valid) return extResult;

  // Check size
  const sizeResult = validateFileSize(file);
  if (!sizeResult.valid) return sizeResult;

  // Check magic number
  const magicResult = await validateMagicNumber(file);
  if (!magicResult.valid) return magicResult;

  return { valid: true };
}

export async function POST(request: Request) {
  try {
    // Parse form data
    const { file, error: parseError } = await parseFormData(request);

    if (parseError || !file) {
      return NextResponse.json(
        { error: parseError || 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validationResult = await validateFile(file);

    if (!validationResult.valid) {
      return NextResponse.json(
        { error: getValidationErrorMessage(validationResult) },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    await ensureUploadDir();

    // Generate unique filename
    const filename = generateUniqueFilename(file.name);
    const filepath = path.join(UPLOAD_DIR, filename);

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filepath, buffer);

    // Return the public URL path
    const publicPath = `/uploads/${filename}`;

    return NextResponse.json({
      path: publicPath,
      filename: filename,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify file compiles**

Run: `npx tsc --noEmit --skipLibCheck src/app/api/upload/route.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/api/upload/route.ts
git commit -m "feat: add upload API endpoint

- POST /api/upload for file uploads
- Server-side validation (format, size, magic numbers)
- Save files to /public/uploads/
- Generate unique filenames with timestamp + random string
- Return public path for stored file
"
```

---

## Task 3: Create File Deletion Utility

**Files:**
- Create: `src/lib/file-delete.ts`

**Step 1: Create file deletion helper**

```typescript
// src/lib/file-delete.ts
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Delete file from uploads directory
 * @param filePath - Public path like '/uploads/filename.jpg'
 * @returns true if deleted, false if file didn't exist
 */
export async function deleteUploadedFile(filePath: string): Promise<boolean> {
  // Extract filename from public path
  const filename = filePath.split('/').pop();
  if (!filename) {
    console.warn('Invalid file path:', filePath);
    return false;
  }

  const fullPath = path.join(process.cwd(), 'public', 'uploads', filename);

  // Check if file exists
  if (!existsSync(fullPath)) {
    console.warn('File does not exist:', fullPath);
    return false;
  }

  try {
    await unlink(fullPath);
    console.log('Deleted file:', fullPath);
    return true;
  } catch (error) {
    console.error('Failed to delete file:', fullPath, error);
    throw error;
  }
}

/**
 * Check if a file path is an uploaded file (vs external URL)
 */
export function isUploadedFile(filePath: string): boolean {
  return filePath.startsWith('/uploads/');
}
```

**Step 2: Verify file compiles**

Run: `npx tsc --noEmit --skipLibCheck src/lib/file-delete.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/file-delete.ts
git commit -m "feat: add file deletion utility

- Add deleteUploadedFile() to remove files from /public/uploads/
- Add isUploadedFile() to check if path is local upload
- Handle missing files gracefully
"
```

---

## Task 4: Update Banner Hook with Upload Handling

**Files:**
- Modify: `src/app/banner/_hooks/use-banner-setting.ts`

**Step 1: Add upload state and handler**

Add to state declarations (after line 38):

```typescript
const [isUploading, setIsUploading] = useState(false);
const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
```

Add upload handler function (after handleToggleActive):

```typescript
const handleUpload = async (file: File): Promise<string | null> => {
  setIsUploading(true);
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      toast.error(errorData.error || 'Failed to upload file');
      return null;
    }

    const data = await response.json();
    const filePath = data.path;
    setUploadedFilePath(filePath);
    toast.success('File uploaded successfully!');
    return filePath;
  } catch (error) {
    console.error('Error uploading file:', error);
    toast.error('Failed to upload file');
    return null;
  } finally {
    setIsUploading(false);
  }
};
```

**Step 2: Update return statement**

Add to return object (before closing brace):

```typescript
return {
  // ... existing returns
  isUploading,
  uploadedFilePath,
  setUploadedFilePath,
  handleUpload,
};
```

**Step 3: Commit**

```bash
git add src/app/banner/_hooks/use-banner-setting.ts
git commit -m "feat: add upload handling to banner hook

- Add isUploading and uploadedFilePath state
- Add handleUpload() function for file uploads
- Show toast notifications for upload success/failure
- Return upload state and handler from hook
"
```

---

## Task 5: Update Banner Form with Upload UI

**Files:**
- Modify: `src/app/banner/_components/BannerForm.tsx`

**Step 1: Add upload props to interface**

Add to BannerFormProps interface:

```typescript
interface BannerFormProps {
  // ... existing props
  onUpload?: (file: File) => Promise<string | null>;
  isUploading?: boolean;
  uploadedFilePath?: string | null;
}
```

**Step 2: Destructure new props**

Add to destructuring in function parameters:

```typescript
export function BannerForm({
  // ... existing props
  onUpload,
  isUploading = false,
  uploadedFilePath = null,
}: BannerFormProps) {
```

**Step 3: Add file input ref and state**

Add after existing refs:

```typescript
const uploadInputRef = useRef<HTMLInputElement>(null);
```

**Step 4: Add upload handler**

Add before return statement:

```typescript
const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!onUpload) return;

  const filePath = await onUpload(file);
  if (filePath) {
    onDataChange({ ...data, url: filePath });
  }

  // Reset input
  if (uploadInputRef.current) {
    uploadInputRef.current.value = '';
  }
};
```

**Step 5: Replace URL input with upload option**

Replace the URL Input section (around line 217-252) with:

```typescript
{/* URL Input or File Upload */}
<div className="space-y-2">
  {category === 'image' ? (
    <>
      <Label>Sumber Gambar</Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={data.url?.startsWith('/uploads/') ? 'default' : 'outline'}
          onClick={() => uploadInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Mengunggah...' : 'Upload File'}
        </Button>
        <span className="flex items-center text-muted-foreground">atau</span>
        <Input
          placeholder="https://example.com/image.jpg"
          value={!data.url?.startsWith('/uploads/') ? (data.url || '') : ''}
          onChange={(e) => onDataChange({ ...data, url: e.target.value })}
          disabled={isUploading}
        />
      </div>
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleFileSelect}
      />
      {uploadedFilePath && data.url === uploadedFilePath && (
        <p className="text-xs text-muted-foreground">
          Uploaded: {uploadedFilePath}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Upload file gambar (max 20MB) atau tempel URL gambar langsung
      </p>
    </>
  ) : category === 'video' ? (
    <>
      <Label>Upload Video atau URL</Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={data.url?.startsWith('/uploads/') ? 'default' : 'outline'}
          onClick={() => uploadInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Mengunggah...' : 'Upload Video'}
        </Button>
        <span className="flex items-center text-muted-foreground">atau</span>
        <Input
          placeholder="https://example.com/video.mp4"
          value={!data.url?.startsWith('/uploads/') ? (data.url || '') : ''}
          onChange={(e) => onDataChange({ ...data, url: e.target.value })}
          disabled={isUploading}
        />
      </div>
      <input
        ref={uploadInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleFileSelect}
      />
      {uploadedFilePath && data.url === uploadedFilePath && (
        <p className="text-xs text-muted-foreground">
          Uploaded: {uploadedFilePath}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Upload file video (max 100MB) atau tempel URL file video
      </p>
    </>
  ) : category === 'html' ? (
    // ... existing HTML input code
  ) : (
    // ... existing YouTube input code
  )}
</div>
```

**Step 6: Update parent component to pass upload props**

In `src/app/banner/_components/bannerSetting.tsx`, add to BannerForm calls:

Find `<BannerForm mode="add"` and add props:
```typescript
<BannerForm
  mode="add"
  // ... existing props
  onUpload={handleUpload}
  isUploading={isUploading}
  uploadedFilePath={uploadedFilePath}
/>
```

Do the same for edit form.

**Step 7: Commit**

```bash
git add src/app/banner/_components/BannerForm.tsx src/app/banner/_components/bannerSetting.tsx
git commit -m "feat: add file upload UI to banner form

- Add upload button for images and videos
- Show upload button state when file is uploaded
- Allow switching between upload and URL input
- Display uploaded file path
- Pass upload handler from hook to form
"
```

---

## Task 6: Update Banner API Routes for File Cleanup

**Files:**
- Modify: `src/app/api/banner/[id]/route.ts`

**Step 1: Import file deletion utility**

Add at top of file:

```typescript
import { deleteUploadedFile, isUploadedFile } from '@/lib/file-delete';
```

**Step 2: Add file cleanup to PUT endpoint**

After getting currentBanner (around line 70), add old file deletion:

```typescript
const [currentBanner] = await sql<Banner[]>`
  SELECT * FROM banners WHERE id = ${id}
`

if (!currentBanner) {
  return NextResponse.json(
    { error: 'Banner not found' },
    { status: 404 }
  )
}

// Delete old uploaded file if url is changing
const isNewUploadedFile = url.startsWith('/uploads/');
const wasOldUploadedFile = isUploadedFile(currentBanner.url);

if (wasOldUploadedFile && isNewUploadedFile && currentBanner.url !== url) {
  // Old file was uploaded, new file is also uploaded and different
  await deleteUploadedFile(currentBanner.url).catch(err => {
    console.error('Failed to delete old file:', err);
    // Don't fail the request, just log the error
  });
}
```

**Step 3: Add file cleanup to DELETE endpoint**

After banner deletion (around line 188), add file deletion:

```typescript
const [banner] = await sql<Banner[]>`
  DELETE FROM banners
  WHERE id = ${id}
  RETURNING *
`

if (!banner) {
  return NextResponse.json(
    { error: 'Banner not found' },
    { status: 404 }
  )
}

// Delete uploaded file if exists
if (isUploadedFile(banner.url)) {
  await deleteUploadedFile(banner.url).catch(err => {
    console.error('Failed to delete banner file:', err);
    // Don't fail the request, just log the error
  });
}

await sql`
  UPDATE banners
  SET position = position - 1
  WHERE position > ${banner.position}
`
```

**Step 4: Commit**

```bash
git add src/app/api/banner/[id]/route.ts
git commit -m "feat: add automatic file cleanup on banner update/delete

- Delete old uploaded file when banner is updated with new file
- Delete uploaded file when banner is deleted
- Handle missing files gracefully
- Log errors without failing the request
"
```

---

## Task 7: Create Uploads Directory

**Files:**
- Create: `public/uploads/.gitkeep`

**Step 1: Create directory and placeholder**

```bash
mkdir -p public/uploads
touch public/uploads/.gitkeep
```

**Step 2: Create .gitignore for uploads**

Create `public/uploads/.gitignore`:

```
# Ignore uploaded files but keep directory
!.gitkeep
*
```

**Step 3: Commit**

```bash
git add public/uploads/.gitkeep public/uploads/.gitignore
git commit -m "chore: create uploads directory

- Add public/uploads directory for file storage
- Add .gitignore to exclude uploaded files from git
- Keep .gitkeep to track directory structure
"
```

---

## Task 8: Manual Testing

**Step 1: Test image upload**

1. Run dev server: `npm run dev`
2. Navigate to banner settings page
3. Click "Tambah Item"
4. Select "Gambar" as content type
5. Click "Upload File" button
6. Select a JPG file under 20MB
7. Verify: Toast shows success, file path displayed
8. Submit form
9. Verify: Banner created with uploaded image

**Step 2: Test video upload**

1. Click "Tambah Item"
2. Select "Video" as content type
3. Click "Upload Video" button
4. Select an MP4 file under 100MB
5. Verify: Toast shows success, file path displayed
6. Submit form
7. Verify: Banner created with uploaded video

**Step 3: Test validation errors**

1. Try uploading a GIF file
   - Expected: Error toast "GIF files are not allowed"
2. Try uploading a file over 20MB (as image)
   - Expected: Error toast with size limit
3. Try uploading a file over 100MB (as video)
   - Expected: Error toast with size limit

**Step 4: Test file cleanup on edit**

1. Edit an existing banner with uploaded file
2. Upload a new file
3. Save changes
4. Verify: New file works, old file deleted from disk

**Step 5: Test file cleanup on delete**

1. Create banner with uploaded file
2. Delete banner
3. Verify: File deleted from `public/uploads/`

**Step 6: Check files are created**

Run: `ls -la public/uploads/`
Expected: Uploaded files present

---

## Verification Checklist

Before considering implementation complete:

- [ ] Images (jpg, png, webp, avif) upload successfully
- [ ] Videos (mp4, webm, mov) upload successfully
- [ ] GIF files are rejected
- [ ] Files over size limit are rejected
- [ ] Uploaded files display correctly in banner preview
- [ ] Old files deleted when banner is updated with new file
- [ ] Files deleted when banner is deleted
- [ ] Error messages are clear and helpful
- [ ] Toast notifications show for success/error
- [ ] Files are accessible via `/uploads/filename.ext` URL

---

## Notes for Implementation

- **DRY:** File validation logic is shared between client and server via `file-validation.ts`
- **YAGNI:** No progress bar or compression - add later if needed
- **TDD:** Manual testing is specified - unit tests can be added later
- **Frequent commits:** Each task is a separate commit for easy rollback
- **Security:** Magic number validation prevents file type spoofing
- **Error handling:** Missing files don't crash the app, just log warnings

---

## Edge Cases Handled

1. **Concurrent uploads** - Unique filenames prevent collisions
2. **Edit without new file** - Existing URL preserved
3. **Delete with missing file** - Graceful degradation with warning log
4. **Disk full** - Returns 500 error to client
5. **Invalid magic number** - File rejected with clear error message
6. **GIF files** - Explicitly rejected with specific message
