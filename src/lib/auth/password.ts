import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random token for password reset, email verification, etc.
 */
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    token += chars[array[i] % chars.length];
  }

  return token;
}

/**
 * Generate a slug from a string (for barber profile slugs)
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug with a random suffix
 */
export function generateUniqueSlug(text: string): string {
  const baseSlug = generateSlug(text);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

/**
 * Hash a refresh token using bcrypt (for secure storage)
 */
export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, SALT_ROUNDS);
}

/**
 * Verify a token against a hash
 */
export async function verifyToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}
