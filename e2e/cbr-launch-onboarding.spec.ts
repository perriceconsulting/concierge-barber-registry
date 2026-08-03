import { test, expect } from '@playwright/test';
import { testUsers } from './helpers/test-users';

/**
 * Launch-critical barber onboarding UI flow.
 *
 * Drives the post-registration journey a brand-new barber takes through their
 * dashboard, all the way to "Pay Setup Fee" leading to a Stripe Checkout URL.
 * The Stripe-side hosted UI cannot be driven from Playwright (different
 * domain), so we stop at the boundary — verifying the redirect target is a
 * checkout.stripe.com URL is the strongest UI-side assertion we can make
 * before handing off to Stripe.
 *
 * The end-to-end paywall completion (webhook + admin approve + trial sub
 * creation) is already covered in cbr-v2-payments.spec.ts.
 */

test.afterAll(async () => {
  await testUsers.cleanup();
  await testUsers.disconnect();
});

async function newBarberDashboardPage(browser: import('@playwright/test').Browser) {
  // Use testUsers helper to register (skips the registration UI which is
  // tested separately in cbr-launch-auth.spec.ts). We get an authed APIRequest
  // context, then promote it to a real browser page so we can drive the UI.
  const ctx = await testUsers.createApprovedBarber({ emailLabel: 'onboarding' });
  // Reset to "pre-paywall, pre-license" state so we test from the beginning
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.barberProfile.update({
    where: { id: ctx.barberProfileId! },
    data: {
      verificationStatus: 'pending',
      verifiedAt: null,
      licenseDocumentUrl: null,
      licenseNumber: null,
      licenseState: null,
      licenseExpirationDate: null,
      setupFeePaidAt: null,
      submittedForVerificationAt: null,
    },
  });
  await prisma.$disconnect();

  const storage = await ctx.request.storageState();
  const browserCtx = await browser.newContext({ storageState: storage, ignoreHTTPSErrors: true });
  const page = await browserCtx.newPage();
  return { page, browserCtx, ctx };
}

test.describe('Launch — barber onboarding dashboard', () => {
  test('fresh barber sees the verify-email + license + profile notification banners', async ({ browser }) => {
    const { page, browserCtx, ctx } = await newBarberDashboardPage(browser);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Banners that should appear for a brand-new unverified barber
    await expect(page.locator('body').getByText(/verify your email/i).first()).toBeVisible();
    await expect(page.locator('body').getByText(/license document required/i).first()).toBeVisible();

    await browserCtx.close();
    await ctx.request.dispose();
  });

  test('barber sees the SetupFeeCard with Pay Setup Fee CTA + Founding Member context', async ({ browser }) => {
    const { page, browserCtx, ctx } = await newBarberDashboardPage(browser);
    await page.goto('/dashboard/profile');
    await page.waitForLoadState('networkidle');

    // The SetupFeeCard renders inside the profile page when fee is unpaid.
    // Card title + button — no dollar amount shown on the card (intro vs
    // standard tier is resolved at checkout, not at page render).
    await expect(page.locator('body').getByText(/Verification Setup Fee Required/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByRole('button', { name: /^pay setup fee$/i }).first(),
    ).toBeVisible();
    // Card mentions Founding Member context in the body copy
    await expect(page.locator('body').getByText(/founding member/i).first()).toBeVisible();

    await browserCtx.close();
    await ctx.request.dispose();
  });

  test('clicking Pay Setup Fee triggers redirect to checkout.stripe.com', async ({ browser }) => {
    const { page, browserCtx, ctx } = await newBarberDashboardPage(browser);
    await page.goto('/dashboard/profile');
    await page.waitForLoadState('networkidle');

    // The handler does window.location.href = stripeUrl. Capture the
    // resulting navigation request rather than waiting for full load
    // (we won't follow into stripe.com).
    const navPromise = page.waitForRequest(
      (req) => req.url().startsWith('https://checkout.stripe.com/'),
      { timeout: 15000 },
    );
    await page.getByRole('button', { name: /^pay setup fee$/i }).first().click();
    const req = await navPromise;
    expect(req.url()).toMatch(/^https:\/\/checkout\.stripe\.com\//);

    await browserCtx.close();
    await ctx.request.dispose();
  });

  test('Founding Member sees "exempt" message instead of paywall CTA', async ({ browser }) => {
    const ctx = await testUsers.createApprovedBarber({
      emailLabel: 'onboarding-fm',
      foundingMember: true,
    });
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.barberProfile.update({
      where: { id: ctx.barberProfileId! },
      data: {
        verificationStatus: 'pending',
        verifiedAt: null,
        setupFeePaidAt: null,
      },
    });
    await prisma.$disconnect();

    const storage = await ctx.request.storageState();
    const browserCtx = await browser.newContext({ storageState: storage, ignoreHTTPSErrors: true });
    const page = await browserCtx.newPage();
    await page.goto('/dashboard/profile');
    await page.waitForLoadState('networkidle');

    // Founding Members shouldn't see the Pay button — they bypass the paywall
    await expect(
      page.getByRole('button', { name: /pay verification fee|pay setup fee/i }),
    ).toHaveCount(0);
    // They SHOULD see Founding Member status / exemption messaging
    await expect(page.locator('body').getByText(/founding member/i).first()).toBeVisible();

    await browserCtx.close();
    await ctx.request.dispose();
  });

  test('after setup fee paid + license uploaded + admin-approved, dashboard shows Verified state', async ({
    browser,
  }) => {
    // Pre-stage: a barber who has completed every step + been admin-approved
    const ctx = await testUsers.createApprovedBarber({ emailLabel: 'onboarding-done' });

    const storage = await ctx.request.storageState();
    const browserCtx = await browser.newContext({ storageState: storage, ignoreHTTPSErrors: true });
    const page = await browserCtx.newPage();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // "Profile is live!" notification should be visible for approved barbers
    await expect(page.locator('body').getByText(/profile is live/i).first()).toBeVisible();
    // The license-required banner should NOT appear
    await expect(page.locator('body').getByText(/license document required/i)).toHaveCount(0);

    await browserCtx.close();
    await ctx.request.dispose();
  });
});
