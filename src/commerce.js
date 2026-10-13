import { bound, roll, hash, idValid } from './sim-core.js?v=0.5.4';
import { appendRecord, addFact, snapshot } from './history.js?v=0.5.4';
import { practice, isBusy } from './characters.js?v=0.5.4';
import { transitionsBetween } from './transitions.js?v=0.5.4';
import { addPromise } from './promises.js?v=0.5.4';
export const commercialKinds = {
  caravan: {
    name: 'A merchant caravan',
    site: 'border',
    cost: 20,
    upkeep: 1,
    duration: 2,
    skill: 'trade',
    risk: 0.2,
    description:
      'Coin travels with the cargo. Safety on the roads, the negotiator’s reputation and the receiving faction’s trust determine what comes back.',
  },
  estate: {
    name: 'A royal estate',
    site: 'fields',
    cost: 30,
    upkeep: 2,
    duration: 1,
    skill: 'stewardship',
    risk: 0.1,
    description:
      'Lease and improve a holding. Tenants need fair terms and fertile land; seasonal rents must pay for maintenance before becoming royal profit.',
  },
  market: {
    name: 'A chartered marketplace',
    site: 'capital',
    cost: 32,
    upkeep: 2,
    duration: 1,
    skill: 'negotiation',
    risk: 0.12,
    description:
      'Build stalls, storage and fair public rules. A busy market earns stall fees, but competition and public hardship can thin its trade.',
  },
  charter: {
    name: 'A commercial charter',
    site: 'capital',
    cost: 18,
    upkeep: 1,
    duration: 1,
    skill: 'trade',
    risk: 0.14,
    description:
      'Offer a bounded trading privilege. The proprietor supplies private capital and owes the crown a share; the charter lasts four years rather than forever.',
  },
  agreement: {
    name: 'A foreign trading agreement',
    site: 'border',
    cost: 24,
    upkeep: 1,
    duration: 1,
    skill: 'diplomacy',
    risk: 0.16,
    description:
      'Pay for warehouses and a negotiated exchange. Trust, commercial skill and the partner’s grievances can sustain or interrupt the bargain.',
  },
  expedition: {
    name: 'A prospecting expedition',
    site: 'mountains',
    cost: 26,
    upkeep: 1,
    duration: 3,
    skill: 'investigation',
    risk: 0.3,
    description:
      'Hire guides and prospectors rather than risk the watch. Knowledge and judgment matter; each venture uses part of a finite local resource.',
  },
};
const routeFactions = ['goblins', 'gnolls', 'elves', 'bugbears', 'beastfolk'];
export function initCommerce(g) {
  g.ventures ||= [];
  g.commerce ||= {
    lastOrder: -1,
    serial: 0,
    receipts: [],
    deposits: { mountains: 48, forest: 32, ruins: 24 },
  };
}
export function commercialForecast(
  g,
  p,
  kind,
  plan = 'prudent',
  site = commercialKinds[kind]?.site,
  faction = null,
) {
  const spec = commercialKinds[kind],
    local = g.settlements[site],
    partner = g.factions.find((f) => f.id === faction);
  const craft =
    (p.skills[spec.skill] + p.skills.trade + p.skills.negotiation) / 3;
  const score = bound(
    craft +
      (p.skills.stewardship - 50) / 10 +
      (p.reputation - 50) / 8 +
      (p.trust - 50) / 12 +
      (p.morale - 50) / 15 +
      (local.security - 50) / 12 +
      (partner ? (partner.trust - 45) / 6 - partner.grievance / 20 : 0) +
      (plan === 'prudent' ? 8 : plan === 'shared' ? 1 : -7),
    5,
    100,
  );
  const chance = bound(
    0.43 + score / 190 - spec.risk + (plan === 'prudent' ? 0.12 : 0),
    0.18,
    0.91,
  );
  const crowd = g.ventures.filter(
    (v) =>
      v.site === site &&
      ['forming', 'operating', 'outbound', 'paused'].includes(v.status),
  ).length;
  const competition = 1 / (1 + crowd * 0.16);
  return {
    score,
    chance,
    skill: spec.skill,
    competition,
    description:
      chance > 0.7
        ? 'A promising undertaking, with risk still ahead'
        : chance > 0.5
          ? 'A workable bargain if its conditions hold'
          : 'A fragile undertaking in these circumstances',
  };
}
export function commercialDecision(g, kind, target, agent) {
  const p = g.people[agent],
    spec = commercialKinds[kind];
  if (!spec) return null;
  const site = g.settlements[target] ? target : spec.site;
  const faction = routeFactions.includes(target) ? target : null;
  const actualSite = spec.site === 'border' ? 'border' : site;
  const costs = {
    prudent: spec.cost + 6,
    shared: spec.cost - 6,
    bold: spec.cost,
  };
  const d = {
    type: 'commercial',
    target: kind,
    agent,
    title: spec.name,
    text:
      spec.description +
      (kind === 'caravan' && faction
        ? ' The receiving partner is ' +
          g.factions.find((f) => f.id === faction).name +
          '.'
        : ''),
    requiresAgent: true,
    skill: spec.skill,
    site: actualSite,
    faction,
    options: [
      {
        id: 'prudent',
        label: 'Fund a careful royal undertaking',
        note:
          costs.prudent +
          ' gold. Pay for sound preparations; the crown bears the risk and receives the return.',
        cost: costs.prudent,
        effects: {},
      },
      {
        id: 'shared',
        label: 'Share the venture with its working proprietor',
        note:
          costs.shared +
          ' gold from the treasury and 8 from the delegate’s personal wealth. They retain a fifth of any receipts, and the guild gains a stronger voice.',
        cost: costs.shared,
        effects: {},
        disabled: !!p && p.wealth < 8,
        reason: 'The delegate needs at least 8 gold of their own.',
      },
      {
        id: 'bold',
        label: 'Accept a leaner bargain and greater risk',
        note:
          costs.bold +
          ' gold. Slimmer margins of safety, with fewer protections for tenants and public access where applicable; failures cost the crown and the delegate’s reputation.',
        cost: costs.bold,
        effects: {},
      },
    ],
  };
  const active = g.ventures.filter((v) =>
    ['forming', 'operating', 'outbound', 'paused'].includes(v.status),
  );
  if (g.event)
    d.blocked =
      'Hear the waiting audience before starting a new commercial undertaking.';
  else if (g.commerce.lastOrder === g.turn)
    d.blocked = 'The treasury can settle only one new undertaking in a season.';
  else if (active.length >= (g.scale === 'province' ? 5 : 3))
    d.blocked =
      'The administration is already carrying its present capacity of commercial undertakings.';
  else if (
    ['estate', 'market', 'charter', 'agreement'].includes(kind) &&
    active.some(
      (v) => v.kind === kind && v.site === actualSite && v.faction === faction,
    )
  )
    d.blocked =
      'A matching undertaking already operates here. Review it before establishing another.';
  else if (
    kind === 'agreement' &&
    (!faction || g.factions.find((f) => f.id === faction).trust < 50)
  )
    d.blocked =
      'Choose a neighboring partner whose trust is at least 50, after meaningful diplomacy.';
  else if (
    kind === 'expedition' &&
    (!Object.hasOwn(g.commerce.deposits, actualSite) ||
      g.commerce.deposits[actualSite] < 8)
  )
    d.blocked =
      'This region has too little surveyed resource remaining for another responsible expedition.';
  else if (kind === 'market' && g.settlements[actualSite].population < 100)
    d.blocked =
      'A marketplace needs a settled community of at least a hundred residents.';
  if (p && (!p.alive || p.status !== 'serving' || isBusy(g, p.id)))
    d.blocked = 'Choose a serving courtier whose time is free.';
  else if (p && active.filter((v) => v.actor === p.id).length >= 2)
    d.blocked = 'This delegate already oversees two continuing undertakings.';
  return d;
}
export function startVenture(g, d, plan, source) {
  const p = g.people[d.agent],
    spec = commercialKinds[d.target],
    id = 'venture-' + g.commerce.serial++;
  if (plan === 'shared') {
    p.wealth -= 8;
    p.property.push({
      kind: 'commercial share',
      site: d.site,
      venture: id,
      founded: g.turn,
    });
  }
  const duration = spec.duration,
    expires = ['charter', 'agreement'].includes(d.target)
      ? g.turn + duration + 16
      : null;
  const v = {
    id,
    kind: d.target,
    name:
      g.settlements[d.site].name +
      ' — ' +
      spec.name.toLowerCase() +
      (d.target === 'caravan' && d.faction
        ? ' to ' + g.factions.find((f) => f.id === d.faction).name
        : ''),
    site: d.site,
    faction: d.faction || null,
    actor: p.id,
    privateOwner: plan === 'shared' ? p.id : null,
    plan,
    source,
    founder: g.ruler.id,
    started: g.turn,
    due: g.turn + duration,
    expires,
    status: 'forming',
    capital: d.options.find((o) => o.id === plan).cost,
    condition: 85,
    level: 1,
    receipts: 0,
    profit: -d.options.find((o) => o.id === plan).cost,
    invested: d.options.find((o) => o.id === plan).cost,
    missed: 0,
    lastReviewed: -1,
    renewals: 0,
  };
  g.ventures.push(v);
  g.commerce.lastOrder = g.turn;
  const local = g.settlements[d.site],
    commons = g.factions.find((f) => f.id === 'commons');
  if (d.target === 'estate') {
    local.foodProduction += 2;
    if (plan === 'bold') {
      g.resources.ecology = bound(g.resources.ecology - 2);
      commons.grievance = bound(commons.grievance + 2);
    }
  }
  if (d.target === 'market')
    local.infrastructure = bound(local.infrastructure + 2);
  if (d.target === 'charter' && plan === 'bold') {
    commons.grievance = bound(commons.grievance + 2);
    g.resources.justice = bound(g.resources.justice - 1);
  }
  if (d.target === 'expedition') {
    g.commerce.deposits[d.site] -= 8;
    g.resources.ecology = bound(g.resources.ecology - 1);
  }
  if (plan === 'shared') {
    const f = g.factions.find((f) => f.id === 'guild');
    f.respect = bound(f.respect + 3);
  }
  addFact(
    g,
    'commercial-undertaking',
    {
      venture: id,
      site: v.site,
      people: [p.id],
      faction: v.faction,
      kindOfVenture: v.kind,
    },
    source,
  );
  addPromise(g, {
    kind: 'commercial',
    title: ['caravan', 'expedition'].includes(v.kind)
      ? 'Bring the ' + v.kind + ' home'
      : 'Establish ' + v.name,
    source,
    due: v.due + 1,
    person: p.id,
    site: v.site,
    total: 1,
  });
  return v;
}
export function ventureManagement(g, id, agent) {
  const v = g.ventures.find((v) => v.id === id);
  if (!v) return null;
  const d = {
    type: 'venture',
    target: id,
    agent,
    title: 'The future of ' + v.name,
    text: 'The original investment and its history belong to the crown across reigns. Maintenance supports its condition; a pause earns no income. Liquidation is a fraction of the original capital, not a new profit.',
    options: [
      {
        id: 'maintain',
        label: 'Repair and restore the undertaking',
        note: '10 gold restores condition and resumes a paused undertaking, if its terms and operator remain eligible.',
        cost: 10,
        effects: {},
        disabled: ['completed', 'closed', 'failed'].includes(v.status),
        reason: 'This undertaking has already closed.',
      },
      {
        id: 'expand',
        label: 'Invest in a measured expansion',
        note: '18 gold improves the operation, with higher upkeep and diminishing returns. Two expansions are the limit.',
        cost: 18,
        effects: {},
        disabled: v.level >= 3 || v.status !== 'operating',
        reason:
          'Only an operating undertaking below its expansion limit can expand.',
      },
      {
        id: 'pause',
        label: 'Suspend the operation and its upkeep',
        note: 'No new expense; receipts stop. The undertaking and its obligations remain in the record.',
        cost: 0,
        effects: {},
        disabled: !['operating', 'forming'].includes(v.status),
        reason: 'This undertaking cannot be paused now.',
      },
      {
        id: 'liquidate',
        label: 'Close the bargain and recover what remains',
        note: 'A finished journey has no remaining capital. Other holdings can recover at most a quarter of their initial royal investment, once.',
        cost: 0,
        effects: {},
        disabled: ['completed', 'closed', 'failed'].includes(v.status),
        reason: 'The closing settlement has already been applied.',
      },
    ],
  };
  if (v.lastReviewed === g.turn)
    d.blocked = 'This undertaking has already been reviewed this season.';
  return d;
}
export function manageVenture(g, v, choice) {
  v.lastReviewed = g.turn;
  if (['maintain', 'expand'].includes(choice)) {
    const cost = choice === 'maintain' ? 10 : 18;
    v.invested += cost;
    v.profit -= cost;
  }
  if (choice === 'maintain') {
    v.condition = bound(v.condition + 30);
    if (g.people[v.actor]?.alive && (!v.expires || g.turn < v.expires))
      v.status =
        g.turn < v.due
          ? 'forming'
          : ['caravan', 'expedition'].includes(v.kind)
            ? 'outbound'
            : 'operating';
  }
  if (choice === 'expand') {
    v.level++;
    v.condition = bound(v.condition + 8);
  }
  if (choice === 'pause') v.status = 'paused';
  if (choice === 'liquidate') {
    const salvage = ['caravan', 'expedition'].includes(v.kind)
      ? 0
      : Math.floor((v.capital * 0.25 * v.condition) / 100);
    g.resources.gold += salvage;
    v.profit += salvage;
    v.status = 'closed';
    v.closed = g.turn;
    const promise = g.promises.find(
      (p) => p.source === v.source && p.status !== 'completed',
    );
    if (promise) {
      promise.status = 'released';
      promise.finished = g.turn;
    }
  }
}
export function commercialUpkeep(g) {
  return (g.ventures || [])
    .filter((v) => ['forming', 'outbound', 'operating'].includes(v.status))
    .reduce((n, v) => n + commercialKinds[v.kind].upkeep + (v.level - 1), 0);
}
function expectedReceipt(g, v) {
  const p = g.people[v.actor];
  if (!p?.alive || v.condition < 20) return 0;
  const f = commercialForecast(g, p, v.kind, v.plan, v.site, v.faction),
    s = g.settlements[v.site],
    partner = g.factions.find((f) => f.id === v.faction);
  const pressure =
    g.resources.food === 0 ? 0.4 : Math.max(0.5, g.resources.happiness / 100);
  const cooperation = partner ? bound(partner.trust / 70, 0.25, 1.2) : 1;
  const activity = isBusy(g, p.id) && v.status === 'operating' ? 0.8 : 1;
  const gross =
    (v.kind === 'estate'
      ? 4.5
      : v.kind === 'market'
        ? 6
        : v.kind === 'charter'
          ? 4
          : 5.5) +
    f.score / 45 +
    (v.level - 1) * 1.3;
  return Math.max(
    0,
    Math.round(
      ((gross * f.competition * v.condition) / 100) *
        pressure *
        cooperation *
        activity,
    ),
  );
}
export function projectedCommerce(g) {
  const next = g.turn + 1;
  return (g.ventures || [])
    .filter((v) => ['forming', 'outbound', 'operating'].includes(v.status))
    .map((v) => {
      const p = g.people[v.actor],
        f = p
          ? commercialForecast(g, p, v.kind, v.plan, v.site, v.faction)
          : { chance: 0 };
      const touring = ['caravan', 'expedition'].includes(v.kind);
      const ready = v.due <= next && (!v.expires || v.expires > next);
      const income = !ready
        ? 0
        : touring
          ? Math.round(
              ((v.capital + (v.kind === 'caravan' ? 11.5 : 17.5)) * f.chance +
                v.capital * 0.325 * (1 - f.chance)) *
                (v.plan === 'shared' ? 0.8 : 1),
            )
          : Math.max(
              0,
              expectedReceipt(g, v) -
                Math.min(2, expectedReceipt(g, v)) *
                  (1 - bound(f.chance + 0.1, 0.3, 0.96)),
            );
      return {
        id: v.id,
        name: v.name,
        expected: Math.round(income * 100) / 100,
        upkeep: commercialKinds[v.kind].upkeep + v.level - 1,
        uncertain: true,
      };
    });
}
export function tickCommerce(g) {
  let total = 0;
  for (const v of g.ventures.filter((v) =>
    ['forming', 'outbound', 'operating'].includes(v.status),
  )) {
    const p = g.people[v.actor],
      spec = commercialKinds[v.kind];
    v.profit -= spec.upkeep + v.level - 1;
    if (!p?.alive) {
      v.status = 'paused';
      appendRecord(g, {
        kind: 'commerce',
        cause: v.source,
        site: v.site,
        people: [v.actor],
        text:
          v.name +
          ' pauses after its operator’s death. The crown retains its history and assets, but a living delegate must carry the work.',
      });
      continue;
    }
    if (v.expires && g.turn >= v.expires) {
      v.status = 'closed';
      v.closed = g.turn;
      appendRecord(g, {
        kind: 'commerce',
        cause: v.source,
        site: v.site,
        people: [v.actor],
        text:
          'The bounded terms of ' +
          v.name +
          ' expire. No further dues can be collected without a new negotiated bargain.',
      });
      continue;
    }
    if (g.turn < v.due) {
      if (['caravan', 'expedition'].includes(v.kind)) v.status = 'outbound';
      continue;
    }
    const before = snapshot(g),
      f = commercialForecast(g, p, v.kind, v.plan, v.site, v.faction),
      s = g.settlements[v.site],
      journey = ['caravan', 'expedition'].includes(v.kind);
    let gross = 0,
      success = false;
    if (journey) {
      success = roll(g, v.id + '-return') < f.chance;
      gross = success
        ? v.capital +
          (v.kind === 'caravan' ? 8 : 14) +
          Math.floor(roll(g, v.id + '-cargo') * 8)
        : Math.floor(v.capital * (0.15 + roll(g, v.id + '-salvage') * 0.35));
      v.status = success ? 'completed' : 'failed';
      v.closed = g.turn;
    } else {
      v.status = 'operating';
      success = roll(g, v.id + '-trade') < bound(f.chance + 0.1, 0.3, 0.96);
      gross = success
        ? expectedReceipt(g, v)
        : Math.max(0, expectedReceipt(g, v) - 2);
      v.condition = bound(v.condition - (success ? 1 : 5));
      if (!success) v.missed++;
      if (g.fundedInstitutions === false) v.condition = bound(v.condition - 5);
      if (v.condition < 20) {
        v.status = 'paused';
        gross = 0;
      }
    }
    const share = v.plan === 'shared' ? Math.round(gross * 20) / 100 : 0,
      royal = Math.round((gross - share) * 100) / 100;
    g.resources.gold += royal;
    total += royal;
    const owner = g.people[v.privateOwner]?.alive
      ? g.people[v.privateOwner]
      : Object.values(g.people).find(
          (p) => p.alive && p.property.some((a) => a.venture === v.id),
        ) || p;
    owner.wealth += share;
    p.wealth += success ? 1 : 0;
    p.reputation = bound(p.reputation + (success ? 1 : -2));
    p.morale = bound(p.morale + (success ? 1 : -2));
    practice(g, p, spec.skill, journey ? 2 : 0.35);
    practice(g, p, 'trade', journey ? 1 : 0.25);
    s.trade = bound(s.trade + (success ? 0.5 : -0.5));
    s.prosperity = bound(s.prosperity + (success ? 0.4 : -0.8));
    const partner = g.factions.find((f) => f.id === (v.faction || 'guild'));
    if (partner) {
      partner.trade = bound(partner.trade + (success ? 1 : -1));
      if (!success) partner.grievance = bound(partner.grievance + 1);
    }
    v.receipts++;
    v.operatorSuccesses ||= {};
    if (success)
      v.operatorSuccesses[p.id] = (v.operatorSuccesses[p.id] || 0) + 1;
    v.profit = Math.round((v.profit + royal) * 100) / 100;
    const text = journey
      ? p.name +
        ' returns from ' +
        v.name +
        (success
          ? ' with cargo and a sound bargain.'
          : ' with a damaged bargain and only part of the investment recovered.')
      : p.name +
        ' reports that ' +
        v.name +
        (success
          ? ' has met its obligations this season.'
          : ' has found fewer buyers and harder terms this season.');
    const e = appendRecord(g, {
      kind: 'commerce',
      cause: v.source,
      site: v.site,
      people: [p.id],
      factions: partner ? [partner.id] : [],
      text,
      effects: { gold: royal },
      transitions: transitionsBetween(before, g),
      venture: v.id,
      success,
      receipts: royal,
    });
    g.commerce.receipts.unshift({
      turn: g.turn,
      venture: v.id,
      amount: royal,
      source: e.id,
      success,
    });
    g.commerce.receipts = g.commerce.receipts.slice(0, 24);
    const promise = g.promises.find(
      (p) => p.source === v.source && p.kind === 'commercial',
    );
    if (promise && ['active', 'late'].includes(promise.status)) {
      const kept = journey ? success : v.status === 'operating';
      promise.progress = kept ? 1 : 0.5;
      promise.status = kept ? 'completed' : 'partial';
      promise.finished = g.turn;
      promise.result = e.id;
    }
    if (success && v.operatorSuccesses[p.id] === 4) {
      p.achievements.push({
        kind: 'commercial steward',
        turn: g.turn,
        source: e.id,
      });
      addFact(
        g,
        'commercial-milestone',
        { people: [p.id], site: v.site, venture: v.id },
        e.id,
      );
    }
  }
  return total;
}
export function commerceValid(g) {
  if (
    !Array.isArray(g.ventures) ||
    !g.commerce ||
    !Number.isInteger(g.commerce.serial) ||
    g.commerce.serial < 0 ||
    !Number.isInteger(g.commerce.lastOrder) ||
    !Array.isArray(g.commerce.receipts) ||
    !g.commerce.deposits ||
    Array.isArray(g.commerce.deposits) ||
    Object.keys(g.commerce.deposits).sort().join(',') !==
      'forest,mountains,ruins' ||
    Object.values(g.commerce.deposits).some((n) => !Number.isFinite(n) || n < 0)
  )
    return false;
  const records = new Set(g.archive.map((e) => e.id));
  if (
    g.ventures.length > 2000 ||
    new Set(g.ventures.map((v) => v.id)).size !== g.ventures.length ||
    g.ventures.some(
      (v) =>
        !v ||
        !idValid(v.id) ||
        !commercialKinds[v.kind] ||
        !g.settlements[v.site] ||
        !g.people[v.actor] ||
        !g.people[v.founder] ||
        (v.privateOwner !== null && !g.people[v.privateOwner]) ||
        (v.plan === 'shared' && !v.privateOwner) ||
        !records.has(v.source) ||
        typeof v.name !== 'string' ||
        ![
          'forming',
          'outbound',
          'operating',
          'paused',
          'completed',
          'failed',
          'closed',
        ].includes(v.status) ||
        !['prudent', 'shared', 'bold'].includes(v.plan) ||
        ![
          'capital',
          'condition',
          'level',
          'receipts',
          'profit',
          'missed',
          'invested',
          'lastReviewed',
        ].every((k) => Number.isFinite(v[k])) ||
        v.capital < 0 ||
        v.invested < v.capital ||
        v.receipts < 0 ||
        !Number.isInteger(v.receipts) ||
        !Number.isInteger(v.level) ||
        !Number.isInteger(v.lastReviewed) ||
        (v.operatorSuccesses &&
          Object.entries(v.operatorSuccesses).some(
            ([id, n]) => !g.people[id] || !Number.isInteger(n) || n < 0,
          )) ||
        v.condition < 0 ||
        v.condition > 100 ||
        v.level < 1 ||
        v.level > 3 ||
        !Number.isInteger(v.started) ||
        !Number.isInteger(v.due) ||
        (v.expires !== null && !Number.isInteger(v.expires)) ||
        (v.faction && !g.factions.some((f) => f.id === v.faction)),
    )
  )
    return false;
  if (
    g.commerce.serial <=
    Math.max(-1, ...g.ventures.map((v) => Number(v.id.replace('venture-', ''))))
  )
    return false;
  return g.commerce.receipts.every(
    (r) =>
      r &&
      Number.isInteger(r.turn) &&
      Number.isFinite(r.amount) &&
      r.amount >= 0 &&
      records.has(r.source) &&
      g.ventures.some((v) => v.id === r.venture),
  );
}
