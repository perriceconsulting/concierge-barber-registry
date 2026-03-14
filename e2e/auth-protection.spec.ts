import { test, expect } from '@playwright/test';

test.describe('Authentication & Route Protection', () => {
  test.describe('Dashboard Protection', () => {
    test('should redirect to login when accessing /dashboard without auth', async ({ page }) => {
      await page.goto('/dashboard');

      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/);

      // Should preserve redirect parameter
      const url = new URL(page.url());
      expect(url.searchParams.get('redirect')).toBe('/dashboard');
    });

    test('should redirect to login when accessing /dashboard/profile without auth', async ({ page }) => {
      await page.goto('/dashboard/profile');

      await expect(page).toHaveURL(/\/login/);
      expect(new URL(page.url()).searchParams.get('redirect')).toBe('/dashboard/profile');
    });
  });

  test.describe('Admin Protection', () => {
    test('should redirect to login when accessing /admin without auth', async ({ page }) => {
      await page.goto('/admin');

      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect to login when accessing /admin/barbers without auth', async ({ page }) => {
      await page.goto('/admin/barbers');

      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Public Routes', () => {
    test('should allow access to home page without auth', async ({ page }) => {
      await page.goto('/');

      await expect(page).toHaveURL('/');
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should allow access to /barbers without auth', async ({ page }) => {
      await page.goto('/barbers');

      await expect(page).toHaveURL('/barbers');
    });

    test('should allow access to /login without auth', async ({ page }) => {
      await page.goto('/login');

      await expect(page).toHaveURL('/login');
    });

    test('should allow access to /register without auth', async ({ page }) => {
      await page.goto('/register');

      await expect(page).toHaveURL('/register');
    });
  });
});
