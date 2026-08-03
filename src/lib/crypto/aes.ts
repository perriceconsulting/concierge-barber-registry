import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * AES-256-GCM envelope encryption for the Grooming Passport.
 *
 * Storage format (single Buffer): [version:1][iv:12][authTag:16][ciphertext:N]
 *
 * `version` is the leading byte and corresponds to the active key id (1 = the
 * `PASSPORT_ENCRYPTION_KEY` env, 2 = `PASSPORT_ENCRYPTION_KEY_V2`, etc.).
 * Storing it inline lets us decrypt records written under an older key during
 * a key rotation without a separate column lookup; the DB also tracks
 * `keyVersion` for indexed queries (e.g. "find all v1 records to re-encrypt").
 */

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getKey(version: number): Buffer {
  const envName = version === 1 ? 'PASSPORT_ENCRYPTION_KEY' : `PASSPORT_ENCRYPTION_KEY_V${version}`;
  const raw = process.env[envName];
  if (!raw) {
    throw new Error(
      `Passport encryption key v${version} (${envName}) is not configured. Set a 32-byte base64 string in env.`,
    );
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error(
      `${envName} must decode to exactly 32 bytes (got ${key.length}). Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
    );
  }
  return key;
}

export function getActivePassportKeyVersion(): number {
  // Active version = highest defined env. v1 is required; v2+ are optional
  // (used during rotation). Cap at v9 to avoid runaway env scans.
  for (let v = 9; v >= 2; v--) {
    if (process.env[`PASSPORT_ENCRYPTION_KEY_V${v}`]) return v;
  }
  return 1;
}

export interface EncryptResult {
  data: Buffer;
  keyVersion: number;
}

export function encryptPassportSpecs(plaintext: string): EncryptResult {
  const version = getActivePassportKeyVersion();
  const key = getKey(version);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const versionByte = Buffer.from([version]);
  return {
    data: Buffer.concat([versionByte, iv, tag, ciphertext]),
    keyVersion: version,
  };
}

export function decryptPassportSpecs(blob: Buffer): string {
  if (blob.length < 1 + IV_BYTES + TAG_BYTES) {
    throw new Error('Encrypted payload is too short to be valid.');
  }
  const version = blob[0];
  const iv = blob.subarray(1, 1 + IV_BYTES);
  const tag = blob.subarray(1 + IV_BYTES, 1 + IV_BYTES + TAG_BYTES);
  const ciphertext = blob.subarray(1 + IV_BYTES + TAG_BYTES);
  const key = getKey(version);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}
