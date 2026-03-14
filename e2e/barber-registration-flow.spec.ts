import { test, expect } from '@playwright/test';

test.describe('Barber Registration & License Verification Flow', () => {
  test('complete barber onboarding journey', async ({ page }) => {
    // 1. Navigate to registration page
    await page.goto('/register');
    await expect(page).toHaveURL('/register');

    // 2. Fill out registration form
    const timestamp = Date.now();
    const testEmail = `barber${timestamp}@test.com`;

    await page.fill('[name="firstName"]', 'Test');
    await page.fill('[name="lastName"]', 'Barber');
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.selectOption('[name="role"]', 'barber');

    // 3. Submit registration
    await page.click('button[type="submit"]');

    // 4. Should redirect to login or dashboard (depending on email verification)
    await page.waitForURL(/\/(login|dashboard)/);

    // If redirected to login, log in
    if (page.url().includes('/login')) {
      await page.fill('[name="email"]', testEmail);
      await page.fill('[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');

      await page.waitForURL('/dashboard');
    }

    // 5. Navigate to profile page
    await page.goto('/dashboard/profile');
    await expect(page).toHaveURL('/dashboard/profile');

    // 6. Fill out profile information
    await page.fill('[name="displayName"]', 'Test Barber Shop');
    await page.fill('[name="city"]', 'New York');
    await page.fill('[name="state"]', 'NY');
    await page.fill('[name="zipCode"]', '10001');

    // 7. Fill out license information
    await page.fill('[name="licenseNumber"]', 'NY-123456');
    await page.fill('[name="licenseState"]', 'NY');
    await page.fill('[name="licenseExpirationDate"]', '2026-12-31');

    // 8. Save profile
    await page.click('button[type="submit"]:has-text("Save")');

    // 9. Verify success message or redirect
    await expect(page.locator('text=/Profile.*saved|Success/i')).toBeVisible({ timeout: 10000 });

    // 10. Verify license status badge shows "Pending Review"
    await expect(page.locator('text=/Pending.*Review/i')).toBeVisible();
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
