import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createGame,
  enact,
  getDecision,
  advance,
  resolveEvent,
  eventOptions,
  parseSave,
  succession,
  seasonProjection,
} from '../src/game.js';
import { serializeGame } from '../src/persistence.js';
import { commercialForecast, commercialUpkeep } from '../src/commerce.js';
import { recordDeath } from '../src/living.js';
const make = (seed = 231, scale = 'town') => {
  const g = createGame({
    seed,
    scale,
    race: 'Beastfolk',
    history: 'Inherited',
  });
  resolveEvent(g, 'decline');
  g.storyCursor = g.storyDeck.length;
  g.resources.gold = 1000;
  g.resources.food = 1000;
  return g;
};
const answer = (g) => {
  let n = 0;
  while (g.event) {
    assert.ok(++n < 30);
    resolveEvent(
      g,
      eventOptions(g)
        .filter((o) => !o.disabled && o.cost <= g.resources.gold)
        .at(-1).id,
    );
  }
};
const turn = (g) => {
  answer(g);
  advance(g);
};
test('a caravan risks real capital, reserves its delegate, returns once and records a historical receipt', () => {
  const g = make(),
    p = g.court[0],
    before = g.resources.gold;
  assert.ok(enact(g, 'commercial', 'caravan', 'prudent', p.id).ok);
  const v = g.ventures[0];
  assert.equal(g.resources.gold, before - 26);
  assert.equal(v.profit, -26);
  assert.equal(enact(g, 'training', p.id, 'trade').ok, false);
  turn(g);
  assert.equal(g.commerce.receipts.length, 0);
  turn(g);
  assert.ok(['completed', 'failed'].includes(v.status));
  const receipt = g.commerce.receipts[0];
  assert.ok(receipt.amount >= 0);
  assert.equal(g.archive.find((e) => e.id === receipt.source).cause, v.source);
  const count = g.commerce.receipts.length;
  turn(g);
  assert.equal(g.commerce.receipts.length, count);
});
test('skills, reputation and foreign trust change commercial forecasts', () => {
  const g = make(),
    p = g.court[0],
    f = g.factions.find((f) => f.id === 'elves');
  f.trust = 70;
  p.skills.trade = 85;
  p.skills.negotiation = 85;
  p.reputation = 90;
  const strong = commercialForecast(g, p, 'caravan', 'prudent', 'border', f.id);
  p.skills.trade = 15;
  p.skills.negotiation = 15;
  p.reputation = 20;
  f.trust = 20;
  const weak = commercialForecast(g, p, 'caravan', 'prudent', 'border', f.id);
  assert.ok(strong.chance > weak.chance);
  assert.ok(strong.score > weak.score);
  assert.ok(strong.chance < 1);
});
test('an estate persists, pays upkeep, and can be paused or liquidated only once', () => {
  const g = make(),
    p = g.court[0];
  assert.ok(enact(g, 'commercial', 'estate', 'prudent', p.id).ok);
  const v = g.ventures[0];
  turn(g);
  assert.equal(v.status, 'operating');
  assert.equal(commercialUpkeep(g), 2);
  turn(g);
  assert.ok(enact(g, 'venture', v.id, 'pause').ok);
  const receipts = g.commerce.receipts.length;
  turn(g);
  assert.equal(g.commerce.receipts.length, receipts);
  assert.equal(commercialUpkeep(g), 0);
  assert.ok(enact(g, 'venture', v.id, 'liquidate').ok);
  const saved = serializeGame(g);
  assert.equal(enact(g, 'venture', v.id, 'liquidate').ok, false);
  assert.equal(serializeGame(g), saved);
});
test('shared investments require and spend personal wealth, and commercial administration cannot be stacked without limit', () => {
  const g = make(),
    p = g.court[0];
  p.wealth = 7;
  assert.equal(enact(g, 'commercial', 'market', 'shared', p.id).ok, false);
  p.wealth = 20;
  assert.ok(enact(g, 'commercial', 'market', 'shared', p.id).ok);
  assert.equal(p.wealth, 12);
  assert.ok(p.property.some((x) => x.venture === g.ventures[0].id));
  assert.equal(
    enact(g, 'commercial', 'estate', 'prudent', g.court[1].id).ok,
    false,
  );
  turn(g);
  assert.equal(
    enact(g, 'commercial', 'market', 'prudent', g.court[1].id).ok,
    false,
  );
});
test('agreements need real diplomacy and expire rather than producing unlimited dues', () => {
  const g = make(),
    p = g.court[0],
    f = g.factions.find((f) => f.id === 'elves');
  f.trust = 20;
  assert.equal(
    enact(g, 'commercial', 'agreement:elves', 'prudent', p.id).ok,
    false,
  );
  f.trust = 70;
  assert.ok(enact(g, 'commercial', 'agreement:elves', 'prudent', p.id).ok);
  const v = g.ventures[0];
  for (let n = 0; n < 18; n++) turn(g);
  assert.equal(v.status, 'closed');
  const count = g.commerce.receipts.length;
  turn(g);
  assert.equal(g.commerce.receipts.length, count);
});
test('prospecting consumes a finite deposit at the start and cannot be farmed for free gold', () => {
  const g = make(),
    p = g.court[0],
    before = g.commerce.deposits.mountains;
  assert.ok(enact(g, 'commercial', 'expedition:mountains', 'prudent', p.id).ok);
  assert.equal(g.commerce.deposits.mountains, before - 8);
  for (let n = 0; n < 3; n++) turn(g);
  assert.ok(['completed', 'failed'].includes(g.ventures[0].status));
  g.commerce.deposits.mountains = 0;
  assert.equal(
    enact(g, 'commercial', 'expedition:mountains', 'bold', p.id).ok,
    false,
  );
});
test('businesses and ownership survive succession and deterministic save replay', () => {
  const a = make(),
    p = a.court[0];
  enact(a, 'commercial', 'estate', 'shared', p.id);
  turn(a);
  a.heir = a.court[2].id;
  a.resources.legitimacy = 90;
  a.factions.find((f) => f.id === 'nobles').grievance = 0;
  succession(a, 'illness');
  const b = parseSave(serializeGame(a));
  for (let n = 0; n < 8; n++) {
    turn(a);
    turn(b);
  }
  assert.deepEqual(a, b);
  assert.equal(a.ventures[0].founder, 'sovereign');
  assert.equal(a.ventures[0].status, 'operating');
});
test('a dead operator cannot earn a receipt and can be replaced without losing the investment history', () => {
  const g = make(),
    p = g.court[0];
  enact(g, 'commercial', 'estate', 'prudent', p.id);
  turn(g);
  const source = g.ventures[0].source;
  recordDeath(g, p);
  turn(g);
  assert.equal(g.ventures[0].status, 'paused');
  assert.ok(
    enact(g, 'operator', g.ventures[0].id, 'appoint', g.court[1].id).ok,
  );
  assert.equal(g.ventures[0].source, source);
  assert.equal(g.ventures[0].status, 'operating');
});
test('the captured deployed version-five dynasty migrates without changing its existing portraits or records', async () => {
  const raw = JSON.parse(
    await readFile(
      new URL('./fixtures/version-five-living.json', import.meta.url),
      'utf8',
    ),
  );
  const g = parseSave(JSON.stringify(raw));
  assert.equal(g.ruler.id, raw.ruler);
  assert.deepEqual(g.archive, raw.archive);
  for (const p of Object.values(g.people))
    assert.deepEqual(p.portraitRecipe, raw.people[p.id].portraitRecipe);
  assert.deepEqual(g.ventures, []);
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
test('damaged businesses, personal ownership and commercial receipts are rejected', () => {
  for (const change of [
    (g) => (g.ventures[0].kind = 'unknown'),
    (g) => (g.ventures[0].source = 'missing'),
    (g) => (g.ventures[0].actor = 'missing'),
    (g) => (g.ventures[0].privateOwner = 'missing'),
    (g) => (g.commerce.deposits.unknown = 10),
    (g) => (g.ventures[0].condition = 200),
    (g) => (g.commerce.deposits.mountains = -1),
  ]) {
    const g = make();
    enact(g, 'commercial', 'estate', 'prudent', g.court[0].id);
    change(g);
    assert.throws(() => parseSave(serializeGame(g)));
  }
});
test('royal receipts enter the budget exactly once, with full investment upkeep', async () => {
  const { applyEconomy } = await import('../src/economy.js');
  const g = make();
  enact(g, 'commercial', 'estate', 'prudent', g.court[0].id);
  g.turn++;
  const before = g.resources.gold,
    p = applyEconomy(g);
  assert.equal(
    g.resources.gold,
    before + p.taxIncome + p.commercialIncome - p.spending,
  );
  assert.ok(p.upkeep >= 2);
  assert.equal(g.commerce.receipts[0].amount, p.commercialIncome);
  assert.equal(
    g.ventures[0].profit,
    -g.ventures[0].capital - 2 + p.commercialIncome,
  );
});
test('commercial risk produces both losses and returns, not a guaranteed gold machine', async () => {
  const { tickCommerce } = await import('../src/commerce.js');
  let wins = 0,
    losses = 0;
  for (let seed = 10; seed < 30; seed++) {
    const g = make(seed),
      p = g.court[0];
    enact(g, 'commercial', 'caravan', 'bold', p.id);
    const v = g.ventures[0];
    g.turn++;
    tickCommerce(g);
    g.turn++;
    tickCommerce(g);
    if (v.status === 'completed') wins++;
    else losses++;
    assert.ok(v.profit <= 15 && v.profit >= -24);
    assert.equal(g.commerce.receipts.length, 1);
  }
  assert.ok(wins > 0 && losses > 0);
});
test('poor food, public hardship and competing holdings reduce commercial returns', async () => {
  const { projectedCommerce } = await import('../src/commerce.js');
  const g = make();
  enact(g, 'commercial', 'estate', 'prudent', g.court[0].id);
  const v = g.ventures[0];
  v.status = 'operating';
  v.condition = 90;
  g.turn = 2;
  g.resources.happiness = 90;
  const strong = projectedCommerce(g)[0].expected;
  g.resources.happiness = 15;
  g.resources.food = 0;
  const weak = projectedCommerce(g)[0].expected;
  assert.ok(strong > weak);
  const alone = commercialForecast(
    g,
    g.people[v.actor],
    v.kind,
    v.plan,
    v.site,
  ).competition;
  g.ventures.push({ ...v, id: 'venture-99', kind: 'market' });
  assert.ok(
    commercialForecast(g, g.people[v.actor], v.kind, v.plan, v.site)
      .competition < alone,
  );
});
test('an established undertaking keeps its completed founding promise through later setbacks', async () => {
  const { tickCommerce } = await import('../src/commerce.js');
  const g = make();
  enact(g, 'commercial', 'estate', 'prudent', g.court[0].id);
  turn(g);
  const v = g.ventures[0],
    promise = g.promises.find((p) => p.source === v.source),
    result = promise.result;
  assert.equal(promise.status, 'completed');
  v.condition = 20;
  g.fundedInstitutions = false;
  g.turn++;
  tickCommerce(g);
  assert.equal(v.status, 'paused');
  assert.equal(promise.status, 'completed');
  assert.equal(promise.result, result);
});
test('a proprietor receives the promised fifth even when the receipt is smaller than five gold', async () => {
  const { tickCommerce } = await import('../src/commerce.js');
  const g = make();
  enact(g, 'commercial', 'estate', 'shared', g.court[0].id);
  const v = g.ventures[0],
    p = g.people[v.privateOwner],
    wealth = p.wealth;
  g.turn++;
  tickCommerce(g);
  const r = g.commerce.receipts[0],
    dividend = p.wealth - wealth - (r.success ? 1 : 0);
  assert.ok(dividend > 0);
  assert.ok(Math.abs(dividend * 4 - r.amount) < 1e-10);
  assert.deepEqual(parseSave(serializeGame(g)), g);
});
