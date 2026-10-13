import { tickSeasonal } from '../src/seasonal.js';
import { tickCourtWork } from '../src/court-initiatives.js';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import {
  createGame,
  eventOptions,
  resolveEvent,
  getDecision,
} from '../src/game.js';
import { serializeGame } from '../src/persistence.js';
const { chromium } = await import(
  process.env.LINEAGE_PLAYWRIGHT_MODULE || 'playwright'
);
const browser = await chromium.launch({
  executablePath: process.env.LINEAGE_CHROMIUM || undefined,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } }),
  errors = [],
  audits = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('response', (r) => {
  if (r.status() >= 400) errors.push(r.status() + ' ' + r.url());
});
const url = process.env.LINEAGE_URL || 'http://localhost:3000',
  folder = process.env.LINEAGE_GALLERY_DIR || '/tmp/lineage-053-review';
await mkdir(folder, { recursive: true });
const click = (action) =>
  page
    .locator('[data-action="' + action + '"]')
    .filter({ visible: true })
    .first()
    .click();
const close = () => page.keyboard.press('Escape');
async function audit(name, screenshot = false, hover = false) {
  if (!hover) await page.mouse.move(1, 1);
  await page.waitForTimeout(180);
  const result = await page.evaluate(() => {
    const root =
        document.querySelector('dialog[open]') ||
        document.querySelector('#app'),
      failures = [];
    let checked = 0,
      imageLabels = 0;
    const rgb = (c) => {
      const m = c.match(/[\d.]+/g);
      return m ? m.map(Number) : [0, 0, 0, 0];
    };
    const mix = (a, b) =>
      a.slice(0, 3).map((n, i) => n * (a[3] ?? 1) + b[i] * (1 - (a[3] ?? 1)));
    const luminance = (c) =>
      c
        .map((n) => {
          const s = n / 255;
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        })
        .reduce((s, n, i) => s + n * [0.2126, 0.7152, 0.0722][i], 0);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const el = node.parentElement;
      if (
        !node.textContent.trim() ||
        !el ||
        !el.getClientRects().length ||
        el.closest('svg, option, button:disabled, [hidden]')
      )
        continue;
      if (getComputedStyle(el).visibility === 'hidden') continue;
      const range = document.createRange();
      range.selectNode(node);
      if (!range.getBoundingClientRect().width) continue;
      if (el.closest('.hero-caption, .creation-art-caption, .place-painting')) {
        imageLabels++;
        continue;
      }
      const ancestors = [];
      for (let p = el; p; p = p.parentElement) ancestors.push(p);
      let bg = [33, 26, 20];
      for (const p of ancestors.reverse())
        bg = mix(rgb(getComputedStyle(p).backgroundColor), bg);
      const css = getComputedStyle(el),
        fg = mix(rgb(css.color), bg),
        ratio =
          (Math.max(luminance(fg), luminance(bg)) + 0.05) /
          (Math.min(luminance(fg), luminance(bg)) + 0.05);
      const threshold =
        parseFloat(css.fontSize) >= 24 ||
        (parseFloat(css.fontSize) >= 18.66 && Number(css.fontWeight) >= 700)
          ? 3
          : 4.5;
      checked++;
      if (ratio < threshold)
        failures.push({
          text: node.textContent.trim().slice(0, 75),
          class: el.className,
          foreground: css.color,
          background: bg,
          ratio: +ratio.toFixed(2),
          required: threshold,
        });
    }
    return {
      checked,
      imageLabels,
      failures: failures.filter(
        (f, i, a) =>
          a.findIndex(
            (x) =>
              x.class === f.class &&
              x.foreground === f.foreground &&
              x.background.join() === f.background.join(),
          ) === i,
      ),
    };
  });
  audits.push({ name, ...result });
  if (screenshot)
    await page.screenshot({
      path: folder + '/' + name + '.png',
      fullPage: true,
    });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    name + ' must fit the viewport',
  );
}
async function load(g) {
  await page.evaluate(
    (save) => localStorage.setItem('lineage-save', save),
    serializeGame(g),
  );
  await page.goto(url);
  await page.locator('.save-menu summary').click();
  await click('load');
}
try {
  await page.goto(url);
  await audit('creation', true);
  for (let i = 0; i < 7; i++) await click('next');
  await click('tutorial-skip');
  await audit('opening-audience', true);
  assert.equal(await page.locator('.advisor-voice').count(), 2);
  assert.ok((await page.locator('.decision-option').count()) >= 5);
  await page.locator('dialog [data-choice="stone"]').click();
  await audit('ruling', true);
  await page.locator('dialog .outcome-ledger summary').click();
  await audit('ruling-ledger');
  await close();
  const g = createGame({
    scale: 'town',
    race: 'Beastfolk',
    species: 'Fox',
    seed: 914,
    history: 'Inherited',
  });
  resolveEvent(g, 'decline');
  g.event = null;
  g.pending = [];
  g.tutorial.complete = true;
  g.resources.gold = 155.6;
  g.court[2].status = 'departed';
  await load(g);
  assert.match(await page.locator('.resource-ribbon').innerText(), /156 gold/);
  for (const tab of [
    'council',
    'court',
    'treasury',
    'realm',
    'adventures',
    'lineage',
  ]) {
    await page.locator('[data-tab="' + tab + '"]').click();
    await audit(tab, true);
    if (tab === 'council') {
      await page.locator('[data-tab="council"]').hover();
      await audit('nav-hover', false, true);
    }
  }
  await click('person');
  await audit('character', true);
  await close();
  await page.locator('[data-tab="realm"]').click();
  for (const action of ['faction', 'family', 'site']) {
    await click(action);
    await audit(action, true);
    await close();
  }
  await page.locator('.save-menu summary').click();
  await click('chronicle');
  await audit('chronicle', true);
  await click('entry');
  await audit('chronicle-entry');
  await close();
  await close();
  await page.locator('.save-menu summary').click();
  await click('promises');
  await audit('promises');
  await close();
  await page.locator('[data-tab="council"]').click();
  await click('advance');
  await audit('season-forecast', true);
  await page.locator('dialog .decision-option').first().hover();
  await audit('decision-hover', false, true);
  assert.equal(await page.locator('.advisor-voice').count(), 2);
  await close();
  g.event = structuredClone(
    g.storyDeck.find((e) => e.archetype === 'clinic-fever'),
  );
  await load(g);
  await audit('fever-audience', true);
  await page
    .locator('dialog .advisor-council')
    .screenshot({ path: folder + '/advisor-council.png' });
  const recommendations = await page
    .locator('.advisor-recommends')
    .allTextContents();
  assert.ok(recommendations.every((s) => !s.includes('undefined')));
  await page.locator('dialog [data-choice="quarantine"]').click();
  await audit('fever-result');
  await close();
  await page.setViewportSize({ width: 360, height: 900 });
  for (const tab of [
    'council',
    'court',
    'treasury',
    'realm',
    'adventures',
    'lineage',
  ]) {
    await page.locator('[data-tab="' + tab + '"]').click();
    await audit('mobile-' + tab, tab === 'treasury');
  }
  g.event = structuredClone(
    g.storyDeck.find((e) => e.archetype === 'refugee-caravan'),
  );
  await load(g);
  await audit('mobile-audience', true);
  // Exercise the new reading surfaces with actual simulated encounters and work.
  const own = createGame({
    seed: 81,
    scale: 'town',
    race: 'Beastfolk',
    history: 'Inherited',
  });
  resolveEvent(own, 'decline');
  own.tutorial.complete = true;
  for (const p of own.court) {
    p.wealth = 80;
    p.health = 90;
    p.loyalty = 80;
    p.morale = 80;
    for (const k of Object.keys(p.skills)) p.skills[k] = 80;
  }
  for (let n = 0; n < 30 && !own.courtWork.initiatives.length; n++) {
    own.turn++;
    tickCourtWork(own);
  }
  own.resources.gold = 0;
  await page.setViewportSize({ width: 1440, height: 1100 });
  await load(own);
  await audit('council-own-work', true);
  await page.locator('[data-tab="court"]').click();
  await audit('court-own-work', true);
  await page.locator('[data-type="initiative"]').first().click();
  await audit('initiative-response', true);
  await page.locator('[data-choice="encourage"]').click();
  await audit('initiative-encouragement');
  await close();
  await page.setViewportSize({ width: 360, height: 900 });
  await page.locator('[data-tab="court"]').click();
  await audit('mobile-own-work', true);
  for (const category of ['positive', 'negative', 'mixed', 'decision']) {
    const news = createGame({
      seed: 81,
      scale: 'town',
      race: 'Beastfolk',
      history: 'Inherited',
    });
    resolveEvent(news, 'decline');
    news.tutorial.complete = true;
    news.resources.gold = 500;
    for (let n = 0; n < 1500; n++) {
      news.turn++;
      const e = tickSeasonal(news);
      if (!e) continue;
      news.event = e;
      const h = news.seasonal.events.at(-1);
      if (
        h.category === category &&
        (category !== 'positive' || h.definition.special?.kind === 'boon')
      )
        break;
      const o = eventOptions(news).find(
        (o) => !o.disabled && o.cost <= news.resources.gold,
      );
      assert.ok(resolveEvent(news, o.id).ok);
    }
    assert.equal(news.event.seasonal.category, category);
    await page.setViewportSize({ width: 1440, height: 1100 });
    await load(news);
    await audit('seasonal-' + category, true);
    if (category === 'positive') {
      await page.locator('[data-choice="record"]').click();
      await audit('seasonal-recorded');
      await close();
      await page.locator('[data-tab="adventures"]').click();
      await audit('public-magical-gifts', true);
    }
    if (category === 'decision') {
      await page.setViewportSize({ width: 360, height: 900 });
      await audit('mobile-seasonal-decision', true);
    }
  }
  await writeFile(
    folder + '/contrast-audit.json',
    JSON.stringify(audits, null, 2),
  );
  const failures = audits.flatMap((a) =>
    a.failures.map((f) => ({ screen: a.name, ...f })),
  );
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        screens: audits.length,
        textChecks: audits.reduce((n, a) => n + a.checked, 0),
        failures,
      },
      null,
      2,
    ),
  );
  assert.equal(
    failures.length,
    0,
    'Reading text must meet WCAG AA contrast; image captions are inspected separately',
  );
} finally {
  await browser.close();
}
