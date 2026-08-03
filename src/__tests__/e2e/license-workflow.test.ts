import { NextRequest } from 'next/server';
import { POST as UploadPOST } from '@/app/api/barbers/license-upload/route';
import { PUT as ProfilePUT } from '@/app/api/barbers/profile/route';
import { PATCH as VerifyPATCH } from '@/app/api/admin/barbers/[id]/verify/route';
import { GET as BarberListGET } from '@/app/api/barbers/route';
import { prisma } from '@/lib/db';
import * as emailLib from '@/lib/email';

// Mock the modules
jest.mock('@/lib/db');
jest.mock('@/lib/email');
jest.mock('fs/promises');
jest.mock('fs');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockEmail = emailLib as jest.Mocked<typeof emailLib>;
const fs = require('fs');
const fsPromises = require('fs/promises');

describe('E2E: Complete License Verification Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEmail.sendLicenseApprovedEmail = jest.fn().mockResolvedValue(undefined);
    mockEmail.sendLicenseRejectedEmail = jest.fn().mockResolvedValue(undefined);
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.mkdirSync = jest.fn();
    fsPromises.writeFile = jest.fn().mockResolvedValue(undefined);
  });

  const barberUserId = 'barber-user-123';
  const barberProfileId = 'barber-profile-123';
  const adminUserId = 'admin-user-123';

  const mockBarberProfile = {
    id: barberProfileId,
    userId: barberUserId,
    displayName: 'John Doe',
    slug: 'john-doe-123',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
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
    user: {
      id: barberUserId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
  };

  const createMockFile = (name: string, type: string, _size: number): File => {
    const blob = new Blob(['test content'], { type });
    return new File([blob], name, { type });
  };

  describe('Complete License Verification Journey', () => {
    it('should complete barber license submission and admin approval workflow', async () => {
      // Step 1: Barber submits license information
      const licenseData = {
        licenseNumber: 'NY-12345',
        licenseState: 'NY',
        licenseExpirationDate: '2025-12-31',
      };

      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);

      const updatedProfileWithLicense = {
        ...mockBarberProfile,
        licenseNumber: licenseData.licenseNumber,
        licenseState: licenseData.licenseState,
        licenseExpirationDate: new Date(licenseData.licenseExpirationDate),
        submittedForVerificationAt: new Date(),
      };

      mockPrisma.barberProfile.update.mockResolvedValue(
        updatedProfileWithLicense as any
      );

      const profileUpdateRequest = new NextRequest(
        'http://localhost:3000/api/barbers/profile',
        {
          method: 'PUT',
          headers: new Headers({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(licenseData),
        }
      );

      (profileUpdateRequest as any).userId = barberUserId;
      (profileUpdateRequest as any).userRole = 'barber';

      const profileResponse = await ProfilePUT(profileUpdateRequest as any);
      const profileData = await profileResponse.json();

      expect(profileResponse.status).toBe(200);
      expect(profileData.success).toBe(true);

      // Step 2: Barber uploads license document
      const licenseFile = createMockFile('license.pdf', 'application/pdf', 1024 * 100);

      const formData = new FormData();
      formData.append('file', licenseFile);

      const uploadRequest = {
        userId: barberUserId,
        formData: async () => formData,
      };

      mockPrisma.barberProfile.findUnique.mockResolvedValue(
        updatedProfileWithLicense as any
      );

      const profileWithDocument = {
        ...updatedProfileWithLicense,
        licenseDocumentUrl: '/uploads/licenses/license-123.pdf',
      };

      mockPrisma.barberProfile.update.mockResolvedValue(profileWithDocument as any);

      const uploadResponse = await UploadPOST(uploadRequest as any);
      const uploadData = await uploadResponse.json();

      expect(uploadResponse.status).toBe(200);
      expect(uploadData.success).toBe(true);
      expect(uploadData.data.documentUrl).toBeDefined();

      // Step 3: Admin reviews and approves license
      mockPrisma.barberProfile.findUnique.mockResolvedValue({
        ...profileWithDocument,
        user: {
          id: barberUserId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      } as any);

      const approvedProfile = {
        ...profileWithDocument,
        verificationStatus: 'approved',
        licenseVerified: true,
        verifiedAt: new Date(),
        verifiedByUserId: adminUserId,
        verificationNotes: 'License verified successfully',
        user: {
          id: barberUserId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      };

      mockPrisma.barberProfile.update.mockResolvedValue(approvedProfile as any);
      mockPrisma.auditLog.create.mockResolvedValue({} as any);

      const verifyRequest = new NextRequest(
        `http://localhost:3000/api/admin/barbers/${barberProfileId}/verify`,
        {
          method: 'PATCH',
          headers: new Headers({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            status: 'approved',
            notes: 'License verified successfully',
          }),
        }
      );

      (verifyRequest as any).userId = adminUserId;
      (verifyRequest as any).userRole = 'admin';

      const context = { params: Promise.resolve({ id: barberProfileId }) };
      const verifyResponse = await VerifyPATCH(verifyRequest as any, context);
      const verifyData = await verifyResponse.json();

      expect(verifyResponse.status).toBe(200);
      expect(verifyData.success).toBe(true);
      expect(verifyData.data.barberProfile.verificationStatus).toBe('approved');
      expect(verifyData.data.barberProfile.licenseVerified).toBe(true);

      // Step 4: Verify approval email was sent
      expect(mockEmail.sendLicenseApprovedEmail).toHaveBeenCalledWith(
        'john@example.com',
        'John'
      );

      // Step 5: Verify barber appears in verified search results
      mockPrisma.barberProfile.findMany.mockResolvedValue([approvedProfile as any]);
      mockPrisma.barberProfile.count.mockResolvedValue(1);

      const searchRequest = new NextRequest(
        'http://localhost:3000/api/barbers?verifiedOnly=true',
        { method: 'GET' }
      );

      const searchResponse = await BarberListGET(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchResponse.status).toBe(200);
      expect(searchData.success).toBe(true);
      expect(searchData.data.barbers).toHaveLength(1);
      expect(searchData.data.barbers[0].licenseVerified).toBe(true);
      expect(searchData.data.barbers[0].verificationStatus).toBe('approved');
    });

    it('should handle license rejection workflow', async () => {
      // Step 1: Barber has already submitted license
      const submittedProfile = {
        ...mockBarberProfile,
        licenseNumber: 'NY-12345',
        licenseState: 'NY',
        licenseExpirationDate: new Date('2024-01-01'), // Expired
        licenseDocumentUrl: '/uploads/licenses/license-123.pdf',
        submittedForVerificationAt: new Date(),
        user: {
          id: barberUserId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      };

      mockPrisma.barberProfile.findUnique.mockResolvedValue(submittedProfile as any);

      // Step 2: Admin rejects license
      const rejectedProfile = {
        ...submittedProfile,
        verificationStatus: 'rejected',
        licenseVerified: false,
        verifiedAt: null,
        verificationNotes: 'License has expired',
      };

      mockPrisma.barberProfile.update.mockResolvedValue(rejectedProfile as any);
      mockPrisma.auditLog.create.mockResolvedValue({} as any);

      const verifyRequest = new NextRequest(
        `http://localhost:3000/api/admin/barbers/${barberProfileId}/verify`,
        {
          method: 'PATCH',
          headers: new Headers({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            status: 'rejected',
            notes: 'License has expired',
          }),
        }
      );

      (verifyRequest as any).userId = adminUserId;
      (verifyRequest as any).userRole = 'admin';

      const context = { params: Promise.resolve({ id: barberProfileId }) };
      const verifyResponse = await VerifyPATCH(verifyRequest as any, context);
      const verifyData = await verifyResponse.json();

      expect(verifyResponse.status).toBe(200);
      expect(verifyData.success).toBe(true);
      expect(verifyData.data.barberProfile.verificationStatus).toBe('rejected');
      expect(verifyData.data.barberProfile.licenseVerified).toBe(false);

      // Step 3: Verify rejection email was sent with reason
      expect(mockEmail.sendLicenseRejectedEmail).toHaveBeenCalledWith(
        'john@example.com',
        'John',
        'License has expired'
      );

      // Step 4: Verify barber does NOT appear in verified search results
      mockPrisma.barberProfile.findMany.mockResolvedValue([]);
      mockPrisma.barberProfile.count.mockResolvedValue(0);

      const searchRequest = new NextRequest(
        'http://localhost:3000/api/barbers?verifiedOnly=true',
        { method: 'GET' }
      );

      const searchResponse = await BarberListGET(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchResponse.status).toBe(200);
      expect(searchData.success).toBe(true);
      expect(searchData.data.barbers).toHaveLength(0);
    });

    it('should handle license resubmission after rejection', async () => {
      // Step 1: Barber's license was previously rejected
      const rejectedProfile = {
        ...mockBarberProfile,
        licenseNumber: 'NY-12345',
        licenseState: 'NY',
        licenseExpirationDate: new Date('2024-01-01'),
        licenseDocumentUrl: '/uploads/licenses/old-license.pdf',
        verificationStatus: 'rejected',
        licenseVerified: false,
        verificationNotes: 'License has expired',
      };

      mockPrisma.barberProfile.findUnique.mockResolvedValue(rejectedProfile as any);

      // Step 2: Barber updates with new license information
      const newLicenseData = {
        licenseNumber: 'NY-54321',
        licenseState: 'NY',
        licenseExpirationDate: '2026-12-31', // New valid license
      };

      const resubmittedProfile = {
        ...rejectedProfile,
        licenseNumber: newLicenseData.licenseNumber,
        licenseExpirationDate: new Date(newLicenseData.licenseExpirationDate),
        verificationStatus: 'pending',
        verificationNotes: null,
        submittedForVerificationAt: new Date(),
      };

      mockPrisma.barberProfile.update.mockResolvedValue(resubmittedProfile as any);

      const profileUpdateRequest = new NextRequest(
        'http://localhost:3000/api/barbers/profile',
        {
          method: 'PUT',
          headers: new Headers({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(newLicenseData),
        }
      );

      (profileUpdateRequest as any).userId = barberUserId;
      (profileUpdateRequest as any).userRole = 'barber';

      const profileResponse = await ProfilePUT(profileUpdateRequest as any);
      const profileData = await profileResponse.json();

      expect(profileResponse.status).toBe(200);
      expect(profileData.success).toBe(true);
      expect(profileData.data.profile.verificationStatus).toBe('pending');
      expect(profileData.data.profile.licenseNumber).toBe('NY-54321');

      // Step 3: Upload new license document
      const newLicenseFile = createMockFile(
        'new-license.pdf',
        'application/pdf',
        1024 * 100
      );

      const formData = new FormData();
      formData.append('file', newLicenseFile);

      const uploadRequest = {
        userId: barberUserId,
        formData: async () => formData,
      };

      mockPrisma.barberProfile.findUnique.mockResolvedValue(resubmittedProfile as any);

      const profileWithNewDocument = {
        ...resubmittedProfile,
        licenseDocumentUrl: '/uploads/licenses/new-license-456.pdf',
      };

      mockPrisma.barberProfile.update.mockResolvedValue(
        profileWithNewDocument as any
      );

      const uploadResponse = await UploadPOST(uploadRequest as any);
      const uploadData = await uploadResponse.json();

      expect(uploadResponse.status).toBe(200);
      expect(uploadData.success).toBe(true);
      expect(uploadData.data.documentUrl).not.toBe('/uploads/licenses/old-license.pdf');

      // Step 4: Admin approves the resubmission
      mockPrisma.barberProfile.findUnique.mockResolvedValue({
        ...profileWithNewDocument,
        user: {
          id: barberUserId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      } as any);

      const approvedProfile = {
        ...profileWithNewDocument,
        verificationStatus: 'approved',
        licenseVerified: true,
        verifiedAt: new Date(),
        verifiedByUserId: adminUserId,
        user: {
          id: barberUserId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      };

      mockPrisma.barberProfile.update.mockResolvedValue(approvedProfile as any);
      mockPrisma.auditLog.create.mockResolvedValue({} as any);

      const verifyRequest = new NextRequest(
        `http://localhost:3000/api/admin/barbers/${barberProfileId}/verify`,
        {
          method: 'PATCH',
          headers: new Headers({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            status: 'approved',
            notes: 'New license verified',
          }),
        }
      );

      (verifyRequest as any).userId = adminUserId;
      (verifyRequest as any).userRole = 'admin';

      const context = { params: Promise.resolve({ id: barberProfileId }) };
      const verifyResponse = await VerifyPATCH(verifyRequest as any, context);
      const verifyData = await verifyResponse.json();

      expect(verifyResponse.status).toBe(200);
      expect(verifyData.data.barberProfile.verificationStatus).toBe('approved');
      expect(verifyData.data.barberProfile.licenseVerified).toBe(true);
    });
  });

  describe('Verified Badge Display', () => {
    it('should show verified badge for approved barbers', async () => {
      const verifiedProfile = {
        ...mockBarberProfile,
        licenseVerified: true,
        verificationStatus: 'approved',
        verifiedAt: new Date(),
      };

      mockPrisma.barberProfile.findMany.mockResolvedValue([verifiedProfile as any]);
      mockPrisma.barberProfile.count.mockResolvedValue(1);

      const searchRequest = new NextRequest(
        'http://localhost:3000/api/barbers',
        { method: 'GET' }
      );

      const searchResponse = await BarberListGET(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchResponse.status).toBe(200);
      expect(searchData.data.barbers[0].licenseVerified).toBe(true);
      expect(searchData.data.barbers[0].verificationStatus).toBe('approved');
    });

    it('should not show verified badge for pending barbers', async () => {
      const pendingProfile = {
        ...mockBarberProfile,
        licenseVerified: false,
        verificationStatus: 'pending',
      };

      mockPrisma.barberProfile.findMany.mockResolvedValue([pendingProfile as any]);
      mockPrisma.barberProfile.count.mockResolvedValue(1);

      const searchRequest = new NextRequest(
        'http://localhost:3000/api/barbers',
        { method: 'GET' }
      );

      const searchResponse = await BarberListGET(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchResponse.status).toBe(200);
      expect(searchData.data.barbers[0].licenseVerified).toBe(false);
      expect(searchData.data.barbers[0].verificationStatus).toBe('pending');
    });

    it('should not show verified badge for rejected barbers', async () => {
      const rejectedProfile = {
        ...mockBarberProfile,
        licenseVerified: false,
        verificationStatus: 'rejected',
      };

      mockPrisma.barberProfile.findMany.mockResolvedValue([rejectedProfile as any]);
      mockPrisma.barberProfile.count.mockResolvedValue(1);

      const searchRequest = new NextRequest(
        'http://localhost:3000/api/barbers',
        { method: 'GET' }
      );

      const searchResponse = await BarberListGET(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchResponse.status).toBe(200);
      expect(searchData.data.barbers[0].licenseVerified).toBe(false);
      expect(searchData.data.barbers[0].verificationStatus).toBe('rejected');
    });
  });

  describe('Verified-Only Search Filter', () => {
    it('should filter to show only verified barbers', async () => {
      const verifiedBarber = {
        id: 'verified-123',
        displayName: 'Verified Barber',
        licenseVerified: true,
        verificationStatus: 'approved',
      };

      mockPrisma.barberProfile.findMany.mockResolvedValue([verifiedBarber as any]);
      mockPrisma.barberProfile.count.mockResolvedValue(1);

      const searchRequest = new NextRequest(
        'http://localhost:3000/api/barbers?verifiedOnly=true',
        { method: 'GET' }
      );

      const searchResponse = await BarberListGET(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchResponse.status).toBe(200);
      expect(searchData.data.barbers).toHaveLength(1);
      expect(searchData.data.barbers[0].licenseVerified).toBe(true);

      // Verify the Prisma query used the correct filter
      expect(mockPrisma.barberProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            licenseVerified: true,
          }),
        })
      );
    });

    it('should return empty list when no verified barbers match', async () => {
      mockPrisma.barberProfile.findMany.mockResolvedValue([]);
      mockPrisma.barberProfile.count.mockResolvedValue(0);

      const searchRequest = new NextRequest(
        'http://localhost:3000/api/barbers?verifiedOnly=true&city=Nowhere',
        { method: 'GET' }
      );

      const searchResponse = await BarberListGET(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchResponse.status).toBe(200);
      expect(searchData.data.barbers).toHaveLength(0);
    });

    it('should show both verified and unverified when filter not applied', async () => {
      const allBarbers = [
        {
          id: 'verified-123',
          displayName: 'Verified Barber',
          licenseVerified: true,
          verificationStatus: 'approved',
        },
        {
          id: 'pending-456',
          displayName: 'Pending Barber',
          licenseVerified: false,
          verificationStatus: 'pending',
        },
      ];

      mockPrisma.barberProfile.findMany.mockResolvedValue(allBarbers as any);
      mockPrisma.barberProfile.count.mockResolvedValue(2);

      const searchRequest = new NextRequest(
        'http://localhost:3000/api/barbers',
        { method: 'GET' }
      );

      const searchResponse = await BarberListGET(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchResponse.status).toBe(200);
      expect(searchData.data.barbers).toHaveLength(2);
    });
  });

  describe('Audit Trail', () => {
    it('should log license approval action', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue({
        ...mockBarberProfile,
        user: {
          id: barberUserId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      } as any);

      mockPrisma.barberProfile.update.mockResolvedValue({
        ...mockBarberProfile,
        verificationStatus: 'approved',
        user: {
          id: barberUserId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      } as any);

      mockPrisma.auditLog.create.mockResolvedValue({} as any);

      const verifyRequest = new NextRequest(
        `http://localhost:3000/api/admin/barbers/${barberProfileId}/verify`,
        {
          method: 'PATCH',
          headers: new Headers({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            status: 'approved',
            notes: 'Valid license',
          }),
        }
      );

      (verifyRequest as any).userId = adminUserId;
      (verifyRequest as any).userRole = 'admin';

      const context = { params: Promise.resolve({ id: barberProfileId }) };
      await VerifyPATCH(verifyRequest as any, context);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorUserId: adminUserId,
          action: 'barber_verification',
          entityType: 'barber_profile',
          entityId: barberProfileId,
          details: expect.objectContaining({
            status: 'approved',
            notes: 'Valid license',
            barberEmail: 'john@example.com',
          }),
        }),
      });
    });
  });
});
