import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { Certificate } from '@/lib/pdf/certificate';
import { pdfToBuffer } from '@/lib/pdf/render';

export const runtime = 'nodejs';

/**
 * GET /api/barbers/credentials/certificate.pdf
 *
 * On-demand "Certificate of Selection" PDF. Different copy + tier label for
 * Founding Members (one of the inaugural ten) vs standard Verified Pros.
 *
 * Certificate number is deterministic from the barber profile id so that the
 * same barber always gets the same number on every download.
 */
async function getCertificatePdfHandler(request: AuthRequest) {
  try {
    const barber = await prisma.barberProfile.findFirst({
      where: { userId: request.userId! },
      select: {
        id: true,
        slug: true,
        displayName: true,
        verificationStatus: true,
        foundingMember: true,
        verifiedAt: true,
      },
    });

    if (!barber) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found.');
    }
    if (barber.verificationStatus !== 'approved') {
      throw new ApiError(
        403,
        'NOT_VERIFIED',
        'Certificates are issued only to approved barbers.',
      );
    }
    if (!barber.verifiedAt) {
      throw new ApiError(
        500,
        'MISSING_VERIFIED_AT',
        'Verification date is missing — contact support.',
      );
    }

    // Certificate number: short, stable, human-readable.
    const idPart = barber.id.split('-')[0].toUpperCase();
    const certificateNumber = barber.foundingMember ? `CBR-FM-${idPart}` : `CBR-VP-${idPart}`;

    const pdf = await pdfToBuffer(
      Certificate({
        displayName: barber.displayName,
        isFoundingMember: barber.foundingMember,
        verifiedAt: barber.verifiedAt,
        certificateNumber,
      }),
    );

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cbr-certificate-${barber.slug}.pdf"`,
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getCertificatePdfHandler, {
  requiredRole: 'barber',
  skipCsrf: true,
});
