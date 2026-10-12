import { transitionsValid } from './transitions.js?v=0.5.1';
import { idValid } from './sim-core.js?v=0.5.1';
const unique = (rows, key = 'id') =>
  new Set(rows.map((row) => row[key])).size === rows.length;
const objects = (value) =>
  value && typeof value === 'object' && !Array.isArray(value);
const numeric = (value) =>
  objects(value) && Object.values(value).every(Number.isFinite);
export function worldReferencesValid(g) {
  if (
    g.archive.some(
      (e) => e.transitions && !transitionsValid(e.transitions, g),
    ) ||
    g.reports.some((r) => r.transitions && !transitionsValid(r.transitions, g))
  )
    return false;
  const people = g.people,
    records = new Set(g.archive.map((e) => e.id)),
    institutions = new Set(g.institutions.map((i) => i.id)),
    families = new Set(g.families.map((h) => h.id)),
    factions = new Set(g.factions.map((f) => f.id));
  if (
    !unique(g.institutions) ||
    !unique(g.consequences) ||
    !unique(g.trainingJobs) ||
    !unique(g.obligations) ||
    !unique(g.world.sites)
  )
    return false;
  for (const key of [
    'court',
    'children',
    'kin',
    'notables',
    'applicants',
    'futurePeople',
  ])
    if (!unique(g[key]) || g[key].some((p) => !people[p.id])) return false;
  if (
    g.archive.some(
      (e) =>
        e.people.some((id) => !people[id]) ||
        e.families.some((id) => !families.has(id)) ||
        e.factions.some((id) => !factions.has(id)) ||
        (e.site && !g.settlements[e.site]),
    )
  )
    return false;
  if (
    g.archive.some(
      (e) =>
        e.assessment &&
        (!Number.isFinite(e.assessment.score) ||
          !Number.isFinite(e.assessment.chance) ||
          typeof e.assessment.skill !== 'string' ||
          !Array.isArray(e.assessment.contributions) ||
          e.assessment.contributions.some(
            (c) =>
              !c || typeof c.label !== 'string' || !Number.isFinite(c.modifier),
          )),
    )
  )
    return false;
  for (const [id, f] of Object.entries(g.facts))
    if (
      f.id !== id ||
      !Array.isArray(f.people) ||
      !Array.isArray(f.families) ||
      f.people.some((id) => !people[id]) ||
      f.families.some((id) => !families.has(id)) ||
      (f.site && !g.settlements[f.site]) ||
      (f.institution && !institutions.has(f.institution))
    )
      return false;
  for (const s of Object.values(g.settlements))
    if (
      s.residents.some((id) => !people[id]) ||
      s.institutions.some((id) => !institutions.has(id)) ||
      s.families.some((id) => !families.has(id)) ||
      s.history.some((id) => !records.has(id))
    )
      return false;
  for (const i of g.institutions)
    if (
      !records.has(i.source) ||
      i.staff.some((id) => !people[id]) ||
      i.students.some((id) => !people[id]) ||
      !Array.isArray(i.milestones)
    )
      return false;
  for (const p of Object.values(people))
    if (
      !g.settlements[p.siteId] ||
      ![
        'Human',
        'Elf',
        'Dwarf',
        'Halfling',
        'Orc',
        'Goblin',
        'Gnoll',
        'Bugbear',
        'Beastfolk',
      ].includes(p.race) ||
      typeof p.profession !== 'string' ||
      typeof p.values !== 'string' ||
      !Array.isArray(p.memories) ||
      p.memories.some((m) => typeof m !== 'string') ||
      !Array.isArray(p.traits) ||
      p.traits.some((t) => typeof t !== 'string') ||
      (p.rejectedClaim &&
        (!Number.isInteger(p.rejectedClaim.turn) ||
          (p.rejectedClaim.source && !records.has(p.rejectedClaim.source)))) ||
      (p.education &&
        (!institutions.has(p.education.institution) ||
          !Number.isInteger(p.education.seasons) ||
          !['studying', 'graduated'].includes(p.education.status)))
    )
      return false;
  const templates = [
    'commercial-concern',
    'commercial-legacy',
    'royal-legacy',
    'shortage',
    'institution',
    'family-memory',
    'rivalry',
    'talent',
    'enterprise',
    'graduate',
    'local-initiative',
    'frontier',
    'claimant',
  ];
  for (const e of [g.event, ...g.pending, ...g.scheduled].filter(Boolean)) {
    if (e.engine && !['emergent', 'consequence'].includes(e.engine))
      return false;
    if (e.origin && !records.has(e.origin)) return false;
    if (
      e.engine === 'consequence' &&
      !g.consequences.some((c) => c.id === e.arc && c.status === 'offered')
    )
      return false;
    if (
      e.engine === 'emergent' &&
      (!templates.includes(e.template) ||
        !people[e.speaker] ||
        !g.settlements[e.site] ||
        (e.template === 'institution' && !institutions.has(e.institution)) ||
        (e.template === 'family-memory' &&
          (!g.facts[e.fact] || !families.has(e.family))) ||
        (e.template === 'rivalry' &&
          (!Array.isArray(e.relation) ||
            e.relation.length !== 2 ||
            !g.relationships[e.relation.slice().sort().join('|')])) ||
        (['commercial-concern', 'commercial-legacy'].includes(e.template) &&
          !g.ventures.some((v) => v.id === e.venture)) ||
        (e.template === 'royal-legacy' &&
          !g.ambitions.some((a) => a.id === e.ambition)) ||
        (e.template === 'frontier' && !factions.has(e.faction)))
    )
      return false;
  }
  for (const c of g.consequences)
    if (
      ![
        'mill-community',
        'mill-legacy',
        'school-maturity',
        'road-commerce',
      ].includes(c.kind) ||
      !g.settlements[c.site] ||
      !Array.isArray(c.people) ||
      c.people.some((id) => !people[id]) ||
      (c.institution && !institutions.has(c.institution))
    )
      return false;
  for (const o of g.obligations)
    if (
      !idValid(o.id) ||
      !['active', 'paid'].includes(o.status) ||
      !factions.has(o.faction)
    )
      return false;
  if (
    Object.values(g.eventMemory.templates).some((n) => !Number.isInteger(n)) ||
    Object.values(g.eventMemory.subjects).some((n) => !Number.isInteger(n)) ||
    Object.values(g.eventMemory.fingerprints).some((id) => !idValid(id))
  )
    return false;
  for (const [counter, prefix, rows] of [
    ['record', 'record-', g.archive],
    ['fact', 'fact-', Object.values(g.facts)],
    ['institution', 'institution-', g.institutions],
    ['arc', 'arc-', g.consequences],
    ['arc', 'training-', g.trainingJobs],
    ['arc', 'debt-', g.obligations],
    ['arc', 'promise-', g.promises || []],
    ['arc', 'ambition-', g.ambitions || []],
  ]) {
    const max = Math.max(
      -1,
      ...rows.map((r) =>
        r.id.startsWith(prefix) ? Number(r.id.slice(prefix.length)) : -1,
      ),
    );
    if (g.serial[counter] <= max) return false;
  }
  const reportValid = (r) =>
    r &&
    Number.isInteger(r.year) &&
    r.year >= 1 &&
    Number.isInteger(r.season) &&
    r.season >= 0 &&
    r.season <= 3 &&
    Number.isInteger(r.turn) &&
    numeric(r.changes) &&
    Array.isArray(r.outcomes) &&
    r.outcomes.every((id) => records.has(id)) &&
    (!r.entry || records.has(r.entry)) &&
    objects(r.economy) &&
    Object.entries(r.economy).every(([key, value]) =>
      key === 'assumptions'
        ? typeof value === 'string'
        : Number.isFinite(value),
    );
  if (
    g.reports.some((r) => !reportValid(r)) ||
    (g.lastSeasonReport && !reportValid(g.lastSeasonReport))
  )
    return false;
  const o = g.lastOutcome;
  if (
    o &&
    (!records.has(o.entry) ||
      typeof o.text !== 'string' ||
      !numeric(o.effects) ||
      !Array.isArray(o.changes) ||
      o.changes.some(
        (c) =>
          !c ||
          typeof c.field !== 'string' ||
          !Number.isFinite(c.change) ||
          (c.person && !people[c.person]) ||
          (c.faction && !factions.has(c.faction)),
      ) ||
      !Array.isArray(o.facts) ||
      o.facts.some((id) => !g.facts[id]))
  )
    return false;
  return true;
}
