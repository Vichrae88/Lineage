import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createGame,
  resolveEvent,
  eventOptions,
  parseSave,
  advance,
  succession,
  prepareAudience,
} from '../src/game.js';
import { serializeGame } from '../src/persistence.js';
import { decisionAdvice } from '../src/advisors.js';
import { dilemmas, hazardKinds } from '../src/dilemma-catalog.js';
import {
  riskForecast,
  tickDilemmas,
  dilemmaDecision,
  attachLiveDilemma,
  stakesValid,
} from '../src/dilemmas.js';
import { isBusy } from '../src/characters.js';
import { generateEmergentEvent } from '../src/emergent.js';
import { recordDeath, tickCommunities } from '../src/living.js';
const make = (seed = 81) => {
  const g = createGame({
    seed,
    scale: 'town',
    race: 'Human',
    history: 'Inherited',
  });
  resolveEvent(g, 'decline');
  g.resources.gold = 500;
  g.resources.food = 80;
  return g;
};
const focus = (g, key) => {
  g.event = structuredClone(g.storyDeck.find((e) => e.archetype === key));
  assert.ok(g.event, key);
  prepareAudience(g);
  eventOptions(g);
  return g.event;
};
const rule = (g, key, choice = 'support', agent) => {
  focus(g, key);
  assert.ok(resolveEvent(g, choice, agent).ok);
  return g.dilemmas.at(-1);
};
const report = (g, c) => {
  g.turn = c.due;
  tickDilemmas(g);
  const i = g.scheduled.findIndex((e) => e.id === c.followup);
  g.event = g.scheduled.splice(i, 1)[0];
  assert.ok(g.event);
  return g.event;
};
const settleAll = (g) => {
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
test('36 opening issues have distinct moral questions, tailored choices and a free, costly-in-other-ways answer', () => {
  const g = make(),
    issues = g.storyDeck.filter((e) => e.dilemma);
  assert.equal(issues.length, 36);
  assert.equal(new Set(issues.map((e) => e.dilemma.question)).size, 36);
  const labels = new Set();
  for (const e of issues) {
    assert.ok(e.options.length >= 4);
    assert.ok(e.options.some((o) => o.cost === 0));
    assert.ok(e.options.every((o) => stakesValid(o.stakes)));
    for (const o of e.options.slice(0, 3)) {
      assert.ok(!labels.has(o.label), o.label);
      labels.add(o.label);
      const losses =
        Object.values(o.effects).some((n) => n < 0) ||
        Object.values(o.relations).some((m) =>
          Object.entries(m).some(([k, n]) =>
            k === 'grievance' ? n > 0 : n < 0,
          ),
        ) ||
        Object.values(o.stakes.personal).some((m) =>
          Object.values(m).some((n) => n < 0),
        ) ||
        o.stakes.risk ||
        o.stakes.pledge;
      assert.ok(losses, e.archetype + '/' + o.id);
    }
    assert.ok(dilemmas[e.archetype].aftermath.some((o) => o.cost === 0));
  }
});
test('money does not erase rights, reputational losses or civilian danger', () => {
  const g = make(),
    e = focus(g, 'clinic-fever');
  const expensive = e.options.reduce((a, b) => (a.cost > b.cost ? a : b));
  assert.equal(expensive.id, 'support');
  assert.ok(expensive.effects.justice < 0);
  assert.ok(expensive.stakes.personal.ruler.reputation < 0);
  assert.ok(expensive.stakes.personal.affected.loyalty < 0);
  assert.ok(riskForecast(g, e, expensive).chance > 0);
  const free = e.options.find((o) => o.cost === 0);
  assert.ok(free.effects.trade > 0 && free.effects.health < 0);
});
test('army, stored food, foreign trust and personal loyalty can block choices independently of gold', () => {
  const g = make();
  g.resources.military = 0;
  focus(g, 'broken-sluice');
  assert.ok(eventOptions(g).find((o) => o.id === 'support').disabled);
  g.resources.food = 0;
  focus(g, 'refugee-caravan');
  assert.ok(eventOptions(g).find((o) => o.id === 'support').disabled);
  g.factions.find((f) => f.id === 'gnolls').trust = 0;
  focus(g, 'exiled-ambassador');
  assert.ok(eventOptions(g).find((o) => o.id === 'mediate').disabled);
  const e = focus(g, 'oath-illness');
  g.people[e.dilemma.actors.subject].loyalty = 0;
  assert.ok(eventOptions(g).find((o) => o.id === 'mediate').disabled);
});
test('advisors with competing convictions disagree even with abundant money; repeated previews consume no state', () => {
  const g = make(),
    e = focus(g, 'clinic-fever');
  const [a, b] = g.court;
  a.role = 'Councillor';
  a.traits = ['Compassionate', 'Principled', 'Scholarly'];
  b.role = 'Marshal';
  b.traits = ['Ruthless', 'Loyal', 'Meticulous'];
  const d = dilemmaDecision(g, e),
    before = serializeGame(g),
    voices = decisionAdvice(g, d);
  assert.equal(voices.length, 2);
  assert.notEqual(voices[0].choice, voices[1].choice);
  assert.ok(
    voices.some((v) =>
      /Consent|protection|Livelihoods|authority|account|promises|consent/.test(
        v.commentary,
      ),
    ),
  );
  for (let i = 0; i < 10; i++) assert.deepEqual(decisionAdvice(g, d), voices);
  assert.equal(serializeGame(g), before);
  assert.deepEqual(decisionAdvice(parseSave(before), d), voices);
});
test('court convictions change actual loyalty and morale and retain accurate historical values', () => {
  const g = make(),
    p = g.court[0];
  p.role = 'Councillor';
  p.traits = ['Compassionate', 'Merciful', 'Gentle'];
  p.loyalty = 50;
  p.morale = 50;
  const c = rule(g, 'clinic-fever', 'mediate');
  const r = g.archive.find((r) => r.id === c.source),
    reaction = r.courtResponses.find((r) => r.person === p.id);
  assert.equal(reaction.stance, 'supported');
  assert.deepEqual(reaction.before, { loyalty: 50, morale: 50 });
  assert.deepEqual(reaction.after, { loyalty: 52, morale: 52 });
  assert.equal(p.loyalty, 52);
});
test('selected delegates carry real risk, remain occupied until their report and cannot be assigned twice', () => {
  const g = make(),
    agent = g.court[1],
    c = rule(g, 'missing-scout', 'support', agent.id);
  assert.equal(c.professional, agent.id);
  assert.ok(isBusy(g, agent.id));
  focus(g, 'broken-sluice');
  const before = serializeGame(g);
  assert.equal(resolveEvent(g, 'support', agent.id).ok, false);
  assert.equal(serializeGame(g), before);
  assert.equal(resolveEvent(g, 'support', 'missing-person').ok, false);
  g.turn = c.due;
  tickDilemmas(g);
  assert.equal(isBusy(g, agent.id), false);
});
test('skill, loyalty, reputation and realm conditions affect risk without a price-based guarantee', () => {
  const g = make(),
    e = focus(g, 'missing-scout'),
    o = e.options.find((o) => o.id === 'mediate'),
    p = g.people[e.agent];
  const skill = hazardKinds[o.stakes.risk.kind].skill;
  p.skills[skill] = 10;
  p.loyalty = 10;
  g.ruler.reputation = 10;
  g.resources.trade = 10;
  const low = riskForecast(g, e, o).chance;
  p.skills[skill] = 90;
  p.loyalty = 90;
  g.ruler.reputation = 90;
  g.resources.trade = 90;
  const high = riskForecast(g, e, o).chance;
  assert.ok(high < low);
  assert.ok(high >= 0.04);
  assert.ok(high > 0);
});
test('a pending undertaking has exactly the same report after compact save and load, and cannot reroll', () => {
  const g = make(),
    c = rule(g, 'broken-sluice'),
    copy = parseSave(serializeGame(g));
  g.turn = c.due;
  copy.turn = c.due;
  tickDilemmas(g);
  tickDilemmas(copy);
  assert.deepEqual(copy, g);
  const before = serializeGame(g);
  tickDilemmas(g);
  tickDilemmas(g);
  assert.equal(serializeGame(g), before);
  assert.equal(g.archive.filter((r) => r.kind === 'dilemma-result').length, 1);
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
test('failure can kill a named delegate, transfer their estate, release a governorship and keep the census and causal records', () => {
  let g, c, p;
  for (let seed = 1; seed < 50; seed++) {
    g = make(seed);
    p = g.court[0];
    p.health = 1;
    p.wealth = 20;
    g.heir = g.kin.find((p) => p.age >= 18).id;
    g.settlements[p.siteId].governorId = p.id;
    c = rule(g, 'missing-scout', 'support', p.id);
    g.turn = c.due;
    tickDilemmas(g);
    if (c.dead) break;
  }
  assert.equal(p.alive, false);
  assert.equal(c.dead, p.name);
  assert.ok(c.lost >= 1);
  assert.equal(g.settlements[p.siteId].governorId, null);
  const death = g.archive.find(
      (r) => r.kind === 'death' && r.people.includes(p.id),
    ),
    result = g.archive.find((r) => r.id === c.result);
  assert.equal(death.cause, result.id);
  assert.equal(result.cause, c.source);
  assert.ok(g.archive.indexOf(death) > g.archive.indexOf(result));
  assert.ok(
    g.people[g.heir].achievements.some(
      (a) => a.kind === 'inheritance' && a.source === death.id,
    ),
  );
  assert.equal(
    g.resources.population,
    Object.values(g.settlements).reduce((n, s) => n + s.population, 0),
  );
  for (const s of Object.values(g.settlements))
    assert.equal(
      Object.values(s.demographics).reduce((n, x) => n + x, 0),
      s.population,
    );
  assert.match(result.text, new RegExp(p.name));
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
test('promises are kept by the promised act, not by paying for an unrelated aftermath', () => {
  for (const [answer, status] of [
    ['erase-register', 'completed'],
    ['warehouse-levy', 'broken'],
  ]) {
    const g = make(),
      c = rule(g, 'clinic-fever');
    report(g, c);
    const before = g.ruler.reputation;
    assert.ok(resolveEvent(g, answer).ok);
    const p = g.promises.find((p) => p.dilemma === c.id);
    assert.equal(p.status, status);
    assert.equal(p.result, c.answerSource);
    if (status === 'broken') assert.ok(g.ruler.reputation < before);
    assert.equal(c.status, 'closed');
    assert.deepEqual(parseSave(serializeGame(g)), g);
  }
});
test('a dead veteran cannot return or teach; a free memorial releases the promise', () => {
  const g = make(),
    e = focus(g, 'oath-illness'),
    subject = g.people[e.dilemma.actors.subject];
  assert.ok(resolveEvent(g, 'support').ok);
  const c = g.dilemmas.at(-1);
  recordDeath(g, subject, 'illness');
  report(g, c);
  g.resources.gold = 0;
  const options = eventOptions(g);
  assert.ok(options.find((o) => o.id === 'return-command').disabled);
  assert.ok(options.find((o) => o.id === 'honored-teacher').disabled);
  assert.equal(
    options.find((o) => o.id === 'veteran-memorial').disabled,
    false,
  );
  assert.ok(resolveEvent(g, 'veteran-memorial').ok);
  assert.equal(g.promises.find((p) => p.dilemma === c.id).status, 'released');
  assert.equal(subject.status, 'deceased');
});
test('a teaching offer changes the living veteran’s actual office, profession and achievement', () => {
  const g = make(),
    c = rule(g, 'oath-illness', 'mediate'),
    p = g.people[c.actors.subject];
  report(g, c);
  assert.ok(p.alive);
  assert.ok(resolveEvent(g, 'honored-teacher').ok);
  assert.equal(p.role, 'Councillor');
  assert.equal(p.profession, 'Teacher');
  assert.ok(
    p.achievements.some(
      (a) => a.kind === 'a new civic calling' && a.source === c.answerSource,
    ),
  );
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
test('a subject who becomes ruler still leaves a free, possible aftermath answer', () => {
  const g = make(),
    c = rule(g, 'oath-illness', 'mediate');
  report(g, c);
  g.ruler = g.people[c.actors.subject];
  g.ruler.status = 'ruler';
  g.resources.gold = 0;
  assert.ok(eventOptions(g).some((o) => !o.disabled && o.cost === 0));
});
test('obligations and causal aftermath survive two changes of ruler', () => {
  const g = make(),
    c = rule(g, 'clinic-fever'),
    founder = g.ruler.id;
  for (let n = 0; n < 2; n++) {
    g.heir = g.kin.find(
      (p) => p.alive && p.age >= 18 && p.id !== g.ruler.id,
    ).id;
    g.resources.legitimacy = 95;
    g.factions.find((f) => f.id === 'nobles').grievance = 0;
    succession(g);
    settleAll(g);
  }
  assert.equal(g.dynasty, 3);
  assert.notEqual(g.ruler.id, founder);
  report(g, c);
  assert.ok(resolveEvent(g, 'erase-register').ok);
  assert.equal(c.founder, founder);
  assert.equal(g.promises.find((p) => p.dilemma === c.id).status, 'completed');
  assert.equal(g.archive.find((r) => r.id === c.answerSource).cause, c.result);
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
test('real seasonal advancement delivers an authored aftermath once and remains deterministic after load', () => {
  const g = make(),
    c = rule(g, 'clinic-fever'),
    copy = parseSave(serializeGame(g));
  for (let i = 0; i < 3; i++) {
    settleAll(g);
    settleAll(copy);
    assert.ok(advance(g));
    assert.ok(advance(copy));
    assert.deepEqual(copy, g);
  }
  settleAll(g);
  assert.equal(c.status, 'closed');
  assert.equal(
    g.archive.filter((r) => r.kind === 'dilemma-result' && r.dilemma === c.id)
      .length,
    1,
  );
});
test('live hunger retains the real guild debt while adding a moral cost and future question', () => {
  const g = make();
  g.turn = 12;
  g.resources.food = 0;
  tickCommunities(g);
  g.event = generateEmergentEvent(g);
  assert.equal(g.event.template, 'shortage');
  assert.equal(g.event.dilemma.key, 'live-shortage');
  const justice = g.resources.justice;
  assert.ok(resolveEvent(g, 'guild').ok);
  assert.ok(g.resources.justice < justice);
  assert.equal(g.obligations.at(-1).amount, 8);
  assert.equal(g.dilemmas.at(-1).key, 'live-shortage');
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
test('five recurring world pressures offer distinct values and issue-specific aftermaths', () => {
  const g = make();
  for (const template of [
    'shortage',
    'institution',
    'frontier',
    'claimant',
    'rivalry',
  ]) {
    const ids = {
      shortage: ['import', 'ration', 'guild', 'work-relief'],
      institution: ['repair', 'stabilize', 'guild', 'close'],
      frontier: ['reparation', 'mediate', 'firm', 'escorted-trade'],
      claimant: ['hearing', 'estate', 'close'],
      rivalry: ['mediate', 'separate', 'contest'],
    }[template];
    const e = attachLiveDilemma(g, {
      template,
      id: 'test-' + template,
      speaker: g.court[0].id,
      site: 'capital',
      text: 'A living issue.',
      options: ids.map((id) => ({
        id,
        label: id,
        note: id,
        cost: 0,
        effects: {},
        relations: {},
      })),
    });
    assert.equal(e.dilemma.key, 'live-' + template);
    assert.ok(e.options.every((o) => stakesValid(o.stakes)));
    assert.ok(
      dilemmas[e.dilemma.key].aftermath.every(
        (o) => !['continue', 'local', 'closed'].includes(o.id),
      ),
    );
  }
});
test('malformed moral stakes, actor references and case causality are rejected on import', () => {
  const original = make();
  rule(original, 'clinic-fever');
  for (const corrupt of [
    (g) => delete g.dilemmas[0].stakes,
    (g) => (g.dilemmas[0].stakes.risk.kind = 'unknown'),
    (g) => (g.dilemmas[0].stakes.risk.chance = 10),
    (g) => (g.dilemmas[0].actors.subject = 'missing-person'),
    (g) => (g.dilemmas[0].actors = []),
    (g) => (g.dilemmas[0].source = g.archive[0].id),
    (g) => (g.dilemmas[0].followup = 'unrelated-letter'),
    (g) =>
      (g.scheduled[0].options[0].stakes.position = {
        actor: 'subject',
        office: 'Dragon',
        profession: 'Teacher',
      }),
    (g) =>
      (g.scheduled[0].options[0].stakes.conditions = [
        { scope: 'realm', field: 'unknown', minimum: 0, label: 'Invalid.' },
      ]),
    (g) => (g.scheduled[0].dilemma.actors.affected = 'missing-person'),
    (g) => delete g.scheduled[0].options[0].stakes,
  ]) {
    const g = structuredClone(original);
    corrupt(g);
    assert.throws(() => parseSave(JSON.stringify(g)));
  }
});
test('older unmarked pending decisions retain their historical costs and consequences after migration', async () => {
  const raw = JSON.parse(
    await readFile(
      new URL('./fixtures/version-five-living.json', import.meta.url),
      'utf8',
    ),
  );
  const g = parseSave(JSON.stringify(raw));
  const e = g.storyDeck.find((e) => e.followups);
  g.event = structuredClone(e);
  assert.equal(e.dilemma, undefined);
  const options = eventOptions(g),
    choice = options[0];
  const copy = parseSave(serializeGame(g));
  assert.deepEqual(eventOptions(copy), options);
  const gold = g.resources.gold;
  if (gold < choice.cost) g.resources.gold = copy.resources.gold = choice.cost;
  assert.ok(resolveEvent(g, choice.id).ok);
  assert.ok(resolveEvent(copy, choice.id).ok);
  assert.deepEqual(g, copy);
  assert.equal(g.dilemmas.length, 0);
});

test('an empty treasury and unavailable court leave a possible response to every opening issue', () => {
  const g = make();
  g.resources.gold = 0;
  g.resources.food = 0;
  g.resources.military = 0;
  for (const p of g.court) p.status = 'departed';
  for (const e of g.storyDeck.filter((e) => e.dilemma)) {
    focus(g, e.archetype);
    assert.ok(
      eventOptions(g).some((o) => !o.disabled && o.cost === 0),
      e.archetype,
    );
  }
});

test('an overdue dilemma promise loses trust once and remains open until a specific settlement', async () => {
  const { tickPromises } = await import('../src/promises.js');
  const g = make(),
    c = rule(g, 'clinic-fever'),
    p = g.promises.find((p) => p.dilemma === c.id),
    person = g.people[p.person];
  g.turn = p.due + 1;
  const trust = person.trust;
  tickPromises(g);
  assert.equal(p.status, 'late');
  assert.equal(person.trust, trust - 3);
  const count = g.archive.length;
  tickPromises(g);
  assert.equal(g.archive.length, count);
  tickDilemmas(g);
  g.event = g.scheduled.splice(
    g.scheduled.findIndex((e) => e.id === c.followup),
    1,
  )[0];
  assert.ok(resolveEvent(g, 'erase-register').ok);
  assert.equal(p.status, 'completed');
  assert.deepEqual(parseSave(serializeGame(g)), g);
});

test('ordinary expedition audiences still accept an adventuring party rather than a court delegate', () => {
  const g = make();
  g.event = structuredClone(
    g.storyDeck.find((e) => e.action?.type === 'expedition'),
  );
  assert.ok(g.event);
  prepareAudience(g);
  const party = g.event.agent;
  assert.ok(g.parties.some((p) => p.id === party));
  const o = eventOptions(g).find((o) => !o.disabled && o.id !== 'decline');
  assert.ok(o);
  assert.ok(resolveEvent(g, o.id, party).ok);
  assert.ok(g.missions.some((m) => m.party === party));
});
