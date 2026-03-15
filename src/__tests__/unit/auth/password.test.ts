import { hashPassword, verifyPassword, generateToken, generateSlug, hashToken } from '@/lib/auth/password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a token with default length', () => {
      const token = generateToken();

      expect(token).toBeTruthy();
      // randomBytes(32).toString('hex') produces 64 hex characters
      expect(token.length).toBe(64);
      expect(typeof token).toBe('string');
    });

    it('should generate a token with custom length', () => {
      const token = generateToken(64);

      // randomBytes(64).toString('hex') produces 128 hex characters
      expect(token.length).toBe(128);
    });

    it('should generate unique tokens', () => {
      const token1 = generateToken();
      const token2 = generateToken();

      expect(token1).not.toBe(token2);
    });

    it('should only contain alphanumeric characters', () => {
      const token = generateToken();
      const alphanumericRegex = /^[A-Za-z0-9]+$/;

      expect(alphanumericRegex.test(token)).toBe(true);
    });
  });

  describe('generateSlug', () => {
    it('should convert text to slug', () => {
      const slug = generateSlug('John Doe Barber Shop');

      expect(slug).toBe('john-doe-barber-shop');
    });

    it('should remove special characters', () => {
      const slug = generateSlug('John\'s @Barber #Shop!');

      expect(slug).toBe('johns-barber-shop');
    });

    it('should handle multiple spaces', () => {
      const slug = generateSlug('John    Doe    Barber');

      expect(slug).toBe('john-doe-barber');
    });

    it('should trim leading/trailing hyphens', () => {
      const slug = generateSlug('  Barber Shop  ');

      expect(slug).toBe('barber-shop');
    });

    it('should handle empty string', () => {
      const slug = generateSlug('');

      expect(slug).toBe('');
    });
  });

  describe('hashToken', () => {
    it('should hash a token successfully', () => {
      const token = 'test-refresh-token-12345';
      const hash = hashToken(token);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(token);
      // SHA-256 hex output is always 64 characters
      expect(hash.length).toBe(64);
    });

    it('should produce the same hash for the same token (deterministic)', () => {
      const token = 'test-refresh-token-12345';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different tokens', () => {
      const hash1 = hashToken('token-one');
      const hash2 = hashToken('token-two');

      expect(hash1).not.toBe(hash2);
    });
  });
});
