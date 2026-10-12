const collections = [
  'court',
  'children',
  'kin',
  'applicants',
  'notables',
  'futurePeople',
];
export function serializeGame(g, pretty = false) {
  const save = { ...g, format: 'lineage-identities-v1', ruler: g.ruler.id };
  for (const key of collections) save[key] = (g[key] || []).map((p) => p.id);
  return JSON.stringify(save, null, pretty ? 2 : undefined);
}
export function readSave(text) {
  if (typeof text !== 'string' || text.length > 12 * 1024 * 1024)
    throw Error('This chronicle exceeds the 12 MB import limit.');
  const g = JSON.parse(text),
    stack = [{ value: g, depth: 0 }];
  let nodes = 0;
  while (stack.length) {
    const { value, depth } = stack.pop();
    if (++nodes > 1000000 || depth > 64)
      throw Error('This chronicle contains too much nested information.');
    if (typeof value === 'string' && value.length > 20000)
      throw Error('This chronicle contains an oversized entry.');
    if (!value || typeof value !== 'object') continue;
    if (Array.isArray(value) && value.length > 30000)
      throw Error('This chronicle contains an oversized register.');
    for (const [key, v] of Object.entries(value)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key))
        throw Error('This chronicle contains an unsafe field.');
      stack.push({ value: v, depth: depth + 1 });
    }
  }
  if (g?.format !== undefined) {
    if (
      g.format !== 'lineage-identities-v1' ||
      g.version !== 5 ||
      !g.people ||
      Array.isArray(g.people) ||
      Object.keys(g.people).length > 3000
    )
      throw Error('This compact chronicle is not supported.');
    const person = (id) => {
      if (
        typeof id !== 'string' ||
        !Object.hasOwn(g.people, id) ||
        g.people[id]?.id !== id
      )
        throw Error('This chronicle has a missing individual.');
      return g.people[id];
    };
    g.ruler = person(g.ruler);
    for (const key of collections) {
      if (!Array.isArray(g[key]) || new Set(g[key]).size !== g[key].length)
        throw Error('This chronicle has a damaged household register.');
      g[key] = g[key].map(person);
    }
    delete g.format;
  }
  return g;
}
