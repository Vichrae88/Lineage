// Uses ordinary starting resources, actual commercial decisions, and repeated save/load across reigns.
import assert from 'node:assert/strict';
import {
  createGame,
  enact,
  eventOptions,
  resolveEvent,
  parseSave,
} from '../src/game.js';
import { serializeGame } from '../src/persistence.js';
import { isBusy } from '../src/characters.js';
const results = [];
for (const scale of ['town', 'province']) {
  let g = createGame({
    seed: 9126,
    scale,
    race: 'Beastfolk',
    history: 'Inherited',
    values: 'Compassion',
  });
  const petitions = new Set();
  let failures = 0,
    returns = 0,
    largestReceipt = 0;
  const answer = () => {
    let n = 0;
    while (g.event) {
      assert.ok(++n < 30);
      petitions.add(g.event.key || g.event.id);
      const o = eventOptions(g)
        .filter((o) => !o.disabled && o.cost <= g.resources.gold)
        .at(-1);
      assert.ok(o);
      assert.ok(resolveEvent(g, o.id).ok);
    }
  };
  answer();
  enact(g, 'policy', null, 'gentle');
  enact(g, 'ambition', 'prosperous', 'prosperous');
  for (let n = 0; n < 400; n++) {
    answer();
    let p = g.court.find(
      (p) =>
        p.alive &&
        p.status === 'serving' &&
        !isBusy(g, p.id) &&
        g.ventures.filter(
          (v) =>
            v.actor === p.id &&
            ['forming', 'outbound', 'operating', 'paused'].includes(v.status),
        ).length < 2,
    );
    if (p) {
      const abandoned = g.ventures.find(
        (v) =>
          v.status === 'paused' &&
          !g.people[v.actor]?.alive &&
          g.turn - v.started > 100,
      );
      if (abandoned) enact(g, 'venture', abandoned.id, 'liquidate');
      const paused = g.ventures.find(
        (v) => v.status === 'paused' && !g.people[v.actor]?.alive,
      );
      if (paused && g.resources.gold >= 4)
        enact(g, 'operator', paused.id, 'appoint', p.id);
      const worn = g.ventures.find(
        (v) =>
          ['operating', 'paused'].includes(v.status) &&
          v.condition < 45 &&
          g.people[v.actor]?.alive &&
          (!v.expires || g.turn < v.expires),
      );
      if (worn && g.resources.gold >= 25)
        enact(g, 'venture', worn.id, 'maintain');
      if (n % 12 === 0 && g.resources.gold >= 42) {
        const existing = (kind) =>
          g.ventures.some(
            (v) =>
              v.kind === kind &&
              ['forming', 'operating', 'outbound', 'paused'].includes(v.status),
          );
        const kind = !existing('estate')
          ? 'estate'
          : !existing('market')
            ? 'market'
            : 'caravan';
        enact(g, 'commercial', kind, 'prudent', p.id);
      }
    }
    const oldTurn = g.turn;
    assert.ok(
      enact(g, 'season', null, g.resources.gold >= 6 ? 'people' : 'accounts')
        .ok,
    );
    assert.equal(g.turn, oldTurn + 1);
    const report = g.lastSeasonReport;
    assert.ok(
      report.economy.commercialIncome >= 0 &&
        report.economy.commercialIncome < 80,
    );
    largestReceipt = Math.max(largestReceipt, report.economy.commercialIncome);
    returns += g.commerce.receipts.filter(
      (r) => r.turn === g.turn && r.success,
    ).length;
    failures += g.commerce.receipts.filter(
      (r) => r.turn === g.turn && !r.success,
    ).length;
    if (n % 40 === 0) g = parseSave(serializeGame(g));
  }
  answer();
  g = parseSave(serializeGame(g));
  assert.equal(g.year, 101);
  assert.ok(g.ventures.length >= 2);
  assert.ok(g.dynasty > 1);
  assert.ok(g.archive.some((e) => e.kind === 'commerce'));
  assert.ok(Object.values(g.resources).every(Number.isFinite));
  assert.ok(Buffer.byteLength(serializeGame(g)) < 12 * 1024 * 1024);
  results.push({
    scale,
    year: g.year,
    reigns: g.dynasty,
    ventures: g.ventures.length,
    activeInvestments: g.ventures.filter((v) => v.status === 'operating')
      .length,
    successfulReceipts: returns,
    failedReceipts: failures,
    largestSeasonalCommercialReceipt: largestReceipt,
    netCommercialReturn: g.ventures.reduce((n, v) => n + v.profit, 0),
    gold: g.resources.gold,
    population: g.resources.population,
    majorRecords: g.archive.length,
    uniquePetitions: petitions.size,
    saveBytes: Buffer.byteLength(serializeGame(g)),
  });
}
console.log(JSON.stringify(results, null, 2));
