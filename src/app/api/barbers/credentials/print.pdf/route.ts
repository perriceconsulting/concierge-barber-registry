import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { prisma } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { CredentialCard } from '@/lib/pdf/credential-card';
import { pdfToBuffer } from '@/lib/pdf/render';
import { APP_CONFIG } from '@/config';

export const runtime = 'nodejs';

/**
 * GET /api/barbers/credentials/print.pdf
 *
 * Print-ready business-card PDF for an approved barber. Front: brand monogram,
 * name, shop, verified/founding badge, QR linking to public profile.
 * Back: brand statement + URL.
 *
 * Used as input to a third-party card vendor; nothing magical happens here.
 */
async function getPrintPdfHandler(request: AuthRequest) {
  try {
    const barber = await prisma.barberProfile.findFirst({
      where: { userId: request.userId! },
      select: {
        id: true,
        slug: true,
        displayName: true,
        shopName: true,
        city: true,
        state: true,
        verificationStatus: true,
        foundingMember: true,
      },
    });

    if (!barber) {
      throw new ApiError(404, 'NOT_FOUND', 'Barber profile not found.');
    }
    if (barber.verificationStatus !== 'approved') {
      throw new ApiError(
        403,
        'NOT_VERIFIED',
        'Credentials are issued only to approved barbers.',
      );
    }

    const appUrl = APP_CONFIG.url;
    const publicUrl = `${appUrl}/barbers/${barber.slug}`;

    const qrPngDataUrl = await QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 280,
      color: { dark: '#0D0D0D', light: '#F5F5F5' },
    });

    const pdf = await pdfToBuffer(
      CredentialCard({
        displayName: barber.displayName,
        shopName: barber.shopName,
        city: barber.city,
        state: barber.state,
        isFoundingMember: barber.foundingMember,
        publicUrl,
        qrPngDataUrl,
      }),
    );

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cbr-credential-${barber.slug}.pdf"`,
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getPrintPdfHandler, {
  requiredRole: 'barber',
  skipCsrf: true,
});
