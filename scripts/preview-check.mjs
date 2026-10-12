const { chromium } = await import(
  process.env.LINEAGE_PLAYWRIGHT_MODULE || 'playwright'
);
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const url =
  process.env.LINEAGE_URL || 'https://vichrae88.github.io/Lineage/?preview=1';
const browser = await chromium.launch({
  executablePath: process.env.LINEAGE_CHROMIUM || undefined,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const production = await readFile(
  new URL('../test/fixtures/version-four-town.json', import.meta.url),
  'utf8',
);
await page.goto(url);
await page.evaluate((save) => {
  localStorage.setItem('lineage-save', save);
  localStorage.setItem('lineage-previous', 'production-backup');
}, production);
await page.reload();
const click = (a) =>
  page
    .locator('[data-action="' + a + '"]')
    .filter({ visible: true })
    .first()
    .click();
assert.match(await page.locator('.brand').textContent(), /Test version/);
for (let i = 0; i < 7; i++) await click('next');
await click('tutorial-skip');
await page.locator('dialog [data-choice="decline"]').click();
await click('continue-court');
await click('advance');
assert.match(await page.locator('dialog').textContent(), /Projected balance/);
await page.locator('dialog [data-choice="accounts"]').click();
assert.match(
  await page.locator('dialog').textContent(),
  /WHAT ACTUALLY HAPPENED/,
);
const saved = await page.evaluate(() => ({
  production: localStorage.getItem('lineage-save'),
  backup: localStorage.getItem('lineage-previous'),
  preview: JSON.parse(localStorage.getItem('lineage-preview-save')),
}));
assert.equal(saved.production, production);
assert.equal(saved.backup, 'production-backup');
assert.equal(saved.preview.version, 5);
assert.equal(saved.preview.turn, 1);
assert.equal(saved.preview.format, 'lineage-identities-v1');
assert.deepEqual(errors, []);
await browser.close();
console.log(
  'Preview passed: public-prefix asset paths, creation, first ruling, seasonal forecast/report, isolated preview save and unchanged production/backup slots, no JavaScript errors.',
);
