export const MAX_IMAGE_SIZE = 20 * 1024 * 1024; 
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];
export const ALLOWED_EXTENSIONS = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS];

const MAGIC_NUMBERS: Record<string, string[]> = {
  '.jpg': ['ffd8ff'],
  '.jpeg': ['ffd8ff'],
  '.png': ['89504e47'],
  '.webp': ['52494646'], 
  '.avif': ['000000186674797061766966'], 
  '.mp4': [], 
  '.webm': ['1a45dfa3'], 
  '.mov': ['6d6f6f76'], 
};

export type FileType = 'image' | 'video';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function getFileType(filename: string): FileType | null {
  const ext = getFileExtension(filename);
  if (ALLOWED_IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (ALLOWED_VIDEO_EXTENSIONS.includes(ext)) return 'video';
  return null;
}

export function getFileExtension(filename: string): string {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ext.startsWith('.') ? ext : `.${ext}`;
}


export function isAllowedExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ALLOWED_EXTENSIONS.includes(ext);
}

export function isGifFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ext === '.gif';
}

export function getMaxSize(fileType: FileType): number {
  return fileType === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

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

async function readMagicNumber(file: File): Promise<string> {
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}


export async function validateMagicNumber(file: File): Promise<ValidationResult> {
  const ext = getFileExtension(file.name);

  if (!(ext in MAGIC_NUMBERS)) {
    return { valid: true };
  }

  try {
    const magicNumber = await readMagicNumber(file);
    const validMagicNumbers = MAGIC_NUMBERS[ext];

    if (ext === '.mp4') {
      if (magicNumber.length >= 16) {
        const hasFtyp = magicNumber.substring(8, 16) === '66747970';
        if (hasFtyp) {
          return { valid: true };
        }
      }
      return {
        valid: false,
        error: `File content does not match ${ext} format`
      };
    }

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

export async function validateFileForUpload(file: File): Promise<ValidationResult> {
  const extResult = validateFileExtension(file.name);
  if (!extResult.valid) return extResult;

  const sizeResult = validateFileSize(file);
  if (!sizeResult.valid) return sizeResult;

  const magicResult = await validateMagicNumber(file);
  if (!magicResult.valid) return magicResult;

  return { valid: true };
}
export function generateUniqueFilename(originalFilename: string): string {
  const ext = getFileExtension(originalFilename);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext}`;
}

export function getValidationErrorMessage(result: ValidationResult): string {
  return result.error || 'Unknown validation error';
}
