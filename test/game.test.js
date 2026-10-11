import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  delegate,
  advance,
  resolveEvent,
  eventOptions,
  parseSave,
  succession,
  cultivate,
  marry,
  enact,
  activeCourt,
  getDecision,
} from '../src/game.js';
const make = (scale = 'town') =>
  createGame({ scale, name: 'Test', race: 'Human', values: 'Harmony', history: 'Inherited' });
function answer(g) {
  while (g.event) {
    const choice = eventOptions(g).find((o) => o.cost <= g.resources.gold);
    assert.ok(choice, 'Every mandatory event has an affordable course');
    assert.ok(resolveEvent(g, choice.id).ok);
  }
}
test('town is easier than province and starts with distinct populations', () => {
  const t = make(),
    p = make('province');
  assert.ok(t.resources.happiness > p.resources.happiness);
  assert.ok(t.resources.security > p.resources.security);
  assert.ok(t.resources.population < p.resources.population);
});
test('commissions consume funds, reserve a councillor and resolve with skill growth', () => {
  const g = make();
  assert.equal(delegate(g, 'roads', 'mira'), true);
  assert.equal(g.resources.gold, 68);
  assert.equal(delegate(g, 'granary', 'mira'), false);
  advance(g);
  assert.equal(g.queue.length, 0);
  assert.equal(g.court[0].skills.stewardship, 80);
  assert.ok(g.resources.infrastructure > 45);
  assert.ok(g.court[0].memories.length);
});
test('audiences block the calendar until a real offered choice is resolved', () => {
  const g = make();
  advance(g);
  advance(g);
  assert.ok(g.event);
  assert.equal(advance(g), false);
  assert.equal(resolveEvent(g, 'nonexistent').ok, false);
  answer(g);
  assert.equal(g.event, null);
  assert.equal(advance(g), true);
});
test('marriage requires sustained mutual relationship across seasons', () => {
  const g = make();
  assert.equal(marry(g, 'mira'), false);
  assert.equal(cultivate(g, 'mira', 'bond'), true);
  assert.equal(cultivate(g, 'mira', 'bond'), false);
  advance(g);
  assert.equal(cultivate(g, 'mira', 'bond'), true);
  assert.equal(marry(g, 'mira'), true);
  assert.equal(g.spouse, 'mira');
});
test('named adult succeeds alive; disputed succession must be resolved', () => {
  const g = make();
  g.heir = 'mira';
  succession(g);
  assert.equal(g.ruler.name, 'Mira Ashwood');
  assert.equal(g.dynasty, 2);
  assert.equal(g.court[0].alive, true);
  assert.equal(g.court[0].status, 'ruler');
  const h = make();
  h.heir = 'brann';
  h.resources.legitimacy = 20;
  succession(h);
  assert.equal(h.event.type, 'succession');
  resolveEvent(h, 'concede');
  assert.equal(h.ruler.name, 'Brann Stonehand');
});
test('missing heir permits council choice, including a nominee after all retainers die', () => {
  const g = make();
  succession(g);
  assert.equal(g.event.type, 'vacancy');
  resolveEvent(g, 'sable');
  assert.equal(g.ruler.name, 'Sable Reed');
  const h = make();
  h.court.forEach((c) => (c.alive = false));
  succession(h);
  assert.ok(resolveEvent(h, 'council-nominee').ok);
  assert.ok(h.ruler.alive);
});
test('save roundtrip preserves deterministic next season', () => {
  const a = make(),
    b = parseSave(JSON.stringify(a));
  advance(a);
  advance(b);
  assert.deepEqual(a, b);
  assert.throws(() => parseSave('{}'));
});
test('120 seasons complete while indicators remain bounded', () => {
  const g = make();
  for (let i = 0; i < 120; i++) {
    answer(g);
    assert.ok(advance(g));
  }
  assert.equal(g.year, 31);
  for (const key of ['happiness', 'legitimacy', 'security', 'health', 'justice', 'ecology'])
    assert.ok(g.resources[key] >= 0 && g.resources[key] <= 100);
});
test('roads have mutually distinct social and environmental consequences', () => {
  const a = make(),
    b = make();
  assert.ok(enact(a, 'project', 'roads', 'villages', 'mira').ok);
  assert.ok(enact(b, 'project', 'roads', 'commerce', 'mira').ok);
  advance(a);
  advance(b);
  assert.ok(a.resources.happiness > b.resources.happiness);
  assert.ok(a.resources.ecology > b.resources.ecology);
  assert.ok(b.resources.trade > a.resources.trade);
});
test('hiring creates biography and bonds; duplicate and unaffordable hires do not mutate state', () => {
  const g = make();
  assert.ok(enact(g, 'hire', 'vesh', 'retainer').ok);
  assert.equal(activeCourt(g).length, 4);
  assert.equal(g.bonds.length, 6);
  const snapshot = JSON.stringify(g);
  assert.equal(enact(g, 'hire', 'vesh', 'retainer').ok, false);
  assert.equal(JSON.stringify(g), snapshot);
  g.resources.gold = 0;
  const s = JSON.stringify(g);
  assert.equal(enact(g, 'hire', 'liora', 'patronage').ok, false);
  assert.equal(JSON.stringify(g), s);
});
test('transfers replace officeholder and busy councillors cannot be dismissed', () => {
  const g = make();
  enact(g, 'transfer', 'sable', 'Steward');
  assert.equal(g.court[0].role, 'Councillor');
  assert.equal(g.court[2].role, 'Steward');
  delegate(g, 'roads', 'sable');
  const before = JSON.stringify(g);
  assert.equal(enact(g, 'dismiss', 'sable', 'disgrace').ok, false);
  assert.equal(JSON.stringify(g), before);
});
test('dismissal preserves the archive, removes service, and damages related ties when harsh', () => {
  const g = make();
  g.heir = 'mira';
  const trust = g.factions.find((f) => f.id === 'elves').grievance;
  assert.ok(enact(g, 'dismiss', 'mira', 'disgrace').ok);
  assert.equal(g.court[0].alive, true);
  assert.equal(activeCourt(g).length, 2);
  assert.equal(g.heir, null);
  assert.ok(g.factions.find((f) => f.id === 'elves').grievance > trust);
  assert.equal(delegate(g, 'roads', 'mira'), false);
});
test('edict effects recur across seasons and changing them twice in a season is prohibited', () => {
  const a = make(),
    b = make();
  enact(a, 'policy', null, 'heavy');
  enact(b, 'policy', null, 'gentle');
  assert.equal(enact(a, 'policy', null, 'balanced').ok, false);
  advance(a);
  advance(b);
  assert.ok(a.resources.gold > b.resources.gold);
  assert.ok(a.resources.happiness < b.resources.happiness);
});
test('audiences are always resolvable with an empty treasury', () => {
  const g = make();
  advance(g);
  advance(g);
  g.resources.gold = 0;
  assert.ok(eventOptions(g).some((o) => o.cost === 0));
  assert.ok(resolveEvent(g, 'postpone').ok);
  assert.equal(g.event, null);
});
test('adventure contracts reserve a company, return in time, and offer a relic decision', () => {
  const g = make();
  g.parties[0].skill = 100;
  g.parties[0].loyalty = 100;
  assert.ok(enact(g, 'expedition', 'abbey', 'careful', 'lanterns').ok);
  assert.equal(g.parties[0].status, 'away');
  assert.equal(enact(g, 'expedition', 'woods', 'bold', 'lanterns').ok, false);
  advance(g);
  assert.equal(g.missions.length, 1);
  advance(g);
  assert.equal(g.missions.length, 0);
  assert.equal(g.event.type, 'expedition');
  assert.ok(g.event.success);
  assert.ok(resolveEvent(g, 'keep').ok);
  assert.equal(g.treasures[0].id, 'spring');
  answer(g);
  const health = g.resources.health;
  advance(g);
  assert.ok(g.resources.health > health);
  assert.equal(enact(g, 'expedition', 'abbey', 'careful', 'lanterns').ok, false);
});
test('failed expedition records wounds; empty treasury still has an answer', () => {
  const g = make();
  g.parties[0].skill = 0;
  g.parties[0].loyalty = 0;
  enact(g, 'expedition', 'temple', 'bold', 'lanterns');
  g.rng = 99999;
  advance(g);
  assert.equal(g.event.type, 'expedition');
  assert.equal(g.event.success, false);
  assert.ok(g.parties[0].wounds > 0);
  g.resources.gold = 0;
  assert.ok(resolveEvent(g, 'blame').ok);
  assert.ok(g.parties[0].loyalty <= 0);
});
test('legacy version-one saves gain new systems without losing progress or pending commissions', () => {
  const old = make();
  old.version = 1;
  old.resources.gold = 47;
  old.year = 8;
  old.queue = [{ id: 'roads', who: 'mira' }];
  for (const k of [
    'families',
    'parties',
    'missions',
    'completed',
    'treasures',
    'pending',
    'diplomaticBonds',
    'policies',
    'lastEdict',
    'history',
  ])
    delete old[k];
  for (const k of ['health', 'learning', 'ecology', 'justice', 'faith']) delete old.resources[k];
  old.court.forEach((c) => {
    delete c.traits;
    delete c.memories;
    delete c.status;
  });
  const g = parseSave(JSON.stringify(old));
  assert.equal(g.version, 2);
  assert.equal(g.year, 8);
  assert.equal(g.resources.gold, 47);
  assert.equal(g.queue.length, 1);
  assert.equal(g.parties.length, 3);
  assert.ok(g.court[0].story);
  assert.ok(advance(g));
  assert.equal(g.queue.length, 0);
});
test('malformed save data is rejected and unknown decisions cannot alter the game', () => {
  const g = make();
  const copy = structuredClone(g);
  copy.resources.gold = 'lots';
  assert.throws(() => parseSave(JSON.stringify(copy)));
  const before = JSON.stringify(g);
  assert.equal(enact(g, 'project', 'roads', 'invalid', 'mira').ok, false);
  assert.equal(JSON.stringify(g), before);
  assert.ok(getDecision(g, 'project', 'roads').options.length >= 3);
});
test('audience decisions create delayed follow-up letters that preserve the chosen promise', () => {
  const g = make();
  advance(g);
  advance(g);
  const title = g.event.title;
  const option = eventOptions(g)[0];
  assert.ok(resolveEvent(g, option.id).ok);
  assert.equal(g.scheduled.length, 1);
  assert.ok(g.scheduled[0].text.includes(option.label));
  advance(g);
  assert.equal(g.event, null);
  advance(g);
  assert.equal(g.event.type, 'followup');
  assert.notEqual(g.event.title, title);
  assert.ok(resolveEvent(g, 'local').ok);
  assert.equal(g.scheduled.length, 0);
});
test('new petitioners replenish recruitment after existing candidates are hired', () => {
  const g = make();
  g.resources.gold = 500;
  for (const id of ['vesh', 'liora', 'kesh', 'orrin', 'tala'])
    assert.ok(enact(g, 'hire', id, 'retainer').ok);
  for (let i = 0; i < 4; i++) {
    answer(g);
    advance(g);
  }
  assert.ok(g.applicants.length > 5);
  assert.ok(g.applicants.some((a) => !g.court.some((c) => c.id === a.id)));
});
test('personal concerns become audiences and their choice changes the speaker', () => {
  const g = make();
  g.court[0].loyalty = 20;
  advance(g);
  advance(g);
  answer(g);
  advance(g);
  assert.equal(g.event.type, 'personal');
  const loyalty = g.court[0].loyalty;
  assert.ok(resolveEvent(g, 'support').ok);
  assert.ok(g.court[0].loyalty > loyalty);
  assert.ok(g.court[0].memories.some((m) => m.includes(g.log[0].split(':')[0])));
});
test('repeated diplomatic, family, and office decisions cannot be farmed in one season', () => {
  const g = make();
  assert.ok(enact(g, 'diplomacy', 'goblins', 'pressure').ok);
  assert.equal(enact(g, 'diplomacy', 'goblins', 'pressure').ok, false);
  assert.ok(enact(g, 'family', 'dawn', 'service').ok);
  assert.equal(enact(g, 'family', 'dawn', 'service').ok, false);
  assert.ok(enact(g, 'transfer', 'mira', 'Spymaster').ok);
  assert.equal(enact(g, 'transfer', 'mira', 'Steward').ok, false);
});
test('an officeholder with unfinished work cannot be displaced by another appointment', () => {
  const g = make();
  delegate(g, 'roads', 'mira');
  const before = JSON.stringify(g);
  assert.equal(enact(g, 'transfer', 'sable', 'Steward').ok, false);
  assert.equal(JSON.stringify(g), before);
});
test('broken nested chronicles are rejected before their UI can render', () => {
  for (const mutate of [
    (g) => {
      g.title = null;
    },
    (g) => {
      g.parties[0].name = null;
    },
    (g) => {
      g.event = { type: 'audience', title: 'broken', text: 'text', options: null };
    },
    (g) => {
      g.court[0].id = 'bad"id';
    },
    (g) => {
      g.treasures = [{ id: 'unknown-relic' }];
    },
  ]) {
    const g = make();
    mutate(g);
    assert.throws(() => parseSave(JSON.stringify(g)));
  }
});
