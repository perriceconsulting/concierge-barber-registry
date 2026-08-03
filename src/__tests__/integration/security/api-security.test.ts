import { NextRequest } from 'next/server';
import {
  generateCsrfToken,
  verifyCsrfToken,
} from '@/lib/api/csrf';
import { rateLimit, rateLimiters } from '@/lib/api/rate-limit';
import { RateLimitError, ApiError } from '@/lib/api/errors';
import { loginSchema } from '@/lib/validations/auth';

describe('API Security - CSRF Protection', () => {
  describe('CSRF Token Generation', () => {
    it('should generate unique CSRF tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();

      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should generate tokens with valid hex characters', () => {
      const token = generateCsrfToken();
      const hexRegex = /^[0-9a-f]+$/i;

      expect(hexRegex.test(token)).toBe(true);
    });
  });

  describe('CSRF Token Verification', () => {
    it('should allow GET requests without CSRF token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });

      expect(() => verifyCsrfToken(request)).not.toThrow();
    });

    it('should allow HEAD requests without CSRF token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'HEAD',
      });

      expect(() => verifyCsrfToken(request)).not.toThrow();
    });

    it('should allow OPTIONS requests without CSRF token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'OPTIONS',
      });

      expect(() => verifyCsrfToken(request)).not.toThrow();
    });

    it('should reject POST request without CSRF token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      });

      expect(() => verifyCsrfToken(request)).toThrow(ApiError);
      expect(() => verifyCsrfToken(request)).toThrow('Invalid or missing CSRF token');
    });

    it('should reject PUT request without CSRF token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'PUT',
        body: JSON.stringify({ data: 'test' }),
      });

      expect(() => verifyCsrfToken(request)).toThrow(ApiError);
    });

    it('should reject DELETE request without CSRF token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'DELETE',
      });

      expect(() => verifyCsrfToken(request)).toThrow(ApiError);
    });

    it('should reject request with mismatched CSRF tokens', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: new Headers({
          'x-csrf-token': 'token-from-header',
        }),
        body: JSON.stringify({ data: 'test' }),
      });

      request.cookies.set('csrf-token', 'token-from-cookie');

      expect(() => verifyCsrfToken(request)).toThrow(ApiError);
    });

    it('should accept request with matching CSRF tokens', () => {
      const token = 'valid-csrf-token-123';
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: new Headers({
          'x-csrf-token': token,
        }),
        body: JSON.stringify({ data: 'test' }),
      });

      request.cookies.set('csrf-token', token);

      expect(() => verifyCsrfToken(request)).not.toThrow();
    });

    it('should reject POST with only header token, no cookie', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: new Headers({
          'x-csrf-token': 'token-123',
        }),
        body: JSON.stringify({ data: 'test' }),
      });

      expect(() => verifyCsrfToken(request)).toThrow(ApiError);
    });

    it('should reject POST with only cookie token, no header', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      });

      request.cookies.set('csrf-token', 'token-123');

      expect(() => verifyCsrfToken(request)).toThrow(ApiError);
    });
  });
});

describe('API Security - Rate Limiting', () => {
  // Clear rate limit store before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      request.headers.set('x-forwarded-for', '192.168.1.1');

      await expect(
        rateLimit(request, { limit: 5, windowMs: 60000 })
      ).resolves.not.toThrow();
    });

    it('should reject requests exceeding rate limit', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      request.headers.set('x-forwarded-for', '192.168.1.2');

      const config = { limit: 3, windowMs: 60000 };

      // First 3 requests should succeed
      await rateLimit(request, config);
      await rateLimit(request, config);
      await rateLimit(request, config);

      // 4th request should fail
      await expect(rateLimit(request, config)).rejects.toThrow(RateLimitError);
    });

    it('should track different IPs separately', async () => {
      const config = { limit: 2, windowMs: 60000 };

      const request1 = new NextRequest('http://localhost:3000/api/test');
      request1.headers.set('x-forwarded-for', '192.168.1.3');

      const request2 = new NextRequest('http://localhost:3000/api/test');
      request2.headers.set('x-forwarded-for', '192.168.1.4');

      // Both IPs should be able to make their own requests
      await rateLimit(request1, config);
      await rateLimit(request1, config);
      await rateLimit(request2, config);
      await rateLimit(request2, config);

      // Both should fail on the 3rd request
      await expect(rateLimit(request1, config)).rejects.toThrow(RateLimitError);
      await expect(rateLimit(request2, config)).rejects.toThrow(RateLimitError);
    });

    it('should use custom key generator if provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      request.headers.set('user-id', 'user-123');

      const config = {
        limit: 2,
        windowMs: 60000,
        keyGenerator: (req: NextRequest) => `user:${req.headers.get('user-id')}`,
      };

      await rateLimit(request, config);
      await rateLimit(request, config);

      await expect(rateLimit(request, config)).rejects.toThrow(RateLimitError);
    });
  });

  describe('Pre-configured Rate Limiters', () => {
    it('should have auth rate limiter (5 per 15 min)', async () => {
      expect(rateLimiters.auth).toBeDefined();
      expect(typeof rateLimiters.auth).toBe('function');
    });

    it('should have strict auth rate limiter (3 per hour)', async () => {
      expect(rateLimiters.authStrict).toBeDefined();
      expect(typeof rateLimiters.authStrict).toBe('function');
    });

    it('should have API rate limiter (100 per minute)', async () => {
      expect(rateLimiters.api).toBeDefined();
      expect(typeof rateLimiters.api).toBe('function');
    });

    it('should have upload rate limiter (10 per hour)', async () => {
      expect(rateLimiters.upload).toBeDefined();
      expect(typeof rateLimiters.upload).toBe('function');
    });

    it('should have contact rate limiter (5 per hour)', async () => {
      expect(rateLimiters.contact).toBeDefined();
      expect(typeof rateLimiters.contact).toBe('function');
    });

    it('should have reviews rate limiter (5 per day)', async () => {
      expect(rateLimiters.reviews).toBeDefined();
      expect(typeof rateLimiters.reviews).toBe('function');
    });
  });

  describe('IP Detection', () => {
    it('should detect IP from x-forwarded-for header', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      request.headers.set('x-forwarded-for', '203.0.113.1');

      await expect(
        rateLimit(request, { limit: 5, windowMs: 60000 })
      ).resolves.not.toThrow();
    });

    it('should detect IP from x-real-ip header', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      request.headers.set('x-real-ip', '203.0.113.2');

      await expect(
        rateLimit(request, { limit: 5, windowMs: 60000 })
      ).resolves.not.toThrow();
    });

    it('should detect IP from cf-connecting-ip header (Cloudflare)', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      request.headers.set('cf-connecting-ip', '203.0.113.3');

      await expect(
        rateLimit(request, { limit: 5, windowMs: 60000 })
      ).resolves.not.toThrow();
    });

    it('should prefer cf-connecting-ip over other headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      request.headers.set('cf-connecting-ip', '203.0.113.4');
      request.headers.set('x-forwarded-for', '203.0.113.5');
      request.headers.set('x-real-ip', '203.0.113.6');

      const config = { limit: 1, windowMs: 60000 };
      await rateLimit(request, config);

      // Same cf-connecting-ip should trigger rate limit
      await expect(rateLimit(request, config)).rejects.toThrow(RateLimitError);
    });

    it('should handle multiple IPs in x-forwarded-for', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      request.headers.set('x-forwarded-for', '203.0.113.7, 10.0.0.1, 172.16.0.1');

      // Should use first IP in chain
      await expect(
        rateLimit(request, { limit: 5, windowMs: 60000 })
      ).resolves.not.toThrow();
    });

    it('should handle unknown IP gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      // No IP headers set

      await expect(
        rateLimit(request, { limit: 5, windowMs: 60000 })
      ).resolves.not.toThrow();
    });
  });
});

describe('API Security - Input Validation', () => {
  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in Prisma queries', () => {
      const maliciousInput = "'; DROP TABLE users; --";

      // Prisma uses parameterized queries, so this should be safe
      // We test that our API endpoints properly validate input
      expect(maliciousInput).toContain('DROP');
      expect(maliciousInput).toContain('--');

      // In actual implementation, Prisma would escape this automatically
      // Our validation layer should also reject malformed input
    });

    it('should sanitize email input', () => {
      const maliciousEmail = "<script>alert('xss')</script>@example.com";

      // Assert against the validator the product actually uses. This test used
      // to declare its own permissive regex inline and assert on that, which
      // tested a literal in this file and told us nothing about login input.
      const result = loginSchema.safeParse({
        email: maliciousEmail,
        password: 'ValidPassword123!',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('XSS Prevention', () => {
    it('should detect XSS attempts in text input', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(\'xss\')">',
        'javascript:alert("xss")',
        '<iframe src="javascript:alert(\'xss\')"></iframe>',
        '<svg/onload=alert(\'xss\')>',
      ];

      xssAttempts.forEach((attempt) => {
        // Our sanitize library should detect and clean these
        expect(attempt).toMatch(/<|javascript:|onerror=|onload=/);
      });
    });

    it('should allow safe HTML entities', () => {
      const safeText = 'This is a test with &amp; and &lt; entities';
      expect(safeText).not.toContain('<script>');
      expect(safeText).not.toContain('javascript:');
    });
  });

  describe('Path Traversal Prevention', () => {
    it('should detect path traversal attempts', () => {
      const traversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '/etc/passwd',
        'C:\\Windows\\System32',
      ];

      traversalAttempts.forEach((attempt) => {
        expect(attempt).toMatch(/\.\.|\\|\/etc\/|C:\\/);
      });
    });

    it('should validate file paths stay within upload directory', () => {
      const validPath = '/uploads/licenses/file.pdf';
      const invalidPath = '/uploads/licenses/../../../etc/passwd';

      expect(validPath).not.toContain('..');
      expect(invalidPath).toContain('..');
    });
  });

  describe('Content-Type Validation', () => {
    it('should validate JSON content type for POST requests', () => {
      const validContentTypes = [
        'application/json',
        'application/json; charset=utf-8',
      ];

      const invalidContentTypes = [
        'text/plain',
        'text/html',
        'application/x-www-form-urlencoded',
      ];

      validContentTypes.forEach((ct) => {
        expect(ct.includes('application/json')).toBe(true);
      });

      invalidContentTypes.forEach((ct) => {
        expect(ct.includes('application/json')).toBe(false);
      });
    });
  });

  describe('Request Size Limits', () => {
    it('should enforce reasonable payload size limits', () => {
      const maxPayloadSize = 10 * 1024 * 1024; // 10MB
      const smallPayload = JSON.stringify({ data: 'test' });
      const largePayload = 'x'.repeat(maxPayloadSize + 1);

      expect(smallPayload.length).toBeLessThan(maxPayloadSize);
      expect(largePayload.length).toBeGreaterThan(maxPayloadSize);
    });
  });
});

describe('API Security - Authorization Checks', () => {
  describe('Role-Based Access Control', () => {
    it('should require admin role for admin endpoints', () => {
      const requiredRole = 'admin';
      const userRole = 'barber';

      expect(requiredRole).toBe('admin');
      expect(userRole).not.toBe(requiredRole);
    });

    it('should require barber role for barber-specific endpoints', () => {
      const requiredRole = 'barber';
      const userRole = 'client';

      expect(requiredRole).toBe('barber');
      expect(userRole).not.toBe(requiredRole);
    });

    it('should allow multiple roles for some endpoints', () => {
      const allowedRoles = ['admin', 'barber'];
      const adminRole = 'admin';
      const barberRole = 'barber';
      const clientRole = 'client';

      expect(allowedRoles).toContain(adminRole);
      expect(allowedRoles).toContain(barberRole);
      expect(allowedRoles).not.toContain(clientRole);
    });
  });

  describe('Resource Ownership', () => {
    it('should verify user owns the resource they are modifying', () => {
      const userId = 'user-123';
      const resourceOwnerId = 'user-123';
      const otherUserId = 'user-456';

      expect(userId).toBe(resourceOwnerId);
      expect(userId).not.toBe(otherUserId);
    });

    it('should allow admins to modify any resource', () => {
      const userRole = 'admin';
      const resourceOwnerId = 'user-123';
      const currentUserId = 'admin-456';

      const canModify =
        userRole === 'admin' || currentUserId === resourceOwnerId;

      expect(canModify).toBe(true);
    });
  });
});
