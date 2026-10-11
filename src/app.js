import {
  createGame,
  projects,
  seasons,
  roles,
  candidates,
  factionLore,
  sites,
  expeditions,
  relics,
  activeCourt,
  qualitative,
  resourceStory,
  getDecision,
  enact,
  eventOptions,
  resolveEvent,
  parseSave,
} from './game.js';
const app = document.querySelector('#app');
let g = null,
  tab = 'council',
  step = 0,
  modal = null,
  message = '',
  lastFocus = null;
const answers = {
  scale: 'town',
  name: 'Ari',
  realm: 'Alderwick',
  race: 'Human',
  values: 'Compassion',
  history: 'Inherited',
};
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const btn = (label, action, extra = '') =>
  `<button type="button" data-action="${action}" ${extra}>${label}</button>`;
const portrait = (c, cls = '') =>
  `<img class="portrait ${cls}" src="assets/${['mira', 'brann', 'sable', 'vesh', 'liora', 'kesh', 'orrin', 'tala'].includes(c.portrait || c.id) ? c.portrait || c.id : 'liora'}.svg" alt="Illustrated portrait of ${esc(c.name)}" loading="lazy">`;
const ornament = '<span class="ornament" aria-hidden="true">❧</span>';
const narrate = (label, value, kind = 'trust') =>
  `<span class="narrative-stat" title="${esc(label)}: ${Math.round(value)} of 100"><small>${esc(label)}</small><strong>${qualitative(value, kind)}</strong></span>`;
function header() {
  return `<header class="masthead"><div class="brand"><span class="sigil" aria-hidden="true">♜</span><div><h1>LINEAGE</h1><span>A chronicle of crowns & consequences</span></div></div><div class="tools">${btn('Load', 'load')}${g ? btn('Save', 'save') + btn('Export', 'export') : ''}<label class="button file-button" tabindex="0">Import<input id="import" type="file" accept="application/json,.json" hidden></label></div></header>`;
}
const questions = [
  [
    'How large is the realm you inherit?',
    'There is no small responsibility. Only different distances between a ruler and the people who depend on them.',
    'scale',
    ['town', 'province'],
  ],
  [
    'Who will wear the crown?',
    'A name to remember, a people to belong to, and a realm whose story will become your own.',
    'identity',
  ],
  [
    'What will guide your rule?',
    'Your conviction leaves its first mark on the realm. What happens next will be measured in the choices you make.',
    'values',
    ['Compassion', 'Prosperity', 'Strength', 'Harmony'],
  ],
  [
    'How did you reach the throne?',
    'The past has a seat at every council. The old houses remember how you came to power.',
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
  Strength: 'A promise that your people will be protected. Your watch begins better prepared.',
  Harmony: 'A place for every peaceful neighbor. Your realm begins with fairer institutions.',
  Inherited:
    'An established claim, accepted by most of the old houses. Your authority begins on firmer ground.',
  'Chosen by the council':
    'You owe your crown to a collection of hopes. The houses are still weighing your authority.',
  'Won through rebellion':
    'You broke the old order. Legitimacy must now grow from what you build in its place.',
};
function creation() {
  const q = questions[step];
  return `${header()}<main class="creation manuscript"><div class="creation-art" aria-hidden="true"></div><div class="creation-copy"><div class="eyebrow">THE FIRST CHAPTER · LEAF ${step + 1} OF IV</div>${ornament}<h2>${q[0]}</h2><p class="lead">${q[1]}</p>${q[2] === 'identity' ? `<div class="fields"><label>Your name<input name="name" maxlength="40" value="${esc(answers.name)}" autocomplete="off"></label><label>The realm’s name<input name="realm" maxlength="40" value="${esc(answers.realm)}" autocomplete="off"></label><label>Your people<select name="race">${['Human', 'Elf', 'Dwarf', 'Halfling', 'Orc', 'Goblin', 'Gnoll', 'Bugbear'].map((r) => `<option ${answers.race === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label></div>` : `<div class="creation-choices">${q[3].map((v) => `<button class="choice ${answers[q[2]] === v ? 'selected' : ''}" data-creation="${esc(v)}" aria-pressed="${answers[q[2]] === v}"><strong>${v === 'town' ? 'A town' : v === 'province' ? 'A province' : v}</strong><span>${choiceDescription[v]}</span></button>`).join('')}</div>`}<div class="creation-footer">${step ? btn('← Previous leaf', 'back') : '<span>Every reign begins with a choice.</span>'}${btn(step === 3 ? 'Take your place on the throne →' : 'Turn the page →', 'next', 'class="primary"')}</div><p role="status" class="creation-message">${esc(message)}</p></div></main>`;
}
function map() {
  return `<svg class="realm-map" viewBox="0 0 390 350" role="group" aria-label="Map of the realm; select a place to read its story"><defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 8L8 0" stroke="#9e9e73" stroke-width=".5" opacity=".35"/></pattern></defs><path class="land" d="M35 130L76 43 151 27 222 48 293 30 348 107 357 232 303 286 225 321 153 289 90 314 35 242Z"/><path d="M47 132L98 68 179 63 263 66 334 128 316 244 222 289 157 261 88 276 55 235Z" fill="url(#hatch)"/><path class="river" d="M191 45Q127 112 183 178T228 311"/><path class="road" d="M80 75L155 130 90 245M155 130L255 75M155 130L300 205M155 130L210 265"/><g class="map-decoration" aria-hidden="true"><path d="M42 60L62 16 84 60M67 61L94 24 118 62"/><path d="M210 100L220 75 230 100M231 106L242 72 254 106M248 114L264 83 280 114"/><text x="334" y="326">N</text><path d="M334 305V336M323 321H345"/></g>${sites.map((s) => `<g class="map-node ${g.selected === s.id ? 'active' : ''}" tabindex="0" role="button" aria-label="Read about ${s.name}" data-location="${s.id}"><rect x="${s.x - 28}" y="${s.y - 15}" width="56" height="42" fill="transparent"/><circle cx="${s.x}" cy="${s.y}" r="${s.id === 'capital' ? 10 : 5}"/><text x="${s.x}" y="${s.y + 19}" text-anchor="middle">${s.name}</text></g>`).join('')}</svg>`;
}
function sidebar() {
  const s = sites.find((s) => s.id === g.selected) || sites[0];
  return `<aside class="realm-sidebar"><section class="manuscript map-sheet"><div class="eyebrow">THE REALM, IN INK</div><h3>${esc(g.name)}</h3>${map()}<div class="place-intro"><small>${s.kind}</small><h4>${s.name}</h4><p>${s.strength}</p>${btn('Read the place’s story →', 'site', `data-id="${s.id}" class="text-button"`)}</div></section><section class="manuscript realm-weather"><div class="eyebrow">WORD FROM THE VILLAGES</div><p>${resourceStory(g, 'happiness')}.</p><p>${resourceStory(g, 'health')}.</p>${btn('Hear the realm’s condition →', 'resource', 'data-id="health" class="text-button"')}</section></aside>`;
}
function commissionCards() {
  return `<div class="commission-grid">${projects.map((p, i) => `<article class="commission"><div class="initial" aria-hidden="true">${['R', 'B', 'O', 'B', 'S', 'W'][i]}</div><div><span class="eyebrow">${{ stewardship: 'Works & welfare', martial: 'Duty & defense', diplomacy: 'Neighbors & belonging', intrigue: 'Secrets & justice' }[p.skill]}</span><h3>${esc(p.name)}</h3><p>${p.desc}</p>${btn('Consider the choices →', 'decision', `data-type="project" data-id="${p.id}" class="text-button" ${g.event || g.queue.length >= 3 ? 'disabled' : ''}`)}</div></article>`).join('')}</div>`;
}
function council() {
  const speaker = g.event && g.court.find((c) => c.id === g.event.speaker);
  return `<div class="hero"><img src="assets/hall.svg" alt="An illuminated illustration of Alder Hall among rolling hills"><div class="hero-caption"><span class="eyebrow">THE ROYAL DESK</span><h2>What will your reign remember?</h2></div></div><div class="council-copy"><p class="lead dropcap">${['The thaw sends travelers back to the roads. New beginnings arrive with muddy boots and old expectations.', 'The market fills with strangers and the long days invite bold plans. What grows now will ask to be tended.', 'Grain comes home beneath a softening sky. The harvest reveals which promises took root.', 'Smoke hangs above the roofs. The realm draws close to its hearths, and an empty shelf speaks louder than a decree.'][g.season]}</p>${g.event ? `<article class="audience-call">${speaker ? portrait(speaker) : '<span class="wax-seal" aria-hidden="true">L</span>'}<div><div class="eyebrow">AN ANSWER IS REQUIRED</div><h3>${esc(g.event.title)}</h3><p>${speaker ? esc(speaker.name) + ' requests an audience.' : 'A returned company or a council matter awaits your judgment.'}</p>${btn('Hear the audience →', 'audience', 'class="primary"')}</div></article>` : ''}<div class="section-title"><div><span class="eyebrow">LETTERS BEFORE THE THRONE</span><h2>A direction, then a trusted hand</h2></div><span class="ink-note">${g.queue.length} of 3 commissions</span></div>${commissionCards()}<div class="edict-call"><div><h3>The character of your rule</h3><p>Levy: ${esc(g.policies.tax)} · Law: ${esc(g.policies.law)} · Rites: ${esc(g.policies.rites)}. Edicts shape every season that follows.</p></div>${btn('Consider an edict', 'decision', 'data-type="policy"')}</div></div>`;
}
function memberCard(c) {
  const gone = c.status === 'departed' || !c.alive || c.status === 'ruler';
  return `<button class="member-card ${gone ? 'departed' : ''}" data-action="person" data-id="${c.id}" title="${esc(c.story)}"><span class="portrait-frame">${portrait(c)}</span><span class="member-copy"><small>${c.alive ? (c.status === 'departed' ? 'Former retainer' : c.status === 'ruler' ? 'Now sovereign' : c.role) : 'Remembered in service'}</small><strong>${esc(c.name)}</strong><span>${esc(c.race)} · ${esc(c.house || 'Independent')}</span><em>${esc((c.traits || []).join(' · '))}</em><span class="quiet">${qualitative(c.loyalty, 'loyalty')} in service · ${qualitative(c.affection, 'affection')} toward you</span><span class="read-profile">Open their story ↗</span></span></button>`;
}
function court() {
  return `<div class="sheet-heading"><span class="eyebrow">THE PEOPLE BEHIND THE SEAL</span><h2>A court is a gathering of stories</h2><p class="lead">Talent matters. So do the promises they remember, the people they love, and the office you ask them to carry.</p></div><div class="member-grid">${g.court.map(memberCard).join('')}</div><section class="section-inset"><div class="section-title"><div><span class="eyebrow">PETITIONERS FOR SERVICE</span><h2>Who deserves a place?</h2></div><span>${activeCourt(g).length} of 8 seats filled</span></div><div class="candidate-list">${
    g.applicants
      .filter((c) => !g.court.some((p) => p.id === c.id))
      .map(
        (c) =>
          `<article class="candidate">${portrait(c)}<div><h3>${c.name}</h3><p>${c.race} · ${c.origin}</p><p>${c.desire}</p>${btn('Hear their petition →', 'candidate', `data-id="${c.id}" class="text-button"`)}</div></article>`,
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
  return `<div class="sheet-heading"><span class="eyebrow">A REALM BEYOND ITS LEDGERS</span><h2>Hearths, houses & distant banners</h2><p class="lead">Every border encloses a history. Every treaty touches people who remember the last one.</p></div><div class="realm-sections"><h3>The condition of your realm</h3><div class="condition-grid">${['infrastructure', 'trade', 'military', 'health', 'learning', 'ecology', 'justice', 'faith'].map((k) => `<button class="condition-card" data-action="resource" data-id="${k}" title="${esc(resourceStory(g, k))}"><small>${k}</small><span>${resourceStory(g, k)}</span><em>Read the report ↗</em></button>`).join('')}</div><h3>Prominent families</h3><div class="family-grid">${g.families.map((h) => `<button class="family-card" data-action="family" data-id="${h.id}"><span class="heraldry" aria-hidden="true">${h.crest === 'sun' ? '☼' : h.crest === 'leaf' ? '❧' : '♜'}</span><small>${esc(h.motto)}</small><strong>${esc(h.name)}</strong><span>${esc(h.estate)}</span><em>Enter the family archive ↗</em></button>`).join('')}</div><h3>Factions & neighboring realms</h3><div class="faction-grid">${g.factions.map((f) => `<button class="faction-card" data-action="faction" data-id="${f.id}" title="${esc(factionLore[f.id].goal)}"><small>${esc(f.kind)}${f.alliance ? ' · Sworn ally' : ''}</small><strong>${esc(f.name)}</strong><span>${qualitative(f.trust)} toward your throne</span><p>${factionLore[f.id].goal}</p><em>Read their history & intentions ↗</em></button>`).join('')}</div><h3>Places worth knowing</h3><div class="site-grid">${sites.map((s) => `<button class="site-card" data-action="site" data-id="${s.id}"><img src="assets/${s.scene}.svg" alt="Illuminated landscape of ${s.name}" loading="lazy"><span><small>${s.kind}</small><strong>${s.name}</strong><em>${s.rumor}</em></span></button>`).join('')}</div></div>`;
}
function adventures() {
  return `<div class="hero"><img src="assets/ruins.svg" alt="A ruined sanctuary beneath a pale golden sky"><div class="hero-caption"><span class="eyebrow">BEYOND THE SAFE ROAD</span><h2>Some doors need a different key</h2></div></div><div class="council-copy"><p class="lead dropcap">Your watch protects the living roads. For buried temples, restless ruins, and dangers without a banner, hire those who know how to return with a story.</p><h3>Companies seeking a patron</h3>${g.parties.map((p) => `<button class="party-card" data-action="party" data-id="${p.id}">${portrait({ name: p.leader, portrait: p.portrait })}<span><small>${p.status === 'away' ? 'On an expedition' : p.wounds ? 'Recovering from wounds' : 'Available for a contract'}</small><strong>${esc(p.name)}</strong><span>${esc(p.members)}</span><em>${esc(p.story)}</em></span></button>`).join('')}<h3>Rumors worth following</h3><div class="quest-grid">${expeditions.map((t) => `<article class="quest"><img src="assets/${sites.find((s) => s.id === t.site).scene}.svg" alt="${sites.find((s) => s.id === t.site).name}" loading="lazy"><div><small>${g.completed.includes(t.id) ? 'A chapter answered' : g.missions.some((m) => m.task === t.id) ? 'A company is seeking an answer' : 'An unresolved rumor'}</small><h3>${t.name}</h3><p>${t.story}</p>${btn('Consider a contract →', 'decision', `data-type="expedition" data-id="${t.id}" class="text-button" ${g.completed.includes(t.id) || g.missions.some((m) => m.task === t.id) ? 'disabled' : ''}`)}</div></article>`).join('')}</div><h3>The realm’s reliquary</h3>${g.treasures.length ? g.treasures.map((t) => `<article class="relic"><span aria-hidden="true">✧</span><div><h4>${relics[t.id].name}</h4><p>${relics[t.id].story}</p><em>${relics[t.id].effect}</em></div></article>`).join('') : '<p class="quiet">No relic yet rests in the hall. What you recover may become a gift, a bargain, or a responsibility.</p>'}</div>`;
}
function lineage() {
  const adults = [
    ...activeCourt(g),
    ...g.children.filter((c) => c.alive && c.age >= 16 && c.status !== 'ruler'),
  ];
  const spouse = g.court.find((c) => c.id === g.spouse),
    heir = [...g.court, ...g.children].find((c) => c.id === g.heir);
  return `<div class="sheet-heading"><span class="eyebrow">THE CROWN OUTLIVES ITS WEARER</span><h2>The story that follows yours</h2><p class="lead">Inheritance is a name in a testament, a promise in a family, and a question the realm must answer together.</p></div><div class="household-record"><span class="wax-seal" aria-hidden="true">${g.dynasty}</span><div><h3>${esc(g.ruler.name)}, ${esc(g.ruler.race)}</h3><p>In the ${g.ruler.age}th year of life · ${qualitative(g.ruler.health, 'health')} · Reign ${g.dynasty}</p><p>${esc(g.ruler.values)} guides your rule. Your ascension was ${esc(g.ruler.history).toLowerCase()}.</p><p>${spouse ? `Married to ${esc(spouse.name)}${spouse.alive ? '' : ', whose memory remains in the household'}.` : 'No marriage binds your household yet.'}</p><p>${heir ? `${esc(heir.name)} is named to follow you.` : 'The testament names no successor. The court will choose if your reign ends.'}</p></div></div><section class="section-inset"><h3>The sealed testament</h3><p>Any living adult member of the household may be named. A public declaration earns recognition, but offended families and weak legitimacy can still challenge it.</p><label class="select-label">The person whose name you wish to record<select id="heir-selection"><option value="">Select a successor</option>${adults.map((c) => `<option value="${c.id}" ${g.heir === c.id ? 'selected' : ''}>${esc(c.name)} · age ${c.age}</option>`).join('')}</select></label>${btn('Consider the succession', 'heir', 'class="primary"')}</section><section class="section-inset"><h3>Companionship & courtship</h3><p>Private time can become affection. Affection and trust can become a marriage. A close relationship is needed before a proposal is welcome.</p><div class="suitor-grid">${activeCourt(
    g,
  )
    .filter((c) => c.id !== g.spouse)
    .map(
      (c) =>
        `<article class="suitor">${portrait(c)}<div><h4>${esc(c.name)}</h4><p>${qualitative(c.affection, 'affection')} toward you. ${qualitative(c.trust)} in your confidence.</p>${btn('Spend time together', 'decision', `data-type="cultivate" data-id="${c.id}"`)}${btn('Speak of marriage', 'decision', `data-type="marry" data-id="${c.id}" ${g.spouse ? 'disabled' : ''}`)}</div></article>`,
    )
    .join(
      '',
    )}</div></section><section class="section-inset"><h3>The next generation</h3>${g.children.length ? g.children.map((c) => `<article class="child-record"><label>Name in the household register<input data-child="${c.id}" value="${esc(c.name)}" maxlength="40"></label><p>${c.age ? `Age ${c.age}` : 'An infant'} · ${esc(c.race)} · ${qualitative(c.health, 'health')}${c.status === 'ruler' ? ' · Now sovereign' : ''}</p></article>`).join('') : '<p>The cradle is quiet. Children may arrive in a married household while the ruler is under fifty-five.</p>'}</section>`;
}
function chronicle() {
  return `<aside class="chronicle-sidebar"><section class="manuscript commissions-sheet"><span class="eyebrow">YOUR SEALED INSTRUCTIONS</span><h3>This season’s charges</h3>${g.queue.length ? g.queue.map((q) => `<article><strong>${projects.find((p) => p.id === q.id)?.name}</strong><p>${esc(g.court.find((c) => c.id === q.who)?.name)} carries your seal.</p></article>`).join('') : '<p>The letters are unwritten. Your court awaits a direction.</p>'}${g.missions.map((m) => `<article><strong>${expeditions.find((t) => t.id === m.task)?.name}</strong><p>${g.parties.find((p) => p.id === m.party)?.name} are expected ${m.returns - g.turn === 1 ? 'next season' : 'in two seasons'}.</p></article>`).join('')}<span class="ink-note">${activeCourt(g).length * 2} gold keeps the household each season.</span></section><section class="manuscript chronicle"><span class="eyebrow">THE CHRONICLER’S HAND</span><h3>What has come to pass</h3>${g.log
    .slice(0, 7)
    .map((s, i) => `<p class="${i === 0 ? 'latest' : ''}">${esc(s)}</p>`)
    .join('')}${btn('Open the chronicle →', 'chronicle', 'class="text-button"')}</section></aside>`;
}
function dashboard() {
  return `${header()}<div class="realm-heading"><div><span class="eyebrow">${esc(g.title.toUpperCase())} OF ${esc(g.name).toUpperCase()}</span><h2>The reign of ${esc(g.ruler.name)}</h2></div><div class="season"><span><small>${seasons[g.season]}</small><strong>Year ${g.year}</strong></span>${btn('Close the season →', 'decision', `data-type="season" class="primary" ${g.event ? 'disabled' : ''}`)}</div></div><div class="resource-ribbon">${['gold', 'food', 'population', 'happiness', 'legitimacy', 'security'].map((k) => `<button data-action="resource" data-id="${k}" title="${esc(resourceStory(g, k))}"><small>${{ gold: 'The treasury', food: 'Winter stores', population: 'Your people', happiness: 'The common mood', legitimacy: 'The crown’s standing', security: 'Roads & hearths' }[k]}</small><strong>${k === 'gold' ? g.resources.gold.toLocaleString() + ' gold' : k === 'population' ? g.resources.population.toLocaleString() + ' souls' : k === 'food' ? (g.resources.food < 20 ? 'Running thin' : g.resources.food < 60 ? 'Carefully kept' : 'Well provisioned') : qualitative(g.resources[k], k)}</strong><span class="ribbon-hint">${resourceStory(g, k)}</span></button>`).join('')}</div><div class="notice" role="status">${esc(message || 'The realm has no prescribed destiny. Every choice leaves a trace.')}</div><main class="dashboard">${sidebar()}<section class="manuscript main-sheet"><nav aria-label="Chapters of your reign">${[
    ['council', 'The council'],
    ['court', 'Your court'],
    ['realm', 'The realm'],
    ['adventures', 'Adventures'],
    ['lineage', 'Lineage'],
  ]
    .map(
      ([id, label]) =>
        `<button data-tab="${id}" class="${tab === id ? 'active' : ''}" aria-current="${tab === id ? 'page' : 'false'}">${label}</button>`,
    )
    .join(
      '',
    )}</nav>${{ council, court, realm, adventures, lineage }[tab]()}</section>${chronicle()}</main><footer>❧ &nbsp; LINEAGE · THE CROWN PASSES. THE STORY REMAINS. &nbsp; ❧</footer>`;
}
const modalActions = (c) =>
  c.alive && c.status === 'serving'
    ? `<div class="profile-actions">${btn('Personal audience', 'decision', `data-type="cultivate" data-id="${c.id}"`)}${btn('Change their office', 'decision', `data-type="transfer" data-id="${c.id}"`)}${btn('End their service', 'decision', `data-type="dismiss" data-id="${c.id}" class="danger"`)}</div>`
    : '';
function personProfile(c, isCandidate = false) {
  const bonds = g.bonds.filter((b) => b.a === c.id || b.b === c.id);
  return `<div class="profile-head">${portrait(c, 'large')}<div><span class="eyebrow">${isCandidate ? 'A PETITIONER FOR SERVICE' : c.status === 'departed' ? 'A FORMER MEMBER OF YOUR COURT' : 'THE COURT ARCHIVE'}</span><h2 id="dialog-title">${esc(c.name)}</h2><p>${esc(c.race)} · ${c.age} years · ${esc(c.house || 'Independent')}${c.role ? ' · ' + c.role : ''}</p><p class="traits">${(c.traits || []).map((t) => `<span>${esc(t)}</span>`).join('')}</p><blockquote>${esc(c.voice || '“A life in service is still a life of one’s own.”')}</blockquote></div></div><p class="lead dropcap">${esc(c.story)}</p><div class="profile-columns"><section><h3>The person beneath the office</h3><dl><dt>Origins</dt><dd>${esc(c.origin || 'The settlements of your realm')}</dd><dt>What they hope for</dt><dd>${esc(c.desire)}</dd><dt>What they fear</dt><dd>${esc(c.fear || 'That their voice will go unheard.')}</dd><dt>Family & hearth</dt><dd>${esc(c.family || 'Their kin at home follow their fortunes with interest.')}</dd><dt>Faith & custom</dt><dd>${esc(c.faith || 'They keep the customs of their home hearth.')}</dd>${!isCandidate ? `<dt>In confidence</dt><dd>${c.trust >= 70 ? esc(c.secret || 'They have entrusted no further private matters to the record.') : 'There are parts of their story they do not yet trust you to hear.'}</dd>` : ''}</dl></section><section><h3>Their craft & convictions</h3>${Object.entries(
    c.skills,
  )
    .map(([k, n]) => narrate(k, n, 'skill'))
    .join(
      '',
    )}${!isCandidate ? `<h4>How they stand with you</h4>${narrate('Trust', c.trust)}${narrate('Affection', c.affection, 'affection')}${narrate('Loyalty', c.loyalty, 'loyalty')}${narrate('Ambition', c.ambition, 'ambition')}${narrate('Unspoken grievances', c.grievance, 'grievance')}${narrate('Health', c.health, 'health')}<p>${c.status === 'serving' ? esc(roles[c.role]?.purpose || 'An available voice at your council.') : c.status === 'departed' ? 'They have left your household. Their allegiances and memories remain in the archive.' : c.status === 'ruler' ? 'They now bear the crown.' : 'Their service is preserved in the court archive.'}</p>` : ''}</section></div>${
    bonds.length
      ? `<h3>People in their life</h3>${bonds
          .map((b) => {
            const other = g.court.find((p) => p.id === (b.a === c.id ? b.b : b.a));
            return `<p class="relationship-story"><strong>${esc(other?.name)}</strong> — ${qualitative(b.trust).toLowerCase()} in confidence, ${qualitative(b.affection, 'affection').toLowerCase()} in affection. ${qualitative(b.rivalry, 'rivalry')}.</p>`;
          })
          .join('')}`
      : ''
  }${!isCandidate ? `<h3>What they remember of your reign</h3>${c.memories.length ? c.memories.map((s) => `<p class="memory">${esc(s)}</p>`).join('') : `<p class="memory">${esc(c.memory || 'Their service is still a fresh page in this chronicle.')}</p>`}` : ''}${isCandidate ? `<div class="profile-actions">${btn('Consider their appointment →', 'decision', `data-type="hire" data-id="${c.id}" class="primary"`)}</div>` : modalActions(c)}`;
}
function factionProfile(f) {
  const lore = factionLore[f.id];
  return `<span class="eyebrow">${esc(f.kind.toUpperCase())}${f.alliance ? ' · A SWORN ALLY' : ''}</span><h2 id="dialog-title">${esc(f.name)}</h2><p class="lead dropcap">${lore.story}</p><blockquote>“${lore.custom}”</blockquote><div class="profile-columns"><section><h3>Their place in the world</h3><dl><dt>Who speaks for them</dt><dd>${lore.leader}</dd><dt>What they want</dt><dd>${lore.goal}</dd><dt>Their strength</dt><dd>${lore.strength}</dd><dt>Their vulnerability</dt><dd>${lore.weakness}</dd><dt>Ties that matter</dt><dd>${lore.ties}</dd></dl></section><section><h3>How they see your throne</h3>${['trust', 'respect', 'affection', 'fear', 'trade', 'grievance'].map((k) => narrate(k, f[k], k)).join('')}<p>${f.grievance > 60 ? 'Their patience is thinning. Another slight could turn discontent into open opposition.' : f.trust > 65 ? 'They increasingly speak of the throne as a partner rather than a power to endure.' : 'Their support is conditional, shaped by promises kept and promises postponed.'}</p></section></div><h3>Relations beyond your throne</h3>${
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
  return `<span class="eyebrow">THE FAMILY ARCHIVE</span><div class="family-title"><span class="heraldry" aria-hidden="true">${h.crest === 'sun' ? '☼' : h.crest === 'leaf' ? '❧' : '♜'}</span><div><h2 id="dialog-title">${esc(h.name)}</h2><em>${esc(h.motto)}</em></div></div><p class="lead dropcap">${esc(h.story)}</p><div class="profile-columns"><section><h3>A name with many lives</h3><dl><dt>Head of the family</dt><dd>${esc(h.head)}</dd><dt>Notable kin</dt><dd>${esc(h.members)}</dd><dt>Estates & obligations</dt><dd>${esc(h.estate)}</dd><dt>Their present ambition</dt><dd>${esc(h.desire)}</dd><dt>Behind the heraldry</dt><dd>${g.resources.learning >= 60 || activeCourt(g).some((c) => c.role === 'Spymaster' && c.skills.intrigue >= 65) ? esc(h.secret) : 'Their private affairs remain outside the court’s knowledge. Scholarship or a capable spymaster may uncover more.'}</dd></dl></section><section><h3>Fortunes that change</h3>${narrate('Influence', h.power, 'power')}${narrate('Family cohesion', h.cohesion, 'cohesion')}${narrate('Fortune', h.fortune, 'fortune')}${narrate('Standing with the crown', h.standing)}<p>${h.cohesion < 35 ? 'Disagreements within the family now spill into public life.' : 'For now, the family presents a united name to the world.'}</p></section></div><div class="profile-actions">${btn('Answer their ambitions →', 'decision', `data-type="family" data-id="${h.id}" class="primary"`)}</div>`;
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
  const positive = ['health', 'ecology', 'trade', 'infrastructure', 'learning'].sort(
    (a, b) => g.resources[b] - g.resources[a],
  )[0];
  const weak = ['health', 'ecology', 'security', 'justice', 'happiness'].sort(
    (a, b) => g.resources[a] - g.resources[b],
  )[0];
  return `<span class="eyebrow">A REPORT FROM THE REALM</span><h2 id="dialog-title">${{ gold: 'The treasury', food: 'The winter stores', population: 'The people of your realm' }[key] || key[0].toUpperCase() + key.slice(1)}</h2><p class="lead dropcap">${resourceStory(g, key)}.</p><p>${resourceLore[key]}</p><div class="report-note"><h3>What supports us</h3><p>${resourceStory(g, positive)}.</p><h3>Where care is needed</h3><p>${resourceStory(g, weak)}.</p></div><h3>What the next season brings</h3><p>The household draws ${activeCourt(g).length * 2} gold in wages. ${g.policies.tax === 'heavy' ? 'The crown’s heavy levy adds revenue and repeated resentment.' : g.policies.tax === 'gentle' ? 'A gentler levy leaves more in humble hands and less in the treasury.' : 'A measured levy keeps the balance familiar.'} ${g.season === 1 ? 'The autumn harvest is next.' : g.season === 2 ? 'The harvest is in; reserves must carry the colder seasons.' : 'The next harvest remains ahead.'}</p><details class="ledger"><summary>Open the clerk’s exact ledger</summary><p>${key}: ${Math.round(g.resources[key]).toLocaleString()}${['gold', 'food', 'population'].includes(key) ? '' : ' / 100'}</p><p>Recognition as a ${g.scale === 'town' ? 'city' : 'kingdom'} requires infrastructure 75, trade 65, legitimacy 65, and ${g.scale === 'town' ? '1,000' : '14,000'} people.</p></details>${['gold', 'food', 'population'].includes(key) ? '' : btn('Consider a realm edict →', 'decision', 'data-type="policy" class="primary"')}`;
}
function siteProfile(s) {
  const task = expeditions.find((t) => t.site === s.id);
  return `<img class="dialog-landscape" src="assets/${s.scene}.svg" alt="Illuminated view of ${s.name}"><span class="eyebrow">${s.kind.toUpperCase()}</span><h2 id="dialog-title">${s.name}</h2><p class="lead dropcap">${s.story}</p><div class="profile-columns"><section><h3>Gifts & vulnerabilities</h3><p>${s.strength}</p><p>${s.risk}</p></section><section><h3>A story told at the hearth</h3><blockquote>${s.rumor}</blockquote></section></div>${task ? `<div class="profile-actions">${btn('Consider an expedition →', 'decision', `data-type="expedition" data-id="${task.id}" class="primary"`)}</div>` : ''}`;
}
function partyProfile(p) {
  const mission = g.missions.find((m) => m.party === p.id);
  return `<div class="profile-head">${portrait({ name: p.leader, portrait: p.portrait }, 'large')}<div><span class="eyebrow">A COMPANY OF ADVENTURERS</span><h2 id="dialog-title">${esc(p.name)}</h2><p>Led by ${esc(p.leader)}</p><p>${p.status === 'away' ? 'Beyond the safe roads' : p.wounds ? 'Tending their wounded' : 'Ready to hear a contract'}</p></div></div><p class="lead dropcap">${esc(p.story)}</p><h3>The companions</h3><p>${esc(p.members)}</p><div class="profile-columns"><section><h3>Reputation & readiness</h3>${narrate('Capability', p.skill, 'skill')}${narrate('Trust in your patronage', p.loyalty)}${narrate('Reputation', p.reputation)}${narrate('Care in preparation', p.caution, 'skill')}</section><section><h3>The terms of their work</h3><p>The company asks a base fee of ${p.fee} gold. A careful or respectful journey needs additional supplies and two seasons. A daring contract returns sooner, with greater risk.</p><p>${p.wounds ? `They need ${p.wounds} more season${p.wounds === 1 ? '' : 's'} to recover before taking another contract.` : mission ? `${expeditions.find((t) => t.id === mission.task).name} will test their resolve. They are expected in ${mission.returns - g.turn} season(s).` : 'They are rested and ready. Choose a task from the rumors in the Adventures chapter.'}</p></section></div>`;
}
function decisionContent() {
  const d = getDecision(g, modal.type, modal.id, modal.agent);
  if (!d) return '<h2 id="dialog-title">The matter has already passed</h2>';
  const agents = d.requiresAgent
    ? activeCourt(g).filter((c) => !g.queue.some((q) => q.who === c.id))
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
  return `<span class="eyebrow">YOUR WORD BECOMES THEIR WORLD</span><h2 id="dialog-title">${esc(d.title)}</h2><p class="lead">${esc(d.text)}</p>${agents ? `<label class="select-label">${d.requiresAgent ? 'Whose hands will carry your decision?' : 'Which company will carry your contract?'}<select id="decision-agent">${agents.length ? agents.map((c) => `<option value="${c.id}" ${modal.agent === c.id ? 'selected' : ''}>${esc(c.name)}${c.role ? ' · ' + esc(c.role) : ''}</option>`).join('') : '<option value="">No one is available</option>'}</select></label><p class="counsel-note">${esc(advice || 'Wait for a commission to end, or invite another qualified person to serve.')}</p>` : ''}${d.blocked ? `<p class="blocked" role="status">${esc(d.blocked)}</p>` : ''}<div class="decision-options">${d.options.map((o) => choiceCard(o, 'enact', !!d.blocked || (agents && !agents.length))).join('')}</div><p class="ink-note">${d.requiresAgent ? 'The listed direction is a promise, not a guarantee. Capability, office, loyalty, and resistance affect the outcome.' : 'The court will remember the course you choose.'}</p>`;
}
function choiceCard(o, action, blocked = false) {
  const disabled = blocked || o.disabled || g.resources.gold < o.cost;
  return `<button class="decision-option" data-action="${action}" data-choice="${o.id}" ${disabled ? 'disabled' : ''} title="${esc(o.reason || '')}"><span class="option-ornament" aria-hidden="true">❧</span><span><strong>${esc(o.label)}</strong><span>${esc(o.note)}</span><small>${o.cost ? o.cost + ' gold from the treasury' : 'No treasury expense'}${g.resources.gold < o.cost ? ' · Not enough coin' : ''}${o.disabled ? ' · ' + esc(o.reason) : ''}</small></span><b aria-hidden="true">→</b></button>`;
}
function audienceContent() {
  const e = g.event;
  if (!e) return '<h2 id="dialog-title">The hall is quiet</h2>';
  const c = g.court.find((c) => c.id === e.speaker),
    p = g.parties.find((p) => p.id === e.party);
  return `${e.scene ? `<img class="dialog-landscape" src="assets/${e.scene}.svg" alt="The place of the returning expedition">` : ''}<div class="audience-head">${c ? portrait(c) : p ? portrait({ name: p.leader, portrait: p.portrait }) : '<span class="wax-seal" aria-hidden="true">L</span>'}<div><span class="eyebrow">${['audience', 'followup', 'personal'].includes(e.type) ? 'A PRIVATE AUDIENCE' : e.type === 'expedition' ? 'A COMPANY RETURNS' : 'THE CROWN & ITS INHERITANCE'}</span><h2 id="dialog-title">${esc(e.title)}</h2>${c ? `<p>${esc(c.name)}, ${esc(c.role)}</p>` : p ? `<p>${esc(p.leader)}, ${esc(p.name)}</p>` : ''}</div></div><p class="audience-narrative dropcap">${esc(e.text)}</p><div class="decision-options">${eventOptions(
    g,
  )
    .map((o) => choiceCard(o, 'event'))
    .join(
      '',
    )}</div><p class="ink-note">The season waits for your answer. You may set the letter aside and return before closing council.</p>`;
}
function modalContent() {
  if (modal.kind === 'person') return personProfile(g.court.find((c) => c.id === modal.id));
  if (modal.kind === 'candidate')
    return personProfile(
      g.applicants.find((c) => c.id === modal.id),
      true,
    );
  if (modal.kind === 'faction') return factionProfile(g.factions.find((f) => f.id === modal.id));
  if (modal.kind === 'family') return familyProfile(g.families.find((h) => h.id === modal.id));
  if (modal.kind === 'site') return siteProfile(sites.find((s) => s.id === modal.id));
  if (modal.kind === 'resource') return resourceProfile(modal.id);
  if (modal.kind === 'party') return partyProfile(g.parties.find((p) => p.id === modal.id));
  if (modal.kind === 'audience') return audienceContent();
  if (modal.kind === 'decision') return decisionContent();
  return `<span class="eyebrow">EVERY WORD A TRACE</span><h2 id="dialog-title">The chronicle of ${esc(g.name)}</h2>${g.log.map((s) => `<p class="memory">${esc(s)}</p>`).join('')}`;
}
function render() {
  app.innerHTML = g ? dashboard() : creation();
  if (modal && g) {
    const dialog = document.createElement('dialog');
    dialog.className = 'manuscript dossier';
    dialog.setAttribute('aria-labelledby', 'dialog-title');
    dialog.innerHTML = `<div class="dialog-toolbar"><span class="eyebrow">THE ROYAL ARCHIVE</span>${btn(modal.kind === 'audience' ? 'Hear later ×' : 'Close ×', 'close', 'class="close-button" aria-label="Close this document"')}</div><div class="dialog-body">${modalContent()}</div>`;
    app.append(dialog);
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeModal();
    });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
          closeModal();
      }
    });
    dialog.showModal();
  }
}
function closeModal() {
  modal = null;
  const d = app.querySelector('dialog');
  d?.close();
  d?.remove();
  if (lastFocus?.isConnected) lastFocus.focus();
  else app.querySelector('nav button.active')?.focus();
}
function open(kind, id, type, agent) {
  lastFocus = document.activeElement;
  modal = { kind, id, type, agent };
  render();
}
function save(quiet = false) {
  try {
    localStorage.setItem('lineage-save', JSON.stringify(g));
    if (!quiet)
      message = 'The chronicle is saved in this browser. Export a copy to keep it elsewhere.';
  } catch {
    message = 'This browser cannot keep the chronicle. Export a copy before leaving.';
  }
}
function exportGame() {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(g, null, 2)], { type: 'application/json' }),
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
  if (a === 'next') {
    if (step === 1) {
      for (const key of ['name', 'realm', 'race'])
        answers[key] = app.querySelector(`[name="${key}"]`).value.trim();
      if (!answers.name || !answers.realm) {
        message = 'The ruler and realm each need a name in this chronicle.';
        render();
        return;
      }
    }
    message = '';
    if (step < 3) step++;
    else {
      g = createGame(answers);
      message = 'Your first spring begins. The court waits for a direction.';
    }
    render();
    return;
  }
  if (a === 'back') {
    step--;
    message = '';
    render();
    return;
  }
  if (a === 'load') {
    try {
      const s = localStorage.getItem('lineage-save');
      if (!s) throw Error('No chronicle has been saved in this browser yet.');
      g = parseSave(s);
      message = 'The chronicle is restored. Your court remembers where you left it.';
      modal = g.event ? { kind: 'audience' } : null;
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
  if (a === 'decision') {
    open('decision', id, t.dataset.type);
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
      modal = g.event ? { kind: 'audience' } : null;
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
    const r = resolveEvent(g, t.dataset.choice);
    message = r.text;
    if (r.ok) {
      save(true);
      modal = g.event ? { kind: 'audience' } : null;
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
  if (e.target.id === 'import') {
    try {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 2000000) throw Error('This file is too large to be a Lineage chronicle.');
      g = parseSave(await file.text());
      message = 'The imported chronicle is restored.';
      modal = g.event ? { kind: 'audience' } : null;
    } catch (err) {
      message = 'Import failed: ' + err.message;
    }
    render();
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
  if (e.target.classList.contains('file-button') && ['Enter', ' '].includes(e.key)) {
    e.preventDefault();
    e.target.querySelector('input').click();
  }
});
render();
