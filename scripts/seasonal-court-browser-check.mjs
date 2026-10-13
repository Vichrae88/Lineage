import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import {
  createGame,
  resolveEvent,
  parseSave,
  eventOptions,
  prepareAudience,
} from '../src/game.js';
import { tickSeasonal, seasonalForecast } from '../src/seasonal.js';
import { tickCourtWork } from '../src/court-initiatives.js';
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
  folder = process.env.LINEAGE_GALLERY_DIR || '/tmp/lineage-055-review';
await mkdir(folder, { recursive: true });
const click = (a) =>
  page
    .locator('[data-action="' + a + '"]')
    .filter({ visible: true })
    .first()
    .click();
const choose = (id) =>
  page.locator('dialog [data-choice="' + id + '"]').click();
const saved = async () =>
  parseSave(await page.evaluate(() => localStorage.getItem('lineage-save')));
const fit = async () =>
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
const make = () => {
  const g = createGame({
    seed: 81,
    race: 'Beastfolk',
    scale: 'town',
    history: 'Inherited',
  });
  resolveEvent(g, 'decline');
  g.tutorial.complete = true;
  g.resources.gold = 500;
  g.resources.food = 200;
  return g;
};
async function load(g) {
  await page.goto(url);
  await page.evaluate(
    (s) => localStorage.setItem('lineage-save', s),
    serializeGame(g),
  );
  await page.locator('.save-menu summary').click();
  await click('load');
}
function encounter(g, predicate) {
  for (let n = 0; n < 1500; n++) {
    g.turn++;
    const e = tickSeasonal(g);
    if (!e) continue;
    g.event = e;
    prepareAudience(g);
    const h = g.seasonal.events.at(-1);
    if (predicate(h.definition)) return e;
    const o = eventOptions(g).find(
      (o) => !o.disabled && o.cost <= g.resources.gold,
    );
    assert.ok(resolveEvent(g, o.id).ok);
  }
  throw Error('No encounter');
}
async function drain() {
  for (let n = 0; n < 40; n++) {
    const g = await saved();
    if (!g.event) return;
    const o =
      eventOptions(g).find((o) => !o.disabled && o.cost === 0) ||
      eventOptions(g).find((o) => !o.disabled && o.cost <= g.resources.gold);
    assert.ok(o, g.event.title);
    await choose(o.id);
    await click('continue-court');
  }
  throw Error('Audiences did not drain');
}
try {
  const gift = make();
  encounter(
    gift,
    (s) => s.special?.kind === 'boon' && s.special.field === 'gold',
  );
  const gold = gift.resources.gold,
    items = gift.seasonal.boons.length;
  await load(gift);
  assert.ok(
    await page.locator('.seasonal-note .narrative-outcome').isVisible(),
  );
  assert.equal(await page.locator('.decision-option').count(), 1);
  await page.screenshot({
    path: folder + '/seasonal-gift.png',
    fullPage: true,
  });
  await choose('record');
  let g = await saved();
  assert.equal(g.resources.gold, gold);
  assert.equal(g.seasonal.boons.length, items);
  await click('continue-court');
  await page.locator('[data-tab="treasury"]').click();
  assert.match(
    await page.locator('.main-sheet').innerText(),
    /Gifts held in the public reliquary/,
  );
  await page.locator('[data-tab="adventures"]').click();
  assert.ok(await page.locator('.seasonal-boons').isVisible());
  await page.screenshot({
    path: folder + '/lasting-gifts.png',
    fullPage: true,
  });
  const decision = make(),
    e = encounter(decision, (s) => s.category === 'decision');
  await load(decision);
  assert.equal(await page.locator('.decision-option').count(), 3);
  assert.ok(await page.locator('.choice-risk').count());
  await page.locator('#audience-agent').selectOption(decision.court[1].id);
  const id = e.options[0]?.id || eventOptions(decision)[0].id;
  const selected = eventOptions(decision).find((o) => o.id === id);
  e.agent = decision.court[1].id;
  const f = seasonalForecast(decision, e, selected);
  await page.locator('.decision-options').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: folder + '/seasonal-decision.png',
    fullPage: true,
  });
  await fit();
  await page
    .locator('dialog [data-choice="' + id + '"]')
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: folder + '/seasonal-choices.png',
    fullPage: true,
  });
  await choose(id);
  g = await saved();
  const h = g.seasonal.events.at(-1);
  assert.equal(h.status, 'settled');
  assert.equal(h.delegate, decision.court[1].id);
  assert.equal(h.chance, f.chance);
  assert.equal(h.choice, id);
  assert.ok(await page.locator('.narrative-outcome').isVisible());
  await page
    .locator('.outcome-ledger summary')
    .filter({ hasText: 'undertaking’s risk' })
    .click();
  assert.match(
    await page.locator('dialog').innerText(),
    /intended outcome|setback/,
  );
  const hero = make();
  encounter(hero, (s) => s.special?.kind === 'hero');
  const hrecord = hero.archive.find(
      (r) => r.id === hero.seasonal.events.at(-1).source,
    ),
    p = hero.court.find((p) => p.heroicService === hrecord.id);
  assert.ok(p);
  await load(hero);
  assert.match(
    await page.locator('.audience-narrative').innerText(),
    new RegExp(p.name),
  );
  await choose('record');
  await click('continue-court');
  await page.locator('[data-tab="court"]').click();
  assert.ok(
    await page.locator('.member-card[data-id="' + p.id + '"]').isVisible(),
  );
  const work = make();
  for (const p of work.court) {
    p.wealth = 80;
    p.health = 90;
    p.loyalty = 80;
    p.morale = 80;
    for (const k of Object.keys(p.skills)) p.skills[k] = 80;
  }
  for (let n = 0; n < 30 && !work.courtWork.initiatives.length; n++) {
    work.turn++;
    tickCourtWork(work);
  }
  assert.ok(work.courtWork.initiatives.length);
  work.resources.gold = 0;
  await load(work);
  assert.ok(await page.locator('.court-work-brief').isVisible());
  await page.locator('[data-tab="court"]').click();
  assert.ok(await page.locator('.initiative-card').isVisible());
  assert.match(await page.locator('.personal-time').innerText(), /2 of 2/);
  const i = work.courtWork.initiatives[0];
  await page.locator('.member-card[data-id="' + i.person + '"]').click();
  await page.locator('[data-type="cultivate"]').click();
  await choose('listen');
  g = await saved();
  assert.equal(g.resources.gold, 0);
  assert.equal(g.personalTime.used, 1);
  await click('continue-court');
  await page.locator('[data-tab="court"]').click();
  assert.match(await page.locator('.personal-time').innerText(), /1 of 2/);
  await page.locator('[data-type="initiative"]').first().click();
  await choose('encourage');
  g = await saved();
  assert.equal(g.resources.gold, 0);
  assert.equal(g.personalTime.used, 2);
  assert.ok(g.courtWork.initiatives[0].progress > 0);
  await click('continue-court');
  await page.locator('[data-tab="court"]').click();
  await page.screenshot({
    path: folder + '/court-progress.png',
    fullPage: true,
  });
  const startingReports = g.courtWork.initiatives[0].reports.length;
  await click('advance');
  await choose('accounts');
  assert.match(
    await page.locator('dialog').innerText(),
    /reports|work|undertaking/,
  );
  await page.screenshot({
    path: folder + '/court-season-report.png',
    fullPage: true,
  });
  await click('continue-court');
  await drain();
  g = await saved();
  assert.ok(g.courtWork.initiatives[0].reports.length > startingReports);
  await page.locator('[data-tab="court"]').click();
  assert.match(await page.locator('.personal-time').innerText(), /2 of 2/);
  await page.setViewportSize({ width: 360, height: 900 });
  await fit();
  await page.screenshot({
    path: folder + '/mobile-court-work.png',
    fullPage: true,
  });
  const empty = make();
  const risky = encounter(
    empty,
    (s) =>
      s.category === 'decision' &&
      s.options.some((o) => o.failure.courtHealth < 0),
  );
  for (const p of empty.court) p.status = 'departed';
  empty.resources.gold = 0;
  prepareAudience(empty);
  await load(empty);
  await fit();
  assert.equal(await page.locator('#audience-agent option').count(), 1);
  assert.ok(await page.locator('.decision-option:not(:disabled)').count());
  const safe = eventOptions(empty).find((o) => !o.disabled && o.cost === 0);
  await choose(safe.id);
  assert.equal((await saved()).seasonal.events.at(-1).status, 'settled');
  assert.deepEqual(errors, []);
  console.log(
    'Seasonal and court browser checks passed: automatic rewards once, lasting gifts/Treasury, uncertain choices and actual delegates, hero arrival, free attention/time budget, initiative reports through an actual season, saves and mobile play without a court.',
  );
} finally {
  await browser.close();
}
