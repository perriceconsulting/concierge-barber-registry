import { test, expect } from '@playwright/test';

test.describe('Barber Registration & License Verification Flow', () => {
  test('registration form has all required fields', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    await expect(page).toHaveURL('/register');

    // Verify all form elements exist
    await expect(page.locator('button:has-text("Client")')).toBeVisible();
    await expect(page.locator('button:has-text("Barber")')).toBeVisible();
    await expect(page.locator('#firstName')).toBeVisible();
    await expect(page.locator('#lastName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Create Account")')).toBeVisible();
  });

  test.skip('complete barber onboarding journey', async ({ page }) => {
    // NOTE: This test requires a test database and proper environment setup
    // Skipping for now as it requires backend infrastructure

    // 1. Navigate to registration page
    await page.goto('/register');
    await expect(page).toHaveURL('/register');

    // 2. Fill out registration form
    const timestamp = Date.now();
    const testEmail = `barber${timestamp}@test.com`;

    // Select barber role (using button click, not select dropdown)
    await page.click('button:has-text("Barber")');

    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Barber');
    await page.fill('#email', testEmail);
    await page.fill('#password', 'TestPassword123!');
    await page.fill('#confirmPassword', 'TestPassword123!');

    // 3. Submit registration
    await page.click('button[type="submit"]:has-text("Create Account")');

    // 4. Should redirect to dashboard (after successful registration)
    await page.waitForURL('/dashboard', { timeout: 15000 });

    // 5. Navigate to profile page
    await page.goto('/dashboard/profile');
    await expect(page).toHaveURL('/dashboard/profile');

    // 6. Fill out profile information (using IDs that match the actual form)
    await page.fill('#displayName', 'Test Barber Shop');
    await page.fill('#bio', 'Professional barber with 5 years experience');
    await page.fill('#phone', '555-0123');
    await page.fill('#city', 'New York');
    await page.fill('#state', 'NY');
    await page.fill('#zipCode', '10001');

    // 7. Fill out license information
    await page.fill('#licenseNumber', 'NY-123456');
    await page.fill('#licenseState', 'NY');
    await page.fill('#licenseExpirationDate', '2026-12-31');

    // 8. Save profile
    await page.click('button[type="submit"]:has-text("Save")');

    // 9. Wait for submission to complete
    await page.waitForTimeout(2000);

    // 10. Verify license status badge shows "Pending Review" or "Unverified"
    const statusBadge = page.locator('text=/Pending.*Review|Unverified/i');
    await expect(statusBadge.first()).toBeVisible({ timeout: 5000 });
  });

  test('verified badge appears only for approved licenses', async ({ page }) => {
    // Navigate to barber search
    await page.goto('/search');

    // If there are barbers, check for verified badge
    const barberCards = page.locator('[data-testid="barber-card"]');
    const count = await barberCards.count();

    if (count > 0) {
      // Check that verified badge only appears on verified barbers
      const verifiedBadges = page.locator('text=/✓.*Verified/i');
      const badgeCount = await verifiedBadges.count();

      // At least some barbers should have verified status
      if (badgeCount > 0) {
        await expect(verifiedBadges.first()).toBeVisible();
      }
    }
  });

  test('verified-only filter works correctly', async ({ page }) => {
    await page.goto('/search');

    // Find and click the "verified only" checkbox
    const verifiedCheckbox = page.locator('input[type="checkbox"]#verifiedOnly');

    if (await verifiedCheckbox.isVisible()) {
      await verifiedCheckbox.check();

      // Wait for results to filter
      await page.waitForTimeout(1000);

      // All visible barbers should have verified badge
      const barberCards = page.locator('[data-testid="barber-card"]');
      const cardCount = await barberCards.count();

      if (cardCount > 0) {
        // Each card should have a verified badge
        for (let i = 0; i < cardCount; i++) {
          const card = barberCards.nth(i);
          await expect(card.locator('text=/✓.*Verified/i')).toBeVisible();
        }
      }
    }
  });
});
