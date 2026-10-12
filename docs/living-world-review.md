# Living-world iteration: 0.5.0 review

Implementation is on `feature/living-world`. The original review delivery kept the main game at 0.4.0. GitHub Pages was subsequently changed to serve the feature branch for testing. A separate [test preview](https://vichrae88.github.io/Lineage/?preview=1) is available with isolated browser-save slots. This report describes working features and measured checks, rather than promising every possible extension in the master brief.

## Phase checkpoints

| Phase | Playable result | Main modules | Evidence |
| --- | --- | --- | --- |
| 1 — Consequences and feedback | Permanent decision causes, world facts, mill/road/school chains, local institutions, forecast and actual accounts | `history`, `settlements`, `economy`, `reports-ui` | 56 tests at the checkpoint; mill changes a place/person and leaves a later-reign legacy; province harvest bug fixed |
| 2 — Individuals | Canonical identities, attributes, profession-specific skills, traits, property, professional estimates, training, timed mentorship, actual recruits | `characters`, `characters-ui`, compatibility facade in `game` | 64 tests; paid and mentored courses change skills and relationships; a stronger charismatic captain recruits more people |
| 3 — Independent lives | NPC investment, relationships, marriage, children, mortality, career opportunities, ongoing state-derived petitions, obligations | `living`, `emergent`, `sim-core` | 71 tests; opening-deck exhaustion does not end meaningful opportunities; deterministic replay and multiruler century checks |
| 4 — Portraits and communities | Saved hybrid visual identities, additional adult/child artwork, inherited features, mixed court/recruits, local demographic cohorts and migration | `portraits`, `demographics`, `campaign`, local atlases | Mixed town/province checks, distinct recipes, exact restored portraits, census conservation; visual inspection of adult/child art and portrait gallery |
| 5 — Dynasty and realm evolution | Real family links, interactive tree, reign register, personal inheritance, named rival claims, generational grievances, academies and populated new districts | `dynasty`, `dynasty-ui`, integrated history and settlements | Three distinct rulers, rival ascension, estates transferred once, descendant petition linked to an earlier ruler, real district/governorship, twenty-year academy |
| 6 — Verification and persistence | Compact saves, nested/reference validation, browser actions/focus/mobile fixes, long-run measurements, migration, development and review documentation | `persistence`, `integrity`, browser and century scripts | 94 simulation tests; real Chromium workflows; static build; native-resource century report |

Phases 4–5 were integrated together because portrait inheritance, ancestry, demographic transfers, and realm evolution share the same identity/state migration. Phase 6 checks the resulting complete simulation.

## Gameplay demonstrations

- **Magnetic captain:** recruiting 68 and leadership 75, with charisma 17 and Magnetic Personality/Inspiring Leader, outperforms the same seeded captain at charisma 8 with those traits absent. Actual recruitment differs, and the assignment preserves its capability assessment and skill gain. Success remains uncertain.
- **School changes a life:** a commission creates a real school, teacher and pupil. Funded classes improve scholarship; suspended funding pauses education. Eight taught seasons graduate the pupil. Later classes continue, and twenty funded years with surviving academic history can establish an academy.
- **Family remembers:** a public service demand creates a family-grievance fact linked to the original ruling and affects members' finances and grievance. A surviving member or registered descendant can petition in a later reign. Recognition, service and testimony settle that specific fact differently.
- **Mixed Beastfolk:** the predominant culture is a majority rather than an exclusive roster. An Otter ruler can govern several Beastfolk species and other peoples. Demographics vary by region and evolve without losing or creating residents through rounding.
- **Three rulers:** successors keep their own skills, traits, values, portrait, biography and prior relationships. Dead rulers remain individual records; estate transfers are applied once. Contested inheritance can elevate a real rival and preserve the displaced claimant's grievance.
- **A century:** the repeatable script plays both scales from their normal resources, answers actual petitions, uses gentle taxation/restorative justice and seasonal public-relief counsel when affordable. It does not inject gold/food or force succession.

## Measured century run

Node.js 24, seed 72, Beastfolk; local wall-clock results vary by machine.

| Result after 400 seasons | Town | Province |
| --- | ---: | ---: |
| Year | 101 | 101 |
| Reigns | 3 | 3 |
| Unique emergent petitions | 116 | 124 |
| Seasons without food | 0 | 0 |
| Population | 1,794 | 16,816 |
| Treasury | 1,949 | 4,106 |
| Food stores | 176 | 216 |
| Living active people | 50 | 54 |
| Total remembered/known identities | 261 | 266 |
| Permanent major records | 1,423 | 1,450 |
| Compact save bytes | 1,925,084 | 1,969,676 |
| Simulation, periodic reloads and final validation | ~3.3 seconds | ~3.3 seconds |

This demonstrates a sustainable ordinary strategy and continued play, not that every policy or seed is equally easy. Heavy taxation, excessive staffing and upkeep, ignored shortages, and foreign grievances can still harm a realm. Current tests also check three province seeds through twelve years with ordinary public-relief management.

## Browser and migration checks

Chromium checks against the built static game cover seven-step creation, real first ruling, outcome/Chronicle navigation, forecasts and actual counsel costs, two-season mentorship, hiring, transferring, dismissing, remembered ancestors, compact export, Chronicle filters, Escape/focus restoration, and a 360-pixel layout with visible map/public mood and no horizontal overflow. Production version-3 and version-4 fixtures load through the real interface. JavaScript page errors are captured and must be absent.

Simulation tests cover versions 1–5, deterministic next seasons and longer replay, single identity after hire/succession, bounded skill growth, cancelled training, no duplicate rewards or event instances, live participants, a dead individual's career petition closing, ancestry integrity, demographic conservation, cause links, and malformed nested imports. Read-only prototype keys, broken references, missing compact identities, bad portrait fields, and damaged event/outcome records are rejected before normal gameplay.

A pull-request workflow validates tests, build and the century script; it produces a downloadable static artifact without publishing Pages. The normal development workflow and reusable environment startup instructions remain dependency-free.

## Implementation boundaries and deferred depth

- The nine fantasy races and eight illustrated Beastfolk species have cultural names and real individual state. Additional animal species can be represented in imported chronicles, with a compatible visual/naming fallback, but they do not yet have their own painted base layers.
- Portrait identity comes from layered painted sources plus generated proportions, eye/jaw morphology, appearance, clothes, adornments and inherited features. Some people share painted facial bases; these are practical hybrid portraits rather than a new photorealistic painting of every NPC. Small SVG adornments intentionally remain stylized.
- The simulation distinguishes named significant people from regional population cohorts. It does not simulate every ordinary resident. Named people's professions, skills, assets and relationships matter; holdings remain abstract property entries rather than a full land-title or inventory market.
- Schools, mills, granaries, crossings, guild apprenticeships, academy recognition and governors are real systems. A city/kingdom currently adds one chartered district and administrative capacity; multi-stage urban zoning, district elections, and a territorial-conquest system are deferred.
- Family ties, heirs, rivals, estates and remembered grievances work. Claims use documented ancestry and personal standing; the game does not yet have configurable dynastic inheritance laws, dowries, divorce litigation or a complete peerage/legal system. Unrecorded ancestry in migrated games is not fabricated.
- NPC agendas and event templates depend on actual state. Stories remain authored combinations with bounded queues/cooldowns. This does not produce unlimited wholly original plots or AI conversations. Major facts/records are retained; personal prose memories, service summaries and recent reports are bounded views.
- Original adventure sites remain unique, including failures. Their named companions now develop and carry injuries. Repeat expeditions, party formation, tactical combat and a detailed personal magic-item inventory are deferred.
- Heavy conflicts are still represented through relationships, decisions, security and military resources; diplomatic disputes have real participants and effects, but there is no tactical warfare layer.
- No deterministic strategy proves complete economic balance for every seed or century. The included native-resource strategy and regression scenarios are reproducible baselines for further playtesting. Browser storage quotas can be lower than the 12 MB import limit; exports remain the long-term backup mechanism.

## Review instructions

Run `npm test`, `npm run build`, and `node scripts/simulate-century.mjs`. Start the game with `npm start`, then use the optional Playwright script described in the README. For a quick manual demonstration, commission a mill or school, examine the actual seasonal report, follow its cause links, mentor a courtier, and explore Lineage's family tree.

Review the behavior and these boundaries before merging or deploying. The existing public play link continues to serve the previous release until that review is complete.
