import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createContactRequestSchema } from '@/lib/validations/review';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { rateLimiters } from '@/lib/api/rate-limit';
import { verifyCsrfToken } from '@/lib/api/csrf';
import { optionalAuth } from '@/lib/api/middleware';

// POST /api/contact - Submit a contact request (public endpoint with optional auth)
export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token to prevent CSRF attacks
    verifyCsrfToken(request);

    // Apply rate limiting (5 requests per hour)
    await rateLimiters.contact(request);

    const body = await request.json();
    const validatedData = createContactRequestSchema.parse(body);

    // Check if barber profile exists
    const barberProfile = await prisma.barberProfile.findUnique({
      where: { id: validatedData.barberProfileId },
    });

    if (!barberProfile) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found');
    }

    if (barberProfile.verificationStatus !== 'approved') {
      throw new ApiError(400, 'BAD_REQUEST', 'This barber is not currently accepting requests');
    }

    // Get client user ID if authenticated (optional)
    const user = await optionalAuth(request);
    const clientUserId = user?.userId || null;

    // Create contact request
    const contactRequest = await prisma.contactRequest.create({
      data: {
        barberProfileId: validatedData.barberProfileId,
        clientUserId,
        clientName: validatedData.clientName,
        clientEmail: validatedData.clientEmail,
        clientPhone: validatedData.clientPhone,
        message: validatedData.message,
        serviceInterested: validatedData.serviceInterested,
        preferredDate: validatedData.preferredDate
          ? new Date(validatedData.preferredDate)
          : null,
        preferredTime: validatedData.preferredTime || null,
        status: 'new',
      },
    });

    // TODO: Send email notification to barber
    // await sendContactRequestEmail(barberProfile, contactRequest);

    return NextResponse.json({
      success: true,
      data: { contactRequest },
      message: 'Contact request sent successfully. The barber will get back to you soon.',
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
