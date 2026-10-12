import { hash, bound } from './sim-core.js?v=0.5.0';
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
const palette = [
  '#273f42',
  '#604247',
  '#554a28',
  '#294136',
  '#303854',
  '#76513a',
  '#40344b',
  '#3c4143',
];
const metals = ['#c8a46a', '#b2b8b2', '#a57b45', '#bca98e'];
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
  return {
    id: 'portrait-' + p.id,
    seed,
    version: 1,
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
export function portraitMarkup(p, cls = '') {
  const r = p.portraitRecipe;
  if (!r) return '';
  const id = r.id,
    coat = palette[r.color],
    metal = metals[r.metal],
    young = p.age < 16,
    infant = p.age < 3;
  const childFace =
    p.race === 'Beastfolk' ? 8 + (r.face - 16) : (childRace[p.race] ?? 0);
  const alternate = !young && r.alternate;
  const index = young ? childFace : alternate ? r.variant : r.face;
  const col = index % 4,
    row = Math.floor(index / 4),
    rows = young || alternate ? 4 : 6;
  const top =
    young || alternate ? row * 256 : [0, 248, 484, 728, 976, 1226][row];
  const cellHeight =
    young || alternate ? 256 : [248, 236, 244, 248, 250, 256][row];
  const scaleX = 240 / 256,
    scaleY = 240 / cellHeight;
  const image = young
    ? 'assets/child-portraits.png'
    : alternate
      ? 'assets/face-variants.png'
      : 'assets/campaign-portraits.png';
  const imageWidth = 1024 * scaleX,
    imageHeight = (young || alternate ? 1024 : 1536) * scaleY;
  const x = -col * 256 * scaleX,
    y = -top * scaleY;
  const old = p.age > 55;
  const painted =
    '<image href="' +
    image +
    '" x="' +
    x +
    '" y="' +
    (y + r.crop) +
    '" width="' +
    imageWidth +
    '" height="' +
    imageHeight +
    '" preserveAspectRatio="none"/>';
  const features =
    '<g mask="url(#' +
    id +
    '-eyes)" transform="translate(120 88) scale(' +
    (r.eyeWidth || 100) / 100 +
    ' 1) translate(-120 -88)">' +
    painted +
    '</g><g mask="url(#' +
    id +
    '-jaw)" transform="translate(120 106) scale(' +
    (r.jaw || 100) / 100 +
    ' 1) translate(-120 -106)">' +
    painted +
    '</g>';
  const background =
    r.backdrop % 3 === 0
      ? '<path d="M20 0v210M220 0v210M22 24h196M24 29h192" stroke="' +
        metal +
        '" opacity=".18"/><path d="M38 208V65Q120 2 202 65V208" fill="none" stroke="' +
        metal +
        '" opacity=".2"/>'
      : r.backdrop % 3 === 1
        ? '<path d="M12 220Q24 65 71 19M214 219Q199 59 170 13M45 75l-28-22M57 49l26-24M189 61l24-17" fill="none" stroke="#79916c" opacity=".3"/>'
        : '<circle cx="120" cy="105" r="100" fill="none" stroke="' +
          metal +
          '" opacity=".18"/><circle cx="120" cy="105" r="87" fill="none" stroke="' +
          metal +
          '" opacity=".1"/>';
  const garment = infant
    ? '<path d="M61 143Q120 115 181 143L220 240H20Z" fill="#d1c5a5"/><path d="M68 154L177 226M49 186L177 240M172 158L63 240" stroke="#a69b84" fill="none" stroke-width="4"/>'
    : r.garment === 3
      ? '<path d="M21 240V180Q55 141 88 145L120 167L152 145Q184 141 220 180V240Z" fill="url(#' +
        id +
        '-steel)"/><path d="M33 184L86 159L100 224M207 184L154 159L140 224M104 185h32v50h-32z" fill="none" stroke="' +
        metal +
        '" stroke-width="2"/>'
      : r.garment === 2
        ? '<path d="M14 240L35 166L89 141L120 166L151 141L205 166L226 240Z" fill="url(#' +
          id +
          '-cloth)"/><path d="M88 148L104 240M152 148L136 240" stroke="' +
          metal +
          '" stroke-width="3"/><path d="M116 168v72" stroke="#10191d" stroke-width="11"/>'
        : '<path d="M9 240L30 173Q60 149 85 143L120 172L155 143Q183 149 210 173L231 240Z" fill="url(#' +
          id +
          '-cloth)"/><path d="M85 146L100 240M155 146L140 240" stroke="' +
          metal +
          '" stroke-width="' +
          (r.garment === 0 ? 3 : 1) +
          '"/><path d="M34 197Q85 172 93 218M205 197Q157 172 149 218" fill="none" stroke="#a0a897" opacity=".12" stroke-width="3"/>';
  const headwear =
    r.headwear === 1
      ? '<path d="M57 127Q39 32 94 14Q156 -3 180 45L189 128L173 130Q180 41 140 26Q68 15 66 132Z" fill="url(#' +
        id +
        '-cloth)" opacity=".7" stroke="' +
        metal +
        '" stroke-width=".5"/>'
      : r.headwear === 2
        ? '<path d="M66 43Q118 17 172 41L165 49Q119 32 70 50Z" fill="' +
          metal +
          '" opacity=".75"/><circle cx="118" cy="39" r="4" fill="' +
          coat +
          '"/>'
        : r.headwear === 3
          ? '<path d="M61 44Q75 10 122 13Q162 9 179 42L167 53Q120 39 75 53Z" fill="' +
            coat +
            '" stroke="' +
            metal +
            '" stroke-width="1"/><path d="M69 43q51-19 101 0" fill="none" stroke="' +
            metal +
            '" stroke-width="2"/>'
          : r.headwear === 4
            ? '<path d="M68 40Q116 15 169 41" fill="none" stroke="#79976c" stroke-width="3"/><path d="M78 34l-8-9 14 4M101 26l-7-11 13 9M134 28l8-12-1 15M159 35l13-9-6 13" fill="#9da879"/>'
            : '';
  const accessory =
    r.accessory === 0
      ? '<circle cx="146" cy="171" r="8" fill="' +
        metal +
        '" stroke="#695a3d"/><path d="M142 171h8m-4-4v8" stroke="' +
        coat +
        '"/>'
      : r.accessory === 1
        ? '<path d="M92 158Q120 203 148 158" fill="none" stroke="' +
          metal +
          '" stroke-width="3"/><path d="M116 183h8v10h-8z" fill="' +
          metal +
          '"/>'
        : r.accessory === 2
          ? '<path d="M97 170L171 234" stroke="' +
            metal +
            '" stroke-width="6"/><path d="M122 190l8-8 11 11-8 8z" fill="#414238"/>'
          : r.accessory === 3
            ? '<path d="M176 192v36h17v-36z" fill="#836747" stroke="' +
              metal +
              '"/><path d="M181 195v30M187 195v30" stroke="#c1b598" opacity=".5"/>'
            : '<path d="M46 194L58 215L70 194" fill="none" stroke="' +
              metal +
              '" stroke-width="2"/>';
  const crest =
    '<path d="M178 203l7-5 7 5v11l-7 5-7-5z" fill="' +
    metal +
    '" opacity=".65"/><path d="M181 209h8m-4-4v8" stroke="' +
    coat +
    '" stroke-width="' +
    ((r.crest % 2) + 1) +
    '"/>';
  const scar =
    r.scar === 1
      ? '<path d="M147 75l-6 34" stroke="#c5ada3" stroke-width="1.6" opacity=".65"/><path d="M146 84l-4-1m3 11l-4-1" stroke="#70514a" stroke-width=".7"/>'
      : '';
  const hair =
    p.race !== 'Beastfolk' && r.hair % 3 === 1
      ? '<path d="M75 72Q49 52 82 23Q121 4 164 38Q126 18 102 44L88 70" fill="#302722" opacity=".38"/><path d="M72 60Q49 91 66 141M70 62Q59 102 75 145" fill="none" stroke="#4e392a" stroke-width="5"/>'
      : '';
  const age = old
    ? '<path d="M83 89l15-3M143 85l13 4M91 112l-6 13M148 110l8 16" fill="none" stroke="#a19080" opacity=".25" stroke-width="1"/>'
    : '';
  return (
    '<span class="portrait individual-portrait ' +
    cls +
    '" role="img" aria-label="Portrait of ' +
    esc(p.name) +
    '"><svg viewBox="0 0 240 240" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="' +
    id +
    '-bg" x2="1" y2="1"><stop stop-color="#4b4736"/><stop offset="1" stop-color="#172326"/></linearGradient><linearGradient id="' +
    id +
    '-cloth" x2=".7" y2="1"><stop stop-color="' +
    coat +
    '"/><stop offset=".5" stop-color="' +
    coat +
    '"/><stop offset="1" stop-color="#172023"/></linearGradient><linearGradient id="' +
    id +
    '-steel" x2="1" y2="1"><stop stop-color="#969d96"/><stop offset=".5" stop-color="#42525c"/><stop offset="1" stop-color="#242c30"/></linearGradient><radialGradient id="' +
    id +
    '-mask"><stop offset=".7" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient><linearGradient id="' +
    id +
    '-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="black"/><stop offset=".45" stop-color="white"/></linearGradient><mask id="' +
    id +
    '-body"><rect x="0" y="130" width="240" height="110" fill="url(#' +
    id +
    '-fade)"/></mask><mask id="' +
    id +
    '-eyes"><ellipse cx="120" cy="83" rx="61" ry="20" fill="url(#' +
    id +
    '-mask)"/></mask><mask id="' +
    id +
    '-jaw"><ellipse cx="120" cy="118" rx="52" ry="27" fill="url(#' +
    id +
    '-mask)"/></mask><mask id="' +
    id +
    '-face"><ellipse cx="120" cy="87" rx="' +
    (p.race === 'Beastfolk' ? 103 : 96) +
    '" ry="98" fill="url(#' +
    id +
    '-mask)"/></mask></defs><path d="M0 0h240v240H0z" fill="url(#' +
    id +
    '-bg)"/>' +
    background +
    '<g transform="translate(120 95) rotate(' +
    r.angle +
    ') scale(' +
    r.width / 100 +
    ' ' +
    r.height / 100 +
    ') translate(-120 -95)" mask="url(#' +
    id +
    '-face)"><image href="' +
    image +
    '" x="' +
    x +
    '" y="' +
    (y + r.crop) +
    '" width="' +
    imageWidth +
    '" height="' +
    imageHeight +
    '" preserveAspectRatio="none"/>' +
    features +
    '</g><g transform="translate(0 22)">' +
    garment +
    '</g><g mask="url(#' +
    id +
    '-body)" opacity=".9"><image href="' +
    image +
    '" x="' +
    x +
    '" y="' +
    y +
    '" width="' +
    imageWidth +
    '" height="' +
    imageHeight +
    '" preserveAspectRatio="none"/></g>' +
    headwear +
    hair +
    scar +
    age +
    accessory +
    crest +
    '<path d="M5 5h230v230H5z" fill="none" stroke="' +
    metal +
    '" stroke-width="1" opacity=".45"/></svg></span>'
  );
}
export function portraitsValid(g) {
  const seen = new Set();
  for (const p of Object.values(g.people)) {
    const r = p.portraitRecipe;
    if (
      !r ||
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
