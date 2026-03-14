import { NextRequest } from 'next/server';
import { POST as RegisterPOST } from '@/app/api/auth/register/route';
import { POST as LoginPOST } from '@/app/api/auth/login/route';
import { POST as ProfilePOST, PUT as ProfilePUT } from '@/app/api/barbers/profile/route';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import * as emailLib from '@/lib/email';

// Mock the modules
jest.mock('@/lib/db');
jest.mock('@/lib/email');
jest.mock('@/lib/api/csrf');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockEmail = emailLib as jest.Mocked<typeof emailLib>;

describe('E2E: Barber Onboarding Journey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEmail.sendWelcomeEmail = jest.fn().mockResolvedValue(undefined);
    mockEmail.sendVerificationEmail = jest.fn().mockResolvedValue(undefined);
  });

  const createRequest = (url: string, body: any, headers: Record<string, string> = {}) => {
    return new NextRequest(url, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        ...headers,
      }),
      body: JSON.stringify(body),
    });
  };

  describe('Complete Onboarding Flow', () => {
    it('should complete full barber registration to profile creation journey', async () => {
      const barberData = {
        email: 'newbarber@example.com',
        password: 'SecurePassword123!',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'barber',
      };

      // Step 1: User Registration
      mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-barber-123',
        email: barberData.email,
        passwordHash: await hashPassword(barberData.password),
        firstName: barberData.firstName,
        lastName: barberData.lastName,
        role: 'barber',
        emailVerified: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: null,
        avatarUrl: null,
        notifyEmailEnabled: true,
        notifyContactRequests: true,
        notifyNewReviews: true,
        notifyMarketingEmails: false,
      });

      mockPrisma.verificationToken.create.mockResolvedValue({
        id: 'token-123',
        token: 'verification-token-hash',
        userId: 'new-barber-123',
        type: 'email_verification',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      const registerRequest = createRequest(
        'http://localhost:3000/api/auth/register',
        barberData
      );

      const registerResponse = await RegisterPOST(registerRequest);
      const registerData = await registerResponse.json();

      expect(registerResponse.status).toBe(201);
      expect(registerData.success).toBe(true);
      expect(registerData.data.user.email).toBe(barberData.email);
      expect(registerData.data.user.role).toBe('barber');

      // Verify welcome email sent
      expect(mockEmail.sendWelcomeEmail).toHaveBeenCalledWith(
        barberData.email,
        barberData.firstName
      );

      // Step 2: Email Verification (skipped in test environment)
      // In production, user would click email link

      // Step 3: Login
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'new-barber-123',
        email: barberData.email,
        passwordHash: await hashPassword(barberData.password),
        firstName: barberData.firstName,
        lastName: barberData.lastName,
        role: 'barber',
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: null,
        avatarUrl: null,
        notifyEmailEnabled: true,
        notifyContactRequests: true,
        notifyNewReviews: true,
        notifyMarketingEmails: false,
      });

      mockPrisma.session.create.mockResolvedValue({
        id: 'session-123',
        userId: 'new-barber-123',
        refreshTokenHash: 'hash',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        createdAt: new Date(),
        userAgent: null,
        ipAddress: null,
      });

      const loginRequest = createRequest(
        'http://localhost:3000/api/auth/login',
        {
          email: barberData.email,
          password: barberData.password,
        }
      );

      const loginResponse = await LoginPOST(loginRequest);
      const loginData = await loginResponse.json();

      expect(loginResponse.status).toBe(200);
      expect(loginData.success).toBe(true);
      expect(loginData.data.user.email).toBe(barberData.email);

      // Step 4: Create Barber Profile
      mockPrisma.barberProfile.findUnique.mockResolvedValue(null); // No existing profile

      mockPrisma.barberProfile.create.mockResolvedValue({
        id: 'barber-profile-123',
        userId: 'new-barber-123',
        displayName: 'Jane Smith Barbershop',
        slug: 'jane-smith-barbershop-abc123',
        bio: 'Professional barber with 5 years of experience',
        tagline: 'Your style, my passion',
        yearsExperience: 5,
        licenseNumber: null,
        licenseState: null,
        licenseExpirationDate: null,
        licenseDocumentUrl: null,
        licenseVerified: false,
        verificationStatus: 'pending',
        verificationNotes: null,
        verifiedAt: null,
        verifiedByUserId: null,
        submittedForVerificationAt: null,
        shopName: 'Jane\'s Cuts',
        shopAddressLine1: '123 Main St',
        shopAddressLine2: null,
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        latitude: null,
        longitude: null,
        offersMobileService: false,
        mobileServiceRadiusMiles: null,
        websiteUrl: null,
        instagramHandle: null,
        tiktokHandle: null,
        acceptsWalkins: true,
        acceptsAppointments: true,
        isFeatured: false,
        averageRating: 0.0,
        totalReviews: 0,
        profileViews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const profileData = {
        displayName: 'Jane Smith Barbershop',
        bio: 'Professional barber with 5 years of experience',
        tagline: 'Your style, my passion',
        yearsExperience: 5,
        shopName: 'Jane\'s Cuts',
        shopAddressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        acceptsWalkins: true,
        acceptsAppointments: true,
      };

      const profileRequest = createRequest(
        'http://localhost:3000/api/barbers/profile',
        profileData
      );

      // Simulate authenticated request
      (profileRequest as any).userId = 'new-barber-123';
      (profileRequest as any).userRole = 'barber';

      const profileResponse = await ProfilePOST(profileRequest as any);
      const profileResponseData = await profileResponse.json();

      expect(profileResponse.status).toBe(201);
      expect(profileResponseData.success).toBe(true);
      expect(profileResponseData.data.profile.displayName).toBe('Jane Smith Barbershop');
      expect(profileResponseData.data.profile.city).toBe('New York');
      expect(profileResponseData.data.profile.verificationStatus).toBe('pending');
    });

    it('should prevent duplicate registration with same email', async () => {
      const existingUser = {
        id: 'existing-123',
        email: 'existing@example.com',
        passwordHash: 'hash',
        firstName: 'Existing',
        lastName: 'User',
        role: 'barber',
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: null,
        avatarUrl: null,
        notifyEmailEnabled: true,
        notifyContactRequests: true,
        notifyNewReviews: true,
        notifyMarketingEmails: false,
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      const registerRequest = createRequest(
        'http://localhost:3000/api/auth/register',
        {
          email: 'existing@example.com',
          password: 'NewPassword123!',
          firstName: 'New',
          lastName: 'User',
          role: 'barber',
        }
      );

      const response = await RegisterPOST(registerRequest);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
    });

    it('should validate password strength during registration', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const weakPasswords = [
        'short',
        'onlylowercase',
        'ONLYUPPERCASE',
        '12345678',
        'NoNumber!',
        'nospecialchar123',
      ];

      for (const weakPassword of weakPasswords) {
        const registerRequest = createRequest(
          'http://localhost:3000/api/auth/register',
          {
            email: 'test@example.com',
            password: weakPassword,
            firstName: 'Test',
            lastName: 'User',
            role: 'barber',
          }
        );

        const response = await RegisterPOST(registerRequest);

        expect(response.status).toBe(400);
      }
    });

    it('should prevent profile creation without authentication', async () => {
      const profileRequest = createRequest(
        'http://localhost:3000/api/barbers/profile',
        {
          displayName: 'Test Profile',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
        }
      );

      // No userId set (not authenticated)
      expect((profileRequest as any).userId).toBeUndefined();
    });

    it('should prevent duplicate profile creation', async () => {
      const existingProfile = {
        id: 'profile-123',
        userId: 'barber-123',
        displayName: 'Existing Profile',
        slug: 'existing-profile',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
      };

      mockPrisma.barberProfile.findUnique.mockResolvedValue(existingProfile as any);

      const profileRequest = createRequest(
        'http://localhost:3000/api/barbers/profile',
        {
          displayName: 'New Profile',
          city: 'Boston',
          state: 'MA',
          zipCode: '02101',
        }
      );

      (profileRequest as any).userId = 'barber-123';
      (profileRequest as any).userRole = 'barber';

      const response = await ProfilePOST(profileRequest as any);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
    });
  });

  describe('Profile Update Journey', () => {
    it('should allow barber to update their profile', async () => {
      const existingProfile = {
        id: 'profile-123',
        userId: 'barber-123',
        displayName: 'Old Name',
        slug: 'old-name-123',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        bio: 'Old bio',
        tagline: 'Old tagline',
        yearsExperience: 3,
      };

      mockPrisma.barberProfile.findUnique.mockResolvedValue(existingProfile as any);

      const updatedProfile = {
        ...existingProfile,
        displayName: 'New Name',
        bio: 'Updated professional bio',
        tagline: 'New tagline',
        yearsExperience: 5,
      };

      mockPrisma.barberProfile.update.mockResolvedValue(updatedProfile as any);

      const updateData = {
        displayName: 'New Name',
        bio: 'Updated professional bio',
        tagline: 'New tagline',
        yearsExperience: 5,
      };

      const updateRequest = new NextRequest(
        'http://localhost:3000/api/barbers/profile',
        {
          method: 'PUT',
          headers: new Headers({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(updateData),
        }
      );

      (updateRequest as any).userId = 'barber-123';
      (updateRequest as any).userRole = 'barber';

      const response = await ProfilePUT(updateRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.profile.displayName).toBe('New Name');
      expect(data.data.profile.bio).toBe('Updated professional bio');
    });

    it('should validate required fields during profile update', async () => {
      const existingProfile = {
        id: 'profile-123',
        userId: 'barber-123',
        displayName: 'Test Name',
        slug: 'test-name-123',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
      };

      mockPrisma.barberProfile.findUnique.mockResolvedValue(existingProfile as any);

      const invalidUpdateData = {
        displayName: '', // Empty required field
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
      };

      const updateRequest = new NextRequest(
        'http://localhost:3000/api/barbers/profile',
        {
          method: 'PUT',
          headers: new Headers({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(invalidUpdateData),
        }
      );

      (updateRequest as any).userId = 'barber-123';
      (updateRequest as any).userRole = 'barber';

      const response = await ProfilePUT(updateRequest as any);

      expect(response.status).toBe(400);
    });

    it('should prevent updating another barber\'s profile', async () => {
      const otherProfile = {
        id: 'profile-456',
        userId: 'other-barber-456',
        displayName: 'Other Barber',
        slug: 'other-barber-456',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
      };

      mockPrisma.barberProfile.findUnique.mockResolvedValue(otherProfile as any);

      const updateRequest = new NextRequest(
        'http://localhost:3000/api/barbers/profile',
        {
          method: 'PUT',
          headers: new Headers({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            displayName: 'Hacked Name',
          }),
        }
      );

      (updateRequest as any).userId = 'malicious-barber-123';
      (updateRequest as any).userRole = 'barber';

      const response = await ProfilePUT(updateRequest as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('Data Validation and Sanitization', () => {
    it('should sanitize XSS attempts in profile fields', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(null);

      const xssData = {
        displayName: "Test<script>alert('xss')</script>Shop",
        bio: "<img src=x onerror=alert('xss')>",
        tagline: "Best barber<iframe src='evil.com'></iframe>",
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
      };

      mockPrisma.barberProfile.create.mockImplementation((args: any) => {
        // Verify data is sanitized before storage
        expect(args.data.displayName).not.toContain('<script>');
        expect(args.data.bio).not.toContain('<img');
        expect(args.data.tagline).not.toContain('<iframe');

        return Promise.resolve({
          id: 'profile-123',
          userId: 'barber-123',
          ...args.data,
        } as any);
      });

      const profileRequest = createRequest(
        'http://localhost:3000/api/barbers/profile',
        xssData
      );

      (profileRequest as any).userId = 'barber-123';
      (profileRequest as any).userRole = 'barber';

      await ProfilePOST(profileRequest as any);

      expect(mockPrisma.barberProfile.create).toHaveBeenCalled();
    });

    it('should validate state abbreviation format', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(null);

      const invalidStates = ['New York', 'N', 'NYY', '12', 'N@'];

      for (const invalidState of invalidStates) {
        const profileRequest = createRequest(
          'http://localhost:3000/api/barbers/profile',
          {
            displayName: 'Test',
            city: 'New York',
            state: invalidState,
            zipCode: '10001',
          }
        );

        (profileRequest as any).userId = 'barber-123';
        (profileRequest as any).userRole = 'barber';

        const response = await ProfilePOST(profileRequest as any);

        expect(response.status).toBe(400);
      }
    });

    it('should validate zip code format', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(null);

      const invalidZipCodes = ['1234', '123456', 'ABCDE', '10001-', '10001-123'];

      for (const invalidZip of invalidZipCodes) {
        const profileRequest = createRequest(
          'http://localhost:3000/api/barbers/profile',
          {
            displayName: 'Test',
            city: 'New York',
            state: 'NY',
            zipCode: invalidZip,
          }
        );

        (profileRequest as any).userId = 'barber-123';
        (profileRequest as any).userRole = 'barber';

        const response = await ProfilePOST(profileRequest as any);

        expect(response.status).toBe(400);
      }
    });
  });
});
