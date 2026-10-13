import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createGame,
  resolveEvent,
  eventOptions,
  parseSave,
  prepareAudience,
} from '../src/game.js';
import { serializeGame } from '../src/persistence.js';
const { chromium } = await import(
  process.env.LINEAGE_PLAYWRIGHT_MODULE || 'playwright'
);
const browser = await chromium.launch({
  executablePath: process.env.LINEAGE_CHROMIUM || undefined,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const url = process.env.LINEAGE_URL || 'http://localhost:3000';
const click = (a) =>
  page
    .locator('[data-action="' + a + '"]')
    .filter({ visible: true })
    .first()
    .click();
const choose = (id) =>
  page.locator('dialog [data-choice="' + id + '"]').click();
const load = async (g) => {
  g.tutorial.complete = true;
  await page.goto(url);
  await page.evaluate(
    (s) => localStorage.setItem('lineage-save', s),
    serializeGame(g),
  );
  await page.locator('.save-menu summary').click();
  await click('load');
};
const close = async () => {
  if (await page.locator('dialog[open]').count()) await click('close');
};
const advance = async () => {
  await click('advance');
  await choose('accounts');
  await click('continue-court');
  // Seasonal occurrences and the living court can now bring an audience here.
  for (let n = 0; n < 40; n++) {
    const g = parseSave(
      await page.evaluate(() => localStorage.getItem('lineage-save')),
    );
    if (!g.event) break;
    prepareAudience(g);
    const options = eventOptions(g),
      o =
        options.find((o) => !o.disabled && o.cost === 0) ||
        options.find((o) => !o.disabled && o.cost <= g.resources.gold);
    assert.ok(o, g.event.title);
    await choose(o.id);
    await click('continue-court');
    if (n === 39) throw Error('The audiences did not drain.');
  }
  await close();
};
try {
  const g = createGame({ seed: 293, race: 'Beastfolk', scale: 'town' });
  resolveEvent(g, 'decline');
  g.storyCursor = g.storyDeck.length;
  g.resources.gold = 500;
  g.resources.food = 500;
  await load(g);
  await page.locator('[data-tab="treasury"]').click();
  assert.ok(await page.locator('.treasury-summary').isVisible());
  assert.equal(await page.locator('.opportunity-card').count(), 6);
  await page.locator('[data-type="commercial"][data-id="estate"]').click();
  assert.match(await page.locator('dialog').textContent(), /Careful plan/);
  await choose('prudent');
  assert.ok(await page.locator('.narrative-outcome').isVisible());
  assert.equal(
    await page.locator('.outcome-ledger .change-grid').isVisible(),
    false,
  );
  await click('continue-court');
  await advance();
  assert.match(await page.locator('.venture-card').textContent(), /operating/);
  await page.locator('[data-type="venture"]').first().click();
  await choose('pause');
  await click('continue-court');
  assert.match(await page.locator('.venture-card').textContent(), /paused/);
  await page.locator('[data-tab="court"]').click();
  await page.locator('#portrait-presentation').selectOption('chronicle');
  assert.ok(await page.locator('.treatment-chronicle').count());
  await page.locator('[data-tab="lineage"]').click();
  await page.locator('[data-type="ambition"][data-id="prosperous"]').click();
  await choose('prosperous');
  await click('continue-court');
  assert.match(
    await page.locator('.ambition-panel').textContent(),
    /remains a purpose/,
  );
  await page.locator('.ambition-panel [data-action="entry"]').click();
  assert.match(
    await page.locator('dialog').textContent(),
    /Build prosperity beyond the levy/,
  );
  await close();
  await page.locator('[data-tab="realm"]').click();
  assert.equal(await page.locator('.faction-crest').count(), 9);
  assert.equal(await page.locator('.place-painting').count(), 6);
  await page.locator('[data-action="site"][data-id="fields"]').last().click();
  assert.ok(await page.locator('dialog .development-scene').isVisible());
  assert.ok(await page.locator('dialog .place-painting').isVisible());
  await close();
  await page.locator('.save-menu summary').click();
  await click('promises');
  assert.match(await page.locator('dialog').textContent(), /completed/);
  await close();
  await page.setViewportSize({ width: 360, height: 800 });
  for (const tab of ['treasury', 'realm', 'lineage', 'court']) {
    await page.locator('[data-tab="' + tab + '"]').click();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      tab + ' overflow',
    );
  }
  await page.screenshot({
    path: '/tmp/lineage-enhancement-court-mobile.png',
    fullPage: true,
  });
  const old = parseSave(
    await readFile(
      new URL('../test/fixtures/version-five-living.json', import.meta.url),
      'utf8',
    ),
  );
  while (old.event)
    resolveEvent(
      old,
      eventOptions(old)
        .filter((o) => !o.disabled && o.cost <= old.resources.gold)
        .at(-1).id,
    );
  await load(old);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('[data-tab="court"]').click();
  const p = old.court.find((p) => p.alive && p.status === 'serving');
  await page
    .locator('[data-action="person"][data-id="' + p.id + '"]')
    .first()
    .click();
  assert.equal(await page.locator('dialog .painted-portrait').count(), 0);
  await page.locator('dialog [data-type="portrait"]').click();
  await choose('formal');
  await click('continue-court');
  await close();
  await page
    .locator('[data-action="person"][data-id="' + p.id + '"]')
    .first()
    .click();
  assert.ok(await page.locator('dialog .painted-portrait').isVisible());
  assert.match(await page.locator('dialog').textContent(), /As painted/);
  await close();
  assert.deepEqual(errors, []);
  console.log(
    'Browser checks passed: six commercial opportunities, delegate forecasts, narrative outcomes, pause/upkeep, saved portrait styles, optional ambitions and Chronicle links, distinct faction/place graphics, promises, four mobile dashboards, opt-in legacy portrait upgrade, and no JavaScript errors.',
  );
} finally {
  await browser.close();
}
