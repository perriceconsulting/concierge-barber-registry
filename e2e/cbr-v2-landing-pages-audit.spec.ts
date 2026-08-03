import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';

/**
 * Parameterized UI/UX audit for the v2 landing pages.
 *
 * Same shape as cbr-v2-pro-audit.spec.ts but parameterized across the 4
 * remaining landing pages (/client, /for-clients, /for-barbers,
 * /black-label/request-access). Each page gets:
 *   - clean browser console (no errors / page exceptions)
 *   - exactly one <h1>, ≥2 <h2> (heading hierarchy)
 *   - all <a> have href, all <button> have accessible names
 *   - mobile viewport (390×844) renders without horizontal scroll
 *   - SEO basics: title + meta description present
 *   - full-page screenshot artifact written for visual record
 *
 * The /pro audit lives in its own spec because it has extra page-specific
 * checks (anchor-scroll, pricing tier names, vetting-fee notice copy).
 * Same pattern can be added here per-page as the marketing content firms up.
 */

function attachConsoleCapture(page: Page) {
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

interface PageAudit {
  path: string;
  /** Friendly label for test names. */
  label: string;
  /** A phrase that MUST appear in the H1 — proves the right page rendered. */
  h1Contains: RegExp;
  /** A phrase that MUST appear in the meta title. */
  titleContains: RegExp;
  /** A phrase that MUST appear somewhere in the body — proves v2 copy is live, not stale v1. */
  bodyContains: RegExp;
}

const PAGES: PageAudit[] = [
  {
    path: '/client',
    label: '/client (v2 client-facing landing)',
    h1Contains: /exceptional grooming/i,
    titleContains: /find a verified master barber|for clients/i,
    bodyContains: /grooming passport/i,
  },
  {
    path: '/for-clients',
    label: '/for-clients (legacy client landing)',
    h1Contains: /find|barber|grooming/i,
    titleContains: /clients|barber/i,
    bodyContains: /verified|barber/i,
  },
  {
    path: '/for-barbers',
    label: '/for-barbers (legacy barber landing)',
    h1Contains: /keep 100%|own your chair|barber/i,
    titleContains: /barber|cut/i,
    bodyContains: /verification|license|verified/i,
  },
  {
    path: '/black-label/request-access',
    label: '/black-label/request-access (waitlist form)',
    h1Contains: /black label|request|membership|waitlist|access/i,
    titleContains: /black label|membership|access/i,
    bodyContains: /black label|nda|concierge|membership|access/i,
  },
];

for (const audit of PAGES) {
  test.describe(`UI/UX audit — ${audit.label}`, () => {
    test('loads with no console errors or page exceptions', async ({ page }) => {
      const noise = attachConsoleCapture(page);
      const res = await page.goto(audit.path, { waitUntil: 'networkidle' });
      expect(res?.status()).toBe(200);
      const realProblems = noise.filter(
        (m) =>
          m.type !== 'warning' ||
          !/turbopack|devtools|hmr|fast refresh|deprecat/i.test(m.text),
      );
      expect.soft(realProblems, JSON.stringify(realProblems, null, 2)).toEqual([]);
    });

    test('H1 contains expected topical phrase', async ({ page }) => {
      await page.goto(audit.path);
      const h1 = await page.locator('h1').first().textContent();
      expect(h1, `H1 on ${audit.path} should contain phrase matching ${audit.h1Contains}`).toMatch(
        audit.h1Contains,
      );
    });

    test('exactly one <h1>, at least two <h2>', async ({ page }) => {
      await page.goto(audit.path);
      const h1Count = await page.locator('h1').count();
      expect(h1Count, `${audit.path} should have exactly one <h1>`).toBe(1);
      const h2Count = await page.locator('h2').count();
      expect(h2Count, `${audit.path} should have multiple <h2> section headings`).toBeGreaterThanOrEqual(2);
    });

    test('every <a> has href, every <button> has accessible text', async ({ page }) => {
      await page.goto(audit.path);
      const badAnchors = await page.locator('a:not([href]), a[href=""]').count();
      expect(badAnchors, `${audit.path}: all <a> elements should have non-empty href`).toBe(0);
      const namelessButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.filter((b) => {
          const txt = (b.textContent || '').trim();
          const aria = b.getAttribute('aria-label') || b.getAttribute('aria-labelledby');
          return !txt && !aria;
        }).length;
      });
      expect(namelessButtons, `${audit.path}: every <button> needs accessible text or aria-label`).toBe(0);
    });

    test('mobile viewport (390×844) — H1 visible, no horizontal overflow', async ({ browser }) => {
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        ignoreHTTPSErrors: true,
      });
      const page = await ctx.newPage();
      await page.goto(audit.path);

      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();

      // Body shouldn't have horizontal scroll on mobile — within 1px tolerance
      // for sub-pixel rendering.
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(
        scrollWidth - clientWidth,
        `${audit.path}: horizontal scroll on 390px viewport (overflow: ${scrollWidth}-${clientWidth}=${scrollWidth - clientWidth}px)`,
      ).toBeLessThanOrEqual(1);

      await ctx.close();
    });

    test('SEO: title + meta description present', async ({ page }) => {
      await page.goto(audit.path);
      await expect(page).toHaveTitle(audit.titleContains);
      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(desc, `${audit.path}: meta description must be set`).toBeTruthy();
      expect(desc!.length, `${audit.path}: meta description should be 50-300 chars`).toBeGreaterThan(50);
      expect(desc!.length).toBeLessThan(300);
    });

    test('NLP: body contains topically relevant phrase (proves v2 copy live, not stale)', async ({ page }) => {
      await page.goto(audit.path);
      await expect(page.locator('body')).toContainText(audit.bodyContains);
    });

    test('full-page screenshot artifact', async ({ page }) => {
      await page.goto(audit.path, { waitUntil: 'networkidle' });
      const safeName = audit.path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
      await page.screenshot({
        path: `test-results/landing-${safeName}-full.png`,
        fullPage: true,
      });
    });
  });
}
