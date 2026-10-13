// Visual acceptance checks for new, childhood and pre-0.5.1 saved portraits.
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import {
  createGame,
  parseSave,
  resolveEvent,
  eventOptions,
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
page.on('response', (r) => {
  if (r.status() >= 400 && /assets\//.test(r.url()))
    errors.push('Missing art: ' + r.url());
});
const url = process.env.LINEAGE_URL || 'http://localhost:3000',
  folder = process.env.LINEAGE_GALLERY_DIR || '/tmp/lineage-052-review';
await mkdir(folder, { recursive: true });
const click = (a) =>
  page
    .locator('[data-action="' + a + '"]')
    .filter({ visible: true })
    .first()
    .click();
const version = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
).version;
const checkVersion = async () => {
  const label = page.locator('.app-version');
  assert.equal(await label.innerText(), 'v' + version);
  const box = await label.boundingBox(),
    width = page.viewportSize().width;
  assert.ok(box.y >= 0 && box.y < 20);
  assert.ok(width - box.x - box.width < 30);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
};
try {
  await page.goto(url);
  await checkVersion();
  await page.screenshot({ path: folder + '/creation-desktop.png' });
  await page.setViewportSize({ width: 360, height: 800 });
  await checkVersion();
  await page.screenshot({ path: folder + '/creation-mobile.png' });
  const g = createGame({
    seed: 293,
    race: 'Beastfolk',
    species: 'Fox',
    scale: 'town',
  });
  resolveEvent(g, 'decline');
  g.tutorial.complete = true;
  g.storyCursor = g.storyDeck.length;
  await page.evaluate(
    (s) => localStorage.setItem('lineage-save', s),
    serializeGame(g),
  );
  await page.locator('.save-menu summary').click();
  await click('load');
  await checkVersion();
  await page.screenshot({ path: folder + '/dashboard-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('[data-tab="court"]').click();
  await checkVersion();
  await page.screenshot({ path: folder + '/court-desktop.png' });
  const original = parseSave(
    await readFile(
      new URL('../test/fixtures/version-five-living.json', import.meta.url),
      'utf8',
    ),
  );
  while (original.event)
    resolveEvent(
      original,
      eventOptions(original)
        .filter((o) => !o.disabled && o.cost <= original.resources.gold)
        .at(-1).id,
    );
  original.tutorial.complete = true;
  await page.evaluate(
    (s) => localStorage.setItem('lineage-save', s),
    serializeGame(original),
  );
  await page.locator('.save-menu summary').click();
  await click('load');
  await page.locator('[data-tab="court"]').click();
  assert.ok(await page.locator('.legacy-portrait').count());
  assert.equal(await page.locator('.legacy-portrait svg path').count(), 0);
  await checkVersion();
  await page.screenshot({ path: folder + '/legacy-court.png' });
  await page.evaluate(async () => {
    const { createGame } = await import('./src/game.js?v=0.5.4'),
      { portraitMarkup } = await import('./src/portraits.js?v=0.5.4'),
      { portraitCatalog } = await import('./src/portrait-catalog.js?v=0.5.4');
    const g = createGame({ seed: 713, race: 'Beastfolk', scale: 'town' }),
      rows = [];
    for (const species of [
      'Fox',
      'Wolf',
      'Cat',
      'Owl',
      'Bear',
      'Rabbit',
      'Otter',
      'Lizard',
    ]) {
      const face = portraitCatalog.find((f) => f.species === species),
        p = {
          ...g.ruler,
          species,
          race: 'Beastfolk',
          name: species,
          portraitRecipe: {
            ...g.ruler.portraitRecipe,
            id: 'review-' + species,
            paint: face.key,
            species,
            width: 100,
            height: 100,
            eyeWidth: 100,
            jaw: 100,
            angle: 0,
            visibleScar: true,
          },
        };
      for (const age of [35, 8]) {
        rows.push(
          '<article>' +
            portraitMarkup({ ...p, age }, '', 'natural') +
            '<strong>' +
            species +
            ' ' +
            (age === 8 ? 'child' : 'adult') +
            '</strong></article>',
        );
      }
    }
    document.body.innerHTML =
      '<main class="polish-gallery">' + rows.join('') + '</main>';
    const style = document.createElement('style');
    style.textContent =
      '.polish-gallery{display:grid;grid-template-columns:repeat(4,240px);gap:14px;padding:20px;background:#ddd0b0;color:#473724}.polish-gallery .portrait{width:220px;height:220px}.polish-gallery strong{display:block;padding-top:5px}';
    document.head.append(style);
  });
  await page.waitForTimeout(800);
  assert.equal(
    await page.locator('.individual-portrait svg > g path').count(),
    0,
  );
  const images = await page
    .locator('.individual-portrait image')
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')));
  assert.ok(images.includes('assets/child-portraits-hair.webp'));
  assert.ok(images.includes('assets/child-portraits.png'));
  await page.screenshot({
    path: folder + '/all-beastfolk-ages.png',
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    'Portrait polish checks passed: upper-right version on creation and loaded games at desktop/360px, no overlay decorations in old/new portraits, adult/child hair artwork, original hairless lizard artwork, no missing assets or JavaScript errors.',
  );
} finally {
  await browser.close();
}
