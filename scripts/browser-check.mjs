// Optional browser verification: install Playwright separately, or point this variable at an installed module.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, resolveEvent } from '../src/game.js';
import { serializeGame } from '../src/persistence.js';
const { chromium } = await import(
  process.env.LINEAGE_PLAYWRIGHT_MODULE || 'playwright'
);
const browser = await chromium.launch({
  executablePath: process.env.LINEAGE_CHROMIUM || undefined,
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  }),
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const url = process.env.LINEAGE_URL || 'http://localhost:3000';
const click = (a) =>
  page
    .locator('[data-action="' + a + '"]')
    .filter({ visible: true })
    .first()
    .click();
const choice = (id) =>
  page.locator('dialog [data-choice="' + id + '"]').click();
const load = async (game) => {
  await page.evaluate(
    (save) => localStorage.setItem('lineage-save', save),
    typeof game === 'string' ? game : serializeGame(game),
  );
  await page.goto(url);
  await page.locator('.save-menu summary').click();
  await click('load');
};
try {
  await page.goto(url);
  for (let i = 0; i < 7; i++) await click('next');
  await click('tutorial-skip');
  await choice('balanced');
  assert.ok(await page.locator('dialog .change-grid').isVisible());
  await click('entry');
  assert.match(await page.locator('dialog').textContent(), /consequences/i);
  await click('close');
  await click('continue-court');
  await click('advance');
  assert.match(await page.locator('dialog').textContent(), /Projected balance/);
  await choice('accounts');
  assert.match(
    await page.locator('dialog').textContent(),
    /WHAT ACTUALLY HAPPENED/,
  );
  await click('continue-court');
  if (await page.locator('dialog[open]').count()) await click('close');
  const g = createGame({
    seed: 782,
    race: 'Beastfolk',
    species: 'Otter',
    scale: 'town',
  });
  resolveEvent(g, 'decline');
  g.storyCursor = g.storyDeck.length;
  g.resources.gold = 1000;
  g.resources.food = 1000;
  g.tutorial.complete = true;
  await load(g);
  await page.locator('[data-tab="court"]').click();
  await page
    .locator('[data-action="person"][data-id="' + g.court[0].id + '"]')
    .first()
    .click();
  assert.ok(
    await page.locator('dialog .individual-portrait svg image').count(),
  );
  assert.match(
    await page.locator('dialog').textContent(),
    /capabilities|attributes/i,
  );
  await page.locator('dialog [data-type="mentorship"]').click();
  await page.locator('#decision-agent').selectOption(g.court[1].id);
  await choice('scholarship');
  await click('continue-court');
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('lineage-save')).trainingJobs[0].status,
    ),
    'active',
  );
  // A real timed course runs through two actual seasons and reports its result.
  for (let i = 0; i < 2; i++) {
    await click('advance');
    await choice('accounts');
    await click('continue-court');
    if (await page.locator('dialog[open]').count()) await click('close');
  }
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('lineage-save')).trainingJobs[0].status,
    ),
    'completed',
  );
  await page.locator('[data-tab="court"]').click();
  await page.locator('[data-action="candidate"]').first().click();
  await page.locator('dialog [data-type="hire"]').click();
  await choice('retainer');
  await click('continue-court');
  const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('lineage-save')),
    ),
    hired = saved.court.at(-1);
  await page
    .locator('[data-action="person"][data-id="' + hired + '"]')
    .first()
    .click();
  await page.locator('dialog [data-type="transfer"]').click();
  await choice('Spymaster');
  await click('continue-court');
  assert.equal(
    await page.evaluate(
      (id) => JSON.parse(localStorage.getItem('lineage-save')).people[id].role,
      hired,
    ),
    'Spymaster',
  );
  await page
    .locator('[data-action="person"][data-id="' + hired + '"]')
    .first()
    .click();
  await page.locator('dialog [data-type="dismiss"]').click();
  await choice('honor');
  await click('continue-court');
  assert.equal(
    await page.evaluate(
      (id) =>
        JSON.parse(localStorage.getItem('lineage-save')).people[id].status,
      hired,
    ),
    'departed',
  );
  await page.locator('[data-tab="lineage"]').click();
  assert.ok(await page.locator('.family-tree .remembered').count());
  await page.locator('.family-tree .tree-person').first().click();
  assert.match(
    await page.locator('dialog').textContent(),
    /Remembered ancestor/,
  );
  await page.keyboard.press('Escape');
  await page.locator('.save-menu summary').click();
  await click('chronicle');
  await page.locator('#chronicle-kind').selectOption('decision');
  assert.equal(await page.locator('#chronicle-kind').inputValue(), 'decision');
  await click('entry');
  await click('close');
  assert.equal(await page.locator('#chronicle-kind').inputValue(), 'decision');
  await click('close');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.save-menu summary').click();
  await click('export');
  const download = await downloadPromise;
  const exported = JSON.parse(await readFile(await download.path(), 'utf8'));
  assert.equal(exported.format, 'lineage-identities-v1');
  // Mobile retains the map and public mood without horizontal overflow.
  await page.setViewportSize({ width: 360, height: 800 });
  assert.ok(await page.locator('.realm-sidebar').isVisible());
  assert.ok(await page.locator('.realm-mood').isVisible());
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.locator('[data-location="fields"]').click();
  assert.match(
    await page.locator('dialog').textContent(),
    /The people who live here/,
  );
  await page.keyboard.press('Escape');
  assert.ok(
    await page.evaluate(() => document.activeElement !== document.body),
  );
  // Production saves migrate and render their original people through the real load button.
  for (const fixture of ['version-three-town.json', 'version-four-town.json']) {
    const data = await readFile(
      new URL('../test/fixtures/' + fixture, import.meta.url),
      'utf8',
    );
    await load(data);
    if (await page.locator('dialog[open]').count()) await click('close');
    assert.ok(await page.locator('.realm-heading').isVisible());
    await page.locator('[data-tab="court"]').click();
    assert.ok(await page.locator('.member-card').count());
  }
  assert.deepEqual(errors, []);
  console.log(
    'Browser checks passed: creation, outcomes, forecasts/actual reports, timed mentorship, hire/transfer/dismiss, family tree, Chronicle navigation, compact export, production-save migration, Escape focus, 360px map/mood, and no JavaScript errors.',
  );
} finally {
  await browser.close();
}
