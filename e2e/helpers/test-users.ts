/**
 * Playwright test-user fixture for CBR v2 auth flows.
 *
 * Creates throw-away users via the real /api/auth/register endpoint (so the
 * full session/cookie/CSRF dance is exercised), then escalates barbers to
 * `verification_status='approved'` directly via Prisma — bypassing manual admin
 * approval so tests can drive the post-verification surface.
 *
 * Usage:
 *   const ctx = await testUsers.createApprovedBarber(request);
 *   ctx.request.get('/api/barbers/credentials/print.pdf');  // already authed
 *
 * Cleanup happens via testUsers.cleanup() in afterAll — deletes by email
 * pattern `pw-test-*@cbr.test` so we don't accidentally drop real records.
 */

import { APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { loadEnvConfig } from '@next/env';

// Playwright's test process doesn't auto-load .env / .env.local — Next.js does
// that for the dev server, but Prisma here runs in a separate process. Load
// the same env hierarchy Next uses so DATABASE_URL is set before we
// instantiate PrismaClient.
loadEnvConfig(process.cwd());

// One Prisma instance per test process. Reusing across tests keeps the
// connection pool tame.
let _prisma: PrismaClient | null = null;
function prisma() {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

const TEST_EMAIL_DOMAIN = 'cbr.test';
const TEST_EMAIL_PREFIX = 'pw-test';

function uniqueEmail(label: string) {
  // Underscores in the email local part are legal and let us slice on them later.
  return `${TEST_EMAIL_PREFIX}_${label}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@${TEST_EMAIL_DOMAIN}`;
}

export const TEST_PASSWORD = 'PlayWright_Test_42!';

export interface TestUserContext {
  email: string;
  userId: string;
  /** A Playwright APIRequestContext with the user's auth cookies + CSRF token preloaded. */
  request: APIRequestContext;
  /** Send the same csrfToken when crafting custom secureFetch-style calls. */
  csrfToken: string;
  /** Defined for barbers; null for clients. */
  barberProfileId: string | null;
}

async function fetchCsrfToken(request: APIRequestContext): Promise<string> {
  const res = await request.get('/api/csrf-token');
  if (!res.ok()) {
    throw new Error(`Failed to fetch CSRF token: HTTP ${res.status()}`);
  }
  const body = await res.json();
  const token = body?.data?.csrfToken;
  if (!token) {
    throw new Error('CSRF token endpoint returned an unexpected payload');
  }
  return token;
}

async function registerUser(opts: {
  role: 'client' | 'barber';
  firstName: string;
  lastName?: string;
  emailLabel: string;
  /** If set, after register this user's role gets escalated to this value via direct DB update. */
  escalateRoleTo?: 'admin' | 'hnwi';
}): Promise<TestUserContext> {
  const email = uniqueEmail(opts.emailLabel);
  // Fresh request context so cookies don't bleed across tests.
  const request = await playwrightRequest.newContext({
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://localhost:3000',
    ignoreHTTPSErrors: true,
  });

  const csrfToken = await fetchCsrfToken(request);

  const res = await request.post('/api/auth/register', {
    headers: { 'x-csrf-token': csrfToken },
    data: {
      email,
      password: TEST_PASSWORD,
      firstName: opts.firstName,
      lastName: opts.lastName ?? 'Test',
      role: opts.role,
      agreedToTerms: true,
    },
  });

  if (!res.ok()) {
    const text = await res.text().catch(() => '');
    await request.dispose();
    throw new Error(`register failed (HTTP ${res.status()}): ${text}`);
  }

  const body = await res.json();
  const userId = body?.data?.user?.id ?? body?.data?.id;
  if (!userId) {
    await request.dispose();
    throw new Error('register response missing user id');
  }

  // Optional role escalation — register only allows 'client' / 'barber', so
  // for 'admin' / 'hnwi' tests we register as a client then UPDATE the role
  // directly. The session cookie was already issued under 'client' role; the
  // user's new role takes effect on next token refresh, so we force a refresh
  // before returning.
  if (opts.escalateRoleTo) {
    await prisma().user.update({
      where: { id: userId },
      data: { role: opts.escalateRoleTo },
    });
    // Hit the refresh endpoint so the access token cookie is reissued with
    // the new role embedded in the JWT payload.
    const refreshRes = await request.post('/api/auth/refresh', {
      headers: { 'x-csrf-token': csrfToken },
    });
    if (!refreshRes.ok()) {
      const text = await refreshRes.text().catch(() => '');
      await request.dispose();
      throw new Error(`token refresh after role escalation failed (HTTP ${refreshRes.status()}): ${text}`);
    }
  }

  return { email, userId, request, csrfToken, barberProfileId: null };
}

/**
 * Create a fresh client user. Returns an authenticated APIRequestContext.
 */
async function createClient(emailLabel = 'client'): Promise<TestUserContext> {
  return registerUser({ role: 'client', firstName: 'PWClient', emailLabel });
}

/**
 * Create a fresh admin user. Registers as a client and then escalates to admin
 * via direct DB update + token refresh.
 */
async function createAdmin(emailLabel = 'admin'): Promise<TestUserContext> {
  return registerUser({
    role: 'client',
    firstName: 'PWAdmin',
    emailLabel,
    escalateRoleTo: 'admin',
  });
}

/**
 * Create a fresh barber user, then directly create their BarberProfile in the
 * "approved + setup-fee paid" state — short-circuiting both the manual admin
 * approval and the Stripe paywall.
 *
 * Returns the same context shape as createClient, with `barberProfileId` set.
 */
async function createApprovedBarber(opts?: {
  emailLabel?: string;
  city?: string;
  state?: string;
  foundingMember?: boolean;
}): Promise<TestUserContext> {
  const ctx = await registerUser({
    role: 'barber',
    firstName: 'PWBarber',
    emailLabel: opts?.emailLabel ?? 'barber',
  });

  // Build a unique slug — collisions across parallel tests would 500 the test.
  const slug = `pw-barber-${ctx.userId.slice(0, 8)}`;

  const profile = await prisma().barberProfile.create({
    data: {
      userId: ctx.userId,
      displayName: `PW Barber ${ctx.userId.slice(0, 6)}`,
      slug,
      city: opts?.city ?? 'Newark',
      state: opts?.state ?? 'NJ',
      zipCode: '07102',
      verificationStatus: 'approved',
      verifiedAt: new Date(),
      // Approved barbers always have a license on file in real life — without
      // these, the dashboard renders a "license required" banner even though
      // status='approved', which trips UI tests asserting the verified state.
      licenseNumber: 'NJ-PW-TEST',
      licenseState: 'NJ',
      licenseExpirationDate: new Date('2030-01-01'),
      licenseDocumentUrl: 'https://example.test/pw-fake-license.pdf',
      licenseVerified: true,
      setupFeePaidAt: new Date(),
      setupFeeAmountCents: 9900,
      foundingMember: opts?.foundingMember ?? false,
    },
    select: { id: true },
  });

  return { ...ctx, barberProfileId: profile.id };
}

/**
 * Delete every test record whose email matches the test prefix, plus their
 * cascaded barber_profiles, subscriptions, audit_log entries, etc. Safe to
 * call on a clean DB — it's a no-op if nothing matches.
 */
async function cleanup() {
  const result = await prisma().user.deleteMany({
    where: { email: { startsWith: `${TEST_EMAIL_PREFIX}_`, endsWith: `@${TEST_EMAIL_DOMAIN}` } },
  });
  if (process.env.PWDEBUG) {
    // Helpful when running individual tests interactively.
    // eslint-disable-next-line no-console
    console.log(`[test-users] cleanup deleted ${result.count} user(s)`);
  }
}

async function disconnect() {
  if (_prisma) {
    await _prisma.$disconnect();
    _prisma = null;
  }
}

export const testUsers = {
  createClient,
  createApprovedBarber,
  createAdmin,
  cleanup,
  disconnect,
};
