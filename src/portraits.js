import {
  choosePaint,
  paintingMarkup,
  paintingValid,
} from './portrait-painting.js?v=0.5.3';
import { paintedFace } from './portrait-catalog.js?v=0.5.3';
import { hash, bound } from './sim-core.js?v=0.5.3';
const starts = {
  Human: 0,
  Elf: 2,
  Dwarf: 4,
  Halfling: 6,
  Orc: 8,
  Goblin: 10,
  Gnoll: 12,
  Bugbear: 14,
};
const beasts = {
  Fox: 16,
  Wolf: 17,
  Cat: 18,
  Owl: 19,
  Bear: 20,
  Rabbit: 21,
  Otter: 22,
  Lizard: 23,
};
const childRace = {
  Human: 0,
  Elf: 1,
  Dwarf: 2,
  Halfling: 3,
  Orc: 4,
  Goblin: 5,
  Gnoll: 6,
  Bugbear: 7,
};
function number(seed, salt, min, max) {
  let n = hash(String(seed) + ':' + salt);
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
  n = (n ^ (n >>> 16)) >>> 0;
  return min + (n % (max - min + 1));
}
export function makePortraitRecipe(g, p) {
  const seed = hash(String(g.seed) + ':' + p.id);
  const parents = p.parentIds
    .map((id) => g.people[id]?.portraitRecipe)
    .filter(Boolean);
  const parent =
    parents.find(
      (r) => r.race === p.race && r.species === (p.species || null),
    ) || parents[0];
  const text = (p.appearance + ' ' + (p.presentation || '')).toLowerCase();
  const paint = choosePaint(g, p, seed);
  return {
    paint: paint.key,
    paintDescription: paint.description,
    visibleScar: text.includes('scar'),
    treatment:
      text.includes('court') || text.includes('formal') ? 'formal' : 'natural',
    id: 'portrait-' + p.id,
    seed,
    version: 2,
    race: p.race,
    species: p.species || null,
    face:
      p.race === 'Beastfolk'
        ? (beasts[p.species] ??
          (String(p.species).toLowerCase().includes('wolf') ? 17 : 18))
        : (starts[p.race] ?? 0) + (p.gender === 'Man' ? 0 : 1),
    width: parent
      ? bound(parent.width + number(seed, 'family-width', -3, 3), 87, 111)
      : number(seed, 'width', 87, 111),
    height: parent
      ? bound(parent.height + number(seed, 'family-height', -3, 3), 92, 107)
      : number(seed, 'height', 92, 107),
    eyeWidth: parent
      ? bound(parent.eyeWidth + number(seed, 'eye-inherit', -2, 2), 89, 112)
      : number(seed, 'eye-width', 89, 112),
    jaw: parent
      ? bound(parent.jaw + number(seed, 'jaw-inherit', -2, 2), 88, 112)
      : number(seed, 'jaw', 88, 112),
    angle: number(seed, 'angle', -3, 3),
    crop: number(seed, 'crop', -3, 3),
    garment: text.includes('armor')
      ? 3
      : text.includes('robe')
        ? 2
        : number(seed, 'garment', 0, 5),
    color: text.includes('blue')
      ? 4
      : text.includes('green')
        ? 3
        : number(seed, 'color', 0, 7),
    headwear: number(seed, 'headwear', 0, 5),
    accessory: number(seed, 'accessory', 0, 5),
    scar: text.includes('scar') ? 1 : number(seed, 'scar', 0, 5),
    mark: number(seed, 'mark', 0, 5),
    backdrop: number(seed, 'backdrop', 0, 5),
    metal: number(seed, 'metal', 0, 3),
    crest: number(seed, 'crest', 0, 7),
    hair: number(seed, 'hair', 0, 5),
    alternate: ['Human', 'Elf'].includes(p.race),
    variant:
      (p.race === 'Elf' ? 8 : 0) +
      (p.gender === 'Man'
        ? 0
        : p.gender === 'Woman'
          ? 4
          : number(seed, 'presentation', 0, 1) * 4) +
      (parent?.alternate ? parent.variant % 4 : number(seed, 'variant', 0, 3)),
    inherited: parent?.id || null,
  };
}
export function initializePortraits(g) {
  for (const p of Object.values(g.people))
    if (
      !p.portraitRecipe ||
      p.portraitRecipe.race !== p.race ||
      p.portraitRecipe.species !== (p.species || null)
    )
      p.portraitRecipe = makePortraitRecipe(g, p);
  for (const p of Object.values(g.people)) {
    if (p.birthRecord && p.parentIds.length && !p.portraitRecipe.inherited) {
      const inherited = makePortraitRecipe(g, p);
      p.portraitRecipe.eyeWidth = inherited.eyeWidth;
      p.portraitRecipe.jaw = inherited.jaw;
      p.portraitRecipe.width = inherited.width;
      p.portraitRecipe.height = inherited.height;
      p.portraitRecipe.inherited = inherited.inherited;
      p.portraitRecipe.alternate = inherited.alternate;
      p.portraitRecipe.variant = inherited.variant;
    }
  }
}
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
export function portraitMarkup(p, cls = '', style = null) {
  if (p.portraitRecipe?.version === 2) return paintingMarkup(p, cls, style);
  const r = p.portraitRecipe;
  if (!r) return '';
  const young = p.age < 16,
    alternate = !young && r.alternate;
  const childFace =
    p.race === 'Beastfolk' ? 8 + (r.face - 16) : (childRace[p.race] ?? 0);
  const index = young ? childFace : alternate ? r.variant : r.face,
    row = Math.floor(index / 4);
  const top =
    young || alternate ? row * 256 : [0, 248, 484, 728, 976, 1226][row];
  const cellHeight =
    young || alternate ? 256 : [248, 236, 244, 248, 250, 256][row];
  const scaleX = 240 / 256,
    scaleY = 240 / cellHeight;
  const hairy = p.race === 'Beastfolk' && p.species !== 'Lizard';
  const asset = young
    ? hairy
      ? 'child-portraits-hair.webp'
      : 'child-portraits.png'
    : alternate
      ? 'face-variants.png'
      : hairy
        ? 'campaign-portraits-hair.webp'
        : 'campaign-portraits.png';
  const image =
    '<svg x="0" y="0" width="240" height="240" viewBox="0 0 240 240" overflow="hidden"><image href="assets/' +
    asset +
    '" x="' +
    -(index % 4) * 256 * scaleX +
    '" y="' +
    (-top * scaleY + r.crop) +
    '" width="' +
    1024 * scaleX +
    '" height="' +
    (young || alternate ? 1024 : 1536) * scaleY +
    '" preserveAspectRatio="none"/></svg>';
  const features =
    '<g mask="url(#' +
    r.id +
    '-eyes)" transform="translate(120 88) scale(' +
    r.eyeWidth / 100 +
    ' 1) translate(-120 -88)">' +
    image +
    '</g><g mask="url(#' +
    r.id +
    '-jaw)" transform="translate(120 106) scale(' +
    r.jaw / 100 +
    ' 1) translate(-120 -106)">' +
    image +
    '</g>';
  return (
    '<span class="portrait individual-portrait legacy-portrait ' +
    (p.age > 55 ? 'portrait-aged ' : '') +
    esc(cls) +
    '" role="img" aria-label="Portrait of ' +
    esc(p.name) +
    '"><svg viewBox="0 0 240 240" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="' +
    r.id +
    '-soft"><stop offset=".7" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient><mask id="' +
    r.id +
    '-eyes"><ellipse cx="120" cy="83" rx="61" ry="20" fill="url(#' +
    r.id +
    '-soft)"/></mask><mask id="' +
    r.id +
    '-jaw"><ellipse cx="120" cy="118" rx="52" ry="27" fill="url(#' +
    r.id +
    '-soft)"/></mask></defs><rect width="240" height="240" fill="#332e24"/><g transform="translate(120 95) rotate(' +
    r.angle +
    ') scale(' +
    r.width / 100 +
    ' ' +
    r.height / 100 +
    ') translate(-120 -95)">' +
    image +
    features +
    '</g><rect x="3" y="3" width="234" height="234" fill="none" stroke="#ad966a" opacity=".5"/></svg></span>'
  );
}
export function portraitDescription(p) {
  return p.portraitRecipe?.version === 2
    ? paintedFace(p.portraitRecipe.paint)?.description ||
        p.portraitRecipe.paintDescription
    : p.portraitRecipe?.paintDescription || '';
}
export function portraitsValid(g) {
  const seen = new Set();
  for (const p of Object.values(g.people)) {
    const r = p.portraitRecipe;
    if (
      !r ||
      ![1, 2].includes(r.version) ||
      (r.version === 2 && !paintingValid(r)) ||
      r.id !== 'portrait-' + p.id ||
      seen.has(r.id) ||
      r.race !== p.race ||
      r.species !== (p.species || null) ||
      !Number.isInteger(r.seed) ||
      !Number.isInteger(r.face) ||
      r.face < 0 ||
      r.face > 23 ||
      !Number.isFinite(r.width) ||
      r.width < 87 ||
      r.width > 111 ||
      !Number.isFinite(r.height) ||
      r.height < 92 ||
      r.height > 107 ||
      !Object.entries({
        angle: [-3, 3],
        crop: [-3, 3],
        garment: [0, 5],
        color: [0, 7],
        headwear: [0, 5],
        accessory: [0, 5],
        scar: [0, 5],
        mark: [0, 5],
        backdrop: [0, 5],
        metal: [0, 3],
        crest: [0, 7],
        hair: [0, 5],
        variant: [0, 15],
        eyeWidth: [89, 112],
        jaw: [88, 112],
      }).every(
        ([k, [min, max]]) =>
          Number.isInteger(r[k]) && r[k] >= min && r[k] <= max,
      ) ||
      typeof r.alternate !== 'boolean'
    )
      return false;
    seen.add(r.id);
  }
  return true;
}
