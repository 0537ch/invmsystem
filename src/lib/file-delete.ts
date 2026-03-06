import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Delete file from uploads directory
 * @param filePath 
 * @returns 
 */
export async function deleteUploadedFile(filePath: string): Promise<boolean> {
  const filename = filePath.split('/').pop();
  if (!filename) {
    console.warn('Invalid file path:', filePath);
    return false;
  }

  const fullPath = path.join(process.cwd(), 'public', 'uploads', filename);

  if (!existsSync(fullPath)) {
    console.warn('File does not exist:', fullPath);
    return false;
  }

  try {
    await unlink(fullPath);
    return true;
  } catch (error) {
    console.error('Failed to delete file:', fullPath, error);
    throw error;
  }
}

export function isUploadedFile(filePath: string): boolean {
  return filePath.startsWith('/uploads/');
}
