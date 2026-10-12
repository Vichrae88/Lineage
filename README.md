# Lineage

A seasonal fantasy roleplaying game about ruling a realm and the people who make it live. [Play the current release](https://vichrae88.github.io/Lineage/).

**This branch contains the 0.5.2 portrait polish revision for review.** It removes drawn-on portrait accessories, gives the seven non-lizard Beastfolk heritages painted hair, and displays the release number in the upper-right corner. See [the portrait review](docs/portrait-polish-review.md) for screenshots and validation. The live Pages source remains `feature/immersion-economy` on 0.5.1; this revision is on `feature/portrait-polish` and has not been deployed. The [isolated preview](https://vichrae88.github.io/Lineage/?preview=1) keeps separate browser-save slots.

## Develop

Node.js 20+ is sufficient; development and production have no runtime dependencies or service credentials.

```sh
npm start
npm test
npm run build
node scripts/simulate-century.mjs
node scripts/simulate-commerce-century.mjs
```

The development server uses port 3000 (`PORT` overrides it). The build creates a clean static game in `dist/`, including every browser module and the local artwork. The simulation tests include production saves from versions 1–5 and full/compact version-5 round trips. The century script uses ordinary starting resources and actual decisions; it prints population, finances, reigns, petition counts, save size, and elapsed time.

Browser checks are optional and require Playwright and a Chromium installation. They do not add a runtime dependency to the game:

```sh
# Install browser tooling separately, then run with the development server running.
npm install --prefix /tmp/lineage-browser --no-save playwright
LINEAGE_PLAYWRIGHT_MODULE=/tmp/lineage-browser/node_modules/playwright/index.mjs \
LINEAGE_CHROMIUM=/usr/bin/chromium \
node scripts/browser-check.mjs
```

Set `LINEAGE_URL` for a different server or built-game address. Alternatively, an existing local Playwright installation can be used without the module-path override; Playwright's own browser can be used without `LINEAGE_CHROMIUM`.

## Begin and govern a reign

Seven questions establish realm size, identity, race, gender, age, disposition, appearance, values, and the claim to the throne. Names may be generated. Choose a town for gentler pressures or a province for a larger administration. No parent survives the accession, but family records can include remembered ancestors and surviving siblings, aunts, uncles, and cousins.

The predominant people form a majority alongside real minorities. Regional censuses vary, and welcoming migrations change them. Beastfolk include fox, wolf, cat, owl, bear, rabbit, otter, and lizard heritages. The ruler may choose their own heritage without making the court uniform. Each person has a saved portrait recipe: painted faces, individual proportions and facial features, clothing, adornments, age, and inherited family features.

A skippable guide introduces audiences, delegation, the calendar, the dynasty, and saving. Court members and other visitors bring illustrated petitions to the throne. A pending ruling pauses the season and offers an affordable course. Direct commissions and edicts are also available through the council desk. Six main chapters, including Treasury, the resource bar, and an interactive map keep the realm within reach, including on mobile.

The opening deck has 52 unique issues and their aftermaths. After those stories, new petitions arise from actual shortages, deteriorating buildings, rivalries, careers, workshops, graduates, family grievances, foreign disputes, displaced claimants, and local initiatives. Each instance has a unique identity; template and participant cooldowns prevent immediate repetition. Completed instances and rewards stay completed after loading or succession. A historical letter can be delivered by a living representative; an individual's career petition closes if they die.

## New in the review build

Completed rulings, seasonal reports and Chronicle changes lead with deterministic prose based on actual before-and-after state. Expand the clerk’s ledger for exact values. Strategic forecasts remain quantitative. Promises & obligations, available from Treasury and the save menu, track commitments, education, returning ventures and debts across rulers.

Treasury offers caravans, royal estates, marketplaces, commercial charters, foreign agreements and finite prospecting expeditions. Choose a delegate and royal, shared or riskier terms. Upkeep, condition, security, relationships, public hardship, competition and limited administrative capacity affect returns. Maintain, expand, pause, liquidate or change a delegate through decisions; investments, private ownership and historical receipts survive succession.

New campaigns use 144 additional painted faces with saved facial proportions and inherited family features. Formal, naturalistic and illustrated Chronicle treatments preserve the face. Existing saves retain their original portraits; commissioning a painting upgrades an old portrait deliberately. Places have painted scenes and visible recorded development; factions have distinct banners. Profiles highlight actual professional milestones. The dynasty page offers optional personal ambitions, with later petitions arising from fulfilled ambitions and commercial legacies.

## People, places, and consequences

Hire, transfer, cultivate, train, mentor, reward, or dismiss retainers through their profiles. Six attributes, fifteen skills, meaningful traits, equipment, health, morale, loyalty, reputation, connections, and office affect professional work. Recruitment produces actual soldiers; a magnetic captain recruits differently from an otherwise comparable captain. Forecasts explain suitability. Actual reports preserve the assessment and result. Practice takes time, is limited within a season, and slows near mastery. Mentorship reserves both people's time and develops their relationship.

Named people own wealth, income, property, equipment, goals, personal relationships, achievements, and memories. They invest, form bonds and rivalries, marry, have children, leave royal service, and die independently. Major people are updated each season; secondary adults take turns pursuing their agendas. The broader population uses regional cohorts rather than one object for every resident.

Projects create local institutions and changes. A mill changes food production and work, creates a later community ruling, and leaves a legacy. Schools and apprenticeships educate named pupils. Graduates can enter service, teach, or pursue their own careers. A maintained school becomes an academy after twenty years. Buildings have upkeep and condition; closing them stops their work while preserving their founding history.

The seasonal forecast and actual report distinguish income, wages, institution/watch costs, food consumption, harvest, spoilage, counsel, and other outcomes. Unpaid commitments reduce wages and damage institutions. Taxation, justice, rites, local prosperity, capacity, and migration shape the realm. Towns can become cities and provinces kingdoms, creating a populated chartered district, larger courts, additional commission capacity, and governorship decisions.

Adventuring companies retain named companions with their own abilities and identities. Missions reserve their time; outcomes give them experience, wealth, reputation, and injuries. Unique discoveries can strengthen the realm, be returned to their keepers, or sold. Expeditions close after success or failure.

## The crown and the Chronicle

The interactive family register connects actual parents, siblings, partners, and children, including the dead. Each reign remains recorded. An heir inherits their own identity, traits, abilities, portrait, relationships, and biography. Estates transfer actual wealth and holdings. A contested ascension names a real rival and permits compromise, enforcement, ratification, or recognition of that rival. Displaced heirs and prominent families can bring old grievances into later reigns.

Decisions save automatically in the browser. Chronicle provides load, export, import, a previous-campaign backup, and a filterable permanent archive. Filter by ruler, person, place, family, faction, kind, or year; follow links between causes and consequences. Recent prose and seasonal reports are bounded views, while major records and facts remain available across reigns.

Compact version-5 saves store each individual once and refer to that identity from household lists. Imports accept earlier production schemas and validate nested data and references. Older campaigns retain known people, names, locations, pending work, and history. Unknown ancestry is left unrecorded. Browser storage quotas vary: export important chronicles to keep a backup outside the browser. Imports have a 12 MB limit.

## Review and publication

The production Pages workflow publishes on `main`. The directly served branch is currently `feature/immersion-economy`; this review branch is `feature/portrait-polish` and is not served. Keep both production sources unchanged until review. The separate pull-request workflow runs tests, builds, checks a century of play, and provides a downloadable build for review. Merge or production publication requires the user's review first.

The current public release remains [vichrae88.github.io/Lineage](https://vichrae88.github.io/Lineage/). All assets use relative paths under `/Lineage/`.

## Current limits

Stories use authored, state-driven building blocks rather than an AI narrative service. Templates can recur in different circumstances; completed event instances cannot. Portraits use a finite painted face library with saved facial proportions and family features. Large populations can share a base painting; each person does not have independently painted art. Eight animal heritages are illustrated. Personal holdings are abstract assets, regional administration is lightweight, and adventuring is resolved through decisions rather than tactical combat. See the review report for further details.
