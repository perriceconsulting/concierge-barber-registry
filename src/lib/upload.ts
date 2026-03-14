import { put } from '@vercel/blob';

/**
 * File type signatures (magic numbers) for validation
 * These are the byte sequences that identify each file type
 */
const FILE_SIGNATURES: Record<string, { bytes: number[][]; extension: string }> = {
  'image/jpeg': {
    bytes: [[0xff, 0xd8, 0xff]],
    extension: 'jpg',
  },
  'image/png': {
    bytes: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    extension: 'png',
  },
  'image/webp': {
    bytes: [[0x52, 0x49, 0x46, 0x46]], // RIFF header (followed by WEBP at offset 8)
    extension: 'webp',
  },
  'application/pdf': {
    bytes: [[0x25, 0x50, 0x44, 0x46]], // %PDF
    extension: 'pdf',
  },
};

/**
 * Read the first bytes of a file to check its signature
 */
async function getFileSignature(file: File, bytesToRead: number = 12): Promise<number[]> {
  const arrayBuffer = await file.slice(0, bytesToRead).arrayBuffer();
  return Array.from(new Uint8Array(arrayBuffer));
}

/**
 * Verify file type by checking magic numbers
 */
async function verifyFileType(file: File, expectedType: string): Promise<boolean> {
  const signature = FILE_SIGNATURES[expectedType];
  if (!signature) {
    return false;
  }

  const fileBytes = await getFileSignature(file, 12);

  // Check if any of the signature patterns match
  for (const pattern of signature.bytes) {
    let matches = true;
    for (let i = 0; i < pattern.length; i++) {
      if (fileBytes[i] !== pattern[i]) {
        matches = false;
        break;
      }
    }

    // Special case for WebP: also check for WEBP at offset 8
    if (matches && expectedType === 'image/webp') {
      const webpMagic = [0x57, 0x45, 0x42, 0x50]; // WEBP
      matches = webpMagic.every((byte, i) => fileBytes[8 + i] === byte);
    }

    if (matches) {
      return true;
    }
  }

  return false;
}

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
 * Validate file upload with magic number verification
 * @param file - The file to validate
 * @param options - Validation options
 */
export async function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): Promise<{ valid: boolean; error?: string }> {
  const { maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] } = options;

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  // Check declared MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`,
    };
  }

  // Verify actual file content matches declared MIME type using magic numbers
  const isValidType = await verifyFileType(file, file.type);
  if (!isValidType) {
    return {
      valid: false,
      error: 'File content does not match declared file type. File may be corrupted or malicious.',
    };
  }

  return { valid: true };
}
