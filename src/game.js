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
} from './data.js';
export { roles, candidates, factionLore, sites, expeditions, relics };
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
const living = (c) => c.alive && c.status !== 'departed' && c.status !== 'ruler';
export const activeCourt = (g) => g.court.filter(living);
export const random = (g) => {
  g.rng = (Math.imul(g.rng, 1664525) + 1013904223) >>> 0;
  return g.rng / 4294967296;
};
export function log(g, text) {
  g.log.unshift(text);
  g.log = g.log.slice(0, 100);
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
    version: 2,
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
    log: ['Your ascension begins a new chapter. The court awaits your first instructions.'],
    event: null,
    selected: 'capital',
    dynasty: 1,
    applicants: structuredClone(candidates),
    scheduled: [],
    lastAudience: {},
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
    ],
    policies: { tax: 'balanced', law: 'restorative', rites: 'plural' },
    lastEdict: -1,
    history: [],
  };
  if (o.values === 'Compassion') g.resources.health += 5;
  if (o.values === 'Prosperity') g.resources.trade += 5;
  if (o.values === 'Strength') g.resources.military += 5;
  if (o.values === 'Harmony') g.resources.justice += 5;
  return g;
}
export function qualitative(value, kind = 'trust') {
  const words = {
    trust: ['Deeply suspicious', 'Guarded', 'Cautiously receptive', 'Dependable', 'Wholehearted'],
    affection: ['Cold', 'Distant', 'Warm', 'Fond', 'Devoted'],
    grievance: ['At peace', 'Minor misgivings', 'Unresolved hurts', 'Bitter', 'Near revolt'],
    ambition: ['Content', 'Measured', 'Aspiring', 'Driven', 'Hungry for power'],
    health: ['In grave danger', 'Frail', 'Recovering', 'Well', 'Vigorous'],
    skill: ['Unpracticed', 'Learning', 'Capable', 'Accomplished', 'Exceptional'],
    rivalry: ['Companionable', 'Occasional friction', 'Competitive', 'Resentful', 'Open hostility'],
    happiness: ['Angry', 'Anxious', 'Unsettled', 'Hopeful', 'Joyful'],
    security: ['Exposed', 'Troubled', 'Watchful', 'Secure', 'Well protected'],
    legitimacy: ['Rejected', 'Contested', 'Conditional', 'Recognized', 'Unquestioned'],
    respect: ['Dismissive', 'Unconvinced', 'Courteous', 'Admiring', 'Reverent'],
    fear: ['Untroubled', 'Uneasy', 'Intimidated', 'Afraid', 'Terrified'],
    trade: ['Dormant', 'Occasional', 'Developing', 'Flourishing', 'Essential'],
    loyalty: ['Disaffected', 'Uncertain', 'Conditional', 'Faithful', 'Unshakable'],
    power: ['Marginal', 'Local', 'Established', 'Influential', 'Dominant'],
    fortune: ['In debt', 'Strained', 'Modest', 'Comfortable', 'Prosperous'],
    cohesion: ['Divided', 'Fractured', 'Negotiating', 'United', 'Unbreakable'],
  };
  return (words[kind] || words.trust)[Math.min(4, Math.floor(clamp(value) / 20))];
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
        { commons: { trust: 10 }, goblins: { affection: 6 }, nobles: { grievance: 4 } },
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
  return [base, ...opts[p.id]];
}
export function getDecision(g, type, target, agent) {
  let d = { type, target, agent, title: 'A decision before the throne', text: '', options: [] };
  const c = g.court.find((c) => c.id === target);
  const f = g.factions.find((f) => f.id === target);
  const p = projects.find((p) => p.id === target);
  if (type === 'project' && p) {
    d.title = p.name;
    d.text = p.desc;
    d.options = projectOptions(p);
    d.requiresAgent = true;
    d.skill = p.skill;
    d.blocked = g.event
      ? 'Hear the waiting audience before issuing a new commission.'
      : g.queue.length >= 3
        ? 'Your court has capacity for three commissions each season.'
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
      activeCourt(g).length >= 8
        ? 'There are eight places at your council. Release someone before recruiting.'
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
      : g.queue.some((q) => q.who === c.id)
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
        reason: 'The current officeholder must complete their commission first.',
      }));
    d.blocked = !living(c)
      ? 'Only serving court members may receive an office.'
      : c.lastAppointed === g.turn
        ? 'Let this appointment settle before transferring them again.'
        : g.queue.some((q) => q.who === c.id)
          ? 'Their present commission must conclude before a transfer.'
          : null;
  }
  if (type === 'cultivate' && c) {
    d.title = `An hour with ${c.name}`;
    d.text = c.voice || 'A quiet conversation may do what an official decree cannot.';
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
    d.text = factionLore[f.id].goal;
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
      option('balanced', 'Keep a measured levy', 'Steady income and no new burden.', 0),
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
    const task = expeditions.find((e) => e.id === target),
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
    d.blocked = g.completed.includes(target)
      ? 'The great question here has already been answered.'
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
    d.blocked = g.spouse
      ? 'You are already married.'
      : !living(c) || c.affection < 59 || c.trust < 65
        ? 'They need a closer, more trusting relationship before accepting marriage.'
        : null;
  }
  if (type === 'heir') {
    d.blocked = g.lastHeir === g.turn ? 'This season’s testament has already been recorded.' : null;
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
    d.blocked = g.event ? 'An audience awaits your answer before the season can close.' : null;
  }
  if (!g.ruler.alive)
    d.blocked = 'The throne is empty. Resolve the succession before issuing commands.';
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
function record(g, type, target, choice, text) {
  g.history.unshift({ turn: g.turn, type, target, choice, text });
  g.history = g.history.slice(0, 100);
  log(g, text);
}
const result = (ok, text) => ({ ok, text });
export function enact(g, type, target, choice, agent) {
  const d = getDecision(g, type, target, agent);
  if (!d) return result(false, 'That decision is no longer available.');
  const o = d.options.find((o) => o.id === choice);
  if (!o || o.disabled || d.blocked)
    return result(false, o?.reason || d.blocked || 'Choose one of the offered courses.');
  if (g.resources.gold < o.cost)
    return result(false, 'The treasury cannot yet support that promise.');
  let c = g.court.find((c) => c.id === target);
  if (type === 'project') {
    const a = g.court.find((c) => c.id === agent);
    if (!a || !living(a) || g.queue.some((q) => q.who === agent))
      return result(false, 'Choose a serving councillor with no commission this season.');
    g.resources.gold -= o.cost;
    g.queue.push({
      id: target,
      who: agent,
      approach: choice,
      effects: o.effects,
      relations: o.relations,
      cost: o.cost,
    });
    remember(g, a, `You entrusted them with “${d.title}”: ${o.label.toLowerCase()}.`);
    const text = `${a.name} bows over your seal. “${o.label}” is now their charge.`;
    record(g, type, target, choice, text);
    return result(true, text);
  }
  if (type === 'expedition') {
    const p = g.parties.find((p) => p.id === agent);
    if (!p || p.status !== 'available' || p.wounds > 0)
      return result(false, 'Choose a company that is rested and available.');
    g.resources.gold -= o.cost;
    p.status = 'away';
    g.missions.push({
      task: target,
      party: agent,
      approach: choice,
      returns: g.turn + (choice === 'bold' ? 1 : 2),
    });
    const text = `${p.name} leave with your instructions: ${o.label.toLowerCase()}.`;
    record(g, type, target, choice, text);
    return result(true, text);
  }
  if (type === 'heir' && choice !== 'none') {
    const h = [...g.court, ...g.children].find(
      (h) =>
        h.id === target &&
        h.alive &&
        h.age >= 16 &&
        h.status !== 'departed' &&
        h.status !== 'ruler',
    );
    if (!h) return result(false, 'Choose a living adult member of the household.');
  }
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
      secret: 'Their confidence must be earned before private matters are shared.',
      faith: 'The customs of their home hearth.',
      family: `Their kin in ${v.origin} follow this appointment closely.`,
      appearance: 'Travel-worn clothes, carefully mended for an audience with the crown.',
      memories: [],
      lastCultivated: -1,
      lastAppointed: -1,
      location: 'Alder Hall',
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
    c.location = c.origin;
    c.loyalty = clamp(c.loyalty + (choice === 'honor' ? 0 : choice === 'release' ? -15 : -35));
    c.grievance = clamp(c.grievance + (choice === 'honor' ? 0 : choice === 'release' ? 12 : 30));
    for (const b of g.bonds.filter((b) => b.a === c.id || b.b === c.id)) {
      const friend = g.court.find((p) => p.id === (b.a === c.id ? b.b : b.a));
      if (friend && b.affection > 45)
        friend.loyalty = clamp(
          friend.loyalty - (choice === 'disgrace' ? 10 : choice === 'release' ? 4 : 0),
        );
    }
    if (g.heir === c.id) g.heir = null;
    text = `${c.name} leaves the hall ${choice === 'honor' ? 'with honors and a promise of a pension' : choice === 'release' ? 'with a formal farewell' : 'under the eyes of a silent court'}. Their story continues beyond your household.`;
  }
  if (type === 'transfer') {
    const previous = activeCourt(g).find((p) => p.role === choice && p.id !== c.id);
    if (previous && choice !== 'Councillor') {
      previous.role = 'Councillor';
      previous.respect = clamp(previous.respect - 5);
      remember(g, previous, `${c.name} took their former office.`);
    }
    c.lastAppointed = g.turn;
    c.role = choice;
    c.location = choice === 'Ambassador' ? 'The border courts' : 'Alder Hall';
    c.respect = clamp(c.respect + 5);
    text = `${c.name} accepts the office of ${choice}. ${previous && choice !== 'Councillor' ? `${previous.name} remains as an unappointed councillor.` : ''}`;
  }
  if (type === 'cultivate') {
    c.lastCultivated = g.turn;
    if (choice === 'mentor') {
      const key = Object.keys(c.skills).sort((a, b) => c.skills[b] - c.skills[a])[0];
      c.skills[key] = clamp(c.skills[key] + 4);
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
      for (const b of g.diplomaticBonds.filter((b) => b.a === f.id || b.b === f.id)) {
        const other = g.factions.find((p) => p.id === (b.a === f.id ? b.b : b.a));
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
    h.fortune = clamp(h.fortune + (choice === 'patron' ? 10 : choice === 'charter' ? 6 : -3));
    h.power = clamp(h.power + (choice === 'charter' ? 8 : choice === 'service' ? -5 : 2));
    text = `${h.head} receives your answer. ${choice === 'patron' ? 'The estate will thrive, without an exception to the law.' : choice === 'charter' ? 'A new privilege binds their fortune to your rule.' : 'Service to the realm must come before favors from its ruler.'}`;
  }
  if (type === 'policy') {
    g.lastEdict = g.turn;
    if (['gentle', 'balanced', 'heavy'].includes(choice)) g.policies.tax = choice;
    if (['restore', 'strict'].includes(choice))
      g.policies.law = choice === 'restore' ? 'restorative' : 'strict';
    if (['plural', 'traditional'].includes(choice)) g.policies.rites = choice;
  }
  if (type === 'marry') {
    if (choice !== 'wait') {
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
        : `${[...g.court, ...g.children].find((c) => c.id === target).name} is named heir ${choice === 'public' ? 'before the court' : 'in the sealed testament'}.`;
  }
  remember(g, c, o.label + '.');
  record(g, type, target, choice, text);
  if (type === 'season') advance(g);
  return result(true, text);
}
// Compatibility entry points for existing campaigns and simulation tools.
export const delegate = (g, id, who) => enact(g, 'project', id, 'balanced', who).ok;
export const cultivate = (g, id, action) =>
  enact(g, 'cultivate', id, action === 'mentor' ? 'mentor' : 'listen').ok;
export const marry = (g, id) => enact(g, 'marry', id, 'private').ok;
export const relation = (g, id, action) => enact(g, 'diplomacy', id, action).ok;
export const recruit = (g) => {
  const c = g.applicants.find((c) => !g.court.some((p) => p.id === c.id));
  return c ? enact(g, 'hire', c.id, 'retainer').ok : false;
};
export function succession(g) {
  const h = [...g.court, ...g.children].find(
    (c) =>
      c.id === g.heir && c.alive && c.age >= 16 && c.status !== 'departed' && c.status !== 'ruler',
  );
  g.ruler.alive = false;
  if (!h) {
    g.event = {
      type: 'vacancy',
      title: 'An empty throne',
      text: 'No eligible heir was named. The council must choose a living adult successor.',
    };
    return;
  }
  if (g.resources.legitimacy < 50 || g.factions.find((f) => f.id === 'nobles').grievance > 55) {
    g.event = {
      type: 'succession',
      title: 'A disputed inheritance',
      text: `The old houses challenge ${h.name}. A lawful testament and a living loyalty are not always the same thing.`,
    };
  } else ascend(g, h);
}
export function ascend(g, h) {
  g.ruler = {
    name: h.name,
    race: h.race,
    age: h.age,
    health: h.health || 90,
    values: g.ruler.values,
    history: 'Succeeded',
    alive: true,
  };
  h.status = 'ruler';
  g.spouse = null;
  g.heir = null;
  g.dynasty++;
  g.event = null;
  log(g, `${h.name} ascends. The realm enters reign ${g.dynasty}.`);
}
export function eventOptions(g) {
  const e = g.event;
  if (!e) return [];
  if (e.type === 'audience' || e.type === 'followup' || e.type === 'personal')
    return [
      ...e.options,
      option(
        'postpone',
        'Acknowledge the petition, but defer action',
        'No coin is spent. The need remains, and disappointed households lose confidence.',
        0,
        { happiness: -3 },
        { commons: { grievance: 5 } },
      ),
    ];
  if (e.type === 'expedition')
    return e.success
      ? [
          option('keep', 'Entrust the relic to the realm', relics[e.item].effect, 0),
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
      ...g.children.filter((c) => c.alive && c.age >= 16 && c.status !== 'ruler'),
    ]
      .map((c) =>
        option(c.id, `Choose ${c.name}`, `A new reign shaped by their life in your household.`, 0),
      )
      .concat(
        option(
          'council-nominee',
          'Accept the council’s outside nominee',
          'A respected civic speaker takes the crown. The household yields authority, avoiding a rulerless realm.',
          0,
        ),
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
export function resolveEvent(g, choice) {
  const e = g.event;
  if (!e) return result(false, 'There is no audience awaiting an answer.');
  const o = eventOptions(g).find((o) => o.id === choice);
  if (!o) return result(false, 'Choose a course offered by the audience.');
  if (g.resources.gold < o.cost) return result(false, 'The treasury cannot support that answer.');
  g.resources.gold -= o.cost;
  effects(g, o.effects);
  diplomaticEffects(g, o.relations);
  if (e.type === 'vacancy') {
    let h = [...g.court, ...g.children].find((c) => c.id === choice);
    if (choice === 'council-nominee') {
      h = person(
        'nominee-' + g.dynasty,
        'Elen of Fordwatch',
        'Human',
        'Councillor',
        { stewardship: 60, martial: 35, diplomacy: 65, intrigue: 40 },
        28,
      );
      Object.assign(h, {
        house: 'Vale',
        faction: 'commons',
        story: 'A civic speaker chosen by the council when the throne stood empty.',
        traits: ['Measured', 'Civic-minded'],
        desire: 'To restore a steady hand to the realm.',
        origin: 'Fordwatch',
        memories: [],
      });
      g.court.push(h);
      effects(g, { legitimacy: -5, justice: 3 });
    }
    ascend(g, h);
    return result(true, 'The council witnesses a new ascension.');
  }
  if (e.type === 'succession') {
    const h = [...g.court, ...g.children].find((c) => c.id === g.heir && c.alive);
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
    ascend(g, h);
    return result(
      true,
      'The heir takes the throne. The terms of that ascension will be remembered.',
    );
  }
  if (e.type === 'expedition') {
    const p = g.parties.find((p) => p.id === e.party);
    if (e.success && choice === 'keep' && !g.treasures.some((t) => t.id === e.item)) {
      g.treasures.push({ id: e.item, turn: g.turn, from: e.title });
    }
    p.loyalty = clamp(p.loyalty + (choice === 'care' ? 10 : choice === 'blame' ? -18 : 4));
    if (choice === 'care') p.wounds = Math.max(0, p.wounds - 1);
  }
  const speaker = g.court.find((c) => c.id === e.speaker && living(c));
  if (speaker) {
    speaker.trust = clamp(speaker.trust + (choice === 'silence' || choice === 'protect' ? -3 : 3));
    remember(g, speaker, `At “${e.title}”, you chose to ${o.label.toLowerCase()}.`);
  }
  if (speaker && o.person) {
    for (const [key, value] of Object.entries(o.person)) speaker[key] = clamp(speaker[key] + value);
  }
  if (e.type === 'audience' && followupReports[e.id]) {
    const report = followupReports[e.id];
    g.scheduled.push({
      due: g.turn + 2,
      id: e.id + '-followup',
      speaker: e.speaker,
      title: report.title,
      text: report.text + ' The chronicler records your earlier decision: “' + o.label + '.”',
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
    });
  }
  const text = `${e.title}: ${o.label}. ${o.note}`;
  record(g, 'audience', e.id || e.title, choice, text);
  g.event = null;
  if (g.pending.length) g.event = g.pending.shift();
  return result(true, text);
}
function missionReturns(g) {
  for (const m of g.missions.filter((m) => m.returns <= g.turn)) {
    const task = expeditions.find((t) => t.id === m.task),
      p = g.parties.find((p) => p.id === m.party);
    const local =
      task.site === 'forest'
        ? 'elves'
        : task.site === 'mountains'
          ? 'bugbears'
          : task.site === 'ruins'
            ? 'commons'
            : 'goblins';
    const guide = g.factions.find((f) => f.id === local).trust >= 60 ? 8 : 0;
    const chance =
      clamp(
        50 +
          (p.skill - task.difficulty) * 0.65 +
          p.loyalty / 10 +
          (p.caution - 50) / 10 +
          guide +
          (m.approach === 'careful' ? 18 : m.approach === 'respectful' ? 12 : -10),
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
    if (success) {
      g.completed.push(task.id);
      effects(g, { [task.domain]: 5 });
    }
    const outcome = success
      ? `${p.leader} lays a cloth bundle on the table. ${relics[task.item].story} ${m.approach === 'respectful' ? 'The local keepers ask that you remember whose trust made this journey possible.' : 'The company waits to hear what you will do with what they found.'}`
      : `${p.leader} returns with fewer supplies and wounded companions. ${m.approach === 'bold' ? 'Haste carried them beyond their preparation.' : 'Even careful plans could not quiet the danger within.'} They ask whether the throne stands behind those it sends into darkness.`;
    g.pending.push({
      type: 'expedition',
      title: task.name,
      text: outcome,
      success,
      item: task.item,
      party: p.id,
      faction: local,
      scene: sites.find((s) => s.id === task.site).scene,
    });
    log(
      g,
      `${p.name} returned from ${task.name}, ${success ? 'with a discovery that asks a new question' : 'carrying wounds and an unfinished story'}.`,
    );
  }
  g.missions = g.missions.filter((m) => m.returns > g.turn);
}
export function advance(g) {
  if (g.event) return false;
  for (const q of g.queue) {
    const p = projects.find((p) => p.id === q.id),
      c = g.court.find((c) => c.id === q.who);
    if (!p || !c || !living(c)) continue;
    const rivalry =
      g.bonds.filter((b) => (b.a === c.id || b.b === c.id) && b.rivalry > 60).length * 0.025;
    const skill = c.skills[p.skill],
      office = roles[c.role]?.skill === p.skill ? 8 : 0;
    const success =
      random(g) <
      Math.min(
        0.96,
        0.3 +
          (skill + office) / 160 +
          c.loyalty / 500 -
          rivalry -
          g.factions.find((f) => f.id === p.faction).grievance / 900,
      );
    const impact = q.effects || p.effects;
    effects(
      g,
      Object.fromEntries(
        Object.entries(impact).map(([k, v]) => [k, Math.round(v * (success ? 1 : 0.35))]),
      ),
    );
    diplomaticEffects(
      g,
      success ? q.relations || { [p.faction]: { trust: 8 } } : { [p.faction]: { trust: 2 } },
    );
    c.experience += 10;
    c.skills[p.skill] = clamp(skill + 2);
    c.respect = clamp(c.respect + (success ? 4 : -2));
    c.ambition = clamp(c.ambition + 2);
    const text = success
      ? `${c.name} returns from “${p.name}” with a sealed report and tired satisfaction. ${projectReports[p.id][q.approach || 'balanced']}`
      : `${c.name} returns from “${p.name}” with muddy boots and an unfinished promise. Resistance and misjudgment slowed the work; some progress remains.`;
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
      if (c.status !== 'ruler') c.age++;
    });
  }
  const r = g.resources;
  const income =
    Math.round(8 + r.trade / 8 + r.infrastructure / 12) * (g.scale === 'province' ? 1.4 : 1);
  r.gold = Math.max(
    0,
    r.gold +
      Math.round(income) -
      activeCourt(g).length * 2 +
      (g.policies.tax === 'heavy' ? 9 : g.policies.tax === 'gentle' ? -5 : 0),
  );
  const harvest = g.season === 2 ? Math.round(25 + r.ecology / 6) : 0;
  r.food = Math.max(0, r.food - (g.scale === 'province' ? 18 : 10) + harvest);
  effects(g, {
    happiness:
      r.food === 0 ? -12 : g.policies.tax === 'heavy' ? -3 : g.policies.tax === 'gentle' ? 1 : -1,
    legitimacy: r.happiness > 65 ? 2 : -1,
    justice: g.policies.law === 'restorative' ? 1 : -2,
    security: g.policies.law === 'strict' ? 2 : 0,
    faith: g.policies.rites === 'traditional' ? 2 : 1,
    health: r.food === 0 ? -3 : r.health < 40 ? -1 : 0,
  });
  if (g.policies.law === 'restorative') r.gold = Math.max(0, r.gold - 2);
  if (g.policies.rites === 'plural')
    diplomaticEffects(g, { goblins: { affection: 1 }, gnolls: { affection: 1 } });
  if (g.policies.rites === 'traditional')
    diplomaticEffects(g, { nobles: { trust: 1 }, goblins: { grievance: 1 } });
  r.population = Math.max(
    100,
    Math.round(r.population * (r.happiness > 50 && r.health > 35 ? 1.012 : 0.995)),
  );
  for (const t of g.treasures) {
    const relic = relics[t.id];
    effects(g, { [relic.resource]: relic.amount });
  }
  for (const p of g.parties) p.wounds = Math.max(0, p.wounds - 1);
  for (const c of activeCourt(g)) {
    c.health = clamp(c.health - (c.age > 65 ? 4 : 0) - (r.health < 25 ? 3 : 0));
    const people = g.factions.find((f) => f.id === c.faction);
    const conviction =
      (c.traits?.includes('Principled') && r.justice < 35 ? -1 : 0) +
      (c.faction === 'elves' && r.ecology < 35 ? -1 : 0);
    c.loyalty = clamp(
      c.loyalty + (r.happiness > 60 ? 1 : -1) + (people?.grievance > 55 ? -1 : 0) + conviction,
    );
    c.grievance = clamp(c.grievance + (people?.grievance > 55 ? 1 : people?.trust > 65 ? -1 : 0));
    if (c.health === 0 || (c.age > 55 && random(g) < 0.015)) {
      c.alive = false;
      c.status = 'deceased';
      log(g, `${c.name} has died. Their empty chair carries the memory of their service.`);
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
    h.standing = clamp(h.standing + (f.trust > 60 ? 1 : f.grievance > 60 ? -1 : 0));
    h.cohesion = clamp(h.cohesion + (h.fortune > 50 ? 1 : -1));
  }
  const spouse = g.court.find((c) => c.id === g.spouse && c.alive);
  if (spouse && g.ruler.age < 55 && random(g) < 0.18) {
    const n = g.children.length + 1;
    g.children.push({
      id: 'child' + n,
      name: 'Child ' + n,
      race: g.ruler.race,
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
  g.ruler.health = clamp(
    g.ruler.health - (g.ruler.age > 55 ? 3 : 0) - (r.food === 0 ? 5 : 0) - (r.health < 25 ? 2 : 0),
  );
  if (
    g.ruler.health === 0 ||
    (g.ruler.age > 65 && random(g) < 0.04) ||
    (r.security < 25 && random(g) < 0.05)
  ) {
    log(
      g,
      `${g.ruler.name}'s reign ends in ${g.ruler.health === 0 ? 'illness' : r.security < 25 ? 'assassination' : 'old age'}. The realm turns toward the line of succession.`,
    );
    succession(g);
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
    if (!activeCourt(g).some((c) => c.id === letter.speaker))
      letter.speaker = activeCourt(g)[0]?.id;
    g.pending.push(letter);
  }
  g.scheduled = g.scheduled.filter((e) => e.due > g.turn);
  if (
    g.turn % 4 === 0 &&
    g.applicants.filter((a) => !g.court.some((c) => c.id === a.id)).length < 2
  ) {
    const base = candidates[Math.floor(random(g) * candidates.length)],
      id = 'petitioner-' + g.turn;
    g.applicants.push({
      ...structuredClone(base),
      id,
      name:
        ['Neris', 'Elen', 'Corin', 'Wren', 'Rook'][Math.floor(random(g) * 5)] + ' ' + base.house,
      age: 22 + Math.floor(random(g) * 15),
      story:
        'A new generation of ' +
        base.race.toLowerCase() +
        ' talent arrives from ' +
        base.origin +
        '. Raised on stories of your realm, this petitioner asks for an opportunity to turn inherited hopes into useful work.',
    });
    log(g, 'A new petitioner arrives at the hall. The realm continues to find new voices.');
  }
  if (g.turn % 2 === 0 && g.pending.length === 0) {
    const available = audienceStories.filter((e) => g.turn - (g.lastAudience[e.id] ?? -20) >= 8);
    const story = available[Math.floor(random(g) * available.length)];
    const speaker =
      story && (g.court.find((c) => c.id === story.speaker && living(c)) || activeCourt(g)[0]);
    if (speaker) {
      g.lastAudience[story.id] = g.turn;
      g.pending.push({
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
  if (g.turn % 3 === 0 && g.pending.length === 0) {
    const c =
      activeCourt(g).find((c) => c.loyalty < 45 || c.health < 50) ||
      activeCourt(g).find((c) => c.ambition > 65);
    if (c) {
      const hurt = c.health < 50;
      g.pending.push({
        type: 'personal',
        speaker: c.id,
        title: hurt ? 'An empty chair at supper' : 'A voice that wants to be heard',
        text: hurt
          ? `${c.name} has struggled to keep pace with the court. A physician recommends rest. Their friends are watching whether the throne sees a person or merely an office.`
          : `${c.name} asks for an audience without witnesses. “I came here hoping to ${c.desire?.toLowerCase() || 'make a difference'} I do not know whether there is room for that hope at your table.”`,
        options: [
          {
            ...option(
              'support',
              hurt ? 'Fund a physician’s care' : 'Sponsor their independent work',
              'Personal support renews loyalty and confidence, at a real expense.',
              12,
            ),
            person: { health: hurt ? 15 : 0, loyalty: 10, trust: 7, grievance: -8 },
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
  if (g.pending.length) g.event = g.pending.shift();
  return true;
}
export function parseSave(text) {
  let g;
  try {
    g = JSON.parse(text);
  } catch {
    throw Error('This file is not readable as a Lineage chronicle.');
  }
  if (
    !g ||
    ![1, 2].includes(g.version) ||
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
    ['commons', 'guild', 'guard', 'nobles', 'goblins', 'gnolls', 'elves', 'bugbears'].some(
      (id) => !g.factions.some((f) => f.id === id),
    )
  )
    throw Error('This chronicle is incomplete or damaged.');
  if (g.version === 1) {
    const defaults = createGame({ scale: g.scale, history: g.ruler.history });
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
      ...person(c.id, c.name, c.race, c.role === 'Envoy' ? 'Ambassador' : c.role, c.skills, c.age),
      ...c,
      role: c.role === 'Envoy' ? 'Ambassador' : c.role,
      status: c.alive ? 'serving' : 'deceased',
      ...biographies[c.id],
      portrait: biographies[c.id]
        ? c.id
        : candidates.find((v) => v.race === c.race)?.portrait || 'liora',
      desire: biographies[c.id]?.desire || 'To find a lasting purpose in service to the realm.',
      faction: biographies[c.id]?.faction || 'commons',
      house: biographies[c.id]?.house || 'Independent',
      story:
        biographies[c.id]?.story ||
        'An experienced retainer whose earlier service helped shape this realm.',
      traits: biographies[c.id]?.traits || ['Experienced', 'Watchful'],
      memories: [],
      lastCultivated: -1,
    }));
    g.version = 2;
    log(
      g,
      'The chronicler has opened new pages for the court, families, and places of your existing realm.',
    );
  }
  if (!g.applicants) g.applicants = structuredClone(candidates);
  if (!g.scheduled) g.scheduled = [];
  if (!g.lastAudience) g.lastAudience = {};
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
    g.court.some((c) => !Array.isArray(c.memories) || !Array.isArray(c.traits))
  )
    throw Error('This chronicle is incomplete or damaged.');
  const idOK = (id) => typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id);
  const finite = (n) => typeof n === 'number' && Number.isFinite(n);
  const str = (t) => typeof t === 'string';
  const metricKeys = ['trust', 'respect', 'affection', 'fear', 'trade', 'grievance'];
  const effectsOK = (object) =>
    !object ||
    (typeof object === 'object' && !Array.isArray(object) && Object.values(object).every(finite));
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
  const eventOK = (e) =>
    !e ||
    (str(e.title) &&
      str(e.text) &&
      [
        'petition',
        'audience',
        'followup',
        'personal',
        'expedition',
        'succession',
        'vacancy',
      ].includes(e.type) &&
      (!['audience', 'followup', 'personal'].includes(e.type) || choicesOK(e.options)) &&
      (e.type !== 'expedition' ||
        (Object.hasOwn(relics, e.item) && g.parties.some((p) => p.id === e.party))));
  const bad =
    ![g.name, g.title, g.ruler.name, g.ruler.race, g.ruler.values, g.ruler.history].every(str) ||
    ![g.year, g.turn, g.dynasty, g.rng, g.ruler.age, g.ruler.health].every(finite) ||
    g.log.some((s) => !str(s)) ||
    Object.values(g.resources).some((n) => !finite(n) || n < 0) ||
    g.court.some(
      (c) =>
        !idOK(c.id) ||
        ![c.name, c.race, c.role, c.status].every(str) ||
        !['serving', 'departed', 'deceased', 'ruler'].includes(c.status) ||
        !['health', 'loyalty', 'trust', 'affection', 'respect', 'ambition', 'grievance'].every(
          (k) => finite(c[k]),
        ) ||
        c.memories.some((s) => !str(s)) ||
        c.traits.some((s) => !str(s)),
    ) ||
    g.factions.some(
      (f) => !idOK(f.id) || ![f.name, f.kind].every(str) || !metricKeys.every((k) => finite(f[k])),
    ) ||
    g.children.some(
      (c) => !idOK(c.id) || !str(c.name) || !str(c.race) || !finite(c.age) || !finite(c.health),
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
        ![p.skill, p.caution, p.fee, p.loyalty, p.reputation, p.wounds].every(finite) ||
        !['available', 'away'].includes(p.status),
    ) ||
    g.families.some(
      (h) =>
        !familyLore.some((base) => base.id === h.id) ||
        ![h.name, h.motto, h.head, h.members, h.story, h.estate, h.desire, h.secret].every(str) ||
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
        !expeditions.some((t) => t.id === m.task) ||
        !g.parties.some((p) => p.id === m.party) ||
        !finite(m.returns),
    ) ||
    g.treasures.some((t) => !Object.hasOwn(relics, t.id)) ||
    g.completed.some((id) => !expeditions.some((t) => t.id === id)) ||
    !eventOK(g.event) ||
    g.pending.some((e) => !eventOK(e)) ||
    g.scheduled.some((e) => !eventOK(e) || !finite(e.due)) ||
    !Array.isArray(g.applicants) ||
    g.applicants.some(
      (c) =>
        !idOK(c.id) ||
        !str(c.name) ||
        !str(c.race) ||
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
  return g;
}
