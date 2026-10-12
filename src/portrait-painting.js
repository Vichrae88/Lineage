import { hash, bound } from './sim-core.js?v=0.5.1';
import { portraitCatalog, paintedFace } from './portrait-catalog.js?v=0.5.1';
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
const life = {
  Human: 85,
  Elf: 220,
  Dwarf: 150,
  Halfling: 105,
  Orc: 85,
  Goblin: 80,
  Gnoll: 80,
  Bugbear: 90,
  Beastfolk: 90,
};
export function choosePaint(g, p, seed) {
  const age = p.age / (life[p.race] || 85),
    stage = age > 0.65 ? 'elder' : age > 0.42 ? 'mature' : 'young';
  const text = (
    p.appearance +
    ' ' +
    (p.presentation || '') +
    ' ' +
    (p.disposition || '')
  ).toLowerCase();
  let pool = portraitCatalog.filter(
    (f) =>
      f.race === p.race &&
      (p.race !== 'Beastfolk' || f.species === (p.species || 'Fox')),
  );
  if (!pool.length)
    pool = portraitCatalog.filter(
      (f) => f.race === 'Beastfolk' && f.species === 'Cat',
    );
  if (
    ['Human', 'Elf', 'Dwarf', 'Halfling', 'Orc', 'Goblin'].includes(p.race) &&
    p.gender !== 'Nonbinary'
  ) {
    const matched = pool.filter((f) => f.gender === p.gender);
    if (matched.length) pool = matched;
  }
  const coat = text.match(
    /(black|white|silver|gray|red|russet|brown|blue|green|tawny) (?:fur|feathers|scales)/,
  );
  if (coat) {
    const matched = pool.filter((f) => f.description.includes(coat[1]));
    if (matched.length) pool = matched;
  }
  if (text.includes('bald')) {
    const matched = pool.filter((f) => f.description.includes('bald'));
    if (matched.length) pool = matched;
  }
  const aged = pool.filter((f) =>
    stage === 'young'
      ? f.age !== 'elder'
      : stage === 'elder'
        ? f.age !== 'young'
        : true,
  );
  if (aged.length) pool = aged;
  const important = [
    'black',
    'white',
    'silver',
    'gray',
    'red',
    'blue',
    'green',
    'brown',
    'bald',
    'braid',
    'scar',
    'robe',
    'armor',
    'hood',
    'freckle',
    'curly',
    'circlet',
  ];
  const ranked = pool
    .map((f) => ({
      f,
      score:
        (p.gender === 'Nonbinary' || f.gender === p.gender ? 2 : 0) +
        (f.age === stage ? 3 : 0) +
        important.reduce(
          (n, w) =>
            n +
            (text.includes(w) && f.description.includes(w)
              ? w === 'bald' || w === 'scar' || w === 'white' || w === 'black'
                ? 4
                : 2
              : 0),
          0,
        ),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        hash(seed + ':' + a.f.key) - hash(seed + ':' + b.f.key),
    );
  const top = ranked[0].score,
    eligibleBase = ranked.filter((f) => f.score >= top - 6),
    parents = new Set(
      p.parentIds.map((id) => g.people[id]?.portraitRecipe?.paint),
    );
  const distinct = eligibleBase.filter(({ f }) => !parents.has(f.key)),
    eligible = distinct.length ? distinct : eligibleBase;
  const used = new Map();
  for (const person of Object.values(g.people)) {
    if (person.id !== p.id && person.portraitRecipe?.paint)
      used.set(
        person.portraitRecipe.paint,
        (used.get(person.portraitRecipe.paint) || 0) + 1,
      );
  }
  const lowest = Math.min(...eligible.map(({ f }) => used.get(f.key) || 0)),
    fresh = eligible.filter(({ f }) => (used.get(f.key) || 0) === lowest);
  const chosen = fresh[hash(seed + ':paint') % fresh.length].f;
  return { key: chosen.key, description: chosen.description, stage };
}
export function paintingMarkup(p, cls = '', style = null) {
  const r = p.portraitRecipe,
    face = paintedFace(r.paint),
    treatment = ['natural', 'formal', 'chronicle'].includes(style)
      ? style
      : r.treatment || 'natural',
    id = r.id + '-' + treatment;
  const young = p.age < 16,
    old = p.age > (life[p.race] || 85) * 0.7;
  const children = {
    Human: 0,
    Elf: 1,
    Dwarf: 2,
    Halfling: 3,
    Orc: 4,
    Goblin: 5,
    Gnoll: 6,
    Bugbear: 7,
    Fox: 8,
    Wolf: 9,
    Cat: 10,
    Owl: 11,
    Bear: 12,
    Rabbit: 13,
    Otter: 14,
    Lizard: 15,
  };
  const index = young ? (children[p.species || p.race] ?? 0) : face.index,
    atlas = young ? 'child-portraits' : face.atlas;
  const image =
    '<image href="assets/' +
    atlas +
    (young ? '.png' : '.webp') +
    '" x="' +
    -(index % 4) * 240 +
    '" y="' +
    -Math.floor(index / 4) * 240 +
    '" width="960" height="960" preserveAspectRatio="none"/>';
  const formal = treatment === 'formal',
    chronicle = treatment === 'chronicle';
  const scale = formal ? 0.94 : treatment === 'natural' ? 1.05 : 1;
  const framing = formal
    ? '<path d="M8 8h224v224H8zM14 14h212v212H14z" fill="none" stroke="#c4a56b" stroke-width="2"/><path d="M15 40V15h25M200 15h25v25M225 200v25h-25M40 225H15v-25" stroke="#dfc58b" stroke-width="3" fill="none"/>'
    : chronicle
      ? '<path d="M4 5l232 1-2 229-229-2z" fill="none" stroke="#887052" stroke-width="2"/><path d="M10 225q40-4 60 2M170 228q30-6 60-4" fill="none" stroke="#897152" opacity=".6"/>'
      : '<path d="M3 3h234v234H3z" stroke="#ad966a" fill="none" opacity=".5"/>';
  const gray = old
    ? '<path d="M64 50q-14 29-10 80M176 44q14 40 7 91" fill="none" stroke="#c7c8b7" stroke-width="3" opacity=".35"/><path d="M80 98l12-3M149 96l12 4M92 132l-7 9M146 130l8 11" stroke="#b9a594" fill="none" opacity=".3"/>'
    : '';
  const scar = r.visibleScar
    ? '<path d="M145 86l-12 40" stroke="#d1b2a0" stroke-width="2" opacity=".65"/><path d="M142 97l-5-2m2 13l-5-2" stroke="#644237" stroke-width="1"/>'
    : '';
  const features =
    '<g mask="url(#' +
    id +
    '-morph)" transform="translate(120 100) scale(' +
    r.eyeWidth / 100 +
    ' ' +
    r.jaw / 100 +
    ') translate(-120 -100)">' +
    image +
    '</g>';
  return (
    '<span class="portrait individual-portrait painted-portrait treatment-' +
    esc(treatment) +
    ' ' +
    cls +
    '" role="img" aria-label="Portrait of ' +
    esc(p.name) +
    '"><svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id="' +
    id +
    '-soft"><stop offset=".65" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient><mask id="' +
    id +
    '-morph"><ellipse cx="120" cy="108" rx="71" ry="72" fill="url(#' +
    id +
    '-soft)"/></mask></defs><rect width="240" height="240" fill="' +
    (chronicle ? '#d8c7a4' : '#332e24') +
    '"/><g transform="translate(120 120) scale(' +
    scale +
    ') translate(-120 -120)"><g transform="translate(120 98) rotate(' +
    r.angle +
    ') scale(' +
    r.width / 100 +
    ' ' +
    r.height / 100 +
    ') translate(-120 -98)">' +
    image +
    features +
    scar +
    gray +
    '</g></g>' +
    framing +
    '</svg></span>'
  );
}
export function paintingValid(r) {
  const f = paintedFace(r.paint);
  return (
    r.version === 2 &&
    !!f &&
    f.race === r.race &&
    (r.race !== 'Beastfolk' ||
      f.species ===
        ([
          'Fox',
          'Wolf',
          'Cat',
          'Owl',
          'Bear',
          'Rabbit',
          'Otter',
          'Lizard',
        ].includes(r.species)
          ? r.species
          : 'Cat')) &&
    typeof r.paintDescription === 'string' &&
    ['formal', 'natural', 'chronicle'].includes(r.treatment) &&
    typeof r.visibleScar === 'boolean'
  );
}
