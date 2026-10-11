export const roles = {
  Steward: {
    skill: 'stewardship',
    purpose: 'Keeps the granaries, roads, accounts, and difficult promises to the villages.',
  },
  Marshal: {
    skill: 'martial',
    purpose: 'Commands the watch and decides how strength is used beyond the walls.',
  },
  Ambassador: {
    skill: 'diplomacy',
    purpose: 'Carries your words to foreign hearths and listens for what treaties leave unsaid.',
  },
  Spymaster: {
    skill: 'intrigue',
    purpose:
      'Follows rumors, guards confidences, and uncovers threats before they reach the throne.',
  },
  Councillor: {
    skill: null,
    purpose: 'An unbound voice at your table, available for special commissions.',
  },
};
export const biographies = {
  mira: {
    house: 'Ashwood',
    faction: 'elves',
    origin: 'The lantern orchards of Silverwood',
    traits: ['Patient', 'Principled', 'Quietly stubborn'],
    desire: 'A realm where the youngest village is heard as clearly as the oldest house.',
    fear: 'That progress will become an excuse to fell the sacred groves.',
    secret: 'She once sheltered a goblin family against the wishes of her own kin.',
    voice: '“A bridge is a promise made of stone. Let us be certain we can keep it.”',
    story:
      'Mira left the Silverwood counting houses after a winter in which perfect accounts concealed starving villages. She carries a battered field notebook, knows the name of every miller along the river, and distrusts anyone who calls people an expense.',
    appearance:
      'Silver hair braided with a single green ribbon; ink on the fingers of her left hand.',
    faith: 'The Green Covenant; offerings of seed rather than coin.',
    family: 'Her younger brother tends the ancestral orchard. Their letters have grown infrequent.',
    memory: 'She remembers every promise made at your ascension.',
  },
  brann: {
    house: 'Stonehand',
    faction: 'guard',
    origin: 'The old shield halls beneath Stoneveil',
    traits: ['Protective', 'Blunt', 'Proud'],
    desire: 'To leave behind a watch that protects strangers as readily as kin.',
    fear: 'Losing another recruit to a ruler’s vanity.',
    secret: 'He still pays a pension to the family of a deserter he once condemned.',
    voice: '“Tell me who we are protecting. Then I will tell you what it will cost.”',
    story:
      'At the Battle of the Hollow Ford, Brann brought his broken company home instead of holding a doomed position. Nobles called him disobedient. The soldiers who survived call him captain. His ceremonial shield has a crack he refuses to repair.',
    appearance: 'A copper beard, an old scar above one eye, and an immaculate blue cloak.',
    faith: 'The Ancestor Forge; service is the prayer.',
    family: 'A widower. His daughter runs a stonecutting yard and will not speak of war.',
    memory: 'He judges your first orders more carefully than your first speech.',
  },
  sable: {
    house: 'Reed',
    faction: 'goblins',
    origin: 'The reed markets of the Briarroot Compact',
    traits: ['Observant', 'Witty', 'Restless'],
    desire: 'Recognition for goblin towns as partners, rather than convenient trading posts.',
    fear: 'Being welcomed at the table but never trusted with its decisions.',
    secret: 'An old smuggling contact now serves the Lantern Guild.',
    voice: '“An open gate is useful. An open mind is rarer.”',
    story:
      'Sable began as a translator for caravans whose drivers refused to learn each other’s names. A negotiated truce at Briarroot made their reputation; a joke at the wrong banquet nearly ended it. They collect foreign coins and stories of improbable friendships.',
    appearance:
      'Moss-green skin, bright amber eyes, and a russet scarf fastened with a brass leaf.',
    faith: 'The Many Roads; every guest carries a lesson.',
    family: 'Three cousins run rival ferry crossings. All insist Sable favors the others.',
    memory: 'They are still deciding whether your welcome is a courtesy or a conviction.',
  },
};
export const candidates = [
  {
    id: 'vesh',
    name: 'Vesh of Stoneveil',
    race: 'Bugbear',
    age: 36,
    portrait: 'vesh',
    house: 'Stoneveil',
    faction: 'bugbears',
    skills: { stewardship: 48, martial: 76, diplomacy: 44, intrigue: 38 },
    traits: ['Gentle', 'Fearless', 'Homesick'],
    story:
      'A towering pass-warden who rescues lost travelers before asking which banner they follow. Vesh wants the lowland court to understand that the mountain lodges are communities, not monsters.',
    desire: 'A recognized place for Stoneveil at your council.',
    fear: 'Being hired for strength and never asked for wisdom.',
    origin: 'The northern lodges',
    voice: '“The mountain has room for many footprints.”',
  },
  {
    id: 'liora',
    name: 'Liora Dawn',
    race: 'Human',
    age: 29,
    portrait: 'liora',
    house: 'Dawn',
    faction: 'nobles',
    skills: { stewardship: 62, martial: 25, diplomacy: 73, intrigue: 69 },
    traits: ['Cultured', 'Ambitious', 'Generous'],
    story:
      'A younger daughter of House Dawn, educated for a marriage she declined. Liora knows which invitations are threats and which silences are debts. She hopes to build a name that belongs to her alone.',
    desire: 'An office earned on merit rather than inherited.',
    fear: 'A life as somebody else’s bargaining piece.',
    origin: 'The eastern manor houses',
    voice: '“A favor is only a kindness when it comes without a chain.”',
  },
  {
    id: 'kesh',
    name: 'Kesh Redmane',
    race: 'Gnoll',
    age: 33,
    portrait: 'kesh',
    house: 'Redmane',
    faction: 'gnolls',
    skills: { stewardship: 34, martial: 70, diplomacy: 55, intrigue: 78 },
    traits: ['Curious', 'Loyal', 'Impatient'],
    story:
      'A pathfinder who has mapped wells the desert kings believed lost. Kesh laughs readily, sleeps lightly, and writes every fallen companion’s name on a strip of red cloth.',
    desire: 'Safe routes for the scattered Red Dune clans.',
    fear: 'That peace will mean surrendering the clan’s songs.',
    origin: 'The Red Dune caravan routes',
    voice: '“We can go around the danger. First we must admit it is there.”',
  },
  {
    id: 'orrin',
    name: 'Orrin Vale',
    race: 'Halfling',
    age: 41,
    portrait: 'orrin',
    house: 'Vale',
    faction: 'commons',
    skills: { stewardship: 81, martial: 20, diplomacy: 64, intrigue: 43 },
    traits: ['Practical', 'Warm', 'Skeptical'],
    story:
      'A miller elected three times to speak for the river villages. Orrin can hear an unhealthy millwheel from across a courtyard and a dishonest account from farther away.',
    desire: 'A winter without a family choosing between rent and bread.',
    fear: 'The villages becoming invisible as the realm grows.',
    origin: 'The Hearthfields mills',
    voice: '“Your Majesty, I have brought the figures. And the names behind them.”',
  },
  {
    id: 'tala',
    name: 'Tala Moss',
    race: 'Orc',
    age: 31,
    portrait: 'tala',
    house: 'Moss',
    faction: 'guild',
    skills: { stewardship: 58, martial: 61, diplomacy: 50, intrigue: 72 },
    traits: ['Inventive', 'Candid', 'Independent'],
    story:
      'A salvager and apothecary whose workshop smells of lavender and hot iron. Tala’s work saved a guildmaster’s son, but their refusal to sell the formula earned powerful enemies.',
    desire: 'A school where craft secrets become shared knowledge.',
    fear: 'That patronage will silence uncomfortable discoveries.',
    origin: 'The old foundry quarter',
    voice: '“Some things are broken because nobody was allowed to mend them.”',
  },
];
export const factionLore = {
  commons: {
    leader: 'Orrin Vale, speaker for the hearths',
    story:
      'Farmers, ferry keepers, goblin potters, and dwarf masons share a common stake: being able to live without dread of the next winter. Their loyalty grows from fair hearings and visible work, not grand proclamations.',
    custom: 'On market mornings an empty chair is left for a neighbor who needs help.',
    goal: 'Fair rents, full granaries, and a voice in your court.',
    strength: 'Deep local knowledge and an instinct for mutual aid.',
    weakness: 'They have little reserve when harvest or trade fails.',
    ties: 'The Lantern Guild buys their produce. House Dawn claims rent from their land.',
  },
  guild: {
    leader: 'Guildmistress Edra Flint',
    story:
      'The Lantern Guild began by funding lights along dangerous caravan roads. It now controls weights, warehouses, and apprenticeships. Its brightest members are generous; its oldest contracts are less so.',
    custom: 'A lantern is lit when a new apprentice takes their oath.',
    goal: 'Reliable roads, secure contracts, and access to foreign markets.',
    strength: 'Credit, artisans, and information from every caravan.',
    weakness: 'A few masters can choke the realm’s supply of tools.',
    ties: 'House Dawn holds guild debt. Sable knows more about its smugglers than they would like.',
  },
  guard: {
    leader: 'Brann Stonehand, captain of the sworn watch',
    story:
      'The watch is a patchwork of veterans and village recruits. Most joined to protect someone; some have forgotten whom. They look to their captain for an example and to the throne for a reason.',
    custom: 'A new recruit shares supper with the household they first guard.',
    goal: 'Clear duties, honest pay, and no needless sacrifice.',
    strength: 'Experience, solidarity, and knowledge of the roads.',
    weakness: 'Thin patrols and old loyalties to noble commanders.',
    ties: 'The common hearths house their families. Stoneveil trains their best scouts.',
  },
  nobles: {
    leader: 'Lady Yselle Dawn and Lord Halden Vale',
    story:
      'The old houses call themselves the memory of the realm. Their libraries are priceless, their rents less beloved. Some will welcome an able ruler; others hear every reform as an accusation.',
    custom: 'A new oath is recorded beside the names of seven generations.',
    goal: 'Continuity, influence over succession, and protection of estates.',
    strength: 'Land, learned retainers, and a web of marriage alliances.',
    weakness: 'Rivalries and dependence on labor they seldom acknowledge.',
    ties: 'Dawn finances the guild. Vale’s claim to the western ford is disputed.',
  },
  goblins: {
    leader: 'Speaker Nettle, elected by the ferry towns',
    story:
      'Briarroot’s goblin settlements rise on stilts above the marsh. Their glassmakers and ferrymen carry half the river’s trade. They remember every treaty that described them as guests on their own land.',
    custom: 'A bargain begins with tea and the story of how each party arrived.',
    goal: 'Recognition, river rights, and roads open to every people.',
    strength: 'River craft, marsh scouts, and ingenious glasswork.',
    weakness: 'Flooding and hostile toll collectors.',
    ties: 'Sable is a respected voice. Silverwood disputes access to sacred reedbeds.',
  },
  gnolls: {
    leader: 'Matriarch Sura Redmane',
    story:
      'The Red Dune clans travel between wells older than written borders. Their laws are recited in song; their hospitality is strict and generous. Raids by desperate bands have made neighbors forget this.',
    custom: 'A stranger is offered water before being asked their name.',
    goal: 'Safe wells, protection of caravan routes, and respect for clan law.',
    strength: 'Pathfinders, healers, and far-reaching caravan contacts.',
    weakness: 'Drought and divisions between wandering and settled clans.',
    ties: 'Kesh carries Sura’s regard. Stoneveil trades iron for desert medicines.',
  },
  elves: {
    leader: 'Warden Ilyan Ashwood',
    story:
      'The Silverwood Court governs by patient debate beneath living branches. Patience can become compassion or indifference. Its wardens fear that your roads will bring axes, and hope they will also bring understanding.',
    custom: 'Promises are marked by planting paired trees.',
    goal: 'Protection of ancient groves and a deliberate pace of change.',
    strength: 'Herbal lore, skilled archers, and long institutional memory.',
    weakness: 'Isolation and a reluctance to admit yesterday’s mistakes.',
    ties: 'Mira has strained family ties here. Briarroot seeks shared use of the river.',
  },
  bugbears: {
    leader: 'Keeper Hesh of the Stoneveil Lodge',
    story:
      'The Stoneveil lodges shelter pass-keepers, carvers, and shepherds. Their formidable size has made them the subject of lowland stories. Their own stories are about bringing travelers home.',
    custom: 'Each rescued traveler adds a carved bead to the lodge doorway.',
    goal: 'Open passes, fair exchange, and an end to lowland prejudice.',
    strength: 'Mountain rescue, stonecraft, and formidable defensive fighters.',
    weakness: 'Harsh winters and few fertile acres.',
    ties: 'Brann respects their discipline. Vesh hopes to turn that respect into recognition.',
  },
};
export const familyLore = [
  {
    id: 'dawn',
    name: 'House Dawn',
    crest: 'sun',
    motto: 'Let the light remember',
    faction: 'nobles',
    power: 72,
    cohesion: 54,
    fortune: 70,
    standing: 55,
    head: 'Lady Yselle Dawn',
    members:
      'Yselle, the formidable matriarch; Liora, her independent daughter; Corven, a charming heir with considerable debts.',
    story:
      'The Dawns financed the rebuilding after the last plague. They expect gratitude to be hereditary. Yselle protects her tenants from bandits and her children from choices she did not make herself.',
    estate: 'Sunmere Manor and the eastern vineyards',
    desire: 'A marriage near the throne and a protected place in the succession.',
    secret: 'A guild ledger would reveal how little coin backs the family’s grand gestures.',
  },
  {
    id: 'vale',
    name: 'House Vale',
    crest: 'stag',
    motto: 'Rooted, yet reaching',
    faction: 'commons',
    power: 48,
    cohesion: 72,
    fortune: 42,
    standing: 60,
    head: 'Lord Halden Vale',
    members:
      'Halden, keeper of the western ford; Orrin, a distant cousin who sides with the mills; young Elen, studying the old boundary stones.',
    story:
      'The Vales rose from mill owners to landed gentry and never agree on what that should mean. Their table still serves common bread. Their western boundary stones have moved twice in a generation.',
    estate: 'Fordwatch and the river mills',
    desire: 'Secure water rights and recognition independent of House Dawn.',
    secret: 'Their oldest charter grants the ford to a vanished monastery.',
  },
  {
    id: 'ashwood',
    name: 'The Ashwood Kin',
    crest: 'leaf',
    motto: 'What grows is kept',
    faction: 'elves',
    power: 58,
    cohesion: 66,
    fortune: 45,
    standing: 65,
    head: 'Warden Ilyan Ashwood',
    members:
      'Ilyan, grove warden; Mira, your steward; Teren, the orchard keeper who wants his sister to come home.',
    story:
      'A kinship of wardens, gardeners, and record keepers who measure inheritance in living things. Mira’s departure wounded their pride, though the gifts of seed they send her say something gentler.',
    estate: 'The lantern orchards and the old root archives',
    desire: 'A binding promise that new settlements will respect the groves.',
    secret: 'One orchard shelters a ruined shrine the wardens will not discuss.',
  },
];
export const sites = [
  {
    id: 'capital',
    name: 'Alder Hall',
    kind: 'Seat of rule',
    x: 155,
    y: 130,
    scene: 'hall',
    story:
      'A timber hall raised over the foundations of an older keep. Wax seals, petitions, and the smell of rosemary mingle in its chambers. Every morning the gates open to someone with a grievance and someone with a hope.',
    rumor: 'The sealed cellar contains the archive of a ruler whose name was erased.',
    strength: 'A meeting place where the realm can hear itself.',
    risk: 'A court without trust becomes a hall of whispered bargains.',
  },
  {
    id: 'fields',
    name: 'Hearthfields',
    kind: 'Mills & hamlets',
    x: 90,
    y: 245,
    scene: 'fields',
    story:
      'Warm river soil feeds clustered hamlets and a chain of watermills. Halfling gardens border dwarf-built sluices. The oldest families read the water by the reeds, and say it is changing.',
    rumor: 'A stone uncovered at the ford bears the mark of a forgotten monastery.',
    strength: 'Grain, milling, livestock, and skilled hands.',
    risk: 'A broken sluice or unfair tithe can turn plenty into hunger.',
  },
  {
    id: 'forest',
    name: 'Silverwood',
    kind: 'Ancient woodland',
    x: 255,
    y: 75,
    scene: 'forest',
    story:
      'At dusk the bark catches the light like beaten silver. Wardens leave paths unmarked to discourage those who cannot ask permission. Beneath the oldest roots, a ruined observatory still watches a sky no one remembers.',
    rumor: 'A bell rings underground on nights without a moon.',
    strength: 'Herbs, timber by agreement, and elven scholarship.',
    risk: 'Logging without consent wounds relations and awakens old defenses.',
  },
  {
    id: 'border',
    name: 'Briarroot',
    kind: 'River compact',
    x: 300,
    y: 205,
    scene: 'fields',
    story:
      'Stilt towns and glass kilns glow above the marsh. Goblin ferrymen swap news in six languages. A thriving crossing, if the lowlands stop treating every unfamiliar face as a danger.',
    rumor: 'A drowned roadway leads to a shrine visible only at low water.',
    strength: 'Glasswork, ferry tolls, and caravan exchange.',
    risk: 'Floods, disputed tolls, and fear of outsiders.',
  },
  {
    id: 'mountains',
    name: 'Stoneveil',
    kind: 'Highland lodges',
    x: 80,
    y: 75,
    scene: 'ruins',
    story:
      'Carved doors face the mountain winds. Behind them bugbear families keep travelers warm and remember paths lost to avalanches. An abandoned dwarf watchtower guards the northern saddle.',
    rumor: 'Blue light has returned to the watchtower’s broken windows.',
    strength: 'Iron seams, stonecraft, and reliable pass-keepers.',
    risk: 'Winter closures and something stirring in the abandoned tower.',
  },
  {
    id: 'ruins',
    name: 'The Hollow Abbey',
    kind: 'Ruined sanctuary',
    x: 210,
    y: 265,
    scene: 'ruins',
    story:
      'An abbey without a roof stands in a field of white flowers. Its monks vanished during the plague. Villagers hear singing when the rain runs down the stone steps.',
    rumor: 'The abbey’s spring once healed fevers. Its guardian still waits for a pilgrim.',
    strength: 'Lost medicine, old charters, and a possible sacred spring.',
    risk: 'Unstable masonry, restless dead, and promises with forgotten terms.',
  },
];
export const parties = [
  {
    id: 'lanterns',
    name: 'The Wayward Lanterns',
    portrait: 'liora',
    leader: 'Captain Iona Bell',
    members:
      'Iona, human swordswoman; Pipp, halfling locksmith; Dree, goblin herbalist; Enna, elven arcanist.',
    story:
      'A found family who leave a lit lantern wherever someone helped them. They prefer preparation to heroics and promise to bring every companion home.',
    skill: 72,
    caution: 80,
    fee: 18,
    loyalty: 55,
    reputation: 60,
    wounds: 0,
    status: 'available',
  },
  {
    id: 'thorns',
    name: 'The Thornbound',
    portrait: 'kesh',
    leader: 'Rask Redpaw',
    members: 'Rask, gnoll scout; Uth, bugbear shieldbearer; Meret, human shrine-keeper.',
    story:
      'Survivors of the same disastrous caravan raid. They excel in wild country and distrust noble promises. Rask never accepts a task without knowing who will benefit.',
    skill: 80,
    caution: 48,
    fee: 24,
    loyalty: 45,
    reputation: 65,
    wounds: 0,
    status: 'available',
  },
  {
    id: 'quills',
    name: 'The Silver Quills',
    portrait: 'mira',
    leader: 'Scholar Vel Anwyn',
    members: 'Vel, elven historian; Garan, dwarf ward-breaker; Soot, goblin illusionist.',
    story:
      'Scholars who discovered that the archives they need are usually guarded by something with teeth. They prize knowledge and dislike orders to destroy what they cannot yet understand.',
    skill: 64,
    caution: 65,
    fee: 15,
    loyalty: 50,
    reputation: 50,
    wounds: 0,
    status: 'available',
  },
];
export const expeditions = [
  {
    id: 'abbey',
    site: 'ruins',
    name: 'The song beneath the abbey',
    story:
      'Discover who sings beneath the Hollow Abbey. Recover the monks’ healing knowledge if it can be taken without profaning the sanctuary.',
    difficulty: 58,
    item: 'spring',
    domain: 'learning',
  },
  {
    id: 'woods',
    site: 'forest',
    name: 'Where the silver roots descend',
    story:
      'Follow a moonless bell into Silverwood’s buried observatory. The wardens will lend a guide if their trust has been earned.',
    difficulty: 64,
    item: 'lantern',
    domain: 'ecology',
  },
  {
    id: 'temple',
    site: 'mountains',
    name: 'The watchtower’s blue flame',
    story:
      'Climb the ruined northern tower. Something inside has rekindled a beacon that no mortal keeper has lit in a century.',
    difficulty: 72,
    item: 'ward',
    domain: 'justice',
  },
  {
    id: 'wyvern',
    site: 'fields',
    name: 'Wings over the harvest',
    story:
      'A wyvern has nested above the grain road. Find a way to protect the hamlets without sending raw recruits into its talons.',
    difficulty: 62,
    item: 'banner',
    domain: 'health',
  },
];
export const relics = {
  spring: {
    name: 'The Chalice of Returning Rain',
    story:
      'A plain silver cup, worn smooth by generations of healers. Water poured from it carries the scent of a spring morning.',
    effect: 'Hospitals receive clean water each season, strengthening public health.',
    resource: 'health',
    amount: 3,
  },
  lantern: {
    name: 'The Lantern of Unlost Paths',
    story: 'Its green flame leans toward travelers in danger, even when there is no wind.',
    effect: 'Caravan guides find safer paths, sustaining commerce.',
    resource: 'trade',
    amount: 2,
  },
  ward: {
    name: 'The Oathstone of the North',
    story: 'Blue light travels through the cracks whenever a promise is spoken sincerely nearby.',
    effect: 'Watch posts share warnings, strengthening security.',
    resource: 'security',
    amount: 2,
  },
  banner: {
    name: 'The Featherwoven Standard',
    story: 'A harmless feather held beneath this banner floats toward the nearest shelter.',
    effect: 'Villagers feel protected, lifting public confidence.',
    resource: 'happiness',
    amount: 2,
  },
};
export const audienceStories = [
  {
    id: 'water',
    speaker: 'mira',
    title: 'The well tastes of iron',
    text: 'Mira places a cloudy bottle beside your seal. “The children of Hearthfields have been ill. The foundry denies its waste reaches the river, but the millers have begun boiling every bucket. If we accuse the guild without proof, they will call it politics.”',
    options: [
      {
        id: 'repair',
        label: 'Fund clean wells and an inspection',
        note: 'Costly relief protects families; the guild dislikes scrutiny.',
        cost: 16,
        effects: { health: 9, justice: 4 },
        relations: { commons: { trust: 8 }, guild: { grievance: 5 } },
      },
      {
        id: 'mediate',
        label: 'Ask the guild to repair the damage',
        note: 'A careful bargain preserves trade but leaves reform in private hands.',
        cost: 5,
        effects: { health: 4, trade: 2 },
        relations: { guild: { trust: 5 }, commons: { trust: 2 } },
      },
      {
        id: 'silence',
        label: 'Keep the accusation out of the market',
        note: 'Commerce continues. Sick families remember your silence.',
        cost: 0,
        effects: { trade: 4, health: -7, justice: -5 },
        relations: { commons: { grievance: 12 } },
      },
    ],
  },
  {
    id: 'refugees',
    speaker: 'brann',
    title: 'Guests under the gatehouse',
    text: 'Brann’s cloak is wet with rain. “Gnoll families are waiting outside. A beast scattered their caravan. Some villagers offer beds; others bar their doors. The watch will follow your word. Give us a word we can live with.”',
    options: [
      {
        id: 'welcome',
        label: 'Open the hall and share the stores',
        note: 'Refugees find shelter; food reserves shrink and old houses grumble.',
        cost: 6,
        effects: { food: -10, happiness: 5, justice: 5 },
        relations: { gnolls: { trust: 14 }, nobles: { grievance: 5 } },
      },
      {
        id: 'work',
        label: 'Offer paid work rebuilding the ford',
        note: 'Dignified shelter with obligations; new hands strengthen the roads.',
        cost: 12,
        effects: { infrastructure: 6, happiness: 3 },
        relations: { gnolls: { trust: 8 }, guild: { respect: 5 } },
      },
      {
        id: 'turn',
        label: 'Escort them to the next realm',
        note: 'Stores remain untouched. The clans will remember the closed gate.',
        cost: 0,
        effects: { security: 3, justice: -4 },
        relations: { gnolls: { grievance: 16 }, nobles: { respect: 4 } },
      },
    ],
  },
  {
    id: 'letters',
    speaker: 'sable',
    title: 'Two letters, one seal',
    text: 'Sable lays two invitations on the table. “House Dawn asks you to dine while Speaker Nettle asks you to witness a ferry charter. Both know the other has asked. This is less about supper than who gets to be seen beside the throne.”',
    options: [
      {
        id: 'commons',
        label: 'Witness the river charter',
        note: 'Briarroot gains recognition; the old houses feel overlooked.',
        cost: 4,
        effects: { trade: 3 },
        relations: { goblins: { trust: 12 }, nobles: { grievance: 8 } },
      },
      {
        id: 'nobles',
        label: 'Dine at Sunmere Manor',
        note: 'Noble favor protects your authority; the ferry towns see familiar privilege.',
        cost: 4,
        effects: { legitimacy: 6 },
        relations: { nobles: { trust: 10 }, goblins: { grievance: 8 } },
      },
      {
        id: 'both',
        label: 'Invite both delegations to your hall',
        note: 'A more expensive evening could begin a shared conversation.',
        cost: 14,
        effects: { justice: 3 },
        relations: { nobles: { trust: 4 }, goblins: { trust: 6 } },
      },
    ],
  },
  {
    id: 'grove',
    speaker: 'mira',
    title: 'An axe at the boundary',
    text: 'Mira unfolds a map with a torn corner. “The road crews found a shorter route through an Ashwood grove. It would save weeks. My brother calls the trees a living archive. The foreman calls them timber. Both are waiting for an answer.”',
    options: [
      {
        id: 'bend',
        label: 'Bend the road around the grove',
        note: 'More costly construction honors the wardens’ trust.',
        cost: 14,
        effects: { infrastructure: 5, ecology: 8 },
        relations: { elves: { trust: 12 }, guild: { grievance: 3 } },
      },
      {
        id: 'cut',
        label: 'Authorize a narrow clearing',
        note: 'Trade benefits quickly; woodland memory is wounded.',
        cost: 5,
        effects: { infrastructure: 9, trade: 4, ecology: -9 },
        relations: { elves: { grievance: 14 } },
      },
      {
        id: 'consult',
        label: 'Invite wardens to design the crossing',
        note: 'Patient collaboration builds knowledge, with modest immediate progress.',
        cost: 9,
        effects: { infrastructure: 3, learning: 6, ecology: 4 },
        relations: { elves: { trust: 7 } },
      },
    ],
  },
  {
    id: 'recruit',
    speaker: 'brann',
    title: 'A captain’s unfinished apology',
    text: 'Brann waits until the clerks have left. “A recruit struck a goblin trader at the market. He says he was afraid. That may be true. It does not make the bruise disappear. The watch needs to know what its oath means.”',
    options: [
      {
        id: 'trial',
        label: 'Hold an open hearing',
        note: 'Visible justice reassures the trader; some soldiers resent the scrutiny.',
        cost: 7,
        effects: { justice: 9, security: 2 },
        relations: { goblins: { trust: 10 }, guard: { grievance: 4 } },
      },
      {
        id: 'repair',
        label: 'Require restitution and retraining',
        note: 'A chance to repair the harm without a public spectacle.',
        cost: 10,
        effects: { justice: 5, military: 3 },
        relations: { goblins: { trust: 5 }, guard: { respect: 5 } },
      },
      {
        id: 'protect',
        label: 'Protect the watch from criticism',
        note: 'Soldiers feel backed. The trader and their neighbors feel abandoned.',
        cost: 0,
        effects: { military: 3, justice: -8 },
        relations: { guard: { trust: 8 }, goblins: { grievance: 15 } },
      },
    ],
  },
  {
    id: 'school',
    speaker: 'sable',
    title: 'The language of tomorrow',
    text: 'Sable brings a child’s slate. “Six alphabets in one market, and apprentices are taught only one. A goblin glassmaker offered to teach. The guild says their masters must approve the lessons. Knowledge is a small thing to be frightened of.”',
    options: [
      {
        id: 'school',
        label: 'Establish an open school',
        note: 'Public learning grows; masters resent losing control of craft secrets.',
        cost: 18,
        effects: { learning: 10, happiness: 3 },
        relations: { commons: { trust: 6 }, guild: { grievance: 6 } },
      },
      {
        id: 'guild',
        label: 'Charter a guild-run academy',
        note: 'A smaller cost and better industry, but access remains selective.',
        cost: 10,
        effects: { learning: 5, trade: 4 },
        relations: { guild: { trust: 8 } },
      },
      {
        id: 'exchange',
        label: 'Begin a volunteer language exchange',
        note: 'An inexpensive start that relies on neighbors sharing their time.',
        cost: 3,
        effects: { learning: 3, justice: 2 },
        relations: { goblins: { affection: 6 }, commons: { trust: 3 } },
      },
    ],
  },
];
export const projectReports = {
  roads: {
    balanced:
      'The ford carries its first loaded wagon. Villagers and merchants argue about the new tollboard, but both can now reach the far bank.',
    villages:
      'Children cross a new footbridge on their way to the mills. A village elder sends a loaf wrapped in a note: “We thought the crown had forgotten this road.”',
    commerce:
      'The first caravan reaches the warehouses before dusk. Beyond the causeway, fresh stumps stand where Silverwood once met the river.',
  },
  granary: {
    balanced:
      'The granary doors close on a sound reserve. Families no longer count the days to the next harvest quite so anxiously.',
    shared:
      'Each hamlet takes a key to its own storehouse. The steward’s ledger now contains the names of elected keepers instead of appointed collectors.',
    reserve:
      'Crown storehouses fill with grain. The watch knows its winter supply is secure; villagers ask who will decide when the doors open.',
  },
  guard: {
    balanced:
      'New patrols learn the road and the names of those who live beside it. The watch’s oath begins to sound like something it can keep.',
    protect:
      'A recruit returns a lost child before reporting for inspection. The captain reads the story aloud as an example of what the watch is for.',
    iron: 'The drill yard grows quiet at a single command. Beyond it, families lower their voices when a patrol passes.',
  },
  embassy: {
    balanced:
      'Briarroot and your merchants seal a new compact. The ferrymen begin learning the names of the crown’s messengers.',
    listen:
      'Speaker Nettle sends river tea with the next caravan. “You asked what we needed,” the enclosed note says. “That was a beginning.”',
    terms:
      'The treasurer admires the favorable contract. Sable also brings a list of ferry families who will bear its cost.',
  },
  festival: {
    balanced:
      'Music carries between the market stalls long after the lamps are lit. For a night, the realm tells a story of itself without fear.',
    open: 'A bugbear child and a noble heir share a bench at the feast. Their parents look uncertain. The children ask for more honey bread.',
    heritage:
      'Seven ancestral banners hang above the hall. The old houses renew their oaths while those without a banner watch through the open doors.',
  },
  inquiry: {
    balanced:
      'The court quietly corrects its accounts and tightens the gatehouse records. Some familiar smiles have grown more careful.',
    public:
      'A toll collector answers questions before the people he overcharged. The testimony is messy, uncomfortable, and impossible to dismiss.',
    quiet:
      'A coded report reaches your chamber. The missing coin has been found. The clerk asks whether the methods should be entered in the public record.',
  },
};
export const followupReports = {
  water: {
    title: 'Clear water, old debts',
    text: 'A Hearthfields healer sends a letter stained with mint tea. The wells are being watched now, but trust returns more slowly than clean water.',
    faction: 'commons',
    domain: 'health',
  },
  refugees: {
    title: 'A name beneath a new roof',
    text: 'A gnoll family has sent the names of everyone who shared bread with them. The matriarch asks whether belonging is a single kind gesture or a promise that can be renewed.',
    faction: 'gnolls',
    domain: 'justice',
  },
  letters: {
    title: 'Who was seen beside the crown',
    text: 'News of your invitation has reached the ferry towns and manor houses. The evening is over; its meaning is still being argued over at distant tables.',
    faction: 'goblins',
    domain: 'trade',
  },
  grove: {
    title: 'The route the roots remember',
    text: 'Teren Ashwood sends a pressed leaf and a map of the new crossing. The foreman sends an account of the work. Both are asking what your choice means for the next grove.',
    faction: 'elves',
    domain: 'ecology',
  },
  recruit: {
    title: 'The oath after the hearing',
    text: 'The trader has reopened their market stall. Young watch recruits ask the captain what they should learn from the incident. A single judgment is becoming a custom.',
    faction: 'guard',
    domain: 'justice',
  },
  school: {
    title: 'Words carried home',
    text: 'An apprentice writes that they can now read a caravan label in two languages. A master writes that apprentices are becoming difficult to impress. The same lesson has made two different kinds of news.',
    faction: 'guild',
    domain: 'learning',
  },
};
