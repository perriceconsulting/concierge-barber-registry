import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createContactRequestSchema } from '@/lib/validations/review';
import { ApiError, handleApiError } from '@/lib/api/errors';

// POST /api/contact - Submit a contact request (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createContactRequestSchema.parse(body);

    // Check if barber profile exists
    const barberProfile = await prisma.barberProfile.findUnique({
      where: { id: validatedData.barberProfileId },
    });

    if (!barberProfile) {
      throw new ApiError('Barber profile not found', 404);
    }

    if (barberProfile.verificationStatus !== 'approved') {
      throw new ApiError('This barber is not currently accepting requests', 400);
    }

    // Get client user ID if authenticated (optional)
    const authHeader = request.headers.get('authorization');
    let clientUserId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      // TODO: Decode JWT to get user ID
      // For now, we'll leave it as null for unauthenticated users
    }

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
