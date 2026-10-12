export const bound = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
export function hash(text) {
  let n = 2166136261;
  for (const c of String(text)) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0;
}
export const roll = (g, salt) => hash(String(g.seed ?? 71421) + ':' + g.turn + ':' + salt) / 4294967296;
export const personList = g => [...new Map([g.ruler, ...g.court, ...g.children, ...(g.kin || []), ...g.applicants, ...(g.notables || [])].filter(Boolean).map(p => [p.id, p])).values()];
export const personById = (g, id) => g.people?.[id] || personList(g).find(p => p.id === id);
export const placeList = g => g.world.sites;
export const dateOf = g => ({turn:g.turn, year:g.year, season:g.season, ruler:g.ruler.id, rulerName:g.ruler.name, reign:g.dynasty});
export const delta = (before, after) => Object.fromEntries(Object.keys(after).filter(k => typeof after[k] === 'number' && after[k] !== before[k]).map(k => [k, Math.round((after[k] - before[k]) * 100) / 100]));
export const roundMoney = n => Math.round(n * 100) / 100;
export const idValid = s => typeof s === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(s) && !['__proto__','constructor','prototype'].includes(s);
export function rememberPerson(g,p,text) {
  if (!p) return;
  p.memories ||= [];
  p.memories.unshift(['Spring','Summer','Autumn','Winter'][g.season] + ', Year ' + g.year + ': ' + text);
  p.memories = p.memories.slice(0,20);
}
