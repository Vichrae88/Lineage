import { serializeGame } from './persistence.js?v=0.5.0';
import { familyTreeView, reignsView, claimView } from './dynasty-ui.js?v=0.5.0';
import { commissionCapacity, courtCapacity } from './dynasty.js?v=0.5.0';
import {
  createGame,
  seasons,
  roles,
  activeCourt,
  qualitative,
  resourceStory,
  getDecision,
  enact,
  eventOptions,
  resolveEvent,
  parseSave,
  races,
  raceName,
  availableMentors,
  professionalForecast,
  realmSites,
  realmFactions,
  realmExpeditions,
  realmRelics,
  realmProjects,
  findPerson,
  household,
  prepareAudience,
  advance,
} from './game.js?v=0.5.0';
import { dispositions, presentations } from './campaign.js?v=0.5.0';
import {
  projectionView,
  outcomeView,
  seasonReportView,
  archiveView,
  entryView,
  localDevelopmentView,
} from './reports-ui.js?v=0.5.0';
import {
  characterDevelopmentView,
  forecastView,
} from './characters-ui.js?v=0.5.0';
import { portraitMarkup } from './portraits.js?v=0.5.0';
import { realmDemographics } from './demographics.js?v=0.5.0';
let sites, factionLore, expeditions, relics, projects;
let returnModal = null;
let modalStack = [];
const app = document.querySelector('#app');
let g = null,
  tab = 'council',
  step = 0,
  modal = null,
  message = '',
  lastFocus = null;
const answers = {
  scale: 'town',
  name: '',
  realm: '',
  gender: 'Nonbinary',
  age: '28',
  disposition: 'Patient',
  presentation: presentations[0],
  appearance: '',
  race: 'Human',
  species: 'Random',
  values: 'Compassion',
  history: 'Inherited',
};
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
const btn = (label, action, extra = '') =>
  `<button type="button" data-action="${action}" ${extra}>${label}</button>`;
const portraitIds = [
  'mira',
  'brann',
  'sable',
  'vesh',
  'liora',
  'kesh',
  'orrin',
  'tala',
  'rowan',
  'fen',
  'nima',
  'ivo',
];
const portrait = (c, cls = '') => {
  if (c.portraitRecipe) return portraitMarkup(c, cls);
  if (c.artset === 'campaign' && /^generated-\d+$/.test(c.portrait || '')) {
    const i = Number(c.portrait.split('-')[1]);
    const row = Math.floor(i / 4),
      starts = [0, 248, 484, 728, 976, 1226],
      heights = [248, 236, 244, 248, 250, 256];
    return `<span class="portrait campaign-portrait ${cls}" role="img" aria-label="Portrait of ${esc(c.name)}" style="--portrait-x:${((i % 4) * 100) / 3}%;--portrait-y:${(starts[row] / (1536 - heights[row])) * 100}%;--portrait-sheet-height:${(1536 / heights[row]) * 100}%"></span>`;
  }
  const id =
    c.portrait ||
    c.id ||
    (c.race === 'Beastfolk'
      ? { fox: 'rowan', wolf: 'fen', cat: 'nima', owl: 'ivo' }[
          (c.species || '').toLowerCase()
        ]
      : null);
  const i = portraitIds.indexOf(id);
  return i < 0
    ? `<span class="portrait portrait-unknown ${cls}" role="img" aria-label="Personal crest of ${esc(c.name)}"><span aria-hidden="true">${esc((c.name || 'L').slice(0, 1))}</span></span>`
    : `<span class="portrait ${cls}" role="img" aria-label="Portrait of ${esc(c.name)}" style="--portrait-x:${((i % 4) * 100) / 3}%;--portrait-y:${Math.floor(i / 4) * 50}%"></span>`;
};
const landscape = (scene = 'hall', label = '', cls = '') =>
  `<span class="landscape scene-${['hall', 'fields', 'forest', 'ruins'].includes(scene) ? scene : 'hall'} ${cls}" role="img" aria-label="${esc(label)}"></span>`;
const contextArt = (kind = 'hall', label = '') =>
  `<div class="audience-art"><span class="context-landscape context-${['hall', 'market', 'gate', 'healer', 'shrine', 'archive'].includes(kind) ? kind : 'hall'}" role="img" aria-label="${esc(label)}"></span></div>`;
const narrate = (label, value, kind = 'trust') =>
  `<span class="narrative-stat" title="${esc(label)}: ${Math.round(value)} of 100"><small>${esc(label)}</small><strong>${qualitative(value, kind)}</strong></span>`;
function header() {
  return `<header class="masthead"><div class="brand"><span class="sigil" aria-hidden="true">♜</span><div><h1>LINEAGE</h1><span>A realm to inherit. A story to leave.</span></div></div><details class="save-menu"><summary>Chronicle <span aria-hidden="true">⌄</span></summary><div class="save-options">${g ? btn('Save in this browser', 'save') : ''}${btn('Load saved game', 'load')}${g ? btn('Export a backup', 'export') + btn('Read the chronicle', 'chronicle') + btn('The ruler’s guide', 'guide') + btn('Start a new campaign', 'new') : ''}<label class="button file-button" tabindex="0">Import a chronicle<input id="import" type="file" accept="application/json,.json" hidden></label>${previousAvailable() ? btn('Restore previous campaign', 'previous') : ''}<small>${g ? 'Decisions save automatically.' : 'Continue a previous reign.'}</small></div></details></header>`;
}
const questions = [
  [
    'How large is the realm you inherit?',
    'Choose the distance between your throne and the people who depend on it.',
    'scale',
    ['town', 'province'],
  ],
  [
    'Who will wear the crown?',
    'Your people shape the realm’s predominant culture. Beastfolk communities and courtiers draw from many animal species.',
    'identity',
  ],
  [
    'At what age do you inherit?',
    'Youth brings time to build a legacy. An older ruler begins with less time, but a lifetime already behind them.',
    'age',
  ],
  [
    'How do you face a difficult choice?',
    'Your disposition shapes the person the court meets before they hear a single decree.',
    'disposition',
    dispositions,
  ],
  [
    'What does the court see when you enter?',
    'Choose the style you favor, and describe the details you want remembered. Your portrait represents your heritage; your words complete the picture.',
    'appearance',
  ],
  [
    'What will guide your rule?',
    'Conviction leaves its first mark on the realm. Your choices decide whether it becomes a lasting example.',
    'values',
    ['Compassion', 'Prosperity', 'Strength', 'Harmony'],
  ],
  [
    'How did you reach the throne?',
    'The old houses remember how you arrived. Surviving relatives have hopes of their own; no parent remains to shelter the new reign.',
    'history',
    ['Inherited', 'Chosen by the council', 'Won through rebellion'],
  ],
];
const choiceDescription = {
  town: 'A close-knit community of hearths, mills, and familiar faces. Gentler pressures. Grow into a city.',
  province:
    'A divided territory of old houses and distant settlements. Harder choices. Grow into a kingdom.',
  Compassion:
    'Clean wells and a healer at every hearth. Your realm begins with stronger public health.',
  Prosperity:
    'Work worth doing and roads worth traveling. Your markets begin with stronger commerce.',
  Strength:
    'A promise that your people will be protected. Your watch begins better prepared.',
  Harmony:
    'A place for every peaceful neighbor. Your realm begins with fairer institutions.',
  Inherited:
    'An established claim, accepted by most of the old houses. Your authority begins on firmer ground.',
  'Chosen by the council':
    'You owe your crown to a collection of hopes. The houses are still weighing your authority.',
  'Won through rebellion':
    'You broke the old order. Legitimacy must now grow from what you build in its place.',
};
function collectCreation() {
  for (const el of app.querySelectorAll('[data-answer]'))
    answers[el.name] = el.value;
}
function creation() {
  const q = questions[step];
  const select = (name, values) =>
    `<select name="${name}" data-answer>${values.map((v) => `<option ${answers[name] === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>`;
  let content;
  if (q[2] === 'identity')
    content = `<div class="fields"><label>Your name<input data-answer name="name" maxlength="40" value="${esc(answers.name)}" placeholder="Let your people’s names inspire one" autocomplete="off"><small>Leave blank for a name from your culture.</small></label><label>The realm’s name<input data-answer name="realm" maxlength="40" value="${esc(answers.realm)}" placeholder="Leave blank for a new realm" autocomplete="off"></label><label>Your people${select('race', races)}</label><label>Your gender${select('gender', ['Woman', 'Man', 'Nonbinary'])}</label><p class="creation-note">Your court, neighbors, families, and locations will be newly generated. Choosing Beastfolk gives your court varied animal heritages.</p></div>`;
  else if (q[2] === 'age')
    content = `<div class="age-choice"><label>Your age in years<input data-answer name="age" type="number" min="18" max="90" value="${esc(answers.age)}" required></label><p>A ruler may begin between eighteen and ninety. You will age with the seasons, and a named heir can carry the story onward.</p></div>`;
  else if (q[2] === 'appearance')
    content = `<div class="fields appearance-fields"><label>How you dress at court${select('presentation', presentations)}</label><label>Details you want remembered<textarea data-answer name="appearance" maxlength="240" rows="3" placeholder="A scar, a favorite cloak, the color of your fur or hair, the way you carry yourself…">${esc(answers.appearance)}</textarea></label><p class="creation-note">Your heritage describes your own character. Your realm includes varied species and other peoples.</p></div>`;
  else
    content = `<div class="creation-choices ${q[2] === 'disposition' ? 'disposition-choices' : ''}">${q[3].map((v) => `<button class="choice ${answers[q[2]] === v ? 'selected' : ''}" data-creation="${esc(v)}" aria-pressed="${answers[q[2]] === v}"><strong>${v === 'town' ? 'A town' : v === 'province' ? 'A province' : esc(v)}</strong><span>${choiceDescription[v] || { Patient: 'Listen before deciding. Trust grows from steadiness.', Bold: 'Meet uncertainty with a clear direction.', Curious: 'Ask the question others have stopped asking.', Stern: 'Order and duty come before easy approval.', Generous: 'Make protection visible in the lives around you.', Pragmatic: 'Keep a promise that can survive contact with the world.' }[v]}</span><b aria-hidden="true">${answers[q[2]] === v ? '✓' : '→'}</b></button>`).join('')}</div>`;
  if (q[2] === 'appearance' && answers.race === 'Beastfolk')
    content +=
      '<div class="heritage-choices"><h3>Your animal heritage</h3><p>Your own heritage can be chosen. The realm and court still include many species and other races.</p>' +
      [
        'Random',
        'Fox',
        'Wolf',
        'Cat',
        'Owl',
        'Bear',
        'Rabbit',
        'Otter',
        'Lizard',
      ]
        .map(
          (species) =>
            '<button type="button" data-action="heritage" data-id="' +
            species +
            '" aria-pressed="' +
            (answers.species === species) +
            '" class="' +
            (answers.species === species ? 'selected' : '') +
            '">' +
            species +
            '</button>',
        )
        .join('') +
      '</div>';
  return `${header()}<main class="creation manuscript"><div class="creation-art">${landscape('hall', 'A castle and its river town at sunset')}<div class="creation-art-caption"><span class="eyebrow">YOUR REIGN BEGINS</span><h2>Every crown<br>carries a story.</h2><p>The realm is waiting for yours.</p></div></div><div class="creation-copy"><div class="eyebrow">THE FIRST CHAPTER · ${step + 1} / ${questions.length}</div><div class="step-progress" aria-label="Step ${step + 1} of ${questions.length}">${questions.map((_, i) => `<span class="${i <= step ? 'filled' : ''}"></span>`).join('')}</div><h2>${q[0]}</h2><p class="lead">${q[1]}</p>${content}<div class="creation-footer">${step ? btn('← Back', 'back') : '<span>Choose your own ambition.</span>'}${btn(step === questions.length - 1 ? 'Ascend the throne →' : 'Continue →', 'next', 'class="primary"')}</div><p role="status" class="creation-message">${esc(message)}</p></div></main>`;
}
function previousAvailable() {
  try {
    return !!localStorage.getItem('lineage-previous');
  } catch {
    return false;
  }
}
function map() {
  const capital = sites.find((s) => s.id === 'capital');
  const roads = sites
    .filter((s) => s.id !== 'capital')
    .map(
      (s) =>
        `M${capital.x} ${capital.y}Q${(capital.x + s.x) / 2 - 10} ${(capital.y + s.y) / 2 + 12} ${s.x} ${s.y}`,
    )
    .join('');
  const mountains = [
    [48, 57, 30],
    [78, 38, 38],
    [111, 55, 25],
    [133, 69, 20],
  ];
  const trees = [
    [220, 68],
    [237, 58],
    [269, 66],
    [288, 89],
    [220, 93],
    [239, 107],
    [263, 102],
    [280, 118],
    [306, 128],
    [314, 154],
    [327, 174],
    [300, 176],
    [278, 148],
  ];
  return `<svg class="realm-map" viewBox="0 0 390 350" role="group" aria-label="Map of the realm; select a place to read its story"><defs><linearGradient id="terrain" x2=".8" y2="1"><stop stop-color="#50604a"/><stop offset=".5" stop-color="#304b3b"/><stop offset="1" stop-color="#253c31"/></linearGradient><pattern id="map-grain" width="13" height="13" patternUnits="userSpaceOnUse"><path d="M2 4h3M8 10h2" stroke="#b7bc8940" stroke-width=".6"/></pattern><radialGradient id="highland"><stop stop-color="#9b9971" stop-opacity=".5"/><stop offset="1" stop-color="#273d31" stop-opacity="0"/></radialGradient></defs><path class="land" d="M34 153Q29 121 50 89L68 58Q112 28 153 37L207 49Q248 28 288 48L323 83Q350 112 340 153L351 212Q346 240 314 261L282 281Q244 307 204 303L160 287Q112 303 78 284L57 248Q29 217 34 153Z" style="fill:url(#terrain)"/><path d="M34 153Q29 121 50 89L68 58Q112 28 153 37L207 49Q248 28 288 48L323 83Q350 112 340 153L351 212Q346 240 314 261L282 281Q244 307 204 303L160 287Q112 303 78 284L57 248Q29 217 34 153Z" fill="url(#map-grain)"/><ellipse cx="103" cy="77" rx="94" ry="58" fill="url(#highland)"/><g class="map-relief" aria-hidden="true">${mountains.map(([x, y, h]) => `<path d="M${x - 18} ${y + h}l18 -${h} 22 ${h}z" fill="#596450" stroke="#9da184" stroke-width=".7"/><path d="M${x} ${y}l-4 ${h / 2} 8 -3z" fill="#b7bba0" opacity=".6"/>`).join('')}${trees.map(([x, y]) => `<path d="M${x} ${y + 12}v8" stroke="#889079" stroke-width="1"/><path d="M${x - 7} ${y + 13}l7 -16 7 16z" fill="#263e2b" stroke="#738c65" stroke-width=".7"/>`).join('')}</g><path class="river" d="M187 55C158 87 140 105 152 140S207 191 200 225 224 261 215 295"/><path d="M186 56C158 87 140 105 152 140S207 191 200 225 224 261 215 295" fill="none" stroke="#a9c5ba" stroke-width="1" opacity=".5"/><path class="road" d="${roads}"/><g class="map-decoration" aria-hidden="true"><text x="86" y="174" font-size="9" letter-spacing="2">${esc(g.world?.river || 'Alder River').toUpperCase()}</text><path d="M343 303v28M330 316h26M343 303l-4 8h8z"/><text x="343" y="296" text-anchor="middle">N</text></g>${sites.map((site) => `<g class="map-node ${g.selected === site.id ? 'active' : ''}" tabindex="0" role="button" aria-label="Read about ${esc(site.name)}" data-location="${site.id}"><rect x="${site.x - 30}" y="${site.y - 18}" width="60" height="44" fill="transparent"/><circle cx="${site.x}" cy="${site.y}" r="${site.id === 'capital' ? 9 : 4}"/>${site.id === 'capital' ? `<path d="M${site.x - 4} ${site.y + 4}v-7h2v2h4v-2h2v7z" fill="#66542e" aria-hidden="true"/>` : ''}<text x="${site.x}" y="${site.y + 19}" text-anchor="middle">${esc(site.name)}</text></g>`).join('')}</svg>`;
}
function sidebar() {
  const site = sites.find((s) => s.id === g.selected) || sites[0];
  return `<aside class="realm-sidebar"><section class="manuscript map-sheet"><div class="sidebar-heading"><span class="eyebrow">YOUR DOMAIN</span><span class="quiet">${esc(g.title)}</span></div>${map()}<div class="place-intro"><small>${esc(site.kind)}</small><h4>${esc(site.name)}</h4><p>${esc(site.strength)}</p>${btn('Explore this place →', 'site', `data-id="${site.id}" class="text-button"`)}</div><div class="sidebar-section"><span class="eyebrow">AT YOUR SIDE</span><div class="court-strip">${activeCourt(
    g,
  )
    .slice(0, 8)
    .map(
      (c) =>
        `<button data-action="person" data-id="${c.id}" title="${esc(c.name)}, ${esc(c.role)}" aria-label="Profile of ${esc(c.name)}">${portrait(c)}<span>${esc(c.name.split(' ')[0])}</span></button>`,
    )
    .join(
      '',
    )}</div></div><div class="sidebar-section"><span class="eyebrow">THIS SEASON</span>${g.queue.length ? g.queue.map((q) => `<p class="charge"><strong>${esc(projects.find((p) => p.id === q.id)?.name)}</strong><span>${esc(g.court.find((c) => c.id === q.who)?.name)} · entrusted</span></p>`).join('') : '<p class="quiet">Your court awaits instructions.</p>'}${g.missions.map((m) => `<p class="charge"><strong>${esc(g.parties.find((p) => p.id === m.party)?.name)}</strong><span>Expected in ${Math.max(0, m.returns - g.turn)} season(s)</span></p>`).join('')}</div><div class="sidebar-section"><span class="eyebrow">WORD FROM THE VILLAGES</span><p>${resourceStory(g, 'happiness')}.</p>${btn('Read the latest chronicle →', 'chronicle', 'class="text-button"')}</div></section></aside>`;
}
function commissionCards() {
  return `<div class="commission-grid">${projects.map((p, i) => `<button class="commission" data-action="decision" data-type="project" data-id="${p.id}" ${g.event || g.queue.length >= 3 ? 'disabled' : ''}><span class="commission-icon" aria-hidden="true">${['⌁', '♧', '♜', '⚑', '✧', '◈', '⚙', '✎', '⚑'][i] || '❧'}</span><span class="commission-copy"><small>${{ stewardship: 'Works & welfare', martial: 'Duty & defense', diplomacy: 'Neighbors & belonging', intrigue: 'Secrets & justice' }[p.skill]}</small><strong>${esc(p.name)}</strong><span>${esc(p.desc)}</span></span><span class="commission-arrow" aria-hidden="true">→</span></button>`).join('')}</div>`;
}
function council() {
  const speaker = g.event && findPerson(g, g.event.speaker);
  return `<div class="hero">${landscape('hall', 'The castle above a living river town')}<div class="hero-caption"><span class="eyebrow">${seasons[g.season].toUpperCase()} AT ${esc(sites[0].name.toUpperCase())}</span><h2>Petitions & promises.</h2><p>${g.event ? 'The chamberlain has opened the doors. Someone is waiting to be heard.' : 'The realm carries your last decisions into its daily life.'}</p></div></div><div class="council-copy">${g.event ? `<article class="audience-call">${speaker ? portrait(speaker) : '<span class="wax-seal" aria-hidden="true">L</span>'}<div><small>BEFORE THE THRONE</small><h3>${esc(g.event.title)}</h3><p>${speaker ? esc(speaker.name) + ' · ' + esc(speaker.role) : 'The council seeks your judgment.'}</p></div>${btn('Hear the audience →', 'audience', 'class="primary"')}</article>` : `<div class="quiet-council"><h3>The hall is quiet</h3><p>Your instructions are in motion. Close the season when you are ready; people and stories will come to the throne as the realm changes.</p></div>`}<div class="section-title"><div><span class="eyebrow">THE PEOPLE AT YOUR SIDE</span><h2>Your council</h2></div><span class="ink-note">${g.queue.length} / ${commissionCapacity(g)} commissions</span></div><div class="counselor-row">${activeCourt(
    g,
  )
    .slice(0, 3)
    .map(
      (c) =>
        `<button class="counselor" data-action="person" data-id="${c.id}">${portrait(c)}<span><small>${esc(c.role)}</small><strong>${esc(c.name)}</strong><em>${esc(c.disposition || c.traits?.[0] || 'An experienced voice')} · ${esc(raceName(c))}</em></span></button>`,
    )
    .join(
      '',
    )}</div><div class="recent-chapter"><span class="eyebrow">THE LAST WORD IN YOUR CHRONICLE</span><p>${esc(g.log[0])}</p></div><details class="optional-council"><summary>Direct a commission or review edicts</summary><p class="quiet">Your court brings opportunities forward. You may also initiate work when the season leaves room for it.</p>${commissionCards()}<div class="edict-call"><div><h3>The laws you live by</h3><p>${esc(g.policies.tax)} levy · ${esc(g.policies.law)} justice · ${esc(g.policies.rites)} rites</p></div>${btn('Review edicts', 'decision', 'data-type="policy"')}</div></details></div>`;
}
function memberCard(c) {
  const gone = c.status === 'departed' || !c.alive || c.status === 'ruler';
  return `<button class="member-card ${gone ? 'departed' : ''}" data-action="person" data-id="${c.id}" title="${esc(c.story)}"><span class="portrait-frame">${portrait(c)}</span><span class="member-copy"><small>${c.alive ? (c.status === 'departed' ? 'Former retainer' : c.status === 'ruler' ? 'Now sovereign' : c.role) : 'Remembered in service'}</small><strong>${esc(c.name)}</strong><span>${esc(raceName(c))} · ${esc(c.house || 'Independent')}</span><em>${esc((c.traits || []).join(' · '))}</em><span class="quiet">${qualitative(c.loyalty, 'loyalty')} in service · ${qualitative(c.affection, 'affection')} toward you</span><span class="read-profile">Open their story →</span></span></button>`;
}
function court() {
  return `<div class="sheet-heading"><span class="eyebrow">THE PEOPLE BEHIND THE SEAL</span><h2>A court is a gathering of stories</h2><p class="lead">Talent matters. So do the promises they remember, the people they love, and the office you ask them to carry.</p></div><div class="member-grid">${g.court.map(memberCard).join('')}</div><section class="section-inset"><div class="section-title"><div><span class="eyebrow">PETITIONERS FOR SERVICE</span><h2>Who deserves a place?</h2></div><span>${activeCourt(g).length} of ${courtCapacity(g)} seats filled</span></div><div class="candidate-list">${
    g.applicants
      .filter((c) => c.alive && !g.court.some((p) => p.id === c.id))
      .map(
        (c) =>
          `<article class="candidate">${portrait(c)}<div><h3>${esc(c.name)}</h3><p>${esc(raceName(c))} · ${esc(c.origin)}</p><p>${esc(c.desire)}</p>${btn('Hear their petition →', 'candidate', `data-id="${c.id}" class="text-button"`)}</div></article>`,
      )
      .join('') ||
    '<p>Every petitioner has already received an answer. Their biographies remain in your court record.</p>'
  }</div></section><section class="section-inset"><span class="eyebrow">FRIENDSHIPS & FRICTION</span><h2>What the hall whispers</h2>${g.bonds
    .filter(
      (b) =>
        g.court.find((c) => c.id === b.a)?.status === 'serving' &&
        g.court.find((c) => c.id === b.b)?.status === 'serving',
    )
    .map(
      (b) =>
        `<p class="relationship-story"><strong>${esc(g.court.find((c) => c.id === b.a).name)} & ${esc(g.court.find((c) => c.id === b.b).name)}</strong><br>${b.trust > 60 ? 'They seek each other’s counsel.' : b.trust < 30 ? 'Their conversations are careful and brief.' : 'They work together, still weighing each other’s intentions.'} ${b.rivalry > 60 ? 'Ambition has turned their differences into an open rivalry.' : b.rivalry > 35 ? 'A competitive edge follows their exchanges.' : 'Little rivalry troubles their acquaintance.'}</p>`,
    )
    .join('')}</section>`;
}
function realm() {
  return `<div class="sheet-heading"><span class="eyebrow">A REALM BEYOND ITS LEDGERS</span><h2>Hearths, houses & distant banners</h2><p class="lead">Every border encloses a history. Every treaty touches people who remember the last one.</p></div><div class="realm-sections"><h3>The condition of your realm</h3><div class="condition-grid">${['infrastructure', 'trade', 'military', 'health', 'learning', 'ecology', 'justice', 'faith'].map((k) => `<button class="condition-card" data-action="resource" data-id="${k}" title="${esc(resourceStory(g, k))}"><small>${k}</small><span>${resourceStory(g, k)}</span><em>Read the report →</em></button>`).join('')}</div><h3>Prominent families</h3><div class="family-grid">${g.families.map((h) => `<button class="family-card" data-action="family" data-id="${h.id}"><span class="heraldry" aria-hidden="true">${h.crest === 'sun' ? '☼' : h.crest === 'leaf' ? '❧' : '♜'}</span><small>${esc(h.motto)}</small><strong>${esc(h.name)}</strong><span>${esc(h.estate)}</span><em>Enter the family archive →</em></button>`).join('')}</div><h3>Factions & neighboring realms</h3><div class="faction-grid">${g.factions.map((f) => `<button class="faction-card" data-action="faction" data-id="${f.id}" title="${esc(factionLore[f.id].goal)}"><small>${esc(f.kind)}${f.alliance ? ' · Sworn ally' : ''}</small><strong>${esc(f.name)}</strong><span>${qualitative(f.trust)} toward your throne</span><p>${factionLore[f.id].goal}</p><em>Read their history & intentions →</em></button>`).join('')}</div><h3>Places worth knowing</h3><div class="site-grid">${sites.map((s) => `<button class="site-card" data-action="site" data-id="${s.id}">${landscape(s.scene, s.name)}<span><small>${esc(s.kind)}</small><strong>${esc(s.name)}</strong><em>${esc(s.rumor)}</em></span></button>`).join('')}</div></div>`;
}
function adventures() {
  return `<div class="hero">${landscape('ruins', 'An ancient sanctuary above a misty valley')}<div class="hero-caption"><span class="eyebrow">BEYOND THE SAFE ROAD</span><h2>Some doors need a different key</h2></div></div><div class="council-copy"><p class="lead dropcap">Your watch protects the living roads. For buried temples, restless ruins, and dangers without a banner, hire those who know how to return with a story.</p><h3>Companies seeking a patron</h3>${g.parties.map((p) => `<button class="party-card" data-action="party" data-id="${p.id}">${portrait(findPerson(g, p.leaderId) || { name: p.leader, portrait: p.portrait, artset: p.artset })}<span><small>${p.status === 'away' ? 'On an expedition' : p.wounds ? 'Recovering from wounds' : 'Available for a contract'}</small><strong>${esc(p.name)}</strong><span>${esc(p.members)}</span><em>${esc(p.story)}</em></span></button>`).join('')}<h3>Rumors worth following</h3><div class="quest-grid">${expeditions.map((t) => `<article class="quest">${landscape(sites.find((s) => s.id === t.site).scene, sites.find((s) => s.id === t.site).name)}<div><small>${g.completed.includes(t.id) ? (g.expeditionOutcomes[t.id] === 'failure' ? 'An expedition remembered · chapter closed' : 'A discovery remembered · chapter closed') : g.missions.some((m) => m.task === t.id) ? 'A company is seeking an answer' : 'An unresolved rumor'}</small><h3>${t.name}</h3><p>${t.story}</p>${btn('Consider a contract →', 'decision', `data-type="expedition" data-id="${t.id}" class="text-button" ${g.completed.includes(t.id) || g.missions.some((m) => m.task === t.id) ? 'disabled' : ''}`)}</div></article>`).join('')}</div><h3>The realm’s reliquary</h3>${g.treasures.length ? g.treasures.map((t) => `<article class="relic"><span aria-hidden="true">✧</span><div><h4>${relics[t.id].name}</h4><p>${relics[t.id].story}</p><em>${relics[t.id].effect}</em></div></article>`).join('') : '<p class="quiet">No relic yet rests in the hall. What you recover may become a gift, a bargain, or a responsibility.</p>'}</div>`;
}
function lineage() {
  const adults = [
    ...activeCourt(g),
    ...[...g.children, ...(g.kin || [])].filter(
      (c) => c.alive && c.age >= 16 && c.status !== 'ruler',
    ),
  ];
  const spouse = findPerson(g, g.spouse),
    heir = household(g).find((c) => c.id === g.heir);
  return `<div class="sheet-heading"><span class="eyebrow">THE CROWN OUTLIVES ITS WEARER</span><h2>The story that follows yours</h2><p class="lead">Inheritance is a name in a testament, a promise in a family, and a question the realm must answer together.</p></div><div class="household-record">${portrait(g.ruler)}<div><h3>${esc(g.ruler.name)}, ${esc(raceName(g.ruler))}</h3><p>${esc(g.ruler.gender || 'Nonbinary')} · ${esc(g.ruler.disposition || 'Patient')} · In the ${g.ruler.age}th year of life · ${qualitative(g.ruler.health, 'health')} · Reign ${g.dynasty}</p><p>${esc(g.ruler.values)} guides your rule. Your ascension was ${esc(g.ruler.history).toLowerCase()}.</p><p>${spouse ? `Married to ${esc(spouse.name)}${spouse.alive ? '' : ', whose memory remains in the household'}.` : 'No marriage binds your household yet.'}</p><p>${heir ? `${esc(heir.name)} is named to follow you.` : 'The testament names no successor. The court will choose if your reign ends.'}</p></div></div>${familyTreeView(g)}${reignsView(g)}${royalKin()}<section class="section-inset"><h3>The sealed testament</h3><p>Any living adult member of the household may be named. A public declaration earns recognition, but offended families and weak legitimacy can still challenge it.</p><label class="select-label">The person whose name you wish to record<select id="heir-selection"><option value="">Select a successor</option>${adults.map((c) => `<option value="${c.id}" ${g.heir === c.id ? 'selected' : ''}>${esc(c.name)} · age ${c.age}</option>`).join('')}</select></label>${btn('Consider the succession', 'heir', 'class="primary"')}</section><section class="section-inset"><h3>Companionship & courtship</h3><p>Private time can become affection. Affection and trust can become a marriage. A close relationship is needed before a proposal is welcome.</p><div class="suitor-grid">${activeCourt(
    g,
  )
    .filter((c) => c.id !== g.spouse)
    .map(
      (c) =>
        `<article class="suitor">${portrait(c)}<div><h4>${esc(c.name)}</h4><p>${qualitative(c.affection, 'affection')} toward you. ${qualitative(c.trust)} in your confidence.</p>${btn('Spend time together', 'decision', `data-type="cultivate" data-id="${c.id}"`)}${btn('Speak of marriage', 'decision', `data-type="marry" data-id="${c.id}" ${g.spouse ? 'disabled' : ''}`)}</div></article>`,
    )
    .join(
      '',
    )}</div></section><section class="section-inset"><h3>The next generation</h3>${g.children.length ? g.children.map((c) => `<article class="child-record"><label>Name in the household register<input data-child="${c.id}" value="${esc(c.name)}" maxlength="40"></label><p>${c.age ? `Age ${c.age}` : 'An infant'} · ${esc(raceName(c))} · ${qualitative(c.health, 'health')}${c.status === 'ruler' ? ' · Now sovereign' : ''}</p></article>`).join('') : '<p>The cradle is quiet. Children may arrive in a married household while the ruler is within their people’s usual childbearing years.</p>'}</section>`;
}
function royalKin() {
  return `<section class="section-inset"><span class="eyebrow">YOUR ROYAL HOUSEHOLD</span><h3>The family you inherit</h3><p>No parent survives your accession. These relatives have their own histories, convictions, and expectations.</p><div class="kin-grid">${(g.kin || []).map((c) => `<button class="kin-card" data-action="person" data-id="${c.id}">${portrait(c)}<span><small>${esc(c.kinship)}${c.relatedTo && c.relatedTo !== g.ruler.name ? ' of ' + esc(c.relatedTo) : ''}</small><strong>${esc(c.name)}</strong><em>${c.age} years · ${esc(raceName(c))}</em><span>${esc(c.desire)}</span></span></button>`).join('') || '<p class="quiet">This earlier chronicle did not record living collateral relatives.</p>'}</div></section>`;
}
function dashboard() {
  return `${header()}<div class="realm-heading"><div class="reign-title"><button class="ruler-portrait" data-action="person" data-id="${g.ruler.id}" aria-label="Read your ruler’s profile">${portrait(g.ruler)}</button><div><span class="eyebrow">${esc(g.title.toUpperCase())} OF ${esc(g.name).toUpperCase()}</span><h2>${esc(g.name)}</h2><p>The reign of ${esc(g.ruler.name)}</p></div></div><div class="season"><span><small>${seasons[g.season]}</small><strong>Year ${g.year}</strong></span>${btn('Let the season turn →', 'advance', `class="primary" ${g.event ? 'disabled' : ''}`)}</div></div><div class="resource-ribbon">${['gold', 'food', 'population'].map((k) => `<button data-action="resource" data-id="${k}" title="${esc(resourceStory(g, k))}"><span class="resource-symbol" aria-hidden="true">${{ gold: '◈', food: '♧', population: '♙' }[k]}</span><span><small>${{ gold: 'Treasury', food: 'Stores', population: 'People' }[k]}</small><strong>${k === 'gold' ? g.resources.gold.toLocaleString() + ' gold' : k === 'population' ? g.resources.population.toLocaleString() + ' souls' : g.resources.food < 20 ? 'Running thin' : g.resources.food < 60 ? 'Carefully kept' : 'Well provisioned'}</strong></span></button>`).join('')}<button class="realm-mood" data-action="resource" data-id="happiness"><span><small>The common mood</small><strong>${qualitative(g.resources.happiness, 'happiness')}</strong></span><span aria-hidden="true">→</span></button></div>${message ? `<div class="notice" role="status">${esc(message)}</div>` : ''}<main class="dashboard"><section class="manuscript main-sheet"><nav aria-label="Chapters of your reign">${[
    ['council', 'Council'],
    ['court', 'Court'],
    ['realm', 'Realm'],
    ['adventures', 'Adventures'],
    ['lineage', 'Lineage'],
  ]
    .map(
      ([id, label]) =>
        `<button data-tab="${id}" class="${tab === id ? 'active' : ''}" aria-current="${tab === id ? 'page' : 'false'}">${label}</button>`,
    )
    .join(
      '',
    )}</nav>${{ council, court, realm, adventures, lineage }[tab]()}</section>${sidebar()}</main><footer>LINEAGE <span>·</span> THE CROWN PASSES. THE STORY REMAINS.</footer>`;
}
const modalActions = (c) =>
  c.alive && c.status === 'serving'
    ? `<div class="profile-actions">${btn('Personal audience', 'decision', `data-type="cultivate" data-id="${c.id}"`)}${btn('Change their office', 'decision', `data-type="transfer" data-id="${c.id}"`)}${btn('End their service', 'decision', `data-type="dismiss" data-id="${c.id}" class="danger"`)}</div>`
    : c.status === 'household' && c.alive
      ? `<div class="profile-actions">${btn('Spend time together', 'decision', `data-type="cultivate" data-id="${c.id}"`)}</div>`
      : '';
function personProfile(c, isCandidate = false) {
  if (!c)
    return '<h2 id="dialog-title">This person is no longer in the archive</h2>';
  const isRuler = c.id === g.ruler.id;
  const actions = isCandidate
    ? `<div class="profile-actions">${btn('Consider their appointment →', 'decision', `data-type="hire" data-id="${c.id}" class="primary"`)}</div>`
    : modalActions(c);
  const bonds = Object.values(g.relationships).filter(
    (b) => b.a === c.id || b.b === c.id,
  );
  return `<div class="profile-head">${portrait(c, 'large')}<div><span class="eyebrow">${isCandidate ? 'A PETITIONER FOR SERVICE' : c.status === 'departed' ? 'A FORMER MEMBER OF YOUR COURT' : 'THE COURT ARCHIVE'}</span><h2 id="dialog-title">${esc(c.name)}</h2><p>${esc(raceName(c))} · ${esc(c.gender || 'Nonbinary')} · ${c.age} years · ${esc(c.house || 'Independent')}${c.role ? ' · ' + esc(c.role) : ''}</p><p class="traits">${(c.traits || []).map((t) => `<span>${esc(t)}</span>`).join('')}</p><blockquote>${esc(c.voice || '“A life in service is still a life of one’s own.”')}</blockquote></div></div>${actions}<p class="lead dropcap">${esc(c.story)}</p><div class="profile-columns"><section><h3>The person beneath the office</h3><dl><dt>Disposition & appearance</dt><dd>${esc(c.disposition || c.traits?.[0] || 'Reserved')}. ${esc(c.appearance || 'A familiar presence at court.')}</dd><dt>Origins</dt><dd>${esc(c.origin || 'The settlements of your realm')}</dd><dt>What they hope for</dt><dd>${esc(c.desire)}</dd><dt>What they fear</dt><dd>${esc(c.fear || 'That their voice will go unheard.')}</dd><dt>Family & hearth</dt><dd>${esc(c.family || 'Their kin at home follow their fortunes with interest.')}</dd><dt>Faith & custom</dt><dd>${esc(c.faith || 'They keep the customs of their home hearth.')}</dd>${!isCandidate ? `<dt>In confidence</dt><dd>${c.trust >= 70 ? esc(c.secret || 'They have entrusted no further private matters to the record.') : 'There are parts of their story they do not yet trust you to hear.'}</dd>` : ''}</dl></section><section><h3>Their craft & convictions</h3>${Object.entries(
    c.skills || {},
  )
    .map(([k, n]) => narrate(k, n, 'skill'))
    .join(
      '',
    )}${!isCandidate && !isRuler ? `<h4>How they stand with you</h4>${narrate('Trust', c.trust)}${narrate('Affection', c.affection, 'affection')}${narrate('Loyalty', c.loyalty, 'loyalty')}${narrate('Ambition', c.ambition, 'ambition')}${narrate('Unspoken grievances', c.grievance, 'grievance')}${narrate('Health', c.health, 'health')}<p>${c.status === 'serving' ? esc(roles[c.role]?.purpose || 'An available voice at your council.') : c.status === 'departed' ? 'They have left your household. Their allegiances and memories remain in the archive.' : c.status === 'ruler' ? 'They now bear the crown.' : 'Their service is preserved in the court archive.'}</p>` : ''}</section></div>${characterDevelopmentView(g, c)}${familyTreeView(g, c.id)}${claimView(g, c)}${
    bonds.length
      ? `<h3>People in their life</h3>${bonds
          .map((b) => {
            const other = findPerson(g, b.a === c.id ? b.b : b.a);
            return `<p class="relationship-story"><strong>${esc(other?.name)}</strong> — ${qualitative(b.trust).toLowerCase()} in confidence, ${qualitative(b.affection, 'affection').toLowerCase()} in affection. ${qualitative(b.rivalry, 'rivalry')}.</p>`;
          })
          .join('')}`
      : ''
  }${!isCandidate ? `<h3>What they remember of your reign</h3>${c.memories?.length ? c.memories.map((s) => `<p class="memory">${esc(s)}</p>`).join('') : `<p class="memory">${esc(c.memory || 'Their service is still a fresh page in this chronicle.')}</p>`}` : ''}`;
}
function factionProfile(f) {
  const lore = factionLore[f.id];
  return `<span class="eyebrow">${esc(f.kind.toUpperCase())}${f.alliance ? ' · A SWORN ALLY' : ''}</span><h2 id="dialog-title">${esc(f.name)}</h2><p class="lead dropcap">${esc(lore.story)}</p><blockquote>“${esc(lore.custom)}”</blockquote><div class="profile-columns"><section><h3>Their place in the world</h3><dl><dt>Who speaks for them</dt><dd>${lore.leaderId ? btn(esc(lore.leader), 'person', `data-id="${lore.leaderId}" class="text-button"`) : esc(lore.leader)}</dd><dt>What they want</dt><dd>${esc(lore.goal)}</dd><dt>Their strength</dt><dd>${esc(lore.strength)}</dd><dt>Their vulnerability</dt><dd>${esc(lore.weakness)}</dd><dt>Ties that matter</dt><dd>${esc(lore.ties)}</dd></dl></section><section><h3>How they see your throne</h3>${['trust', 'respect', 'affection', 'fear', 'trade', 'grievance'].map((k) => narrate(k, f[k], k)).join('')}<p>${f.grievance > 60 ? 'Their patience is thinning. Another slight could turn discontent into open opposition.' : f.trust > 65 ? 'They increasingly speak of the throne as a partner rather than a power to endure.' : 'Their support is conditional, shaped by promises kept and promises postponed.'}</p></section></div><h3>Relations beyond your throne</h3>${
    g.diplomaticBonds
      .filter((b) => b.a === f.id || b.b === f.id)
      .map(
        (b) =>
          `<p>${g.factions.find((p) => p.id === (b.a === f.id ? b.b : b.a)).name}: ${qualitative(b.trust).toLowerCase()} in their dealings. ${b.tension > 50 ? 'A lingering dispute clouds negotiations.' : 'Their differences remain manageable.'}</p>`,
      )
      .join('') ||
    '<p>Local ties and trading acquaintances matter more than a formal foreign pact.</p>'
  }<div class="profile-actions">${btn('Consider your response →', 'decision', `data-type="diplomacy" data-id="${f.id}" class="primary"`)}</div>`;
}
function familyProfile(h) {
  return `<span class="eyebrow">THE FAMILY ARCHIVE</span><div class="family-title"><span class="heraldry" aria-hidden="true">${h.crest === 'sun' ? '☼' : h.crest === 'leaf' ? '❧' : '♜'}</span><div><h2 id="dialog-title">${esc(h.name)}</h2><em>${esc(h.motto)}</em></div></div><p class="lead dropcap">${esc(h.story)}</p><div class="profile-columns"><section><h3>A name with many lives</h3><dl><dt>Head of the family</dt><dd>${esc(h.head)}</dd><dt>Notable kin</dt><dd>${h.memberIds ? h.memberIds.map((id) => btn(esc(findPerson(g, id)?.name), 'person', `data-id="${id}" class="text-button"`)).join(' · ') : esc(h.members)}</dd><dt>Estates & obligations</dt><dd>${esc(h.estate)}</dd><dt>Their present ambition</dt><dd>${esc(h.desire)}</dd><dt>Behind the heraldry</dt><dd>${g.resources.learning >= 60 || activeCourt(g).some((c) => c.role === 'Spymaster' && c.skills.intrigue >= 65) ? esc(h.secret) : 'Their private affairs remain outside the court’s knowledge. Scholarship or a capable spymaster may uncover more.'}</dd></dl></section><section><h3>Fortunes that change</h3>${narrate('Influence', h.power, 'power')}${narrate('Family cohesion', h.cohesion, 'cohesion')}${narrate('Fortune', h.fortune, 'fortune')}${narrate('Standing with the crown', h.standing)}<p>${h.cohesion < 35 ? 'Disagreements within the family now spill into public life.' : 'For now, the family presents a united name to the world.'}</p></section></div><div class="profile-actions">${btn('Answer their ambitions →', 'decision', `data-type="family" data-id="${h.id}" class="primary"`)}</div>`;
}
const resourceLore = {
  gold: 'Coin buys time, tools, and the chance to keep a promise. Court wages, edicts, and commissions draw from it; trade and productive settlements replenish it.',
  food: 'Stores must last until the autumn harvest. A healthy landscape improves that harvest. Empty granaries wound public health, loyalty, and the ruler’s own strength.',
  population:
    'Population grows when households are hopeful and healthy. A growing town can become a city; a thriving province can win recognition as a kingdom.',
  happiness:
    'Public feeling carries the memory of taxes, hunger, hospitality, and visible work. It affects loyalty, population growth, and acceptance of your right to rule.',
  legitimacy:
    'Authority rests on inheritance, recognition, and the example of your rule. Weak legitimacy gives old houses an opening to challenge the heir.',
  security:
    'The watch, inquiry, and road patrols make travel and the throne safer. Dangerously weak security can expose the ruler to assassination.',
  infrastructure:
    'Bridges, mills, and roads hold scattered settlements together. They sustain income and help the realm earn a greater place in the world.',
  trade:
    'Commerce brings revenue and connections. A compact can build prosperity; an exploitative one leaves grievances behind its profits.',
  military:
    'Training and equipment let the watch carry difficult duties. A violent succession can drain that strength in a single bitter season.',
  health:
    'Clean water, food, medicine, and relief keep families well. Neglect slows population growth and, in severe conditions, endangers ruler and councillors.',
  learning:
    'Schools, skilled mentorship, and recovered lore broaden the realm’s knowledge. Scholarship can reveal private histories concealed behind noble heraldry.',
  ecology:
    'Woodland and water are resources with memories. Preserving them sustains the autumn harvest; profitable shortcuts may wound them for years.',
  justice:
    'How the realm hears an accusation matters as much as its verdict. Edicts, open hearings, and meaningful restitution shape who feels protected by the law.',
  faith:
    'Sacred customs can offer common shelter or become boundaries between neighbors. Your policy on rites changes relations every season.',
};
function resourceProfile(key) {
  const positive = [
    'health',
    'ecology',
    'trade',
    'infrastructure',
    'learning',
  ].sort((a, b) => g.resources[b] - g.resources[a])[0];
  const weak = ['health', 'ecology', 'security', 'justice', 'happiness'].sort(
    (a, b) => g.resources[a] - g.resources[b],
  )[0];
  return `<span class="eyebrow">A REPORT FROM THE REALM</span><h2 id="dialog-title">${{ gold: 'The treasury', food: 'The winter stores', population: 'The people of your realm' }[key] || key[0].toUpperCase() + key.slice(1)}</h2><p class="lead dropcap">${resourceStory(g, key)}.</p><p>${resourceLore[key]}</p><div class="report-note"><h3>What supports us</h3><p>${resourceStory(g, positive)}.</p><h3>Where care is needed</h3><p>${resourceStory(g, weak)}.</p></div><h3>What the next season brings</h3><p>The household draws ${activeCourt(g).length * 2} gold in wages. ${g.policies.tax === 'heavy' ? 'The crown’s heavy levy adds revenue and repeated resentment.' : g.policies.tax === 'gentle' ? 'A gentler levy leaves more in humble hands and less in the treasury.' : 'A measured levy keeps the balance familiar.'} ${g.season === 1 ? 'The autumn harvest is next.' : g.season === 2 ? 'The harvest is in; reserves must carry the colder seasons.' : 'The next harvest remains ahead.'}</p><details class="ledger"><summary>Open the clerk’s exact ledger</summary><p>${key}: ${Math.round(g.resources[key]).toLocaleString()}${['gold', 'food', 'population'].includes(key) ? '' : ' / 100'}</p><p>Recognition as a ${g.scale === 'town' ? 'city' : 'kingdom'} requires infrastructure 75, trade 65, legitimacy 65, and ${g.scale === 'town' ? '1,000' : '14,000'} people.</p></details>${['gold', 'food', 'population'].includes(key) ? '' : btn('Consider a realm edict →', 'decision', 'data-type="policy" class="primary"')}`;
}
function siteProfile(s) {
  const task = expeditions.find((t) => t.site === s.id);
  return `${landscape(s.scene, s.name, 'dialog-landscape')}<span class="eyebrow">${esc(s.kind.toUpperCase())}</span><h2 id="dialog-title">${esc(s.name)}</h2><p class="lead dropcap">${esc(s.story)}</p><div class="profile-columns"><section><h3>Gifts & vulnerabilities</h3><p>${esc(s.strength)}</p><p>${esc(s.risk)}</p></section><section><h3>A story told at the hearth</h3><blockquote>${esc(s.rumor)}</blockquote></section></div>${localDevelopmentView(g, s.id)}${s.id !== 'capital' ? btn('Consider district administration', 'decision', `data-type="governor" data-id="${s.id}"`) : ''}${task ? `<div class="profile-actions">${btn('Consider an expedition →', 'decision', `data-type="expedition" data-id="${task.id}" class="primary"`)}</div>` : ''}`;
}
function partyProfile(p) {
  const mission = g.missions.find((m) => m.party === p.id);
  return `<div class="profile-head">${portrait(findPerson(g, p.leaderId) || { name: p.leader, portrait: p.portrait, artset: p.artset }, 'large')}<div><span class="eyebrow">A COMPANY OF ADVENTURERS</span><h2 id="dialog-title">${esc(p.name)}</h2><p>Led by ${esc(p.leader)}</p><p>${p.status === 'away' ? 'Beyond the safe roads' : p.wounds ? 'Tending their wounded' : 'Ready to hear a contract'}</p></div></div><p class="lead dropcap">${esc(p.story)}</p><h3>The companions</h3><p>${esc(p.members)}</p><div class="profile-columns"><section><h3>Reputation & readiness</h3>${narrate('Capability', p.skill, 'skill')}${narrate('Trust in your patronage', p.loyalty)}${narrate('Reputation', p.reputation)}${narrate('Care in preparation', p.caution, 'skill')}</section><section><h3>The terms of their work</h3><p>The company asks a base fee of ${p.fee} gold. A careful or respectful journey needs additional supplies and two seasons. A daring contract returns sooner, with greater risk.</p><p>${p.wounds ? `They need ${p.wounds} more season${p.wounds === 1 ? '' : 's'} to recover before taking another contract.` : mission ? `${expeditions.find((t) => t.id === mission.task).name} will test their resolve. They are expected in ${mission.returns - g.turn} season(s).` : 'They are rested and ready. Choose a task from the rumors in the Adventures chapter.'}</p></section></div>`;
}
function decisionContent() {
  const d = getDecision(g, modal.type, modal.id, modal.agent);
  if (!d) return '<h2 id="dialog-title">The matter has already passed</h2>';
  const agents = d.requiresMentor
    ? availableMentors(g, modal.id)
    : d.requiresAgent
      ? activeCourt(g).filter(
          (c) =>
            !g.queue.some((q) => q.who === c.id) &&
            !g.trainingJobs.some(
              (j) =>
                j.status === 'active' &&
                (j.student === c.id || j.mentor === c.id),
            ),
        )
      : d.requiresParty
        ? g.parties.filter((p) => p.status === 'available' && !p.wounds)
        : null;
  const selected = agents?.find((c) => c.id === modal.agent) || agents?.[0];
  if (selected && !modal.agent) {
    modal.agent = selected.id;
    return decisionContent();
  }
  let advice = '';
  if (d.requiresAgent && selected) {
    const n = selected.skills[d.skill],
      fit = roles[selected.role]?.skill === d.skill;
    advice = `${selected.name} is ${qualitative(n, 'skill').toLowerCase()} in this work. ${fit ? 'Their present office gives them authority to carry it out.' : 'This commission falls outside their primary office.'} ${selected.loyalty < 40 ? 'Their loyalty is uncertain; the promise may be harder to keep.' : ''}`;
  }
  if (d.requiresParty && selected) {
    advice = `${selected.name} are ${qualitative(selected.skill, 'skill').toLowerCase()} and ${selected.caution > 65 ? 'careful in their preparations' : 'willing to take difficult risks'}. Local trust can secure guides; haste makes success less certain.`;
  }
  return `<span class="eyebrow">YOUR WORD BECOMES THEIR WORLD</span><h2 id="dialog-title">${esc(d.title)}</h2><p class="lead">${esc(d.text)}</p>${agents ? `<label class="select-label">${d.requiresAgent ? 'Whose hands will carry your decision?' : 'Which company will carry your contract?'}<select id="decision-agent">${agents.length ? agents.map((c) => `<option value="${c.id}" ${modal.agent === c.id ? 'selected' : ''}>${esc(c.name)}${c.role ? ' · ' + esc(c.role) : ''}</option>`).join('') : '<option value="">No one is available</option>'}</select></label><p class="counsel-note">${esc(advice || 'Wait for a commission to end, or invite another qualified person to serve.')}</p>` : ''}${d.type === 'project' && selected ? forecastView(g, selected, d.target) : ''}${d.blocked ? `<p class="blocked" role="status">${esc(d.blocked)}</p>` : ''}<div class="decision-options">${d.options.map((o) => choiceCard(o, 'enact', !!d.blocked || (agents && !agents.length))).join('')}</div><p class="ink-note">${d.requiresAgent ? 'The listed direction is a promise, not a guarantee. Capability, office, loyalty, and resistance affect the outcome.' : 'The court will remember the course you choose.'}</p>`;
}
function choiceCard(o, action, blocked = false) {
  const disabled = blocked || o.disabled || g.resources.gold < o.cost;
  return `<button class="decision-option" data-action="${action}" data-choice="${o.id}" ${disabled ? 'disabled' : ''} title="${esc(o.reason || '')}"><span class="option-ornament" aria-hidden="true">❧</span><span><strong>${esc(o.label)}</strong><span>${esc(o.note)}</span><small>${o.cost ? o.cost + ' gold from the treasury' : 'No treasury expense'}${g.resources.gold < o.cost ? ' · Not enough coin' : ''}${o.disabled ? ' · ' + esc(o.reason) : ''}</small></span><b aria-hidden="true">→</b></button>`;
}
function audienceContent() {
  const e = g.event;
  if (!e) return '<h2 id="dialog-title">The hall is quiet</h2>';
  prepareAudience(g);
  const c = findPerson(g, e.speaker),
    party = g.parties.find((p) => p.id === e.party);
  const d = e.action
    ? getDecision(g, e.action.type, e.action.target, e.agent)
    : null;
  const agents = d?.requiresMentor
    ? availableMentors(g, e.action.target)
    : d?.requiresAgent
      ? activeCourt(g).filter(
          (c) =>
            !g.queue.some((q) => q.who === c.id) &&
            !g.trainingJobs.some(
              (j) =>
                j.status === 'active' &&
                (j.student === c.id || j.mentor === c.id),
            ),
        )
      : d?.requiresParty
        ? g.parties.filter((p) => p.status === 'available' && !p.wounds)
        : null;
  const chosen = agents?.find((c) => c.id === e.agent);
  const advice =
    chosen && d?.requiresAgent
      ? `${chosen.name} is ${qualitative(chosen.skills[d.skill], 'skill').toLowerCase()} in this work. ${roles[chosen.role]?.skill === d.skill ? 'Their office gives them authority to carry it out.' : 'This task falls outside their primary office.'}`
      : chosen && d?.requiresParty
        ? `${chosen.name} are ${qualitative(chosen.skill, 'skill').toLowerCase()}. Preparation and local trust improve their chance of returning safely.`
        : '';
  return `${e.backdrop ? contextArt(e.backdrop, 'The setting of this audience') : landscape(e.scene || 'hall', 'The place this story concerns', 'dialog-landscape')}<div class="audience-head">${c ? portrait(c) : party ? portrait(findPerson(g, party.leaderId) || { name: party.leader, portrait: party.portrait, artset: party.artset }) : '<span class="wax-seal" aria-hidden="true">L</span>'}<div><span class="eyebrow">${e.type === 'followup' ? 'THE AFTERMATH OF YOUR WORD' : e.type === 'expedition' ? 'A COMPANY RETURNS' : 'BEFORE THE THRONE'}</span><h2 id="dialog-title">${esc(e.title)}</h2>${c ? btn(esc(c.name) + ' · ' + esc(c.role), 'person', `data-id="${c.id}" class="text-button"`) : party ? `<p>${esc(party.leader)}, ${esc(party.name)}</p>` : ''}</div></div><div class="audience-narrative">${e.text
    .split('\n\n')
    .map((p) => `<p>${esc(p)}</p>`)
    .join(
      '',
    )}</div>${agents ? `<label class="select-label">${d.requiresAgent ? 'Whose judgment will carry your seal?' : 'Which company will carry your contract?'}<select id="audience-agent">${agents.length ? agents.map((c) => `<option value="${c.id}" ${c.id === e.agent ? 'selected' : ''}>${esc(c.name)}${c.role ? ' · ' + esc(c.role) : ''}</option>`).join('') : '<option value="">No one is available</option>'}</select></label><p class="counsel-note">${esc(advice || 'No rested company or available courtier can take this charge now. You can decline without expense.')}</p>` : ''}${d?.type === 'project' && chosen ? forecastView(g, chosen, d.target) : ''}${d?.blocked ? `<p class="blocked">${esc(d.blocked)}</p>` : ''}<div class="decision-options">${eventOptions(
    g,
  )
    .map((o) => choiceCard(o, 'event'))
    .join(
      '',
    )}</div><p class="ink-note">Your answer closes this unique chapter. People will carry its consequences forward.</p>`;
}
function tutorialContent() {
  const t = g.tutorial.step,
    steward = activeCourt(g)[0];
  const pages = [
    [
      'Welcome to your reign',
      `${g.ruler.name}, your crown has passed into a living realm. ${g.world?.predominantRace || g.ruler.race} communities form its largest population. The people, places, and petitions of this campaign have their own histories. Your goal is the legacy you choose.`,
      'Meet your council →',
    ],
    [
      'Trusted hands, different gifts',
      `Your court brings issues directly to you. ${steward?.name || 'Your advisers'} can carry commissions in your name. Read the choices, choose a capable delegate, and weigh who gains protection and who may resent it. Click any portrait or speaker’s name for their full profile.`,
      'Hear the first petition →',
    ],
    [
      'Listen, then rule',
      'Every audience offers several courses and an answer you can afford. The season waits while a petition needs a ruling. Commissions depend on the delegate’s skill, office, loyalty, and rivalries.',
      'Return to the audience →',
    ],
    [
      'The realm remembers',
      'Your first ruling has been recorded. Treasury and stores keep the household going; click them for a narrated report and an exact ledger. Closing a season tests commissions, pays wages, ages people, and brings the next visitors. Aftermath letters can show how earlier promises changed daily life.',
      g.event ? 'Return to your court →' : 'Let the first season turn →',
    ],
    [
      'A legacy beyond one life',
      'Your royal household includes surviving relatives, but no parents. Cultivate relationships, court a partner, and name any eligible adult heir in Lineage. The Chronicle menu saves, loads, exports backups, and reopens this guide. Decisions save automatically in this browser. The crown can pass; your campaign’s history remains.',
      'Begin your reign →',
    ],
  ];
  const page = pages[Math.min(t, 4)];
  return `${contextArt(t === 4 ? 'archive' : 'hall', 'A guide to ruling your fantasy realm')}<span class="eyebrow">THE RULER’S GUIDE · ${Math.min(t + 1, 5)} / 5</span><h2 id="dialog-title">${page[0]}</h2><p class="lead tutorial-copy">${esc(page[1])}</p>${
    t === 1
      ? `<div class="tutorial-court">${activeCourt(g)
          .map(
            (c) =>
              `<article>${portrait(c)}<strong>${esc(c.name)}</strong><small>${esc(c.role)}</small></article>`,
          )
          .join('')}</div>`
      : ''
  }<div class="tutorial-actions">${btn(page[2], 'tutorial-next', 'class="primary"')}${btn('Skip the guide', 'tutorial-skip', 'class="text-button"')}</div>`;
}
function continuingModal() {
  return !g.tutorial?.complete && [0, 1, 3, 4].includes(g.tutorial.step)
    ? { kind: 'tutorial' }
    : g.event
      ? { kind: 'audience' }
      : null;
}
function modalContent() {
  if (modal.kind === 'season')
    return projectionView(g, getDecision(g, 'season').options);
  if (modal.kind === 'outcome') return outcomeView(g);
  if (modal.kind === 'season-report') return seasonReportView(g);
  if (modal.kind === 'entry') return entryView(g, modal.id);
  if (modal.kind === 'chronicle') return archiveView(g, modal.filters || {});
  if (modal.kind === 'person') return personProfile(findPerson(g, modal.id));
  if (modal.kind === 'candidate')
    return personProfile(
      g.applicants.find((c) => c.id === modal.id),
      true,
    );
  if (modal.kind === 'faction')
    return factionProfile(g.factions.find((f) => f.id === modal.id));
  if (modal.kind === 'family')
    return familyProfile(g.families.find((h) => h.id === modal.id));
  if (modal.kind === 'site')
    return siteProfile(sites.find((s) => s.id === modal.id));
  if (modal.kind === 'resource') return resourceProfile(modal.id);
  if (modal.kind === 'party')
    return partyProfile(g.parties.find((p) => p.id === modal.id));
  if (modal.kind === 'tutorial') return tutorialContent();
  if (modal.kind === 'audience') return audienceContent();
  if (modal.kind === 'decision') return decisionContent();
  return `<span class="eyebrow">EVERY WORD A TRACE</span><h2 id="dialog-title">The chronicle of ${esc(g.name)}</h2>${g.log.map((s) => `<p class="memory">${esc(s)}</p>`).join('')}`;
}
function render() {
  if (g) {
    sites = realmSites(g);
    factionLore = realmFactions(g);
    expeditions = realmExpeditions(g);
    relics = realmRelics(g);
    projects = realmProjects(g);
  }
  app.innerHTML = g ? dashboard() : creation();
  if (modal && g) {
    const dialog = document.createElement('dialog');
    dialog.className = 'manuscript dossier';
    dialog.setAttribute('aria-labelledby', 'dialog-title');
    dialog.innerHTML = `<div class="dialog-toolbar"><span class="eyebrow">THE ROYAL ARCHIVE</span>${btn(returnModal || modalStack.length ? 'Back to previous document ×' : modal.kind === 'audience' ? 'Hear later ×' : 'Close ×', 'close', 'class="close-button" aria-label="Close this document"')}</div><div class="dialog-body">${modalContent()}</div>`;
    app.append(dialog);
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeModal();
    });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          closeModal();
      }
    });
    dialog.showModal();
  }
}
function closeModal() {
  if (modalStack.length) {
    modal = modalStack.pop();
    render();
    return;
  }
  if (returnModal) {
    modal = returnModal;
    returnModal = null;
    modalStack = [];
    render();
    return;
  }
  modal = null;
  modalStack = [];
  const d = app.querySelector('dialog');
  d?.close();
  d?.remove();
  if (lastFocus?.isConnected) lastFocus.focus();
  else app.querySelector('nav button.active')?.focus();
}
function open(kind, id, type, agent) {
  lastFocus = document.activeElement;
  if (
    modal &&
    [
      'person',
      'candidate',
      'family',
      'faction',
      'site',
      'entry',
      'decision',
    ].includes(kind)
  )
    modalStack.push({ ...modal });
  modal = { kind, id, type, agent };
  render();
}
function save(quiet = false) {
  try {
    localStorage.setItem('lineage-save', serializeGame(g));
    if (!quiet)
      message =
        'The chronicle is saved in this browser. Export a copy to keep it elsewhere.';
  } catch {
    message =
      'This browser cannot keep the chronicle. Export a copy before leaving.';
  }
}
function exportGame() {
  const url = URL.createObjectURL(
    new Blob([serializeGame(g, true)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'lineage-chronicle.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
app.addEventListener('click', (e) => {
  const t = e.target.closest('button,[data-location]');
  if (!t) return;
  if (t.dataset.creation) {
    collectCreation();
    answers[questions[step][2]] = t.dataset.creation;
    render();
    return;
  }
  if (t.dataset.location && g) {
    g.selected = t.dataset.location;
    open('site', t.dataset.location);
    return;
  }
  if (t.dataset.tab && g) {
    tab = t.dataset.tab;
    modal = null;
    render();
    return;
  }
  const a = t.dataset.action,
    id = t.dataset.id;
  if (a === 'close') {
    closeModal();
    return;
  }
  if (a === 'heritage') {
    collectCreation();
    answers.species = id;
    render();
    return;
  }
  if (a === 'next') {
    collectCreation();
    if (
      questions[step][2] === 'age' &&
      (!Number.isInteger(Number(answers.age)) ||
        Number(answers.age) < 18 ||
        Number(answers.age) > 90)
    ) {
      message = 'Choose an age between eighteen and ninety.';
      render();
      return;
    }
    message = '';
    if (step < questions.length - 1) step++;
    else {
      g = createGame(answers);
      tab = 'council';
      message = `Your first spring begins at ${realmSites(g)[0].name}. The chamberlain welcomes your court.`;
      modal = { kind: 'tutorial' };
      save(true);
    }
    render();
    return;
  }
  if (a === 'back') {
    collectCreation();
    step--;
    message = '';
    render();
    return;
  }
  if (a === 'load' || a === 'previous') {
    try {
      const s = localStorage.getItem(
        a === 'previous' ? 'lineage-previous' : 'lineage-save',
      );
      if (!s) throw Error('No chronicle has been saved in this browser yet.');
      g = parseSave(s);
      message =
        'The chronicle is restored. Your court remembers where you left it.';
      returnModal = null;
      modalStack = [];
      modal = continuingModal();
      save(true);
    } catch (err) {
      message = err.message;
    }
    render();
    return;
  }
  if (!g) return;
  if (
    [
      'person',
      'candidate',
      'faction',
      'family',
      'site',
      'resource',
      'party',
      'chronicle',
      'audience',
    ].includes(a)
  ) {
    open(a, id);
    return;
  }
  if (a === 'new') {
    save(true);
    try {
      localStorage.setItem('lineage-previous', serializeGame(g));
    } catch {}
    g = null;
    modal = null;
    returnModal = null;
    modalStack = [];
    step = 0;
    tab = 'council';
    message = 'Your previous campaign remains available from Chronicle.';
    Object.assign(answers, {
      name: '',
      realm: '',
      age: '28',
      race: 'Human',
      species: 'Random',
      gender: 'Nonbinary',
      disposition: 'Patient',
      presentation: presentations[0],
      appearance: '',
      scale: 'town',
      values: 'Compassion',
      history: 'Inherited',
    });
    render();
    return;
  }
  if (a === 'guide') {
    g.tutorial = { step: 0, complete: false };
    modal = { kind: 'tutorial' };
    save(true);
    render();
    return;
  }
  if (a === 'tutorial-skip') {
    g.tutorial.complete = true;
    modal = g.event ? { kind: 'audience' } : null;
    save(true);
    render();
    return;
  }
  if (a === 'tutorial-next') {
    const t = g.tutorial.step;
    if (t === 1 || t === 2) {
      g.tutorial.step = 2;
      modal = g.event ? { kind: 'audience' } : { kind: 'tutorial' };
      if (!g.event) g.tutorial.step = 3;
    } else if (t === 3) {
      if (!g.event) advance(g);
      g.tutorial.step = 4;
      modal = { kind: 'tutorial' };
    } else if (t >= 4) {
      g.tutorial.complete = true;
      modal = g.event ? { kind: 'audience' } : null;
    } else {
      g.tutorial.step++;
      modal = { kind: 'tutorial' };
    }
    save(true);
    render();
    return;
  }
  if (a === 'decision') {
    open('decision', id, t.dataset.type);
    return;
  }
  if (a === 'entry') {
    open('entry', id);
    return;
  }
  if (a === 'continue-court') {
    returnModal = null;
    modalStack = [];
    modal = continuingModal();
    render();
    return;
  }
  if (a === 'advance') {
    open('season');
    return;
  }
  if (a === 'season-counsel') {
    const r = enact(g, 'season', null, t.dataset.choice);
    message = r.text;
    if (r.ok) {
      save(true);
      modal = { kind: 'season-report' };
      returnModal = null;
      modalStack = [];
      render();
    }
    return;
  }
  if (a === 'heir') {
    open('decision', document.querySelector('#heir-selection').value, 'heir');
    return;
  }
  if (a === 'enact') {
    const r = enact(g, modal.type, modal.id, t.dataset.choice, modal.agent);
    message = r.text;
    if (r.ok) {
      save(true);
      returnModal = null;
      modalStack = [];
      modal = { kind: 'outcome' };
      render();
    } else {
      const node = document.createElement('p');
      node.className = 'blocked';
      node.setAttribute('role', 'alert');
      node.textContent = r.text;
      app.querySelector('.dialog-body').prepend(node);
    }
    return;
  }
  if (a === 'event') {
    const r = resolveEvent(g, t.dataset.choice, g.event?.agent);
    message = r.text;
    if (r.ok) {
      if (!g.tutorial?.complete && g.tutorial.step === 2) g.tutorial.step = 3;
      save(true);
      returnModal = null;
      modalStack = [];
      modal = { kind: 'outcome' };
      render();
    }
    return;
  }
  if (a === 'save') {
    save();
    render();
  }
  if (a === 'export') exportGame();
});
app.addEventListener('change', async (e) => {
  if (e.target.dataset.chronicleFilter) {
    const focusId = e.target.id;
    modal.filters ||= {};
    modal.filters[e.target.dataset.chronicleFilter] = e.target.value;
    render();
    document.getElementById(focusId)?.focus();
    return;
  }
  if (e.target.id === 'import') {
    try {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 12 * 1024 * 1024)
        throw Error('This file is too large to be a Lineage chronicle.');
      g = parseSave(await file.text());
      message = 'The imported chronicle is restored.';
      returnModal = null;
      modalStack = [];
      modal = continuingModal();
      save(true);
    } catch (err) {
      message = 'Import failed: ' + err.message;
    }
    render();
  }
  if (e.target.id === 'audience-agent') {
    g.event.agent = e.target.value;
    save(true);
    render();
    app.querySelector('#audience-agent')?.focus();
  }
  if (e.target.id === 'decision-agent') {
    modal.agent = e.target.value;
    render();
    app.querySelector('#decision-agent')?.focus();
  }
  if (g && e.target.dataset.child) {
    g.children.find((c) => c.id === e.target.dataset.child).name =
      e.target.value.trim() || 'Unnamed child';
    save(true);
  }
});
app.addEventListener('keydown', (e) => {
  if (e.target.dataset.location && ['Enter', ' '].includes(e.key)) {
    e.preventDefault();
    e.target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
  if (
    e.target.classList.contains('file-button') &&
    ['Enter', ' '].includes(e.key)
  ) {
    e.preventDefault();
    e.target.querySelector('input').click();
  }
});
render();
