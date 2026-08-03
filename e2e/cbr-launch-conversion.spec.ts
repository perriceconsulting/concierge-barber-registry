import { test, expect } from '@playwright/test';
import { testUsers } from './helpers/test-users';

/**
 * Launch-critical client conversion flow.
 *
 * The actual money-maker for the directory: a guest visits, searches, opens
 * a barber profile, sends a contact request. If any link in this chain
 * breaks, leads stop flowing → barbers stop signing up → revenue dies.
 */

test.afterAll(async () => {
  await testUsers.cleanup();
  await testUsers.disconnect();
});

test.describe('Launch — search + barber discovery', () => {
  test('/search loads + renders filter UI without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));

    const res = await page.goto('/search');
    expect(res?.status()).toBeLessThan(400);
    // At minimum the page should have a search input or filter
    const hasFilter = await page
      .locator('input[type="search"], input[name*="zip" i], input[placeholder*="search" i], input[placeholder*="zip" i]')
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasFilter, '/search should render a filter input').toBe(true);

    // Only the auth/me 401-style residue is acceptable — anything else is a regression
    const noise = errors.filter(
      (e) => !/Failed to load resource.*401|favicon|manifest/i.test(e),
    );
    expect.soft(noise, JSON.stringify(noise, null, 2)).toEqual([]);
  });

  test('approved barber appears at their public /barbers/[slug] profile', async ({ page }) => {
    const barber = await testUsers.createApprovedBarber({ emailLabel: 'discovery-profile' });
    const slug = `pw-barber-${barber.userId.slice(0, 8)}`;

    const res = await page.goto(`/barbers/${slug}`);
    expect(res?.status()).toBeLessThan(400);
    // Profile should show the display name from the helper
    await expect(page.locator('h1').first()).toContainText(/PW Barber/i);

    await barber.request.dispose();
  });
});

test.describe('Launch — contact request submission', () => {
  test('logged-in client can open contact form, submit, and see success toast + DB row created', async ({
    browser,
  }) => {
    const barber = await testUsers.createApprovedBarber({ emailLabel: 'discovery-contact' });
    const slug = `pw-barber-${barber.userId.slice(0, 8)}`;

    // Contact form requires (a) authenticated session AND (b) client role.
    // Create a fresh client + reuse their auth cookies in a real browser.
    const client = await testUsers.createClient('contact-submitter');
    const storage = await client.request.storageState();
    const ctx = await browser.newContext({ storageState: storage, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    await page.goto(`/barbers/${slug}`);
    await page.waitForLoadState('networkidle');

    // Open the contact form (button label varies — try common ones)
    const openBtn = page
      .getByRole('button', { name: /contact|book|request|message/i })
      .first();
    await openBtn.click();

    // Wait for form to render
    await expect(page.locator('#name')).toBeVisible({ timeout: 5000 });

    // Fill the form — IDs from /barbers/[slug] form handler
    await page.fill('#name', 'Playwright Visitor');
    await page.fill('#email', client.email);
    await page.fill('#phone', '555-555-0123');
    await page.fill('#message', 'Interested in a fade — testing the contact form flow.');

    // Submit
    await page.getByRole('button', { name: /send|submit/i }).first().click();

    // Success toast
    await expect(
      page.locator('body').getByText(/sent|success|thank you|we'll be in touch/i).first(),
    ).toBeVisible({ timeout: 10000 });

    // Verify the DB row
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const row = await prisma.contactRequest.findFirst({
      where: { clientEmail: client.email, barberProfileId: barber.barberProfileId! },
    });
    expect(row, 'ContactRequest row should be saved').toBeTruthy();
    expect(row!.message).toContain('fade');
    await prisma.contactRequest.delete({ where: { id: row!.id } });
    await prisma.$disconnect();

    await ctx.close();
    await barber.request.dispose();
    await client.request.dispose();
  });
});
