import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

describe('Authentication Middleware - Route Protection', () => {
  const createRequest = (url: string, cookies: Record<string, string> = {}) => {
    const request = new NextRequest(new URL(url, 'http://localhost:3000'));

    // Mock cookies
    Object.entries(cookies).forEach(([name, value]) => {
      request.cookies.set(name, value);
    });

    return request;
  };

  describe('Protected Routes - Dashboard', () => {
    it('should redirect to login when accessing /dashboard without token', async () => {
      const request = createRequest('/dashboard');
      const response = await middleware(request);

      expect(response.status).toBe(307); // Redirect
      expect(response.headers.get('location')).toContain('/login');
      expect(response.headers.get('location')).toContain('redirect=%2Fdashboard');
    });

    it('should redirect to login when accessing /dashboard/profile without token', async () => {
      const request = createRequest('/dashboard/profile');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should redirect to login with invalid token', async () => {
      const request = createRequest('/dashboard', { accessToken: 'invalid-token' });
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });
  });

  describe('Protected Routes - Admin', () => {
    it('should redirect to login when accessing /admin without token', async () => {
      const request = createRequest('/admin');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should redirect to login when accessing /admin/barbers without token', async () => {
      const request = createRequest('/admin/barbers');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });
  });

  describe('Public Routes', () => {
    it('should allow access to home page without token', async () => {
      const request = createRequest('/');
      const response = await middleware(request);

      expect(response.status).not.toBe(307);
    });

    it('should allow access to /barbers without token', async () => {
      const request = createRequest('/barbers');
      const response = await middleware(request);

      expect(response.status).not.toBe(307);
    });

    it('should allow access to /login without token', async () => {
      const request = createRequest('/login');
      const response = await middleware(request);

      expect(response.status).not.toBe(307);
    });
  });
});
