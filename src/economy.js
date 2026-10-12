import {
  projectedCommerce,
  commercialUpkeep,
  tickCommerce,
} from './commerce.js?v=0.5.3';
import { transitionsBetween } from './transitions.js?v=0.5.3';
import { bound, delta } from './sim-core.js?v=0.5.3';
export function seasonProjection(g) {
  const r = g.resources,
    nextSeason = (g.season + 1) % 4;
  const court = g.court.filter((p) => p.alive && p.status === 'serving').length;
  const localTrade =
    Object.values(g.settlements || {}).reduce(
      (n, s) => n + s.trade * s.population,
      0,
    ) / Math.max(1, r.population);
  const taxIncome = Math.round(
    (8 +
      r.trade / 8 +
      r.infrastructure / 12 +
      Math.max(0, localTrade - 35) / 20) *
      (g.scale === 'province' ? 1.4 : 1) +
      (g.policies.tax === 'heavy' ? 9 : g.policies.tax === 'gentle' ? -5 : 0),
  );
  const commercialIncome = projectedCommerce(g).reduce(
    (n, v) => n + v.expected,
    0,
  );
  const income = taxIncome + commercialIncome;
  const wages = court * 2;
  const institutions = g.institutions.filter((i) => i.status === 'active');
  const upkeep =
    commercialUpkeep(g) +
    institutions.reduce((sum, i) => sum + i.budget, 0) +
    Object.values(g.settlements || {}).filter((s) => s.governorId).length +
    Math.ceil((g.guards?.count || 0) * 0.035);
  const law = g.policies.law === 'restorative' ? 2 : 0;
  const consumption = Math.max(
    g.scale === 'province' ? 18 : 10,
    Math.round(r.population / (g.scale === 'province' ? 650 : 85)),
  );
  const productivity =
    Object.values(g.settlements || {}).reduce(
      (sum, s) => sum + s.population * s.foodProduction,
      0,
    ) / Math.max(1, r.population);
  const harvest =
    nextSeason === 2
      ? Math.round(
          consumption * 4 * (0.92 + r.ecology / 500 + productivity / 1000),
        )
      : 0;
  const spoilage = Math.round(Math.max(0, r.food - consumption * 8) * 0.08);
  return {
    income,
    taxIncome,
    commercialIncome,
    wages,
    upkeep,
    law,
    spending: wages + upkeep + law,
    balance: income - wages - upkeep - law,
    consumption,
    harvest,
    spoilage,
    foodBalance: harvest - consumption - spoilage,
    nextSeason,
    assumptions:
      'Existing edicts and funded institutions; unfinished commissions may change these estimates.',
  };
}
export function applyEconomy(g) {
  // The turn has already advanced: project the season being processed.
  const p = seasonProjection({ ...g, season: (g.season + 3) % 4 });
  const r = g.resources;
  const actualCommercial = tickCommerce(g);
  p.commercialIncome = actualCommercial;
  p.income = p.taxIncome + actualCommercial;
  p.balance = p.income - p.spending;
  const available = r.gold + p.taxIncome;
  g.wageFraction = p.wages ? Math.min(1, available / p.wages) : 1;
  g.fundedInstitutions = available >= p.spending;
  p.paidSpending = Math.min(available, p.spending);
  p.unpaid = Math.max(0, p.spending - available);
  r.gold = Math.max(0, available - p.spending);
  r.food = Math.max(0, r.food + p.foodBalance);
  g.economyActual = p;
  return p;
}
export function finishSeasonReport(
  g,
  before,
  outcomes = [],
  wholeBefore = null,
) {
  const changes = delta(before, g.resources);
  const report = {
    id: 'season-' + g.turn,
    turn: g.turn,
    year: g.year,
    season: g.season,
    changes,
    economy: { ...g.economyActual },
    outcomes,
    entry: null,
    transitions: wholeBefore
      ? transitionsBetween(wholeBefore, g).filter(
          (t) =>
            t.scope !== 'person' ||
            Math.abs(t.change) >= 3 ||
            g.people[t.id]?.tier === 'major' ||
            Object.hasOwn(g.people[t.id]?.skills || {}, t.field),
        )
      : [],
  };
  g.reports.unshift(report);
  g.reports = g.reports.slice(0, 12);
  g.lastSeasonReport = report;
  return report;
}
