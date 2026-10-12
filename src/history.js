import {
  dateOf,
  delta,
  personList,
  personById,
  idValid,
  bound,
  rememberPerson,
} from './sim-core.js?v=0.5.0';
export function initHistory(g) {
  g.serial ||= {
    record: 0,
    fact: 0,
    institution: 0,
    arc: 0,
    event: 0,
    person: 0,
  };
  g.archive ||= (g.history || [])
    .slice()
    .reverse()
    .map((h, i) => ({
      ...h,
      id: 'record-' + i,
      kind: 'legacy',
      year: Math.floor(h.turn / 4) + 1,
      season: h.turn % 4,
      ruler: g.ruler.id,
      reign: g.dynasty,
      people: [],
      families: [],
      factions: [],
      site: null,
      cause: null,
      effects: {},
    }));
  g.serial.record = Math.max(g.serial.record, g.archive.length);
  g.facts ||= {};
  g.consequences ||= [];
  g.institutions ||= [];
  g.reports ||= [];
  g.lastOutcome ||= null;
}
export function appendRecord(g, record) {
  const e = {
    id: 'record-' + g.serial.record++,
    ...dateOf(g),
    kind: 'development',
    type: record.kind || 'development',
    people: [],
    families: [],
    factions: [],
    site: null,
    cause: null,
    effects: {},
    ...Object.fromEntries(
      Object.entries(record).filter(([, v]) => v !== undefined),
    ),
  };
  g.archive.push(e);
  return e;
}
export function addFact(g, kind, data, source) {
  const fact = {
    id: 'fact-' + g.serial.fact++,
    kind,
    status: 'active',
    ...dateOf(g),
    source: source || null,
    people: [],
    families: [],
    ...data,
  };
  g.facts[fact.id] = fact;
  return fact;
}
export function snapshot(g) {
  return {
    resources: { ...g.resources },
    people: Object.fromEntries(
      personList(g).map((p) => [
        p.id,
        {
          wealth: p.wealth || 0,
          health: p.health,
          trust: p.trust,
          loyalty: p.loyalty,
          respect: p.respect,
          skills: { ...p.skills },
        },
      ]),
    ),
    factions: Object.fromEntries(
      g.factions.map((f) => [
        f.id,
        { trust: f.trust, grievance: f.grievance, trade: f.trade },
      ]),
    ),
  };
}
export function decisionRecord(g, meta, before, text) {
  if (!g.archive) return null;
  const effects = delta(before?.resources || g.resources, g.resources);
  const changes = [];
  for (const p of personList(g)) {
    const old = before?.people?.[p.id];
    if (!old) continue;
    for (const [field, change] of Object.entries(delta(old, p)))
      if (['wealth', 'health', 'trust', 'loyalty', 'respect'].includes(field))
        changes.push({ person: p.id, field, change });
    for (const [skill, change] of Object.entries(
      delta(old.skills, p.skills || {}),
    ))
      changes.push({ person: p.id, field: skill, change });
  }
  const { existing: existingId, ...details } = meta;
  const data = {
    kind: meta.kind || 'decision',
    ...details,
    text,
    effects,
    changes,
  };
  const existing = meta.existing
    ? g.archive.find((e) => e.id === meta.existing)
    : null;
  const e = existing
    ? Object.assign(
        existing,
        Object.fromEntries(
          Object.entries(data).filter(([, v]) => v !== undefined),
        ),
      )
    : appendRecord(g, data);
  g.lastOutcome = {
    entry: e.id,
    text,
    effects,
    changes,
    people: e.people,
    site: e.site,
    facts: [],
  };
  if (e.kind !== 'audience-close') {
    if (meta.type === 'family') {
      const h = g.families.find((h) => h.id === meta.target);
      const members = (h?.memberIds || [])
        .map((id) => personById(g, id))
        .filter(Boolean);
      for (const p of members) {
        p.wealth = Math.max(
          0,
          (p.wealth || 12) +
            (meta.choice === 'patron' ? 5 : meta.choice === 'charter' ? 1 : -2),
        );
        p.grievance = bound(
          (p.grievance || 0) + (meta.choice === 'service' ? 12 : -3),
        );
        rememberPerson(g, p, text);
      }
      const f = addFact(
        g,
        meta.choice === 'service'
          ? 'family-grievance'
          : meta.choice === 'charter'
            ? 'family-charter'
            : 'family-favor',
        {
          families: [meta.target],
          people: members.map((p) => p.id),
          family: meta.target,
          site: h?.site || 'fields',
          severity: meta.choice === 'service' ? 16 : 8,
        },
        e.id,
      );
      g.lastOutcome.facts.push(f.id);
    }
    if (meta.type === 'policy') {
      const policy = ['gentle', 'balanced', 'heavy'].includes(meta.choice)
        ? 'tax'
        : ['restore', 'strict'].includes(meta.choice)
          ? 'law'
          : 'rites';
      for (const f of Object.values(g.facts))
        if (f.kind === 'law' && f.policy === policy && f.status === 'active') {
          f.status = 'ended';
          f.ended = g.turn;
        }
      g.lastOutcome.facts.push(
        addFact(g, 'law', { choice: meta.choice, policy }, e.id).id,
      );
    }
    if (meta.type === 'dismiss')
      g.lastOutcome.facts.push(
        addFact(
          g,
          'former-adviser',
          { people: [meta.target], choice: meta.choice },
          e.id,
        ).id,
      );
    if (meta.type === 'diplomacy')
      g.lastOutcome.facts.push(
        addFact(
          g,
          meta.choice === 'alliance' ? 'treaty' : 'diplomatic-promise',
          { faction: meta.target, choice: meta.choice },
          e.id,
        ).id,
      );
  }
  changes.length = 0;
  for (const p of personList(g)) {
    const old = before?.people?.[p.id];
    if (!old) continue;
    for (const [field, change] of Object.entries(delta(old, p)))
      if (['wealth', 'health', 'trust', 'loyalty', 'respect'].includes(field))
        changes.push({ person: p.id, field, change });
    for (const [field, change] of Object.entries(delta(old.skills, p.skills)))
      changes.push({ person: p.id, field, change });
  }
  for (const f of g.factions) {
    for (const [field, change] of Object.entries(
      delta(before?.factions?.[f.id] || {}, f),
    ))
      if (['trust', 'grievance', 'trade'].includes(field)) {
        changes.push({ faction: f.id, field, change });
        if (!e.factions.includes(f.id)) e.factions.push(f.id);
      }
  }
  for (const p of changes.filter((c) => c.person))
    if (!e.people.includes(p.person)) e.people.push(p.person);
  return e;
}
export function schedule(g, kind, source, delay, details = {}) {
  if (
    g.consequences.some(
      (c) =>
        c.kind === kind &&
        c.source === source &&
        c.stage === (details.stage || 1),
    )
  )
    return;
  g.consequences.push({
    id: 'arc-' + g.serial.arc++,
    kind,
    source,
    due: g.turn + delay,
    status: 'scheduled',
    stage: 1,
    ...details,
  });
}
export function historyValid(g) {
  const records = new Set();
  for (const e of g.archive || []) {
    if (
      !e ||
      !idValid(e.id) ||
      records.has(e.id) ||
      typeof e.text !== 'string' ||
      e.text.length > 20000 ||
      !Number.isInteger(e.turn) ||
      !Array.isArray(e.people) ||
      !Array.isArray(e.families) ||
      !Array.isArray(e.factions)
    )
      return false;
    records.add(e.id);
  }
  if (
    g.archive.some(
      (e) =>
        (e.cause && !records.has(e.cause)) ||
        (e.effects &&
          Object.values(e.effects).some((n) => !Number.isFinite(n))) ||
        (e.changes && !Array.isArray(e.changes)),
    )
  )
    return false;
  const indexes = new Map(g.archive.map((e, i) => [e.id, i]));
  if (g.archive.some((e, i) => e.cause && indexes.get(e.cause) >= i))
    return false;
  if (
    Object.values(g.facts).some(
      (f) =>
        !f ||
        !idValid(f.id) ||
        typeof f.kind !== 'string' ||
        !['active', 'ended', 'reversed'].includes(f.status) ||
        (f.source && !records.has(f.source)),
    )
  )
    return false;
  return (
    Array.isArray(g.consequences) &&
    g.consequences.every(
      (c) =>
        idValid(c.id) &&
        Number.isInteger(c.due) &&
        ['scheduled', 'offered', 'completed', 'cancelled'].includes(c.status) &&
        records.has(c.source),
    )
  );
}
