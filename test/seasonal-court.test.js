import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createGame,
  resolveEvent,
  eventOptions,
  advance,
  enact,
  getDecision,
  parseSave,
  succession,
  prepareAudience,
} from '../src/game.js';
import { serializeGame } from '../src/persistence.js';
import {
  seasonalCatalog,
  seasonalCategories,
  seasonalById,
} from '../src/seasonal-catalog.js';
import {
  seasonalChance,
  seasonalDraw,
  tickSeasonal,
  seasonalForecast,
  boonForecast,
  applySeasonalBoons,
  seasonalValid,
} from '../src/seasonal.js';
import {
  tickCourtWork,
  initiativeForecast,
  initiativeCatalog,
  personalTimeRemaining,
  courtWorkValid,
} from '../src/court-initiatives.js';
import { isBusy } from '../src/characters.js';
import { recordDeath } from '../src/living.js';
import { seasonProjection, applyEconomy } from '../src/economy.js';
const make = (seed = 81) => {
  const g = createGame({
    seed,
    scale: 'town',
    race: 'Beastfolk',
    history: 'Inherited',
  });
  resolveEvent(g, 'decline');
  g.resources.gold = 100;
  g.resources.food = 100;
  return g;
};
const answer = (g) => {
  let n = 0;
  while (g.event) {
    assert.ok(++n < 50);
    const o = eventOptions(g).find(
      (o) => !o.disabled && o.cost <= g.resources.gold,
    );
    assert.ok(o, g.event.title);
    assert.ok(resolveEvent(g, o.id).ok);
  }
};
const encounter = (g, predicate) => {
  const end = g.turn + 3000;
  for (let turn = g.turn + 1; turn <= end; turn++) {
    g.turn = turn;
    const e = tickSeasonal(g);
    if (e && predicate(seasonalById[g.seasonal.events.at(-1).catalogue], e)) {
      g.event = e;
      prepareAudience(g);
      return e;
    }
    if (e) {
      g.event = e;
      answer(g);
    }
  }
  throw Error('No matching event');
};
const startWork = (g, index = 0) => {
  const p = g.court[index];
  p.wealth = 80;
  p.health = 90;
  p.morale = 80;
  p.loyalty = 80;
  for (const key of Object.keys(p.skills)) p.skills[key] = 80;
  for (const other of g.court) if (other !== p) other.wealth = 0;
  for (let n = 0; n < 30; n++) {
    g.turn++;
    tickCourtWork(g);
    const i = g.courtWork.initiatives.find(
      (i) => i.person === p.id && i.status === 'active',
    );
    if (i) return i;
  }
  throw Error('No initiative');
};
test('the offline database has 208 distinct events and at least 50 in every requested category', () => {
  const g = make();
  assert.equal(seasonalCatalog.length, 208);
  assert.equal(new Set(seasonalCatalog.map((e) => e.id)).size, 208);
  assert.equal(new Set(seasonalCatalog.map((e) => e.title)).size, 208);
  for (const category of seasonalCategories)
    assert.ok(
      seasonalCatalog.filter((e) => e.category === category).length >= 50,
    );
  for (const e of seasonalCatalog) {
    assert.ok(g.settlements[e.site], e.id);
    assert.ok(e.text.length > 40, e.id);
    if (e.category === 'positive')
      assert.ok(
        Object.values(e.effects).every((n) => n > 0),
        e.id,
      );
    if (e.category === 'negative')
      assert.ok(
        Object.values(e.effects).every((n) => n < 0),
        e.id,
      );
    if (e.category === 'mixed') {
      assert.ok(Object.values(e.effects).some((n) => n > 0));
      assert.ok(Object.values(e.effects).some((n) => n < 0));
    }
    if (e.category === 'decision') {
      assert.equal(e.options.length, 3);
      assert.ok(e.options.some((o) => o.cost === 0));
      assert.ok(e.options.some((o) => o.chance < 1));
      assert.ok(e.options.every((o) => o.held));
    }
  }
  assert.equal(
    seasonalCatalog.filter((e) => e.special?.kind === 'hero').length,
    7,
  );
  assert.equal(
    seasonalCatalog.filter((e) => e.special?.kind === 'boon').length,
    9,
  );
});
test('the once-per-season lottery uses exactly 33%, a well-distributed deterministic draw and no simulation random stream', () => {
  assert.equal(seasonalChance, 0.33);
  let hits = 0;
  const categories = [0, 0, 0, 0];
  for (let seed = 1; seed <= 400; seed++)
    for (let turn = 1; turn <= 100; turn++) {
      if (seasonalDraw(seed, turn, 'chance') < seasonalChance) hits++;
      categories[Math.floor(seasonalDraw(seed, turn, 'category') * 4)]++;
    }
  assert.ok(Math.abs(hits / 40000 - 0.33) < 0.01);
  assert.ok(categories.every((n) => Math.abs(n / 40000 - 0.25) < 0.01));
  const g = make(),
    rng = g.rng;
  g.turn = 1;
  tickSeasonal(g);
  assert.equal(g.rng, rng);
  const before = serializeGame(g);
  tickSeasonal(g);
  tickSeasonal(g);
  assert.equal(serializeGame(g), before);
});
test('blocked seasonal advancement cannot create another event or consume a lottery roll', () => {
  const g = make();
  g.event = structuredClone(g.storyDeck.find((e) => e.dilemma));
  const before = serializeGame(g);
  assert.equal(advance(g), false);
  assert.equal(serializeGame(g), before);
});
test('an automatic event applies once; acknowledgement does not add coin, trust or another magical gift', () => {
  const g = make(),
    e = encounter(g, (s) => s?.category === 'positive'),
    resources = structuredClone(g.resources),
    people = Object.fromEntries(
      g.court.map((p) => [p.id, [p.trust, p.loyalty, p.health]]),
    ),
    count = g.seasonal.boons.length;
  assert.ok(resolveEvent(g, 'record').ok);
  assert.deepEqual(g.resources, resources);
  assert.deepEqual(
    Object.fromEntries(
      g.court.map((p) => [p.id, [p.trust, p.loyalty, p.health]]),
    ),
    people,
  );
  assert.equal(g.seasonal.boons.length, count);
  const length = g.archive.length;
  g.event = structuredClone(e);
  assert.ok(resolveEvent(g, 'record').ok);
  assert.deepEqual(g.resources, resources);
  assert.equal(g.archive.length, length);
});
test('the catalogue is drawn without replacement and delayed audiences survive a save before their decision', () => {
  let g = make();
  for (let n = 0; n < 60; n++) {
    answer(g);
    assert.ok(advance(g));
    g = parseSave(serializeGame(g));
  }
  assert.equal(new Set(g.seasonal.seen).size, g.seasonal.events.length);
  assert.ok(g.seasonal.events.length >= 10);
  assert.ok(seasonalValid(g));
});
test('uncertain decisions have the same actual outcome after save and load and never reroll on reopening', () => {
  const g = make(),
    e = encounter(g, (s) => s?.category === 'decision'),
    o = eventOptions(g).find((o) => o.cost === 0),
    copy = parseSave(serializeGame(g));
  assert.ok(resolveEvent(g, o.id).ok);
  assert.ok(resolveEvent(copy, o.id).ok);
  assert.deepEqual(g, copy);
  const resources = structuredClone(g.resources),
    n = g.archive.length;
  g.event = structuredClone(e);
  resolveEvent(g, o.id);
  assert.deepEqual(g.resources, resources);
  assert.equal(g.archive.length, n);
});
test('courtier skill and loyalty alter a seasonal decision’s chance without making uncertain approaches certain', () => {
  const g = make(),
    e = encounter(g, (s) => s?.category === 'decision'),
    o = eventOptions(g).find((o) => seasonalForecast(g, e, o).chance < 1),
    p = g.people[e.agent],
    skill = seasonalForecast(g, e, o).skill;
  p.skills[skill] = 10;
  p.loyalty = 10;
  const low = seasonalForecast(g, e, o).chance;
  p.skills[skill] = 95;
  p.loyalty = 95;
  const high = seasonalForecast(g, e, o).chance;
  assert.ok(high > low);
  assert.ok(high < 1);
});
test('risky choices produce both intended outcomes and setbacks across real seeds, not a deterministic expensive best answer', () => {
  const outcomes = new Set();
  for (let seed = 1; seed <= 16; seed++) {
    const g = make(seed);
    encounter(g, (s) => s?.category === 'decision');
    const o = eventOptions(g).find(
      (o) => seasonalForecast(g, g.event, o).chance < 1 && o.cost === 0,
    );
    assert.ok(resolveEvent(g, o.id).ok);
    outcomes.add(g.seasonal.events.at(-1).success);
  }
  assert.deepEqual(outcomes, new Set([true, false]));
});
test('a heroic figure retains a prepared name and portrait, joins without an entrance payment, and becomes a real paid courtier', () => {
  const g = make(),
    prepared = new Map(
      g.futurePeople.map((p) => [
        p.id,
        [p.name, structuredClone(p.portraitRecipe)],
      ]),
    ),
    goldBefore = [];
  const e = encounter(g, (s) => s?.special?.kind === 'hero'),
    h = g.seasonal.events.at(-1),
    r = g.archive.find((r) => r.id === h.source),
    hero = g.court.find((p) => r.people.includes(p.id) && prepared.has(p.id));
  assert.ok(hero);
  assert.equal(hero.name, prepared.get(hero.id)[0]);
  assert.deepEqual(hero.portraitRecipe, prepared.get(hero.id)[1]);
  assert.equal(hero.status, 'serving');
  assert.ok(hero.skills[seasonalById[h.catalogue].special.skill] >= 72);
  assert.equal(hero.income, 2);
  assert.ok(!g.futurePeople.some((p) => p.id === hero.id));
  const gold = g.resources.gold;
  resolveEvent(g, 'record');
  assert.equal(g.resources.gold, gold);
  assert.equal(parseSave(serializeGame(g)).people[hero.id].name, hero.name);
  assert.equal(
    seasonProjection(g).wages,
    g.court.filter((p) => p.alive && p.status === 'serving').length * 2,
  );
});
test('a heroic figure offers service as a candidate when every seat is filled rather than exceeding capacity', () => {
  const g = make();
  while (g.court.length < 8) {
    const p = g.applicants.find((p) => !g.court.some((c) => c.id === p.id));
    assert.ok(enact(g, 'hire', p.id, 'probation').ok);
    g.resources.gold = 100;
  }
  encounter(g, (s) => s?.special?.kind === 'hero');
  const h = g.seasonal.events.at(-1),
    r = g.archive.find((r) => r.id === h.source);
  assert.equal(g.court.filter((p) => p.status === 'serving').length, 8);
  assert.ok(
    r.people.some((id) =>
      g.applicants.some(
        (p) => p.id === id && !g.court.some((c) => c.id === id),
      ),
    ),
  );
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
test('magical boons recur once per economy tick, match food forecasts and persist through succession and saves', () => {
  const g = make();
  encounter(
    g,
    (s) => s?.special?.kind === 'boon' && s.special.field === 'food',
  );
  answer(g);
  const boon = g.seasonal.boons.find((b) => b.field === 'food'),
    before = g.resources.food;
  const p = seasonProjection(g);
  g.season = (g.season + 1) % 4;
  applyEconomy(g);
  assert.equal(g.resources.food, before + p.foodBalance);
  g.heir = g.kin.find((p) => p.alive && p.age >= 18).id;
  g.resources.legitimacy = 95;
  g.factions.find((f) => f.id === 'nobles').grievance = 0;
  succession(g);
  answer(g);
  assert.ok(g.seasonal.boons.some((b) => b.id === boon.id));
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
test('overlapping magical gifts have bounded aggregate effects', () => {
  const g = make();
  g.seasonal.boons = Array.from({ length: 20 }, (_, i) => ({
    id: 'test-' + i,
    field: i < 10 ? 'food' : 'health',
    amount: 0.5,
  }));
  assert.deepEqual(boonForecast(g), { food: 2, health: 1 });
  const food = g.resources.food,
    health = g.resources.health;
  applySeasonalBoons(g);
  assert.equal(g.resources.food, food + 2);
  assert.equal(g.resources.health, health + 1);
});
test('history-derived events use fresh actual causes after the authored catalogue rather than replaying completed entries', () => {
  const g = make();
  for (let n = 0; n < 1000; n++) {
    g.turn++;
    const e = tickSeasonal(g);
    if (e) {
      g.event = e;
      answer(g);
    }
  }
  assert.ok(g.seasonal.events.some((h) => h.generatedCause));
  assert.equal(new Set(g.seasonal.seen).size, g.seasonal.events.length);
  const pairs = g.seasonal.events
    .filter((h) => h.generatedCause)
    .map((h) => h.generatedCause + ':' + h.category);
  assert.equal(new Set(pairs).size, pairs.length);
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
test('personal attention works with no gold, has a shared time budget and cannot be repeated on one person', () => {
  const g = make();
  g.resources.gold = 0;
  assert.ok(
    getDecision(g, 'cultivate', g.court[0].id).options.every(
      (o) => o.cost === 0,
    ),
  );
  const trust = g.court[0].trust;
  assert.ok(enact(g, 'cultivate', g.court[0].id, 'listen').ok);
  assert.equal(g.court[0].trust, trust + 8);
  assert.equal(g.resources.gold, 0);
  assert.equal(enact(g, 'cultivate', g.court[0].id, 'listen').ok, false);
  assert.ok(enact(g, 'cultivate', g.court[1].id, 'mentor').ok);
  assert.equal(personalTimeRemaining(g), 0);
  assert.equal(enact(g, 'cultivate', g.court[2].id, 'honor').ok, false);
  g.turn++;
  assert.equal(personalTimeRemaining(g), 2);
  assert.ok(enact(g, 'cultivate', g.court[0].id, 'honor').ok);
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
test('living royal kin can receive free personal attention too', () => {
  const g = make(),
    p = g.kin[0];
  g.resources.gold = 0;
  assert.ok(enact(g, 'cultivate', p.id, 'listen').ok);
  assert.equal(p.lastCultivated, g.turn);
  assert.equal(g.resources.gold, 0);
});
test('every office has at least four initiatives with real skills, private costs and supported realm and settlement fields', () => {
  const g = make();
  for (const office of [
    'Steward',
    'Marshal',
    'Ambassador',
    'Spymaster',
    'Councillor',
  ])
    assert.ok(initiativeCatalog.filter((s) => s.role === office).length >= 4);
  for (const s of initiativeCatalog) {
    assert.ok(s.cost > 0);
    assert.equal(s.steps.length, 3);
    assert.ok(
      s.realm &&
        Object.entries(s.realm).every(
          ([k, n]) => Number.isFinite(g.resources[k]) && n > 0,
        ),
    );
    assert.ok(
      Object.keys(s.local).every((k) =>
        Number.isFinite(g.settlements.capital[k]),
      ),
      s.id,
    );
  }
});
test('a courtier initiates useful work using actual personal wealth while leaving others available', () => {
  const g = make(),
    gold = g.resources.gold,
    i = startWork(g),
    p = g.people[i.person];
  assert.equal(p.wealth, 80 - i.cost);
  assert.equal(g.resources.gold, gold);
  assert.ok(isBusy(g, p.id));
  assert.ok(
    g.court.some((p) => p.alive && p.status === 'serving' && !isBusy(g, p.id)),
  );
  assert.match(g.archive.find((r) => r.id === i.source).text, /own initiative/);
  assert.ok(courtWorkValid(g));
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
test('court initiative progress, reports, professional growth and completion match exactly after save and load', () => {
  const g = make(),
    i = startWork(g),
    p = g.people[i.person],
    skill = initiativeCatalog.find((s) => s.id === i.project).skill,
    old = p.skills[skill],
    copy = parseSave(serializeGame(g));
  for (let n = 0; n < 6; n++) {
    g.turn++;
    copy.turn++;
    tickCourtWork(g);
    tickCourtWork(copy);
    assert.deepEqual(copy, g);
  }
  assert.ok(['completed', 'partial'].includes(i.status));
  assert.ok(i.reports.length >= 4);
  assert.ok(p.skills[skill] > old);
  assert.ok(
    p.performance.some(
      (row) =>
        row.source === i.report && row.gain > 0 && Number.isFinite(row.score),
    ),
  );
  for (const id of i.reports.slice(1))
    assert.equal(g.archive.find((r) => r.id === id).cause, i.source);
  const before = serializeGame(g);
  tickCourtWork(g);
  assert.equal(serializeGame(g), before);
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
test('skills, loyalty, morale, connections and traits affect self-directed work', () => {
  const g = make(),
    p = g.court[0],
    s = initiativeCatalog.find((s) => s.role === p.role);
  p.skills[s.skill] = 45;
  p.loyalty = 35;
  p.morale = 40;
  p.connections = 10;
  p.traits = [];
  const weak = initiativeForecast(g, p, s);
  p.skills[s.skill] = 90;
  p.loyalty = 90;
  p.morale = 90;
  p.connections = 90;
  p.traits = ['Resourceful', 'Meticulous'];
  const strong = initiativeForecast(g, p, s);
  assert.ok(strong.score > weak.score);
  assert.ok(strong.chance > weak.chance);
  assert.ok(strong.chance < 1);
});
test('poor or disloyal courtiers and those already commissioned cannot start a private improvement', () => {
  const g = make();
  for (const p of g.court) {
    p.wealth = 0;
    p.loyalty = 20;
  }
  for (let n = 0; n < 40; n++) {
    g.turn++;
    tickCourtWork(g);
  }
  assert.equal(g.courtWork.initiatives.length, 0);
  const p = g.court[0];
  p.wealth = 80;
  p.loyalty = 80;
  g.queue.push({ id: 'roads', who: p.id, cost: 0 });
  for (let n = 0; n < 20; n++) {
    g.turn++;
    tickCourtWork(g);
  }
  assert.equal(g.courtWork.initiatives.length, 0);
});
test('the ruler can encourage a report for time, contribute materials, or end it without getting the spent funds back', () => {
  const g = make(),
    i = startWork(g),
    p = g.people[i.person],
    before = i.progress,
    gold = g.resources.gold,
    wealth = p.wealth;
  assert.ok(enact(g, 'initiative', i.id, 'encourage').ok);
  assert.ok(i.progress > before);
  assert.equal(personalTimeRemaining(g), 1);
  assert.equal(g.resources.gold, gold);
  assert.equal(enact(g, 'initiative', i.id, 'encourage').ok, false);
  g.turn++;
  assert.ok(enact(g, 'initiative', i.id, 'materials').ok);
  assert.equal(p.wealth, wealth + 6);
  assert.equal(g.resources.gold, gold - 6);
  g.turn++;
  assert.ok(enact(g, 'initiative', i.id, 'end').ok);
  assert.equal(i.status, 'ended');
  assert.equal(g.resources.gold, gold - 6);
  assert.equal(isBusy(g, p.id), false);
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
test('holding autonomy stops new starts while current progress continues', () => {
  const g = make(),
    i = startWork(g);
  assert.ok(enact(g, 'court-autonomy', null, 'held').ok);
  for (let n = 0; n < 15; n++) {
    g.turn++;
    tickCourtWork(g);
  }
  assert.ok(['completed', 'partial'].includes(i.status));
  assert.equal(g.courtWork.initiatives.length, 1);
});
test('death, a changed office or a new throne end private work without phantom completion or refunds', () => {
  for (const change of ['death', 'office', 'throne']) {
    const g = make(),
      i = startWork(g),
      p = g.people[i.person],
      wealth = p.wealth;
    if (change === 'death') recordDeath(g, p);
    if (change === 'office') p.role = 'Councillor';
    if (change === 'throne') {
      g.ruler = p;
      p.status = 'ruler';
    }
    const old = g.resources.infrastructure;
    g.turn++;
    tickCourtWork(g);
    assert.equal(i.status, 'ended');
    assert.equal(g.resources.infrastructure, old);
    if (change !== 'death') assert.equal(p.wealth, wealth);
    assert.equal(
      p.achievements.some(
        (a) =>
          a.source === i.report &&
          a.kind === 'a self-directed public improvement',
      ),
      false,
    );
  }
});
test('a successor inherits existing court initiatives and their causal reports', () => {
  const g = make(),
    i = startWork(g),
    founder = i.person;
  g.heir = g.kin.find((p) => p.alive && p.age >= 18).id;
  g.resources.legitimacy = 95;
  g.factions.find((f) => f.id === 'nobles').grievance = 0;
  succession(g);
  answer(g);
  for (let n = 0; n < 4; n++) {
    g.turn++;
    tickCourtWork(g);
  }
  assert.equal(i.person, founder);
  assert.ok(i.reports.length >= 4);
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
test('malformed seasonal and court-work references are rejected before reaching the UI', () => {
  const original = make();
  encounter(original, (s) => s?.category === 'decision');
  for (const corrupt of [
    (g) => (g.seasonal.lastTurn = g.turn + 1),
    (g) => (g.seasonal.events[0].source = 'missing'),
    (g) => (g.seasonal.events[0].catalogue = 'unknown'),
    (g) => (g.seasonal.events[0].actors.adviser = 'missing'),
    (g) => g.seasonal.seen.push(g.seasonal.seen[0]),
    (g) => (g.event.seasonal.category = 'unknown'),
    (g) => (g.personalTime.used = 100),
  ]) {
    const g = structuredClone(original);
    corrupt(g);
    assert.throws(() => parseSave(JSON.stringify(g)));
  }
  const work = make();
  startWork(work);
  for (const corrupt of [
    (g) => (g.courtWork.initiatives[0].project = 'unknown'),
    (g) => (g.courtWork.initiatives[0].person = 'missing'),
    (g) => (g.courtWork.initiatives[0].progress = 100),
    (g) => g.courtWork.initiatives[0].reports.push('missing'),
  ]) {
    const g = structuredClone(work);
    corrupt(g);
    assert.throws(() => parseSave(JSON.stringify(g)));
  }
});
test('a production save keeps known identities, portraits, business and history while gaining empty new systems', async () => {
  const raw = JSON.parse(
      await readFile(
        new URL('./fixtures/version-five-living.json', import.meta.url),
        'utf8',
      ),
    ),
    g = parseSave(JSON.stringify(raw));
  assert.equal(g.version, 5);
  assert.equal(g.simulationVersion, 10);
  assert.equal(g.seasonal.events.length, 0);
  assert.equal(g.courtWork.initiatives.length, 0);
  assert.equal(g.seasonal.lastTurn, g.turn);
  for (const [id, p] of Object.entries(raw.people))
    assert.equal(g.people[id].name, p.name);
  assert.deepEqual(g.archive, raw.archive);
  assert.deepEqual(parseSave(serializeGame(g)), g);
});

test('a small food boon cannot bypass a genuine shortage or be counted twice', () => {
  const g = make();
  encounter(
    g,
    (s) => s?.special?.kind === 'boon' && s.special.field === 'food',
  );
  answer(g);
  g.resources.food = 0;
  g.season = 0;
  applyEconomy(g);
  assert.equal(g.resources.food, 0);
  assert.ok(g.economyActual.foodBalance < 0);
});

test('a hero waiting for a full court can enter when a seat opens without an entrance fee', () => {
  const g = make();
  while (g.court.length < 8) {
    const p = g.applicants.find((p) => !g.court.some((c) => c.id === p.id));
    enact(g, 'hire', p.id, 'probation');
    g.resources.gold = 100;
  }
  encounter(g, (s) => s?.special?.kind === 'hero');
  answer(g);
  const hero = g.applicants.find(
    (p) => p.heroicService && !g.court.some((c) => c.id === p.id),
  );
  assert.ok(hero);
  assert.ok(enact(g, 'dismiss', g.court[0].id, 'release').ok);
  g.resources.gold = 0;
  assert.ok(enact(g, 'hire', hero.id, 'retainer').ok);
  assert.equal(g.resources.gold, 0);
  assert.equal(g.people[hero.id].status, 'serving');
  assert.deepEqual(parseSave(serializeGame(g)), g);
});

test('persisted event approaches remain authoritative and malformed definitions or magical gifts are rejected', () => {
  const g = make();
  encounter(g, (s) => s?.category === 'decision');
  assert.deepEqual(eventOptions(parseSave(serializeGame(g))), eventOptions(g));
  for (const corrupt of [
    (g) => (g.seasonal.events.at(-1).definition.options = null),
    (g) => (g.seasonal.events.at(-1).definition.skill = 'unknown'),
    (g) =>
      (g.seasonal.events.at(-1).definition.options[0].failure = {
        gold: Infinity,
      }),
    (g) =>
      (g.seasonal.events.at(-1).definition.options[0].values = ['unknown']),
    (g) => (g.seasonal.events.at(-1).definition.id = 'unknown'),
  ]) {
    const copy = structuredClone(g);
    corrupt(copy);
    assert.throws(() => parseSave(JSON.stringify(copy)));
  }
  const magic = make();
  encounter(magic, (s) => s?.special?.kind === 'boon');
  const copy = structuredClone(magic);
  copy.seasonal.boons.at(-1).amount = 25;
  assert.throws(() => parseSave(JSON.stringify(copy)));
});

test('magical coin is included in income, balance and the money available for wages exactly once', () => {
  const g = make();
  encounter(
    g,
    (s) => s?.special?.kind === 'boon' && s.special.field === 'gold',
  );
  answer(g);
  const gold = g.resources.gold,
    p = seasonProjection(g),
    copy = structuredClone(g);
  assert.ok(p.magicalIncome > 0);
  assert.equal(p.income, p.taxIncome + p.commercialIncome + p.magicalIncome);
  copy.seasonal.boons = copy.seasonal.boons.filter((b) => b.field !== 'gold');
  g.season = (g.season + 1) % 4;
  copy.season = g.season;
  applyEconomy(g);
  applyEconomy(copy);
  assert.equal(g.resources.gold, gold + p.balance);
  assert.equal(g.resources.gold - copy.resources.gold, p.magicalIncome);
  assert.equal(g.economyActual.income, p.income);
});
test('private initiatives do not take the last courtier available after other royal commitments', () => {
  const g = make();
  for (const p of g.court) {
    p.wealth = 80;
    p.health = 90;
    p.morale = 90;
    p.loyalty = 90;
    for (const k of Object.keys(p.skills)) p.skills[k] = 80;
  }
  g.queue = [
    { id: 'roads', who: g.court[0].id, cost: 0 },
    { id: 'farms', who: g.court[1].id, cost: 0 },
  ];
  for (let n = 0; n < 40; n++) {
    g.turn++;
    tickCourtWork(g);
  }
  assert.equal(g.courtWork.initiatives.length, 0);
  assert.equal(isBusy(g, g.court[2].id), false);
});
test('an intervention becomes the latest causal report and a dead founder cannot receive encouragement', () => {
  const g = make(),
    i = startWork(g);
  const r = enact(g, 'initiative', i.id, 'end');
  assert.ok(r.ok);
  assert.equal(i.report, r.entry);
  assert.equal(i.reports.at(-1), r.entry);
  assert.match(
    g.archive.find((r) => r.id === i.report).text,
    /ends the undertaking/,
  );
  assert.equal(g.archive.find((r) => r.id === i.report).cause, i.source);
  assert.deepEqual(parseSave(serializeGame(g)), g);
  const other = make(),
    w = startWork(other);
  recordDeath(other, other.people[w.person], 'illness');
  const before = serializeGame(other);
  assert.equal(enact(other, 'initiative', w.id, 'encourage').ok, false);
  assert.equal(serializeGame(other), before);
});
test('every seasonal decision leaves a free approach when no court member can accept danger', () => {
  const g = make();
  for (const p of g.court) p.status = 'departed';
  g.resources.gold = 0;
  const seen = new Set();
  for (let n = 0; n < 3000 && seen.size < 57; n++) {
    g.turn++;
    const e = tickSeasonal(g);
    if (!e) continue;
    g.event = e;
    for (const p of g.court) p.status = 'departed';
    prepareAudience(g);
    if (e.seasonal.category === 'decision') {
      seen.add(g.seasonal.events.at(-1).catalogue);
      assert.equal(e.agent, null);
      const options = eventOptions(g);
      assert.ok(
        options.some((o) => !o.disabled && o.cost === 0),
        e.title,
      );
      const risky = seasonalById[
        g.seasonal.events.at(-1).catalogue
      ]?.options.find(
        (o) => o.effects.courtHealth < 0 || o.failure.courtHealth < 0,
      );
      if (risky) assert.ok(options.find((o) => o.id === risky.id).disabled);
    }
    answer(g);
  }
  assert.ok([...seen].filter((id) => !id.startsWith('history-')).length === 57);
});
test('court advice weighs actual uncertain setbacks and reading it leaves the lottery and saved world unchanged', async () => {
  const { decisionAdvice } = await import('../src/advisors.js'),
    { seasonalDecision } = await import('../src/seasonal.js');
  const g = make();
  encounter(g, (s) => s?.category === 'decision');
  const h = g.seasonal.events.at(-1),
    [risk, safe, loss] = h.definition.options;
  for (const o of h.definition.options) {
    o.values = ['truth'];
    o.cost = 0;
    o.chance = 1;
    o.failure = {};
  }
  risk.effects = { health: 8 };
  risk.failure = { health: -1 };
  risk.chance = 0.6;
  safe.effects = { health: 4 };
  loss.effects = { health: -20 };
  const agent = g.people[g.event.agent];
  agent.skills[h.definition.skill] = 50;
  agent.loyalty = 50;
  g.resources.health = 50;
  const d = seasonalDecision(g, g.event),
    before = serializeGame(g),
    voices = decisionAdvice(g, d);
  assert.ok(voices.length);
  assert.ok(voices.every((v) => v.choice === risk.id));
  for (let n = 0; n < 5; n++) assert.deepEqual(decisionAdvice(g, d), voices);
  assert.equal(serializeGame(g), before);
  risk.failure = { health: -30 };
  assert.ok(
    decisionAdvice(g, seasonalDecision(g, g.event)).every(
      (v) => v.choice === safe.id,
    ),
  );
});

test('event chronology, magical definitions and the ownership of progress reports cannot be forged by damaged imports', () => {
  const g = make();
  encounter(g, (s) => s?.special?.kind === 'boon');
  for (const corrupt of [
    (g) => (g.seasonal.events.at(-1).definition.special.field = 'unknown'),
    (g) => (g.seasonal.events.at(-1).definition.special.amount = 20),
    (g) => (g.seasonal.lastTurn = g.seasonal.events.at(-1).turn - 1),
    (g) => (g.event.seasonal.actors.unknown = g.ruler.id),
  ]) {
    const c = structuredClone(g);
    corrupt(c);
    assert.throws(() => parseSave(JSON.stringify(c)));
  }
  const w = make();
  const i = startWork(w);
  w.turn++;
  tickCourtWork(w);
  for (const corrupt of [
    (g) => (g.courtWork.initiatives[0].reports[1] = g.archive[0].id),
    (g) => {
      g.courtWork.initiatives[0].status = 'ended';
      g.courtWork.initiatives[0].finished = g.turn + 2;
    },
    (g) => (g.courtWork.initiatives[0].report = g.archive[0].id),
    (g) => (g.courtWork.lastTurn = -1),
  ]) {
    const c = structuredClone(w);
    corrupt(c);
    assert.throws(() => parseSave(JSON.stringify(c)));
  }
});

test('a fatal seasonal setback records the actual delegate, place and causal ruling and stays final after loading', () => {
  let g, h, p;
  for (let seed = 1; seed <= 40; seed++) {
    g = make(seed);
    encounter(
      g,
      (s) =>
        s.category === 'decision' &&
        s.options.some((o) => o.failure.courtHealth < 0),
    );
    h = g.seasonal.events.at(-1);
    const risky = h.definition.options.find((o) => o.failure.courtHealth < 0);
    p = g.court[0];
    p.health = 1;
    g.resources.gold = 100;
    assert.ok(resolveEvent(g, risky.id, p.id).ok);
    if (!p.alive) break;
  }
  assert.equal(p.alive, false);
  const death = g.archive.find(
    (r) => r.kind === 'death' && r.people.includes(p.id),
  );
  assert.ok(death);
  assert.equal(death.cause, h.result);
  assert.equal(death.site, h.site);
  assert.equal(g.archive.find((r) => r.id === h.result).cause, h.source);
  const copy = parseSave(serializeGame(g));
  assert.equal(copy.people[p.id].alive, false);
  assert.equal(
    copy.archive.filter((r) => r.kind === 'death' && r.people.includes(p.id))
      .length,
    1,
  );
});
