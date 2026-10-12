// Manual visual review: same-race/species faces at ordinary profile size.
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(
  process.env.LINEAGE_PLAYWRIGHT_MODULE || 'playwright'
);
const browser = await chromium.launch({
  executablePath: process.env.LINEAGE_CHROMIUM || undefined,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 1150 } });
const folder = process.env.LINEAGE_GALLERY_DIR || '/tmp/lineage-galleries';
await mkdir(folder, { recursive: true });
try {
  await page.goto(process.env.LINEAGE_URL || 'http://localhost:3000');
  for (const [race, species] of [
    ['Human', null],
    ['Dwarf', null],
    ['Beastfolk', 'Fox'],
    ['Beastfolk', 'Wolf'],
  ]) {
    const distribution = await page.evaluate(
      async ({ race, species }) => {
        const { createGame } = await import('./src/game.js?v=0.5.2'),
          { newPerson } = await import('./src/characters.js?v=0.5.2'),
          { initializePortraits, portraitMarkup } =
            await import('./src/portraits.js?v=0.5.2');
        const g = createGame({ seed: 7186, race, species, scale: 'province' }),
          people = [];
        for (let i = 0; i < 16; i++)
          people.push(
            newPerson(g, {
              race,
              species,
              age: 24 + i * 3,
              gender: i % 2 ? 'Woman' : 'Man',
              role: 'Councilor',
              site: 'capital',
            }),
          );
        initializePortraits(g);
        document.body.innerHTML =
          '<main class="review-gallery" style="display:grid;grid-template-columns:repeat(4,240px);gap:14px;padding:20px;background:#ddd0b0">' +
          people
            .map(
              (p) =>
                '<article style="color:#3f3225">' +
                portraitMarkup(p, '', 'natural') +
                '<strong style="display:block">' +
                p.name +
                '</strong><small>' +
                p.race +
                ' ' +
                (p.species || '') +
                ' · ' +
                p.age +
                ' · ' +
                p.gender +
                '</small><p style="margin:0;font-size:12px">' +
                p.portraitRecipe.paintDescription +
                '</p></article>',
            )
            .join('') +
          '</main>';
        for (const el of document.querySelectorAll('.portrait')) {
          el.style.width = '224px';
          el.style.height = '224px';
        }
        return Object.fromEntries(
          [...new Set(people.map((p) => p.portraitRecipe.paint))].map((k) => [
            k,
            people.filter((p) => p.portraitRecipe.paint === k).length,
          ]),
        );
      },
      { race, species },
    );
    await page.waitForTimeout(800);
    const file = folder + '/' + (species || race).toLowerCase() + '.png';
    await page.screenshot({ path: file, fullPage: true });
    console.log(file, distribution);
  }
} finally {
  await browser.close();
}
