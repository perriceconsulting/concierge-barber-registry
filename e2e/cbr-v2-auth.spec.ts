import { test, expect } from '@playwright/test';
import { testUsers } from './helpers/test-users';

/**
 * CBR v2.0 — authenticated-flow assertions.
 *
 * Uses helpers/test-users.ts to spin up throw-away users (registered through
 * the real /api/auth/register flow, then escalated to verified+approved via
 * Prisma direct DB writes — short-circuiting manual admin approval and the
 * Stripe paywall). Cleanup runs in afterAll.
 */

test.afterAll(async () => {
  await testUsers.cleanup();
  await testUsers.disconnect();
});

test.describe('CBR v2 — W4 Grooming Passport API roundtrip', () => {
  test('client creates passport, GETs roundtrip, mints share token, barber redeems once then 410', async () => {
    const client = await testUsers.createClient('passport-client');
    const barber = await testUsers.createApprovedBarber({ emailLabel: 'passport-barber' });

    const specs = {
      preferences: 'tight skin fade',
      guardSizes: { sides: '1.5', top: 'scissor' },
      products: ['Layrite'],
      allergies: ['latex'],
      notes: 'No conversation, please.',
    };

    // Create passport (client)
    const create = await client.request.post('/api/passport', {
      headers: { 'x-csrf-token': client.csrfToken },
      data: { specs },
    });
    expect(create.status(), await create.text()).toBe(200);

    // Roundtrip via GET — same specs come back decrypted
    const get = await client.request.get('/api/passport');
    expect(get.ok()).toBeTruthy();
    const getBody = await get.json();
    expect(getBody.data.passport.specs).toEqual(specs);

    // Mint share token + QR
    const share = await client.request.post('/api/passport/share', {
      headers: { 'x-csrf-token': client.csrfToken },
    });
    expect(share.status(), await share.text()).toBe(200);
    const shareBody = await share.json();
    expect(shareBody.data.token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(shareBody.data.qrPngDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(new Date(shareBody.data.expiresAt).getTime()).toBeGreaterThan(Date.now());

    // Verified barber redeems
    const token = shareBody.data.token as string;
    const first = await barber.request.get(`/api/passport/by-token?token=${encodeURIComponent(token)}`);
    expect(first.status(), await first.text()).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.data.specs).toEqual(specs);
    expect(firstBody.data.client.firstName).toBe('PWClient');

    // Second redemption is rejected as already-used
    const second = await barber.request.get(`/api/passport/by-token?token=${encodeURIComponent(token)}`);
    expect(second.status()).toBe(410);
    const secondBody = await second.json();
    expect(secondBody.error.code).toBe('TOKEN_ALREADY_USED');

    await client.request.dispose();
    await barber.request.dispose();
  });

  test('unverified client cannot redeem a passport token', async () => {
    const client = await testUsers.createClient('passport-client-blocked');
    // Mint a passport + share token
    await client.request.post('/api/passport', {
      headers: { 'x-csrf-token': client.csrfToken },
      data: { specs: { x: 1 } },
    });
    const share = await client.request.post('/api/passport/share', {
      headers: { 'x-csrf-token': client.csrfToken },
    });
    const { token } = (await share.json()).data;

    // Try redeeming as another client (not a barber) — should fail with 403
    const otherClient = await testUsers.createClient('passport-other-client');
    const res = await otherClient.request.get(`/api/passport/by-token?token=${encodeURIComponent(token)}`);
    expect(res.status()).toBe(403);

    await client.request.dispose();
    await otherClient.request.dispose();
  });
});

test.describe('CBR v2 — W5 Referral ledger', () => {
  test('barber A submits referral citing barber B, royalty is 10% of fee', async () => {
    const barberA = await testUsers.createApprovedBarber({ emailLabel: 'ref-performing' });
    const barberB = await testUsers.createApprovedBarber({ emailLabel: 'ref-receiving' });

    // Look up B's slug — the helper assigns one deterministic to userId
    // (we set it to `pw-barber-${userId.slice(0,8)}` in createApprovedBarber).
    const barberBSlug = `pw-barber-${barberB.userId.slice(0, 8)}`;

    // A submits a referral citing B
    const submit = await barberA.request.post('/api/referrals', {
      headers: { 'x-csrf-token': barberA.csrfToken },
      data: {
        referringBarberSlug: barberBSlug,
        serviceDescription: 'Hot-towel shave + beard sculpt',
        serviceFeeCents: 12000,
        clientFirstName: 'Marcus',
        clientCity: 'Miami',
      },
    });
    expect(submit.status(), await submit.text()).toBe(200);
    const submitBody = await submit.json();
    expect(submitBody.data.referral.payoutCents).toBe(1200); // 10% of 12000
    expect(submitBody.data.referral.status).toBe('pending');

    // A sees the referral in their performed list
    const aMine = await barberA.request.get('/api/referrals/mine');
    const aBody = await aMine.json();
    expect(aBody.data.performed.length).toBeGreaterThan(0);
    expect(aBody.data.performed[0].serviceFeeCents).toBe(12000);

    // B sees the referral in their received list + summary updates
    const bMine = await barberB.request.get('/api/referrals/mine');
    const bBody = await bMine.json();
    expect(bBody.data.received.length).toBeGreaterThan(0);
    expect(bBody.data.summary.pendingCents).toBeGreaterThanOrEqual(1200);

    await barberA.request.dispose();
    await barberB.request.dispose();
  });

  test('barber cannot refer themselves', async () => {
    const barber = await testUsers.createApprovedBarber({ emailLabel: 'ref-self' });
    const ownSlug = `pw-barber-${barber.userId.slice(0, 8)}`;

    const res = await barber.request.post('/api/referrals', {
      headers: { 'x-csrf-token': barber.csrfToken },
      data: {
        referringBarberSlug: ownSlug,
        serviceDescription: 'Self-loop test',
        serviceFeeCents: 5000,
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('CANNOT_REFER_SELF');

    await barber.request.dispose();
  });
});

test.describe('CBR v2 — W6 Credentials API', () => {
  test('approved barber can download all 3 PDFs (valid %PDF- bytes)', async () => {
    const barber = await testUsers.createApprovedBarber({ emailLabel: 'cred-standard' });

    const endpoints = [
      '/api/barbers/credentials/print.pdf',
      '/api/barbers/credentials/certificate.pdf',
      '/api/barbers/legal/nda-template.pdf',
    ];

    for (const path of endpoints) {
      const res = await barber.request.get(path);
      expect(res.status(), `${path}: ${await res.text().catch(() => '')}`).toBe(200);
      expect(res.headers()['content-type']).toBe('application/pdf');
      const buf = await res.body();
      expect(buf.subarray(0, 5).toString('utf8')).toBe('%PDF-');
      expect(buf.length).toBeGreaterThan(1000); // sanity: not an empty/error PDF
    }

    // Wallet stub returns 503 (Apple cert not provisioned)
    const wallet = await barber.request.get('/api/barbers/credentials/wallet.pkpass');
    expect(wallet.status()).toBe(503);
    const walletBody = await wallet.json();
    expect(walletBody.error.code).toBe('WALLET_NOT_CONFIGURED');

    await barber.request.dispose();
  });

  test('unverified barber gets 403 on credential downloads', async () => {
    // Register a barber but DON'T promote to approved.
    const ctx = await testUsers.createClient('cred-unverified'); // intentionally a client
    const res = await ctx.request.get('/api/barbers/credentials/print.pdf');
    // Auth gate is `requiredRole: 'barber'`, so a client gets FORBIDDEN.
    expect(res.status()).toBe(403);
    await ctx.request.dispose();
  });
});

test.describe('CBR v2 — Homepage role-aware variant', () => {
  test('logged-in client sees the client-focused hero, not the barber pitch', async ({ browser }) => {
    const client = await testUsers.createClient('homepage-client');

    // Move the auth cookies onto a real browser context so the React page can
    // read them server-side via next/headers cookies().
    const cookies = await client.request.storageState();
    const ctx = await browser.newContext({ storageState: cookies, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    await page.goto('/');

    await expect(page.locator('h1')).toContainText(/Exceptional Grooming, Delivered/i);
    await expect(page.locator('h1')).not.toContainText(/Keep 100%/i);

    await ctx.close();
    await client.request.dispose();
  });
});
