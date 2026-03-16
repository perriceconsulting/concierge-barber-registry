import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import { notifyAdminsLicenseSubmitted } from '@/lib/email';
import { createLogger } from '@/lib/logger';

const logger = createLogger('LICENSE_SUBMIT');

// POST /api/barbers/license-submit - Submit license for admin review
const submitLicenseHandler = async (request: { userId?: string }) => {
  try {
    const userId = request.userId;

    const barberProfile = await prisma.barberProfile.findUnique({
      where: { userId },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });

    if (!barberProfile) {
      return NextResponse.json(
        { success: false, message: 'Barber profile not found.' },
        { status: 404 }
      );
    }

    // Verify all required license fields are present
    if (!barberProfile.licenseDocumentUrl || !barberProfile.licenseNumber || !barberProfile.licenseState || !barberProfile.licenseExpirationDate) {
      return NextResponse.json(
        { success: false, message: 'Please complete all license fields and upload a document before submitting.' },
        { status: 400 }
      );
    }

    // Set status to pending and reset any previous verification data
    await prisma.barberProfile.update({
      where: { id: barberProfile.id },
      data: {
        verificationStatus: 'pending',
        licenseVerified: false,
        verifiedAt: null,
        verifiedByUserId: null,
        verificationNotes: null,
        submittedForVerificationAt: new Date(),
      },
    });

    // Notify admins
    notifyAdminsLicenseSubmitted({
      name: `${barberProfile.user.firstName} ${barberProfile.user.lastName}`,
      email: barberProfile.user.email,
      licenseNumber: barberProfile.licenseNumber,
      licenseState: barberProfile.licenseState,
      profileId: barberProfile.id,
    });

    return NextResponse.json({
      success: true,
      message: 'License submitted for review',
    });
  } catch (error) {
    logger.error('License submit failed:', {
      errorType: error instanceof Error ? error.name : 'Unknown',
      timestamp: new Date().toISOString(),
    });
    return handleApiError(error);
  }
};

export const POST = withAuth(submitLicenseHandler, { requiredRole: 'barber' });
