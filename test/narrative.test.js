import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  enact,
  resolveEvent,
  advance,
  parseSave,
} from '../src/game.js';
import { describeChange, narrativeForRecord } from '../src/narrative.js';
import { serializeGame } from '../src/persistence.js';
import { outcomeView, entryView, seasonReportView } from '../src/reports-ui.js';
const make = () => {
  const g = createGame({
    seed: 917,
    race: 'Human',
    scale: 'town',
    history: 'Inherited',
  });
  resolveEvent(g, 'decline');
  g.resources.gold = 500;
  g.resources.food = 500;
  g.storyCursor = g.storyDeck.length;
  return g;
};
test('actual before-and-after values distinguish improved trust, worsening grievance, losses and neutral caps', () => {
  const g = make(),
    t = {
      scope: 'person',
      id: g.court[0].id,
      name: 'Saren Sunwhisker',
      record: 'record-2',
    };
  assert.match(
    describeChange(g, { ...t, field: 'trust', before: 50, after: 53 }),
    /trust.*grown|trust.*deepened/,
  );
  assert.match(
    describeChange(g, { ...t, field: 'grievance', before: 10, after: 30 }),
    /resentment.*greatly.*deepened|resentment.*much harder|resentment.*greatly.*sharper/,
  );
  assert.match(
    describeChange(g, { ...t, field: 'trust', before: 60, after: 20 }),
    /waned.*suspicion/,
  );
  assert.match(
    describeChange(g, { ...t, field: 'trust', before: 100, after: 100 }),
    /no further change/,
  );
  assert.match(
    describeChange(g, { ...t, field: 'wealth', before: 5, after: 0 }),
    /fewer resources|personal cost|less coin/,
  );
  assert.match(
    describeChange(g, {
      scope: 'realm',
      field: 'food',
      before: 1000,
      after: 1000,
      record: 'r',
    }),
    /unchanged/,
  );
});
test('skill mastery and recovery use the historical threshold rather than today’s state', () => {
  const g = make(),
    p = g.court[0],
    t = { scope: 'person', id: p.id, name: p.name, record: 'r' };
  p.health = 100;
  p.skills.scholarship = 15;
  assert.match(
    describeChange(g, { ...t, field: 'health', before: 20, after: 30 }),
    /gravest/,
  );
  assert.match(
    describeChange(g, { ...t, field: 'scholarship', before: 79, after: 81 }),
    /master/,
  );
  const line = describeChange(g, {
    ...t,
    field: 'health',
    before: 70,
    after: 73,
  });
  p.health = 0;
  assert.equal(
    describeChange(g, { ...t, field: 'health', before: 70, after: 73 }),
    line,
  );
});
test('completed decisions store personal and political transitions accurately through save migration', () => {
  const g = make(),
    p = g.court[0];
  const before = p.wealth;
  enact(g, 'reward', p.id, 'stipend');
  const e = g.archive.find((e) => e.id === g.lastOutcome.entry),
    t = e.transitions.find((t) => t.id === p.id && t.field === 'wealth');
  assert.equal(t.before, before);
  assert.equal(t.after, before + 10);
  assert.equal(t.change, 10);
  assert.ok(e.transitions.some((t) => t.field === 'morale'));
  const restored = parseSave(serializeGame(g));
  assert.deepEqual(narrativeForRecord(restored, e), narrativeForRecord(g, e));
  const html = outcomeView(g);
  assert.match(html, /narrative-outcome/);
  assert.match(html, /<details class="outcome-ledger">/);
  assert.match(entryView(g, e.id), /narrative-outcome/);
});
test('wording is deterministic and varied without consuming the simulation random stream', () => {
  const g = make(),
    rng = g.rng,
    t = { scope: 'realm', field: 'food', before: 10, after: 30 };
  const lines = new Set(
    Array.from({ length: 20 }, (_, i) =>
      describeChange(g, { ...t, record: 'r-' + i }),
    ),
  );
  assert.ok(lines.size >= 2);
  assert.equal(g.rng, rng);
});
test('a seasonal report includes actual counsel costs and keeps numbers in a closed ledger', () => {
  const g = make(),
    gold = g.resources.gold;
  enact(g, 'season', null, 'people');
  const t = g.lastSeasonReport.transitions.find(
    (t) => t.scope === 'realm' && t.field === 'gold',
  );
  assert.equal(t.before, gold);
  assert.equal(t.after, g.resources.gold);
  assert.match(seasonReportView(g), /outcome-ledger/);
});
test('an old delta-only record does not invent a historical starting value', () => {
  const g = make(),
    e = {
      id: 'old',
      effects: { food: -4 },
      changes: [{ person: g.court[0].id, field: 'trust', change: 3 }],
    };
  g.court[0].trust = 0;
  assert.match(narrativeForRecord(g, e)[1].text, /grown|deepened/);
  assert.ok(!narrativeForRecord(g, e)[1].text.includes('suspicion'));
});
test('forged before-and-after records are rejected on import', () => {
  const g = make();
  enact(g, 'reward', g.court[0].id, 'stipend');
  g.archive.at(-1).transitions[0].after = 99999;
  assert.throws(() => parseSave(serializeGame(g)));
});
test('mentorship reports actual mutual trust between named people without attributing it to the throne', () => {
  const g = make(),
    student = g.court[0],
    teacher = g.court[1];
  student.skills.scholarship = 20;
  teacher.skills.scholarship = 90;
  assert.ok(enact(g, 'mentorship', student.id, 'scholarship', teacher.id).ok);
  for (let n = 0; n < 2; n++) {
    while (g.event) {
      const o = g.event.options
        .filter((o) => !o.disabled && o.cost <= g.resources.gold)
        .at(-1);
      resolveEvent(g, o.id);
    }
    advance(g);
  }
  const e = g.archive
    .filter((e) => e.transitions?.some((t) => t.scope === 'relationship'))
    .at(-1);
  assert.ok(e);
  const lines = narrativeForRecord(g, e).filter(
    (l) => l.scope === 'relationship',
  );
  assert.ok(
    lines.some(
      (l) => l.text.includes(student.name) && l.text.includes(teacher.name),
    ),
  );
  assert.ok(lines.every((l) => !l.text.includes('your rule')));
  assert.deepEqual(parseSave(serializeGame(g)).archive, g.archive);
});
