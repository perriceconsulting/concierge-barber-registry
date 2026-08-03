import { test } from '@playwright/test';
test('theme restored on dev', async ({ page }) => {
  for (const url of ['https://localhost:3000/about', 'https://192.168.1.159:3000/about', 'https://192.168.1.159:3000/']) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    console.log(`${url.padEnd(42)} bg=${bg}`);
  }
  await page.screenshot({ path: 'tmp/about-fixed.png' });
});
