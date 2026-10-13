import { attachDilemma } from './dilemmas.js?v=0.5.5';
import { issueChoices } from './decision-strategies.js?v=0.5.5';
import {
  races,
  sites as oldSites,
  expeditions as oldExpeditions,
  relics as oldRelics,
} from './data.js?v=0.5.5';

export const dispositions = [
  'Patient',
  'Bold',
  'Curious',
  'Stern',
  'Generous',
  'Pragmatic',
];
export const presentations = [
  'Ceremonial finery',
  'Practical traveling clothes',
  'Scholar’s robes',
  'Weathered armor',
];
export const animalHeritages = [
  'Fox',
  'Wolf',
  'Cat',
  'Owl',
  'Bear',
  'Rabbit',
  'Otter',
  'Lizard',
];
const firstNames = {
  Human: [
    'Adela',
    'Edric',
    'Isolde',
    'Oswin',
    'Maren',
    'Godric',
    'Sabine',
    'Avel',
    'Cecily',
    'Leofric',
    'Rosamund',
    'Tristan',
  ],
  Elf: [
    'Aelith',
    'Faelar',
    'Ilvara',
    'Lethen',
    'Sylwen',
    'Thalion',
    'Elaris',
    'Vaelis',
    'Naeryn',
    'Orith',
    'Serel',
    'Yllara',
  ],
  Dwarf: [
    'Brenna',
    'Dorin',
    'Hilda',
    'Torrek',
    'Berrin',
    'Gudra',
    'Orik',
    'Dagna',
    'Brokk',
    'Sigrun',
    'Thora',
    'Grun',
  ],
  Halfling: [
    'Pippa',
    'Merrin',
    'Lottie',
    'Tobin',
    'Prim',
    'Bramble',
    'Tansy',
    'Odo',
    'Rosie',
    'Willet',
    'Bess',
    'Perrin',
  ],
  Orc: [
    'Ursha',
    'Gorun',
    'Mazra',
    'Drog',
    'Vesha',
    'Korr',
    'Shagra',
    'Thruk',
    'Nagra',
    'Oth',
    'Barra',
    'Rugash',
  ],
  Goblin: [
    'Nix',
    'Tikka',
    'Brist',
    'Zek',
    'Rilla',
    'Kip',
    'Vrit',
    'Zira',
    'Snik',
    'Pesh',
    'Nettle',
    'Glim',
  ],
  Gnoll: [
    'Rasha',
    'Khar',
    'Sura',
    'Rask',
    'Nesh',
    'Yarra',
    'Hrek',
    'Kessa',
    'Varra',
    'Rukh',
    'Shira',
    'Zhar',
  ],
  Bugbear: [
    'Hesh',
    'Vurra',
    'Bosh',
    'Hanna',
    'Urro',
    'Vesh',
    'Morga',
    'Osh',
    'Hura',
    'Bren',
    'Wesh',
    'Korra',
  ],
  Fox: ['Fenna', 'Renn', 'Veya', 'Ari', 'Sif', 'Ryl', 'Neris', 'Vell'],
  Wolf: ['Fen', 'Harka', 'Wren', 'Ulf', 'Kiva', 'Rovan', 'Ylva', 'Var'],
  Cat: ['Nyra', 'Miri', 'Nima', 'Saren', 'Lysa', 'Tavi', 'Korin', 'Neri'],
  Owl: ['Ivo', 'Oryn', 'Taren', 'Ilya', 'Quill', 'Noora', 'Vel', 'Eris'],
  Bear: ['Borin', 'Ursa', 'Orsa', 'Bren', 'Halla', 'Grum', 'Vara', 'Aro'],
  Rabbit: [
    'Clover',
    'Briar',
    'Pip',
    'Hazel',
    'Mallow',
    'Lupin',
    'Harell',
    'Fern',
  ],
  Otter: ['Asha', 'Ripple', 'Reed', 'Nell', 'Waver', 'Sora', 'Eddy', 'Rill'],
  Lizard: [
    'Ssess',
    'Izzra',
    'Sareth',
    'Viss',
    'Zhara',
    'Thess',
    'Siska',
    'Essir',
  ],
};
const surnames = {
  Human: ['Wick', 'Harrow', 'Bell', 'Mere', 'Thorne', 'Dale', 'Rowe', 'Fenn'],
  Elf: [
    'Moonweave',
    'Dawnleaf',
    'Starbough',
    'Willowsong',
    'Mistvale',
    'Thistleglen',
    'Silversong',
    'Evenbranch',
  ],
  Dwarf: [
    'Ironvein',
    'Stonebraid',
    'Copperhelm',
    'Deepforge',
    'Goldmantle',
    'Oathstone',
    'Anvilborn',
    'Flintbeard',
  ],
  Halfling: [
    'Goodbarrel',
    'Teakettle',
    'Greenbottle',
    'Underhill',
    'Applebrook',
    'Cloverfoot',
    'Warmbread',
    'Hearthwick',
  ],
  Orc: [
    'Ashfist',
    'Stonevoice',
    'Brokenchain',
    'Emberward',
    'Oakshield',
    'Duskhammer',
    'Stormmark',
    'Greeniron',
  ],
  Goblin: [
    'Brassbutton',
    'Reedskip',
    'Mosswick',
    'Glassleaf',
    'Tinwhistle',
    'Quickstitch',
    'Lanternhook',
    'Pebblepot',
  ],
  Gnoll: [
    'Redmane',
    'Dunesong',
    'Dustwalker',
    'Wellkeeper',
    'Sunstripe',
    'Longtrail',
    'Raincaller',
    'Emberhide',
  ],
  Bugbear: [
    'Passwarden',
    'Stoneveil',
    'Hearthcarver',
    'Snowmantle',
    'Kindlewood',
    'Ridgekeeper',
    'Deepcoat',
    'Warmdoor',
  ],
  Fox: [
    'Russetbrook',
    'Vell',
    'Brushwood',
    'Embertail',
    'Copperstep',
    'Bramblecoat',
  ],
  Wolf: [
    'Greywood',
    'Moonridge',
    'Pineward',
    'Winterfell',
    'Stormfur',
    'Hearthhowl',
  ],
  Cat: [
    'Softstep',
    'Sunwhisker',
    'Goldpelt',
    'Velvetreed',
    'Dapplebrook',
    'Mossfoot',
  ],
  Owl: [
    'Nightquill',
    'Feathermere',
    'Duskwing',
    'Quietbough',
    'Starfeather',
    'Moonquill',
  ],
  Bear: [
    'Honeybough',
    'Brownoak',
    'Deepwinter',
    'Mossback',
    'Goldpaw',
    'Hillward',
  ],
  Rabbit: [
    'Quickburrow',
    'Meadowfoot',
    'Thistlehop',
    'Greenwarren',
    'Cloverhill',
    'Dewfur',
  ],
  Otter: [
    'Reedbank',
    'Riverwake',
    'Brookswimmer',
    'Brightwater',
    'Tidemere',
    'Silverstream',
  ],
  Lizard: [
    'Emberscale',
    'Sunstone',
    'Jadetail',
    'Glassridge',
    'Mosscrest',
    'Sandscale',
  ],
};
const occupations = [
  'a ferry keeper',
  'an orchard warden',
  'a traveling healer',
  'a charter clerk',
  'a village advocate',
  'a caravan quartermaster',
  'a stonemason',
  'an archive keeper',
  'a border scout',
  'a guild apprentice',
];
const traits = [
  'Principled',
  'Protective',
  'Inquisitive',
  'Meticulous',
  'Warm',
  'Reserved',
  'Ambitious',
  'Candid',
  'Merciful',
  'Restless',
  'Patient',
  'Inventive',
  'Charismatic',
  'Scholarly',
  'Magnetic Personality',
  'Inspiring Leader',
  'Greedy',
  'Cautious',
  'Ruthless',
  'Loyal',
  'Diplomatic',
  'Secretive',
  'Resourceful',
];
const pasts = [
  'won a hearing for tenants their own patron would not defend',
  'brought a scattered caravan home through a mountain storm',
  'exposed an account that hid hunger behind impressive profits',
  'reconciled two families whose quarrel had outlived its cause',
  'rebuilt a workshop after a fire and welcomed the apprentices who had nowhere to go',
  'refused an order that would have harmed an unarmed village',
  'translated a forgotten charter that changed an entire valley’s future',
  'kept a village infirmary open through the worst winter in memory',
];
const hopes = [
  'make public service a promise anyone can rely upon',
  'build a school open to every peaceful people',
  'protect villages that distant rulers forget',
  'leave behind honest courts and fair contracts',
  'win a lasting place for travelers and newcomers',
  'bring useful knowledge out of private archives',
  'make prosperity reach beyond the manor gates',
];
const fears = [
  'being valued for an office rather than as a person',
  'watching a good intention become someone else’s instrument of cruelty',
  'a winter in which the quietest households go unheard',
  'having their family used to purchase their obedience',
  'losing the freedom to disagree with the powerful',
];
const secrets = [
  'They quietly shelter a family whose former landlord is looking for them.',
  'An unpaid debt ties them to a neighboring house.',
  'They possess a letter that contradicts a respected noble’s account of a battle.',
  'They send part of every wage to someone they once failed to protect.',
  'Their first patron took credit for their finest work. They have kept the proof.',
];
const colorWords = [
  'Amber',
  'Willow',
  'Ash',
  'Rose',
  'Frost',
  'Ember',
  'Briar',
  'Oak',
  'Mist',
  'Thistle',
  'Moon',
  'Raven',
  'Copper',
  'Dawn',
  'Reed',
  'Iron',
];
const placeEndings = [
  'mere',
  'wick',
  'haven',
  'ford',
  'reach',
  'vale',
  'brook',
  'glen',
  'watch',
  'hollow',
  'fall',
  'stead',
];
const speciesPortrait = {
  Fox: 16,
  Wolf: 17,
  Cat: 18,
  Owl: 19,
  Bear: 20,
  Rabbit: 21,
  Otter: 22,
  Lizard: 23,
};
const racePortrait = {
  Human: 0,
  Elf: 2,
  Dwarf: 4,
  Halfling: 6,
  Orc: 8,
  Goblin: 10,
  Gnoll: 12,
  Bugbear: 14,
};
const factionFor = {
  Elf: 'elves',
  Goblin: 'goblins',
  Gnoll: 'gnolls',
  Bugbear: 'bugbears',
  Beastfolk: 'beastfolk',
  Dwarf: 'guard',
  Orc: 'guild',
  Human: 'commons',
  Halfling: 'commons',
};

export function freshSeed() {
  const a = new Uint32Array(1);
  globalThis.crypto.getRandomValues(a);
  return a[0];
}
function generator(seed) {
  let state = Number(seed) >>> 0;
  const used = new Set();
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const pick = (xs) => xs[Math.floor(random() * xs.length)];
  const n = (lo, hi) => lo + Math.floor(random() * (hi - lo + 1));
  const shuffle = (xs) => {
    const out = [...xs];
    for (let i = out.length - 1; i > 0; i--) {
      const j = n(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  const unique = (make) => {
    let value;
    for (let i = 0; i < 100; i++) {
      value = make();
      if (!used.has(value)) {
        used.add(value);
        return value;
      }
    }
    const base = value;
    do {
      value = base + ' of ' + pick(colorWords) + pick(placeEndings);
    } while (used.has(value));
    used.add(value);
    return value;
  };
  const place = () => unique(() => pick(colorWords) + pick(placeEndings));
  const person = (id, race, role = 'Councillor', extra = {}) => {
    const species =
      race === 'Beastfolk' ? extra.species || pick(animalHeritages) : undefined;
    const gender = extra.gender || pick(['Woman', 'Man', 'Nonbinary']);
    const culture = species || race;
    const house = extra.house || pick(surnames[culture]);
    const name = unique(() => pick(firstNames[culture]) + ' ' + house);
    const disposition = pick(dispositions),
      origin = extra.origin || place();
    const talent = {
      stewardship: n(30, 76),
      martial: n(25, 76),
      diplomacy: n(30, 76),
      intrigue: n(25, 76),
    };
    const primary = {
      Steward: 'stewardship',
      Marshal: 'martial',
      Ambassador: 'diplomacy',
      Spymaster: 'intrigue',
    }[role];
    if (primary) talent[primary] = n(66, 89);
    const occupation = pick(occupations),
      desire = 'To ' + pick(hopes) + '.';
    const chosenTraits = shuffle(traits).slice(0, 3);
    const appearance =
      race === 'Beastfolk'
        ? `${species.toLowerCase()} features, ${pick(['a carefully mended green coat', 'a blue traveling cloak', 'a brass clasp shaped like a leaf', 'a burgundy robe with worn cuffs'])}`
        : `${pick(['a weathered face', 'a thoughtful gaze', 'a quick, welcoming smile', 'an old scar across one brow'])}, ${pick(['a blue traveling cloak', 'plain green robes', 'a carefully mended court coat', 'a brass clasp shaped like a leaf'])}`;
    return {
      id,
      name,
      race,
      ...(species ? { species } : {}),
      gender,
      age: extra.age || n(24, 58),
      role,
      house,
      faction: extra.faction || factionFor[race],
      skills: talent,
      health: n(75, 96),
      loyalty: n(55, 78),
      trust: n(45, 69),
      affection: n(25, 47),
      respect: n(45, 68),
      ambition: n(25, 64),
      grievance: n(5, 20),
      experience: 0,
      alive: true,
      status: extra.status || 'serving',
      artset: 'campaign',
      portrait:
        'generated-' +
        (species
          ? speciesPortrait[species]
          : racePortrait[race] + (gender === 'Man' ? 0 : 1)),
      disposition,
      appearance,
      origin,
      traits: chosenTraits,
      desire,
      fear: pick(fears),
      secret: pick(secrets),
      faith: pick([
        'The Open Hearth; shelter is a duty before a privilege.',
        'The Green Covenant; a seed planted is a promise renewed.',
        'The Many Roads; every guest brings a lesson.',
        'The Quiet Vigil; care for the vulnerable is a form of devotion.',
        'The Unfinished Book; every certainty must leave room for another witness.',
      ]),
      family:
        'Their surviving kin keep a modest home near ' +
        origin +
        '. Letters and small gifts pass between them.',
      voice: pick([
        '“A promise is only useful when someone can live by it.”',
        '“Let us hear the smallest voice before we decide.”',
        '“Give me work worth remembering, and I will give you my best.”',
        '“The world beyond this hall will remember what we choose.”',
      ]),
      story: `Before coming to court, ${name} worked as ${occupation} in ${origin}. They ${pick(pasts)}. ${disposition.toLowerCase()} by habit and ${chosenTraits[0].toLowerCase()} in difficult company, they have arrived with their own hopes rather than an empty oath.`,
      memories: [],
      lastCultivated: -1,
      lastAppointed: -1,
      location: origin,
      ...extra,
      name,
      race,
      ...(species ? { species } : {}),
    };
  };
  return { random, pick, n, shuffle, place, person, state: () => state };
}

// Each incident archetype is used once in a campaign. A new title never recycles an old incident.
const incidents = [
  [
    'broken-sluice',
    'fields',
    'commons',
    'Steward',
    'market',
    'infrastructure',
    'The night the water rose',
    'A sluice failed while the night mill was turning. Two workshops are ankle-deep in river mud, and a tenant insists the estate ignored three written warnings.',
    'The miller has brought a warped door as evidence. It still bears the flood line.',
    'Repair the sluice and inspect the estate',
    'Ask both sides to fund a shared repair',
    'Leave maintenance to the landowner',
  ],
  [
    'false-weights',
    'border',
    'guild',
    'Ambassador',
    'market',
    'justice',
    'A measure that has grown smaller',
    'A trader has been shaving the grain measures used at the crossing. Honest merchants fear an inquiry will close their stalls along with the dishonest ones.',
    'A child has lined up three supposedly identical weights. None balance.',
    'Hold a public inspection with restitution',
    'Let the guild audit its own masters',
    'Protect the market from an inquiry',
  ],
  [
    'missing-scout',
    'mountains',
    'guard',
    'Marshal',
    'gate',
    'security',
    'A lantern missing on the ridge',
    'A young scout has missed the signal fires. Their last message mentioned a traveler carrying a sealed map. The watch wants to search; the family wants someone to tell them the truth.',
    'A captain lays the scout’s unlit lantern beside your seal.',
    'Send a prepared rescue patrol',
    'Pay local guides for a quiet search',
    'Keep the patrols at their posts',
  ],
  [
    'apprentice-oath',
    'capital',
    'guild',
    'Steward',
    'archive',
    'learning',
    'The apprentice who refused the oath',
    'A talented apprentice will not swear that a new waterwheel design belongs to their master. The master threatens to close the workshop rather than let the hearing proceed.',
    'The apprentice’s hands are still black with lamp soot.',
    'Protect the invention and fund instruction',
    'Negotiate shared credit and payment',
    'Uphold the master’s existing contract',
  ],
  [
    'burial-road',
    'forest',
    'elves',
    'Ambassador',
    'shrine',
    'ecology',
    'A road through remembered names',
    'Surveyors have found graves under the planned cart road. One village needs the road before winter; the keepers say the buried are owed more than a sign at the roadside.',
    'The envoy holds a handful of soil wrapped in linen.',
    'Reroute the road and preserve the graves',
    'Negotiate a protected crossing',
    'Permit the fastest route',
  ],
  [
    'clinic-fever',
    'fields',
    'commons',
    'Steward',
    'healer',
    'health',
    'Blue thread on the infirmary doors',
    'A fever has spread among flax workers. The healer suspects damp warehouses; their owner blames the workers’ household customs. Three families have already closed their doors.',
    'A bundle of blue door ribbons lies on the table.',
    'Fund care and inspect the warehouses',
    'Support a voluntary treatment ward',
    'Avoid alarming the market',
  ],
  [
    'river-charter',
    'border',
    'beastfolk',
    'Ambassador',
    'archive',
    'justice',
    'The charter with two signatures',
    'Two authentic-looking charters assign the same riverside homes to different owners. Beastfolk households have lived there for generations, but an old house now demands rent twice over.',
    'A petitioner smooths two brittle parchments with trembling fingers.',
    'Hear resident testimony and suspend the claim',
    'Broker a temporary lease',
    'Recognize the old house’s seal',
  ],
  [
    'refugee-caravan',
    'border',
    'gnolls',
    'Marshal',
    'gate',
    'happiness',
    'Bells on a broken caravan',
    'A caravan fleeing a shattered desert well asks to settle for the winter. One wagon carries medicine; another carries a debt claimed by a local moneylender.',
    'The ambassador’s travel bells have been wrapped in cloth to quiet them.',
    'Offer shelter and investigate the debt',
    'Arrange paid work and temporary lodging',
    'Require the caravan to move on',
  ],
  [
    'mountain-rescue',
    'mountains',
    'bugbears',
    'Marshal',
    'gate',
    'military',
    'The rescuers nobody invited',
    'Highland pass-keepers saved a noble hunting party. The nobles offer coin, but refuse the rescuers a seat at the celebratory supper. A small insult is becoming a border question.',
    'A carved rescue bead hangs from the speaker’s wrist.',
    'Honor the rescuers beside the noble guests',
    'Arrange a separate public reward',
    'Leave the guest list to the hosts',
  ],
  [
    'sealed-library',
    'capital',
    'nobles',
    'Spymaster',
    'archive',
    'learning',
    'A library under a second lock',
    'An estate librarian discovered a ledger of unpaid village wages. The heir has sealed the library, calling the pages private property. The librarian has brought the key and asks for protection.',
    'The key leaves a green mark on the desk.',
    'Protect the witness and open the ledger',
    'Negotiate repayment in private',
    'Return the key without a hearing',
  ],
  [
    'orchard-blight',
    'forest',
    'elves',
    'Steward',
    'shrine',
    'ecology',
    'Flowers that will not open',
    'An orchard has blossomed black along the new kiln road. A brewer offers a remedy whose ingredients are sacred to the woodland keepers. Neither side trusts the other’s account.',
    'A single black blossom rests in a glass cup.',
    'Commission a joint investigation',
    'Buy a limited remedy with the keepers’ consent',
    'Give the brewer unrestricted access',
  ],
  [
    'unpaid-watch',
    'capital',
    'guard',
    'Marshal',
    'hall',
    'security',
    'An oath written on an empty purse',
    'A quartermaster delayed a watch company’s pay to cover a private loan. The soldiers still patrol, but their families are borrowing food from neighbors.',
    'The captain brings pay slips folded into an old helmet.',
    'Restore pay and investigate the quartermaster',
    'Arrange a temporary guild loan',
    'Ask the soldiers to endure another season',
  ],
  [
    'shrine-duel',
    'ruins',
    'commons',
    'Ambassador',
    'shrine',
    'faith',
    'Two prayers at one threshold',
    'Two congregations want the same restored shrine for their holy night. Both cleaned the ruins; both claim an older promise. Their youngest members have been sharing bread outside.',
    'The petitioners arrive with two different lamps and the same kind of bread.',
    'Fund shared use with independent witnesses',
    'Divide the holy nights by agreement',
    'Give one congregation exclusive use',
  ],
  [
    'forged-letter',
    'capital',
    'nobles',
    'Spymaster',
    'archive',
    'legitimacy',
    'A letter in your handwriting',
    'A forged letter bearing your signature promises an office to a noble cousin. The cousin says they acted in good faith; a courier is missing, and two servants fear they will be blamed.',
    'Wax flakes fall from the letter as the speaker unfolds it.',
    'Protect the servants and trace the forgery',
    'Quietly repudiate the promise',
    'Punish the nearest messenger',
  ],
  [
    'winter-rent',
    'fields',
    'commons',
    'Steward',
    'market',
    'happiness',
    'The rent paid with a wedding ring',
    'A village rent collector accepted wedding rings instead of coin. The estate calls it generosity. The families call it the end of their last reserve.',
    'A small cloth pouch holds rings of brass, iron, and silver.',
    'Return the rings and review the arrears',
    'Negotiate repayment after harvest',
    'Enforce the collector’s bargain',
  ],
  [
    'beacon-song',
    'mountains',
    'bugbears',
    'Ambassador',
    'gate',
    'trade',
    'The warning nobody understood',
    'Two patrols mistook each other’s beacon songs for a threat and closed the pass. Traders wait with spoiling goods, while each commander insists their signal was clear.',
    'The mediator taps both rhythms against the arm of their chair.',
    'Fund common signal training',
    'Reopen one escorted route',
    'Maintain the closure until one side yields',
  ],
  [
    'water-rights',
    'border',
    'goblins',
    'Ambassador',
    'market',
    'trade',
    'The ferries tied to their posts',
    'Ferry crews stopped work after a new toll doubled the cost of reaching their own homes. A merchant guild wants soldiers to cut the ropes and take the boats.',
    'River mud dries on the petitioner’s bare boots.',
    'Suspend the toll and hear the crews',
    'Subsidize essential crossings',
    'Let the guild requisition the ferries',
  ],
  [
    'escaped-construct',
    'ruins',
    'guild',
    'Marshal',
    'shrine',
    'security',
    'Footprints made of brass',
    'A guild experiment has wandered out of its workshop. The brass guardian follows an obsolete order to protect a vanished lord’s orchard, now a crowded village.',
    'A dented brass footprint has been copied onto a sheet of paper.',
    'Send a specialist to rewrite its command',
    'Cordon the orchard and negotiate repairs',
    'Order the watch to break it apart',
  ],
  [
    'festival-mask',
    'capital',
    'beastfolk',
    'Ambassador',
    'hall',
    'justice',
    'A mask worn at the wrong table',
    'A festival performer used a mocking animal mask to imitate a Beastfolk speaker. Some call it harmless tradition; the speaker’s child has stopped attending lessons.',
    'A painted mask is placed face down before the throne.',
    'Require an apology and fund a shared festival',
    'Ask the performers and families to meet',
    'Defend the old performance unchanged',
  ],
  [
    'monastery-grain',
    'ruins',
    'commons',
    'Steward',
    'archive',
    'food',
    'Grain behind the monastery wall',
    'A ruined monastery’s granary is intact. Its last keeper’s testament names the hungry as beneficiaries, but a landed house claims the building and everything within it.',
    'A grain sample and a page of the testament arrive in the same box.',
    'Honor the testament and distribute the grain',
    'Buy access while a court reviews the claim',
    'Recognize the estate’s ownership',
  ],
  [
    'desert-medicine',
    'border',
    'gnolls',
    'Steward',
    'healer',
    'health',
    'Medicine with a foreign name',
    'Desert healers brought a remedy that local apothecaries refuse to stock without a guild fee. Patients are improving, but an untested batch has also caused concern.',
    'Two healers have exchanged notebooks but not yet their trust.',
    'Fund a joint clinical review',
    'Permit a supervised trial',
    'Reserve treatment to licensed guild members',
  ],
  [
    'runaway-page',
    'capital',
    'nobles',
    'Spymaster',
    'hall',
    'justice',
    'The page beneath the stair',
    'A young page fled a noble household after witnessing a beating. The house demands their return and insists the court has no authority over private discipline.',
    'The page keeps looking toward the door while the petition is read.',
    'Offer protection and hold a hearing',
    'Negotiate a protected placement elsewhere',
    'Return the page to the household',
  ],
  [
    'sacred-predator',
    'forest',
    'elves',
    'Marshal',
    'shrine',
    'ecology',
    'A hunter’s oath and a wounded beast',
    'A rare griffin attacked a shepherd after a trap wounded its wing. The shepherd wants the flock safe; a woodland keeper asks that the animal not pay for a poacher’s mistake.',
    'A broken trap sits beside a feather longer than your hand.',
    'Fund a rescue and safe grazing route',
    'Drive the griffin into an unoccupied valley',
    'Authorize a lethal hunt',
  ],
  [
    'guild-inheritance',
    'capital',
    'guild',
    'Ambassador',
    'archive',
    'trade',
    'The workshop without a successor',
    'A master artisan died without naming a successor. Apprentices kept the workshop running, but a distant cousin wants to sell its tools and dismiss them.',
    'The petition bears the thumbprints of every apprentice.',
    'Recognize an apprentice cooperative',
    'Broker a purchase in installments',
    'Honor the cousin’s property claim',
  ],
  [
    'smuggled-seed',
    'border',
    'goblins',
    'Spymaster',
    'market',
    'food',
    'Seed in a smuggler’s lining',
    'Customs officers found drought-resistant seed in a smuggler’s coat. It was stolen from an estate that refused to sell it to struggling villages. The grower demands the seed and the thief.',
    'One seed has already sprouted in the torn lining.',
    'Buy rights for village trials and hear the theft',
    'Return part of the seed in exchange for access',
    'Return the seed and prosecute the smuggler',
  ],
  [
    'family-feud',
    'fields',
    'nobles',
    'Ambassador',
    'hall',
    'happiness',
    'The wedding with two empty benches',
    'A marriage could end an old family feud, but both houses demand the other surrender the disputed meadow first. The couple asks whether the realm has room for a future beyond that quarrel.',
    'Two invitation ribbons lie knotted together.',
    'Fund a neutral hearing and protect the couple',
    'Lease the meadow for shared use',
    'Let the houses settle it themselves',
  ],
  [
    'lost-census',
    'fields',
    'beastfolk',
    'Steward',
    'archive',
    'legitimacy',
    'The village left off the roll',
    'A survey missed an entire mixed Beastfolk settlement. Residents pay taxes through a neighboring manor, yet have no recorded right to vote in local hearings.',
    'A hand-drawn map shows houses where the official page is blank.',
    'Recognize the settlement and correct the rolls',
    'Appoint a temporary village advocate',
    'Require residents to petition the manor',
  ],
  [
    'sleeping-ward',
    'ruins',
    'elves',
    'Spymaster',
    'shrine',
    'learning',
    'A ward that learned a new name',
    'An ancient temple’s defenses have awakened and now recognize a living courtier as their vanished keeper. The courtier wants to know why; the watch wants the doors sealed.',
    'A rune burns faintly on a ribbon brought from the temple.',
    'Sponsor a protected scholarly inquiry',
    'Observe the ward from outside',
    'Seal the site and suppress the rumor',
  ],
  [
    'tournament-debt',
    'capital',
    'guard',
    'Marshal',
    'hall',
    'military',
    'The champion’s borrowed armor',
    'A watch recruit won a tournament in armor secretly borrowed from a debt collector. The collector demands the recruit’s service as payment, just as the watch needs a new trainer.',
    'The helmet is polished; the contract inside it is not.',
    'Buy out the debt and review the contract',
    'Negotiate limited service with safeguards',
    'Uphold the collector’s terms',
  ],
  [
    'harvest-fire',
    'fields',
    'commons',
    'Steward',
    'market',
    'food',
    'Smoke where the harvest stood',
    'A fire destroyed the drying barn hours before rent was due. A landlord suspects a tenant; a child saw a lantern carried by someone in the estate’s colors.',
    'The speaker smells of smoke and has not slept.',
    'Provide relief and protect an open inquiry',
    'Support a joint rebuilding fund',
    'Let the estate judge the accusation',
  ],
  [
    'river-ghost',
    'border',
    'goblins',
    'Ambassador',
    'shrine',
    'faith',
    'A voice below the ferry',
    'A drowned ferryman’s ghost has begun warning passengers away from a bridge. The bridge keeper calls it sabotage, but the old stones have shifted since the last inspection.',
    'The petitioner brings a toll token wet with water nobody poured.',
    'Inspect the bridge and honor the dead',
    'Invite a spirit-keeper to mediate',
    'Forbid discussion of the haunting',
  ],
  [
    'exiled-ambassador',
    'border',
    'gnolls',
    'Ambassador',
    'gate',
    'legitimacy',
    'An ambassador without a banner',
    'A foreign council stripped an envoy of office after they refused to conceal a poisoned well. They ask for asylum; the council threatens to suspend trade if you offer it.',
    'The envoy has folded their old banner inside out.',
    'Offer asylum and publish the evidence',
    'Shelter the envoy while seeking mediation',
    'Return the envoy to their council',
  ],
  [
    'clockwork-tax',
    'capital',
    'guild',
    'Steward',
    'archive',
    'justice',
    'The clerk who trusts the machine',
    'A new counting device has charged widowed households a double levy. Its inventor insists the machine cannot err; a clerk has found that every disputed record uses the same old code.',
    'A stack of wrong receipts is tied with mourning ribbon.',
    'Refund the levy and audit the system',
    'Suspend the device for a limited review',
    'Accept the inventor’s account',
  ],
  [
    'night-school',
    'fields',
    'beastfolk',
    'Steward',
    'archive',
    'learning',
    'Lessons by the last candle',
    'Factory apprentices have begun a night school that the masters say encourages disobedience. Parents fear lost wages; the pupils have brought the first book they copied together.',
    'Wax has hardened along the edges of every page.',
    'Fund protected study time',
    'Arrange voluntary classes with guild support',
    'Close the lessons during working weeks',
  ],
  [
    'border-bell',
    'mountains',
    'bugbears',
    'Marshal',
    'gate',
    'security',
    'The bell cast from captured blades',
    'A highland lodge melted old weapons into a warning bell. A noble family claims one blade was an heirloom and demands the bell broken, though it has already saved three travelers.',
    'The speaker carries the bell-maker’s apron, still dusted with bronze.',
    'Recognize the public good and offer restitution',
    'Fund a replica heirloom for the claimant',
    'Order the bell dismantled',
  ],
  [
    'oath-illness',
    'capital',
    'guard',
    'Steward',
    'healer',
    'health',
    'The captain who will not sit down',
    'A veteran officer hides an illness to avoid losing command. Their deputies ask for help without humiliating them; ambitious rivals are already counting votes for the vacant chair.',
    'The physician waits until the officer leaves before speaking.',
    'Fund treatment and protect their leave',
    'Arrange a discreet temporary deputy',
    'Ask the officer to keep serving',
  ],
];

export function generateCampaign(seed, ruler, baseProjects = []) {
  const gen = generator(seed),
    { pick, n, shuffle, place, person } = gen;
  const realm = ruler.realm?.trim() || place();
  const predominantRace = races.includes(ruler.race) ? ruler.race : 'Human';
  const courtSpecies = shuffle(animalHeritages);
  const minorities = shuffle(races.filter((r) => r !== predominantRace));
  const realmRace = () =>
    gen.random() < (ruler.scale === 'province' ? 0.64 : 0.72)
      ? predominantRace
      : pick(minorities);
  const generatedSites = oldSites.map((s, i) => ({
    ...s,
    name:
      i === 0
        ? place() + ' Hall'
        : i === 5
          ? 'The ' + place() + ' Abbey'
          : place(),
    x: s.x + n(-12, 12),
    y: s.y + n(-10, 10),
  }));
  const at = (id) => generatedSites.find((s) => s.id === id);
  const occupationsBySite = [
    'royal petitions and the public archive',
    'grain, orchards, and millwork',
    'herbal lore, negotiated timber, and woodland scholarship',
    'ferry trade, glasswork, and caravan exchange',
    'ironwork, stonecraft, and mountain rescue',
    'forgotten medicine, sacred springs, and old charters',
  ];
  generatedSites.forEach((s, i) => {
    const founder = person('founder-' + i, pick(races), 'Founder', {
      status: 'deceased',
      alive: false,
    });
    s.founder = founder.name;
    s.story = `${s.name} grew around ${pick(['a travelers’ shelter', 'a meeting of ancient roads', 'an old pilgrimage route', 'a spring protected by local custom'])}. ${founder.name} first recorded its obligations in a charter still argued over today. ${pick(['Stone lintels carry names that no living family remembers.', 'The evening bells are answered by voices from the workshops.', 'Children learn the oldest paths from those who work them.'])} Its people depend on ${occupationsBySite[i]}, and will remember how the new crown treats their home.`;
    s.strength = 'The realm depends here on ' + occupationsBySite[i] + '.';
    s.risk = pick([
      'Old claims divide the families who share its prosperity.',
      'Weather and neglected repairs can undo a season’s work.',
      'Outsiders know its prices better than its customs.',
      'Private contracts often contradict the promises made in public.',
    ]);
    s.rumor = pick([
      `A sealed room beneath ${s.name} contains a charter with a royal name scratched away.`,
      `A traveler heard a bell beneath the stones at ${s.name}, though no bell hangs there.`,
      `Someone has been tending an abandoned shrine near ${s.name}. Fresh flowers appear before dawn.`,
      `An old map shows a path from ${s.name} to a place the local wardens refuse to name.`,
    ]);
  });
  const court = ['Steward', 'Marshal', 'Ambassador'].map((role, i) => {
    const race = i < 2 ? predominantRace : minorities[0];
    return person('court-' + i, race, role, {
      origin: generatedSites[i + 1].name,
      location: at('capital').name,
      ...(race === 'Beastfolk' ? { species: courtSpecies[i] } : {}),
    });
  });
  const applicants = Array.from({ length: 8 }, (_, i) => {
    const race =
      i < 5 ? predominantRace : minorities[(i - 5) % minorities.length];
    return person('candidate-' + i, race, 'Councillor', {
      status: 'applicant',
      origin: pick(generatedSites).name,
      ...(race === 'Beastfolk' ? { species: courtSpecies[i] } : {}),
    });
  });
  const futurePeople = Array.from({ length: 128 }, (_, i) =>
    person('arrival-' + i, realmRace(), 'Councillor', {
      status: 'applicant',
      origin: pick(generatedSites).name,
    }),
  );
  const player = person('sovereign', predominantRace, 'Sovereign', {
    ...(predominantRace === 'Beastfolk' &&
    animalHeritages.includes(ruler.species)
      ? { species: ruler.species }
      : {}),
    gender: ruler.gender || 'Nonbinary',
    age: Number(ruler.age) || 28,
    disposition: ruler.disposition || 'Patient',
    status: 'ruler',
    alive: true,
    origin: at('capital').name,
  });
  if (ruler.name?.trim()) player.name = ruler.name.trim();
  player.values = ruler.values || 'Compassion';
  player.history = ruler.history || 'Inherited';
  player.health = Math.max(65, 97 - Math.max(0, player.age - 45));
  player.presentation = ruler.presentation || presentations[0];
  player.appearance =
    ruler.appearance?.trim() ||
    `${player.appearance}; ${player.presentation.toLowerCase()}.`;
  player.story = `${player.name} comes to the throne ${player.age} years into a life shaped by ${player.origin}. ${player.disposition} in disposition and guided by ${player.values.toLowerCase()}, they prefer ${player.presentation.toLowerCase()} to the court’s expectations of grandeur. Their claim began through ${player.history.toLowerCase()}; their reign will now be judged by the people who live with its decisions.`;
  player.desire = 'To leave a realm whose future can survive its ruler.';
  const kin = shuffle(['Sister', 'Brother', 'Aunt', 'Uncle', 'Cousin'])
    .slice(0, n(2, 5))
    .map((kinship, i) =>
      person('kin-' + i, predominantRace, 'Royal kin', {
        status: 'household',
        kinship,
        relatedTo: player.name,
        gender: ['Sister', 'Aunt'].includes(kinship)
          ? 'Woman'
          : ['Brother', 'Uncle'].includes(kinship)
            ? 'Man'
            : pick(['Man', 'Woman', 'Nonbinary']),
        age: ['Aunt', 'Uncle'].includes(kinship)
          ? Math.min(96, player.age + n(10, 24))
          : Math.max(12, player.age + n(-10, 10)),
        house: player.house,
        origin: pick(generatedSites).name,
      }),
    );
  player.family =
    kin.map((k) => `${k.name}, your ${k.kinship.toLowerCase()}`).join('; ') +
    '. No parent survives to share your accession.';
  const factionSpecs = [
    ['commons', 'The hearths of ' + realm, 'The people', predominantRace],
    [
      'guild',
      'The ' + pick(colorWords) + ' Lantern Guild',
      'Merchants & artisans',
      predominantRace,
    ],
    [
      'guard',
      'The ' + at('capital').name.replace(' Hall', '') + ' Watch',
      'Soldiers',
      predominantRace,
    ],
    ['nobles', 'The houses of ' + realm, 'Landed families', predominantRace],
    ['goblins', at('border').name + ' Compact', 'Goblin neighbor', 'Goblin'],
    ['gnolls', place() + ' Caravan Clans', 'Gnoll confederation', 'Gnoll'],
    ['elves', 'The ' + at('forest').name + ' Court', 'Elven realm', 'Elf'],
    [
      'bugbears',
      at('mountains').name + ' Lodges',
      'Bugbear highlanders',
      'Bugbear',
    ],
    [
      'beastfolk',
      'The ' + place() + ' Assembly',
      'Beastfolk communities',
      'Beastfolk',
    ],
  ];
  const notables = [],
    lore = {};
  const goals = [
    'Safe homes, fair hearings, and relief when harvests fail.',
    'Honest trade, skilled apprenticeships, and dependable contracts.',
    'Clear duties, adequate supplies, and commanders worth following.',
    'Continuity, influence over succession, and protection of estates.',
    'Recognized river rights and welcome at foreign tables.',
    'Safe wells and room to keep the caravan laws.',
    'Protected groves and a deliberate pace of change.',
    'Open passes and respect for the people who keep them safe.',
    'Equal citizenship and room for every animal heritage to keep its customs.',
  ];
  const factions = factionSpecs.map(([id, name, kind, race], i) => {
    const leader = person(
      'speaker-' + id,
      race,
      i < 4
        ? [
            'Village speaker',
            'Guild representative',
            'Watch captain',
            'House ambassador',
          ][i]
        : 'Ambassador',
      { status: 'visitor', faction: id, origin: pick(generatedSites).name },
    );
    notables.push(leader);
    lore[id] = {
      leader: leader.name,
      leaderId: leader.id,
      goal: goals[i],
      story: `${name} is represented by ${leader.name}, whose reputation began in ${leader.origin}. Its households remember ${pick(['a hard winter when neighboring rulers shut their gates', 'a treaty honored only when it was convenient', 'a rebuilding paid for by people who received no credit', 'a generous welcome followed by years of uncertain rights'])}. ${goals[i]} Their hopes are shared, but their members disagree over what compromises are worth making.`,
      custom: pick([
        'An empty chair is left for the person who has not yet been heard.',
        'A bargain begins with the story of how each person reached the table.',
        'A promise is marked with a candle kept burning until its answer arrives.',
        'New members share bread with those who taught them their work.',
      ]),
      strength: pick([
        'Local knowledge, mutual aid, and a wide network of kin.',
        'Experienced negotiators and trade routes that cross disputed borders.',
        'Skilled artisans, patient teachers, and practical traditions.',
      ]),
      weakness: pick([
        'Private rivalries can undermine an agreed public position.',
        'A poor harvest leaves little reserve for another setback.',
        'Old contracts and fragmented settlements make cooperation difficult.',
      ]),
      ties: `They have long dealings with ${factionSpecs[(i + 1) % 9][1]} and follow the fortunes of ${at('border').name}.`,
    };
    return {
      id,
      name,
      kind,
      trust: n(i < 4 ? 48 : 32, i < 4 ? 62 : 52),
      respect: n(40, 62),
      affection: n(25, 48),
      fear: n(10, 30),
      trade: n(12, 35),
      grievance: n(8, 23),
      alliance: false,
    };
  });
  const families = ['dawn', 'vale', 'ashwood'].map((id, i) => {
    const members = Array.from({ length: 3 }, (_, j) =>
      person(
        'house-' + i + '-' + j,
        i === 2 ? 'Elf' : realmRace(),
        j ? 'Family retainer' : 'Head of family',
        {
          status: 'visitor',
          faction: i === 2 ? 'elves' : 'nobles',
          origin: generatedSites[i + 1].name,
        },
      ),
    );
    const house = members[0].house;
    members.forEach((p) => (p.house = house));
    notables.push(...members);
    return {
      id,
      name: 'House ' + house,
      crest: ['sun', 'stag', 'leaf'][i],
      motto: pick([
        'Let the light remember',
        'What grows is kept',
        'Rooted, yet reaching',
        'An oath outlives the hand',
      ]),
      faction: i === 2 ? 'elves' : i === 1 ? 'commons' : 'nobles',
      power: n(40, 76),
      cohesion: n(42, 78),
      fortune: n(35, 75),
      standing: n(45, 65),
      head: members[0].name,
      memberIds: members.map((p) => p.id),
      members: members
        .map((p) => p.name + ' — ' + p.role.toLowerCase())
        .join('; '),
      story: `House ${house} built its standing through ${pick(['financing a bridge when the treasury failed', 'keeping its granaries open during a siege', 'preserving local charters through a fire', 'turning a ruined mill into a prosperous workshop'])}. ${members[0].name} speaks for a family whose younger members have begun to question its old bargains. Their welcome to the new crown carries genuine hope and carefully guarded expectations.`,
      estate: generatedSites[i + 1].name + ' and the neighboring estates',
      desire: pick([
        'A protected place in the succession.',
        'Water rights secure enough to pass to the next generation.',
        'A public promise that progress will respect their ancestral holdings.',
      ]),
      secret: `${members[1].name} keeps an account of a private debt that the family’s public generosity conceals.`,
    };
  });
  const parties = ['lanterns', 'thorns', 'quills'].map((id, i) => {
    const companions = Array.from({ length: 3 }, (_, j) =>
      person(
        'company-' + i + '-' + j,
        realmRace(),
        ['Company captain', 'Scout', 'Lore keeper'][j],
        { status: 'visitor', origin: pick(generatedSites).name },
      ),
    );
    notables.push(...companions);
    return {
      id,
      name:
        'The ' +
        pick(colorWords) +
        ' ' +
        pick([
          'Lanterns',
          'Wayfarers',
          'Quills',
          'Wardens',
          'Seekers',
          'Oathbound',
        ]),
      portrait: companions[0].portrait,
      artset: 'campaign',
      leader: companions[0].name,
      leaderId: companions[0].id,
      memberIds: companions.map((p) => p.id),
      members: companions
        .map((p) => `${p.name}, ${p.species || p.race} ${p.role.toLowerCase()}`)
        .join('; '),
      story: `${companions[0].name} gathered this company after ${pick(['a rescue that brought strangers home together', 'a failed expedition that taught them the cost of haste', 'a caravan journey that became a lasting friendship'])}. They prize ${pick(['careful preparation', 'honest patronage', 'knowledge worth preserving', 'bringing every companion home'])} and keep their own account of every ruler who has hired them.`,
      skill: n(60, 85),
      caution: n(45, 85),
      fee: n(15, 25),
      loyalty: n(45, 65),
      reputation: n(45, 70),
      wounds: 0,
      status: 'available',
    };
  });
  const relics = structuredClone(oldRelics);
  for (const [id, r] of Object.entries(relics)) {
    r.name =
      'The ' +
      pick(colorWords) +
      ' ' +
      pick(['Covenant', 'Stone', 'Lantern', 'Seal', 'Chalice', 'Astrolabe']);
    r.story = `${r.name} was fashioned by ${pick(notables).name}’s forgotten predecessors. ${pick(['Its surface warms when someone speaks an honest promise.', 'A faint light gathers inside it whenever the nearby water is clean.', 'Its markings rearrange themselves toward the nearest lost path.'])} The people of ${pick(generatedSites).name} still tell stories about the obligations it once carried.`;
  }
  const expeditionProblems = shuffle([
    'a buried door has opened after a storm',
    'an old warning has begun to glow again',
    'a traveler vanished beside a long-silent shrine',
    'a winged beast has claimed a forgotten watchtower',
  ]);
  const expeditions = oldExpeditions.map((e, i) => ({
    ...e,
    name:
      pick([
        'The sealed door of ',
        'The lost watchers of ',
        'The oath beneath ',
        'The shadow above ',
      ]) + at(e.site).name,
    difficulty: n(55, 82),
    story: `At ${at(e.site).name}, ${expeditionProblems[i]}. ${at(e.site).rumor} The realm needs people who can ask difficult questions and return with more than a tale.`,
  }));
  const projects = baseProjects.map((p) => ({
    ...p,
    name: p.id === 'roads' ? 'The crossings of ' + at('fields').name : p.name,
    desc:
      p.id === 'embassy'
        ? `A delegation to ${factions.find((f) => f.id === 'goblins').name} can carry gifts, a contract, or a warning.`
        : p.desc,
  }));
  const reportDetails = {
    balanced:
      'Tools and wages reached the work crews. The result is practical, though households still want their smaller needs remembered.',
    villages:
      'The smallest bridges can carry carts again. Millers and orchard keepers recognize the repairs as a promise made to their own households.',
    commerce:
      'Merchants can cross more quickly and new toll collectors have arrived. Woodland families are counting the trees lost to the causeway.',
    shared:
      'Village stewards now hold the granary keys. Neighbors organize stores together, while some estate owners resent the new independence.',
    reserve:
      'The crown’s grain stands safely behind a royal seal. It will last into hardship, but families wonder whose petition will open the doors.',
    protect:
      'The patrols practice rescue and mediation beside their drills. People begin to call for the watch when help is needed, rather than turn away.',
    iron: 'The watch moves with impressive discipline. Its commanders are proud; families remember the first arrests as clearly as the first victories.',
    listen:
      'Gifts were opened in a room where every guest could speak. The compact’s people remember that your delegation listened before discussing prices.',
    terms:
      'Your merchants bring home favorable contracts. Their partners accepted the terms, but have begun speaking of the bargain as a debt of dignity.',
    open: 'Neighbors who had never shared a table broke bread together. The old houses are deciding whether that warmth diminished their own standing.',
    heritage:
      'The old banners were honored in the hall. Beyond the invitations, newcomers watched the celebration and wondered when they would belong.',
    public:
      'Witnesses spoke before an open court. The first findings reached ordinary households as well as the estates whose seals appeared in the evidence.',
    quiet:
      'Quiet inquiries made the hall safer. Those who know how the work was done now weigh loyalty against the fear that they might be watched next.',
  };
  const projectReports = Object.fromEntries(
    projects.map((p) => [
      p.id,
      Object.fromEntries(
        Object.entries(reportDetails).map(([approach, detail]) => [
          approach,
          `Word arrives from ${at(p.id === 'embassy' ? 'border' : p.id === 'inquiry' ? 'capital' : 'fields').name}. ${detail}`,
        ]),
      ),
    ]),
  );
  const world = {
    sites: generatedSites,
    factionLore: lore,
    expeditions,
    relics,
    projects,
    projectReports,
    river: place() + ' River',
    predominantRace,
  };
  const stories = shuffle(incidents).map((row, i) => {
    const [
      archetype,
      siteId,
      faction,
      office,
      backdrop,
      domain,
      title,
      problem,
      detail,
      act,
      compromise,
      decline,
    ] = row;
    const site = at(siteId);
    const visitor = person(
      'petitioner-' + archetype,
      factionSpecs.find((f) => f[0] === faction)[3],
      faction === 'commons'
        ? pick(['Petitioner', 'Village advocate', 'Household representative'])
        : faction === 'guild'
          ? 'Guild representative'
          : faction === 'guard'
            ? 'Watch captain'
            : faction === 'nobles'
              ? 'House representative'
              : 'Ambassador',
      { status: 'visitor', faction, origin: site.name },
    );
    notables.push(visitor);
    const adviser = court.find((c) => c.role === office) || court[0];
    const text = `${pick(['The chamberlain opens the doors while the morning candles are still burning.', 'A petition interrupts the quiet work of the seal room.', 'Rain taps the high windows as a visitor is shown inside.', 'The last court bell fades before the speaker takes a breath.'])} ${visitor.name}, ${visitor.role.toLowerCase()} for ${factions.find((f) => f.id === faction).name}, arrives from ${site.name}. You notice ${visitor.appearance}. ${detail}\n\n“${problem}”\n\n${adviser.name} waits beside your chair. ${pick(['The hall falls quiet. Outside, ordinary work continues as if the answer were already known.', 'The witnesses have carried their testimony a long way. They are asking what your protection means.', 'Both sides have sent witnesses. Neither believes the other will be heard fairly.'])}`;
    const options = issueChoices({ archetype }, [
      {
        id: 'support',
        label: act,
        note: 'Fund a public remedy. Those affected gain protection; established interests resent the scrutiny.',
        cost: n(10, 18),
        effects: { justice: 2, [domain]: 8 },
        relations: {
          nobles: { grievance: 3 },
          [faction]: { trust: 9, grievance: faction === 'nobles' ? -1 : -4 },
        },
      },
      {
        id: 'mediate',
        label: compromise,
        note: 'A negotiated settlement offers partial relief and preserves working relationships.',
        cost: n(3, 7),
        effects: { [domain]: 4 },
        relations: {
          guild: { respect: 2 },
          [faction]: {
            trust: 4,
            ...(faction === 'guild' ? { respect: 2 } : {}),
          },
        },
      },
      {
        id: 'refuse',
        label: decline,
        note: 'The treasury is spared. Unmet needs become a grievance that outlasts this audience.',
        cost: 0,
        effects: { [domain]: -4 },
        relations: { [faction]: { trust: -5, grievance: 9 } },
      },
    ]);
    const id = 'incident-' + archetype;
    const followups = Object.fromEntries(
      options.map((o, j) => [
        o.id,
        {
          id: id + '-aftermath',
          type: 'followup',
          title:
            ([
              'The promise carried home',
              'The bargain tested in public',
              'The cost of leaving it unanswered',
            ][j] || 'A different promise takes root') +
            ' · ' +
            site.name,
          speaker: visitor.id,
          adviser: adviser.id,
          backdrop,
          scene: site.scene,
          site: siteId,
          faction,
          archetype: archetype + '-aftermath',
          text: `A letter from ${visitor.name} arrives with ${j > 2 ? 'a copy of your sealed ruling' : pick(['a pressed local flower', 'a sketch of the work', 'a small knot of colored thread', 'the signatures of three households'])}. ${j > 2 ? 'The alternative you chose is changing local work and loyalties. ' + o.note : j === 0 ? 'The first remedy has begun to change daily life, but people now ask whether its protection will last.' : j === 1 ? 'The compromise gave both sides room to act. A few have honored it; others are testing its limits.' : 'The households who asked for help have made their own arrangements. Some found shelter, and some have become harder to reach.'}\n\nAt ${site.name}, your decision to “${o.label.toLowerCase()}” is already part of the local story. ${adviser.name} asks what should carry that story forward.`,
          options: [
            {
              id: 'continue',
              label: 'Support the people carrying it forward',
              note: 'A modest investment makes the earlier decision easier to live with.',
              cost: 6,
              effects: { [domain]: 3 },
              relations: { [faction]: { trust: 4 } },
            },
            {
              id: 'local',
              label: 'Give local voices responsibility and recognition',
              note: 'Recognition strengthens trust while leaving the work in local hands.',
              cost: 2,
              effects: { justice: 2 },
              relations: { [faction]: { respect: 4 } },
            },
            {
              id: 'closed',
              label: 'Let the settlement stand on its own',
              note: 'No further cost. Those involved will judge the promise by what remains.',
              cost: 0,
              effects: {},
              relations: { [faction]: { grievance: 2 } },
            },
          ],
        },
      ]),
    );
    return attachDilemma(
      {
        id,
        type: 'audience',
        title: title + ' · ' + site.name,
        archetype,
        site: siteId,
        speaker: visitor.id,
        adviser: adviser.id,
        faction,
        backdrop,
        scene: site.scene,
        text,
        options,
        followups,
      },
      notables,
      court,
    );
  });
  const requests = projects.map((p, i) => ({
    id: 'request-' + p.id,
    type: 'audience',
    archetype: 'commission-' + p.id,
    title: 'A plan for ' + p.name.toLowerCase(),
    speaker: court.find((c) => c.skills[p.skill] >= 65)?.id || court[0].id,
    scene: at('fields').scene,
    backdrop: i === 2 ? 'gate' : i === 5 ? 'archive' : 'hall',
    site: i === 3 ? 'border' : 'fields',
    text: `${court.find((c) => c.skills[p.skill] >= 65)?.name || court[0].name} spreads a working plan across your desk. ${p.desc}\n\n“Give us a direction, and name the person whose judgment you trust. The seal carries your authority; the work will carry their abilities.”`,
    action: { type: 'project', target: p.id },
    options: [],
  }));
  const hiring = applicants.slice(0, 3).map((p) => ({
    id: 'request-hire-' + p.id,
    type: 'audience',
    archetype: 'recruitment-' + p.id,
    title: 'A place at your table · ' + p.name,
    speaker: p.id,
    backdrop: 'hall',
    scene: 'hall',
    site: 'capital',
    text: `The chamberlain introduces ${p.name} from ${p.origin}. ${p.story}\n\n${p.voice} Their hope is ${p.desire.toLowerCase()} Your court can grow through talent, but every new chair brings obligations as well as gifts.`,
    action: { type: 'hire', target: p.id },
    options: [],
  }));
  const ventures = expeditions.map((e, i) => ({
    id: 'request-expedition-' + e.id,
    type: 'audience',
    archetype: 'contract-' + e.id,
    title: 'Beyond the safe road · ' + at(e.site).name,
    speaker: parties[i % 3].leaderId,
    backdrop: 'shrine',
    scene: at(e.site).scene,
    site: e.site,
    text: `${parties[i % 3].leader} requests a private audience. ${e.story}\n\n“A company can go where the watch should not be spent. Tell us whether this journey is about haste, careful knowledge, or the trust of the people who remember this place.”`,
    action: { type: 'expedition', target: e.id },
    options: [],
  }));
  // The first petition supports the tutorial; every other issue is shuffled before play begins.
  const storyDeck = [
    requests[0],
    ...shuffle([...stories, ...requests.slice(1), ...hiring, ...ventures]),
  ];
  return {
    seed: Number(seed) >>> 0,
    rng: gen.state(),
    name: realm,
    ruler: player,
    court,
    applicants,
    futurePeople,
    kin,
    notables,
    factions,
    families,
    parties,
    world,
    storyDeck,
    tutorial: { step: 0, complete: false },
    storyCursor: 0,
  };
}

export function generatePerson(
  seed,
  id,
  race,
  role = 'Councillor',
  extra = {},
) {
  return generator(seed).person(id, race, role, extra);
}
