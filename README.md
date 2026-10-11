# Lineage

A seasonal fantasy roleplaying game about ruling a realm and the people who make it live. [Play Lineage](https://vichrae88.github.io/Lineage/).

## Develop

Node.js 20+ is sufficient. There are no runtime packages, external fonts, or service credentials.

```sh
npm start
npm test
npm run build
```

The development server uses port 3000 (`PORT` overrides it). The build creates a clean static release in `dist/`, including all four local artwork atlases. Tests cover generated campaigns, persistent unique stories, decisions, delegation, court management, families, succession, expeditions, and saves from versions 1–4. The version-three fixtures preserve real earlier campaigns for compatibility checks.

## Begin a reign

Choose town or province first, then establish your name, race, gender, age, disposition, appearance, values, and claim to the throne through seven questions. Names and realm names may be left blank for generation. Your ruler has a full profile, and starts with two to five surviving siblings, aunts, uncles, or cousins. No parent survives the accession. Adult relatives can be cultivated and named as heirs.

Every new campaign draws its own seed. It generates the court, recruitment candidates, later arrivals, family members, faction representatives, prominent families, adventuring companions, location names and histories, rumors, relics, and the initial event deck before play begins. Names draw from the person’s fantasy culture or animal species. Biography details, dispositions, talents, ambitions, appearance, faith, and relationships vary. Future recruits and children draw identities from a reserve generated at campaign start. The seed, world, event order, future identities, and subsequent simulation state are stored together in the save.

Choosing Beastfolk automatically makes the starting court and recruitment roster Beastfolk with varied animal heritages. There is no species selector. Current illustrated heritages include fox, wolf, cat, owl, bear, rabbit, otter, and lizard. Neighboring communities include humans, elves, dwarves, halflings, orcs, goblins, gnolls, bugbears, and Beastfolk.

A short, skippable ruler’s guide introduces the court, leads into an actual first petition, explains its consequences and the seasonal calendar, and introduces family, heirs, and saving. Reopen it through Chronicle whenever needed.

## Govern through audiences

Courtiers, petitioners, ambassadors, guild representatives, applicants, and adventuring captains bring illustrated audiences directly to the throne. Choose a ruling in the popup; commissions and adventure contracts also let you choose a delegate there. A speaker’s name opens their profile and returns you to the same audience. Pending rulings pause the season and always offer a course without a treasury expense. Closing the season brings further visitors automatically.

The initial deck contains 49 distinct issues: 36 incident archetypes, six commissions, three recruitment offers, and four adventure proposals. Each is assembled with generated people, local names, flavor, and campaign context, then shuffled before play. Incident choices can produce one of three precomputed, distinct aftermath letters two seasons later. Unique chapters never recur, including after saving, loading, or inheriting the crown. Successful and failed expeditions both close their chapter. When this finite story deck is exhausted, the simulation continues without recycling incidents.

The council desk has five chapters: Council, Court, Realm, Adventures, and Lineage. The compact resource bar and interactive map remain nearby. Optional direct commissions and edicts sit in a collapsed council section. Click a person, faction, family, resource, or location for a dossier. Narrative assessments expose exact values on hover, and resource reports include a ledger.

Court members can be hired, transferred, cultivated, and dismissed. Their capability, office, loyalty, rivalries, and local resistance affect commissions. Three commissions can run in a season, with one charge per person. Biographies include origins, traits, hopes, fears, family, faith, confidences, skills, bonds, and memories. Former retainers remain in the archive; recruitment can replenish as the realm ages.

Public health, learning, ecology, justice, faith, food, population, authority, defense, trade, infrastructure, and treasury evolve with seasonal decisions. Tax, justice, and religious edicts recur. Families track influence, cohesion, fortune, and standing; factions track trust, respect, affection, fear, commerce, grievances, and alliances. Companies track capability, caution, loyalty, reputation, and wounds. Expedition discoveries may strengthen the realm, be returned to their keepers, or be sold.

Cultivate trust and affection before proposing marriage. Children can be named. Any eligible adult household member may inherit. Rulers and courtiers age, sicken, and die; succession can be peaceful, contested, or decided by the council. Towns can grow into cities and provinces into kingdoms. There is no prescribed victory condition.

## Keep a chronicle

Decisions save automatically in this browser. Chronicle offers save, load, JSON export, and JSON import. Starting a new campaign keeps a separate previous-campaign backup; restore it through Chronicle. Export important chronicles to keep them outside this browser.

Older saves retain their existing people, locations, event history, and progress. Start a new campaign to receive the generated world, starting family, expanded ruler creation, and first-reign tutorial.

## Publish

The repository’s Pages source is **Deploy from a branch → gh-pages → / (root)**. Every push to `main` runs tests, builds the game, updates `gh-pages` without a force push, and explicitly requests a Pages build. `bash scripts/publish-pages.sh` can publish an already built release from an authorized local checkout, without changing the source checkout or its normal index. All asset paths are relative for `/Lineage/`.

## Current scope

Campaign generation uses authored narrative building blocks and a finite set of unique incident archetypes. It runs entirely in the browser without an AI service. The simulation does not generate unlimited distinct incident plots, animate tactical combat, or model every individual in the population. Realistic fantasy portraits and context scenes are stored locally; people of the same illustrated heritage may share portrait artwork.
