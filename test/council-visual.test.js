import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createGame,
  resolveEvent,
  eventOptions,
  getDecision,
  enact,
  advance,
  parseSave,
} from '../src/game.js';
import { serializeGame } from '../src/persistence.js';
import { decisionAdvice } from '../src/advisors.js';
import { issueChoices, projectStrategies } from '../src/decision-strategies.js';
import { generateEmergentEvent } from '../src/emergent.js';
import { createInstitution } from '../src/settlements.js';
import { gold } from '../src/format.js';
import { exactLedger } from '../src/narrative-ui.js';
import { treasuryView } from '../src/treasury-ui.js';
import { characterDevelopmentView } from '../src/characters-ui.js';
const make = () => {
  const g = createGame({
    seed: 914,
    scale: 'town',
    race: 'Beastfolk',
    species: 'Fox',
    history: 'Inherited',
  });
  resolveEvent(g, 'decline');
  g.resources.gold = 100;
  g.resources.food = 70;
  return g;
};
const answer = (g) => {
  let n = 0;
  while (g.event) {
    assert.ok(++n < 40);
    const o = eventOptions(g).find(
      (o) => !o.disabled && o.cost <= g.resources.gold,
    );
    assert.ok(resolveEvent(g, o.id).ok);
  }
};
test('reading advice is deterministic, offline and leaves the entire saved world and random stream unchanged', () => {
  const g = make(),
    d = getDecision(g, 'project', 'roads', g.court[0].id),
    before = serializeGame(g);
  const first = decisionAdvice(g, d, d.options, g.court[0]);
  assert.equal(first.length, 2);
  for (let i = 0; i < 40; i++)
    assert.deepEqual(decisionAdvice(g, d, d.options, g.court[0]), first);
  assert.equal(serializeGame(g), before);
  const loaded = parseSave(before);
  assert.deepEqual(
    decisionAdvice(loaded, d, d.options, loaded.court[0]),
    first,
  );
});
test('offices and convictions can disagree, while worsening hunger changes the recommendation', () => {
  const g = make();
  g.court = g.court.slice(0, 2);
  const [s, m] = g.court;
  s.role = 'Steward';
  s.traits = ['Compassionate'];
  s.skills.stewardship = 80;
  m.role = 'Marshal';
  m.traits = ['Ruthless'];
  m.skills.stewardship = 60;
  const d = {
    type: 'audience',
    options: [
      {
        id: 'grain',
        label: 'Buy grain',
        note: 'The watch gives up patrols to distribute grain.',
        cost: 10,
        effects: { food: 12, security: -2 },
      },
      {
        id: 'watch',
        label: 'Strengthen the watch',
        note: 'Soldiers consume some of the reserve.',
        cost: 10,
        effects: { security: 12, food: -3 },
      },
    ],
  };
  const voices = decisionAdvice(g, d);
  assert.equal(voices.find((v) => v.person === s.id).choice, 'grain');
  assert.equal(voices.find((v) => v.person === m.id).choice, 'watch');
  g.resources.food = 0;
  assert.equal(
    decisionAdvice(g, d).find((v) => v.person === m.id).choice,
    'grain',
  );
  assert.match(decisionAdvice(g, d)[0].commentary, /little margin/);
});
test('counsel excludes deceased, dismissed and conflicted people and never recommends a disabled or unaffordable answer', () => {
  const g = make();
  const extra = g.applicants[0];
  extra.status = 'serving';
  g.court.push(extra);
  const excluded = g.court[0];
  excluded.status = 'departed';
  g.court[1].alive = false;
  const d = {
    type: 'audience',
    target: g.court[2].id,
    options: [
      {
        id: 'expensive',
        label: 'Royal grant',
        note: 'A costly grant.',
        cost: 200,
        effects: { food: 80 },
      },
      {
        id: 'locked',
        label: 'Unavailable alliance',
        note: 'An alliance.',
        disabled: true,
        cost: 0,
        effects: { security: 90 },
      },
      {
        id: 'ration',
        label: 'Public rations',
        note: 'Shared limits.',
        cost: 0,
        effects: { food: 12 },
      },
    ],
  };
  const voices = decisionAdvice(g, d);
  assert.ok(voices.length);
  for (const v of voices) {
    assert.equal(v.choice, 'ration');
    assert.ok(![excluded.id, g.court[1].id, g.court[2].id].includes(v.person));
  }
  assert.deepEqual(
    decisionAdvice(g, { ...d, blocked: 'A hearing is waiting' }),
    [],
  );
  assert.deepEqual(
    decisionAdvice(g, { ...d, options: d.options.slice(0, 2) }),
    [],
  );
});
test('capped improvements do not become an advisor’s reason for choosing an otherwise costly answer', () => {
  const g = make();
  g.resources.learning = 100;
  const d = {
    type: 'audience',
    options: [
      {
        id: 'study',
        label: 'More study',
        note: 'Fund study.',
        cost: 12,
        effects: { learning: 20 },
      },
      {
        id: 'care',
        label: 'Offer care',
        note: 'Care for sick households.',
        cost: 4,
        effects: { health: 3 },
      },
    ],
  };
  const voices = decisionAdvice(g, d);
  assert.ok(voices.every((v) => v.choice === 'care'));
  assert.ok(
    voices.every((v) => !v.commentary.includes('knowledge that remains')),
  );
});
test('commercial counsel respects private funding requirements and the actual selected delegate', () => {
  const g = make(),
    p = g.court[0];
  p.wealth = 0;
  const d = getDecision(g, 'commercial', 'caravan', p.id);
  assert.ok(d.options.find((o) => o.id === 'shared').disabled);
  assert.ok(
    decisionAdvice(g, d, d.options, p).every((v) => v.choice !== 'shared'),
  );
  assert.equal(serializeGame(g), serializeGame(parseSave(serializeGame(g))));
});
test('all generated opening issues have tailored alternatives and older pending options remain resolvable', async () => {
  const g = make(),
    issues = g.storyDeck.filter(
      (e) => e.archetype && e.id.startsWith('incident-'),
    );
  assert.equal(issues.length, 36);
  for (const e of issues) {
    assert.ok(e.options.length >= 4, e.archetype);
    assert.equal(new Set(e.options.map((o) => o.id)).size, e.options.length);
    const old = e.options.slice(0, 3),
      enriched = issueChoices(e, old);
    assert.deepEqual(enriched.slice(0, 3), old);
    assert.deepEqual(issueChoices(e, enriched), enriched);
    assert.ok(
      enriched
        .slice(3)
        .every((o) => o.cost > 0 && Object.keys(o.effects).length),
    );
  }
  const old = parseSave(
    await readFile(
      new URL('./fixtures/version-four-town.json', import.meta.url),
      'utf8',
    ),
  );
  old.resources.gold = 100;
  const e = old.storyDeck.find((e) => e.archetype === 'broken-sluice');
  old.event = structuredClone(e);
  assert.ok(eventOptions(old).some((o) => o.id === 'bond'));
  assert.ok(resolveEvent(old, 'support').ok);
  assert.ok(parseSave(serializeGame(old)));
});
test('a new petition strategy spends its real cost, changes its stated resources and relationships, and records one linked aftermath', () => {
  const g = make();
  g.event = structuredClone(
    g.storyDeck.find((e) => e.archetype === 'clinic-fever'),
  );
  const id = g.event.id,
    before = structuredClone(g.resources),
    guild = g.factions.find((f) => f.id === 'guild'),
    grievance = guild.grievance;
  assert.ok(resolveEvent(g, 'quarantine').ok);
  assert.equal(g.resources.gold, before.gold - 9);
  assert.equal(g.resources.health, Math.min(100, before.health + 7));
  assert.equal(g.resources.trade, Math.max(0, before.trade - 4));
  assert.equal(guild.grievance, Math.min(100, grievance + 5));
  const record =
    g.archive.find((e) => e.target === id && e.choice === 'quarantine') ||
    g.archive.at(-1);
  assert.equal(record.choice, 'quarantine');
  const after = g.scheduled.find((e) => e.id === id + '-aftermath');
  assert.ok(after);
  assert.equal(after.origin, record.id);
  const saved = parseSave(serializeGame(g));
  saved.event = structuredClone(g.storyDeck.find((e) => e.id === id));
  const coin = saved.resources.gold,
    count = saved.scheduled.length;
  resolveEvent(saved, 'quarantine');
  assert.equal(saved.resources.gold, coin);
  assert.equal(saved.scheduled.length, count);
});
test('every extra project commissions real delegated work and preserves its direction through save and the result record', () => {
  for (const [id, o] of Object.entries(projectStrategies)) {
    const g = make();
    answer(g);
    const p = g.court[0];
    const before = g.resources.gold;
    assert.ok(enact(g, 'project', id, o.id, p.id).ok, id);
    assert.equal(g.resources.gold, before - o.cost);
    assert.equal(g.queue[0].approach, o.id);
    assert.deepEqual(g.queue[0].effects, o.effects);
    const source = g.queue[0].decisionId,
      loaded = parseSave(serializeGame(g));
    assert.ok(advance(loaded));
    const result = loaded.archive.find(
      (e) => e.type === 'project-result' && e.cause === source,
    );
    assert.ok(result);
    assert.equal(result.choice, o.id);
    assert.ok(Object.keys(result.effects).length);
    assert.ok(parseSave(serializeGame(loaded)));
  }
});
test('partial institution repair restores only the promised condition and retains the actual upkeep and founding history', () => {
  const g = make();
  g.turn = 12;
  const i = createInstitution(g, 'mill', 'fields', 'royal', 2, g.archive[0].id);
  i.condition = 35;
  g.event = generateEmergentEvent(g);
  assert.equal(g.event.template, 'institution');
  const budget = i.budget,
    source = i.source,
    coin = g.resources.gold;
  assert.ok(resolveEvent(g, 'stabilize').ok);
  assert.equal(i.condition, 50);
  assert.equal(i.budget, budget);
  assert.equal(i.source, source);
  assert.equal(g.resources.gold, coin - 8);
  assert.equal(i.status, 'active');
});
test('coin displays round consistently without losing fractional commercial or personal accounts in saved state', () => {
  const g = make();
  g.resources.gold = 150.6;
  g.court[0].wealth = 20.4;
  g.court[0].income = 3.8;
  assert.equal(gold(-0.4, true), '0');
  assert.equal(gold(1.5, true), '+2');
  assert.equal(gold(1234.6), '1,235');
  assert.match(treasuryView(g), /151 gold/);
  const p = characterDevelopmentView(g, g.court[0]);
  assert.match(p, /Personal wealth: 20 gold. Usual income: 4/);
  const ledger = exactLedger(g, {
    transitions: [
      { scope: 'realm', field: 'gold', before: 10.2, after: 15.7, change: 5.5 },
    ],
  });
  assert.match(ledger, /10 → 16 · \+6 gold/);
  assert.ok(!ledger.includes('15.7'));
  const loaded = parseSave(serializeGame(g));
  assert.equal(loaded.resources.gold, 150.6);
  assert.equal(loaded.court[0].wealth, 20.4);
});
test('emergency work relief buys food at a real cost to both public and local health', () => {
  const g = make();
  g.turn = 12;
  const local = g.settlements.fields;
  local.problems.push('food shortage');
  local.shortageEpisode = 1;
  g.event = generateEmergentEvent(g);
  assert.equal(g.event.template, 'shortage');
  const before = {
    coin: g.resources.gold,
    food: g.resources.food,
    health: g.resources.health,
    local: local.health,
  };
  assert.ok(resolveEvent(g, 'work-relief').ok);
  assert.equal(g.resources.gold, before.coin - 10);
  assert.equal(g.resources.food, before.food + 18);
  assert.equal(g.resources.health, Math.max(0, before.health - 2));
  assert.equal(local.health, Math.max(0, before.local - 2));
});
test('border counsel accounts for actual restitution to a distrustful foreign faction', () => {
  const g = make();
  g.turn = 12;
  const foreign = g.factions.find((f) => f.id === 'goblins');
  foreign.trust = 10;
  foreign.grievance = 80;
  const e = generateEmergentEvent(g);
  assert.equal(e.template, 'frontier');
  const p = g.court.find((p) => p.role === 'Ambassador');
  p.faction = 'goblins';
  const voices = decisionAdvice(g, e, e.options);
  const envoy = voices.find((v) => v.person === p.id);
  assert.ok(envoy);
  assert.equal(envoy.choice, 'reparation');
  assert.ok(envoy.commentary.includes(foreign.name));
});
test('succession advice weighs the actual losses from enforcement and the cost of lawful ratification', () => {
  const g = make();
  g.resources.military = 8;
  g.resources.happiness = 15;
  const d = {
    type: 'succession',
    options: [
      {
        id: 'enforce',
        label: 'Enforce the testament',
        note: 'The watch loses strength and public goodwill.',
        cost: 0,
        effects: {},
      },
      {
        id: 'council',
        label: 'Ratify the heir',
        note: 'A lawful hearing restores legitimacy.',
        cost: 12,
        effects: {},
      },
    ],
  };
  assert.ok(decisionAdvice(g, d).every((v) => v.choice === 'council'));
  g.resources.gold = 0;
  assert.ok(decisionAdvice(g, d).every((v) => v.choice === 'enforce'));
});
test('medical petition commentary draws on medical expertise rather than treating every faction issue as diplomacy', () => {
  const g = make(),
    e = g.storyDeck.find((e) => e.archetype === 'clinic-fever');
  const voices = decisionAdvice(g, e, e.options);
  assert.ok(voices.length);
  assert.ok(
    voices.every(
      (v) =>
        v.expertise.includes('medicine') || v.expertise.includes('limited'),
    ),
  );
  assert.ok(voices.every((v) => !v.expertise.includes('diplomacy')));
});
