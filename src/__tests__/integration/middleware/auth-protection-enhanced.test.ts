import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { generateAccessToken } from '@/lib/auth/jwt';

describe('Authentication Middleware - Enhanced Route Protection', () => {
  const createRequest = (url: string, cookies: Record<string, string> = {}) => {
    const request = new NextRequest(new URL(url, 'http://localhost:3000'));

    // Mock cookies
    Object.entries(cookies).forEach(([name, value]) => {
      request.cookies.set(name, value);
    });

    return request;
  };

  describe('Role-Based Access Control', () => {
    it('should allow barber to access dashboard with valid token', async () => {
      const validToken = await generateAccessToken({
        userId: 'barber-123',
        email: 'barber@example.com',
        role: 'barber',
      });

      const request = createRequest('/dashboard', { accessToken: validToken });
      const response = await middleware(request);

      expect(response.status).not.toBe(307);
    });

    it('should redirect non-barber from dashboard', async () => {
      const clientToken = await generateAccessToken({
        userId: 'client-123',
        email: 'client@example.com',
        role: 'client',
      });

      const request = createRequest('/dashboard', { accessToken: clientToken });
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/');
    });

    it('should allow admin to access admin panel', async () => {
      const adminToken = await generateAccessToken({
        userId: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      });

      const request = createRequest('/admin', { accessToken: adminToken });
      const response = await middleware(request);

      expect(response.status).not.toBe(307);
    });

    it('should redirect barber from admin to dashboard', async () => {
      const barberToken = await generateAccessToken({
        userId: 'barber-123',
        email: 'barber@example.com',
        role: 'barber',
      });

      const request = createRequest('/admin', { accessToken: barberToken });
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard');
    });

    it('should redirect client from admin to dashboard', async () => {
      const clientToken = await generateAccessToken({
        userId: 'client-123',
        email: 'client@example.com',
        role: 'client',
      });

      const request = createRequest('/admin', { accessToken: clientToken });
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard');
    });
  });

  describe('Token Validation', () => {
    it('should reject malformed token', async () => {
      const request = createRequest('/dashboard', { accessToken: 'not.a.valid.jwt' });
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should reject empty token', async () => {
      const request = createRequest('/dashboard', { accessToken: '' });
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should reject token with wrong signature', async () => {
      const request = createRequest('/dashboard', {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiYmFyYmVyIn0.wrongsignature'
      });
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should preserve redirect parameter in login URL', async () => {
      const request = createRequest('/dashboard/settings');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/login');
      expect(location).toContain('redirect=%2Fdashboard%2Fsettings');
    });
  });

  describe('Nested Protected Routes', () => {
    it('should protect /dashboard/profile', async () => {
      const request = createRequest('/dashboard/profile');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should protect /admin/barbers/verify', async () => {
      const request = createRequest('/admin/barbers/verify');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should allow admin to access nested admin routes', async () => {
      const adminToken = await generateAccessToken({
        userId: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      });

      const request = createRequest('/admin/barbers/verify', { accessToken: adminToken });
      const response = await middleware(request);

      expect(response.status).not.toBe(307);
    });
  });
});
