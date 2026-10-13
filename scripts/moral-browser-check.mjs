import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createGame, resolveEvent, parseSave } from '../src/game.js';
import { tickDilemmas } from '../src/dilemmas.js';
import { serializeGame } from '../src/persistence.js';
const { chromium } = await import(
  process.env.LINEAGE_PLAYWRIGHT_MODULE || 'playwright'
);
const browser = await chromium.launch({
  executablePath: process.env.LINEAGE_CHROMIUM || undefined,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } }),
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('response', (r) => {
  if (r.status() >= 400) errors.push(r.status() + ' ' + r.url());
});
const url = process.env.LINEAGE_URL || 'http://localhost:3000',
  folder = process.env.LINEAGE_GALLERY_DIR || '/tmp/lineage-054-review';
await mkdir(folder, { recursive: true });
const click = (a) =>
  page
    .locator('[data-action="' + a + '"]')
    .filter({ visible: true })
    .first()
    .click();
async function load(g) {
  g.tutorial.complete = true;
  await page.goto(url);
  await page.evaluate(
    (s) => localStorage.setItem('lineage-save', s),
    serializeGame(g),
  );
  await page.locator('.save-menu summary').click();
  await click('load');
}
async function saved() {
  return parseSave(
    await page.evaluate(() => localStorage.getItem('lineage-save')),
  );
}
async function fit() {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
}
try {
  const g = createGame({
    seed: 81,
    race: 'Human',
    scale: 'town',
    history: 'Inherited',
  });
  resolveEvent(g, 'decline');
  g.resources.gold = 500;
  g.event = structuredClone(
    g.storyDeck.find((e) => e.archetype === 'clinic-fever'),
  );
  g.court[0].traits = ['Compassionate', 'Principled', 'Scholarly'];
  g.court[0].role = 'Councillor';
  g.court[1].traits = ['Ruthless', 'Loyal', 'Meticulous'];
  g.court[1].role = 'Marshal';
  await load(g);
  assert.match(
    await page.locator('.dilemma-context').innerText(),
    /May frightened workers/,
  );
  assert.ok((await page.locator('.choice-values').count()) >= 5);
  assert.ok((await page.locator('.choice-risk').count()) >= 3);
  const advice = await page
    .locator('.advisor-recommends strong')
    .allTextContents();
  assert.equal(advice.length, 2);
  assert.notEqual(advice[0], advice[1]);
  await page.locator('#audience-agent').selectOption(g.court[1].id);
  await page.locator('.dilemma-context').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: folder + '/moral-council.png',
    fullPage: true,
  });
  await page.locator('[data-choice="support"]').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: folder + '/moral-choices.png',
    fullPage: true,
  });
  await fit();
  await page.locator('[data-choice="support"]').click();
  assert.ok(await page.locator('.narrative-outcome').isVisible());
  let played = await saved(),
    c = played.dilemmas.at(-1);
  assert.equal(c.professional, g.court[1].id);
  assert.equal(c.choice, 'support');
  assert.equal(
    played.promises.find((p) => p.dilemma === c.id).status,
    'active',
  );
  // Restore the actual delayed simulation report, not a fabricated popup.
  played.turn = c.due;
  tickDilemmas(played);
  played.event = played.scheduled.splice(
    played.scheduled.findIndex((e) => e.id === c.followup),
    1,
  )[0];
  await load(played);
  assert.match(
    await page.locator('.audience-narrative').innerText(),
    /After “open a compulsory/,
  );
  assert.ok(await page.locator('[data-choice="erase-register"]').isVisible());
  await page.locator('[data-choice="erase-register"]').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: folder + '/moral-aftermath.png',
    fullPage: true,
  });
  await page.locator('[data-choice="erase-register"]').click();
  played = await saved();
  assert.equal(
    played.promises.find((p) => p.dilemma === c.id).status,
    'completed',
  );
  assert.equal(played.dilemmas.at(-1).status, 'closed');
  assert.ok(await page.locator('.narrative-outcome').isVisible());
  await page.screenshot({
    path: folder + '/moral-settlement.png',
    fullPage: true,
  });
  await click('continue-court');
  await page.locator('.save-menu summary').click();
  await click('promises');
  assert.match(
    await page.locator('dialog').innerText(),
    /fulfilled|completed|kept/i,
  );
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 360, height: 900 });
  const local = createGame({ seed: 81, race: 'Human', scale: 'town' });
  resolveEvent(local, 'decline');
  local.resources.gold = 0;
  local.resources.food = 0;
  local.resources.military = 0;
  for (const p of local.court) p.status = 'departed';
  local.event = structuredClone(
    local.storyDeck.find((e) => e.archetype === 'sacred-predator'),
  );
  await load(local);
  await fit();
  assert.equal(await page.locator('#audience-agent option').count(), 1);
  assert.equal(await page.locator('[data-choice="refuse"]').isEnabled(), true);
  await page.locator('[data-choice="refuse"]').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: folder + '/mobile-moral-choice.png',
    fullPage: true,
  });
  await page.locator('[data-choice="refuse"]').click();
  assert.equal((await saved()).dilemmas.at(-1).choice, 'refuse');
  assert.deepEqual(errors, []);
  console.log(
    'Moral browser checks passed: conflicting advice, selected delegate, real delayed report, fulfilled promise, save persistence, and a free mobile answer without available court.',
  );
} finally {
  await browser.close();
}
