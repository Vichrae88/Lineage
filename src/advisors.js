import { commercialForecast } from './commerce.js?v=0.5.3';
// Advice is a reading of public state, not an extra simulation roll.
const lenses = {
  Steward: {
    food: 1.5,
    health: 1.3,
    infrastructure: 1.3,
    gold: 1.2,
    happiness: 1,
    learning: 0.8,
  },
  Marshal: {
    security: 1.7,
    military: 1.5,
    health: 0.8,
    legitimacy: 0.8,
    justice: 0.5,
  },
  Ambassador: {
    trade: 1.5,
    justice: 1.1,
    happiness: 1,
    legitimacy: 0.9,
    faith: 0.7,
  },
  Spymaster: { security: 1.5, learning: 1, legitimacy: 1.2, justice: 0.6 },
  Councillor: {
    happiness: 1.2,
    justice: 1.2,
    health: 1,
    learning: 1,
    faith: 1,
    ecology: 1,
  },
};
const crafts = {
  Steward: 'stewardship',
  Marshal: 'martial',
  Ambassador: 'diplomacy',
  Spymaster: 'intrigue',
  Councillor: 'administration',
};
const issueCraft = {
  'broken-sluice': 'craftsmanship',
  'false-weights': 'administration',
  'missing-scout': 'martial',
  'apprentice-oath': 'scholarship',
  'burial-road': 'diplomacy',
  'clinic-fever': 'medicine',
  'river-charter': 'administration',
  'refugee-caravan': 'diplomacy',
  'mountain-rescue': 'leadership',
  'sealed-library': 'investigation',
  'orchard-blight': 'agriculture',
  'unpaid-watch': 'administration',
  'shrine-duel': 'diplomacy',
  'forged-letter': 'investigation',
  'winter-rent': 'negotiation',
  'beacon-song': 'diplomacy',
  'water-rights': 'negotiation',
  'escaped-construct': 'craftsmanship',
  'festival-mask': 'diplomacy',
  'monastery-grain': 'stewardship',
  'desert-medicine': 'medicine',
  'runaway-page': 'diplomacy',
  'sacred-predator': 'agriculture',
  'guild-inheritance': 'trade',
  'smuggled-seed': 'agriculture',
  'family-feud': 'negotiation',
  'lost-census': 'administration',
  'sleeping-ward': 'scholarship',
  'tournament-debt': 'negotiation',
  'harvest-fire': 'investigation',
  'river-ghost': 'investigation',
  'exiled-ambassador': 'diplomacy',
  'clockwork-tax': 'administration',
  'night-school': 'training',
  'border-bell': 'negotiation',
  'oath-illness': 'medicine',
};
const focus = {
  food: 'keeping households fed',
  health: 'protecting the sick and vulnerable',
  infrastructure: 'work that will survive the next season',
  security: 'the safety of roads and homes',
  military: 'the readiness of the watch',
  trade: 'keeping markets and crossings open',
  learning: 'knowledge that remains in the realm',
  justice: 'a hearing people can trust',
  happiness: 'the lives behind the petitions',
  legitimacy: 'the authority of the crown',
  ecology: 'the land that supports the harvest',
  faith: 'the customs that bind neighbors',
  gold: 'coin available for the next obligation',
};
const conviction = (p) => {
  const traits = p.traits || [];
  if (
    traits.some((t) =>
      ['Compassionate', 'Merciful', 'Gentle', 'Generous'].includes(t),
    )
  )
    return 'I would measure this ruling by the shelter it gives those with the least power.';
  if (traits.some((t) => ['Principled', 'Honest', 'Candid'].includes(t)))
    return 'An answer should withstand an open hearing, even when that costs us favor.';
  if (traits.some((t) => ['Cautious', 'Patient', 'Meticulous'].includes(t)))
    return 'I favor a promise we can sustain over one that sounds splendid in this room.';
  if (traits.some((t) => ['Ruthless', 'Fearless', 'Courageous'].includes(t)))
    return 'I place a high value on a course we can enforce when the hall is no longer watching.';
  if (traits.some((t) => ['Greedy', 'Ambitious'].includes(t)))
    return 'A bargain must leave the crown enough resources and influence to act again.';
  return 'I would judge this by what the people involved must live with after they leave the hall.';
};
const difference = (g, field, n) => {
  const before = g.resources[field];
  if (!Number.isFinite(before)) return 0;
  const after = ['gold', 'food', 'population'].includes(field)
    ? Math.max(0, before + n)
    : Math.max(0, Math.min(100, before + n));
  return after - before;
};
function weights(g, p) {
  const w = { ...lenses.Councillor, ...lenses[p.role] };
  for (const k of ['food', 'health', 'security', 'legitimacy']) {
    const threshold = k === 'food' ? 25 : 30;
    if (g.resources[k] < threshold)
      w[k] = (w[k] || 1) * (g.resources[k] < 10 ? 4 : 2.5);
  }
  if (g.resources.gold < 15) w.gold = Math.max(w.gold || 1, 2.3);
  for (const t of p.traits || []) {
    if (['Compassionate', 'Merciful', 'Gentle'].includes(t)) {
      w.health += 0.7;
      w.happiness += 0.5;
    }
    if (['Principled', 'Honest'].includes(t)) w.justice += 0.8;
    if (['Ruthless', 'Courageous'].includes(t)) {
      w.military = (w.military || 0.8) + 0.7;
      w.security = (w.security || 0.8) + 0.5;
    }
    if (['Greedy', 'Resourceful'].includes(t)) {
      w.gold = (w.gold || 1) + 0.7;
      w.trade = (w.trade || 1) + 0.5;
    }
    if (['Scholarly', 'Curious', 'Inquisitive'].includes(t)) w.learning += 0.8;
  }
  if (p.faction === 'elves') w.ecology = (w.ecology || 1) + 0.7;
  return w;
}
const inclinations = {
  policy: {
    Steward: { balanced: 5, gentle: 2, restore: 3 },
    Marshal: { strict: 5, heavy: 2 },
    Ambassador: { plural: 7, restore: 3 },
  },
  hire: {
    Steward: { probation: 2, retainer: 5 },
    Ambassador: { retainer: 5, patronage: 3 },
  },
  dismiss: {
    Steward: { retire: 4 },
    Ambassador: { honor: 5 },
    Spymaster: { exile: 2 },
  },
  training: { Steward: { practice: 4 }, Councillor: { mentor: 3 } },
  cultivate: {
    Ambassador: { listen: 5 },
    Councillor: { mentor: 4 },
    Marshal: { honor: 4 },
  },
  succession: {
    Ambassador: { council: 9, concede: 3 },
    Marshal: { enforce: 3, council: 4 },
    Steward: { council: 7 },
  },
  expedition: {
    Steward: { careful: 8, sell: 5, care: 6 },
    Marshal: { bold: 5, learn: 5 },
    Ambassador: { respectful: 9, return: 7 },
  },
  portrait: { Councillor: { formal: 2, natural: 3, chronicle: 4 } },
};
function assess(g, d, p, o, agent) {
  const w = weights(g, p),
    parts = Object.entries({
      ...(o.effects || {}),
      ...(d.type === 'succession'
        ? {
            concede: { legitimacy: -10 },
            enforce: { military: -15, happiness: -12 },
            council: { legitimacy: 6, justice: 5 },
          }[o.id] || {}
        : {}),
    }).map(([k, n]) => [k, difference(g, k, n) * (w[k] || 0.7)]);
  let score =
    parts.reduce((n, [, value]) => n + value, 0) -
    (o.cost || 0) * (w.gold || 1) * 0.55;
  const relations = { ...(o.relations || {}) };
  if (d.template === 'frontier' && d.faction) {
    const bargains = {
      reparation: { trust: 14, grievance: -18 },
      mediate: { trust: 8, grievance: -10 },
      'escorted-trade': { trust: 5, grievance: -6 },
      firm: { trust: -6, grievance: 6 },
    };
    if (bargains[o.id]) relations[d.faction] = bargains[o.id];
  }
  for (const [id, changes] of Object.entries(relations)) {
    const f = g.factions.find((x) => x.id === id);
    if (!f) continue;
    for (const [key, change] of Object.entries(changes)) {
      const actual = Math.max(0, Math.min(100, f[key] + change)) - f[key];
      const direction =
        key === 'grievance'
          ? -1
          : key === 'fear'
            ? p.role === 'Marshal'
              ? 0.1
              : -0.4
            : 1;
      score +=
        (f.trust < 25 || f.grievance >= 65 ? 1.7 : 1) *
        actual *
        direction *
        (id === p.faction ? 0.85 : p.role === 'Ambassador' ? 0.65 : 0.3);
    }
  }
  score += inclinations[d.type]?.[p.role]?.[o.id] || 0;
  if (d.type === 'policy') {
    if (g.resources.gold < 15 && o.id === 'heavy') score += 9;
    if (g.resources.happiness < 35 && o.id === 'gentle') score += 10;
  }
  if (d.commercialKind && agent) {
    const forecast = commercialForecast(
      g,
      agent,
      d.commercialKind,
      o.id,
      d.site,
      d.faction,
    );
    score +=
      forecast.chance * 10 +
      (o.id === 'prudent' &&
      (p.traits || []).some((t) => ['Cautious', 'Patient'].includes(t))
        ? 4
        : 0);
  }
  if (d.type === 'venture') {
    const v = g.ventures.find((v) => v.id === d.target);
    if (v?.condition < 45 && o.id === 'maintain') score += 15;
    if (g.resources.gold < 12 && o.id === 'pause') score += 9;
  }
  if (['postpone', 'refuse', 'decline', 'close', 'blame'].includes(o.id))
    score -= 3;
  parts.sort((a, b) => b[1] - a[1]);
  return { option: o, score, priority: parts.find(([, n]) => n > 0)?.[0] };
}
export function decisionAdvice(
  g,
  decision,
  options = decision.options || [],
  agent = null,
) {
  const offered = options.filter(
    (o) => !o.disabled && (o.cost || 0) <= g.resources.gold,
  );
  const advisers = g.court.filter(
    (p) =>
      p.alive &&
      p.status === 'serving' &&
      p.age >= 16 &&
      p.id !== decision.target &&
      p.id !== g.ruler.id,
  );
  if (!offered.length || decision.blocked || !advisers.length) return [];
  const skill =
    decision.skill ||
    issueCraft[decision.archetype?.replace(/-aftermath$/, '')] ||
    {
      shortage: 'stewardship',
      institution: 'stewardship',
      frontier: 'diplomacy',
      claimant: 'diplomacy',
      rivalry: 'diplomacy',
    }[decision.template] ||
    (decision.type === 'expedition'
      ? 'martial'
      : decision.type === 'succession' || decision.faction
        ? 'diplomacy'
        : 'stewardship');
  advisers.sort(
    (a, b) =>
      (b.id === decision.adviser ? 40 : 0) +
        (b.skills?.[skill] || 0) -
        ((a.id === decision.adviser ? 40 : 0) + (a.skills?.[skill] || 0)) ||
      a.id.localeCompare(b.id),
  );
  const voices = [
    advisers[0],
    advisers.find((p) => p.role !== advisers[0].role) || advisers[1],
  ].filter(Boolean);
  return voices.map((p) => {
    const assessments = offered
      .map((o) => assess(g, decision, p, o, agent))
      .sort(
        (a, b) => b.score - a.score || a.option.id.localeCompare(b.option.id),
      );
    const best = assessments[0],
      o = best.option;
    let reason = best.priority
      ? 'My concern is ' + focus[best.priority] + '.'
      : 'This is the course I can support within the coin and authority we presently have.';
    if (
      best.priority &&
      ['food', 'health', 'security', 'legitimacy'].includes(best.priority) &&
      g.resources[best.priority] < (best.priority === 'food' ? 25 : 30)
    )
      reason += ' We have little margin left there.';
    if (g.resources.gold - (o.cost || 0) < 10)
      reason +=
        ' It leaves very little coin for the next wages and obligations.';
    const positives = Object.entries(o.relations || {}).find(
      ([id, r]) =>
        id === p.faction && (r.trust > 0 || r.respect > 0 || r.grievance < 0),
    );
    const faction = g.factions.find((f) => f.id === p.faction);
    const bias = faction
      ? 'My ties to ' +
        faction.name +
        (positives
          ? ' also incline me toward this answer.'
          : ' are part of the judgment I bring to your table.')
      : 'I speak from my present office and my own convictions.';
    const partner = g.factions.find((f) => f.id === decision.faction);
    if (partner && (partner.trust < 25 || partner.grievance >= 65))
      reason +=
        ' ' +
        partner.name +
        ' still doubts our promises; the next bargain will carry that history.';
    const history =
      decision.origin && g.archive.find((r) => r.id === decision.origin);
    return {
      person: p.id,
      name: p.name,
      role: p.role,
      choice: o.id,
      label: o.label,
      commentary:
        conviction(p) +
        ' ' +
        reason +
        (history
          ? ' This hearing follows the recorded ' +
            (history.kind || 'decision') +
            ' in ' +
            ['Spring', 'Summer', 'Autumn', 'Winter'][history.season ?? 0] +
            ', Year ' +
            history.year +
            '; those involved have not forgotten it.'
          : ''),
      tradeoff: o.note,
      bias,
      expertise:
        (p.skills?.[skill] || 0) < 40
          ? 'Their experience in this matter is limited; treat the advice with care.'
          : 'Their counsel reflects ' +
            skill +
            ' experience, rather than a promise of success.',
    };
  });
}
