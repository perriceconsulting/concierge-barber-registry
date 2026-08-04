import { test, expect } from '@playwright/test';

/**
 * Layout overflow guard for public marketing pages.
 *
 * Exists because a CTA button on /for-barbers shipped to production overflowing
 * its card and spilling across the neighbouring one — visible to anyone who
 * loaded the pricing section at a laptop width, and invisible to tsc, eslint,
 * jest and every existing e2e spec, none of which look at geometry.
 *
 * The cause is worth knowing: the shared Button has `whitespace-nowrap`, so a
 * label wider than its container cannot wrap. It does not clip and it does not
 * scroll — it escapes. That failure mode is silent by construction, which is
 * why it needs a test that measures rather than one that asserts on text.
 *
 * Widths are chosen as the ones that actually broke or nearly broke: a narrow
 * laptop, the md breakpoint boundary where the pricing grid goes 3-up, and a
 * phone.
 */

const WIDTHS = [
  { label: 'phone', width: 390, height: 844 },
  { label: 'md-boundary', width: 768, height: 1024 },
  { label: 'narrow-laptop', width: 1024, height: 900 },
  { label: 'desktop', width: 1440, height: 900 },
];

/** Public pages whose layout is a marketing asset, not just a view. */
const PAGES = ['/for-barbers', '/pro', '/for-clients', '/'];

test.describe('Public pages do not overflow horizontally', () => {
  for (const { label, width, height } of WIDTHS) {
    test(`no horizontal scroll at ${label} (${width}px)`, async ({ page }) => {
      for (const path of PAGES) {
        await page.setViewportSize({ width, height });
        const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
        // A redirect or 404 is a different failure; don't report it as overflow.
        expect(response?.status(), `${path} should render`).toBeLessThan(400);

        // Fonts and images settle late and change wrapping, so measure after.
        await page.waitForLoadState('networkidle').catch(() => {});

        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          const limit = doc.clientWidth;

          // "The page scrolls" is a symptom. Name the widest element that
          // crosses the right edge, or the failure sends the next person
          // hunting through the whole tree by hand.
          const culprits: string[] = [];
          for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (r.right <= limit + 1) continue;
            const id = el.id ? `#${el.id}` : '';
            const cls = el.className && typeof el.className === 'string'
              ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
              : '';
            culprits.push(
              `${el.tagName.toLowerCase()}${id}${cls} → right edge ${Math.round(r.right)}px`,
            );
          }

          return {
            scrollWidth: doc.scrollWidth,
            clientWidth: limit,
            // Outermost offenders first; inner ones are usually consequences.
            culprits: culprits.slice(0, 5),
          };
        });

        // 1px of slack absorbs sub-pixel rounding on fractional device ratios.
        expect(
          overflow.scrollWidth - overflow.clientWidth,
          `${path} scrolls horizontally at ${width}px ` +
            `(content ${overflow.scrollWidth}px vs viewport ${overflow.clientWidth}px)\n` +
            `  offenders:\n    ${overflow.culprits.join('\n    ')}`,
        ).toBeLessThanOrEqual(1);
      }
    });
  }
});

test.describe('Pricing CTAs stay inside their cards', () => {
  for (const { label, width, height } of WIDTHS) {
    test(`/for-barbers CTA buttons fit at ${label} (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/for-barbers', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});

      // Anchor on the pricing section rather than every button on the page.
      const ctas = page.locator('#pricing button, [id="pricing"] ~ * button');
      const count = await ctas.count();
      expect(count, 'expected pricing CTAs to be present').toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const button = ctas.nth(i);
        if (!(await button.isVisible())) continue;

        const fits = await button.evaluate((el) => {
          // The card is the nearest ancestor that establishes the visual box.
          const card = el.closest('[class*="rounded"]:not(button)') ?? el.parentElement;
          if (!card) return { ok: true, text: '', overhang: 0 };
          const b = el.getBoundingClientRect();
          const c = card.getBoundingClientRect();
          const overhang = Math.max(0, b.right - c.right, c.left - b.left);
          return { ok: overhang <= 1, text: (el.textContent ?? '').trim(), overhang };
        });

        expect(
          fits.ok,
          `CTA "${fits.text}" overflows its card by ${Math.round(fits.overhang)}px at ${width}px`,
        ).toBe(true);
      }
    });
  }
});
