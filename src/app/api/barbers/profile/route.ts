import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { updateBarberProfileSchema } from '@/lib/validations/barber';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { sanitizeBio, sanitizeText, sanitizeUrl } from '@/lib/sanitize';
import { generateUniqueBarberSlug } from '@/lib/slug';

// GET /api/barbers/profile - Get authenticated barber's profile
const getProfileHandler = async (request: { userId?: string }) => {
  try {
    const userId = request.userId;

    const barberProfile = await prisma.barberProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        specialties: {
          include: {
            specialty: true,
          },
        },
        services: true,
        operatingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    if (!barberProfile) {
      return NextResponse.json(
        {
          success: false,
          message: 'Barber profile not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { barberProfile },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

// PUT /api/barbers/profile - Update or create authenticated barber's profile
const updateProfileHandler = async (request: { userId?: string; json: () => Promise<unknown> }) => {
  try {
    const userId = request.userId;

    const body = await request.json();
    const validatedData = updateBarberProfileSchema.parse(body);

    // Extract specialtyIds for separate handling
    const { specialtyIds, ...profileData } = validatedData;

    // Check if user has a barber profile
    const existingProfile = await prisma.barberProfile.findUnique({
      where: { userId },
    });

    // Sanitize user-generated content
    const sanitizedProfileData = {
      ...profileData,
      ...(profileData.bio && { bio: sanitizeBio(profileData.bio) }),
      ...(profileData.tagline && { tagline: sanitizeText(profileData.tagline) }),
      ...(profileData.displayName && { displayName: sanitizeText(profileData.displayName) }),
      ...(profileData.shopName && { shopName: sanitizeText(profileData.shopName) }),
      ...(profileData.websiteUrl && { websiteUrl: sanitizeUrl(profileData.websiteUrl) }),
      ...(profileData.licenseExpirationDate && { licenseExpirationDate: new Date(profileData.licenseExpirationDate) }),
    };

    // Check if license info is being submitted for the first time
    const hasLicenseData = profileData.licenseNumber && profileData.licenseState && profileData.licenseExpirationDate;
    const shouldSubmitForVerification = hasLicenseData && existingProfile && !existingProfile.submittedForVerificationAt;

    let updatedProfile;

    if (existingProfile) {
      // Update existing profile
      updatedProfile = await prisma.barberProfile.update({
        where: { userId },
        data: {
          ...sanitizedProfileData,
          // Set submittedForVerificationAt timestamp if license data is being submitted
          ...(shouldSubmitForVerification && {
            submittedForVerificationAt: new Date(),
          }),
          // Update specialties if provided
          ...(specialtyIds && {
            specialties: {
              deleteMany: {},
              create: specialtyIds.map((id) => ({
                specialty: { connect: { id } },
              })),
            },
          }),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          specialties: {
            include: {
              specialty: true,
            },
          },
        },
      });
    } else {
      // Create new profile
      // Generate unique slug with collision prevention
      const slug = await generateUniqueBarberSlug(
        profileData.displayName || '',
        userId!
      );

      const createData: {
        userId: string;
        slug: string;
        verificationStatus: string;
        specialties?: { create: Array<{ specialty: { connect: { id: number } } }> };
        [key: string]: unknown;
      } = {
        userId: userId!,
        ...sanitizedProfileData,
        slug,
        verificationStatus: 'pending',
      };

      if (specialtyIds) {
        createData.specialties = {
          create: specialtyIds.map((id: number) => ({
            specialty: { connect: { id } },
          })),
        };
      }

      updatedProfile = await prisma.barberProfile.create({
        data: createData,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          specialties: {
            include: {
              specialty: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { barberProfile: updatedProfile },
      message: existingProfile ? 'Profile updated successfully' : 'Profile created successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withAuth(getProfileHandler, { requiredRole: 'barber' });
export const PUT = withAuth(updateProfileHandler, { requiredRole: 'barber' });
