import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  parseSave,
  advance,
  resolveEvent,
  eventOptions,
} from '../src/game.js';
import { realmDemographics, apportionPopulation } from '../src/demographics.js';
import { portraitMarkup } from '../src/portraits.js';
const make = (race = 'Beastfolk', scale = 'town') =>
  createGame({
    race,
    scale,
    seed: 1421,
    history: 'Inherited',
    species: 'Otter',
  });
test('the selected people form a majority alongside real minorities in town and province', () => {
  for (const race of ['Human', 'Elf', 'Orc', 'Beastfolk'])
    for (const scale of ['town', 'province']) {
      const g = make(race, scale),
        counts = realmDemographics(g),
        share = counts[race] / g.resources.population;
      assert.ok(share > 0.55 && share < 0.85);
      assert.ok(Object.values(counts).filter((n) => n > 0).length >= 6);
      assert.ok(g.court.some((p) => p.race !== race));
      assert.ok(g.applicants.some((p) => p.race !== race));
      assert.notDeepEqual(
        g.settlements.forest.demographics,
        g.settlements.mountains.demographics,
      );
    }
});
test('individual portrait recipes create different visual compositions and preserve them through saves', () => {
  const g = make('Human'),
    all = Object.values(g.people),
    ids = new Set(),
    visual = new Set();
  for (const p of all) {
    const r = p.portraitRecipe;
    ids.add(r.id);
    visual.add(
      JSON.stringify([
        r.face,
        r.width,
        r.height,
        r.angle,
        r.crop,
        r.garment,
        r.color,
        r.headwear,
        r.accessory,
        r.scar,
        r.backdrop,
        r.hair,
      ]),
    );
  }
  assert.equal(ids.size, all.length);
  assert.equal(visual.size, all.length);
  const restored = parseSave(JSON.stringify(g));
  assert.equal(portraitMarkup(restored.ruler), portraitMarkup(g.ruler));
  assert.match(
    portraitMarkup(g.court[0]),
    /assets\/(campaign-portraits(?:-hair)?|face-variants|human-faces|fantasy-faces-[a-d]|beast-faces-[a-d](?:-hair)?)\.(png|webp)/,
  );
});
test('an explicitly chosen Beastfolk ruler heritage does not make the court uniform', () => {
  const g = make();
  assert.equal(g.ruler.species, 'Otter');
  assert.ok(new Set(g.court.map((p) => p.species || p.race)).size >= 3);
  assert.ok(g.court.some((p) => p.race !== 'Beastfolk'));
});
test('population apportionment never creates a negative minority or loses people', () => {
  let counts = { Human: 310, Elf: 40, Dwarf: 80, Goblin: 40, Beastfolk: 40 };
  for (let population = 510; population < 1800; population++) {
    counts = apportionPopulation(population, counts);
    assert.equal(
      Object.values(counts).reduce((a, n) => a + n, 0),
      population,
    );
    assert.ok(Object.values(counts).every((n) => n >= 0));
  }
});
test('welcoming migration changes the census and preserves valid totals', () => {
  const g = make();
  resolveEvent(g, 'decline');
  g.policies.tax = 'gentle';
  g.resources.food = 1000;
  g.resources.gold = 1000;
  g.storyCursor = g.storyDeck.length;
  const before = realmDemographics(g);
  for (let n = 0; n < 24; n++) {
    while (g.event)
      resolveEvent(
        g,
        eventOptions(g)
          .filter((o) => !o.disabled && o.cost <= g.resources.gold)
          .at(-1).id,
      );
    advance(g);
  }
  assert.notDeepEqual(realmDemographics(g), before);
  assert.equal(
    Object.values(realmDemographics(g)).reduce((a, n) => a + n, 0),
    g.resources.population,
  );
  assert.ok(g.archive.some((e) => e.kind === 'migration'));
});
test('portraits keep the person identity when their appearance intentionally ages', () => {
  const g = make(),
    p = g.court[0],
    id = p.portraitRecipe.id,
    seed = p.portraitRecipe.seed,
    young = portraitMarkup(p);
  p.age = 77;
  const old = portraitMarkup(p);
  assert.equal(p.portraitRecipe.id, id);
  assert.equal(p.portraitRecipe.seed, seed);
  assert.notEqual(old, young);
});
