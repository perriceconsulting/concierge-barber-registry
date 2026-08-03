import { test, expect } from '@playwright/test';

/**
 * CBR v2.0 — public-surface assertions.
 *
 * These cover the parts of v2 that don't require an authenticated session:
 *  - Homepage default (barber-first) variant for guests
 *  - New /pro, /client, /black-label landing pages render
 *  - Black Label gating: unauth users redirect to the waitlist form
 *  - Black Label waitlist submission round-trip
 *  - All v2 API endpoints reject unauth callers with 401/403
 *
 * Authenticated flows are in cbr-v2-auth.spec.ts (currently skipped pending a
 * test-user fixture).
 */

test.describe('CBR v2 — Homepage (guest)', () => {
  test('renders the barber-first hero for unauthenticated visitors', async ({ page }) => {
    await page.goto('/');
    // The v2 barber-first headline contains "Keep 100%".
    await expect(page.locator('h1')).toContainText(/Keep 100%/i);
    // And there's a "claim your professional profile" CTA.
    await expect(page.getByRole('button', { name: /claim your professional profile/i }).first()).toBeVisible();
    // Plus the "looking for a barber instead" link to /for-clients (so client-leaning visitors aren't trapped).
    await expect(page.getByRole('link', { name: /find verified pros near you/i })).toBeVisible();
  });
});

test.describe('CBR v2 — New landing pages render', () => {
  test('/pro page loads and shows the v2 pro hero', async ({ page }) => {
    const res = await page.goto('/pro');
    expect(res?.status()).toBeLessThan(400);
    // HERO.pro.headline = "Upgrade Your Career to 'Verified' Status"
    await expect(page.locator('body')).toContainText(/Upgrade Your Career/i);
  });

  test('/client page loads and shows the v2 client hero', async ({ page }) => {
    const res = await page.goto('/client');
    expect(res?.status()).toBeLessThan(400);
    // HERO.client.headline = "Exceptional Grooming, Delivered"
    await expect(page.locator('body')).toContainText(/Exceptional Grooming, Delivered/i);
  });
});

test.describe('CBR v2 — Black Label gating', () => {
  test('/black-label redirects unauth visitors to /black-label/request-access', async ({ page }) => {
    await page.goto('/black-label');
    await expect(page).toHaveURL(/\/black-label\/request-access/);
  });

  test('/black-label/request-access is publicly reachable', async ({ page }) => {
    const res = await page.goto('/black-label/request-access');
    expect(res?.status()).toBeLessThan(400);
    // Form should at minimum collect name + email
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });
});

test.describe('CBR v2 — API auth contract', () => {
  // Confirms every v2 endpoint either gates auth (401) or rejects state-changing
  // requests without CSRF (403). This locks in the contract — if someone
  // accidentally drops a `withAuth(...)` later, this catches it.

  const expectations = [
    // Passport (W4)
    { method: 'GET',  path: '/api/passport',                   accept: [401] },
    { method: 'POST', path: '/api/passport',                   accept: [401, 403], body: { specs: {} } },
    { method: 'POST', path: '/api/passport/share',             accept: [401, 403] },
    { method: 'GET',  path: '/api/passport/by-token?token=xx', accept: [401] },
    // Referrals (W5)
    { method: 'POST', path: '/api/referrals',                  accept: [401, 403], body: {} },
    { method: 'GET',  path: '/api/referrals/mine',             accept: [401] },
    { method: 'GET',  path: '/api/admin/referrals',            accept: [401] },
    { method: 'GET',  path: '/api/admin/referrals/payouts',    accept: [401] },
    // Credentials (W6)
    { method: 'GET',  path: '/api/barbers/credentials/print.pdf',         accept: [401] },
    { method: 'GET',  path: '/api/barbers/credentials/certificate.pdf',   accept: [401] },
    { method: 'GET',  path: '/api/barbers/credentials/wallet.pkpass',     accept: [401] },
    { method: 'GET',  path: '/api/barbers/legal/nda-template.pdf',        accept: [401] },
    // Black Label admin (W7)
    { method: 'GET',  path: '/api/admin/black-label-leads',    accept: [401] },
  ] as const;

  for (const { method, path, accept, body } of expectations) {
    test(`${method} ${path} rejects unauthenticated requests`, async ({ request }) => {
      const res = await request.fetch(path, {
        method,
        ...(body !== undefined && {
          data: body,
          headers: { 'Content-Type': 'application/json' },
        }),
      });
      expect(accept as readonly number[]).toContain(res.status());
    });
  }
});

test.describe('CBR v2 — Black Label waitlist submission', () => {
  test('POST /api/black-label/request-access accepts a valid lead', async ({ request }) => {
    // The waitlist endpoint is public-by-design (no auth) but rate-limited.
    // Use a unique email per run so the unique constraint doesn't trip.
    const email = `playwright-bl-${Date.now()}@cbr.test`;
    const res = await request.post('/api/black-label/request-access', {
      data: {
        fullName: 'Playwright Tester',
        email,
        city: 'Newark',
        notes: 'Submitted by Playwright smoke suite',
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBeLessThan(400);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

test.describe('CBR v2 — Cron auth contract', () => {
  test('GET /api/cron/trial-lifecycle requires bearer token', async ({ request }) => {
    const res = await request.get('/api/cron/trial-lifecycle');
    expect(res.status()).toBe(401);
  });

  test('GET /api/cron/trial-lifecycle rejects wrong bearer', async ({ request }) => {
    const res = await request.get('/api/cron/trial-lifecycle', {
      headers: { Authorization: 'Bearer wrong-secret' },
    });
    expect(res.status()).toBe(401);
  });
});
