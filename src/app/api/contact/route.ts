import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createContactRequestSchema } from '@/lib/validations/review';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { rateLimiters } from '@/lib/api/rate-limit';
import { verifyCsrfToken } from '@/lib/api/csrf';
import { optionalAuth } from '@/lib/api/middleware';
import { sendContactRequestEmail } from '@/lib/email';

// POST /api/contact - Submit a contact request (public endpoint with optional auth)
export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token to prevent CSRF attacks
    verifyCsrfToken(request);

    // Apply rate limiting (5 requests per hour)
    await rateLimiters.contact(request);

    const body = await request.json();
    const validatedData = createContactRequestSchema.parse(body);

    // Check if barber profile exists and get barber user info
    const barberProfile = await prisma.barberProfile.findUnique({
      where: { id: validatedData.barberProfileId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
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

    // Send email notification to barber (fire and forget)
    sendContactRequestEmail(barberProfile.user.email, barberProfile.user.firstName, {
      clientName: contactRequest.clientName,
      clientEmail: contactRequest.clientEmail,
      clientPhone: contactRequest.clientPhone,
      message: contactRequest.message,
      serviceInterested: contactRequest.serviceInterested,
      preferredDate: contactRequest.preferredDate,
      preferredTime: contactRequest.preferredTime,
    })
      .then((result) => {
        if (result.success) {
          console.log(`✅ Contact request email sent to ${barberProfile.user.email}`);
        } else {
          console.error(`❌ Failed to send contact request email to ${barberProfile.user.email}:`, result.message || result.error);
        }
      })
      .catch((error) => console.error(`❌ Error sending contact request email:`, error));

    return NextResponse.json({
      success: true,
      data: { contactRequest },
      message: 'Contact request sent successfully. The barber will get back to you soon.',
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
