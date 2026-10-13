import {
  seasonalCatalog,
  seasonalById,
  seasonalCategories,
} from './seasonal-catalog.js?v=0.5.5';
import {
  bound,
  hash,
  personById,
  idValid,
  rememberPerson,
} from './sim-core.js?v=0.5.5';
import { appendRecord, addFact, snapshot } from './history.js?v=0.5.5';
import { transitionsBetween } from './transitions.js?v=0.5.5';
import {
  skills,
  isBusy,
  normalizePerson,
  relationship,
} from './characters.js?v=0.5.5';
import { courtCapacity } from './dynasty.js?v=0.5.5';
import { recordDeath } from './living.js?v=0.5.5';
export const seasonalChance = 0.33;
export function seasonalDraw(seed, turn, salt) {
  let x = hash(String(seed) + ':seasonal:' + turn + ':' + salt);
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
export function initSeasonal(g) {
  g.seasonal ??= {
    version: 1,
    lastTurn: g.turn,
    seen: [],
    events: [],
    boons: [],
  };
}
const serving = (g) =>
  g.court.filter(
    (p) => p.alive && p.status === 'serving' && p.id !== g.ruler.id,
  );
const recruit = (g) =>
  g.futurePeople.find(
    (p) => p.alive && p.age >= 18 && !g.court.some((c) => c.id === p.id),
  ) ||
  g.applicants.find(
    (p) => p.alive && p.age >= 18 && !g.court.some((c) => c.id === p.id),
  );
function apply(g, changes, actors, source) {
  for (const [key, n] of Object.entries(changes)) {
    const metric = {
      courtTrust: 'trust',
      courtLoyalty: 'loyalty',
      courtHealth: 'health',
    }[key];
    const p = metric
      ? personById(g, actors.adviser)
      : key === 'reputation'
        ? g.ruler
        : null;
    if (p?.alive) {
      p[metric || 'reputation'] = bound(p[metric || 'reputation'] + n);
      if (p.health === 0 && p.id !== g.ruler.id)
        recordDeath(
          g,
          p,
          'injuries in a seasonal undertaking',
          source,
          g.archive.find((r) => r.id === source)?.site || p.siteId,
        );
    } else if (Number.isFinite(g.resources[key]) && key !== 'population')
      g.resources[key] = ['gold', 'food'].includes(key)
        ? Math.max(0, g.resources[key] + n)
        : bound(g.resources[key] + n);
  }
}
export function boonForecast(g) {
  const totals = {};
  for (const b of g.seasonal?.boons || [])
    totals[b.field] = (totals[b.field] || 0) + b.amount;
  return Object.fromEntries(
    Object.entries(totals).map(([k, v]) => [
      k,
      Math.min(['gold', 'food'].includes(k) ? 2 : 1, v),
    ]),
  );
}
export function applySeasonalBoons(
  g,
  foodAlreadyCounted = false,
  goldAlreadyCounted = false,
) {
  const bonus = boonForecast(g);
  if (foodAlreadyCounted) delete bonus.food;
  if (goldAlreadyCounted) delete bonus.gold;
  apply(g, bonus, {}, null);
}
function installSpecial(g, s, source, site) {
  if (s?.kind === 'boon') {
    const id = 'boon-' + source;
    g.seasonal.boons.push({
      id,
      name: s.name,
      field: s.field,
      amount: s.amount,
      source,
      turn: g.turn,
    });
    addFact(g, 'seasonal-boon', { item: id, site }, source);
    return (
      ' ' +
      s.name +
      ' enters the public reliquary. Its quiet benefit endures through later reigns.'
    );
  }
  if (s?.kind === 'hero') {
    const p = recruit(g);
    if (!p) return '';
    g.futurePeople = g.futurePeople.filter((c) => c.id !== p.id);
    p.status = 'citizen';
    p.siteId = site;
    p.location = g.settlements[site].name;
    p.birthTurn ??= g.turn - p.age * 4;
    normalizePerson(g, p);
    p.profession = s.profession;
    p.heroicService = source;
    p.skills[s.skill] = Math.max(p.skills[s.skill], 72);
    p.reputation = Math.max(p.reputation, 65);
    p.achievements.push({
      kind: 'a deed remembered by the realm',
      turn: g.turn,
      source,
    });
    const room = serving(g).length < courtCapacity(g);
    if (room) {
      p.role = 'Councillor';
      p.status = 'serving';
      p.tier = 'major';
      p.income = 2;
      p.lastCultivated ??= -1;
      p.lastAppointed ??= -1;
      for (const other of serving(g)) {
        g.bonds.push({
          a: other.id,
          b: p.id,
          trust: 45,
          affection: 35,
          rivalry: 15,
        });
        relationship(g, other.id, p.id);
      }
      g.court.push(p);
    } else {
      p.role = 'Councillor';
      p.status = 'candidate';
      p.tier = 'secondary';
      if (!g.applicants.some((c) => c.id === p.id)) g.applicants.push(p);
    }
    for (const local of Object.values(g.settlements))
      if (local.id !== site)
        local.residents = local.residents.filter((id) => id !== p.id);
    if (!g.settlements[site].residents.includes(p.id))
      g.settlements[site].residents.push(p.id);
    rememberPerson(g, p, 'Their deed brought them before the throne.');
    addFact(g, 'heroic-service', { people: [p.id], site }, source);
    const record = g.archive.find((r) => r.id === source);
    record.people.push(p.id);
    return (
      ' ' +
      p.name +
      ', ' +
      (p.species || p.race) +
      ' ' +
      s.profession.toLowerCase() +
      ', ' +
      (room
        ? 'joins your court without an entrance payment. Their continuing wage is part of the household’s upkeep.'
        : 'offers their service from the recruitment roster; every court seat is already filled.')
    );
  }
  return '';
}
// After the one-time catalogue, fresh records can generate new responses to history.
// A cause/category pair is used once; this never replays a completed catalogue entry.
function historyDefinition(g, category) {
  const used = new Set(
    g.seasonal.events
      .filter((h) => h.generatedCause)
      .map((h) => h.generatedCause + ':' + h.category),
  );
  const cause = g.archive
    .slice()
    .reverse()
    .find(
      (r) =>
        r.kind !== 'season' &&
        !r.kind.startsWith('seasonal') &&
        r.text &&
        !used.has(r.id + ':' + category),
    );
  if (!cause) return null;
  const site = cause.site || 'capital',
    place = g.settlements[site].name;
  const common = {
    id: 'history-' + cause.id + '-' + category,
    category,
    site,
    generatedCause: cause.id,
    text:
      'At ' +
      place +
      ', people bring a new response to a recorded chapter: “' +
      cause.text.slice(0, 1500) +
      '” They ask what this memory should mean for those living here now.',
  };
  if (category === 'positive')
    return {
      ...common,
      title: 'A chapter becomes a shared achievement',
      effects: { happiness: 2, legitimacy: 1 },
    };
  if (category === 'negative')
    return {
      ...common,
      title: 'An old chapter troubles new witnesses',
      effects: { happiness: -2, legitimacy: -1 },
    };
  if (category === 'mixed')
    return {
      ...common,
      title: 'A memory changes its meaning',
      effects: { learning: 2, faith: -1 },
    };
  const make = (id, label, note, yes, no, values, chance) => ({
    id,
    label,
    note,
    cost: 0,
    effects: yes,
    failure: no,
    values,
    chance,
    held: 'The witnesses accept the terms of the new account.',
    failed:
      'The witnesses dispute the account and ask whose experience was left out.',
  });
  return {
    ...common,
    title: 'Who will speak for this chapter?',
    effects: {},
    skill: 'diplomacy',
    options: [
      make(
        'witnesses',
        'Invite the affected households to write their own account',
        'Give witnesses authority while accepting that they may disagree with the crown.',
        { justice: 3, learning: 2 },
        { legitimacy: -3 },
        ['autonomy', 'truth'],
        0.7,
      ),
      make(
        'shared',
        'Seek a shared remembrance through independent keepers',
        'Share custody of the memory while risking disagreement over its meaning.',
        { faith: 3, happiness: 2 },
        { justice: -2 },
        ['reciprocity', 'tradition'],
        0.72,
      ),
      make(
        'preserve',
        'Preserve the original record without a new official account',
        'Leave the evidence open and accept the disappointment of those seeking recognition.',
        { learning: 1, happiness: -2 },
        {},
        ['truth', 'restraint'],
        1,
      ),
    ],
  };
}
function definition(g, h) {
  if (!h.generatedCause) return h.definition || seasonalById[h.catalogue];
  const cause = g.archive.find((r) => r.id === h.generatedCause);
  if (!cause) return null;
  // Stored generated definitions retain their original witness context across saves.
  return h.definition;
}
export function seasonalForecast(g, e, o) {
  const h = g.seasonal.events.find((h) => h.id === e.seasonal.id),
    spec = definition(g, h),
    c = spec.options.find((c) => c.id === o.id);
  const p = personById(g, e.agent),
    skill = p?.alive ? p.skills[spec.skill] : 25;
  return {
    skill: spec.skill,
    delegate: p?.alive ? p.id : null,
    chance:
      c.chance === 1
        ? 1
        : bound(
            c.chance + (skill - 50) / 300 + ((p?.loyalty || 35) - 50) / 700,
            0.12,
            0.92,
          ),
  };
}
export function seasonalOptions(g, e) {
  const h = g.seasonal.events.find((h) => h.id === e.seasonal.id),
    spec = definition(g, h);
  if (spec.category !== 'decision')
    return [
      {
        id: 'record',
        label: 'Let this account enter the Chronicle',
        note: 'The report’s consequences have already taken place. Recording it carries no charge or additional reward.',
        cost: 0,
        effects: {},
      },
    ];
  return spec.options.map((c) => ({
    id: c.id,
    label: c.label,
    note:
      c.note +
      (c.chance < 1
        ? ' The result depends on judgment and conditions; it is not certain.'
        : ''),
    cost: c.cost,
    disabled:
      !e.agent && (c.effects.courtHealth < 0 || c.failure.courtHealth < 0),
    reason:
      'A living, available court member must accept this dangerous charge.',
    effects: Object.fromEntries(
      Object.entries(c.effects).filter(([k]) =>
        Number.isFinite(g.resources[k]),
      ),
    ),
    stakes: {
      values: c.values,
      personal: {
        ...(['courtTrust', 'courtLoyalty', 'courtHealth'].some(
          (k) => c.effects[k],
        )
          ? {
              adviser: Object.fromEntries(
                Object.entries(c.effects)
                  .filter(([k]) => k.startsWith('court'))
                  .map(([k, n]) => [
                    {
                      courtTrust: 'trust',
                      courtLoyalty: 'loyalty',
                      courtHealth: 'health',
                    }[k],
                    n,
                  ]),
              ),
            }
          : {}),
        ...(c.effects.reputation
          ? { ruler: { reputation: c.effects.reputation } }
          : {}),
      },
      risk: null,
      pledge: null,
      conditions: [],
    },
  }));
}
export function seasonalOutcomes(g, e, o) {
  const h = g.seasonal.events.find((h) => h.id === e.seasonal.id),
    c = definition(g, h).options.find((c) => c.id === o.id);
  return {
    ...seasonalForecast(g, e, o),
    intended: c.effects,
    setback: c.failure,
  };
}
export function prepareSeasonalAudience(g, e) {
  if (e.seasonal?.category !== 'decision') return;
  const candidates = serving(g).filter((p) => !isBusy(g, p.id));
  if (!candidates.some((p) => p.id === e.agent))
    e.agent =
      candidates.find((p) => p.id === e.adviser)?.id ||
      candidates[0]?.id ||
      null;
}
export function seasonalDecision(g, e) {
  if (e.seasonal?.category !== 'decision') return null;
  const h = g.seasonal.events.find((h) => h.id === e.seasonal.id),
    spec = definition(g, h);
  return {
    type: 'seasonal',
    title: e.title,
    text: e.text,
    skill: spec.skill,
    requiresAgent: true,
    adviser: e.adviser,
    agent: e.agent,
    seasonal: e.seasonal,
    origin: e.origin,
    options: seasonalOptions(g, e),
  };
}
export function tickSeasonal(g) {
  initSeasonal(g);
  if (g.turn <= g.seasonal.lastTurn) return null;
  g.seasonal.lastTurn = g.turn;
  if (seasonalDraw(g.seed, g.turn, 'chance') >= seasonalChance) return null;
  const category =
    seasonalCategories[
      Math.floor(seasonalDraw(g.seed, g.turn, 'category') * 4)
    ];
  let pool = seasonalCatalog.filter(
    (e) =>
      !g.seasonal.seen.includes(e.id) &&
      (e.special?.kind !== 'hero' || recruit(g)) &&
      e.category === category,
  );
  if (!pool.length)
    pool = seasonalCatalog.filter(
      (e) =>
        !g.seasonal.seen.includes(e.id) &&
        (e.special?.kind !== 'hero' || recruit(g)),
    );
  const spec = pool.length
    ? pool[Math.floor(seasonalDraw(g.seed, g.turn, 'selection') * pool.length)]
    : historyDefinition(g, category);
  if (!spec) return null;
  const before = snapshot(g),
    adviser =
      serving(g)
        .filter((p) => !isBusy(g, p.id))
        .sort(
          (a, b) =>
            (b.skills[spec.skill || 'administration'] || 0) -
              (a.skills[spec.skill || 'administration'] || 0) ||
            a.id.localeCompare(b.id),
        )[0] || serving(g)[0];
  const speaker =
    Object.values(g.people).find(
      (p) =>
        p.alive &&
        p.age >= 18 &&
        p.tier !== 'reserve' &&
        p.siteId === spec.site &&
        p.id !== g.ruler.id,
    ) || adviser;
  const id = 'seasonal-' + g.serial.event++,
    actors = {
      ...(speaker ? { affected: speaker.id } : {}),
      ...(adviser ? { adviser: adviser.id } : {}),
      ruler: g.ruler.id,
    };
  const record = appendRecord(g, {
    kind: 'seasonal-event',
    site: spec.site,
    people: [...new Set(Object.values(actors))],
    cause: spec.generatedCause || null,
    title: spec.title,
    text: spec.text,
    seasonal: id,
    category: spec.category,
  });
  const h = {
    id,
    catalogue: spec.id,
    category: spec.category,
    turn: g.turn,
    site: spec.site,
    source: record.id,
    status: spec.category === 'decision' ? 'awaiting' : 'reported',
    actors,
    definition: structuredClone(spec),
    ...(spec.generatedCause
      ? {
          generatedCause: spec.generatedCause,
          definition: structuredClone(spec),
        }
      : {}),
  };
  g.seasonal.events.push(h);
  g.seasonal.seen.push(spec.id);
  if (spec.category !== 'decision') {
    apply(g, spec.effects, actors, record.id);
    record.text += installSpecial(g, spec.special, record.id, spec.site);
    record.transitions = transitionsBetween(before, g);
    record.effects = Object.fromEntries(
      record.transitions
        .filter((t) => t.scope === 'realm')
        .map((t) => [t.field, t.change]),
    );
  }
  addFact(
    g,
    'seasonal-encounter',
    { site: spec.site, people: record.people, event: id },
    record.id,
  );
  g.settlements[spec.site].history.push(record.id);
  return {
    id,
    type: 'seasonal',
    title: spec.title + ' · ' + g.settlements[spec.site].name,
    text: record.text,
    site: spec.site,
    scene: g.world.sites.find((s) => s.id === spec.site)?.scene || 'hall',
    backdrop:
      spec.site === 'temple'
        ? 'archive'
        : spec.site === 'capital'
          ? 'hall'
          : 'market',
    origin: record.id,
    ...(speaker ? { speaker: speaker.id } : {}),
    ...(adviser ? { adviser: adviser.id } : {}),
    agent: null,
    seasonal: { version: 1, id, category: spec.category, actors },
    options: [],
  };
}
export function resolveSeasonal(g, e, o, source) {
  const h = g.seasonal.events.find((h) => h.id === e.seasonal.id),
    spec = definition(g, h);
  if (h.status === 'settled') return null;
  if (spec.category !== 'decision') {
    h.status = 'settled';
    h.result = source;
    h.choice = 'record';
    return (
      'The court hears “' +
      spec.title +
      '”. ' +
      g.archive.find((r) => r.id === h.source).text
    );
  }
  const c = spec.options.find((c) => c.id === o.id),
    forecast = seasonalForecast(g, e, o),
    success =
      seasonalDraw(g.seed, h.turn, h.id + ':' + o.id + ':outcome') <
      forecast.chance;
  const actors = {
    ...h.actors,
    ...(e.agent ? { adviser: e.agent } : {}),
    ruler: g.ruler.id,
  };
  if (!e.agent) delete actors.adviser;
  apply(g, success ? c.effects : c.failure, actors, source);
  h.status = 'settled';
  h.result = source;
  h.choice = c.id;
  h.success = success;
  h.chance = forecast.chance;
  h.delegate = forecast.delegate;
  const text =
    'At “' +
    spec.title +
    '”, you chose to ' +
    c.label.toLowerCase() +
    '. ' +
    (success ? c.held : c.failed);
  if (e.agent) rememberPerson(g, personById(g, e.agent), text);
  const r = g.archive.find((r) => r.id === source);
  r.seasonal = h.id;
  r.seasonalAssessment = {
    chance: forecast.chance,
    skill: forecast.skill,
    delegate: forecast.delegate,
    success,
  };
  return text;
}
const object = (v) => v && typeof v === 'object' && !Array.isArray(v);
export function seasonalEventValid(g, e) {
  if (e.seasonal === undefined) return true;
  const h = g.seasonal?.events?.find((h) => h.id === e.seasonal?.id);
  return (
    object(e.seasonal) &&
    e.seasonal.version === 1 &&
    e.type === 'seasonal' &&
    h &&
    e.id === h.id &&
    e.seasonal.category === h.category &&
    object(e.seasonal.actors) &&
    Object.entries(e.seasonal.actors).every(
      ([role, id]) =>
        ['affected', 'adviser', 'ruler'].includes(role) && g.people[id],
    ) &&
    e.origin === h.source
  );
}
const changeValid = (g, m) =>
  object(m) &&
  Object.entries(m).every(
    ([k, n]) =>
      (Number.isFinite(g.resources[k]) ||
        ['courtTrust', 'courtLoyalty', 'courtHealth', 'reputation'].includes(
          k,
        )) &&
      Number.isFinite(n) &&
      Math.abs(n) <= 30,
  );
function definitionValid(g, d) {
  return (
    object(d) &&
    idValid(d.id) &&
    seasonalCategories.includes(d.category) &&
    typeof d.title === 'string' &&
    d.title.length < 200 &&
    typeof d.text === 'string' &&
    d.text.length < 10000 &&
    g.settlements[d.site] &&
    changeValid(g, d.effects) &&
    (d.special == null ||
      (object(d.special) &&
        (d.special.kind === 'hero'
          ? skills.includes(d.special.skill) &&
            typeof d.special.profession === 'string' &&
            d.special.profession.length < 100
          : d.special.kind === 'boon' &&
            Number.isFinite(g.resources[d.special.field]) &&
            d.special.field !== 'population' &&
            typeof d.special.name === 'string' &&
            d.special.name.length < 150 &&
            Number.isFinite(d.special.amount) &&
            d.special.amount > 0 &&
            d.special.amount <= 1))) &&
    (d.category !== 'decision' ||
      (skills.includes(d.skill) &&
        Array.isArray(d.options) &&
        d.options.length === 3 &&
        new Set(d.options.map((o) => o.id)).size === 3 &&
        d.options.every(
          (o) =>
            object(o) &&
            idValid(o.id) &&
            typeof o.label === 'string' &&
            typeof o.note === 'string' &&
            typeof o.held === 'string' &&
            typeof o.failed === 'string' &&
            Number.isFinite(o.cost) &&
            o.cost >= 0 &&
            o.cost <= 30 &&
            Number.isFinite(o.chance) &&
            o.chance >= 0.1 &&
            o.chance <= 1 &&
            Array.isArray(o.values) &&
            o.values.length >= 1 &&
            o.values.length <= 4 &&
            o.values.every((v) =>
              [
                'mercy',
                'truth',
                'duty',
                'order',
                'autonomy',
                'reciprocity',
                'tradition',
                'provision',
                'restraint',
                'solidarity',
                'expedience',
              ].includes(v),
            ) &&
            changeValid(g, o.effects) &&
            changeValid(g, o.failure),
        )))
  );
}
export function seasonalValid(g) {
  const s = g.seasonal,
    records = new Map(g.archive.map((r) => [r.id, r]));
  return (
    object(s) &&
    s.version === 1 &&
    Number.isInteger(s.lastTurn) &&
    s.lastTurn >= 0 &&
    s.lastTurn <= g.turn &&
    Array.isArray(s.seen) &&
    s.seen.every(idValid) &&
    new Set(s.seen).size === s.seen.length &&
    Array.isArray(s.events) &&
    new Set(s.events.map((h) => h.id)).size === s.events.length &&
    new Set(s.events.map((h) => h.catalogue)).size === s.events.length &&
    new Set(s.events.map((h) => h.turn)).size === s.events.length &&
    s.events.length === s.seen.length &&
    s.events.every((h) => {
      if (
        !object(h) ||
        !idValid(h.id) ||
        !s.seen.includes(h.catalogue) ||
        !seasonalCategories.includes(h.category) ||
        !Number.isInteger(h.turn) ||
        h.turn < 0 ||
        h.turn > s.lastTurn ||
        !g.settlements[h.site] ||
        !object(h.actors) ||
        !Object.entries(h.actors).every(
          ([k, id]) =>
            ['affected', 'adviser', 'ruler'].includes(k) && !!g.people[id],
        )
      )
        return false;
      const source = records.get(h.source),
        spec = h.definition || seasonalById[h.catalogue],
        result = records.get(h.result);
      return (
        source?.kind === 'seasonal-event' &&
        source.seasonal === h.id &&
        source.turn === h.turn &&
        source.site === h.site &&
        source.category === h.category &&
        definitionValid(g, spec) &&
        spec.id === h.catalogue &&
        spec.category === h.category &&
        spec.site === h.site &&
        (h.generatedCause
          ? records.has(h.generatedCause) &&
            spec.generatedCause === h.generatedCause &&
            source.cause === h.generatedCause
          : seasonalById[h.catalogue]?.category === h.category) &&
        ['awaiting', 'reported', 'settled'].includes(h.status) &&
        (h.status !== 'awaiting' || h.category === 'decision') &&
        (h.status !== 'reported' || h.category !== 'decision') &&
        (h.status !== 'settled' ||
          (result?.kind === 'decision' &&
            result.cause === h.source &&
            (h.category === 'decision'
              ? spec.options.some((o) => o.id === h.choice) &&
                typeof h.success === 'boolean' &&
                Number.isFinite(h.chance) &&
                h.chance >= 0 &&
                h.chance <= 1
              : h.choice === 'record'))) &&
        (h.delegate === undefined ||
          h.delegate === null ||
          !!g.people[h.delegate])
      );
    }) &&
    Array.isArray(s.boons) &&
    new Set(s.boons.map((b) => b.id)).size === s.boons.length &&
    new Set(s.boons.map((b) => b.source)).size === s.boons.length &&
    s.boons.every((b) => {
      const h = s.events.find((h) => h.source === b.source),
        spec = h && (h.definition || seasonalById[h.catalogue]);
      return (
        object(b) &&
        idValid(b.id) &&
        b.id === 'boon-' + b.source &&
        spec?.special?.kind === 'boon' &&
        b.name === spec.special.name &&
        b.field === spec.special.field &&
        b.amount === spec.special.amount &&
        b.turn === h.turn
      );
    }) &&
    [g.event, ...g.pending, ...g.scheduled]
      .filter(Boolean)
      .every((e) => seasonalEventValid(g, e)) &&
    g.archive.every(
      (r) =>
        !r.seasonalAssessment ||
        (object(r.seasonalAssessment) &&
          Number.isFinite(r.seasonalAssessment.chance) &&
          r.seasonalAssessment.chance >= 0 &&
          r.seasonalAssessment.chance <= 1 &&
          skills.includes(r.seasonalAssessment.skill) &&
          typeof r.seasonalAssessment.success === 'boolean' &&
          (r.seasonalAssessment.delegate === null ||
            !!g.people[r.seasonalAssessment.delegate])),
    )
  );
}
