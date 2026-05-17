import { NextResponse } from 'next/server';
import { withAuth, AuthRequest } from '@/lib/api/middleware';
import { handleApiError } from '@/lib/api/errors';

export const runtime = 'nodejs';

/**
 * GET /api/barbers/credentials/wallet.pkpass
 *
 * Apple Wallet `.pkpass` for the authenticated approved barber.
 *
 * NOT YET IMPLEMENTED — requires:
 *  1. Apple Developer account + Pass Type ID certificate (paid)
 *  2. WWDR intermediate certificate
 *  3. Pass signing private key
 *  4. `passkit-generator` dep
 *  5. Env: APPLE_PASS_TYPE_ID, APPLE_PASS_TEAM_ID, APPLE_PASS_CERT_PEM,
 *     APPLE_PASS_KEY_PEM, APPLE_PASS_WWDR_PEM
 *
 * Until those are configured, this route returns a clear 503 so the
 * dashboard "Add to Apple Wallet" button can disable itself gracefully.
 *
 * The print-PDF + on-screen credential are fully functional in the meantime.
 */
async function getWalletPassHandler(_request: AuthRequest) {
  try {
    const hasCert =
      !!process.env.APPLE_PASS_TYPE_ID &&
      !!process.env.APPLE_PASS_CERT_PEM &&
      !!process.env.APPLE_PASS_KEY_PEM;

    if (!hasCert) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WALLET_NOT_CONFIGURED',
            message:
              'Apple Wallet pass generation is not yet enabled on this environment. Use the printable PDF in the meantime.',
          },
        },
        { status: 503 },
      );
    }

    // When Apple cert is provisioned, swap this for the passkit-generator flow.
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'WALLET_NOT_IMPLEMENTED',
          message: 'Wallet pass generator not yet wired — coming in a follow-up.',
        },
      },
      { status: 501 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getWalletPassHandler, {
  requiredRole: 'barber',
  skipCsrf: true,
});
