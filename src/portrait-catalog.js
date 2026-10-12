// Painted identity components are fixed assets. Atlas names and cell indices never come from imported URLs.
export const portraitCatalog = [];
const add = (
  atlas,
  row,
  race,
  species,
  descriptions,
  ages = ['young', 'mature', 'young', 'elder'],
  genders = ['Man', 'Man', 'Woman', 'Woman'],
) =>
  descriptions.forEach((description, col) =>
    portraitCatalog.push({
      key: atlas + '-' + (row * 4 + col),
      atlas,
      index: row * 4 + col,
      race,
      species: species || null,
      description,
      age: ages[col],
      gender: genders[col],
    }),
  );
add('beast-faces-a', 0, 'Beastfolk', 'Fox', [
  'red fur, narrow muzzle, alert eyes, green linen travel cloak',
  'silver gray fur, broad muzzle, scar, dark leather armor, stern eyes',
  'cream white fur, large ears, fine narrow muzzle, blue robe, thoughtful eyes',
  'black cross markings, long black ears, amber eyes, formal dark headwrap',
]);
add('beast-faces-a', 1, 'Beastfolk', 'Wolf', [
  'gray fur, soft ears, narrow muzzle, green travel cloak',
  'black fur, scar, broad muzzle, red scarf, leather armor',
  'white fur, fine muzzle, pale eyes, blue robe',
  'russet fur, round cheek fur, cloth hood, warm eyes',
]);
add('beast-faces-a', 2, 'Beastfolk', 'Cat', [
  'brown tabby stripes, broad cheek fur, green cloak',
  'black white markings, angular eyes, scar, leather armor',
  'calico markings, narrow face, blue robe',
  'silver gray stripes, fuller face, dark headwrap',
]);
add('beast-faces-a', 3, 'Beastfolk', 'Owl', [
  'pale barn owl, narrow face, dark eyes, green cloak',
  'horned owl, ear tufts, broad face, gold eyes, leather armor',
  'white snowy feathers, narrow eyes, blue robe',
  'tawny feathers, soft round face, dark gold robe',
]);
add('beast-faces-b', 0, 'Beastfolk', 'Bear', [
  'brown fur, narrow muzzle, simple white linen',
  'black fur, broad muzzle, heavy shoulders, red coat',
  'pale white fur, angular muzzle, green cloak',
  'cinnamon brown fur, round face, ivory hood',
]);
add('beast-faces-b', 1, 'Beastfolk', 'Rabbit', [
  'gray fur, long lop ears, rounded cheeks, white linen',
  'white fur, upright ears, broad jaw, red coat',
  'brown fur, long upright ears, narrow face, green cloak',
  'black white markings, floppy ears, rounded face, ivory hood',
]);
add('beast-faces-b', 2, 'Beastfolk', 'Otter', [
  'tawny fur, narrow muzzle, white shirt',
  'dark fur, broad sea otter muzzle, heavy build, red coat',
  'pale whiskers, fine muzzle, green cloak',
  'cinnamon fur, long whiskers, ivory hood',
]);
add('beast-faces-b', 3, 'Beastfolk', 'Lizard', [
  'jade green scales, narrow snout, white linen',
  'charcoal scales, horned head, broad snout, red coat',
  'blue green scales, high crest, narrow snout, green cloak',
  'sand colored scales, rounded snout, ivory hood',
]);
add('fantasy-faces-a', 0, 'Elf', null, [
  'bronze skin, flowing red hair, narrow face, long ears',
  'pale skin, bald head, narrow eyes, formal dark robe',
  'brown skin, short white curls, fine features',
  'olive skin, silver braids, lined eyes, formal robe',
]);
add('fantasy-faces-a', 1, 'Dwarf', null, [
  'red beard, close cropped hair, broad nose',
  'dark skin, black braided beard, heavy brow',
  'dark skin, copper curls, broad jaw, dark armor',
  'pale skin, gray braids, kind rounded cheeks',
]);
add('fantasy-faces-a', 2, 'Halfling', null, [
  'pale freckles, russet curls, fine chin',
  'olive skin, white mustache, narrow jaw',
  'dark skin, cropped curls, broad cheekbones',
  'pale skin, silver curls, soft laugh lines',
]);
add('fantasy-faces-a', 3, 'Orc', null, [
  'deep green skin, black curls, fine tusks',
  'gray green skin, cheek scar, heavy jaw',
  'warm green skin, long braid, narrow face',
  'olive skin, pale hair, weathered wise eyes',
]);
add('fantasy-faces-b', 0, 'Goblin', null, [
  'olive skin, cropped dark hair, narrow face',
  'moss green skin, broad nose, glasses',
  'umber green skin, short auburn hair, angular face',
  'gray green skin, warm lines, ivory hood',
]);
add('fantasy-faces-b', 1, 'Gnoll', null, [
  'tawny fur, spots, short mane, angular muzzle',
  'charcoal fur, gray coarse mane, broad muzzle',
  'golden fur, dark eye markings, narrow muzzle',
  'sandy fur, dark braided mane, broad warm muzzle',
]);
add('fantasy-faces-b', 2, 'Bugbear', null, [
  'chestnut fur, pointed ears, short mane, narrow nose',
  'dark brown fur, broad nose, heavy black mane',
  'tawny fur, narrow face, fine red mane',
  'gray fur, heavy build, warm eyes, wool shawl',
]);
add(
  'fantasy-faces-b',
  3,
  'Human',
  null,
  [
    'olive skin, short sandy curls, narrow androgynous face',
    'pale skin, bald head, heavy brow, armor',
    'brown skin, wavy hair, gold circlet, formal robe',
    'Asian features, black shoulder length hair, burgundy formal coat',
  ],
  ['young', 'mature', 'elder', 'young'],
  ['Nonbinary', 'Man', 'Woman', 'Man'],
);
add(
  'human-faces',
  0,
  'Human',
  null,
  [
    'brown skin, tight curls, broad nose, heavy fur cloak',
    'pale skin, auburn braid, narrow face, green robe',
    'olive skin, short black curls, square jaw, dark cloak',
    'Asian features, tied black hair, fine features, gold robe',
  ],
  ['young', 'young', 'young', 'young'],
  ['Man', 'Man', 'Man', 'Man'],
);
add(
  'human-faces',
  1,
  'Human',
  null,
  [
    'pale skin, bald gray temples, gentle smile',
    'dark skin, broad beard, heavy shoulders, dignified eyes',
    'olive skin, short gray hair, scar, stern eyes, armor',
    'Asian features, white hair, soft smile, slender build',
  ],
  ['elder', 'mature', 'mature', 'elder'],
  ['Man', 'Man', 'Man', 'Man'],
);
add(
  'human-faces',
  2,
  'Human',
  null,
  [
    'pale skin, freckles, long red hair, sharp chin, green dress',
    'brown skin, dark natural curls, broad cheekbones, red robe',
    'olive skin, shaved side, dark braid, strong nose, dark coat',
    'Asian features, black bob, round cheeks, dark red robe',
  ],
  ['young', 'young', 'young', 'young'],
  ['Woman', 'Woman', 'Woman', 'Woman'],
);
add(
  'human-faces',
  3,
  'Human',
  null,
  [
    'brown skin, ivory headwrap, weathered face',
    'pale skin, gray hair, heavy brows, strong jaw',
    'olive skin, silver wavy hair, warm smile',
    'Asian features, gray bun, narrow lined face',
  ],
  ['elder', 'elder', 'mature', 'elder'],
  ['Woman', 'Woman', 'Woman', 'Woman'],
);
export const paintedFace = (key) => portraitCatalog.find((p) => p.key === key);
const extraAges = ['elder', 'young', 'young', 'mature'];
add(
  'beast-faces-c',
  0,
  'Beastfolk',
  'Fox',
  [
    'red fur, white eyebrows, rounded soft muzzle, gray knitted scarf',
    'black fur, short angular muzzle, white collar',
    'red fur, freckled white muzzle, fluffy cheek fur, green coat',
    'white fur, dense round cheek fur, expressive eyes, red shawl',
  ],
  extraAges,
);
add(
  'beast-faces-c',
  1,
  'Beastfolk',
  'Wolf',
  [
    'russet fur, gray long cheek fur, slender muzzle, gray scarf',
    'gray fur, blocky muzzle, heavy eyebrows, white collar',
    'black fur, narrow muzzle, tall ears, green coat',
    'silver gray fur, drooping ears, broad cheek fur, red shawl',
  ],
  extraAges,
);
add(
  'beast-faces-c',
  2,
  'Beastfolk',
  'Cat',
  [
    'ginger tabby stripes, long cheek fur, close set ears, gray scarf',
    'black fur, green eyes, smooth round muzzle, white collar',
    'white fur, blue eyes, pink nose, narrow pointed face, green coat',
    'tortoiseshell mottled fur, rounded cheeks, red shawl',
  ],
  extraAges,
);
add(
  'beast-faces-c',
  3,
  'Beastfolk',
  'Owl',
  [
    'gray feathers, huge concentric facial disk, grave eyes, gray scarf',
    'brown feathers, tall ear tufts, orange eyes, white collar',
    'black white spots, small round face, silver eyes, green coat',
    'cream buff feathers, broad face, drooping feathers, red shawl',
  ],
  extraAges,
);
add(
  'beast-faces-d',
  0,
  'Beastfolk',
  'Bear',
  [
    'gray brown fur, slender muzzle, gray scarf',
    'honey golden fur, blocky muzzle, heavy eyebrows, white collar',
    'black fur, narrow muzzle, small ears, green coat',
    'white fur, broad cheek fur, red shawl',
  ],
  extraAges,
);
add(
  'beast-faces-d',
  1,
  'Beastfolk',
  'Rabbit',
  [
    'russet fur, gray cheeks, slender muzzle, erect ears, gray scarf',
    'gray fur, blocky muzzle, broad eyes, horizontal ears, white collar',
    'black fur, narrow muzzle, tall ears, green coat',
    'cream fur, drooping ears, broad cheek fur, red shawl',
  ],
  extraAges,
);
add(
  'beast-faces-d',
  2,
  'Beastfolk',
  'Otter',
  [
    'gray fur, long cheek fur, small ears, gray scarf',
    'cinnamon fur, green eyes, round muzzle, white collar',
    'dark chocolate fur, narrow pointed face, green coat',
    'tawny fur, pale whiskers, rounded cheeks, red shawl',
  ],
  extraAges,
);
add(
  'beast-faces-d',
  3,
  'Beastfolk',
  'Lizard',
  [
    'dark emerald scales, blunt snout, mossy crest, gray scarf',
    'sand orange scales, spiky horn frill, angular snout, white collar',
    'violet charcoal scales, round snout, silver eyes, green coat',
    'blue white scales, broad face, soft crest, red shawl',
  ],
  extraAges,
);
add(
  'fantasy-faces-c',
  0,
  'Elf',
  null,
  [
    'olive skin, long white hair, tiny white beard, aquiline nose, calm lined eyes',
    'dark skin, tightly curled black hair, rounded cheeks, smiling eyes',
    'pale skin, short red bob, strong brows, angular jaw',
    'brown skin, long black hair, shaved sides, broad nose, crooked smile',
  ],
  extraAges,
);
add(
  'fantasy-faces-c',
  1,
  'Dwarf',
  null,
  [
    'pale skin, huge white beard, bald dome, hooked nose, twinkling eyes',
    'tawny skin, short brown beard, close set eyes, broken nose',
    'olive skin, wavy black hair, square jaw, soft mustache, kind eyes',
    'ruddy skin, red braids, strong brows, broad nose, stern lips',
  ],
  extraAges,
);
add(
  'fantasy-faces-c',
  2,
  'Halfling',
  null,
  [
    'dark skin, short gray curls, deep laugh lines, broad nose',
    'pale skin, shaggy blond hair, upturned nose, mischievous eyes',
    'olive skin, black braids, broad cheekbones, freckles, full smile',
    'tan skin, red bob, small chin, grave eyes',
  ],
  extraAges,
);
add(
  'fantasy-faces-c',
  3,
  'Orc',
  null,
  [
    'dark olive skin, gray shaved temples, worn tusks, narrow jaw',
    'sage green skin, bald head, broad blunt nose, small tusks',
    'gray blue skin, messy black curls, angular face, thoughtful eyes',
    'copper green skin, bald head, bold cheekbones, huge tusks, joyful eyes',
  ],
  extraAges,
);
add(
  'fantasy-faces-d',
  0,
  'Goblin',
  null,
  [
    'umber skin, gray wispy hair, large ears, crinkled laughing eyes',
    'emerald skin, bald head, high brow, tiny chin, hooked nose',
    'gray violet skin, black bob, wide mouth, large golden eyes',
    'olive skin, rust braids, round flat nose, sharp eyes',
  ],
  extraAges,
);
add(
  'fantasy-faces-d',
  1,
  'Gnoll',
  null,
  [
    'pale speckled fur, silver mane, narrow muzzle, kind eyes',
    'red brown fur, short dark crest, round muzzle, mischievous eyes',
    'black mottled fur, swept gray mane, square muzzle, focused eyes',
    'white golden spots, cropped red mane, heavy jowls',
  ],
  extraAges,
);
add(
  'fantasy-faces-d',
  2,
  'Bugbear',
  null,
  [
    'russet fur, white mane, aquiline nose, wrinkled gentle eyes',
    'sandy fur, cropped red mane, blunt nose, huge brow',
    'black fur, silver mane, upturned nose, strong brows',
    'gray fur, short brown mane, broad nose, smiling eyes',
  ],
  extraAges,
);
add(
  'fantasy-faces-d',
  3,
  'Human',
  null,
  [
    'dark skin, bald head, short white beard, hooked nose, broad cheeks',
    'olive skin, black pixie haircut, heavy brows, square jaw',
    'pale freckles, blond curls, thin mustache, narrow chin',
    'pale skin, long silver braid, narrow hawklike face',
  ],
  ['elder', 'young', 'young', 'elder'],
  ['Man', 'Woman', 'Man', 'Woman'],
);
