import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  enact,
  resolveEvent,
  eventOptions,
  advance,
  parseSave,
  professionalForecast,
} from '../src/game.js';
import { practice, relationship } from '../src/characters.js';
const make = (seed) => {
  const g = createGame({
    scale: 'town',
    race: 'Human',
    seed: seed || 5,
    history: 'Inherited',
  });
  resolveEvent(g, 'decline');
  g.resources.gold = 1000;
  g.resources.food = 1000;
  return g;
};
const answer = (g) => {
  while (g.event) {
    const o = eventOptions(g).find(
      (o) => !o.disabled && o.cost <= g.resources.gold,
    );
    assert.ok(resolveEvent(g, o.id).ok);
  }
};
test('hiring and succession retain a single persistent person with their own capabilities', () => {
  const g = make(),
    p = g.applicants[0],
    id = p.id,
    skills = { ...p.skills },
    traits = [...p.traits],
    wealth = p.wealth;
  assert.ok(enact(g, 'hire', id, 'retainer').ok);
  assert.equal(g.court.at(-1), p);
  assert.equal(g.people[id], p);
  assert.equal(p.wealth, wealth);
  assert.deepEqual(p.traits, traits);
  assert.deepEqual(p.skills, skills);
  const loaded = parseSave(JSON.stringify(g));
  assert.equal(loaded.people[id], loaded.court.at(-1));
  assert.equal(
    loaded.people[id],
    loaded.applicants.find((p) => p.id === id),
  );
});
test('charisma and meaningful traits change recruitment effectiveness without guaranteeing success', () => {
  const g = make(),
    p = g.court[1],
    job = g.world.projects.find((p) => p.id === 'recruit');
  p.skills.recruiting = 68;
  p.skills.leadership = 75;
  p.attributes.charisma = 17;
  p.traits = ['Magnetic Personality', 'Inspiring Leader'];
  const strong = professionalForecast(g, p, job, 18);
  p.traits = [];
  p.attributes.charisma = 8;
  const plain = professionalForecast(g, p, job, 18);
  assert.ok(strong.score > plain.score);
  assert.ok(strong.chance > plain.chance);
  assert.ok(strong.chance < 1);
  assert.ok(
    strong.contributions.some((c) => c.label === 'Magnetic Personality'),
  );
});
test('recruitment produces soldiers, development and a mechanically supported service record', () => {
  const g = make(),
    captain = g.court[1],
    old = captain.skills.recruiting;
  assert.ok(enact(g, 'project', 'recruit', 'volunteers', captain.id).ok);
  advance(g);
  assert.ok(g.guards.count > 18);
  assert.ok(captain.skills.recruiting > old);
  assert.equal(captain.performance[0].project, 'recruit');
  assert.ok(
    Object.values(g.facts).some(
      (f) => f.kind === 'recruits-trained' && f.count > 0,
    ),
  );
});
test('practice has a per-season limit and slows near mastery', () => {
  const g = make(),
    p = g.court[0];
  p.skills.training = 40;
  assert.equal(practice(g, p, 'training', 2), 2);
  assert.equal(practice(g, p, 'training', 10), 0);
  g.turn++;
  p.skills.training = 94;
  assert.ok(practice(g, p, 'training', 2) < 1);
  assert.ok(p.skills.training <= 100);
});
test('mentorship consumes money and both people’s time, changes skills and improves their bond', () => {
  const g = make(),
    mentor = g.court[0],
    student = g.court[1];
  mentor.skills.scholarship = 85;
  mentor.skills.training = 80;
  student.skills.scholarship = 20;
  const gold = g.resources.gold;
  assert.ok(enact(g, 'mentorship', student.id, 'scholarship', mentor.id).ok);
  assert.equal(g.resources.gold, gold - 18);
  const snapshot = JSON.stringify(g);
  assert.equal(enact(g, 'project', 'roads', 'villages', mentor.id).ok, false);
  assert.equal(JSON.stringify(g), snapshot);
  const bond = relationship(g, mentor.id, student.id),
    before = bond.trust;
  for (let n = 0; n < 2; n++) {
    answer(g);
    advance(g);
  }
  assert.ok(student.skills.scholarship > 20);
  assert.ok(bond.trust > before);
  assert.equal(g.trainingJobs[0].status, 'completed');
  assert.ok(student.achievements.some((a) => a.kind === 'training'));
});
test('formal courses are timed and rewards change actual personal resources', () => {
  const g = make(),
    p = g.court[0],
    wealth = p.wealth;
  assert.ok(enact(g, 'reward', p.id, 'stipend').ok);
  assert.equal(p.wealth, wealth + 10);
  const before = JSON.stringify(g);
  assert.equal(enact(g, 'reward', p.id, 'stipend').ok, false);
  assert.equal(JSON.stringify(g), before);
  assert.ok(enact(g, 'training', p.id, 'medicine').ok);
  const skill = p.skills.medicine;
  for (let n = 0; n < 3; n++) {
    answer(g);
    advance(g);
  }
  assert.ok(p.skills.medicine > skill);
  assert.equal(g.trainingJobs[0].remaining, 0);
  assert.deepEqual(parseSave(JSON.stringify(g)), g);
});
test('a dead mentor cancels a course without granting a phantom completion', () => {
  const g = make(),
    teacher = g.court[0],
    student = g.court[1];
  enact(g, 'mentorship', student.id, 'scholarship', teacher.id);
  teacher.alive = false;
  advance(g);
  assert.equal(g.trainingJobs[0].status, 'cancelled');
  assert.ok(!student.achievements.some((a) => a.kind === 'training'));
});
test('corrupt individual state and broken mentorship references are rejected', () => {
  for (const mutate of [
    (g) => (g.people[g.court[0].id].attributes.charisma = 99),
    (g) => (g.people[g.court[0].id].wealth = -3),
    (g) => (g.relationships.bad = { a: 'missing', b: g.court[0].id }),
    (g) =>
      g.trainingJobs.push({
        id: 'bad',
        student: 'missing',
        skill: 'medicine',
        remaining: 1,
        status: 'active',
      }),
  ]) {
    const g = make();
    mutate(g);
    assert.throws(() => parseSave(JSON.stringify(g)));
  }
});
test('a magnetic captain recruits more people from the same circumstances and records the actual reasoning', () => {
  const a = make(73),
    b = parseSave(JSON.stringify(a)),
    x = a.court[1],
    y = b.court[1];
  x.skills.recruiting = y.skills.recruiting = 68;
  x.skills.leadership = y.skills.leadership = 75;
  x.attributes.charisma = 17;
  y.attributes.charisma = 8;
  x.traits = ['Magnetic Personality', 'Inspiring Leader'];
  y.traits = [];
  enact(a, 'project', 'recruit', 'volunteers', x.id);
  enact(b, 'project', 'recruit', 'volunteers', y.id);
  advance(a);
  advance(b);
  assert.ok(a.guards.count > b.guards.count);
  const record = a.archive.find((e) => e.kind === 'assignment');
  assert.ok(
    record.assessment.contributions.some(
      (c) => c.label === 'Magnetic Personality',
    ),
  );
  assert.ok(record.effects.military > 0);
  assert.ok(record.changes.some((c) => c.field === 'recruiting'));
});

test('a pension reaches the former courtier and an ambassador moves into the border community', () => {
  const g = make(),
    p = g.court[0],
    before = p.wealth;
  assert.ok(enact(g, 'transfer', p.id, 'Ambassador').ok);
  assert.equal(p.siteId, 'border');
  assert.ok(g.settlements.border.residents.includes(p.id));
  assert.ok(!g.settlements.capital.residents.includes(p.id));
  assert.ok(enact(g, 'dismiss', p.id, 'honor').ok);
  assert.equal(p.wealth, before + 12);
  assert.deepEqual(parseSave(JSON.stringify(g)), g);
});
