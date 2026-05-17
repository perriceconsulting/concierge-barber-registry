/**
 * @jest-environment node
 */
import { randomBytes } from 'crypto';
import {
  encryptPassportSpecs,
  decryptPassportSpecs,
  getActivePassportKeyVersion,
} from '@/lib/crypto/aes';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  // Reset env between tests so rotation tests don't bleed.
  for (const k of Object.keys(process.env)) {
    if (k.startsWith('PASSPORT_ENCRYPTION_KEY')) delete process.env[k];
  }
  process.env.PASSPORT_ENCRYPTION_KEY = randomBytes(32).toString('base64');
});

afterAll(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('Passport AES-256-GCM crypto', () => {
  it('roundtrips a simple JSON payload', () => {
    const payload = JSON.stringify({
      preferences: 'tight skin fade',
      guardSizes: { sides: '1.5', top: 'scissor' },
      products: ['Layrite', 'Old Spice'],
      allergies: ['latex'],
    });
    const { data, keyVersion } = encryptPassportSpecs(payload);
    expect(keyVersion).toBe(1);
    expect(data).toBeInstanceOf(Buffer);
    expect(data.length).toBeGreaterThan(payload.length); // header + tag overhead

    const restored = decryptPassportSpecs(data);
    expect(restored).toBe(payload);
  });

  it('produces different ciphertext on every call (random IV)', () => {
    const payload = 'hello world';
    const a = encryptPassportSpecs(payload);
    const b = encryptPassportSpecs(payload);
    expect(a.data.equals(b.data)).toBe(false);
    expect(decryptPassportSpecs(a.data)).toBe(payload);
    expect(decryptPassportSpecs(b.data)).toBe(payload);
  });

  it('throws when the auth tag is tampered', () => {
    const { data } = encryptPassportSpecs('sensitive');
    // Flip a single byte inside the tag region (offset 1 + 12 .. 1 + 12 + 16).
    data[14] = data[14] ^ 0xff;
    expect(() => decryptPassportSpecs(data)).toThrow();
  });

  it('throws on a too-short blob', () => {
    expect(() => decryptPassportSpecs(Buffer.from([0x01, 0x02]))).toThrow(/too short/);
  });

  it('throws when the key is not 32 bytes', () => {
    process.env.PASSPORT_ENCRYPTION_KEY = randomBytes(16).toString('base64');
    expect(() => encryptPassportSpecs('x')).toThrow(/exactly 32 bytes/);
  });

  it('throws when the key env var is missing', () => {
    delete process.env.PASSPORT_ENCRYPTION_KEY;
    expect(() => encryptPassportSpecs('x')).toThrow(/PASSPORT_ENCRYPTION_KEY/);
  });

  describe('key rotation', () => {
    it('encrypts under the highest active version and decrypts older versions', () => {
      const v1 = randomBytes(32).toString('base64');
      const v2 = randomBytes(32).toString('base64');
      process.env.PASSPORT_ENCRYPTION_KEY = v1;
      // First, write a record under v1.
      const v1blob = encryptPassportSpecs('written-under-v1').data;

      // Now rotate by introducing v2.
      process.env.PASSPORT_ENCRYPTION_KEY_V2 = v2;
      expect(getActivePassportKeyVersion()).toBe(2);

      const v2blob = encryptPassportSpecs('written-under-v2').data;
      expect(v2blob[0]).toBe(2);

      // Both records still decrypt: old via embedded v1 byte, new via v2 byte.
      expect(decryptPassportSpecs(v1blob)).toBe('written-under-v1');
      expect(decryptPassportSpecs(v2blob)).toBe('written-under-v2');
    });
  });
});
