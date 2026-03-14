import { NextRequest } from 'next/server';
import { generateCsrfToken, verifyCsrfToken } from '@/lib/api/csrf';
import { ApiError } from '@/lib/api/errors';

describe('CSRF Protection', () => {
  describe('generateCsrfToken', () => {
    it('should generate a CSRF token', () => {
      const token = generateCsrfToken();

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes * 2 (hex encoding)
    });

    it('should generate unique tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();

      expect(token1).not.toBe(token2);
    });

    it('should only contain hex characters', () => {
      const token = generateCsrfToken();
      const hexRegex = /^[a-f0-9]+$/;

      expect(hexRegex.test(token)).toBe(true);
    });
  });

  describe('verifyCsrfToken', () => {
    const createRequest = (method: string, headers: Record<string, string>, cookies: Record<string, string>) => {
      const url = 'http://localhost:3000/api/test';
      const request = new NextRequest(url, {
        method,
        headers: new Headers(headers),
      });

      // Mock cookies
      Object.defineProperty(request, 'cookies', {
        value: {
          get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined,
        },
        writable: false,
      });

      return request;
    };

    it('should allow GET requests without CSRF token', () => {
      const request = createRequest('GET', {}, {});

      expect(() => verifyCsrfToken(request)).not.toThrow();
    });

    it('should allow HEAD requests without CSRF token', () => {
      const request = createRequest('HEAD', {}, {});

      expect(() => verifyCsrfToken(request)).not.toThrow();
    });

    it('should allow OPTIONS requests without CSRF token', () => {
      const request = createRequest('OPTIONS', {}, {});

      expect(() => verifyCsrfToken(request)).not.toThrow();
    });

    it('should reject POST request without CSRF token', () => {
      const request = createRequest('POST', {}, {});

      expect(() => verifyCsrfToken(request)).toThrow(ApiError);
      expect(() => verifyCsrfToken(request)).toThrow('Invalid or missing CSRF token');
    });

    it('should reject POST request with missing header token', () => {
      const request = createRequest('POST', {}, { 'csrf-token': 'test-token' });

      expect(() => verifyCsrfToken(request)).toThrow(ApiError);
    });

    it('should reject POST request with missing cookie token', () => {
      const request = createRequest('POST', { 'x-csrf-token': 'test-token' }, {});

      expect(() => verifyCsrfToken(request)).toThrow(ApiError);
    });

    it('should reject POST request with mismatched tokens', () => {
      const request = createRequest(
        'POST',
        { 'x-csrf-token': 'token-from-header' },
        { 'csrf-token': 'token-from-cookie' }
      );

      expect(() => verifyCsrfToken(request)).toThrow(ApiError);
    });

    it('should allow POST request with matching tokens', () => {
      const token = 'matching-csrf-token-12345';
      const request = createRequest(
        'POST',
        { 'x-csrf-token': token },
        { 'csrf-token': token }
      );

      expect(() => verifyCsrfToken(request)).not.toThrow();
    });

    it('should allow PUT request with matching tokens', () => {
      const token = 'matching-csrf-token-12345';
      const request = createRequest(
        'PUT',
        { 'x-csrf-token': token },
        { 'csrf-token': token }
      );

      expect(() => verifyCsrfToken(request)).not.toThrow();
    });

    it('should allow DELETE request with matching tokens', () => {
      const token = 'matching-csrf-token-12345';
      const request = createRequest(
        'DELETE',
        { 'x-csrf-token': token },
        { 'csrf-token': token }
      );

      expect(() => verifyCsrfToken(request)).not.toThrow();
    });

    it('should allow PATCH request with matching tokens', () => {
      const token = 'matching-csrf-token-12345';
      const request = createRequest(
        'PATCH',
        { 'x-csrf-token': token },
        { 'csrf-token': token }
      );

      expect(() => verifyCsrfToken(request)).not.toThrow();
    });
  });
});
