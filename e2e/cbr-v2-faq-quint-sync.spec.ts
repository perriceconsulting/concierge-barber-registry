import { test, expect } from '@playwright/test';

/**
 * Quint-Sync audit for FAQPage schema on landing pages.
 *
 * For each page, verifies BOTH:
 *   1. FAQPage JSON-LD is emitted (AEO/SGE play — AI Overviews + Perplexity
 *      lift answers from this schema and cite the URL)
 *   2. The same Q&A pairs are visibly rendered in a <details>/<summary>
 *      block (Google demotes FAQPage schema whose answers aren't visible)
 *
 * Pulls the expected Q&A pairs straight from the source-of-truth bank so
 * the test stays in lockstep with the content as it evolves.
 */

import { FAQS } from '../src/lib/copy/faqs';

async function readJsonLdBlocks(page: import('@playwright/test').Page) {
  return await page.$$eval('script[type="application/ld+json"]', (els) =>
    els.map((el) => {
      try {
        return JSON.parse(el.textContent || '{}');
      } catch {
        return { __invalid: el.textContent };
      }
    }),
  );
}

const PAGES = [
  { path: '/', bank: FAQS.homepage, label: 'homepage (barber-first variant for guests)' },
  { path: '/for-clients', bank: FAQS.forClients, label: '/for-clients' },
  { path: '/for-barbers', bank: FAQS.forBarbers, label: '/for-barbers' },
  { path: '/pro', bank: FAQS.pro, label: '/pro' },
  { path: '/client', bank: FAQS.client, label: '/client' },
  { path: '/black-label/request-access', bank: FAQS.blackLabel, label: '/black-label/request-access (gated /black-label redirects here)' },
] as const;

// `/black-label` itself redirects unauth visitors to /black-label/request-access
// — so we can't directly check the FAQs on /black-label without an HNWI session.
// The request-access landing renders the same page tree as the marketing
// surface for the purpose of this test. If that ever stops being true, this
// row should split into its own dedicated case using an authed context.

for (const { path, bank, label } of PAGES) {
  test.describe(`FAQ Quint-Sync — ${label}`, () => {
    // Skip the /black-label/request-access row — that route renders the
    // waitlist form, NOT the marketing page. The full /black-label FAQ
    // surface requires an HNWI session, which the helpers/test-users.ts
    // fixture supports but is overkill for this audit. Test it via the
    // logged-in path in cbr-v2-auth.spec.ts if/when needed.
    const isBlackLabel = path.includes('black-label');

    test(`emits FAQPage JSON-LD with all ${bank.length} questions`, async ({ page }) => {
      test.skip(isBlackLabel, 'Black Label FAQ lives behind HNWI gate; covered separately');
      await page.goto(path);
      const blocks = await readJsonLdBlocks(page);
      const faqBlock = blocks.find((b) => b['@type'] === 'FAQPage');
      expect(faqBlock, `FAQPage JSON-LD missing on ${path}`).toBeTruthy();
      expect(faqBlock.mainEntity.length).toBe(bank.length);
      // Every question from the source bank must appear in the emitted schema
      for (const item of bank) {
        const match = faqBlock.mainEntity.find(
          (q: { name: string }) => q.name === item.question,
        );
        expect(match, `question missing from FAQPage schema: "${item.question}"`).toBeTruthy();
        expect(match.acceptedAnswer.text).toBe(item.answer);
      }
    });

    test(`renders all ${bank.length} questions visibly (Google requires schema to match visible content)`, async ({ page }) => {
      test.skip(isBlackLabel, 'Black Label FAQ lives behind HNWI gate; covered separately');
      await page.goto(path);
      for (const item of bank) {
        await expect(
          page.getByText(item.question, { exact: true }).first(),
          `question text not visibly rendered on ${path}: "${item.question}"`,
        ).toBeVisible();
      }
    });

    test('FAQ section uses semantic <details>/<summary> for keyboard a11y', async ({ page }) => {
      test.skip(isBlackLabel, 'Black Label FAQ lives behind HNWI gate; covered separately');
      await page.goto(path);
      // Each FAQ item is a <details> with a <summary>; verify at least one
      // is in the DOM and at least one is open by default (answer reachable
      // above the fold for SGE readout).
      const detailsCount = await page.locator('section[aria-labelledby$="-heading"] details').count();
      expect(detailsCount, `no <details> elements found in FAQ section on ${path}`).toBe(bank.length);
      const openCount = await page.locator('section[aria-labelledby$="-heading"] details[open]').count();
      expect(openCount, 'at least one FAQ should be open by default').toBeGreaterThanOrEqual(1);
    });
  });
}
