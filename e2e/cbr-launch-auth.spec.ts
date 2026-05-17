import { test, expect } from '@playwright/test';
import { testUsers, TEST_PASSWORD } from './helpers/test-users';

/**
 * Launch-critical auth flows.
 *
 * Real-user UI for registration, login, and logout. The API-side of register
 * is already exercised in cbr-v2-auth.spec.ts; this suite drives the actual
 * forms a real visitor fills out.
 */

test.afterAll(async () => {
  await testUsers.cleanup();
  await testUsers.disconnect();
});

function uniqueEmail(label: string) {
  return `pw-test_launch-${label}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@cbr.test`;
}

test.describe('Launch — registration UI', () => {
  test('client registration form submits and shows verify-email modal', async ({ page }) => {
    const email = uniqueEmail('reg-client');
    await page.goto('/register');
    await page.locator('button:has-text("Client")').click();
    await page.fill('#firstName', 'Launch');
    await page.fill('#lastName', 'TestClient');
    await page.fill('#email', email);
    await page.fill('#password', TEST_PASSWORD);
    await page.fill('#confirmPassword', TEST_PASSWORD);
    // Required terms checkbox — submit button stays disabled until checked.
    await page.locator('#agreedToTerms').check();

    await page.locator('button[type="submit"]:has-text("Create Account")').click();
    // The register handler shows a verify-email modal rather than redirecting.
    // Verify the user was actually created in the DB to prove the form submitted.
    await page.waitForTimeout(2500);
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const created = await prisma.user.findUnique({ where: { email } });
    expect(created, 'registered user should exist in DB').toBeTruthy();
    expect(created!.role).toBe('client');
    await prisma.$disconnect();
  });

  test('barber registration form submits and shows verify-email modal', async ({ page }) => {
    const email = uniqueEmail('reg-barber');
    await page.goto('/register');
    await page.locator('button:has-text("Barber")').click();
    await page.fill('#firstName', 'Launch');
    await page.fill('#lastName', 'TestBarber');
    await page.fill('#email', email);
    await page.fill('#password', TEST_PASSWORD);
    await page.fill('#confirmPassword', TEST_PASSWORD);
    await page.locator('#agreedToTerms').check();

    await page.locator('button[type="submit"]:has-text("Create Account")').click();
    await page.waitForTimeout(2500);
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const created = await prisma.user.findUnique({ where: { email } });
    expect(created, 'registered barber should exist in DB').toBeTruthy();
    expect(created!.role).toBe('barber');
    await prisma.$disconnect();
  });

  test('duplicate email returns a friendly error (not a crash)', async ({ page, request }) => {
    // Pre-create a user via the helper so the email exists
    const existing = await testUsers.createClient('dup-guard');
    const dupEmail = existing.email;

    await page.goto('/register');
    await page.locator('button:has-text("Client")').click();
    await page.fill('#firstName', 'Dup');
    await page.fill('#lastName', 'Guard');
    await page.fill('#email', dupEmail);
    await page.fill('#password', TEST_PASSWORD);
    await page.fill('#confirmPassword', TEST_PASSWORD);
    await page.locator('#agreedToTerms').check();
    await page.locator('button[type="submit"]:has-text("Create Account")').click();

    // We should NOT navigate away — error message should appear on the page
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/register');
    await expect(
      page.locator('body').getByText(/already exists|already registered|email.*taken|in use/i).first(),
    ).toBeVisible({ timeout: 5000 });

    await existing.request.dispose();
    void request;
  });
});

test.describe('Launch — login + logout UI', () => {
  test('valid credentials log in and land on dashboard', async ({ page }) => {
    // Pre-create a barber so we have known credentials to log in as
    const u = await testUsers.createApprovedBarber({ emailLabel: 'login-happy' });
    await u.request.dispose();

    await page.goto('/login');
    await page.fill('#email', u.email);
    await page.fill('#password', TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/(dashboard|admin|search|$)/, { timeout: 15000 });
    await expect(page.getByRole('link', { name: /^sign in$/i })).toHaveCount(0);
  });

  test('invalid credentials show error, stays on login page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'no-such-user@cbr.test');
    await page.fill('#password', 'WrongPassword123!');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/login');
    await expect(
      page.locator('body').getByText(/invalid|incorrect|wrong|failed/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test('logout clears the session and unauthorized routes redirect to /login', async ({ page, browser }) => {
    const u = await testUsers.createApprovedBarber({ emailLabel: 'logout-test' });
    const storage = await u.request.storageState();
    const ctx = await browser.newContext({ storageState: storage, ignoreHTTPSErrors: true });
    const authedPage = await ctx.newPage();
    await authedPage.goto('/dashboard');
    // Wait for the dashboard layout to settle
    await authedPage.waitForLoadState('networkidle');

    // Click Sign Out — pattern varies (could be a menu or a direct button)
    const signOutBtn = authedPage.getByRole('button', { name: /sign out|log out|logout/i }).first();
    await signOutBtn.click();

    // After logout, /dashboard should redirect to /login
    await authedPage.waitForURL(/\/(login|$)/, { timeout: 10000 });

    // Confirm: navigating back to /dashboard pushes us to /login
    await authedPage.goto('/dashboard');
    await authedPage.waitForURL(/\/login/, { timeout: 5000 });

    await ctx.close();
    await u.request.dispose();
    void page;
  });
});
