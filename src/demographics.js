import { hash, bound } from './sim-core.js?v=0.5.0';
import { races } from './data.js?v=0.5.0';
export function initializeDemographics(g) {
  const predominant = g.world.predominantRace || g.ruler.race;
  for (const s of Object.values(g.settlements)) {
    if (s.demographics) continue;
    const base = g.scale === 'province' ? 0.64 : 0.72;
    const regional =
      {
        capital: -0.02,
        fields: 0.1,
        forest: -0.1,
        border: -0.1,
        mountains: -0.1,
        ruins: 0.02,
      }[s.id] || 0;
    const share = bound(
      base + regional + ((hash(s.id + g.seed) % 7) - 3) / 100,
      0.5,
      0.84,
    );
    const main = Math.round(s.population * share),
      remaining = s.population - main;
    const others = races.filter((r) => r !== predominant);
    const weights = Object.fromEntries(others.map((r) => [r, 1]));
    for (const [race, amount] of Object.entries(
      s.id === 'forest'
        ? { Elf: 4, Beastfolk: 3 }
        : s.id === 'mountains'
          ? { Dwarf: 4, Bugbear: 3 }
          : s.id === 'border'
            ? { Goblin: 3, Beastfolk: 2, Human: 2 }
            : { Halfling: 2 },
    )) {
      if (race !== predominant) weights[race] = amount;
    }
    const sum = Object.values(weights).reduce((a, n) => a + n, 0);
    s.demographics = { [predominant]: main };
    let allocated = main;
    for (const race of others) {
      s.demographics[race] = Math.floor((remaining * weights[race]) / sum);
      allocated += s.demographics[race];
    }
    s.demographics[predominant] += s.population - allocated;
    s.demographicStory =
      s.id === 'forest'
        ? 'Woodland families and travelers share knowledge of the groves.'
        : s.id === 'mountains'
          ? 'Mining, craft and passkeeping draw people from different homes.'
          : s.id === 'border'
            ? 'Trade, arrivals and border agreements bring many cultures together.'
            : 'The realm’s predominant culture shares its home with established minority communities.';
  }
}
export function realmDemographics(g) {
  const totals = Object.fromEntries(races.map((r) => [r, 0]));
  for (const s of Object.values(g.settlements))
    for (const [race, n] of Object.entries(s.demographics || {}))
      totals[race] += n;
  return totals;
}
export function demographicValid(g) {
  return Object.values(g.settlements).every(
    (s) =>
      s.demographics &&
      Object.keys(s.demographics).every((r) => races.includes(r)) &&
      Object.values(s.demographics).every(
        (n) => Number.isInteger(n) && n >= 0,
      ) &&
      Object.values(s.demographics).reduce((a, n) => a + n, 0) === s.population,
  );
}

export function apportionPopulation(total, counts) {
  const sum = Object.values(counts).reduce((n, a) => n + a, 0);
  const rows = Object.entries(counts).map(([race, n]) => ({
    race,
    exact: sum ? (total * n) / sum : 0,
  }));
  const result = Object.fromEntries(
    rows.map((r) => [r.race, Math.floor(r.exact)]),
  );
  let left = total - Object.values(result).reduce((n, a) => n + a, 0);
  rows.sort(
    (a, b) =>
      b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)) ||
      (a.race < b.race ? -1 : 1),
  );
  for (let i = 0; left > 0; i++, left--) result[rows[i % rows.length].race]++;
  return result;
}
