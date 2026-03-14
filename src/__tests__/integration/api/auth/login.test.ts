import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';

// Mock the modules
jest.mock('@/lib/db');
jest.mock('@/lib/api/csrf');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('POST /api/auth/login', () => {
  const validCredentials = {
    email: 'test@example.com',
    password: 'TestPassword123!',
  };

  const createRequest = (body: any, headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        ...headers,
      }),
      body: JSON.stringify(body),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login successfully with valid credentials', async () => {
    const passwordHash = await hashPassword(validCredentials.password);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-123',
      email: validCredentials.email,
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
      role: 'client',
      emailVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      phone: null,
      avatarUrl: null,
    });

    mockPrisma.session.create.mockResolvedValue({
      id: 'session-123',
      userId: 'user-123',
      refreshTokenHash: 'hash',
      expiresAt: new Date(),
      isRevoked: false,
      createdAt: new Date(),
      userAgent: null,
      ipAddress: null,
    });

    const request = createRequest(validCredentials);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.user).toBeDefined();
    expect(data.data.user.email).toBe(validCredentials.email);
    expect(data.data.message).toBe('Logged in successfully');
  });

  it('should reject login with invalid email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const request = createRequest({
      email: 'nonexistent@example.com',
      password: 'SomePassword123!',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('AUTH_INVALID_CREDENTIALS');
  });

  it('should reject login with incorrect password', async () => {
    const passwordHash = await hashPassword(validCredentials.password);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-123',
      email: validCredentials.email,
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
      role: 'client',
      emailVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      phone: null,
      avatarUrl: null,
    });

    const request = createRequest({
      email: validCredentials.email,
      password: 'WrongPassword123!',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('AUTH_INVALID_CREDENTIALS');
  });

  it('should reject login for inactive account', async () => {
    const passwordHash = await hashPassword(validCredentials.password);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-123',
      email: validCredentials.email,
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
      role: 'client',
      emailVerified: true,
      isActive: false, // Inactive account
      createdAt: new Date(),
      updatedAt: new Date(),
      phone: null,
      avatarUrl: null,
    });

    const request = createRequest(validCredentials);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('AUTH_ACCOUNT_DEACTIVATED');
  });

  it('should reject malformed request body', async () => {
    const request = createRequest({
      email: 'not-an-email',
      password: '123', // Too short
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});
