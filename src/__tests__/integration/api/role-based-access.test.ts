import { NextRequest } from 'next/server';
import {
  getAuthUser,
  requireRole,
  requireAdmin,
  requireBarber,
  requireClient,
  withAuth,
} from '@/lib/api/middleware';
import { generateAccessToken } from '@/lib/auth/jwt';

describe('Role-Based Access Control (RBAC)', () => {
  const createAuthenticatedRequest = async (
    url: string,
    role: 'admin' | 'barber' | 'client'
  ) => {
    const token = await generateAccessToken({
      userId: `${role}-user-123`,
      email: `${role}@example.com`,
      role,
    });

    const request = new NextRequest(url, {
      method: 'GET',
      headers: new Headers({
        Authorization: `Bearer ${token}`,
      }),
    });

    return request;
  };

  describe('Token Extraction and Validation', () => {
    it('should extract token from Authorization header', async () => {
      const token = await generateAccessToken({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'barber',
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${token}`,
        }),
      });

      const user = await getAuthUser(request);

      expect(user).toBeDefined();
      expect(user.userId).toBe('user-123');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('barber');
    });

    it('should extract token from cookie', async () => {
      const token = await generateAccessToken({
        userId: 'user-456',
        email: 'cookie@example.com',
        role: 'client',
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      request.cookies.set('accessToken', token);

      const user = await getAuthUser(request);

      expect(user).toBeDefined();
      expect(user.userId).toBe('user-456');
      expect(user.email).toBe('cookie@example.com');
      expect(user.role).toBe('client');
    });

    it('should prefer cookie over Authorization header', async () => {
      const cookieToken = await generateAccessToken({
        userId: 'cookie-user',
        email: 'cookie@example.com',
        role: 'admin',
      });

      const headerToken = await generateAccessToken({
        userId: 'header-user',
        email: 'header@example.com',
        role: 'barber',
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${headerToken}`,
        }),
      });
      request.cookies.set('accessToken', cookieToken);

      const user = await getAuthUser(request);

      expect(user.userId).toBe('cookie-user');
      expect(user.role).toBe('admin');
    });

    it('should throw error when no token provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');

      await expect(getAuthUser(request)).rejects.toThrow();
    });

    it('should throw error for invalid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: new Headers({
          Authorization: 'Bearer invalid-token',
        }),
      });

      await expect(getAuthUser(request)).rejects.toThrow();
    });

    it('should throw error for malformed Authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: new Headers({
          Authorization: 'InvalidFormat token-here',
        }),
      });

      await expect(getAuthUser(request)).rejects.toThrow();
    });
  });

  describe('Admin Role Access Control', () => {
    it('should allow admin to access admin endpoints', async () => {
      const request = await createAuthenticatedRequest(
        'http://localhost:3000/api/admin/test',
        'admin'
      );

      const user = await requireAdmin(request);

      expect(user).toBeDefined();
      expect(user.role).toBe('admin');
    });

    it('should reject barber from admin endpoints', async () => {
      const request = await createAuthenticatedRequest(
        'http://localhost:3000/api/admin/test',
        'barber'
      );

      await expect(requireAdmin(request)).rejects.toThrow();
    });

    it('should reject client from admin endpoints', async () => {
      const request = await createAuthenticatedRequest(
        'http://localhost:3000/api/admin/test',
        'client'
      );

      await expect(requireAdmin(request)).rejects.toThrow();
    });
  });

  describe('Barber Role Access Control', () => {
    it('should allow barber to access barber endpoints', async () => {
      const request = await createAuthenticatedRequest(
        'http://localhost:3000/api/barbers/profile',
        'barber'
      );

      const user = await requireBarber(request);

      expect(user).toBeDefined();
      expect(user.role).toBe('barber');
    });

    it('should reject admin from barber-only endpoints', async () => {
      const request = await createAuthenticatedRequest(
        'http://localhost:3000/api/barbers/profile',
        'admin'
      );

      await expect(requireBarber(request)).rejects.toThrow();
    });

    it('should reject client from barber endpoints', async () => {
      const request = await createAuthenticatedRequest(
        'http://localhost:3000/api/barbers/profile',
        'client'
      );

      await expect(requireBarber(request)).rejects.toThrow();
    });
  });

  describe('Client Role Access Control', () => {
    it('should allow client to access client endpoints', async () => {
      const request = await createAuthenticatedRequest(
        'http://localhost:3000/api/client/test',
        'client'
      );

      const user = await requireClient(request);

      expect(user).toBeDefined();
      expect(user.role).toBe('client');
    });

    it('should reject admin from client-only endpoints', async () => {
      const request = await createAuthenticatedRequest(
        'http://localhost:3000/api/client/test',
        'admin'
      );

      await expect(requireClient(request)).rejects.toThrow();
    });

    it('should reject barber from client endpoints', async () => {
      const request = await createAuthenticatedRequest(
        'http://localhost:3000/api/client/test',
        'barber'
      );

      await expect(requireClient(request)).rejects.toThrow();
    });
  });

  describe('Multiple Role Access', () => {
    it('should allow multiple roles to access endpoint', async () => {
      const adminRequest = await createAuthenticatedRequest(
        'http://localhost:3000/api/test',
        'admin'
      );

      const barberRequest = await createAuthenticatedRequest(
        'http://localhost:3000/api/test',
        'barber'
      );

      const adminUser = await requireRole(adminRequest, ['admin', 'barber']);
      const barberUser = await requireRole(barberRequest, ['admin', 'barber']);

      expect(adminUser.role).toBe('admin');
      expect(barberUser.role).toBe('barber');
    });

    it('should reject role not in allowed list', async () => {
      const clientRequest = await createAuthenticatedRequest(
        'http://localhost:3000/api/test',
        'client'
      );

      await expect(
        requireRole(clientRequest, ['admin', 'barber'])
      ).rejects.toThrow();
    });
  });

  describe('withAuth Higher-Order Function', () => {
    it('should pass user info to handler when authenticated', async () => {
      const handler = jest.fn().mockImplementation((req: any) => {
        return new Response(
          JSON.stringify({
            userId: req.userId,
            email: req.userEmail,
            role: req.userRole,
          }),
          { status: 200 }
        );
      });

      const wrappedHandler = withAuth(handler);

      const request = await createAuthenticatedRequest(
        'http://localhost:3000/api/test',
        'barber'
      );

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.userId).toBe('barber-user-123');
      expect(data.email).toBe('barber@example.com');
      expect(data.role).toBe('barber');
    });

    it('should enforce role requirement', async () => {
      const handler = jest.fn().mockImplementation(() => {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      });

      const wrappedHandler = withAuth(handler, { requiredRole: 'admin' });

      const barberRequest = await createAuthenticatedRequest(
        'http://localhost:3000/api/admin/test',
        'barber'
      );

      const response = await wrappedHandler(barberRequest);

      expect(response.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should allow request when role matches', async () => {
      const handler = jest.fn().mockImplementation(() => {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      });

      const wrappedHandler = withAuth(handler, { requiredRole: 'admin' });

      const adminRequest = await createAuthenticatedRequest(
        'http://localhost:3000/api/admin/test',
        'admin'
      );

      const response = await wrappedHandler(adminRequest);

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });

    it('should support multiple allowed roles', async () => {
      const handler = jest.fn().mockImplementation(() => {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      });

      const wrappedHandler = withAuth(handler, {
        requiredRole: ['admin', 'barber'],
      });

      const adminRequest = await createAuthenticatedRequest(
        'http://localhost:3000/api/test',
        'admin'
      );
      const barberRequest = await createAuthenticatedRequest(
        'http://localhost:3000/api/test',
        'barber'
      );
      const clientRequest = await createAuthenticatedRequest(
        'http://localhost:3000/api/test',
        'client'
      );

      const adminResponse = await wrappedHandler(adminRequest);
      const barberResponse = await wrappedHandler(barberRequest);
      const clientResponse = await wrappedHandler(clientRequest);

      expect(adminResponse.status).toBe(200);
      expect(barberResponse.status).toBe(200);
      expect(clientResponse.status).toBe(403);
    });

    it('should handle authentication errors gracefully', async () => {
      const handler = jest.fn();
      const wrappedHandler = withAuth(handler);

      const request = new NextRequest('http://localhost:3000/api/test');

      const response = await wrappedHandler(request);

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle handler errors gracefully', async () => {
      const handler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });

      const wrappedHandler = withAuth(handler);

      const request = await createAuthenticatedRequest(
        'http://localhost:3000/api/test',
        'barber'
      );

      const response = await wrappedHandler(request);

      expect(response.status).toBe(500);
    });
  });

  describe('Critical Security Scenarios', () => {
    it('should prevent privilege escalation via token manipulation', async () => {
      // Create a valid barber token
      const barberToken = await generateAccessToken({
        userId: 'barber-123',
        email: 'barber@example.com',
        role: 'barber',
      });

      // Attempt to use it for admin endpoint
      const request = new NextRequest('http://localhost:3000/api/admin/test', {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${barberToken}`,
        }),
      });

      // Should fail because role is barber, not admin
      await expect(requireAdmin(request)).rejects.toThrow();
    });

    it('should prevent role injection in JWT payload', async () => {
      // This test verifies that the JWT signature prevents tampering
      const validToken = await generateAccessToken({
        userId: 'user-123',
        email: 'user@example.com',
        role: 'client',
      });

      // Attempt to modify the token (in practice, this would invalidate the signature)
      const tamperedToken = validToken.replace('client', 'admin');

      const request = new NextRequest('http://localhost:3000/api/admin/test', {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${tamperedToken}`,
        }),
      });

      // Should fail due to invalid signature
      await expect(getAuthUser(request)).rejects.toThrow();
    });

    it('should reject requests without proper authentication', async () => {
      const handler = jest.fn();
      const wrappedHandler = withAuth(handler, { requiredRole: 'admin' });

      const requests = [
        new NextRequest('http://localhost:3000/api/admin/test'),
        new NextRequest('http://localhost:3000/api/admin/test', {
          headers: new Headers({ Authorization: 'Bearer invalid' }),
        }),
        new NextRequest('http://localhost:3000/api/admin/test', {
          headers: new Headers({ Authorization: '' }),
        }),
      ];

      for (const request of requests) {
        const response = await wrappedHandler(request);
        expect(response.status).toBeGreaterThanOrEqual(401);
        expect(handler).not.toHaveBeenCalled();
      }
    });

    it('should enforce role checks even with valid authentication', async () => {
      const handler = jest.fn();
      const wrappedHandler = withAuth(handler, { requiredRole: 'admin' });

      const barberRequest = await createAuthenticatedRequest(
        'http://localhost:3000/api/admin/test',
        'barber'
      );

      const clientRequest = await createAuthenticatedRequest(
        'http://localhost:3000/api/admin/test',
        'client'
      );

      const barberResponse = await wrappedHandler(barberRequest);
      const clientResponse = await wrappedHandler(clientRequest);

      expect(barberResponse.status).toBe(403);
      expect(clientResponse.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should validate user ID matches token claims', async () => {
      const token = await generateAccessToken({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'barber',
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: new Headers({
          Authorization: `Bearer ${token}`,
        }),
      });

      const user = await getAuthUser(request);

      // User ID should match what's in the token
      expect(user.userId).toBe('user-123');

      // Any attempt to access resources for a different user should be rejected
      // This would be handled in the route handlers
    });
  });

  describe('Edge Cases', () => {
    it('should handle request with both cookie and header (prefer cookie)', async () => {
      const cookieToken = await generateAccessToken({
        userId: 'cookie-user',
        email: 'cookie@example.com',
        role: 'admin',
      });

      const headerToken = await generateAccessToken({
        userId: 'header-user',
        email: 'header@example.com',
        role: 'barber',
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: new Headers({
          Authorization: `Bearer ${headerToken}`,
        }),
      });
      request.cookies.set('accessToken', cookieToken);

      const user = await getAuthUser(request);
      expect(user.userId).toBe('cookie-user');
    });

    it('should handle empty Authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: new Headers({
          Authorization: '',
        }),
      });

      await expect(getAuthUser(request)).rejects.toThrow();
    });

    it('should handle Bearer prefix case-insensitively', async () => {
      const token = await generateAccessToken({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'barber',
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: new Headers({
          Authorization: `bearer ${token}`, // lowercase
        }),
      });

      // Should still work (case-insensitive check)
      const user = await getAuthUser(request);
      expect(user.userId).toBe('user-123');
    });
  });
});
