import { put } from '@vercel/blob';

/**
 * Upload a file to Vercel Blob storage
 * @param file - The file to upload
 * @param folder - Optional folder path (e.g., 'licenses', 'portfolio')
 * @returns URL of the uploaded file
 */
export async function uploadFile(file: File, folder?: string): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  }

  // Generate a unique filename
  const timestamp = Date.now();
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = folder
    ? `${folder}/${timestamp}-${sanitizedFilename}`
    : `${timestamp}-${sanitizedFilename}`;

  // Upload to Vercel Blob
  const blob = await put(filename, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return blob.url;
}

/**
 * Validate file upload
 * @param file - The file to validate
 * @param options - Validation options
 */
export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] } = options;

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}
