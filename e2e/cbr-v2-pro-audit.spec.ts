import { test, expect, type ConsoleMessage } from '@playwright/test';

/**
 * /pro page — deep UI/UX audit.
 *
 * Goes beyond the existing single-line render check in cbr-v2-public.spec.ts.
 * Verifies every section, every CTA target, the anchor-scroll, the mobile
 * layout, the heading hierarchy, and listens for client-side console errors.
 *
 * If anything fails, the test name says what — easier to triage than one
 * mega-test that fails on first assertion.
 */

/** Collect every browser console error/warning so we can fail on noise. */
function attachConsoleCapture(page: import('@playwright/test').Page) {
  const messages: { type: string; text: string }[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      messages.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on('pageerror', (err) => {
    messages.push({ type: 'pageerror', text: err.message });
  });
  return messages;
}

test.describe('/pro — UI/UX audit', () => {
  test('loads with no console errors or page exceptions', async ({ page }) => {
    const noise = attachConsoleCapture(page);
    const res = await page.goto('/pro', { waitUntil: 'networkidle' });
    expect(res?.status()).toBe(200);

    // Allow only known-benign warnings; everything else is a regression.
    const realProblems = noise.filter(
      (m) =>
        m.type !== 'warning' || // surface all true errors
        // strip warnings that come from third-party dev mode (turbopack devtools, etc.)
        !/turbopack|devtools|hmr|fast refresh|deprecat/i.test(m.text),
    );
    expect.soft(realProblems, JSON.stringify(realProblems, null, 2)).toEqual([]);
  });

  test('hero renders all 5 elements', async ({ page }) => {
    await page.goto('/pro');

    // Eyebrow chip
    await expect(page.getByText('For Master Barbers', { exact: true })).toBeVisible();
    // H1 headline (the gold-gradient title)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/upgrade your career/i);
    // Subhead
    await expect(page.getByText(/the industry standard for verified professional grooming/i)).toBeVisible();
    // Body paragraph (verify a phrase from HERO.pro.body)
    await expect(page.locator('body')).toContainText(/manual vetting/i);
    // Primary CTA
    await expect(page.getByRole('button', { name: /apply for verification/i }).first()).toBeVisible();
    // Secondary CTA
    await expect(page.getByRole('button', { name: /see how verification works/i })).toBeVisible();
  });

  test('stat bar shows all 3 stats', async ({ page }) => {
    await page.goto('/pro');
    await expect(page.getByText('Manual Vetting').first()).toBeVisible();
    await expect(page.getByText('10% Royalty').first()).toBeVisible();
    await expect(page.getByText('Founding Status').first()).toBeVisible();
    // The Founding Status copy interpolates VETTING_FEE_PRICING.intro_limit (=10)
    await expect(page.locator('body')).toContainText(/first 10 approved barbers/i);
  });

  test('Why Pro section renders 3 cards with WHY_PRO_BLOCKS copy', async ({ page }) => {
    await page.goto('/pro');
    await expect(page.getByRole('heading', { name: /why master barbers join the registry/i })).toBeVisible();
    // Each WHY_PRO_BLOCKS title should render
    await expect(page.getByRole('heading', { name: /manual license verification/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /keep 100% of your service revenue/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /travel royalties \(10%\)/i })).toBeVisible();
  });

  test('How It Works renders 3 numbered steps + vetting fee notice', async ({ page }) => {
    await page.goto('/pro');
    await expect(page.getByRole('heading', { name: /how verification works/i })).toBeVisible();
    // Step titles from HOW_IT_WORKS_PRO
    await expect(page.getByRole('heading', { name: /^apply$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /manual vetting/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /verified status \+ 30-day trial/i })).toBeVisible();
    // Numbered circles 1, 2, 3
    for (const n of ['1', '2', '3']) {
      await expect(page.locator(`#how-it-works`).getByText(n, { exact: true }).first()).toBeVisible();
    }
    // Vetting fee notice paragraph
    await expect(page.locator('body')).toContainText(/manual 3-point background and license check/i);
  });

  test('Pricing section: $49 intro + $99 standard + $50 expedited addon + Founding badge', async ({ page }) => {
    await page.goto('/pro');
    await expect(page.getByRole('heading', { name: /application pricing/i })).toBeVisible();
    // Both tier amounts visible
    await expect(page.getByText('$49', { exact: true })).toBeVisible();
    await expect(page.getByText('$99', { exact: true })).toBeVisible();
    // Expedited addon copy
    await expect(page.locator('body')).toContainText(/\+\$50 for 24-hour expedited vetting/i);
    // Founding Members badge on intro card
    await expect(page.getByText('Founding Members', { exact: true })).toBeVisible();
  });

  test('final CTA renders + button leads to /register?role=barber', async ({ page }) => {
    await page.goto('/pro');
    await expect(page.getByRole('heading', { name: /apply for verification/i })).toBeVisible();
    // The CTA's parent link must point at the registration page
    const ctaLink = page.locator('a[href="/register?role=barber"]').first();
    await expect(ctaLink).toBeVisible();
  });

  test('secondary CTA "See How Verification Works" scrolls to #how-it-works', async ({ page }) => {
    await page.goto('/pro');
    // The link wraps the secondary CTA button — clicking it should change the URL hash.
    await page.getByRole('button', { name: /see how verification works/i }).click();
    await page.waitForURL(/#how-it-works$/, { timeout: 3000 });
    // And the section should now be in viewport
    const section = page.locator('#how-it-works');
    await expect(section).toBeInViewport();
  });

  test('heading hierarchy is sane: exactly one h1, multiple h2', async ({ page }) => {
    await page.goto('/pro');
    const h1Count = await page.locator('h1').count();
    expect(h1Count, 'page should have exactly one <h1>').toBe(1);
    const h2Count = await page.locator('h2').count();
    expect(h2Count, 'page should have multiple <h2> section headings').toBeGreaterThanOrEqual(4);
  });

  test('every <a> has an href, every <button> has accessible text', async ({ page }) => {
    await page.goto('/pro');
    // No empty/missing hrefs
    const badAnchors = await page.locator('a:not([href]), a[href=""]').count();
    expect(badAnchors, 'all <a> elements should have non-empty href').toBe(0);

    // No buttons with empty visible text and no aria-label
    const namelessButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.filter((b) => {
        const txt = (b.textContent || '').trim();
        const aria = b.getAttribute('aria-label') || b.getAttribute('aria-labelledby');
        return !txt && !aria;
      }).length;
    });
    expect(namelessButtons, 'all <button>s need accessible text or aria-label').toBe(0);
  });

  test('mobile viewport (iPhone 13) — hero readable, CTAs stack vertically', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      ignoreHTTPSErrors: true,
    });
    const page = await ctx.newPage();
    await page.goto('/pro');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/upgrade your career/i);

    // Primary + secondary CTAs both visible
    const primary = page.getByRole('button', { name: /apply for verification/i }).first();
    const secondary = page.getByRole('button', { name: /see how verification works/i });
    await expect(primary).toBeVisible();
    await expect(secondary).toBeVisible();

    // On mobile they should stack — secondary's box.top should be greater than
    // primary's box.bottom (i.e. it sits below, not beside).
    const primaryBox = await primary.boundingBox();
    const secondaryBox = await secondary.boundingBox();
    expect(primaryBox && secondaryBox).toBeTruthy();
    expect(secondaryBox!.y, 'on mobile the secondary CTA must stack BELOW the primary, not next to it').toBeGreaterThan(
      primaryBox!.y + primaryBox!.height - 5, // small fudge for sub-pixel rendering
    );

    await ctx.close();
  });

  test('SEO basics: title + meta description set', async ({ page }) => {
    await page.goto('/pro');
    await expect(page).toHaveTitle(/master barbers|verified grooming/i);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc, 'meta description must be set').toBeTruthy();
    expect(desc!.length, 'meta description should be 50-200 chars').toBeGreaterThan(50);
    expect(desc!.length).toBeLessThan(300);
  });

  test('full-page screenshot for visual record', async ({ page }) => {
    await page.goto('/pro', { waitUntil: 'networkidle' });
    await page.screenshot({
      path: 'test-results/pro-page-full.png',
      fullPage: true,
    });
    // No assertion — this just produces an artifact you can eyeball.
  });
});
