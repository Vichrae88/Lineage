# Lineage

A seasonal fantasy roleplaying game about ruling a realm and the people who make it live. [Play the current release](https://vichrae88.github.io/Lineage/).

**This branch contains the 0.5.0 living-world iteration for review. GitHub Pages now serves the feature branch for testing. [Test the isolated preview](https://vichrae88.github.io/Lineage/?preview=1); it uses separate browser-save slots.** See [the implementation report](docs/living-world-review.md) for scope, evidence, and limitations.

## Develop

Node.js 20+ is sufficient; development and production have no runtime dependencies or service credentials.

```sh
npm start
npm test
npm run build
node scripts/simulate-century.mjs
```

The development server uses port 3000 (`PORT` overrides it). The build creates a clean static game in `dist/`, including every browser module and the local artwork. The simulation tests include production saves from versions 1–4 and full/compact version-5 round trips. The century script uses ordinary starting resources and actual decisions; it prints population, finances, reigns, petition counts, save size, and elapsed time.

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

A skippable guide introduces audiences, delegation, the calendar, the dynasty, and saving. Court members and other visitors bring illustrated petitions to the throne. A pending ruling pauses the season and offers an affordable course. Direct commissions and edicts are also available through the council desk. Five main chapters, the resource bar, and an interactive map keep the realm within reach, including on mobile.

The opening deck has 52 unique issues and their aftermaths. After those stories, new petitions arise from actual shortages, deteriorating buildings, rivalries, careers, workshops, graduates, family grievances, foreign disputes, displaced claimants, and local initiatives. Each instance has a unique identity; template and participant cooldowns prevent immediate repetition. Completed instances and rewards stay completed after loading or succession. A historical letter can be delivered by a living representative; an individual's career petition closes if they die.

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

The production Pages workflow still publishes only `main`; pushes to this feature branch do not deploy it. The separate pull-request workflow runs tests, builds, checks a century of play, and provides a downloadable build for review. Merge or production publication requires the user's review first.

The current public release remains [vichrae88.github.io/Lineage](https://vichrae88.github.io/Lineage/). Production uses `gh-pages` with relative asset paths under `/Lineage/`.

## Current limits

Stories use authored, state-driven building blocks rather than an AI narrative service. Templates can recur in different circumstances; completed event instances cannot. Portraits use shared painted source layers with generated individual composition and facial changes, rather than independently painted art for every person. Eight animal heritages are illustrated. Personal holdings are abstract assets, regional administration is lightweight, and adventuring is resolved through decisions rather than tactical combat. See the review report for further details.
