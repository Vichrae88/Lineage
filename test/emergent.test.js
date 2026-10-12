import { newPerson } from '../src/characters.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  resolveEvent,
  eventOptions,
  advance,
  enact,
  parseSave,
  succession,
} from '../src/game.js';
import {
  generateEmergentEvent,
  resolveEmergent,
  tickObligations,
} from '../src/emergent.js';
import {
  tickPeople,
  tickCommunities,
  acknowledgeBirth,
  recordDeath,
} from '../src/living.js';
const make = (seed = 41, extra = {}) => {
  const g = createGame({
    scale: 'town',
    race: 'Human',
    history: 'Inherited',
    seed,
    ...extra,
  });
  resolveEvent(g, 'decline');
  g.resources.gold = 300;
  g.resources.food = 500;
  return g;
};
const answer = (g) => {
  let i = 0;
  while (g.event) {
    assert.ok(++i < 30);
    const o = eventOptions(g).find(
      (o) => !o.disabled && o.cost <= g.resources.gold,
    );
    assert.ok(o);
    assert.ok(resolveEvent(g, o.id).ok);
  }
};
test('an individual invests personal savings and changes the local economy without a royal order', () => {
  const g = make(),
    p = g.court[0];
  p.goals = [{ kind: 'wealth', progress: 5, status: 'active' }];
  p.wealth = 40;
  const local = g.settlements[p.siteId],
    trade = local.trade,
    royal = g.resources.gold;
  g.turn = 1;
  tickPeople(g);
  assert.ok(p.property.length);
  assert.ok(p.wealth < 40);
  assert.ok(local.trade > trade);
  assert.equal(g.resources.gold, royal);
  assert.ok(
    Object.values(g.facts).some(
      (f) => f.kind === 'private-enterprise' && f.people.includes(p.id),
    ),
  );
});
test('a shortage petition is generated from the affected community and cannot recur within the same episode', () => {
  const g = make();
  g.turn = 12;
  g.resources.food = 0;
  tickCommunities(g);
  const e = generateEmergentEvent(g);
  assert.equal(e.template, 'shortage');
  assert.ok(g.people[e.speaker].alive);
  g.turn += 8;
  const next = generateEmergentEvent(g);
  assert.notEqual(next?.fingerprint, e.fingerprint);
  g.resources.food = 100;
  tickCommunities(g);
  g.resources.food = 0;
  tickCommunities(g);
  g.turn += 8;
  const fresh = generateEmergentEvent(g);
  assert.equal(fresh.template, 'shortage');
  assert.notEqual(fresh.id, e.id);
  assert.notEqual(fresh.fingerprint, e.fingerprint);
});
test('a house’s grievance generates a later political issue linked to the old decision', () => {
  const g = make();
  assert.ok(enact(g, 'family', 'dawn', 'service').ok);
  const fact = Object.values(g.facts).find(
    (f) => f.kind === 'family-grievance',
  );
  g.turn = 12;
  const e = generateEmergentEvent(g);
  assert.equal(e.template, 'family-memory');
  assert.equal(e.origin, fact.source);
  resolveEmergent(g, e, 'hearing');
  assert.equal(fact.status, 'ended');
  assert.ok(g.archive.some((a) => a.cause === fact.source));
});
test('credit obligations are repaid once, or remain as a real grievance when unaffordable', () => {
  const g = make();
  g.turn = 10;
  g.resources.food = 0;
  tickCommunities(g);
  const e = generateEmergentEvent(g);
  resolveEmergent(g, e, 'guild');
  g.turn += 2;
  const gold = g.resources.gold;
  tickObligations(g);
  assert.equal(g.resources.gold, gold - 8);
  tickObligations(g);
  assert.equal(g.resources.gold, gold - 8);
  assert.equal(g.obligations[0].status, 'paid');
});
test('after the opening deck ends, meaningful opportunities continue with unique live participants', () => {
  let g = make();
  g.storyCursor = g.storyDeck.length;
  g.policies.tax = 'gentle';
  g.resources.food = 10000;
  g.resources.gold = 10000;
  const seen = new Set();
  let emerging = 0;
  for (let n = 0; n < 160; n++) {
    while (g.event) {
      assert.ok(!seen.has(g.event.key));
      seen.add(g.event.key);
      if (g.event.engine === 'emergent') {
        emerging++;
        assert.ok(g.people[g.event.speaker].alive);
      }
      resolveEvent(
        g,
        eventOptions(g).find((o) => !o.disabled && o.cost <= g.resources.gold)
          .id,
      );
    }
    if (n % 20 === 0) g = parseSave(JSON.stringify(g));
    assert.ok(advance(g));
  }
  assert.ok(emerging >= 12);
  assert.ok(
    new Set(Object.values(g.people).map((p) => p.id)).size ===
      Object.keys(g.people).length,
  );
});
test('a saved state replays independent development and event generation exactly', () => {
  const a = make(15),
    b = parseSave(JSON.stringify(a));
  a.storyCursor = a.storyDeck.length;
  b.storyCursor = b.storyDeck.length;
  for (let n = 0; n < 24; n++) {
    answer(a);
    answer(b);
    advance(a);
    advance(b);
  }
  assert.deepEqual(a, b);
});
test('a century of town and province play preserves coherent histories through multiple rulers', () => {
  for (const scale of ['town', 'province']) {
    let g = make(72, { scale });
    g.policies.tax = 'gentle';
    g.resources.gold = 10000;
    g.resources.food = 10000;
    let count = 0;
    for (let n = 0; n < 400; n++) {
      while (g.event) {
        if (g.event.engine === 'emergent') count++;
        const o = eventOptions(g)
          .filter((o) => !o.disabled && o.cost <= g.resources.gold)
          .at(-1);
        assert.ok(o);
        assert.ok(resolveEvent(g, o.id).ok);
      }
      if ([80, 160].includes(n)) {
        const h =
          g.court.find(
            (p) => p.alive && p.age >= 18 && p.status === 'serving',
          ) ||
          g.kin.find((p) => p.alive && p.age >= 18 && p.status !== 'ruler');
        if (h) {
          g.heir = h.id;
          g.resources.legitimacy = 90;
          g.factions.find((f) => f.id === 'nobles').grievance = 0;
          succession(g);
          answer(g);
        }
      }
      if (n % 40 === 0) g = parseSave(JSON.stringify(g));
      assert.ok(advance(g));
      assert.ok(Object.values(g.resources).every(Number.isFinite));
    }
    answer(g);
    assert.equal(g.year, 101);
    assert.ok(g.dynasty >= 3);
    assert.ok(count >= 20);
    assert.ok(g.archive.length > 100);
    assert.ok(
      g.archive.every(
        (e) => !e.cause || g.archive.some((p) => p.id === e.cause),
      ),
    );
    assert.deepEqual(parseSave(JSON.stringify(g)), g);
  }
});
test('a career petition closes when its individual dies; it cannot enrich a dead participant', () => {
  const g = make();
  g.turn = 12;
  g.storyCursor = g.storyDeck.length;
  const p = g.court[0];
  p.property = [{ kind: 'workshop', site: p.siteId }];
  p.wealth = 50;
  const e = generateEmergentEvent(g);
  assert.equal(e.template, 'enterprise');
  g.event = { ...e, key: 'audience:' + e.id };
  g.seenEvents.push(g.event.key);
  p.alive = false;
  const wealth = p.wealth;
  assert.ok(resolveEvent(g, 'independent').ok);
  assert.equal(p.wealth, wealth);
  assert.ok(g.archive.some((e) => e.kind === 'closed-petition'));
  assert.ok(g.resolvedEvents.includes('audience:' + e.id));
});

test('a descendant brings forward the family grievance after the original ruler and family elders die', () => {
  const g = make();
  enact(g, 'family', 'dawn', 'service');
  const fact = Object.values(g.facts).find(
      (f) => f.kind === 'family-grievance',
    ),
    family = g.families.find((h) => h.id === 'dawn'),
    parent = g.people[family.memberIds[0]],
    partner = g.court[0];
  const child = newPerson(g, {
    race: parent.race,
    species: parent.species,
    age: 0,
    site: parent.siteId,
    parents: [parent.id, partner.id],
    house: parent.house,
  });
  acknowledgeBirth(g, child, parent, partner);
  g.turn = 80;
  g.year = 21;
  child.age = 20;
  for (const id of family.memberIds.filter((id) => id !== child.id))
    recordDeath(g, g.people[id], 'old age');
  g.heir = g.court[1].id;
  g.resources.legitimacy = 90;
  g.factions.find((f) => f.id === 'nobles').grievance = 0;
  succession(g, 'illness');
  g.pending = [];
  g.event = null;
  const event = generateEmergentEvent(g);
  assert.equal(event.template, 'family-memory');
  assert.equal(event.speaker, child.id);
  assert.equal(event.origin, fact.source);
  assert.match(event.text, /Year 1/);
  assert.equal(g.dynasty, 2);
});
