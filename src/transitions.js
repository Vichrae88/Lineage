export const personMetrics = [
  'wealth',
  'health',
  'trust',
  'loyalty',
  'respect',
  'affection',
  'grievance',
  'reputation',
  'morale',
  'connections',
  'ambition',
  'fear',
];
export const factionMetrics = [
  'trust',
  'respect',
  'affection',
  'fear',
  'trade',
  'grievance',
];
export function transitionsBetween(before, g, expected = {}) {
  const rows = [];
  const capture = (scope, id, name, old, current, keys, attempts = {}) => {
    for (const field of new Set([...keys, ...Object.keys(attempts)])) {
      const a = old?.[field],
        b = current?.[field];
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      if (Math.abs(a - b) >= 0.005 || attempts[field])
        rows.push({
          scope,
          id: id || null,
          name: name || null,
          field,
          before: a,
          after: b,
          change: Math.round((b - a) * 100) / 100 || 0,
        });
    }
  };
  capture(
    'realm',
    null,
    null,
    before.resources,
    g.resources,
    Object.keys(g.resources),
    expected.realm,
  );
  for (const p of Object.values(g.people))
    if (before.people?.[p.id]) {
      capture(
        'person',
        p.id,
        p.name,
        before.people[p.id],
        p,
        personMetrics,
        expected.personId === p.id ? expected.person : {},
      );
      capture(
        'person',
        p.id,
        p.name,
        before.people[p.id].skills,
        p.skills,
        Object.keys(p.skills),
      );
    }
  for (const [id, b] of Object.entries(g.relationships))
    if (before.relationships?.[id])
      capture(
        'relationship',
        id,
        g.people[b.a].name + ' and ' + g.people[b.b].name,
        before.relationships[id],
        b,
        [
          'trust',
          'loyalty',
          'respect',
          'affection',
          'rivalry',
          'fear',
          'grievance',
        ],
      );
  for (const f of g.factions)
    capture(
      'faction',
      f.id,
      f.name,
      before.factions?.[f.id],
      f,
      factionMetrics,
    );
  for (const f of g.families)
    capture('family', f.id, f.name, before.families?.[f.id], f, [
      'power',
      'cohesion',
      'fortune',
      'standing',
    ]);
  for (const s of Object.values(g.settlements))
    capture('settlement', s.id, s.name, before.settlements?.[s.id], s, [
      'prosperity',
      'infrastructure',
      'health',
      'security',
      'trade',
      'foodProduction',
      'population',
    ]);
  return rows;
}
export function transitionsValid(rows, g) {
  return (
    Array.isArray(rows) &&
    rows.length <= 10000 &&
    rows.every(
      (t) =>
        t &&
        [
          'realm',
          'person',
          'faction',
          'family',
          'settlement',
          'relationship',
        ].includes(t.scope) &&
        typeof t.field === 'string' &&
        ['before', 'after', 'change'].every((k) => Number.isFinite(t[k])) &&
        Math.abs(t.after - t.before - t.change) < 0.011 &&
        (t.name === null || typeof t.name === 'string') &&
        (t.scope === 'realm' ||
          (t.scope === 'person' && g.people[t.id]) ||
          (t.scope === 'relationship' && g.relationships[t.id]) ||
          (t.scope === 'faction' && g.factions.some((f) => f.id === t.id)) ||
          (t.scope === 'family' && g.families.some((f) => f.id === t.id)) ||
          (t.scope === 'settlement' && g.settlements[t.id])),
    )
  );
}
