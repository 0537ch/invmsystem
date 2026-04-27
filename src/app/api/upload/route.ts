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
async function parseFormData(request: Request): Promise<{ file: File | null; error?: string }> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return { file: null, error: 'No file provided' };
    }

    return { file };
  } catch {
    return {
      file: null,
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
