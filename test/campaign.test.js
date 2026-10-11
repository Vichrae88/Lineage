import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  parseSave,
  advance,
  eventOptions,
  resolveEvent,
  eventKey,
  enact,
  succession,
  household,
  realmSites,
  realmExpeditions,
} from '../src/game.js';
import { animalHeritages } from '../src/campaign.js';
const campaign = (seed = 81, extra = {}) =>
  createGame({
    scale: 'town',
    race: 'Human',
    history: 'Inherited',
    values: 'Compassion',
    seed,
    ...extra,
  });
const settle = (g) => {
  let count = 0;
  while (g.event) {
    assert.ok(++count < 40);
    const o = eventOptions(g).find(
      (o) => !o.disabled && o.cost <= g.resources.gold,
    );
    assert.ok(o);
    assert.ok(resolveEvent(g, o.id).ok);
  }
};

test('campaign generation is reproducible from a seed and different on a new seed', () => {
  const a = campaign(81),
    b = campaign(82);
  assert.deepEqual(a, campaign(81));
  for (const field of [
    'court',
    'kin',
    'notables',
    'applicants',
    'families',
    'parties',
    'world',
    'storyDeck',
  ])
    assert.notDeepEqual(a[field], b[field], field);
  assert.notEqual(a.ruler.name, b.ruler.name);
  assert.notEqual(a.name, b.name);
});
test('Beastfolk populate the court and recruitment roster with diverse species and suitable names', () => {
  for (let seed = 1; seed <= 12; seed++) {
    const g = campaign(seed, { race: 'Beastfolk' });
    assert.ok(
      g.court.every(
        (c) => c.race === 'Beastfolk' && animalHeritages.includes(c.species),
      ),
    );
    assert.equal(new Set(g.court.map((c) => c.species)).size, 3);
    assert.equal(new Set(g.applicants.map((c) => c.species)).size, 8);
    assert.ok(
      g.applicants.every(
        (c) => c.artset === 'campaign' && c.name.split(' ').length >= 2,
      ),
    );
  }
});
test('all starting people have distinct generated identities, biographies, and portraits', () => {
  for (const race of [
    'Human',
    'Elf',
    'Dwarf',
    'Halfling',
    'Orc',
    'Goblin',
    'Gnoll',
    'Bugbear',
    'Beastfolk',
  ]) {
    const g = campaign(718, { race });
    const people = [
      g.ruler,
      ...g.court,
      ...g.applicants,
      ...g.futurePeople,
      ...g.kin,
      ...g.notables,
    ];
    assert.equal(
      new Set(people.map((c) => c.name)).size,
      people.length,
      race + ' names',
    );
    assert.equal(new Set(people.map((c) => c.id)).size, people.length);
    assert.ok(
      people.every(
        (c) =>
          c.story.length > 100 &&
          c.appearance &&
          c.desire &&
          c.fear &&
          c.secret &&
          c.faith &&
          c.traits.length === 3 &&
          /^generated-\d+$/.test(c.portrait),
      ),
    );
  }
});
test('royal households have collateral relatives, no parents, and adult relatives can inherit', () => {
  const g = campaign(11, {
    race: 'Elf',
    name: 'Aelith',
    age: 48,
    gender: 'Woman',
    disposition: 'Curious',
    appearance: 'Silver braids and a blue cloak',
  });
  assert.equal(g.ruler.age, 48);
  assert.equal(g.ruler.gender, 'Woman');
  assert.equal(g.ruler.disposition, 'Curious');
  assert.equal(g.ruler.appearance, 'Silver braids and a blue cloak');
  assert.ok(g.kin.length >= 2 && g.kin.length <= 5);
  assert.ok(
    g.kin.every(
      (k) =>
        ['Sister', 'Brother', 'Aunt', 'Uncle', 'Cousin'].includes(k.kinship) &&
        k.race === 'Elf',
    ),
  );
  const kin = g.kin.find((c) => c.age >= 18);
  assert.ok(enact(g, 'heir', kin.id, 'private').ok);
  g.resources.legitimacy = 80;
  g.factions.find((f) => f.id === 'nobles').grievance = 0;
  succession(g);
  assert.equal(g.ruler.name, kin.name);
  assert.equal(g.dynasty, 2);
  assert.equal(parseSave(JSON.stringify(g)).ruler.portrait, kin.portrait);
});
test('creation convictions and disposition affect the opening realm', () => {
  const a = campaign(5, { values: 'Harmony', disposition: 'Patient' }),
    b = campaign(5, { values: 'Strength', disposition: 'Stern' });
  assert.equal(a.resources.justice, b.resources.justice + 5);
  assert.equal(b.resources.military, a.resources.military + 5);
  assert.equal(b.resources.security, a.resources.security + 4);
});
test('generated locations, visitors, and venture histories agree with the campaign', () => {
  const g = campaign();
  assert.equal(new Set(realmSites(g).map((s) => s.name)).size, 6);
  for (const e of g.storyDeck) {
    assert.ok(g.world.sites.some((s) => s.id === e.site));
    assert.ok(
      household(g)
        .concat(g.applicants, g.notables)
        .some((p) => p.id === e.speaker),
    );
    assert.ok(e.backdrop && e.text.length > 100);
  }
  assert.equal(new Set(realmExpeditions(g).map((e) => e.name)).size, 4);
  for (const h of g.families)
    assert.ok(h.memberIds.every((id) => g.notables.some((p) => p.id === id)));
});
test('opening petition delegates real work and invalid answers leave everything unchanged', () => {
  const g = campaign();
  assert.equal(g.event.action.target, 'roads');
  const before = JSON.stringify(g);
  assert.equal(resolveEvent(g, 'villages', 'missing-agent').ok, false);
  assert.equal(JSON.stringify(g), before);
  assert.equal(resolveEvent(g, 'unknown').ok, false);
  assert.equal(JSON.stringify(g), before);
  const gold = g.resources.gold;
  assert.ok(resolveEvent(g, 'villages', g.court[0].id).ok);
  assert.equal(g.resources.gold, gold - 18);
  assert.equal(g.queue[0].who, g.court[0].id);
  assert.ok(advance(g));
  assert.equal(g.queue.length, 0);
  assert.ok(g.event, 'An audience arrives automatically');
});
test('incident decisions change faction relationships and schedule the chosen aftermath', () => {
  for (const faction of ['guild', 'nobles', 'commons']) {
    const g = campaign();
    resolveEvent(g, 'decline');
    g.event = structuredClone(
      g.storyDeck.find((e) => e.faction === faction && e.followups),
    );
    const trust = g.factions.find((f) => f.id === faction).trust,
      choice = g.event.options[0],
      name = g.event.title;
    assert.ok(resolveEvent(g, choice.id).ok);
    assert.equal(g.factions.find((f) => f.id === faction).trust, trust + 9);
    assert.ok(g.scheduled[0].text.includes(choice.label.toLowerCase()));
    assert.notEqual(g.scheduled[0].title, name);
  }
});
test('replaying a resolved generated story does not spend coin or repeat an aftermath', () => {
  const g = campaign();
  resolveEvent(g, 'decline');
  g.event = structuredClone(g.storyDeck.find((e) => e.followups));
  const duplicate = structuredClone(g.event);
  resolveEvent(g, 'mediate');
  const resources = structuredClone(g.resources),
    factions = structuredClone(g.factions),
    count = g.scheduled.length;
  g.event = duplicate;
  resolveEvent(g, 'support');
  assert.deepEqual(g.resources, resources);
  assert.deepEqual(g.factions, factions);
  assert.equal(g.scheduled.length, count);
});
test('story deck, branching aftermaths, tutorial, and future identities survive exact save roundtrip', () => {
  const g = campaign();
  g.tutorial = { step: 2, complete: false };
  const copy = parseSave(JSON.stringify(g));
  assert.deepEqual(copy, g);
  resolveEvent(g, 'balanced');
  resolveEvent(copy, 'balanced');
  advance(g);
  advance(copy);
  assert.deepEqual(copy, g);
});
test('generated worlds and stories with corrupt nested data are rejected on import', () => {
  for (const change of [
    (g) => (g.world.sites[0].name = null),
    (g) => (g.world.factionLore.commons.goal = null),
    (g) => (g.world.expeditions = null),
    (g) => (g.world.relics.spring.story = null),
    (g) => (g.kin[0].skills = null),
    (g) => (g.tutorial.step = 90),
    (g) => (g.storyCursor = -1),
    (g) => g.storyDeck.push(g.storyDeck[0]),
    (g) => (g.storyDeck[0].action.target = 'missing'),
    (g) =>
      (g.storyDeck.find((e) => e.followups).followups.support.options = null),
  ]) {
    const g = campaign();
    change(g);
    assert.throws(() => parseSave(JSON.stringify(g)));
  }
});
test('long campaigns deliver each generated issue once through save, load, and succession', () => {
  for (const scale of ['town', 'province']) {
    let g = campaign(61, { scale });
    g.resources.gold = 100000;
    g.resources.food = 100000;
    const seen = new Set(),
      archetypes = new Set();
    for (let turn = 0; turn < 180; turn++) {
      while (g.event) {
        const key = eventKey(g.event);
        assert.ok(key);
        assert.ok(!seen.has(key), key);
        seen.add(key);
        if (g.event.archetype) {
          assert.ok(!archetypes.has(g.event.archetype));
          archetypes.add(g.event.archetype);
        }
        const option = eventOptions(g).find(
          (o) => !o.disabled && o.cost <= g.resources.gold,
        );
        assert.ok(resolveEvent(g, option.id).ok);
      }
      if (turn % 9 === 0) g = parseSave(JSON.stringify(g));
      assert.ok(advance(g));
    }
    settle(g);
    assert.equal(g.storyCursor, g.storyDeck.length);
    assert.ok(seen.size >= 75);
    assert.ok(g.dynasty > 1);
    assert.ok(advance(g));
  }
});
test('close kin cannot be married even when their affection is high', () => {
  const g = campaign();
  const c = g.kin[0];
  c.affection = 100;
  c.trust = 100;
  const before = JSON.stringify(g);
  assert.equal(enact(g, 'marry', c.id, 'private').ok, false);
  assert.equal(JSON.stringify(g), before);
});
test('successive vacant thrones have distinct named stories and preserve their settled history', () => {
  const g = campaign();
  resolveEvent(g, 'decline');
  succession(g);
  const first = eventKey(g.event),
    text = g.event.text;
  resolveEvent(g, 'council-nominee');
  succession(g);
  assert.notEqual(eventKey(g.event), first);
  assert.notEqual(g.event.text, text);
  resolveEvent(g, 'council-nominee');
  assert.ok(g.resolvedEvents.includes(first));
  assert.deepEqual(parseSave(JSON.stringify(g)), g);
});

test('generated recruits retain their identities through hiring, transfer, and dismissal', () => {
  const g = campaign();
  resolveEvent(g, 'decline');
  const applicant = g.applicants[0];
  assert.ok(enact(g, 'hire', applicant.id, 'retainer').ok);
  const courtier = g.court.find((c) => c.id === applicant.id);
  assert.equal(courtier.name, applicant.name);
  assert.equal(courtier.appearance, applicant.appearance);
  assert.equal(courtier.location, realmSites(g)[0].name);
  assert.ok(enact(g, 'transfer', courtier.id, 'Ambassador').ok);
  assert.equal(
    courtier.location,
    realmSites(g).find((s) => s.id === 'border').name,
  );
  assert.ok(enact(g, 'dismiss', courtier.id, 'honor').ok);
  assert.equal(courtier.status, 'departed');
  assert.equal(
    parseSave(JSON.stringify(g)).court.find((c) => c.id === courtier.id).story,
    applicant.story,
  );
});
test('children receive identities prepared at campaign start', () => {
  const g = campaign(97, { race: 'Beastfolk' }),
    names = new Set(g.futurePeople.map((c) => c.name));
  resolveEvent(g, 'decline');
  const partner = g.court[0];
  partner.affection = 100;
  partner.trust = 100;
  assert.ok(enact(g, 'marry', partner.id, 'private').ok);
  g.resources.food = 100000;
  g.resources.gold = 100000;
  for (let season = 0; season < 40; season++) {
    settle(g);
    advance(g);
  }
  assert.ok(g.children.length);
  assert.ok(
    g.children.every(
      (c) =>
        names.has(c.name) &&
        [g.ruler.species, partner.species].includes(c.species),
    ),
  );
  assert.deepEqual(parseSave(JSON.stringify(g)), g);
});
test('a royal relative who ruled is remembered as deceased after the next succession', () => {
  const g = campaign();
  resolveEvent(g, 'decline');
  const relative = g.kin.find((k) => k.age >= 18);
  g.heir = relative.id;
  g.resources.legitimacy = 90;
  g.factions.find((f) => f.id === 'nobles').grievance = 0;
  succession(g);
  assert.equal(relative.status, 'ruler');
  succession(g);
  assert.equal(relative.status, 'deceased');
  assert.equal(relative.alive, false);
  resolveEvent(g, 'council-nominee');
  assert.deepEqual(parseSave(JSON.stringify(g)), g);
});
