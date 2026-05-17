import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';
import { NdaTemplate } from '@/lib/pdf/nda';
import { pdfToBuffer } from '@/lib/pdf/render';

export const runtime = 'nodejs';

/**
 * GET /api/barbers/legal/nda-template.pdf
 *
 * Downloads the Concierge Professional Privacy Agreement as a printable PDF.
 * If we know the barber's display name, pre-fill it on the signature line —
 * otherwise return a blank template.
 *
 * Open to all authenticated barbers (not just approved) — they may want to
 * preview the NDA before completing verification.
 */
async function getNdaPdfHandler(request: AuthRequest) {
  try {
    const barber = await prisma.barberProfile.findFirst({
      where: { userId: request.userId! },
      select: { displayName: true, slug: true },
    });

    const pdf = await pdfToBuffer(
      NdaTemplate({ professionalName: barber?.displayName ?? null }),
    );

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cbr-privacy-agreement${barber?.slug ? `-${barber.slug}` : ''}.pdf"`,
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getNdaPdfHandler, {
  requiredRole: 'barber',
  skipCsrf: true,
});
