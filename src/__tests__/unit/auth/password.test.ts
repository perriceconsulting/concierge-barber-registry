import { hashPassword, verifyPassword, generateToken, generateSlug, generateUniqueSlug, hashToken, verifyToken } from '@/lib/auth/password';

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
      expect(token.length).toBe(32);
      expect(typeof token).toBe('string');
    });

    it('should generate a token with custom length', () => {
      const token = generateToken(64);

      expect(token.length).toBe(64);
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

  describe('generateUniqueSlug', () => {
    it('should generate slug with random suffix', () => {
      const slug = generateUniqueSlug('John Doe');

      expect(slug).toMatch(/^john-doe-[a-z0-9]{6}$/);
    });

    it('should generate different slugs for same input', () => {
      const slug1 = generateUniqueSlug('John Doe');
      const slug2 = generateUniqueSlug('John Doe');

      expect(slug1).not.toBe(slug2);
      expect(slug1.startsWith('john-doe-')).toBe(true);
      expect(slug2.startsWith('john-doe-')).toBe(true);
    });
  });

  describe('hashToken', () => {
    it('should hash a token successfully', async () => {
      const token = 'test-refresh-token-12345';
      const hash = await hashToken(token);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(token);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should produce different hashes for the same token', async () => {
      const token = 'test-refresh-token-12345';
      const hash1 = await hashToken(token);
      const hash2 = await hashToken(token);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyToken', () => {
    it('should verify correct token', async () => {
      const token = 'test-refresh-token-12345';
      const hash = await hashToken(token);
      const isValid = await verifyToken(token, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect token', async () => {
      const token = 'test-refresh-token-12345';
      const wrongToken = 'wrong-token-67890';
      const hash = await hashToken(token);
      const isValid = await verifyToken(wrongToken, hash);

      expect(isValid).toBe(false);
    });
  });
});
