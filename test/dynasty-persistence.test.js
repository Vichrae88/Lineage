import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  advance,
  enact,
  resolveEvent,
  eventOptions,
  succession,
  parseSave,
} from '../src/game.js';
import { closeKin, courtCapacity, commissionCapacity } from '../src/dynasty.js';
import { serializeGame } from '../src/persistence.js';
import { acknowledgeBirth, recordDeath } from '../src/living.js';
import { newPerson } from '../src/characters.js';
const make = () => {
  const g = createGame({
    race: 'Human',
    scale: 'town',
    seed: 8412,
    history: 'Inherited',
  });
  resolveEvent(g, 'decline');
  g.resources.gold = 2000;
  g.resources.food = 2000;
  return g;
};
const answer = (g) => {
  let n = 0;
  while (g.event) {
    assert.ok(++n < 30);
    const o = eventOptions(g).find(
      (o) => !o.disabled && o.cost <= g.resources.gold,
    );
    assert.ok(o);
    assert.ok(resolveEvent(g, o.id).ok);
  }
};
test('the family register has actual parent, sibling and collateral links with no living parents', () => {
  const g = make();
  assert.equal(g.ruler.parentIds.length, 2);
  for (const id of g.ruler.parentIds) {
    assert.equal(g.people[id].alive, false);
    assert.ok(g.people[id].childIds.includes(g.ruler.id));
  }
  for (const k of g.kin) {
    assert.ok(closeKin(g, g.ruler, k));
    if (['Brother', 'Sister'].includes(k.kinship))
      assert.deepEqual(k.parentIds, g.ruler.parentIds);
  }
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
test('an unrelated person sharing a house name is not treated as a blood relative', () => {
  const g = make(),
    p = newPerson(g, { house: g.ruler.house });
  assert.equal(closeKin(g, g.ruler, p), false);
});
test('birth creates a real branch, inherited features and family membership; it does not create a trained adult', () => {
  const g = make(),
    a = g.ruler,
    b = g.court[0];
  a.familyIds = [g.families[0].id];
  g.families[0].memberIds.push(a.id);
  const child = newPerson(g, {
    race: a.race,
    age: 0,
    parents: [a.id, b.id],
    house: a.house,
  });
  acknowledgeBirth(g, child, a, b);
  advance(g);
  assert.ok(a.childIds.includes(child.id));
  assert.ok(b.childIds.includes(child.id));
  assert.ok(g.families[0].memberIds.includes(child.id));
  assert.ok(child.attributes.charisma <= 10);
  assert.ok(child.skills.martial <= 15);
  assert.ok(child.portraitRecipe.inherited);
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
test('three rulers keep distinct identities, histories, portraits, abilities and complete reign records', () => {
  let g = make();
  const first = g.ruler.id;
  for (let n = 0; n < 2; n++) {
    const h = g.court.find((p) => p.alive && p.status === 'serving'),
      id = h.id,
      skills = { ...h.skills },
      portrait = structuredClone(h.portraitRecipe),
      values = h.values;
    g.heir = id;
    g.resources.legitimacy = 95;
    g.factions.find((f) => f.id === 'nobles').grievance = 0;
    succession(g, 'illness');
    assert.equal(g.ruler.id, id);
    assert.deepEqual(g.ruler.skills, skills);
    assert.deepEqual(g.ruler.portraitRecipe, portrait);
    assert.equal(g.ruler.values, values);
    g = parseSave(serializeGame(g));
  }
  assert.equal(g.dynasty, 3);
  assert.equal(g.people[first].alive, false);
  assert.equal(g.reigns.length, 3);
  assert.equal(g.reigns.filter((r) => r.end === null).length, 1);
  assert.equal(g.archive.filter((e) => e.kind === 'ascension').length, 2);
});
test('contested inheritance identifies a real rival and permits a different claimant to take the crown', () => {
  const g = make(),
    h = g.court[0];
  g.heir = h.id;
  g.resources.legitimacy = 20;
  succession(g, 'assassination');
  assert.equal(g.event.type, 'succession');
  const rival = g.event.rival;
  assert.ok(g.people[rival].alive);
  assert.ok(eventOptions(g).some((o) => o.id === 'rival'));
  resolveEvent(g, 'rival');
  assert.equal(g.ruler.id, rival);
  assert.ok(h.grievance >= 20);
  assert.ok(h.memories.some((m) => m.includes('set aside')));
});
test('estate inheritance transfers actual wealth, equipment and property once', () => {
  const g = make(),
    a = g.court[0],
    b = g.court[1];
  a.childIds = [b.id];
  b.parentIds = [a.id];
  a.wealth = 40;
  a.equipment = [{ kind: 'family sword', quality: 75 }];
  a.property = [{ kind: 'workshop', site: 'capital' }];
  const before = b.wealth;
  recordDeath(g, a, 'illness');
  assert.equal(b.wealth, before + 40);
  assert.equal(b.equipment.at(-1).inheritedFrom, a.id);
  assert.equal(b.property.at(-1).inheritedFrom, a.id);
  recordDeath(g, a);
  assert.equal(b.wealth, before + 40);
});
test('recognition as a city creates a populated district and real administrative capacity', () => {
  const g = make();
  g.resources.infrastructure = 80;
  g.resources.trade = 75;
  g.resources.legitimacy = 95;
  for (const s of Object.values(g.settlements)) {
    s.population = Math.round(s.population * 1.4);
    const race = g.world.predominantRace;
    s.demographics = { [race]: s.population };
  }
  g.resources.population = Object.values(g.settlements).reduce(
    (n, s) => n + s.population,
    0,
  );
  advance(g);
  assert.equal(g.title, 'City');
  const s = g.settlements['chartered-quarter'];
  assert.ok(s.population > 0);
  assert.ok(g.world.sites.some((site) => site.id === s.id));
  assert.equal(courtCapacity(g), 10);
  assert.equal(commissionCapacity(g), 4);
  answer(g);
  const governor = g.court[0];
  assert.ok(enact(g, 'governor', s.id, 'appoint', governor.id).ok);
  assert.equal(s.governorId, governor.id);
  const before = s.prosperity;
  advance(g);
  assert.ok(s.prosperity > before);
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
test('a maintained school becomes an academy after twenty years and keeps its founding cause', () => {
  const g = make();
  g.storyCursor = g.storyDeck.length;
  enact(g, 'project', 'school', 'public', g.court[0].id);
  advance(g);
  const school = g.institutions.find((i) => i.kind === 'school');
  assert.ok(school);
  g.policies.tax = 'gentle';
  for (let n = 0; n < 81; n++) {
    answer(g);
    advance(g);
  }
  assert.equal(school.kind, 'academy');
  const e = g.archive.find((e) => e.kind === 'institution-growth');
  assert.equal(e.cause, school.source);
  assert.ok(
    g.facts[
      Object.keys(g.facts).find((id) => g.facts[id].kind === 'academy-charter')
    ],
  );
});
test('compact saves avoid duplicate identities and retain exact deterministic state', () => {
  const g = make(),
    full = JSON.stringify(g),
    compact = serializeGame(g);
  assert.ok(compact.length < full.length * 0.7);
  assert.deepEqual(parseSave(compact), g);
  const restored = parseSave(compact);
  answer(g);
  answer(restored);
  advance(g);
  advance(restored);
  assert.deepEqual(restored, g);
});
test('unsafe fields, broken ancestry, missing compact identities and malformed portrait recipes are rejected', () => {
  const mutate = [
    (g) => {
      g.people[g.ruler.parentIds[0]].parentIds = [g.ruler.id];
      g.ruler.childIds.push(g.ruler.parentIds[0]);
    },
    (g) => (g.people[g.ruler.parentIds[0]].childIds = []),
    (g) => (g.ruler.portraitRecipe.color = 999),
    (g) => (g.ruler.achievements = [{ kind: null }]),
    (g) => (g.eventMemory.templates = []),
  ];
  for (const change of mutate) {
    const g = make();
    change(g);
    assert.throws(() => parseSave(serializeGame(g)));
  }
  const compact = JSON.parse(serializeGame(make()));
  compact.court.push('missing');
  assert.throws(() => parseSave(JSON.stringify(compact)));
  assert.throws(() => parseSave('{"__proto__":{"polluted":true},"version":5}'));
  assert.equal({}.polluted, undefined);
});
test('malformed local, event, outcome and serial references cannot become playable saves', () => {
  for (const change of [
    (g) => (g.serial.record = 0),
    (g) => g.settlements.fields.institutions.push('missing'),
    (g) =>
      (g.lastOutcome.changes = [
        { person: 'missing', field: 'wealth', change: 5 },
      ]),
    (g) => {
      g.event = {
        id: 'emergent-bad',
        key: 'audience:emergent-bad',
        title: 'A roof',
        text: 'A roof',
        type: 'audience',
        engine: 'emergent',
        template: 'institution',
        institution: 'missing',
        site: 'fields',
        speaker: g.court[0].id,
        options: [
          { id: 'free', label: 'Free', note: 'Free', cost: 0, effects: {} },
        ],
      };
      g.seenEvents.push(g.event.key);
    },
  ]) {
    const g = make();
    change(g);
    assert.throws(() => parseSave(serializeGame(g)));
  }
});

test('numeric profile and report fields cannot carry imported markup into the interface', () => {
  for (const change of [
    (g) => (g.ruler.experience = '<img src=x onerror=alert(1)>'),
    (g) => (g.archive[0].year = '<script>bad()</script>'),
    (g) => (g.archive[0].kind = null),
    (g) => (g.ruler.race = 'Unknown culture'),
    (g) => {
      g.version = 4;
      g.ruler.id = '__proto__';
    },
    (g) => {
      advance(g);
      g.lastSeasonReport.year = '<img onerror=alert(1)>';
    },
  ]) {
    const g = make();
    change(g);
    assert.throws(() => parseSave(serializeGame(g)));
  }
});
