import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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
 * Generate a cryptographically secure random token
 * Uses crypto.randomBytes to avoid modulo bias
 * @param length - Number of bytes (output will be hex string of length * 2)
 */
export function generateToken(length: number = 32): string {
  // Use Node.js crypto.randomBytes for true cryptographic randomness
  // Returns hex string which is 2x the byte length
  return crypto.randomBytes(length).toString('hex');
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
