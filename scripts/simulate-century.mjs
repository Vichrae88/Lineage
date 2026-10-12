import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {
  createGame,
  enact,
  resolveEvent,
  eventOptions,
  parseSave,
  advance,
} from '../src/game.js';
import { serializeGame } from '../src/persistence.js';
import { realmDemographics } from '../src/demographics.js';
const results = [];
for (const scale of ['town', 'province']) {
  let g = createGame({
    seed: 72,
    race: 'Beastfolk',
    scale,
    history: 'Inherited',
    values: 'Compassion',
    disposition: 'Patient',
  });
  const started = performance.now(),
    opening = new Set(),
    emergent = new Set();
  const answer = () => {
    let guard = 0;
    while (g.event) {
      assert.ok(++guard < 30, 'A queue did not drain.');
      const e = g.event;
      if (e.engine === 'emergent') emergent.add(e.id);
      else opening.add(e.key);
      const o = eventOptions(g)
        .filter((o) => !o.disabled && o.cost <= g.resources.gold)
        .at(-1);
      assert.ok(o, 'No affordable decision.');
      assert.ok(resolveEvent(g, o.id).ok);
    }
  };
  answer();
  enact(g, 'policy', null, 'gentle');
  let unfed = 0;
  for (let turn = 0; turn < 400; turn++) {
    answer();
    if (turn === 1) enact(g, 'policy', null, 'restore');
    assert.ok(
      enact(g, 'season', null, g.resources.gold >= 4 ? 'people' : 'accounts')
        .ok,
    );
    if (!g.resources.food) unfed++;
    if (turn % 40 === 0) g = parseSave(serializeGame(g));
  }
  answer();
  g = parseSave(serializeGame(g));
  assert.equal(g.year, 101);
  assert.ok(emergent.size >= 20);
  assert.ok(Object.values(g.resources).every(Number.isFinite));
  assert.equal(
    Object.values(realmDemographics(g)).reduce((n, c) => n + c, 0),
    g.resources.population,
  );
  results.push({
    scale,
    seed: g.seed,
    year: g.year,
    reigns: g.dynasty,
    activePeople: Object.values(g.people).filter(
      (p) => p.alive && p.tier !== 'reserve',
    ).length,
    rememberedPeople: Object.keys(g.people).length,
    majorRecords: g.archive.length,
    uniqueEmergentPetitions: emergent.size,
    seasonsWithoutFood: unfed,
    gold: g.resources.gold,
    population: g.resources.population,
    food: g.resources.food,
    saveBytes: Buffer.byteLength(serializeGame(g)),
    elapsedMs: Math.round(performance.now() - started),
  });
}
console.log(JSON.stringify(results, null, 2));
