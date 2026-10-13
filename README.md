# Lineage

A seasonal fantasy roleplaying game about ruling a realm and the people who make it live. [Play the current release](https://vichrae88.github.io/Lineage/).

**This branch contains Lineage 0.5.4 for review.** Petitions now weigh consent, duty, truth, livelihoods and survival, with real personal and political costs. Advisors bring conflicting convictions; dangerous rulings can injure people, cost lives and leave obligations for later rulers. See [the moral dilemma review](docs/moral-dilemmas-review.md) for examples, screenshots, tests and compatibility details. The parchment interface and whole-coin presentation from 0.5.3 remain. GitHub Pages still serves `feature/immersion-economy` on 0.5.1; `feature/moral-dilemmas` is an unserved review branch. The [isolated preview](https://vichrae88.github.io/Lineage/?preview=1) runs the public release with separate save slots.

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

Browser checks require Playwright and a Chromium installation and run in the pull-request review workflow. They do not add a runtime dependency to the game:

```sh
# Install browser tooling separately, then run with the development server running.
npm install --prefix /tmp/lineage-browser --no-save playwright
LINEAGE_PLAYWRIGHT_MODULE=/tmp/lineage-browser/node_modules/playwright/index.mjs \
LINEAGE_CHROMIUM=/usr/bin/chromium \
node scripts/browser-check.mjs
# With the same environment settings, also run:
node scripts/council-visual-check.mjs
node scripts/moral-browser-check.mjs
node scripts/enhancement-browser-check.mjs
node scripts/portrait-polish-check.mjs
```

Set `LINEAGE_URL` for a different server or built-game address. Alternatively, an existing local Playwright installation can be used without the module-path override; Playwright's own browser can be used without `LINEAGE_CHROMIUM`.

## Begin and govern a reign

Seven questions establish realm size, identity, race, gender, age, disposition, appearance, values, and the claim to the throne. Names may be generated. Choose a town for gentler pressures or a province for a larger administration. No parent survives the accession, but family records can include remembered ancestors and surviving siblings, aunts, uncles, and cousins.

The predominant people form a majority alongside real minorities. Regional censuses vary, and welcoming migrations change them. Beastfolk include fox, wolf, cat, owl, bear, rabbit, otter, and lizard heritages. The ruler may choose their own heritage without making the court uniform. Each person has a saved portrait recipe: painted faces, individual proportions, apparent age, and inherited family features. Clothing and hair belong to the paintings rather than added overlays.

A skippable guide introduces audiences, delegation, the calendar, the dynasty, and saving. Court members and other visitors bring illustrated petitions to the throne. A pending ruling pauses the season and offers an affordable course. Direct commissions and edicts are also available through the council desk. Six main chapters, including Treasury, the resource bar, and an interactive map keep the realm within reach, including on mobile.

Living, serving advisors offer recommendations grounded in affordable choices, current needs, professional expertise, convictions, and faction ties. They can disagree, and their advice never consumes a simulation roll. Gold is displayed to the nearest whole coin; saved accounts retain their precision. Optional strategic forecasts and detailed ledgers remain available.

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

## Decisions and their aftermath

New campaigns have 36 opening dilemmas with distinct choices about rights, obligations and risk. A flooded estate, an infected workshop, a missing scout and an ill veteran ask different questions. Costlier answers can damage trust, consent or legitimacy; free answers can preserve livelihoods while leaving people in danger. Food reserves, watch strength and existing relationships can also limit a ruling.

A named courtier carries dangerous work and remains occupied until the report arrives. Their actual skill and loyalty, public conditions and sometimes royal reputation affect a bounded chance of harm. Reports record civilian losses and actual injuries or deaths. A death uses the existing inheritance, family and office systems. Reading advice or reloading does not reroll an outcome.

The aftermath presents a further issue-specific choice. Important pledges enter Promises & obligations; honoring an unrelated bargain does not fulfill a promise to restore a veteran’s command or return a fever household’s freedom. Dead officers can be memorialized, and surviving veterans can become actual teachers. Five living-world pressures—hunger, damaged institutions, frontier disputes, succession claims and court rivalries—also carry moral stakes while retaining their original debt, ownership and relationship mechanics. Other strategic decisions retain their existing systems.

Earlier saved petitions keep their recorded choices and prices. Newly generated living-world issues use the new rules. Court responses, undertakings, losses and causes remain in version-5 saves and the Chronicle across reigns.

## Review and publication

The production Pages workflow publishes on `main`. The directly served branch is currently `feature/immersion-economy`; this review branch is `feature/moral-dilemmas` and is not served. Keep both production sources unchanged until review. The separate pull-request workflow runs tests, builds, checks a century of play, and provides a downloadable build for review. Merge or production publication requires the user's review first.

The current public release remains [vichrae88.github.io/Lineage](https://vichrae88.github.io/Lineage/). All assets use relative paths under `/Lineage/`.

## Current limits

Stories use authored, state-driven building blocks rather than an AI narrative service. Templates can recur in different circumstances; completed event instances cannot. Portraits use a finite painted face library with saved facial proportions and family features. Large populations can share a base painting; each person does not have independently painted art. Eight animal heritages are illustrated. Personal holdings are abstract assets, regional administration is lightweight, and adventuring is resolved through decisions rather than tactical combat. See the review report for further details.
