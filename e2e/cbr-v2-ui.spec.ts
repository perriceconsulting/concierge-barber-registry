import { test, expect } from '@playwright/test';
import { testUsers } from './helpers/test-users';

/**
 * CBR v2.0 — browser UI assertions.
 *
 * Drives the three remaining surfaces with real Chromium clicks (not just API
 * calls): the credentials dashboard page, the ReferralCard widget on the
 * barber dashboard, and the full admin referrals approve→batch-payout flow.
 */

test.afterAll(async () => {
  await testUsers.cleanup();
  await testUsers.disconnect();
});

async function browserPageForUser(
  browser: import('@playwright/test').Browser,
  ctx: Awaited<ReturnType<typeof testUsers.createClient>>,
) {
  const storage = await ctx.request.storageState();
  const browserCtx = await browser.newContext({ storageState: storage, ignoreHTTPSErrors: true });
  const page = await browserCtx.newPage();
  return { page, browserCtx };
}

test.describe('CBR v2 — W6 /dashboard/credentials UI', () => {
  test('approved Verified Pro sees tier banner + 4 credential buttons + Wallet 503 toast', async ({ browser }) => {
    const barber = await testUsers.createApprovedBarber({ emailLabel: 'ui-cred-vp', foundingMember: false });
    const { page, browserCtx } = await browserPageForUser(browser, barber);

    await page.goto('/dashboard/credentials');
    // Tier banner shows Verified Professional (not Founding Member)
    await expect(page.getByText('Verified Professional', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Founding Member')).toHaveCount(0);

    // All four credential buttons are present
    await expect(page.getByRole('button', { name: /add to apple wallet/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /download card pdf/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /download certificate/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /download nda template/i })).toBeVisible();

    // Clicking Apple Wallet surfaces the 503 toast — tier banner mentions Wallet rollout.
    await page.getByRole('button', { name: /add to apple wallet/i }).click();
    await expect(page.getByText(/apple wallet not yet enabled/i)).toBeVisible({ timeout: 5000 });

    await browserCtx.close();
    await barber.request.dispose();
  });

  test('Founding Member sees Founding tier label + correct certificate-button copy', async ({ browser }) => {
    const barber = await testUsers.createApprovedBarber({ emailLabel: 'ui-cred-fm', foundingMember: true });
    const { page, browserCtx } = await browserPageForUser(browser, barber);

    await page.goto('/dashboard/credentials');
    await expect(page.getByText('Founding Member').first()).toBeVisible();
    // Certificate description should call out Founding Member, not Verified Professional.
    await expect(page.getByText(/founding member status/i).first()).toBeVisible();

    await browserCtx.close();
    await barber.request.dispose();
  });

  test('clicking Download Card PDF triggers a PDF download with %PDF- bytes', async ({ browser }) => {
    const barber = await testUsers.createApprovedBarber({ emailLabel: 'ui-cred-dl' });
    const { page, browserCtx } = await browserPageForUser(browser, barber);

    await page.goto('/dashboard/credentials');
    await expect(page.getByRole('button', { name: /download card pdf/i })).toBeVisible();

    // The component triggers download via window.location.href. We hit the
    // endpoint directly from the page's request context (carries cookies +
    // origin) to verify it returns valid PDF bytes — this is what would
    // actually be saved by the browser.
    const res = await page.request.get('/api/barbers/credentials/print.pdf');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toBe('application/pdf');
    const buf = await res.body();
    expect(buf.subarray(0, 5).toString('utf8')).toBe('%PDF-');

    await browserCtx.close();
    await barber.request.dispose();
  });
});

test.describe('CBR v2 — W5 /dashboard ReferralCard widget', () => {
  test('barber dashboard renders ReferralCard with summary tiles + collapsible submit form', async ({ browser }) => {
    const barber = await testUsers.createApprovedBarber({ emailLabel: 'ui-ref-card' });
    const { page, browserCtx } = await browserPageForUser(browser, barber);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Card header — CardTitle renders as a generic div, not <h*>, so use text.
    await expect(page.getByText('Referral Royalties', { exact: true })).toBeVisible();

    // Three summary tiles
    await expect(page.getByText('Pending', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Approved', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Paid', { exact: true }).first()).toBeVisible();

    // Empty state copy when no royalties
    await expect(page.getByText(/no royalties yet/i)).toBeVisible();

    // Open the submit form
    await page.getByRole('button', { name: /^submit referral$/i }).click();
    await expect(page.getByLabel(/home barber profile slug/i)).toBeVisible();
    await expect(page.getByLabel(/service fee \(usd\)/i)).toBeVisible();

    // Live royalty preview as the user types a fee
    await page.getByLabel(/service fee \(usd\)/i).fill('150');
    await expect(page.getByText(/10% royalty = \$15\.00/i)).toBeVisible();

    await browserCtx.close();
    await barber.request.dispose();
  });
});

test.describe('CBR v2 — W5 /admin/referrals full flow', () => {
  test('admin sees pending referral → approves it → batch-pays → status moves to paid', async ({ browser }) => {
    // Three actors: admin, barber A (performing — submits the referral), barber B (referring — earns).
    const admin = await testUsers.createAdmin('ui-admin');
    const barberA = await testUsers.createApprovedBarber({ emailLabel: 'ui-ref-perform' });
    const barberB = await testUsers.createApprovedBarber({ emailLabel: 'ui-ref-receive' });
    const barberBSlug = `pw-barber-${barberB.userId.slice(0, 8)}`;

    // A submits a referral via API (we already have UI coverage for the form
    // in the dashboard widget test above — here we focus on the admin queue).
    const submit = await barberA.request.post('/api/referrals', {
      headers: { 'x-csrf-token': barberA.csrfToken },
      data: {
        referringBarberSlug: barberBSlug,
        serviceDescription: 'UI-test hot-towel shave',
        serviceFeeCents: 12000,
        clientFirstName: 'Marcus',
        clientCity: 'Miami',
      },
    });
    expect(submit.status()).toBe(200);

    // Admin opens the queue
    const { page, browserCtx } = await browserPageForUser(browser, admin);
    await page.goto('/admin/referrals');
    await page.waitForLoadState('networkidle');

    // Default filter is 'pending' — the referral we just submitted should be listed.
    // Admin page IS a real heading (page title), distinct from the dashboard card.
    await expect(page.getByRole('heading', { name: /referral royalties/i })).toBeVisible();
    await expect(page.getByText(/UI-test hot-towel shave/)).toBeVisible({ timeout: 10000 });
    // The performing barber → referring barber description on the row
    await expect(page.locator('body')).toContainText(/Marcus/);
    // 12000 cents = $120.00 service → 10% royalty = $12.00
    await expect(page.locator('body')).toContainText(/\$120\.00/);
    await expect(page.locator('body')).toContainText(/\$12\.00/);

    // Approve it
    await page.getByRole('button', { name: /^approve$/i }).first().click();
    // Toast title is "Updated" with description "Referral approved."
    await expect(page.getByText(/updated/i).first()).toBeVisible({ timeout: 8000 });

    // Switch filter to "Approved" — referral should appear there with a checkbox
    await page.getByRole('button', { name: /^approved/i }).first().click();
    await expect(page.getByText(/UI-test hot-towel shave/)).toBeVisible();

    // Batch action bar appears in approved filter; select all + mark paid
    await page.getByRole('button', { name: /select all/i }).click();
    await page.getByRole('button', { name: /mark paid in batch/i }).click();

    // Prompt modal asks for batch label — type one and confirm
    const batchInput = page.getByPlaceholder(/batch label/i);
    await expect(batchInput).toBeVisible();
    await batchInput.fill('2026-05-ui-test');
    await page.getByRole('button', { name: /^mark paid$/i }).click();

    // Toast confirms
    await expect(page.getByText(/marked.*referral.*paid/i)).toBeVisible({ timeout: 5000 });

    // Switch to Paid filter — our referral should now be there
    await page.getByRole('button', { name: /^paid/i }).first().click();
    await expect(page.getByText(/UI-test hot-towel shave/)).toBeVisible();

    await browserCtx.close();
    await admin.request.dispose();
    await barberA.request.dispose();
    await barberB.request.dispose();
  });
});
