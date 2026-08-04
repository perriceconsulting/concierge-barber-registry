import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword, hashToken } from '@/lib/auth/password';
import { generateTokenPair } from '@/lib/auth/jwt';
import { passwordSchema } from '@/lib/validations/auth';
import { handleApiError, successResponse } from '@/lib/api/errors';
import { rateLimiters } from '@/lib/api/rate-limit';
import { verifyCsrfToken } from '@/lib/api/csrf';
import { createLogger } from '@/lib/logger';
import { authCookieOptions } from '@/lib/auth/cookies';

const logger = createLogger('CLAIM');

const ClaimSchema = z.object({
  token: z.string().uuid(),
  email: z.string().email().toLowerCase(),
  password: passwordSchema,
  agreedToTerms: z.boolean().refine((v) => v === true, {
    message: 'You must agree to the terms',
  }),
});

export async function POST(request: NextRequest) {
  try {
    verifyCsrfToken(request);
    await rateLimiters.auth(request);

    const body = await request.json();
    const data = ClaimSchema.parse(body);

    // Look up profile by claim token
    const profile = await prisma.barberProfile.findUnique({
      where: { claimToken: data.token },
      include: { user: true },
    });

    if (!profile) {
      return successResponse({ error: 'invalid_token' }, 404);
    }

    if (profile.claimStatus === 'claimed') {
      return successResponse({ error: 'already_claimed' }, 410);
    }

    // Check whether the chosen email is already used by a different user
    const existingByEmail = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true, isStub: true },
    });

    if (existingByEmail && existingByEmail.id !== profile.userId) {
      return successResponse(
        {
          error: 'email_in_use',
          message:
            'That email is already linked to a different account. Please log in to that account first, or use a different email.',
        },
        409
      );
    }

    const passwordHash = await hashPassword(data.password);

    // Update user: set real email, password, mark as no longer stub, mark verified
    // (email confirmation via magic link is the verification)
    await prisma.user.update({
      where: { id: profile.userId },
      data: {
        email: data.email,
        passwordHash,
        isStub: false,
        emailVerified: true,
        agreedToTermsAt: new Date(),
      },
    });

    // Mark profile as claimed and clear the token
    await prisma.barberProfile.update({
      where: { id: profile.id },
      data: {
        claimStatus: 'claimed',
        claimToken: null,
      },
    });

    // Auto-login: generate tokens + create session
    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: profile.userId },
    });

    const { accessToken, refreshToken } = await generateTokenPair(
      {
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      false
    );

    const refreshTokenHash = await hashToken(refreshToken);
    const sessionDays = 7;
    const sessionExpiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: updatedUser.id,
        refreshTokenHash,
        expiresAt: sessionExpiresAt,
        userAgent: request.headers.get('user-agent'),
        ipAddress:
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      },
    });

    logger.info('Profile claimed', { profileId: profile.id, slug: profile.slug });

    const response = successResponse({
      message: 'Profile claimed successfully',
      redirectTo: '/dashboard',
    });

    response.cookies.set('accessToken', accessToken, authCookieOptions(15 * 60));
    response.cookies.set('refreshToken', refreshToken, authCookieOptions(sessionDays * 24 * 60 * 60));

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
