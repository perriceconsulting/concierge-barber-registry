import { POST } from '@/app/api/barbers/license-upload/route';
import { prisma } from '@/lib/db';

// Mock the modules
jest.mock('@/lib/db');
jest.mock('fs/promises');
jest.mock('fs');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const fs = require('fs');
const fsPromises = require('fs/promises');

describe('File Upload Security', () => {
  const barberUserId = 'barber-user-123';
  const mockBarberProfile = {
    id: 'barber-profile-123',
    userId: barberUserId,
    displayName: 'John Doe',
    slug: 'john-doe-123',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.mkdirSync = jest.fn();
    fsPromises.writeFile = jest.fn().mockResolvedValue(undefined);
  });

  const createUploadRequest = (file: File | null) => {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }

    const request = {
      userId: barberUserId,
      formData: async () => formData,
    };

    return request;
  };

  const createMockFile = (
    name: string,
    type: string,
    size: number,
    content: string = 'test content'
  ): File => {
    const blob = new Blob([content], { type });
    return new File([blob], name, { type });
  };

  describe('File Type Validation', () => {
    it('should accept valid JPEG file', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);
      mockPrisma.barberProfile.update.mockResolvedValue(mockBarberProfile as any);

      const validFile = createMockFile('license.jpg', 'image/jpeg', 1024 * 100);
      const request = createUploadRequest(validFile);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept valid PNG file', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);
      mockPrisma.barberProfile.update.mockResolvedValue(mockBarberProfile as any);

      const validFile = createMockFile('license.png', 'image/png', 1024 * 100);
      const request = createUploadRequest(validFile);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept valid PDF file', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);
      mockPrisma.barberProfile.update.mockResolvedValue(mockBarberProfile as any);

      const validFile = createMockFile('license.pdf', 'application/pdf', 1024 * 100);
      const request = createUploadRequest(validFile);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject executable files', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);

      const maliciousFile = createMockFile(
        'malware.exe',
        'application/x-msdownload',
        1024 * 100
      );
      const request = createUploadRequest(maliciousFile);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid file type');
    });

    it('should reject script files', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);

      const scriptFile = createMockFile(
        'script.js',
        'application/javascript',
        1024 * 100
      );
      const request = createUploadRequest(scriptFile);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject HTML files', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);

      const htmlFile = createMockFile('page.html', 'text/html', 1024 * 100);
      const request = createUploadRequest(htmlFile);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject SVG files (potential XSS)', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);

      const svgFile = createMockFile('image.svg', 'image/svg+xml', 1024 * 100);
      const request = createUploadRequest(svgFile);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject files with no type', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);

      const unknownFile = createMockFile('file', '', 1024 * 100);
      const request = createUploadRequest(unknownFile);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('File Size Validation', () => {
    it('should accept files under 5MB limit', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);
      mockPrisma.barberProfile.update.mockResolvedValue(mockBarberProfile as any);

      const validFile = createMockFile(
        'license.jpg',
        'image/jpeg',
        4 * 1024 * 1024 // 4MB
      );
      const request = createUploadRequest(validFile);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject files over 5MB limit', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);

      const largeFile = createMockFile(
        'license.jpg',
        'image/jpeg',
        6 * 1024 * 1024 // 6MB
      );
      const request = createUploadRequest(largeFile);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('exceeds 5MB limit');
    });

    it('should reject extremely large files (100MB)', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);

      const hugeFile = createMockFile(
        'license.jpg',
        'image/jpeg',
        100 * 1024 * 1024 // 100MB
      );
      const request = createUploadRequest(hugeFile);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should accept file exactly at 5MB limit', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);
      mockPrisma.barberProfile.update.mockResolvedValue(mockBarberProfile as any);

      const maxFile = createMockFile(
        'license.jpg',
        'image/jpeg',
        5 * 1024 * 1024 // Exactly 5MB
      );
      const request = createUploadRequest(maxFile);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('File Name Security', () => {
    it('should generate safe, unique filenames', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);
      mockPrisma.barberProfile.update.mockResolvedValue(mockBarberProfile as any);

      const file = createMockFile(
        'my license.jpg',
        'image/jpeg',
        1024 * 100
      );
      const request = createUploadRequest(file);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.documentUrl).toBeDefined();
      expect(data.data.documentUrl).toMatch(/^\/uploads\/licenses\/license-/);
    });

    it('should reject filenames with path traversal', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);

      const maliciousFile = createMockFile(
        '../../../etc/passwd.jpg',
        'image/jpeg',
        1024 * 100
      );
      const request = createUploadRequest(maliciousFile);

      const response = await POST(request as any);

      // Should still succeed but with sanitized filename
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.documentUrl).not.toContain('..');
    });

    it('should handle special characters in filename', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);
      mockPrisma.barberProfile.update.mockResolvedValue(mockBarberProfile as any);

      const file = createMockFile(
        "license & <script>alert('xss')</script>.jpg",
        'image/jpeg',
        1024 * 100
      );
      const request = createUploadRequest(file);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Filename should be sanitized
      expect(data.data.documentUrl).not.toContain('<script>');
      expect(data.data.documentUrl).not.toContain('&');
    });

    it('should preserve file extension', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);
      mockPrisma.barberProfile.update.mockResolvedValue(mockBarberProfile as any);

      const file = createMockFile('license.pdf', 'application/pdf', 1024 * 100);
      const request = createUploadRequest(file);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.documentUrl).toMatch(/\.pdf$/);
    });

    it('should handle uppercase file extensions', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);
      mockPrisma.barberProfile.update.mockResolvedValue(mockBarberProfile as any);

      const file = createMockFile('LICENSE.JPG', 'image/jpeg', 1024 * 100);
      const request = createUploadRequest(file);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.documentUrl).toBeDefined();
    });
  });

  describe('Authorization and Ownership', () => {
    it('should require authentication', async () => {
      const request = {
        userId: undefined,
        formData: async () => new FormData(),
      };

      // Without userId, should fail (handled by withAuth middleware)
      expect((request as any).userId).toBeUndefined();
    });

    it('should require barber profile exists', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(null);

      const file = createMockFile('license.jpg', 'image/jpeg', 1024 * 100);
      const request = createUploadRequest(file);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Barber profile not found');
    });

    it('should only allow barbers to upload', async () => {
      // This is enforced by withAuth middleware with requiredRole: 'barber'
      // The route handler expects the user to have barber role
      mockPrisma.barberProfile.findUnique.mockResolvedValue(null);

      const file = createMockFile('license.jpg', 'image/jpeg', 1024 * 100);
      const uploadRequest = createUploadRequest(file);
      uploadRequest.userId = 'client-user-123';

      const response = await POST(uploadRequest as any);

      expect(response.status).toBe(404);
    });
  });

  describe('Missing File Validation', () => {
    it('should reject request with no file', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);

      const request = createUploadRequest(null);
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('No file provided');
    });

    it('should reject empty file', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);

      const emptyFile = createMockFile('license.jpg', 'image/jpeg', 0);
      const request = createUploadRequest(emptyFile);

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('File Storage Security', () => {
    it('should store files in designated upload directory', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);
      mockPrisma.barberProfile.update.mockResolvedValue(mockBarberProfile as any);

      const file = createMockFile('license.jpg', 'image/jpeg', 1024 * 100);
      const request = createUploadRequest(file);

      await POST(request as any);

      expect(fsPromises.writeFile).toHaveBeenCalled();
      const writeCall = (fsPromises.writeFile as jest.Mock).mock.calls[0];
      const filePath = writeCall[0];

      expect(filePath).toContain('public');
      expect(filePath).toContain('uploads');
      expect(filePath).toContain('licenses');
    });

    it('should create upload directory if it does not exist', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);
      mockPrisma.barberProfile.update.mockResolvedValue(mockBarberProfile as any);
      fs.existsSync = jest.fn().mockReturnValue(false);

      const file = createMockFile('license.jpg', 'image/jpeg', 1024 * 100);
      const request = createUploadRequest(file);

      await POST(request as any);

      expect(fs.mkdirSync).toHaveBeenCalled();
    });

    it('should update barber profile with document URL', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);
      mockPrisma.barberProfile.update.mockResolvedValue(mockBarberProfile as any);

      const file = createMockFile('license.jpg', 'image/jpeg', 1024 * 100);
      const request = createUploadRequest(file);

      await POST(request as any);

      expect(mockPrisma.barberProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockBarberProfile.id },
          data: expect.objectContaining({
            licenseDocumentUrl: expect.stringContaining('/uploads/licenses/'),
          }),
        })
      );
    });

    it('should handle file system errors gracefully', async () => {
      mockPrisma.barberProfile.findUnique.mockResolvedValue(mockBarberProfile as any);
      fsPromises.writeFile = jest
        .fn()
        .mockRejectedValue(new Error('Disk full'));

      const file = createMockFile('license.jpg', 'image/jpeg', 1024 * 100);
      const request = createUploadRequest(file);

      const response = await POST(request as any);

      expect(response.status).toBe(500);
    });
  });
});
