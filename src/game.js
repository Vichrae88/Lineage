import {
  royalAmbitions,
  declareAmbition,
  tickAmbitions,
} from './ambitions.js?v=0.5.1';
import { makePortraitRecipe } from './portraits.js?v=0.5.1';
import {
  commercialDecision,
  startVenture,
  ventureManagement,
  manageVenture,
} from './commerce.js?v=0.5.1';
import { addPromise, tickPromises } from './promises.js?v=0.5.1';
import { transitionsBetween } from './transitions.js?v=0.5.1';
import { delta } from './sim-core.js?v=0.5.1';
import { readSave } from './persistence.js?v=0.5.1';
import {
  courtCapacity,
  commissionCapacity,
  closeKin,
  competingClaim,
  beginReign,
  evolveRealm,
  governDistricts,
} from './dynasty.js?v=0.5.1';
import {
  roles,
  biographies,
  candidates,
  factionLore,
  familyLore,
  sites,
  parties,
  expeditions,
  relics,
  audienceStories,
  projectReports,
  followupReports,
  races,
  beastSpecies,
} from './data.js?v=0.5.1';
import { generateCampaign, freshSeed } from './campaign.js?v=0.5.1';
import { initializeWorld, worldStateValid } from './world-state.js?v=0.5.1';
import {
  snapshot,
  decisionRecord,
  appendRecord,
  addFact,
} from './history.js?v=0.5.1';
import {
  seasonProjection,
  applyEconomy,
  finishSeasonReport,
} from './economy.js?v=0.5.1';
import {
  developmentProjects,
  developmentChoices,
  projectSite,
  commissionConsequences,
  tickInstitutions,
  dueConsequences,
  settleConsequence,
} from './settlements.js?v=0.5.1';
import {
  skills,
  newPerson,
  isBusy,
  availableMentors,
  professionalForecast,
  assignmentDevelopment,
  practice,
  startTraining,
  tickTraining,
} from './characters.js?v=0.5.1';
import {
  tickPeople,
  tickCommunities,
  recordDeath,
  recordMarriage,
  lifeExpectancy,
} from './living.js?v=0.5.1';
import {
  generateEmergentEvent,
  resolveEmergent,
  tickObligations,
} from './emergent.js?v=0.5.1';
export { professionalForecast, availableMentors };
export { seasonProjection };
export {
  roles,
  candidates,
  factionLore,
  sites,
  expeditions,
  relics,
  races,
  beastSpecies,
};
export const raceName = (c) =>
  c.race === 'Beastfolk' ? `Beastfolk · ${c.species || 'Fox'}` : c.race;
export const realmSites = (g) => g.world?.sites || sites;
export const realmFactions = (g) => g.world?.factionLore || factionLore;
export const realmExpeditions = (g) => g.world?.expeditions || expeditions;
export const realmRelics = (g) => g.world?.relics || relics;
export const realmProjects = (g) => g.world?.projects || projects;
export const household = (g) => [...g.court, ...g.children, ...(g.kin || [])];
export const findPerson = (g, id) =>
  g.people?.[id] ||
  [g.ruler, ...household(g), ...g.applicants, ...(g.notables || [])].find(
    (p) => p.id === id,
  );
export const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];
export const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
export const projects = [
  {
    id: 'roads',
    name: 'The roads between us',
    desc: 'The ford is failing. Villages want a safe crossing; merchants want a faster one. Whose road will you build?',
    skill: 'stewardship',
    cost: 22,
    effects: { infrastructure: 12, trade: 8, happiness: 2 },
    faction: 'guild',
  },
  {
    id: 'granary',
    name: 'Bread through winter',
    desc: 'The steward brings three plans for the winter stores. Each feeds a different idea of what the realm owes its people.',
    skill: 'stewardship',
    cost: 15,
    effects: { food: 24, happiness: 8 },
    faction: 'commons',
  },
  {
    id: 'guard',
    name: 'The oath of the watch',
    desc: 'A watch can earn its authority, purchase it, or impose it. The recruits will learn from your choice.',
    skill: 'martial',
    cost: 20,
    effects: { military: 12, security: 8 },
    faction: 'guard',
  },
  {
    id: 'embassy',
    name: 'Beyond our borders',
    desc: 'A delegation to Briarroot could carry gifts, a contract, or a warning. Your envoy asks which voice to use.',
    skill: 'diplomacy',
    cost: 18,
    effects: { trade: 10, legitimacy: 3 },
    faction: 'goblins',
  },
  {
    id: 'festival',
    name: 'A season of belonging',
    desc: 'The spring feast can honor old lineages, welcome new neighbors, or make room for those who cannot pay.',
    skill: 'diplomacy',
    cost: 16,
    effects: { happiness: 12, legitimacy: 5 },
    faction: 'commons',
  },
  {
    id: 'inquiry',
    name: 'Whispers in the hall',
    desc: 'Missing tolls and contradictory ledgers hint at more than carelessness. Decide how deeply your agents may dig.',
    skill: 'intrigue',
    cost: 14,
    effects: { security: 14, legitimacy: 3 },
    faction: 'nobles',
  },
];
projects.push(...developmentProjects);
const living = (c) =>
  c.alive && c.status !== 'departed' && c.status !== 'ruler';
export const activeCourt = (g) => g.court.filter(living);
export const random = (g) => {
  g.rng = (Math.imul(g.rng, 1664525) + 1013904223) >>> 0;
  return g.rng / 4294967296;
};
export function log(g, text) {
  g.log.unshift(text);
  g.log = g.log.slice(0, 100);
}
// Unique stories belong to the campaign, including every ruler who inherits it.
export function eventKey(e) {
  if (!e) return null;
  if (e.type === 'audience')
    return (
      'audience:' +
      (e.id || audienceStories.find((s) => s.title === e.title)?.id || e.title)
    );
  if (e.type === 'followup') {
    const id = Object.entries(followupReports).find(
      ([, s]) => s.title === e.title,
    )?.[0];
    return 'followup:' + (e.id || (id ? id + '-followup' : e.title));
  }
  if (e.type === 'personal')
    return (
      'personal:' +
      (e.id || (e.title === 'An empty chair at supper' ? 'care' : 'purpose'))
    );
  if (e.type === 'expedition')
    return (
      'expedition:' +
      (e.id || expeditions.find((s) => s.name === e.title)?.id || e.title)
    );
  if (e.type === 'petition') return 'petition:' + e.title;
  if (['vacancy', 'succession'].includes(e.type) && e.id)
    return e.type + ':' + e.id;
  return null;
}
function reserveEvent(g, e) {
  const key = eventKey(e);
  if (key && (g.seenEvents.includes(key) || g.resolvedEvents.includes(key)))
    return false;
  if (key) {
    e.key = key;
    g.seenEvents.push(key);
  }
  return true;
}
function queueUnique(g, e) {
  if (!reserveEvent(g, e)) return false;
  g.pending.push(e);
  return true;
}
function nextAudience(g) {
  g.event = null;
  while (g.pending.length) {
    const e = g.pending.shift();
    if (!g.resolvedEvents.includes(eventKey(e))) {
      if (prepareAudience(g, e) === false) continue;
      g.event = e;
      break;
    }
  }
}
export function prepareAudience(g, e = g.event) {
  if (!e) return;
  const original = findPerson(g, e.speaker);
  const cancel = () => {
    const key = eventKey(e);
    if (key && !g.resolvedEvents.includes(key)) g.resolvedEvents.push(key);
    const arc = e.arc && g.consequences.find((c) => c.id === e.arc);
    if (arc) arc.status = 'cancelled';
    e.closedReason =
      'The original participants can no longer carry this matter forward.';
    e.text = e.closedReason;
    e.options = [
      option(
        'close',
        'Close this chapter',
        'The earlier history remains, with no new charge or reward.',
        0,
      ),
    ];
    delete e.engine;
    delete e.action;
    delete e.speaker;
    appendRecord(g, {
      kind: 'closed-petition',
      cause: e.origin || null,
      people: original ? [original.id] : [],
      site: e.site || null,
      text:
        'The matter “' +
        e.title +
        '” closes because its original participants can no longer carry it forward.',
    });
    return false;
  };
  if (
    e.engine === 'emergent' &&
    e.template === 'rivalry' &&
    e.relation.some((id) => !findPerson(g, id)?.alive)
  )
    return cancel();
  if (
    original &&
    (!original.alive ||
      original.status === 'departed' ||
      original.id === g.ruler.id) &&
    e.engine
  ) {
    if (
      [
        'enterprise',
        'talent',
        'graduate',
        'claimant',
        'commercial-concern',
        'commercial-legacy',
        'royal-legacy',
      ].includes(e.template) ||
      (e.engine === 'consequence' &&
        g.consequences.find((c) => c.id === e.arc)?.kind === 'school-maturity')
    )
      return cancel();
    const family = e.family && g.families.find((h) => h.id === e.family);
    const replacement = (
      family
        ? family.memberIds.map((id) => findPerson(g, id))
        : Object.values(g.people)
    ).find(
      (p) =>
        p?.alive &&
        p.age >= 18 &&
        p.tier !== 'reserve' &&
        p.status !== 'departed' &&
        p.id !== g.ruler.id &&
        (family || p.siteId === e.site),
    );
    if (!replacement) return cancel();
    e.text =
      'The original petitioner, ' +
      original.name +
      ', can no longer speak in this matter. ' +
      replacement.name +
      ' now brings the community’s unfinished request.\n\n' +
      e.text;
    e.speaker = replacement.id;
  }
  const adviser = findPerson(g, e.adviser);
  if (adviser && !living(adviser)) {
    const replacement = activeCourt(g)[0];
    const name = replacement?.name || 'Your chamberlain';
    e.text = e.text
      .replaceAll(
        adviser.name + ' waits beside your chair.',
        name + ' waits beside your chair.',
      )
      .replaceAll(adviser.name + ' asks what', name + ' asks what');
    e.adviser = replacement?.id;
  }
  const speaker = findPerson(g, e.speaker);
  if (
    speaker &&
    (!speaker.alive || speaker.status === 'departed') &&
    !e.archivedPetition
  ) {
    e.text = `The chronicler brings forward a written petition left by ${speaker.name}, whose place in the hall is now part of its history. Their earlier words still ask for an answer:\n\n${e.text}`;
    e.archivedPetition = true;
    e.archivedPerson = speaker.id;
    e.speaker =
      activeCourt(g).find((p) => p.id !== g.ruler.id)?.id ||
      Object.values(g.people).find(
        (p) =>
          p.alive && p.age >= 18 && p.tier !== 'reserve' && p.id !== g.ruler.id,
      )?.id;
  }
  if (!e.action) return;
  const available =
    e.action.type === 'project'
      ? activeCourt(g).filter((c) => !isBusy(g, c.id))
      : e.action.type === 'expedition'
        ? g.parties.filter((p) => p.status === 'available' && !p.wounds)
        : [];
  if (!available.some((c) => c.id === e.agent)) e.agent = available[0]?.id;
}
function bringForward(g, count) {
  if (!g.storyDeck) return;
  for (let i = 0; i < count && g.storyCursor < g.storyDeck.length; i++) {
    const e = structuredClone(g.storyDeck[g.storyCursor++]);
    if (
      e.action?.type === 'hire' &&
      g.court.some((c) => c.id === e.action.target)
    )
      continue;
    queueUnique(g, e);
  }
}
const relationship = (n = 50) => ({
  trust: n,
  respect: 50,
  affection: 40,
  fear: 20,
  trade: 20,
  grievance: 12,
});
function person(id, name, race, role, skills, age = 30) {
  return {
    id,
    name,
    race,
    role,
    skills,
    age,
    health: 90,
    loyalty: 65,
    trust: 55,
    affection: 35,
    respect: 55,
    ambition: 40,
    grievance: 10,
    experience: 0,
    alive: true,
    status: 'serving',
    portrait: id,
    ...biographies[id],
    memories: [],
    lastCultivated: -1,
    lastAppointed: -1,
    location: 'Alder Hall',
  };
}
export function createGame(o) {
  const big = o.scale === 'province';
  const g = {
    version: 4,
    scale: o.scale,
    title: big ? 'Province' : 'Town',
    name: o.realm || 'Alderwick',
    year: 1,
    season: 0,
    turn: 0,
    rng: 71421,
    ruler: {
      name: o.name || 'Ari',
      race: o.race || 'Human',
      ...(o.race === 'Beastfolk'
        ? {
            species:
              String(o.species || 'Fox')
                .trim()
                .slice(0, 40) || 'Fox',
          }
        : {}),
      age: 26,
      health: 95,
      values: o.values || 'Compassion',
      history: o.history,
      alive: true,
    },
    resources: {
      gold: big ? 125 : 90,
      food: big ? 115 : 85,
      population: big ? 12000 : 850,
      infrastructure: big ? 32 : 45,
      happiness: big ? 48 : 65,
      military: big ? 40 : 25,
      trade: 35,
      security: big ? 40 : 65,
      legitimacy: o.history === 'Inherited' ? 70 : 55,
      health: big ? 45 : 60,
      learning: 35,
      ecology: 65,
      justice: big ? 40 : 55,
      faith: 50,
    },
    court: [
      person('mira', 'Mira Ashwood', 'Elf', 'Steward', {
        stewardship: 78,
        martial: 22,
        diplomacy: 50,
        intrigue: 35,
      }),
      person(
        'brann',
        'Brann Stonehand',
        'Dwarf',
        'Marshal',
        { stewardship: 35, martial: 82, diplomacy: 30, intrigue: 45 },
        48,
      ),
      person(
        'sable',
        'Sable Reed',
        'Goblin',
        'Ambassador',
        { stewardship: 45, martial: 20, diplomacy: 80, intrigue: 65 },
        27,
      ),
    ],
    factions: [
      ['commons', 'The common hearths', 'The people'],
      ['guild', 'The Lantern Guild', 'Merchants & artisans'],
      ['guard', 'The sworn watch', 'Soldiers'],
      ['nobles', 'The old houses', 'Landed families'],
      ['goblins', 'Briarroot Compact', 'Goblin neighbor'],
      ['gnolls', 'Red Dune Clans', 'Gnoll confederation'],
      ['elves', 'The Silverwood Court', 'Elven realm'],
      ['bugbears', 'Stoneveil Lodge', 'Bugbear highlanders'],
      ['beastfolk', 'The Manyfold Assembly', 'Beastfolk communities'],
    ].map(([id, name, kind], i) => ({
      id,
      name,
      kind,
      ...relationship(i < 4 ? 55 : 40),
      grievance: big ? 25 : 12,
      alliance: false,
    })),
    bonds: [
      { a: 'mira', b: 'brann', trust: 40, affection: 30, rivalry: 35 },
      { a: 'mira', b: 'sable', trust: 65, affection: 60, rivalry: 10 },
      { a: 'brann', b: 'sable', trust: 35, affection: 25, rivalry: 45 },
    ],
    queue: [],
    children: [],
    spouse: null,
    heir: null,
    log: [
      'Your ascension begins a new chapter. The court awaits your first instructions.',
    ],
    event: null,
    selected: 'capital',
    dynasty: 1,
    applicants: structuredClone(candidates),
    scheduled: [],
    lastAudience: {},
    seenEvents: [],
    resolvedEvents: [],
    expeditionOutcomes: {},
    families: structuredClone(familyLore),
    parties: structuredClone(parties),
    missions: [],
    completed: [],
    treasures: [],
    pending: [],
    diplomaticBonds: [
      { a: 'elves', b: 'goblins', trust: 32, tension: 55 },
      { a: 'gnolls', b: 'bugbears', trust: 64, tension: 20 },
      { a: 'nobles', b: 'guild', trust: 72, tension: 35 },
      { a: 'beastfolk', b: 'elves', trust: 48, tension: 30 },
    ],
    policies: { tax: 'balanced', law: 'restorative', rites: 'plural' },
    lastEdict: -1,
    history: [],
  };
  if (o.values === 'Compassion') g.resources.health += 5;
  if (o.values === 'Prosperity') g.resources.trade += 5;
  if (o.values === 'Strength') g.resources.military += 5;
  if (o.values === 'Harmony') g.resources.justice += 5;
  const campaign = generateCampaign(o.seed ?? freshSeed(), o, projects);
  Object.assign(g, campaign);
  g.bonds = [];
  for (let a = 0; a < g.court.length; a++)
    for (let b = a + 1; b < g.court.length; b++)
      g.bonds.push({
        a: g.court[a].id,
        b: g.court[b].id,
        trust: Math.round(35 + random(g) * 35),
        affection: Math.round(25 + random(g) * 30),
        rivalry: Math.round(10 + random(g) * 35),
      });
  if (g.ruler.disposition === 'Generous')
    g.factions.find((f) => f.id === 'commons').trust += 5;
  if (g.ruler.disposition === 'Stern') g.resources.security += 4;
  if (g.ruler.disposition === 'Curious') g.resources.learning += 4;
  g.log = [
    `${g.ruler.name} takes the throne at ${realmSites(g)[0].name}. ${g.ruler.family}`,
  ];
  g.newDynasty = true;
  initializeWorld(g, projects);
  bringForward(g, 1);
  nextAudience(g);
  return g;
}
export function qualitative(value, kind = 'trust') {
  const words = {
    trust: [
      'Deeply suspicious',
      'Guarded',
      'Cautiously receptive',
      'Dependable',
      'Wholehearted',
    ],
    affection: ['Cold', 'Distant', 'Warm', 'Fond', 'Devoted'],
    grievance: [
      'At peace',
      'Minor misgivings',
      'Unresolved hurts',
      'Bitter',
      'Near revolt',
    ],
    ambition: ['Content', 'Measured', 'Aspiring', 'Driven', 'Hungry for power'],
    health: ['In grave danger', 'Frail', 'Recovering', 'Well', 'Vigorous'],
    skill: [
      'Unpracticed',
      'Learning',
      'Capable',
      'Accomplished',
      'Exceptional',
    ],
    rivalry: [
      'Companionable',
      'Occasional friction',
      'Competitive',
      'Resentful',
      'Open hostility',
    ],
    happiness: ['Angry', 'Anxious', 'Unsettled', 'Hopeful', 'Joyful'],
    security: ['Exposed', 'Troubled', 'Watchful', 'Secure', 'Well protected'],
    legitimacy: [
      'Rejected',
      'Contested',
      'Conditional',
      'Recognized',
      'Unquestioned',
    ],
    respect: ['Dismissive', 'Unconvinced', 'Courteous', 'Admiring', 'Reverent'],
    fear: ['Untroubled', 'Uneasy', 'Intimidated', 'Afraid', 'Terrified'],
    trade: ['Dormant', 'Occasional', 'Developing', 'Flourishing', 'Essential'],
    loyalty: [
      'Disaffected',
      'Uncertain',
      'Conditional',
      'Faithful',
      'Unshakable',
    ],
    power: ['Marginal', 'Local', 'Established', 'Influential', 'Dominant'],
    fortune: ['In debt', 'Strained', 'Modest', 'Comfortable', 'Prosperous'],
    cohesion: ['Divided', 'Fractured', 'Negotiating', 'United', 'Unbreakable'],
  };
  return (words[kind] || words.trust)[
    Math.min(4, Math.floor(clamp(value) / 20))
  ];
}
export function resourceStory(g, key) {
  const n = g.resources[key];
  const descriptions = {
    food:
      n < 20
        ? 'Empty shelves and anxious kitchens'
        : n < 60
          ? 'Stores will need careful rationing'
          : 'Granaries carry the scent of a sound harvest',
    gold:
      n < 15
        ? 'The treasurer counts every remaining coin'
        : n < 60
          ? 'Enough coin for careful commitments'
          : 'The treasury can support a generous ambition',
    population: `${n.toLocaleString()} souls call this realm home`,
    happiness:
      n < 35
        ? 'Resentment travels faster than good news'
        : n < 65
          ? 'Hope and worry share the marketplace'
          : 'Neighbors linger at the market to exchange good news',
    legitimacy:
      n < 35
        ? 'Your right to rule is openly questioned'
        : n < 65
          ? 'Oaths hold, though some are conditional'
          : 'Your authority is accepted across the realm',
    security:
      n < 35
        ? 'Travelers avoid the roads after dusk'
        : n < 65
          ? 'The watch holds, with gaps in the patrols'
          : 'Travelers trust the roads and sleep without fear',
    infrastructure:
      n < 35
        ? 'Bridges creak and mills wait for repairs'
        : n < 65
          ? 'Reliable crossings, unfinished roads'
          : 'Roads and mills bind the settlements together',
    trade:
      n < 35
        ? 'Few caravans arrive; workshops stand quiet'
        : n < 65
          ? 'Markets prosper unevenly'
          : 'Foreign goods and busy workshops fill the streets',
    military:
      n < 35
        ? 'A small watch with more courage than equipment'
        : n < 65
          ? 'A capable watch, stretched by its duties'
          : 'Well-trained companies stand ready for a hard season',
    health:
      n < 35
        ? 'Fevers visit houses without a healer'
        : n < 65
          ? 'Healers work hard with limited medicines'
          : 'Clean wells and trusted healers protect the villages',
    learning:
      n < 35
        ? 'Knowledge stays behind a few closed doors'
        : n < 65
          ? 'Apprentices and scribes begin sharing their craft'
          : 'Schools and workshops draw minds from distant realms',
    ecology:
      n < 35
        ? 'The river darkens; woodland paths fall silent'
        : n < 65
          ? 'The land carries the marks of a growing realm'
          : 'Living woods and clear water sustain the settlements',
    justice:
      n < 35
        ? 'A name or a purse weighs more than the truth'
        : n < 65
          ? 'Most receive a hearing, though privilege still speaks'
          : 'Even a stranger can expect a fair hearing',
    faith:
      n < 35
        ? 'Shrines stand neglected and customs divide neighbors'
        : n < 65
          ? 'Different hearths keep their own sacred stories'
          : 'Festivals and shrines offer a shared sense of belonging',
  };
  return descriptions[key] || qualitative(n);
}
const option = (id, label, note, cost = 0, effects = {}, relations = {}) => ({
  id,
  label,
  note,
  cost,
  effects,
  relations,
});
function projectOptions(p) {
  const base = option(
    'balanced',
    'Build for the whole realm',
    'A measured commission balancing immediate need and lasting trust.',
    p.cost,
    p.effects,
    { [p.faction]: { trust: 7 } },
  );
  const opts = {
    roads: [
      option(
        'villages',
        'Put the villages first',
        'Repair small bridges and mill access. Better lives, less immediate commerce.',
        18,
        { infrastructure: 9, happiness: 7, justice: 3 },
        { commons: { trust: 10 }, guild: { grievance: 3 } },
      ),
      option(
        'commerce',
        'Build the merchant causeway',
        'A fast commercial road, with new tolls and a scar through the woods.',
        25,
        { infrastructure: 14, trade: 13, ecology: -6 },
        { guild: { trust: 12 }, elves: { grievance: 8 } },
      ),
    ],
    granary: [
      option(
        'shared',
        'Establish village-owned granaries',
        'Strengthen local resilience rather than the crown’s control of grain.',
        18,
        { food: 28, happiness: 9, justice: 4 },
        { commons: { trust: 10 }, nobles: { grievance: 4 } },
      ),
      option(
        'reserve',
        'Keep a crown reserve',
        'A larger reserve for hard times, though rationing remains in official hands.',
        12,
        { food: 32, happiness: -2 },
        { guard: { trust: 5 }, commons: { grievance: 4 } },
      ),
    ],
    guard: [
      option(
        'protect',
        'Train guardians, not enforcers',
        'Local patrols learn mediation and rescue alongside their weapons.',
        22,
        { military: 8, security: 10, justice: 7 },
        { commons: { trust: 8 }, guard: { respect: 6 } },
      ),
      option(
        'iron',
        'Demand iron discipline',
        'More formidable soldiers, but arrests and harsh punishments breed fear.',
        14,
        { military: 16, security: 8, justice: -7, happiness: -4 },
        { guard: { respect: 8 }, commons: { grievance: 8, fear: 10 } },
      ),
    ],
    embassy: [
      option(
        'listen',
        'Send gifts and listen',
        'Recognition builds trust more slowly than a profitable contract.',
        20,
        { trade: 4, justice: 3 },
        { goblins: { trust: 14, affection: 8 } },
      ),
      option(
        'terms',
        'Insist on favorable terms',
        'A richer agreement for your merchants risks the compact’s resentment.',
        12,
        { trade: 14 },
        { goblins: { grievance: 10, fear: 4 }, guild: { trust: 8 } },
      ),
    ],
    festival: [
      option(
        'open',
        'Open the feast to every hearth',
        'Feed those without invitations. Nobles find themselves seated beside new neighbors.',
        21,
        { happiness: 16, faith: 7, justice: 4 },
        {
          commons: { trust: 10 },
          goblins: { affection: 6 },
          nobles: { grievance: 4 },
        },
      ),
      option(
        'heritage',
        'Honor the old houses',
        'A dignified celebration binds ancient loyalties while outsiders watch from the street.',
        12,
        { legitimacy: 12, faith: 4 },
        { nobles: { trust: 12 }, commons: { grievance: 6 } },
      ),
    ],
    inquiry: [
      option(
        'public',
        'Hold a public inquiry',
        'Fair hearings can uncover wrongdoing and teach people that no seal is above the law.',
        20,
        { security: 8, justice: 10, legitimacy: 4 },
        { commons: { trust: 7 }, nobles: { grievance: 6 } },
      ),
      option(
        'quiet',
        'Follow the whispers in secret',
        'Discreet agents make the court safer. The methods may not survive daylight.',
        10,
        { security: 17, justice: -5 },
        { nobles: { fear: 9 }, guild: { grievance: 5 } },
      ),
    ],
  };
  return developmentChoices[p.id] || [base, ...opts[p.id]];
}
export function getDecision(g, type, target, agent) {
  let d = {
    type,
    target,
    agent,
    title: 'A decision before the throne',
    text: '',
    options: [],
  };
  const c = findPerson(g, target);
  const f = g.factions.find((f) => f.id === target);
  const p = realmProjects(g).find((p) => p.id === target);
  if (type === 'ambition') {
    d.title = 'The work I hope will outlive me';
    d.text =
      'A personal ambition gives a reign direction without ending its story or binding a successor. Its progress follows actual people, works and relationships.';
    d.options = Object.entries(royalAmbitions).map(([id, a]) =>
      option(id, a.name, a.description, 0),
    );
    d.blocked = g.ambitions.some((a) => a.person === g.ruler.id)
      ? 'This ruler’s chosen ambition is already part of their history.'
      : null;
  }
  if (type === 'portrait' && c) {
    d.title = 'A new portrait of ' + c.name;
    d.text =
      'A court painter works from the person’s appearance and heritage. This commission changes the painting, while preserving their identity, family, history and abilities.';
    d.options = [
      option(
        'formal',
        'Commission a formal court painting',
        '8 gold. An illuminated formal frame holds a naturalistic painted likeness.',
        8,
      ),
      option(
        'natural',
        'Ask for an unadorned naturalistic likeness',
        '5 gold. The portrait concentrates on face, bearing and ordinary clothing.',
        5,
      ),
      option(
        'chronicle',
        'Set their likeness into the illustrated Chronicle',
        '4 gold. A drawn treatment preserves the same painted features.',
        4,
      ),
    ];
    d.blocked =
      c.lastPortrait === g.turn
        ? 'Their portrait has already been commissioned this season.'
        : null;
  }
  if (type === 'commercial') {
    const [kind, context] = String(target).split(':');
    const business = commercialDecision(g, kind, context, agent);
    if (!business) return null;
    Object.assign(d, business, { target, commercialKind: kind });
  }
  if (type === 'venture') {
    const business = ventureManagement(g, target, agent);
    if (!business) return null;
    Object.assign(d, business);
  }
  if (type === 'operator') {
    const v = g.ventures.find((v) => v.id === target);
    if (!v) return null;
    d.title = 'A living delegate for ' + v.name;
    d.text =
      'The new delegate inherits responsibility for an existing undertaking. Its original capital, ownership and history remain.';
    d.requiresAgent = true;
    d.skill = 'trade';
    d.options = [
      option(
        'appoint',
        'Entrust them with the ongoing bargain',
        '4 gold changes the delegate and resumes a viable paused operation.',
        4,
      ),
    ];
    d.blocked = ['completed', 'failed', 'closed'].includes(v.status)
      ? 'This undertaking has already closed.'
      : v.lastReviewed === g.turn
        ? 'This undertaking has already been reviewed this season.'
        : g.ventures.filter(
              (x) =>
                x.actor === agent &&
                ['forming', 'outbound', 'operating', 'paused'].includes(
                  x.status,
                ),
            ).length >= 2
          ? 'This delegate already carries two continuing undertakings.'
          : null;
  }
  if (type === 'project' && p) {
    d.title = p.name;
    d.text = p.desc;
    d.options = projectOptions(p);
    d.requiresAgent = true;
    d.skill = p.skill;
    if (
      target === 'school' &&
      g.institutions?.some(
        (i) =>
          ['school', 'academy', 'apprenticeship'].includes(i.kind) &&
          i.site === 'capital' &&
          i.status === 'active',
      )
    )
      d.existingSchool = true;
    d.blocked =
      g.event &&
      (g.event.action?.type !== type || g.event.action?.target !== target)
        ? 'Hear the waiting audience before issuing a new commission.'
        : d.existingSchool
          ? 'A school already operates here. Its students and upkeep continue through the seasons.'
          : g.queue.length >= commissionCapacity(g)
            ? 'Your court has capacity for ' +
              commissionCapacity(g) +
              ' commissions each season.'
            : null;
  }
  if (type === 'hire') {
    const v = g.applicants.find((c) => c.id === target);
    if (!v) return null;
    d.title = `A place for ${v.name}`;
    d.text = `${v.story} Their terms will shape how they see the throne.`;
    d.options = [
      option(
        'retainer',
        'Offer an honest retainer',
        'Pay a fair wage and promise a voice at council.',
        25,
        {},
        { [v.faction]: { trust: 5 } },
      ),
      option(
        'patronage',
        'Sponsor their personal ambition',
        'A generous patronage earns loyalty and raises expectations.',
        38,
        {},
        { [v.faction]: { trust: 9 } },
      ),
      option(
        'probation',
        'Offer a provisional appointment',
        'Save coin, but they arrive uncertain of your confidence.',
        15,
        {},
        { [v.faction]: { grievance: 3 } },
      ),
    ];
    d.blocked =
      activeCourt(g).length >= courtCapacity(g)
        ? 'There are ' +
          courtCapacity(g) +
          ' places at your council. Release someone before recruiting.'
        : !v.alive
          ? 'This petitioner is remembered; they cannot enter service.'
          : g.court.some((c) => c.id === target)
            ? 'This petitioner has already answered your invitation.'
            : null;
  }
  if (type === 'dismiss' && c) {
    d.title = `Release ${c.name} from service`;
    d.text =
      'An empty chair leaves an echo. Their friends, family, and former colleagues will remember how you end this service.';
    d.options = [
      option(
        'honor',
        'Dismiss with honors and a pension',
        'A gracious parting preserves their dignity and their people’s goodwill.',
        12,
        {},
        { [c.faction]: { trust: 3 } },
      ),
      option(
        'release',
        'End the appointment plainly',
        'No pension, no humiliation. Their personal disappointment remains.',
        0,
        {},
        { [c.faction]: { grievance: 4 } },
      ),
      option(
        'disgrace',
        'Strip the office in public',
        'An assertion of authority. Fear grows alongside bitter resentment.',
        0,
        { legitimacy: 2 },
        { [c.faction]: { grievance: 14, fear: 8 } },
      ),
    ];
    d.blocked = !living(c)
      ? 'They no longer serve at court.'
      : isBusy(g, c.id)
        ? 'Let their current commission finish before ending their service.'
        : activeCourt(g).length <= 1
          ? 'The realm needs at least one serving councillor.'
          : null;
  }
  if (type === 'transfer' && c) {
    d.title = `Entrust ${c.name} with an office`;
    d.text =
      'Office shapes responsibility. A suited appointment strengthens commissions; replacing someone leaves them an unappointed councillor.';
    d.options = Object.entries(roles)
      .filter(([r]) => r !== c.role)
      .map(([r, v]) => ({
        ...option(r, `Appoint as ${r}`, v.purpose, 0),
        requiresOffice: r,
        disabled:
          r !== 'Councillor' &&
          g.queue.some((q) => g.court.find((p) => p.id === q.who)?.role === r),
        reason:
          'The current officeholder must complete their commission first.',
      }));
    d.blocked = !living(c)
      ? 'Only serving court members may receive an office.'
      : c.lastAppointed === g.turn
        ? 'Let this appointment settle before transferring them again.'
        : isBusy(g, c.id)
          ? 'Their present commission must conclude before a transfer.'
          : null;
  }
  if (type === 'cultivate' && c) {
    d.title = `An hour with ${c.name}`;
    d.text =
      c.voice || 'A quiet conversation may do what an official decree cannot.';
    d.options = [
      option(
        'listen',
        'Listen without the clerks present',
        'Private attention builds trust and affection; ambitions remain their own.',
        8,
      ),
      option(
        'mentor',
        'Study a difficult case together',
        'They deepen their strongest craft and respect your investment.',
        8,
        { learning: 2 },
      ),
      option(
        'honor',
        'Recognize their work before the court',
        'Public esteem builds loyalty, but also confidence in their own importance.',
        12,
      ),
    ];
    d.blocked = !living(c)
      ? 'They are no longer in service.'
      : c.lastCultivated === g.turn
        ? 'You have already devoted personal time to them this season.'
        : null;
  }
  if (type === 'diplomacy' && f) {
    d.blocked =
      f.lastNegotiation === g.turn
        ? 'Allow this season’s message to arrive before sending another.'
        : null;
    d.title = `Speak with ${f.name}`;
    d.text = realmFactions(g)[f.id].goal;
    d.options = [
      option(
        'reconcile',
        'Hear their grievances',
        'An open hearing repairs trust and acknowledges past hurts.',
        10,
        { justice: 2 },
        { [f.id]: { trust: 10, affection: 5, grievance: -12 } },
      ),
      option(
        'trade',
        'Offer a fair trade compact',
        'Commerce improves for both parties, with less attention to political grievances.',
        12,
        { trade: 5 },
        { [f.id]: { trade: 12, trust: 6 } },
      ),
      {
        ...option(
          'alliance',
          'Swear an alliance of mutual defense',
          'A trusted partner becomes a lasting ally. Old enemies notice.',
          18,
          { legitimacy: 3 },
          { [f.id]: { respect: 10, trust: 5 } },
        ),
        disabled: f.trust < 60 || f.alliance,
        reason: f.alliance
          ? 'An alliance is already sworn.'
          : 'They need a dependable relationship before swearing an alliance.',
      },
      option(
        'pressure',
        'Make your strength felt',
        'An inexpensive assertion of authority creates fear and sows resentment.',
        0,
        { legitimacy: 2 },
        { [f.id]: { fear: 15, grievance: 12, trust: -8 } },
      ),
    ];
  }
  if (type === 'family') {
    const h = g.families.find((h) => h.id === target);
    if (!h) return null;
    d.blocked =
      h.lastPetition === g.turn
        ? 'This family’s petition has already received an answer this season.'
        : null;
    d.title = `A petition from ${h.name}`;
    d.text = `${h.head} requests your attention. ${h.desire}`;
    d.options = [
      option(
        'patron',
        'Offer patronage without privilege',
        'Support their estate while keeping the law equal.',
        16,
        { infrastructure: 3 },
        { [h.faction]: { trust: 6 } },
      ),
      option(
        'charter',
        'Grant a privileged charter',
        'Their influence grows; ordinary households see another special exception.',
        5,
        { legitimacy: 6, justice: -5 },
        { [h.faction]: { trust: 12 }, commons: { grievance: 8 } },
      ),
      option(
        'service',
        'Ask for service before favors',
        'A public expectation of contribution limits their influence.',
        0,
        { justice: 4 },
        { [h.faction]: { grievance: 6 }, commons: { trust: 5 } },
      ),
    ];
  }
  if (type === 'policy') {
    d.title = 'What kind of realm will this become?';
    d.text =
      'An edict remains in force across seasons. Its benefits and burdens will return with every harvest.';
    d.options = [
      option(
        'gentle',
        'Ease the levy on humble hearths',
        'A gentler tax lifts morale and leaves less income for the treasury.',
        0,
      ),
      option(
        'balanced',
        'Keep a measured levy',
        'Steady income and no new burden.',
        0,
      ),
      option(
        'heavy',
        'Raise a levy for the crown',
        'A richer treasury comes at the cost of goodwill every season.',
        0,
      ),
      option(
        'restore',
        'Favor restitution over punishment',
        'Fair hearings improve justice, though administration costs coin.',
        4,
      ),
      option(
        'strict',
        'Use exemplary punishments',
        'Order becomes easier to impose; humane justice suffers.',
        0,
      ),
      option(
        'plural',
        'Protect every peaceful faith',
        'Belonging grows among different peoples. Old houses dislike shared authority.',
        5,
      ),
      option(
        'traditional',
        'Fund the ancestral rites',
        'Sacred continuity strengthens faith and noble favor, with less room for outsiders.',
        8,
      ),
    ];
    d.blocked =
      g.lastEdict === g.turn
        ? 'Let this season’s edict settle before changing the realm’s course.'
        : null;
  }
  if (type === 'expedition') {
    const task = realmExpeditions(g).find((e) => e.id === target),
      party = g.parties.find((p) => p.id === agent);
    if (!task) return null;
    d.title = task.name;
    d.text = task.story;
    d.requiresParty = true;
    const fee = party?.fee || 18;
    d.options = [
      option(
        'careful',
        'Map, prepare, and bring everyone home',
        'Two seasons. Preparation lowers the risk; knowledge matters as much as treasure.',
        fee + 8,
      ),
      option(
        'bold',
        'Make a swift, daring expedition',
        'One season. Greater danger, a faster answer, and a chance at remarkable treasure.',
        fee,
      ),
      option(
        'respectful',
        'Treat the place as a living trust',
        'Two seasons. Bring local guides and respect sacred boundaries; some relics may remain where they belong.',
        fee + 4,
      ),
    ];
    d.blocked =
      g.completed.includes(target) ||
      g.seenEvents.includes('expedition:' + target)
        ? 'This expedition is a settled chapter. Its outcome remains part of the realm’s history.'
        : g.missions.some((m) => m.task === target)
          ? 'An expedition is already seeking an answer here.'
          : null;
  }
  if (type === 'marry' && c) {
    d.title = `A future with ${c.name}`;
    d.text =
      'A marriage joins two people, their loyalties, and the expectations of everyone who watches the throne.';
    d.options = [
      option(
        'private',
        'Make a quiet, personal vow',
        'Tenderness and trust, without a costly public celebration.',
        12,
        { happiness: 2 },
      ),
      option(
        'public',
        'Celebrate before the whole realm',
        'An expensive feast that strengthens recognition of your household.',
        25,
        { legitimacy: 7, happiness: 5, faith: 3 },
      ),
      option(
        'wait',
        'Speak honestly and wait',
        'Keep the relationship growing without promising a marriage today.',
        0,
      ),
    ];
    d.blocked =
      closeKin(g, g.ruler, c) || c.age < 18
        ? 'A close relative or a child cannot be courted.'
        : g.spouse || c.spouseId
          ? 'A marriage already binds one of your households.'
          : !living(c) || c.affection < 59 || c.trust < 65
            ? 'They need a closer, more trusting relationship before accepting marriage.'
            : null;
  }
  if (type === 'heir') {
    d.blocked =
      g.lastHeir === g.turn
        ? 'This season’s testament has already been recorded.'
        : null;
    d.title = 'Whose name follows yours?';
    d.text =
      'A public declaration gains recognition; a private designation preserves flexibility. Every succession still depends on the realm’s loyalties.';
    d.options = [
      option(
        'public',
        'Name the heir before the assembled court',
        'A public oath strengthens legitimacy, while rival families consider their position.',
        5,
        { legitimacy: 5 },
        { nobles: { grievance: 3 } },
      ),
      option(
        'private',
        'Record the heir in the sealed testament',
        'No ceremony or expense. The heir must rely on your written word.',
        0,
      ),
      option(
        'none',
        'Leave the succession open',
        'No heir will be named; the council will choose if your reign ends.',
        0,
        { legitimacy: -3 },
      ),
    ];
  }
  if (['training', 'mentorship', 'reward'].includes(type)) {
    if (!c || !c.alive || c.tier === 'reserve') return null;
    d.title =
      type === 'reward' ? 'A reward for ' + c.name : 'Invest in ' + c.name;
    d.text =
      type === 'reward'
        ? 'A stipend changes their actual wealth, morale and reputation.'
        : 'Professional development takes several seasons. Practice is limited per season and slows near mastery.';
    d.requiresAgent = type === 'mentorship';
    d.requiresMentor = type === 'mentorship';
    d.skill = 'training';
    d.options =
      type === 'reward'
        ? [
            option(
              'stipend',
              'Offer a personal stipend',
              '10 gold. Their finances, morale and confidence improve.',
              10,
            ),
            option(
              'equipment',
              'Provide tools for their profession',
              '16 gold. An equipment grant improves morale and makes professional work easier.',
              16,
            ),
            option(
              'honor',
              'Recognize their service publicly',
              '4 gold. Reputation and influence rise, and rivals may take notice.',
              4,
            ),
          ]
        : skills.map((skill) =>
            option(
              skill,
              (type === 'mentorship'
                ? 'Arrange mentorship in '
                : 'Fund professional study in ') + skill,
              'A paid course, with measurable progress over ' +
                (type === 'mentorship' ? 'two' : 'three') +
                ' seasons. It reserves the student’s time' +
                (type === 'mentorship' ? ' and the mentor’s.' : '.'),
              type === 'mentorship' ? 18 : 16,
            ),
          );
    d.blocked =
      c.age < 12
        ? 'Formal professional study begins at twelve.'
        : isBusy(g, c.id)
          ? 'Their time is already committed to work or study.'
          : null;
    if (type === 'mentorship' && agent) {
      const mentor = findPerson(g, agent);
      if (!mentor || !availableMentors(g, c.id).some((m) => m.id === agent))
        d.blocked = 'Choose an available, experienced adult mentor.';
    }
    if (type === 'reward' && c.lastReward === g.turn)
      d.blocked = 'A personal reward has already been given this season.';
  }
  if (type === 'governor') {
    const local = g.settlements[target];
    if (!local || target === 'capital') return null;
    d.title = 'Administration at ' + local.name;
    d.text =
      'A governor remains a member of your court and supports this district through their own administration and leadership. Their office costs 1 gold each season.';
    d.requiresAgent = true;
    d.skill = 'administration';
    d.options = [
      option(
        'appoint',
        'Entrust the district to this courtier',
        '8 gold. Their capabilities support local prosperity and security, with continuing upkeep.',
        8,
      ),
      option(
        'consult',
        'Keep a local consultative council',
        '4 gold. No individual governor or continuing royal salary; local autonomy improves confidence.',
        4,
        { justice: 2 },
      ),
      option(
        'release',
        'Return direct oversight to the throne',
        'No new cost. End the governor’s salary and their ongoing local work.',
        0,
      ),
    ];
    d.blocked =
      local.lastAdministration === g.turn
        ? 'The district’s administration has already been settled this season.'
        : null;
  }
  if (type === 'institution') {
    const i = g.institutions.find((i) => i.id === target);
    if (!i) return null;
    d.title = 'The future of ' + i.name;
    d.text =
      'Funding pays for real work each season. Closing it ends that work; its founding history remains.';
    d.options = [
      option(
        'fund',
        'Restore and maintain the institution',
        '12 gold now, then its normal upkeep. Work and education can resume.',
        12,
      ),
      option(
        'expand',
        'Increase its grant and quality',
        '10 gold; upkeep rises by 2, to a maximum of 8. The staff can improve its work.',
        10,
      ),
      option(
        'close',
        'Suspend royal funding',
        'No new cost. Work and classes pause, while the building and its history remain.',
        0,
        { happiness: -2 },
      ),
    ];
    d.blocked =
      i.lastReviewed === g.turn
        ? 'This institution’s funding has already been reviewed this season.'
        : null;
  }
  if (type === 'season') {
    d.title = 'Close this season’s council';
    d.text =
      'Your commissions will be tested, wages paid, stories advanced, and adventurers may return. Choose the counsel that guides the season.';
    d.options = [
      option(
        'people',
        'Keep the villages foremost',
        'Attend to public health and belonging; the treasury supports small relief.',
        4,
        { health: 2, happiness: 2 },
      ),
      option(
        'accounts',
        'Watch the ledgers closely',
        'Recover small revenues; some households find the scrutiny cold.',
        0,
        { gold: 3, happiness: -1 },
      ),
      option(
        'borders',
        'Watch the roads and borders',
        'Patrols strengthen security, but need supplies and coin.',
        4,
        { security: 3, food: -2 },
      ),
    ];
    d.blocked = g.event
      ? 'An audience awaits your answer before the season can close.'
      : null;
  }
  if (!g.ruler.alive)
    d.blocked =
      'The throne is empty. Resolve the succession before issuing commands.';
  return d.options.length ? d : null;
}
function effects(g, values) {
  for (const [k, v] of Object.entries(values || {})) {
    if (!(k in g.resources)) continue;
    g.resources[k] = ['gold', 'food', 'population'].includes(k)
      ? Math.max(0, g.resources[k] + v)
      : clamp(g.resources[k] + v);
  }
}
function diplomaticEffects(g, values) {
  for (const [id, changes] of Object.entries(values || {})) {
    const f = g.factions.find((f) => f.id === id);
    if (!f) continue;
    for (const [k, v] of Object.entries(changes)) f[k] = clamp(f[k] + v);
  }
}
function remember(g, c, text) {
  if (!c) return;
  c.memories.unshift(`${seasons[g.season]}, Year ${g.year}: ${text}`);
  c.memories = c.memories.slice(0, 15);
}
function record(g, type, target, choice, text, context = {}) {
  g.history.unshift({ turn: g.turn, type, target, choice, text });
  g.history = g.history.slice(0, 100);
  log(g, text);
  const { before, ...details } = context;
  initializeWorld(g, projects);
  return decisionRecord(
    g,
    {
      type,
      target,
      choice,
      people: [context.agent, context.speaker, target].filter((id) =>
        findPerson(g, id),
      ),
      families: type === 'family' ? [target] : [],
      factions: [],
      site:
        context.site || (type === 'project' ? projectSite(g, target) : null),
      ...details,
    },
    before,
    text,
  );
}
const result = (ok, text, entry = null) => ({ ok, text, entry });
export function enact(g, type, target, choice, agent) {
  const d = getDecision(g, type, target, agent);
  if (!d) return result(false, 'That decision is no longer available.');
  const o = d.options.find((o) => o.id === choice);
  if (!o || o.disabled || d.blocked)
    return result(
      false,
      o?.reason || d.blocked || 'Choose one of the offered courses.',
    );
  if (g.resources.gold < o.cost)
    return result(false, 'The treasury cannot yet support that promise.');
  const before = snapshot(g);
  let c = findPerson(g, target);
  if (type === 'commercial') {
    const actor = findPerson(g, agent);
    if (!actor?.alive || actor.status !== 'serving' || isBusy(g, agent))
      return result(false, 'Choose an available serving delegate.');
    g.resources.gold -= o.cost;
    const root = appendRecord(g, {
      kind: 'decision',
      type: 'commercial',
      site: d.site,
      people: [agent],
      text: 'The crown settles a new commercial undertaking.',
    });
    const venture = startVenture(
      g,
      { ...d, target: d.commercialKind },
      choice,
      root.id,
    );
    const text =
      actor.name +
      ' receives the seal for ' +
      venture.name +
      '. The investment, ownership and promise of a return are entered in the Treasury.';
    const entry = record(g, type, target, choice, text, {
      before,
      agent,
      site: d.site,
      existing: root.id,
    });
    return result(true, text, entry.id);
  }
  if (
    type === 'operator' &&
    (!findPerson(g, agent)?.alive ||
      findPerson(g, agent).status !== 'serving' ||
      isBusy(g, agent))
  )
    return result(false, 'Choose an available living delegate.');
  if (type === 'project') {
    const a = g.court.find((c) => c.id === agent);
    if (!a || !living(a) || isBusy(g, agent))
      return result(
        false,
        'Choose a serving councillor with no commission this season.',
      );
    g.resources.gold -= o.cost;
    g.queue.push({
      id: target,
      who: agent,
      approach: choice,
      effects: o.effects,
      relations: o.relations,
      cost: o.cost,
      site: projectSite(g, target),
    });
    remember(
      g,
      a,
      `You entrusted them with “${d.title}”: ${o.label.toLowerCase()}.`,
    );
    const text = `${a.name} bows over your seal. “${o.label}” is now their charge.`;
    const entry = record(g, type, target, choice, text, {
      agent,
      before,
      expected: { realm: o.effects, person: o.person, personId: target },
    });
    if (type === 'project') {
      g.queue.at(-1).decisionId = entry.id;
      addPromise(g, {
        kind: 'commission',
        title: realmProjects(g).find((p) => p.id === target).name,
        source: entry.id,
        due: g.turn + 1,
        person: agent,
        site: projectSite(g, target),
        project: target,
      });
    }
    return result(true, text, entry.id);
  }
  if (type === 'expedition') {
    const p = g.parties.find((p) => p.id === agent);
    if (!p || p.status !== 'available' || p.wounds > 0)
      return result(false, 'Choose a company that is rested and available.');
    g.resources.gold -= o.cost;
    p.status = 'away';
    for (const id of p.memberIds || []) {
      const member = findPerson(g, id);
      if (member) {
        member.awayUntil = g.turn + (choice === 'bold' ? 1 : 2);
        member.travelSite = realmExpeditions(g).find(
          (t) => t.id === target,
        ).site;
      }
    }
    g.missions.push({
      task: target,
      party: agent,
      approach: choice,
      returns: g.turn + (choice === 'bold' ? 1 : 2),
    });
    const text = `${p.name} leave with your instructions: ${o.label.toLowerCase()}.`;
    const entry = record(g, type, target, choice, text, {
      agent,
      before,
      expected: { realm: o.effects, person: o.person, personId: target },
    });
    g.missions.at(-1).origin = entry.id;
    if (type === 'project') g.queue.at(-1).decisionId = entry.id;
    return result(true, text, entry.id);
  }
  if (
    type === 'mentorship' &&
    (!agent || !availableMentors(g, target).some((m) => m.id === agent))
  )
    return result(false, 'Choose an available adult mentor.');
  if (type === 'heir' && choice !== 'none') {
    const h = household(g).find(
      (h) =>
        h.id === target &&
        h.alive &&
        h.age >= 16 &&
        h.status !== 'departed' &&
        h.status !== 'ruler',
    );
    if (!h)
      return result(false, 'Choose a living adult member of the household.');
  }
  if (type === 'governor' && !activeCourt(g).some((p) => p.id === agent))
    return result(false, 'Choose a serving court member.');
  g.resources.gold -= o.cost;
  effects(g, o.effects);
  diplomaticEffects(g, o.relations);
  let text = `${d.title}: ${o.label}.`;
  if (type === 'hire') {
    const v = g.applicants.find((v) => v.id === target);
    c = {
      ...person(v.id, v.name, v.race, 'Councillor', { ...v.skills }, v.age),
      ...v,
      status: 'serving',
      alive: true,
      loyalty: choice === 'patronage' ? 80 : choice === 'probation' ? 48 : 65,
      trust: choice === 'probation' ? 40 : 55,
      ambition: choice === 'patronage' ? 55 : 40,
      secret:
        v.secret ||
        'Their confidence must be earned before private matters are shared.',
      faith: v.faith || 'The customs of their home hearth.',
      family:
        v.family || `Their kin in ${v.origin} follow this appointment closely.`,
      appearance:
        v.appearance ||
        'Travel-worn clothes, carefully mended for an audience with the crown.',
      memories: [],
      lastCultivated: -1,
      lastAppointed: -1,
      location: realmSites(g)[0].name,
    };
    for (const other of activeCourt(g))
      g.bonds.push({
        a: other.id,
        b: c.id,
        trust: other.faction === c.faction ? 60 : 40,
        affection: 35,
        rivalry: other.ambition > 60 ? 40 : 15,
      });
    g.court.push(c);
    text = `${c.name} takes a place at your table, ${choice === 'probation' ? 'carefully watching whether your welcome lasts' : 'bringing the hopes of their home with them'}.`;
  }
  if (type === 'dismiss') {
    c.status = 'departed';
    if (choice === 'honor') c.wealth += 12;
    c.location = c.origin;
    c.loyalty = clamp(
      c.loyalty + (choice === 'honor' ? 0 : choice === 'release' ? -15 : -35),
    );
    c.grievance = clamp(
      c.grievance + (choice === 'honor' ? 0 : choice === 'release' ? 12 : 30),
    );
    for (const b of g.bonds.filter((b) => b.a === c.id || b.b === c.id)) {
      const friend = g.court.find((p) => p.id === (b.a === c.id ? b.b : b.a));
      if (friend && b.affection > 45)
        friend.loyalty = clamp(
          friend.loyalty -
            (choice === 'disgrace' ? 10 : choice === 'release' ? 4 : 0),
        );
    }
    if (g.heir === c.id) g.heir = null;
    text = `${c.name} leaves the hall ${choice === 'honor' ? 'with honors and a promise of a pension' : choice === 'release' ? 'with a formal farewell' : 'under the eyes of a silent court'}. Their story continues beyond your household.`;
  }
  if (type === 'transfer') {
    const previous = activeCourt(g).find(
      (p) => p.role === choice && p.id !== c.id,
    );
    if (previous && choice !== 'Councillor') {
      previous.role = 'Councillor';
      previous.respect = clamp(previous.respect - 5);
      remember(g, previous, `${c.name} took their former office.`);
    }
    c.lastAppointed = g.turn;
    c.role = choice;
    c.profession = choice;
    const oldSite = c.siteId;
    c.siteId = choice === 'Ambassador' ? 'border' : 'capital';
    if (g.settlements[oldSite])
      g.settlements[oldSite].residents = g.settlements[
        oldSite
      ].residents.filter((id) => id !== c.id);
    if (!g.settlements[c.siteId].residents.includes(c.id))
      g.settlements[c.siteId].residents.push(c.id);
    c.location = realmSites(g).find(
      (s) => s.id === (choice === 'Ambassador' ? 'border' : 'capital'),
    ).name;
    c.respect = clamp(c.respect + 5);
    text = `${c.name} accepts the office of ${choice}. ${previous && choice !== 'Councillor' ? `${previous.name} remains as an unappointed councillor.` : ''}`;
  }
  if (type === 'cultivate') {
    c.lastCultivated = g.turn;
    if (choice === 'mentor') {
      const key = Object.keys(c.skills).sort(
        (a, b) => c.skills[b] - c.skills[a],
      )[0];
      practice(g, c, key, 2);
      c.respect = clamp(c.respect + 6);
      c.loyalty = clamp(c.loyalty + 4);
    } else if (choice === 'listen') {
      c.affection = clamp(c.affection + 12);
      c.trust = clamp(c.trust + 8);
      c.loyalty = clamp(c.loyalty + 5);
    } else {
      c.respect = clamp(c.respect + 10);
      c.loyalty = clamp(c.loyalty + 7);
      c.ambition = clamp(c.ambition + 5);
    }
    text =
      choice === 'listen'
        ? `${c.name} speaks of ${c.desire.toLowerCase()} For an hour, the crown listens rather than commands.`
        : choice === 'mentor'
          ? `You and ${c.name} work through a difficult case. They leave with a sharper craft and renewed confidence.`
          : `Before the assembled court, you honor ${c.name}. Their friends applaud; rivals take notice.`;
  }
  if (type === 'diplomacy') {
    const f = g.factions.find((f) => f.id === target);
    f.lastNegotiation = g.turn;
    if (choice === 'alliance') {
      f.alliance = true;
      for (const b of g.diplomaticBonds.filter(
        (b) => b.a === f.id || b.b === f.id,
      )) {
        const other = g.factions.find(
          (p) => p.id === (b.a === f.id ? b.b : b.a),
        );
        if (b.tension > 45) {
          other.grievance = clamp(other.grievance + 5);
          log(g, `${other.name} watches your new alliance with unease.`);
        }
      }
    }
    text = `Word reaches ${f.name}: ${o.label.toLowerCase()}. ${choice === 'pressure' ? 'Their silence carries more fear than friendship.' : 'Your messenger returns with the beginnings of an answer.'}`;
  }
  if (type === 'family') {
    const h = g.families.find((h) => h.id === target);
    h.lastPetition = g.turn;
    h.standing = clamp(h.standing + (choice === 'service' ? -6 : 8));
    h.fortune = clamp(
      h.fortune + (choice === 'patron' ? 10 : choice === 'charter' ? 6 : -3),
    );
    h.power = clamp(
      h.power + (choice === 'charter' ? 8 : choice === 'service' ? -5 : 2),
    );
    text = `${h.head} receives your answer. ${choice === 'patron' ? 'The estate will thrive, without an exception to the law.' : choice === 'charter' ? 'A new privilege binds their fortune to your rule.' : 'Service to the realm must come before favors from its ruler.'}`;
  }
  if (type === 'governor') {
    const local = g.settlements[target];
    local.lastAdministration = g.turn;
    if (choice === 'appoint') {
      const governor = findPerson(g, agent);
      if (!governor?.alive)
        return result(false, 'Choose a living court member.');
      for (const s of Object.values(g.settlements))
        if (s.governorId === agent) s.governorId = null;
      local.governorId = agent;
      governor.reputation = clamp(governor.reputation + 3);
      text =
        governor.name +
        ' accepts responsibility for ' +
        local.name +
        '. Their administration and leadership will shape the district through coming seasons.';
    } else {
      local.governorId = null;
      if (choice === 'consult') local.prosperity = clamp(local.prosperity + 3);
      text =
        local.name +
        ' will be overseen through ' +
        (choice === 'consult'
          ? 'a local consultative council'
          : 'the throne directly') +
        '.';
    }
  }
  if (type === 'portrait') {
    if (c.portraitRecipe.version !== 2)
      c.portraitRecipe = makePortraitRecipe(g, c);
    c.portraitRecipe.treatment = choice;
    c.lastPortrait = g.turn;
    text =
      'The painter completes a ' +
      choice +
      ' likeness of ' +
      c.name +
      '. Their life and history remain their own.';
  }
  if (type === 'venture') {
    const v = g.ventures.find((v) => v.id === target);
    manageVenture(g, v, choice);
    text =
      v.name + ' receives a new settlement: ' + o.label.toLowerCase() + '.';
  }
  if (type === 'operator') {
    const v = g.ventures.find((v) => v.id === target);
    v.actor = agent;
    v.lastReviewed = g.turn;
    v.profit -= 4;
    v.invested += 4;
    if (
      v.status === 'paused' &&
      v.condition >= 20 &&
      (!v.expires || v.expires > g.turn)
    )
      v.status =
        g.turn < v.due
          ? 'forming'
          : ['caravan', 'expedition'].includes(v.kind)
            ? 'outbound'
            : 'operating';
    text =
      findPerson(g, agent).name +
      ' now carries the crown’s responsibilities at ' +
      v.name +
      '.';
  }
  if (type === 'reward') {
    c.lastReward = g.turn;
    if (choice === 'stipend') {
      c.wealth += 10;
      c.morale = clamp(c.morale + 8);
      c.trust = clamp(c.trust + 4);
    }
    if (choice === 'equipment') {
      c.equipment.push({
        kind: 'professional tools',
        quality: 60,
        granted: g.turn,
      });
      c.morale = clamp(c.morale + 5);
    }
    if (choice === 'honor') {
      c.reputation = clamp(c.reputation + 8);
      c.connections = clamp(c.connections + 4);
      c.ambition = clamp(c.ambition + 2);
    }
    text =
      c.name +
      ' receives ' +
      o.label.toLowerCase() +
      '. Their life and resources have changed.';
  }
  if (type === 'institution') {
    const i = g.institutions.find((i) => i.id === target);
    i.lastReviewed = g.turn;
    if (choice === 'close') {
      i.status = 'closed';
      i.budget = 0;
    } else {
      i.status = 'active';
      i.budget =
        choice === 'expand'
          ? Math.min(8, (i.budget || 1) + 2)
          : ['school', 'academy', 'apprenticeship'].includes(i.kind)
            ? 3
            : 1;
      i.condition = clamp(i.condition + 10);
      if (choice === 'expand') i.quality = clamp(i.quality + 5);
    }
    text =
      i.name +
      ' is ' +
      (choice === 'close'
        ? 'closed until its funding can be restored'
        : 'funded for the work ahead') +
      '. Its earlier history remains in the chronicle.';
  }
  if (type === 'policy') {
    g.lastEdict = g.turn;
    if (['gentle', 'balanced', 'heavy'].includes(choice))
      g.policies.tax = choice;
    if (['restore', 'strict'].includes(choice))
      g.policies.law = choice === 'restore' ? 'restorative' : 'strict';
    if (['plural', 'traditional'].includes(choice)) g.policies.rites = choice;
  }
  if (type === 'marry') {
    if (choice !== 'wait') {
      recordMarriage(g, g.ruler, c);
      g.spouse = target;
      c.loyalty = clamp(c.loyalty + 15);
      c.affection = clamp(c.affection + 10);
      text = `You and ${c.name} ${choice === 'private' ? 'exchange vows in the quiet of the hall' : 'marry before a gathering of every hearth'}. A new chapter begins for your household.`;
    } else {
      c.trust = clamp(c.trust + 3);
      text = `You and ${c.name} speak honestly about a future neither is ready to promise yet.`;
    }
  }
  if (type === 'heir') {
    g.lastHeir = g.turn;
    g.heir = choice === 'none' ? null : target;
    text =
      choice === 'none'
        ? 'You leave the line of succession open. The council will have to choose.'
        : `${household(g).find((c) => c.id === target).name} is named heir ${choice === 'public' ? 'before the court' : 'in the sealed testament'}.`;
  }
  remember(g, c, o.label + '.');
  const entry = record(g, type, target, choice, text, {
    agent,
    before,
    expected: { realm: o.effects, person: o.person, personId: target },
  });
  if (type === 'ambition') declareAmbition(g, choice, entry.id);
  if (type === 'training' || type === 'mentorship')
    startTraining(
      g,
      target,
      choice,
      type === 'mentorship' ? agent : null,
      entry.id,
    );
  if (type === 'season') advance(g, before);
  return result(true, text, entry?.id);
}
// Compatibility entry points for existing campaigns and simulation tools.
export const delegate = (g, id, who) =>
  enact(g, 'project', id, 'balanced', who).ok;
export const cultivate = (g, id, action) =>
  enact(g, 'cultivate', id, action === 'mentor' ? 'mentor' : 'listen').ok;
export const marry = (g, id) => enact(g, 'marry', id, 'private').ok;
export const relation = (g, id, action) => enact(g, 'diplomacy', id, action).ok;
export const recruit = (g) => {
  const c = g.applicants.find((c) => !g.court.some((p) => p.id === c.id));
  return c ? enact(g, 'hire', c.id, 'retainer').ok : false;
};
export function succession(g, cause = 'an unrecorded cause') {
  recordDeath(g, g.ruler, cause);
  const ended = g.reigns.find((r) => r.person === g.ruler.id && r.end === null);
  if (ended) ended.end = g.turn;
  const h = household(g).find(
    (c) =>
      c.id === g.heir &&
      c.alive &&
      c.age >= 16 &&
      c.status !== 'departed' &&
      c.status !== 'ruler',
  );
  const previous = household(g).find(
    (c) => c.status === 'ruler' && c.name === g.ruler.name,
  );
  if (previous)
    Object.assign(previous, {
      alive: false,
      status: 'deceased',
      age: g.ruler.age,
      health: g.ruler.health,
    });
  g.ruler.alive = false;
  const rival = competingClaim(g, h);
  if (!h) {
    g.event = {
      id: 'reign-' + g.dynasty,
      type: 'vacancy',
      backdrop: 'hall',
      title: `The crown after ${g.ruler.name}`,
      text: `The candles burn beside the empty chair at ${realmSites(g)[0].name}. ${g.ruler.name} left no eligible named heir. Outside, messengers wait for a seal they recognize. The council must choose a living adult whose history can become the next reign.`,
    };
    reserveEvent(g, g.event);
    return;
  }
  if (
    g.resources.legitimacy < 50 ||
    g.factions.find((f) => f.id === 'nobles').grievance > 55
  ) {
    g.event = {
      id: 'reign-' + g.dynasty,
      type: 'succession',
      backdrop: 'hall',
      speaker: h.id,
      rival: rival?.id || null,
      title: `The testament naming ${h.name}`,
      text: `After ${g.ruler.name}’s death, ${g.factions.find((f) => f.id === 'nobles').name} challenge ${h.name}. ${rival ? rival.name + ' has put forward a competing claim, supported by their own history and connections. ' : ''} ${h.story || 'The chosen heir has a life and loyalties already known to this household.'} At ${realmSites(g)[0].name}, a lawful testament and a living loyalty are not always the same thing. The next reign now depends on how this claim is defended.`,
    };
    reserveEvent(g, g.event);
  } else ascend(g, h);
}
export function ascend(g, h, cause = null) {
  const prior = g.ruler;
  h.status = 'ruler';
  h.alive = true;
  h.history = 'Succeeded';
  h.values ||= 'Harmony';
  h.reign = g.dynasty + 1;
  g.ruler = h;
  g.spouse = h.spouseId || null;
  g.heir = null;
  g.dynasty++;
  g.event = null;
  beginReign(g, prior, h);
  initializeWorld(g, projects);
  appendRecord(g, {
    kind: 'ascension',
    cause,
    people: [h.id, prior.id],
    text:
      h.name +
      ' takes the crown with their own history, abilities and loyalties.',
  });
  log(g, h.name + ' ascends. The realm enters reign ' + g.dynasty + '.');
}
function outsideNominee(g) {
  return (
    g.futurePeople?.[0] ||
    (g.preparedIdentities
      ? [...g.applicants, ...g.notables].find(
          (p) => p.alive && p.age >= 18 && !g.court.some((c) => c.id === p.id),
        )
      : null)
  );
}
export function eventOptions(g) {
  const e = g.event;
  if (!e) return [];
  if (e.action) {
    const d = getDecision(g, e.action.type, e.action.target, e.agent);
    return [
      ...(d?.options || []).map((o) => ({
        ...o,
        disabled:
          !!d?.blocked ||
          (['project', 'expedition'].includes(e.action.type) && !e.agent),
        reason:
          d?.blocked ||
          (!e.agent ? 'No one is currently available.' : o.reason),
      })),
      option(
        'decline',
        e.action.type === 'hire'
          ? 'Thank them, but offer no appointment'
          : e.action.type === 'expedition'
            ? 'Leave this journey without a royal contract'
            : 'Thank them, but refuse this commission',
        'The issue is closed without a treasury expense. They remember that their offer received no support.',
        0,
        { happiness: -2 },
      ),
    ];
  }
  if (e.type === 'audience' || e.type === 'followup' || e.type === 'personal')
    return [
      ...e.options,
      option(
        'postpone',
        'Record their testimony without a new promise',
        'Their voice enters the chronicle. No coin is spent; the unresolved need leaves disappointment.',
        0,
        { happiness: -3 },
        { commons: { grievance: 5 } },
      ),
    ];
  if (e.type === 'expedition')
    return e.success
      ? [
          option(
            'keep',
            'Entrust the relic to the realm',
            realmRelics(g)[e.item].effect,
            0,
          ),
          option(
            'return',
            'Honor its keepers and return it',
            'Trade treasure for knowledge and the trust of those whose history it belongs to.',
            0,
            { learning: 10, faith: 5 },
            { [e.faction]: { trust: 12, affection: 6 } },
          ),
          option(
            'sell',
            'Sell it to restore the treasury',
            'Gain coin, but its gift will never strengthen your realm.',
            0,
            { gold: 32 },
            { guild: { trust: 5 }, [e.faction]: { grievance: 8 } },
          ),
        ]
      : [
          option(
            'care',
            'Pay for healing and honor the fallen',
            'Help the company recover and preserve its loyalty.',
            10,
            { health: 2 },
          ),
          option(
            'learn',
            'Hold an honest inquiry into the failure',
            'Learn from the expedition without assigning blame.',
            4,
            { learning: 5 },
          ),
          option(
            'blame',
            'Refuse payment for a failed charge',
            'Save coin, sacrifice trust, and leave the company to heal alone.',
            0,
          ),
        ];
  if (e.type === 'succession')
    return [
      ...(e.rival && findPerson(g, e.rival)?.alive
        ? [
            option(
              'rival',
              'Recognize ' + findPerson(g, e.rival).name + ' instead',
              'Set aside the testament. The rival inherits their own life; the displaced heir remembers the rejection.',
              0,
              { legitimacy: -8, justice: -3 },
            ),
          ]
        : []),
      option(
        'concede',
        'Negotiate concessions',
        'Pay the houses to accept the heir. Royal authority begins with a compromise.',
        30,
      ),
      option(
        'enforce',
        'Enforce the testament',
        'The watch loses strength and public goodwill in securing the succession.',
        0,
      ),
      option(
        'council',
        'Ask the assembled court to ratify the heir',
        'A lawful hearing restores legitimacy at the cost of old privileges.',
        12,
      ),
    ];
  if (e.type === 'vacancy')
    return [
      ...activeCourt(g),
      ...[...g.children, ...(g.kin || [])].filter(
        (c) => c.alive && c.age >= 16 && c.status !== 'ruler',
      ),
    ]
      .map((c) =>
        option(
          c.id,
          `Choose ${c.name}`,
          `A new reign shaped by their life in your household.`,
          0,
        ),
      )
      .concat(
        !g.preparedIdentities || outsideNominee(g)
          ? [
              option(
                'council-nominee',
                'Accept the council’s outside nominee',
                'A respected civic speaker takes the crown. The household yields authority, avoiding a rulerless realm.',
                0,
              ),
            ]
          : [],
      );
  return [
    option(
      'aid',
      'Offer material support',
      'The treasury bears the burden; their people gain trust.',
      15,
      { happiness: 7 },
      { [e.faction]: { trust: 10 } },
    ),
    option(
      'mediate',
      'Bring both sides to the table',
      'A modest expense supports a patient compromise.',
      5,
      { justice: 3 },
      { [e.faction]: { trust: 5 } },
    ),
    option(
      'deny',
      'Prioritize the treasury',
      'Revenue is preserved while resentment grows.',
      0,
      { gold: 8, happiness: -5 },
      { [e.faction]: { grievance: 10 } },
    ),
  ];
}
export function resolveEvent(g, choice, agent) {
  const e = g.event;
  if (!e) return result(false, 'There is no audience awaiting an answer.');
  if (prepareAudience(g, e) === false) {
    nextAudience(g);
    return result(
      true,
      'The petition closes as its participants’ lives change.',
    );
  }
  const key = eventKey(e);
  if (key && g.resolvedEvents.includes(key)) {
    nextAudience(g);
    return result(
      true,
      'This chapter is already settled; its earlier consequences remain.',
    );
  }
  const previousAgent = e.agent;
  if (e.action && agent !== undefined) e.agent = agent;
  const o = eventOptions(g).find((o) => o.id === choice);
  if (!o || o.disabled || g.resources.gold < o.cost) {
    if (e.action) {
      if (previousAgent === undefined) delete e.agent;
      else e.agent = previousAgent;
    }
    return result(
      false,
      !o || o.disabled
        ? o?.reason || 'Choose a course offered by the audience.'
        : 'The treasury cannot support that answer.',
    );
  }
  const before = snapshot(g);
  if (e.action && choice !== 'decline') {
    const ruling = enact(g, e.action.type, e.action.target, choice, e.agent);
    if (!ruling.ok) {
      if (previousAgent === undefined) delete e.agent;
      else e.agent = previousAgent;
      return ruling;
    }
  } else {
    g.resources.gold -= o.cost;
    effects(g, o.effects);
    diplomaticEffects(g, o.relations);
  }
  if (key) {
    if (!g.seenEvents.includes(key)) g.seenEvents.push(key);
    g.resolvedEvents.push(key);
  }
  if (e.type === 'vacancy') {
    let h = household(g).find((c) => c.id === choice);
    if (choice === 'council-nominee') {
      const prepared = outsideNominee(g),
        fromReserve = g.futurePeople?.length > 0;
      if (fromReserve) g.futurePeople.shift();
      else if (prepared)
        g.notables = g.notables.filter((p) => p.id !== prepared.id);
      h = prepared
        ? {
            ...prepared,
            id: prepared.id,
            role: 'Councillor',
            status: 'serving',
          }
        : person(
            'nominee-' + g.dynasty,
            'Elen of Fordwatch',
            'Human',
            'Councillor',
            { stewardship: 60, martial: 35, diplomacy: 65, intrigue: 40 },
            28,
          );
      Object.assign(h, {
        house: h.house || 'Independent',
        faction: h.faction || 'commons',
        story:
          h.story ||
          'A civic speaker chosen by the council when the throne stood empty.',
        traits: h.traits || ['Measured', 'Civic-minded'],
        desire: 'To restore a steady hand to the realm.',
        origin: h.origin || realmSites(g)[0].name,
        memories: [],
      });
      g.court.push(h);
      effects(g, { legitimacy: -5, justice: 3 });
    }
    initializeWorld(g, projects);
    const entry = record(
      g,
      'succession',
      e.id,
      choice,
      'The council names ' + h.name + ' to carry the crown.',
      { before, speaker: h.id, site: 'capital', kind: 'decision' },
    );
    ascend(g, h, entry.id);
    return result(true, 'The council witnesses a new ascension.', entry.id);
  }
  if (e.type === 'succession') {
    const h =
      choice === 'rival'
        ? findPerson(g, e.rival)
        : household(g).find((c) => c.id === g.heir && c.alive);
    if (!h?.alive) return result(false, 'That claimant is no longer eligible.');
    if (choice === 'rival') {
      const rejected = findPerson(g, g.heir);
      if (rejected) {
        rejected.rejectedClaim = {
          reign: g.dynasty,
          turn: g.turn,
          source: null,
        };
        rejected.grievance = clamp(rejected.grievance + 20);
        remember(
          g,
          rejected,
          'The council set aside the testament naming them.',
        );
      }
    }
    if (choice === 'concede') {
      g.resources.legitimacy = clamp(g.resources.legitimacy - 10);
      g.factions.find((f) => f.id === 'nobles').grievance = 20;
    }
    if (choice === 'enforce') {
      effects(g, { military: -15, happiness: -12 });
    }
    if (choice === 'council') {
      effects(g, { legitimacy: 6, justice: 5 });
    }
    const entry = record(
      g,
      'succession',
      e.id,
      choice,
      h.name + ' receives the throne through ' + o.label.toLowerCase() + '.',
      { before, speaker: h.id, site: 'capital', kind: 'decision' },
    );
    if (choice === 'rival') {
      const displaced = findPerson(g, g.heir);
      if (displaced?.rejectedClaim) {
        displaced.rejectedClaim.source = entry.id;
        addFact(
          g,
          'displaced-claim',
          { people: [displaced.id, h.id], claimant: displaced.id },
          entry.id,
        );
      }
    }
    ascend(g, h, entry.id);
    return result(
      true,
      'The heir takes the throne. The terms of that ascension will be remembered.',
    );
  }
  if (e.type === 'expedition') {
    const p = g.parties.find((p) => p.id === e.party);
    if (
      e.success &&
      choice === 'keep' &&
      !g.treasures.some((t) => t.id === e.item)
    ) {
      g.treasures.push({ id: e.item, turn: g.turn, from: e.title });
    }
    p.loyalty = clamp(
      p.loyalty + (choice === 'care' ? 10 : choice === 'blame' ? -18 : 4),
    );
    if (choice === 'care') p.wounds = Math.max(0, p.wounds - 1);
  }
  const reserved = e.engine
    ? appendRecord(g, {
        kind: 'decision',
        people: [e.speaker],
        site: e.site,
        cause: e.origin || null,
        text: 'A ruling awaits its recorded outcome.',
      })
    : null;
  if (reserved) e.decisionOrigin = reserved.id;
  if (e.engine === 'emergent') resolveEmergent(g, e, choice);
  if (e.engine === 'consequence') settleConsequence(g, e, choice);
  const speaker = findPerson(g, e.speaker);
  if (speaker) {
    speaker.trust = clamp(
      speaker.trust +
        (['silence', 'protect', 'refuse', 'decline', 'postpone'].includes(
          choice,
        )
          ? -3
          : 3),
    );
    remember(
      g,
      speaker,
      `At “${e.title}”, you chose to ${o.label.toLowerCase()}.`,
    );
  }
  if (speaker && o.person) {
    for (const [key, value] of Object.entries(o.person))
      speaker[key] = clamp(speaker[key] + value);
  }
  if (e.followups?.[choice]) {
    const letter = structuredClone(e.followups[choice]);
    letter.due = g.turn + 2;
    if (reserveEvent(g, letter)) g.scheduled.push(letter);
  }
  if (e.type === 'audience' && followupReports[e.id]) {
    const report = followupReports[e.id];
    const letter = {
      due: g.turn + 2,
      id: e.id + '-followup',
      speaker: e.speaker,
      title: report.title,
      text:
        report.text +
        ' The chronicler records your earlier decision: “' +
        o.label +
        '.”',
      type: 'followup',
      options: [
        option(
          'continue',
          'Make the first promise a lasting practice',
          'Sustain the work with new support, rather than let the first gesture stand alone.',
          8,
          { [report.domain]: 4 },
          { [report.faction]: { trust: 5 } },
        ),
        option(
          'local',
          'Let local voices carry it forward',
          'Give recognition and practical freedom to those affected.',
          2,
          { justice: 2 },
          { [report.faction]: { respect: 4 } },
        ),
        option(
          'closed',
          'Treat the matter as settled',
          'No further expense, but unfinished expectations remain.',
          0,
          {},
          { [report.faction]: { grievance: 4 } },
        ),
      ],
    };
    if (reserveEvent(g, letter)) g.scheduled.push(letter);
  }
  const text = `${e.title}: ${o.label}. ${o.note}`;
  const entry = record(g, 'audience', e.id || e.title, choice, text, {
    before,
    speaker: e.speaker,
    site: e.site,
    cause: e.origin || null,
    kind: e.action ? 'audience-close' : 'decision',
    event: e.id || null,
    existing: reserved?.id,
    expected: { realm: o.effects, person: o.person, personId: e.speaker },
  });
  for (const letter of g.scheduled)
    if (letter.id === e.id + '-aftermath' || letter.id === e.id + '-followup')
      letter.origin = entry.id;
  nextAudience(g);
  return result(true, text);
}
function missionReturns(g) {
  for (const m of g.missions.filter((m) => m.returns <= g.turn)) {
    const task = realmExpeditions(g).find((t) => t.id === m.task),
      p = g.parties.find((p) => p.id === m.party);
    if (g.seenEvents.includes('expedition:' + task.id)) {
      p.status = 'available';
      continue;
    }
    const local =
      task.site === 'forest'
        ? 'elves'
        : task.site === 'mountains'
          ? 'bugbears'
          : task.site === 'ruins'
            ? 'commons'
            : 'goblins';
    const guide = g.factions.find((f) => f.id === local).trust >= 60 ? 8 : 0;
    const squad = (p.memberIds || [])
      .map((id) => findPerson(g, id))
      .filter((person) => person?.alive);
    const individualSkill = squad.length
      ? squad.reduce(
          (n, person) =>
            n +
            (person.skills.martial +
              person.skills.leadership +
              person.skills.scholarship) /
              3,
          0,
        ) / squad.length
      : p.skill;
    const chance =
      clamp(
        50 +
          (p.skill * 0.75 + individualSkill * 0.25 - task.difficulty) * 0.65 +
          p.loyalty / 10 +
          (p.caution - 50) / 10 +
          guide +
          (m.approach === 'careful'
            ? 18
            : m.approach === 'respectful'
              ? 12
              : -10),
        15,
        94,
      ) / 100;
    const success = random(g) < chance;
    p.status = 'available';
    p.skill = clamp(p.skill + 3);
    p.reputation = clamp(p.reputation + (success ? 7 : -5));
    p.wounds = success
      ? m.approach === 'bold' && random(g) < 0.3
        ? 1
        : 0
      : m.approach === 'bold'
        ? 3
        : 2;
    const returnRecord = appendRecord(g, {
      kind: 'expedition-return',
      cause: m.origin || null,
      people: squad.map((p) => p.id),
      site: task.site,
      text:
        p.name +
        ' return from ' +
        task.name +
        (success
          ? ' with a discovery.'
          : ' bearing injuries and an unfinished undertaking.'),
    });
    for (const member of squad) {
      member.awayUntil = g.turn;
      member.travelSite = null;
      practice(
        g,
        member,
        member.profession === 'Lore keeper' ? 'scholarship' : 'martial',
        2,
      );
      member.reputation = clamp(member.reputation + (success ? 4 : -2));
      member.wealth += success ? 3 : 0;
      if (p.wounds) {
        member.health = clamp(member.health - p.wounds * 4);
        member.injuries.push({
          kind: 'expedition wound',
          until: g.turn + p.wounds,
          status: 'healing',
          source: returnRecord.id,
        });
      }
    }
    if (!g.completed.includes(task.id)) g.completed.push(task.id);
    g.expeditionOutcomes[task.id] = success ? 'success' : 'failure';
    if (success) effects(g, { [task.domain]: 5 });
    const outcome = success
      ? `${p.leader} lays a cloth bundle on the table. ${realmRelics(g)[task.item].story} ${m.approach === 'respectful' ? 'The local keepers ask that you remember whose trust made this journey possible.' : 'The company waits to hear what you will do with what they found.'}`
      : `${p.leader} returns with fewer supplies and wounded companions. ${m.approach === 'bold' ? 'Haste carried them beyond their preparation.' : 'Even careful plans could not quiet the danger within.'} They ask whether the throne stands behind those it sends into darkness.`;
    queueUnique(g, {
      type: 'expedition',
      id: task.id,
      origin: returnRecord.id,
      title: task.name,
      text: outcome,
      success,
      item: task.item,
      party: p.id,
      speaker: p.leaderId,
      backdrop: 'shrine',
      faction: local,
      scene: realmSites(g).find((s) => s.id === task.site).scene,
    });
    log(
      g,
      `${p.name} returned from ${task.name}, ${success ? 'with a discovery that asks a new question' : 'carrying wounds and an unfinished story'}.`,
    );
  }
  g.missions = g.missions.filter((m) => m.returns > g.turn);
}
function advanceCore(g) {
  if (g.event) return false;
  for (const q of g.queue) {
    const p = realmProjects(g).find((p) => p.id === q.id),
      c = g.court.find((c) => c.id === q.who);
    if (!p || !c || !living(c)) continue;
    const assignmentBefore = snapshot(g);
    const forecast = professionalForecast(g, c, p, q.cost);
    const success = random(g) < forecast.chance;
    const impact = q.effects || p.effects;
    effects(
      g,
      Object.fromEntries(
        Object.entries(impact).map(([k, v]) => [
          k,
          Math.round(v * (success ? 1 : 0.35)),
        ]),
      ),
    );
    diplomaticEffects(
      g,
      success
        ? q.relations || { [p.faction]: { trust: 8 } }
        : { [p.faction]: { trust: 2 } },
    );
    c.experience += 10;

    c.respect = clamp(c.respect + (success ? 4 : -2));
    c.ambition = clamp(c.ambition + 2);
    const text = success
      ? `${c.name} returns from “${p.name}” with a sealed report and tired satisfaction. ${(g.world?.projectReports || projectReports)[p.id]?.[q.approach || 'balanced'] || 'The work has begun to change daily life.'}`
      : `${c.name} returns from “${p.name}” with muddy boots and an unfinished promise. Resistance and misjudgment slowed the work; some progress remains.`;
    const source = appendRecord(g, {
      kind: 'assignment',
      type: 'project-result',
      cause: q.decisionId || null,
      site: q.site || projectSite(g, q.id),
      people: [c.id],
      text,
      success,
      project: q.id,
      choice: q.approach,
    });
    assignmentDevelopment(g, c, p, success, forecast, source.id);
    commissionConsequences(g, q, success, source.id);
    source.effects = delta(assignmentBefore.resources, g.resources);
    source.transitions = transitionsBetween(assignmentBefore, g);
    source.assessment = {
      skill: forecast.skill,
      score: forecast.score,
      chance: forecast.chance,
      contributions: forecast.contributions,
    };
    source.changes = [
      { person: c.id, field: forecast.skill, change: c.performance[0].gain },
      ...Object.entries(delta(assignmentBefore.people[c.id], c))
        .filter(([k]) => ['wealth', 'respect', 'health'].includes(k))
        .map(([field, change]) => ({ person: c.id, field, change })),
    ];
    log(g, text);
    remember(
      g,
      c,
      success
        ? 'Their commission earned your court’s respect.'
        : 'An unfinished commission tested their confidence.',
    );
  }
  g.queue = [];
  g.turn++;
  g.season = (g.season + 1) % 4;
  if (!g.season) {
    g.year++;
    g.ruler.age++;
    g.court.forEach((c) => {
      if (c.alive && c.status !== 'ruler') c.age++;
    });
    g.children.forEach((c) => {
      if (
        c.status !== 'ruler' &&
        c.alive &&
        !g.court.some((p) => p.id === c.id)
      ) {
        c.age++;
        if (c.skills)
          for (const k of Object.keys(c.skills))
            c.skills[k] = clamp(c.skills[k] + (c.age < 18 ? 2 : 0));
      }
    });
    for (const relative of g.kin || [])
      if (
        relative.alive &&
        relative.status !== 'ruler' &&
        !g.court.some((p) => p.id === relative.id)
      ) {
        relative.age++;
        relative.health = clamp(
          relative.health -
            (relative.age > lifeExpectancy(relative) * 0.7 ? 3 : 0),
        );
        if (!relative.health) {
          relative.alive = false;
          relative.status = 'deceased';
          log(
            g,
            `${relative.name}, your ${relative.kinship.toLowerCase()}, has died. Their place in the household is remembered.`,
          );
        }
      }
  }
  const r = g.resources;
  applyEconomy(g);
  effects(g, {
    happiness:
      r.food === 0
        ? -12
        : g.policies.tax === 'heavy'
          ? -3
          : g.policies.tax === 'gentle'
            ? 1
            : -1,
    legitimacy: r.happiness > 65 ? 2 : -1,
    justice: g.policies.law === 'restorative' ? 1 : -2,
    security: g.policies.law === 'strict' ? 2 : 0,
    faith: g.policies.rites === 'traditional' ? 2 : 1,
    health: r.food === 0 ? -3 : r.health < 40 ? -1 : 0,
  });

  if (g.policies.rites === 'plural')
    diplomaticEffects(g, {
      goblins: { affection: 1 },
      gnolls: { affection: 1 },
      beastfolk: { affection: 1 },
    });
  if (g.policies.rites === 'traditional')
    diplomaticEffects(g, { nobles: { trust: 1 }, goblins: { grievance: 1 } });
  for (const t of g.treasures) {
    const relic = realmRelics(g)[t.id];
    effects(g, { [relic.resource]: relic.amount });
  }
  for (const p of g.parties) p.wounds = Math.max(0, p.wounds - 1);
  for (const c of activeCourt(g)) {
    c.health = clamp(
      c.health -
        (c.age > lifeExpectancy(c) * 0.75 ? 4 : 0) -
        (r.health < 25 ? 3 : 0),
    );
    const people = g.factions.find((f) => f.id === c.faction);
    const conviction =
      (c.traits?.includes('Principled') && r.justice < 35 ? -1 : 0) +
      (c.faction === 'elves' && r.ecology < 35 ? -1 : 0);
    c.loyalty = clamp(
      c.loyalty +
        (r.happiness > 60 ? 1 : -1) +
        (people?.grievance > 55 ? -1 : 0) +
        conviction,
    );
    c.grievance = clamp(
      c.grievance + (people?.grievance > 55 ? 1 : people?.trust > 65 ? -1 : 0),
    );
    if (
      c.health === 0 ||
      (c.age > lifeExpectancy(c) * 0.85 && random(g) < 0.015)
    ) {
      c.alive = false;
      c.status = 'deceased';
      log(
        g,
        `${c.name} has died. Their empty chair carries the memory of their service.`,
      );
    }
  }
  for (const b of g.bonds) {
    const a = g.court.find((c) => c.id === b.a),
      c = g.court.find((c) => c.id === b.b);
    if (a && c && living(a) && living(c)) {
      b.trust = clamp(b.trust + (a.loyalty + c.loyalty > 130 ? 2 : -2));
      b.rivalry = clamp(b.rivalry + (a.ambition + c.ambition > 100 ? 2 : -1));
      b.affection = clamp(b.affection + (b.trust > 60 ? 1 : 0));
    }
  }
  for (const b of g.diplomaticBonds) {
    const a = g.factions.find((f) => f.id === b.a),
      c = g.factions.find((f) => f.id === b.b);
    b.tension = clamp(b.tension + (a.alliance !== c.alliance ? 1 : -1));
    b.trust = clamp(b.trust + (a.trust > 60 && c.trust > 60 ? 1 : 0));
  }
  for (const h of g.families) {
    const f = g.factions.find((f) => f.id === h.faction);
    h.standing = clamp(
      h.standing + (f.trust > 60 ? 1 : f.grievance > 60 ? -1 : 0),
    );
    h.cohesion = clamp(h.cohesion + (h.fortune > 50 ? 1 : -1));
  }
  const spouse = findPerson(g, g.spouse)?.alive
    ? findPerson(g, g.spouse)
    : null;
  if (
    spouse &&
    g.ruler.age < lifeExpectancy(g.ruler) * 0.6 &&
    g.turn - (g.ruler.lastBirthTurn ?? -10) >= 4 &&
    random(g) < 0.18
  ) {
    const n = g.children.length + 1;
    const parent = [g.ruler, spouse][Math.floor(random(g) * 2)];
    if (parent) {
      const identityIndex = g.futurePeople?.findIndex(
        (c) =>
          c.race === parent.race &&
          (c.race !== 'Beastfolk' || c.species === parent.species),
      );
      const identity =
        identityIndex >= 0
          ? g.futurePeople.splice(identityIndex, 1)[0]
          : newPerson(g, {
              race: parent.race,
              species: parent.species,
              age: 0,
              role: 'Royal child',
              site: g.ruler.siteId || 'capital',
              parents: [g.ruler.id, spouse.id],
              house: g.ruler.house,
            });
      g.children.push({
        ...(identity || {}),
        id: identity?.id || 'child' + n,
        parentIds: [g.ruler.id, spouse.id],
        role: 'Royal child',
        name: identity?.name || 'Child ' + n,
        story: `Born to ${g.ruler.name} and ${spouse.name}; raised among the changing loyalties of the royal household.`,
        skills: { stewardship: 15, martial: 15, diplomacy: 15, intrigue: 15 },
        race: parent.race,
        ...(parent.race === 'Beastfolk'
          ? { species: parent.species || 'Fox' }
          : {}),
        age: 0,
        alive: true,
        health: 95,
        status: 'household',
      });
      log(
        g,
        `A child is born to ${g.ruler.name} and ${spouse.name}. The household gathers around a story not yet written.`,
      );
    }
  }
  g.ruler.health = clamp(
    g.ruler.health -
      (g.ruler.age > lifeExpectancy(g.ruler) * 0.7 ? 3 : 0) -
      (r.food === 0 ? 5 : 0) -
      (r.health < 25 ? 2 : 0),
  );
  if (
    g.ruler.health === 0 ||
    (g.ruler.age > lifeExpectancy(g.ruler) * 0.85 && random(g) < 0.04) ||
    (r.security < 25 && random(g) < 0.05)
  ) {
    log(
      g,
      `${g.ruler.name}'s reign ends in ${g.ruler.health === 0 ? 'illness' : r.security < 25 ? 'assassination' : 'old age'}. The realm turns toward the line of succession.`,
    );
    succession(
      g,
      g.ruler.health === 0
        ? 'illness'
        : r.security < 25
          ? 'assassination'
          : 'old age',
    );
    return true;
  }
  if (
    r.infrastructure >= 75 &&
    r.trade >= 65 &&
    r.legitimacy >= 65 &&
    r.population >= (g.scale === 'town' ? 1000 : 14000)
  ) {
    const newTitle = g.scale === 'town' ? 'City' : 'Kingdom';
    if (g.title !== newTitle) {
      g.title = newTitle;
      log(
        g,
        `The settlements acclaim ${g.name} as a ${newTitle.toLowerCase()}. Growth brings new expectations, as well as pride.`,
      );
    }
  }
  missionReturns(g);
  for (const letter of g.scheduled.filter((e) => e.due <= g.turn)) {
    if (!findPerson(g, letter.speaker)?.alive)
      letter.speaker = activeCourt(g)[0]?.id;
    if (
      !g.resolvedEvents.includes(eventKey(letter)) &&
      !g.pending.some((e) => eventKey(e) === eventKey(letter))
    )
      g.pending.push(letter);
  }
  g.scheduled = g.scheduled.filter((e) => e.due > g.turn);
  if (
    g.turn % 4 === 0 &&
    g.applicants.filter((a) => !g.court.some((c) => c.id === a.id)).length <
      2 &&
    true
  ) {
    const base = g.futurePeople?.length
        ? g.futurePeople.shift()
        : newPerson(g, {
            race: g.world.predominantRace,
            age: 22 + Math.floor(random(g) * 15),
            role: 'Petitioner',
            site: 'capital',
          }),
      id = 'petitioner-' + g.turn;
    g.applicants.push({
      ...structuredClone(base),
      id: base.id,
      name: base.name,
      age: 22 + Math.floor(random(g) * 15),
      story:
        'A new generation of ' +
        base.race.toLowerCase() +
        ' talent arrives from ' +
        base.origin +
        '. Raised on stories of your realm, this petitioner asks for an opportunity to turn inherited hopes into useful work.',
    });
    log(
      g,
      'A new petitioner arrives at the hall. The realm continues to find new voices.',
    );
  }
  if (g.storyDeck) bringForward(g, g.scale === 'province' ? 2 : 1);
  if (!g.storyDeck && g.turn % 2 === 0 && g.pending.length === 0) {
    const available = audienceStories.filter(
      (e) => !g.seenEvents.includes('audience:' + e.id),
    );
    const story = available[Math.floor(random(g) * available.length)];
    const speaker =
      story &&
      (g.court.find((c) => c.id === story.speaker && living(c)) ||
        activeCourt(g)[0]);
    if (speaker) {
      g.lastAudience[story.id] = g.turn;
      queueUnique(g, {
        ...structuredClone(story),
        type: 'audience',
        speaker: speaker.id,
        text:
          story.speaker === speaker.id
            ? story.text
            : `${speaker.name} brings a report from the villages. ${story.text.slice(story.text.indexOf('“'))}`,
      });
    }
  }
  if (!g.storyDeck && g.turn % 3 === 0 && g.pending.length === 0) {
    const c =
      activeCourt(g).find(
        (c) =>
          (c.loyalty < 45 || c.health < 50) &&
          !g.seenEvents.includes(
            'personal:' + (c.health < 50 ? 'care' : 'purpose'),
          ),
      ) ||
      activeCourt(g).find(
        (c) => c.ambition > 65 && !g.seenEvents.includes('personal:purpose'),
      );
    if (c) {
      const hurt = c.health < 50;
      queueUnique(g, {
        type: 'personal',
        id: hurt ? 'care' : 'purpose',
        speaker: c.id,
        title: hurt
          ? 'An empty chair at supper'
          : 'A voice that wants to be heard',
        text: hurt
          ? `${c.name} has struggled to keep pace with the court. A physician recommends rest. Their friends are watching whether the throne sees a person or merely an office.`
          : `${c.name} asks for an audience without witnesses. “I came here hoping to ${c.desire?.toLowerCase() || 'make a difference'} I do not know whether there is room for that hope at your table.”`,
        options: [
          {
            ...option(
              'support',
              hurt
                ? 'Fund a physician’s care'
                : 'Sponsor their independent work',
              'Personal support renews loyalty and confidence, at a real expense.',
              12,
            ),
            person: {
              health: hurt ? 15 : 0,
              loyalty: 10,
              trust: 7,
              grievance: -8,
            },
          },
          {
            ...option(
              'listen',
              'Ask what would make service meaningful',
              'A private conversation builds trust without meeting every ambition.',
              4,
            ),
            person: { trust: 6, loyalty: 4, affection: 5 },
          },
          {
            ...option(
              'duty',
              'Remind them of their oath',
              'They will continue in service, with less warmth toward the crown.',
              0,
            ),
            person: { loyalty: -8, grievance: 10, ambition: 4 },
          },
        ],
      });
    }
  }
  nextAudience(g);
  return true;
}
export function advance(g, prior = null) {
  if (g.event) return false;
  const wholeBefore = prior?.people ? prior : snapshot(g);
  const before = prior?.resources || prior || { ...g.resources },
    archiveStart = g.archive.length;
  const ok = advanceCore(g);
  if (ok) {
    initializeWorld(g, projects);
    tickPeople(g);
    tickCommunities(g);
    evolveRealm(g);
    governDistricts(g);
    tickObligations(g);
    tickTraining(g);
    tickInstitutions(g);
    tickPromises(g);
    tickAmbitions(g);
    for (const e of dueConsequences(g)) queueUnique(g, e);
    if (g.ruler.alive) {
      const emerging = generateEmergentEvent(g);
      if (emerging) queueUnique(g, emerging);
    }
    if (!g.event && g.ruler.alive) nextAudience(g);
    initializeWorld(g, projects);
    const report = finishSeasonReport(
      g,
      before,
      g.archive.slice(archiveStart).map((e) => e.id),
      wholeBefore,
    );
    const record = appendRecord(g, {
      kind: 'season',
      type: 'season',
      text: 'The realm enters ' + seasons[g.season] + ', Year ' + g.year + '.',
      effects: report.changes,
      transitions: report.transitions.filter((t) => t.scope === 'realm'),
    });
    report.entry = record.id;
  }
  return ok;
}
function migrateEventHistory(g) {
  const seen = new Set(g.seenEvents),
    resolved = new Set(g.resolvedEvents);
  const keyForRecord = (target) => {
    const story = audienceStories.find(
      (s) => s.id === target || s.title === target,
    );
    if (story) return 'audience:' + story.id;
    const report = Object.entries(followupReports).find(
      ([id, s]) => id + '-followup' === target || s.title === target,
    );
    if (report) return 'followup:' + report[0] + '-followup';
    if (target === 'An empty chair at supper' || target === 'care')
      return 'personal:care';
    if (target === 'A voice that wants to be heard' || target === 'purpose')
      return 'personal:purpose';
    const task = expeditions.find((t) => t.id === target || t.name === target);
    return task ? 'expedition:' + task.id : null;
  };
  for (const id of Object.keys(g.lastAudience)) seen.add('audience:' + id);
  for (const record of g.history) {
    if (record?.type !== 'audience') continue;
    const key = keyForRecord(record.target);
    if (key) {
      seen.add(key);
      resolved.add(key);
    }
  }
  // Older chronicles kept only a short history; surviving log entries are evidence too.
  for (const text of g.log) {
    const key = keyForRecord(text.split(':')[0]);
    if (key) {
      seen.add(key);
      resolved.add(key);
    }
  }
  const waiting = [g.event, ...g.pending, ...g.scheduled].filter(Boolean);
  for (const id of g.completed) {
    const key = 'expedition:' + id;
    seen.add(key);
    if (!waiting.some((e) => eventKey(e) === key)) resolved.add(key);
    g.expeditionOutcomes[id] ||= 'success';
  }
  const retained = new Set();
  const keep = (e) => {
    const key = eventKey(e);
    if (!key) return true;
    seen.add(key);
    if (e.type === 'expedition') {
      const task = expeditions.find((t) => 'expedition:' + t.id === key);
      if (task) {
        if (!g.completed.includes(task.id)) g.completed.push(task.id);
        g.expeditionOutcomes[task.id] = e.success ? 'success' : 'failure';
      }
    }
    if (resolved.has(key) || retained.has(key)) return false;
    retained.add(key);
    e.key = key;
    return true;
  };
  if (g.event && !keep(g.event)) g.event = null;
  g.pending = g.pending.filter(keep);
  g.scheduled = g.scheduled.filter(keep);
  for (const key of resolved) {
    if (key.startsWith('expedition:')) {
      const id = key.slice(11);
      if (expeditions.some((t) => t.id === id) && !g.completed.includes(id)) {
        g.completed.push(id);
        g.expeditionOutcomes[id] = 'failure';
      }
    }
  }
  g.seenEvents = [...seen];
  g.resolvedEvents = [...resolved];
  if (!g.event && g.pending.length && g.ruler.alive) nextAudience(g);
}
export function parseSave(text) {
  let g;
  try {
    g = readSave(text);
  } catch {
    throw Error('This file is not readable as a Lineage chronicle.');
  }
  if (
    !g ||
    ![1, 2, 3, 4, 5].includes(g.version) ||
    !g.resources ||
    !Array.isArray(g.court) ||
    !Array.isArray(g.factions) ||
    !g.ruler ||
    !Array.isArray(g.queue) ||
    !Array.isArray(g.children) ||
    !Array.isArray(g.bonds) ||
    !Array.isArray(g.log) ||
    !['town', 'province'].includes(g.scale) ||
    !Number.isInteger(g.turn) ||
    !Number.isInteger(g.season) ||
    g.season < 0 ||
    g.season > 3
  )
    throw Error('This is not a supported Lineage save.');
  const oldVersion = g.version;
  const legacy = g.version < 3;
  const keys = [
    'gold',
    'food',
    'population',
    'infrastructure',
    'happiness',
    'military',
    'trade',
    'security',
    'legitimacy',
  ];
  if (
    keys.some((k) => !Number.isFinite(g.resources[k])) ||
    g.court.some(
      (c) =>
        !c.id ||
        !c.skills ||
        !Number.isFinite(c.age) ||
        ['stewardship', 'martial', 'diplomacy', 'intrigue'].some(
          (k) => !Number.isFinite(c.skills[k]),
        ),
    ) ||
    [
      'commons',
      'guild',
      'guard',
      'nobles',
      'goblins',
      'gnolls',
      'elves',
      'bugbears',
    ].some((id) => !g.factions.some((f) => f.id === id))
  )
    throw Error('This chronicle is incomplete or damaged.');
  if (g.version === 1) {
    const defaults = createGame({ scale: g.scale, history: g.ruler.history });
    defaults.families = structuredClone(familyLore);
    defaults.parties = structuredClone(parties);
    defaults.applicants = structuredClone(candidates);
    for (const k of [
      'families',
      'parties',
      'missions',
      'completed',
      'treasures',
      'pending',
      'diplomaticBonds',
      'policies',
      'lastEdict',
      'history',
      'applicants',
      'scheduled',
      'lastAudience',
    ])
      g[k] = defaults[k];
    for (const k of ['health', 'learning', 'ecology', 'justice', 'faith'])
      g.resources[k] = defaults.resources[k];
    g.court = g.court.map((c) => ({
      ...person(
        c.id,
        c.name,
        c.race,
        c.role === 'Envoy' ? 'Ambassador' : c.role,
        c.skills,
        c.age,
      ),
      ...c,
      role: c.role === 'Envoy' ? 'Ambassador' : c.role,
      status: c.alive ? 'serving' : 'deceased',
      ...biographies[c.id],
      portrait: biographies[c.id]
        ? c.id
        : candidates.find((v) => v.race === c.race)?.portrait || 'liora',
      desire:
        biographies[c.id]?.desire ||
        'To find a lasting purpose in service to the realm.',
      faction: biographies[c.id]?.faction || 'commons',
      house: biographies[c.id]?.house || 'Independent',
      story:
        biographies[c.id]?.story ||
        'An experienced retainer whose earlier service helped shape this realm.',
      traits: biographies[c.id]?.traits || ['Experienced', 'Watchful'],
      memories: [],
      lastCultivated: -1,
    }));
    const sovereign =
      g.dynasty > 1 &&
      g.court.find((c) => c.name === g.ruler.name && c.race === g.ruler.race);
    if (sovereign) {
      sovereign.alive = true;
      sovereign.status = 'ruler';
    }
    g.version = 2;
    log(
      g,
      'The chronicler has opened new pages for the court, families, and places of your existing realm.',
    );
  }
  if (!g.applicants) g.applicants = structuredClone(candidates);
  if (!g.scheduled) g.scheduled = [];
  if (!g.lastAudience) g.lastAudience = {};
  if (legacy) {
    g.seenEvents = [];
    g.resolvedEvents = [];
    g.expeditionOutcomes = {};
    if (!g.factions.some((f) => f.id === 'beastfolk'))
      g.factions.push({
        id: 'beastfolk',
        name: 'The Manyfold Assembly',
        kind: 'Beastfolk communities',
        ...relationship(40),
        alliance: false,
      });
    for (const c of candidates.filter((c) => c.race === 'Beastfolk')) {
      if (
        Array.isArray(g.applicants) &&
        ![...g.applicants, ...g.court].some((p) => p.id === c.id)
      )
        g.applicants.push(structuredClone(c));
    }
  }
  if (
    !Array.isArray(g.families) ||
    !Array.isArray(g.parties) ||
    !Array.isArray(g.pending) ||
    !Array.isArray(g.missions) ||
    !Array.isArray(g.treasures) ||
    !Array.isArray(g.history) ||
    !g.policies ||
    !Array.isArray(g.diplomaticBonds) ||
    !Array.isArray(g.completed) ||
    !Array.isArray(g.seenEvents) ||
    !Array.isArray(g.resolvedEvents) ||
    !g.expeditionOutcomes ||
    typeof g.expeditionOutcomes !== 'object' ||
    Array.isArray(g.expeditionOutcomes) ||
    !Array.isArray(g.scheduled) ||
    typeof g.lastAudience !== 'object' ||
    Array.isArray(g.lastAudience) ||
    g.court.some((c) => !Array.isArray(c.memories) || !Array.isArray(c.traits))
  )
    throw Error('This chronicle is incomplete or damaged.');
  const idOK = (id) =>
    typeof id === 'string' &&
    /^[a-zA-Z0-9_-]{1,120}$/.test(id) &&
    !['__proto__', 'constructor', 'prototype'].includes(id);
  const finite = (n) => typeof n === 'number' && Number.isFinite(n);
  const str = (t) => typeof t === 'string';
  const speciesOK = (c) =>
    c.species === undefined ||
    (str(c.species) && c.species.trim().length > 0 && c.species.length <= 40);
  const metricKeys = [
    'trust',
    'respect',
    'affection',
    'fear',
    'trade',
    'grievance',
  ];
  const effectsOK = (object) =>
    !object ||
    (typeof object === 'object' &&
      !Array.isArray(object) &&
      Object.values(object).every(finite));
  const choicesOK = (options) =>
    Array.isArray(options) &&
    options.every(
      (o) =>
        idOK(o.id) &&
        str(o.label) &&
        str(o.note) &&
        finite(o.cost) &&
        o.cost >= 0 &&
        effectsOK(o.effects) &&
        (!o.relations || Object.values(o.relations).every(effectsOK)),
    );
  const generatedPersonOK = (c) =>
    c &&
    idOK(c.id) &&
    [c.name, c.race, c.role, c.status, c.story, c.appearance].every(str) &&
    speciesOK(c) &&
    finite(c.age) &&
    finite(c.health) &&
    c.skills &&
    ['stewardship', 'martial', 'diplomacy', 'intrigue'].every((k) =>
      finite(c.skills[k]),
    ) &&
    Array.isArray(c.traits) &&
    c.traits.every(str) &&
    Array.isArray(c.memories) &&
    c.memories.every(str);
  if (g.world !== undefined) {
    const w = g.world;
    if (
      !w ||
      !Array.isArray(w.sites) ||
      w.sites.length < 6 ||
      w.sites.length > 16 ||
      !sites.every((base) => w.sites.some((s) => s.id === base.id)) ||
      w.sites.some(
        (s) =>
          ![
            s.name,
            s.kind,
            s.story,
            s.strength,
            s.risk,
            s.rumor,
            s.scene,
          ].every(str) || ![s.x, s.y].every(finite),
      ) ||
      !w.factionLore ||
      g.factions.some(
        (f) =>
          !w.factionLore[f.id] ||
          ![
            'leader',
            'goal',
            'story',
            'custom',
            'strength',
            'weakness',
            'ties',
          ].every((k) => str(w.factionLore[f.id][k])),
      ) ||
      !Array.isArray(w.projects) ||
      !projects
        .filter((p) => !['school', 'mill', 'recruit'].includes(p.id))
        .every((base) => w.projects.some((p) => p.id === base.id)) ||
      w.projects.some((p) => ![p.name, p.desc, p.skill].every(str)) ||
      !Array.isArray(w.expeditions) ||
      w.expeditions.length !== 4 ||
      w.expeditions.some(
        (e) =>
          !expeditions.some((base) => base.id === e.id) ||
          !w.sites.some((s) => s.id === e.site) ||
          ![e.name, e.story, e.domain].every(str) ||
          !finite(e.difficulty),
      ) ||
      !w.relics ||
      !Object.keys(relics).every(
        (id) =>
          w.relics[id] &&
          ['name', 'story', 'effect'].every((k) => str(w.relics[id][k])),
      ) ||
      !w.projectReports ||
      Object.values(w.projectReports).some(
        (report) => !report || !Object.values(report).every(str),
      ) ||
      !str(w.river)
    )
      throw Error('This generated world is incomplete or damaged.');
  }
  if (
    oldVersion >= 4 &&
    (!Array.isArray(g.kin) ||
      !Array.isArray(g.notables) ||
      !Array.isArray(g.futurePeople) ||
      [...g.kin, ...g.notables, ...g.futurePeople].some(
        (c) => !generatedPersonOK(c),
      ) ||
      !g.tutorial ||
      !Number.isInteger(g.tutorial.step) ||
      g.tutorial.step < 0 ||
      g.tutorial.step > 5 ||
      typeof g.tutorial.complete !== 'boolean')
  )
    throw Error('This household is incomplete or damaged.');
  const actionOK = (a) =>
    !a ||
    (a.type === 'project'
      ? realmProjects(g).some((p) => p.id === a.target)
      : a.type === 'expedition'
        ? realmExpeditions(g).some((t) => t.id === a.target)
        : a.type === 'hire'
          ? g.applicants?.some((p) => p.id === a.target)
          : false);
  const eventOK = (e) =>
    !e ||
    ((e.id === undefined || idOK(e.id)) &&
      str(e.title) &&
      str(e.text) &&
      actionOK(e.action) &&
      (!e.followups ||
        Object.values(e.followups).every(
          (f) => f?.type === 'followup' && !f.followups && eventOK(f),
        )) &&
      [
        'petition',
        'audience',
        'followup',
        'personal',
        'expedition',
        'succession',
        'vacancy',
      ].includes(e.type) &&
      (!['audience', 'followup', 'personal'].includes(e.type) ||
        choicesOK(e.options)) &&
      (e.type !== 'expedition' ||
        (Object.hasOwn(realmRelics(g), e.item) &&
          g.parties.some((p) => p.id === e.party))));
  if (
    g.storyDeck !== undefined &&
    (!g.world ||
      !Array.isArray(g.storyDeck) ||
      !Number.isInteger(g.storyCursor) ||
      g.storyCursor < 0 ||
      g.storyCursor > g.storyDeck.length ||
      g.storyDeck.some((e) => !e || !eventOK(e)) ||
      new Set(g.storyDeck.map(eventKey)).size !== g.storyDeck.length)
  )
    throw Error('This campaign’s stories are incomplete or damaged.');
  const bad =
    !speciesOK(g.ruler) ||
    (g.ruler.id !== undefined && !idOK(g.ruler.id)) ||
    new Set(g.seenEvents).size !== g.seenEvents.length ||
    new Set(g.resolvedEvents).size !== g.resolvedEvents.length ||
    g.resolvedEvents.some((s) => !g.seenEvents.includes(s)) ||
    [...g.seenEvents, ...g.resolvedEvents].some(
      (s) =>
        !str(s) ||
        !/^(audience|followup|personal|expedition|petition|vacancy|succession):.+$/.test(
          s,
        ) ||
        s.length > 240,
    ) ||
    Object.entries(g.expeditionOutcomes).some(
      ([id, outcome]) =>
        !realmExpeditions(g).some((t) => t.id === id) ||
        !['success', 'failure'].includes(outcome),
    ) ||
    !g.factions.some((f) => f.id === 'beastfolk') ||
    ![
      g.name,
      g.title,
      g.ruler.name,
      g.ruler.race,
      g.ruler.values,
      g.ruler.history,
    ].every(str) ||
    ![g.year, g.turn, g.dynasty, g.rng, g.ruler.age, g.ruler.health].every(
      finite,
    ) ||
    g.log.some((s) => !str(s)) ||
    Object.values(g.resources).some((n) => !finite(n) || n < 0) ||
    g.court.some(
      (c) =>
        !idOK(c.id) ||
        !speciesOK(c) ||
        ![c.name, c.race, c.role, c.status].every(str) ||
        !['serving', 'departed', 'deceased', 'ruler'].includes(c.status) ||
        ![
          'health',
          'loyalty',
          'trust',
          'affection',
          'respect',
          'ambition',
          'grievance',
        ].every((k) => finite(c[k])) ||
        c.memories.some((s) => !str(s)) ||
        c.traits.some((s) => !str(s)),
    ) ||
    g.factions.some(
      (f) =>
        !idOK(f.id) ||
        ![f.name, f.kind].every(str) ||
        !metricKeys.every((k) => finite(f[k])),
    ) ||
    g.children.some(
      (c) =>
        !idOK(c.id) ||
        !str(c.name) ||
        !str(c.race) ||
        !speciesOK(c) ||
        !finite(c.age) ||
        !finite(c.health),
    ) ||
    g.bonds.some(
      (b) =>
        !g.court.some((c) => c.id === b.a) ||
        !g.court.some((c) => c.id === b.b) ||
        ![b.trust, b.affection, b.rivalry].every(finite),
    ) ||
    g.parties.some(
      (p) =>
        !parties.some((base) => base.id === p.id) ||
        ![p.name, p.leader, p.members, p.story].every(str) ||
        ![p.skill, p.caution, p.fee, p.loyalty, p.reputation, p.wounds].every(
          finite,
        ) ||
        !['available', 'away'].includes(p.status),
    ) ||
    g.families.some(
      (h) =>
        !familyLore.some((base) => base.id === h.id) ||
        ![
          h.name,
          h.motto,
          h.head,
          h.members,
          h.story,
          h.estate,
          h.desire,
          h.secret,
        ].every(str) ||
        ![h.power, h.cohesion, h.fortune, h.standing].every(finite),
    ) ||
    !['balanced', 'gentle', 'heavy'].includes(g.policies.tax) ||
    !['restorative', 'strict'].includes(g.policies.law) ||
    !['plural', 'traditional'].includes(g.policies.rites) ||
    g.queue.some(
      (q) =>
        !projects.some((p) => p.id === q.id) ||
        !g.court.some((c) => c.id === q.who) ||
        !effectsOK(q.effects),
    ) ||
    g.missions.some(
      (m) =>
        !realmExpeditions(g).some((t) => t.id === m.task) ||
        !g.parties.some((p) => p.id === m.party) ||
        !finite(m.returns),
    ) ||
    g.treasures.some((t) => !Object.hasOwn(realmRelics(g), t.id)) ||
    g.completed.some((id) => !realmExpeditions(g).some((t) => t.id === id)) ||
    !eventOK(g.event) ||
    g.pending.some((e) => !eventOK(e)) ||
    g.scheduled.some((e) => !eventOK(e) || !finite(e.due)) ||
    !Array.isArray(g.applicants) ||
    g.applicants.some(
      (c) =>
        !idOK(c.id) ||
        !str(c.name) ||
        !str(c.race) ||
        !speciesOK(c) ||
        !c.skills ||
        !Object.values(c.skills).every(finite),
    ) ||
    g.diplomaticBonds.some(
      (b) =>
        !g.factions.some((f) => f.id === b.a) ||
        !g.factions.some((f) => f.id === b.b) ||
        ![b.trust, b.tension].every(finite),
    );
  if (bad) throw Error('This chronicle is incomplete or damaged.');
  if (legacy) {
    migrateEventHistory(g);
    for (const c of [g.ruler, ...g.court, ...g.children, ...g.applicants])
      if (c.race === 'Beastfolk' && !c.species) c.species = 'Fox';
    log(
      g,
      'The chronicler has preserved your earlier stories as settled chapters and welcomed the Manyfold Assembly.',
    );
  }
  if (oldVersion < 4) {
    g.kin ||= [];
    g.notables ||= [];
    g.futurePeople ||= [];
    g.tutorial = { step: 5, complete: true };
    g.ruler.id ||= 'sovereign';
    g.ruler.gender ||= 'Nonbinary';
    g.ruler.disposition ||= 'Patient';
    g.ruler.appearance ||= 'The regalia inherited with the crown.';
    g.ruler.story ||= `${g.ruler.name} has already shaped the realm through the choices recorded in its chronicle.`;
  }
  if (oldVersion === 5 && !worldStateValid(g))
    throw Error('This living-world chronicle is incomplete or damaged.');
  initializeWorld(g, projects);
  if (!worldStateValid(g))
    throw Error('This chronicle contains inconsistent world records.');
  return g;
}
