# Lineage
A seasonal fantasy roleplaying game about ruling a realm and the people who make it live. Play at https://vichrae88.github.io/Lineage/.

## Develop
Node.js 20+ is sufficient. There are no runtime packages, external fonts, or service credentials.
```sh
npm start
npm test
npm run build
```
The development server uses port 3000 (`PORT` overrides it). `npm run build` creates a clean static release in `dist/`, including the local fantasy artwork. The test suite exercises decision consequences, succession, court management, recurring edicts, expeditions, follow-up audiences, and save migration.

## Play
Choose town or province first, establish your ruler, then take the throne. The simplified council desk offers five chapters: Council, Court, Realm, Adventures, and Lineage. The main view keeps governing choices, a compact resource bar, and the realm map close at hand. Save, load, export, import, and the full chronicle are grouped under the Chronicle menu. Click a portrait, faction, family, resource, or map location to read its dossier. Hover over a narrative assessment for its precise value; the clerk’s ledger keeps exact resource figures available without turning the dashboard into a spreadsheet.

Each governing action offers different courses with narrated tradeoffs. Commissions are resolved by a chosen councillor’s capability, office, loyalty, rivalries, and resistance among the people affected. Three commissions can run in one season, with one charge per person. Court biographies include origins, traits, hopes, fears, family, faith, skills, relationships, confidences, and memories. Personal audiences, office transfers, recruitment terms, and dismissals change those relationships. Former retainers remain in the archive. New petitioners replenish recruitment as the realm ages.

The realm tracks public health, learning, ecology, justice, faith, food, population, authority, defense, trade, infrastructure, and treasury. Recurring tax, justice, and religious policies affect subsequent seasons. Families have influence, cohesion, fortune, and standing; factions have trust, respect, affection, fear, commerce, grievances, and alliances. Some neighboring factions have their own evolving ties. Named court audiences, personal concerns, and distinct delayed follow-up letters ask for judgments with consequences. Unique stories occur once per campaign, including across save/load and succession. Once the authored stories are exhausted, seasonal governance, relationships, court recruitment, and succession continue. The game never recycles an old event to fill a quiet season. A required audience always offers an answer without a treasury expense.

Adventuring companies have named companions, stories, capability, caution, loyalty, reputation, and wounds. Hire them for a prepared, respectful, or daring expedition into a sanctuary, ancient woodland, watchtower, or wyvern threat. They return after one or two seasons. Success can bring a magical relic; decide whether to retain its recurring benefit, honor its original keepers, or sell it. Failed expeditions affect recovery time and patronage. Each unique expedition closes after its outcome, including failure; its recorded result remains in the realm’s history. Contracts cannot repeat a closed expedition or reserve a company already away.

Cultivate trust and affection before proposing marriage. Children can be named; any living adult household member can be appointed heir. The ruler and courtiers age, sicken, and die. A succession may be peaceful, challenged by noble houses, or decided by the council when no heir is eligible. Growth into a city or kingdom has visible requirements in the realm report. There is no prescribed victory condition.

## Beastfolk
Beastfolk represent anthropomorphic animals of every species, including furred, feathered, scaled, and aquatic heritages. During character creation choose Beastfolk, then pick a suggested species or type any animal species of your own. Animal heritage is kept in profiles, saves, children, and succession; it does not prescribe personality or abilities. Four recruits—Rowan Vell (fox), Fen Greywood (wolf), Nima Softstep (cat), and Ivo Nightquill (owl)—have their own biographies, portraits, skills, and convictions. The Manyfold Assembly has tracked relationships and a unique citizenship petition with a distinct aftermath.

## Saves
Manual saves and decision autosaves use browser local storage. Export/import JSON to back up or transfer a chronicle; there is no cloud account. Version-one and version-two saves migrate their existing progress, pending commissions, household, and relationships into version three. Old audience history, prior cooldown records, pending letters, completed expeditions, and surviving chronicle entries establish which unique stories have already occurred. Duplicate queued copies are removed. Stories absent from all surviving old records cannot be reconstructed. Do not clear browser storage before exporting a save you want to keep.

## Publish
The repository’s Pages source is **Deploy from a branch → gh-pages → / (root)**. The workflow tests and builds every push to `main`, then updates the generated `gh-pages` branch without a force push and explicitly requests a Pages build. From a prepared local checkout with authorized Git access, `bash scripts/publish-pages.sh` publishes an already built release. The source checkout and its normal index remain untouched by that script. GitHub’s branch Pages build activates the public site. All asset paths are relative for the `/Lineage/` project path.

## Current scope
The simulation has authored stories, branching approaches, persistent memories, follow-up letters, and generation of new petitioners. It does not yet generate an unlimited narrative world, animate tactical combat, model a separate army campaign, or simulate every individual in the population. Portraits and landscapes are generated realistic fantasy artwork, stored locally in two image atlases; different adventuring leaders share some portrait art with court characters. Family rosters and location histories are authored, while family fortunes and relationships evolve in play.
