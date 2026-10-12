# Lineage 0.5.1 enhancement review

This is an unserved review build on `feature/immersion-economy`. The live Pages source remains `feature/living-world`, rooted at the repository root. No Pages configuration, production workflow, served branch or production deployment was changed. Review the branch locally or download the pull request’s `lineage-review-build` artifact. The existing public and isolated-preview links still run 0.5.0.

## Baseline and phases

Before implementation, the live entry and assets, Pages source and deployed branch were inspected. The deployed code at `1ebcee40f1580f1096660619d18252959d688fb1` passed all 94 baseline tests. A real version-five campaign was captured after twelve seasons, institution development and succession in `test/fixtures/version-five-living.json`; it retains original painted portrait recipes and historical records.

1. Narrative and obligations: 101 tests passed. Completed decisions, seasonal reports and Chronicle entries now present prose first, with closed exact ledgers. Promises track actual commissioned work, funded education, deadlines and consequences.
2. Commerce and Treasury: 111 tests passed. All six undertaking types, delegate forecasts, investments, actual receipts, maintenance, expansion, liquidation, private shares, expiry and succession were integrated. The built browser passed Treasury, narrative-outcome, investment, promises and mobile checks.
3. Portraits and world character: 144 painted adult faces, three portrait presentations, family proportions, legacy portrait preservation, six painted places, faction banners, development landmarks, professional achievements, ambitions and historical legacy petitions were added. Same-race galleries exposed face-selection repetition and inappropriate presentation; a second art pass and stricter matching corrected these.
4. Integration and balance: the complete build, migration/replay tests, browser workflows and four century scenarios were checked. Validation commands and final results follow below.

The save schema remains version five. Simulation extensions use revision eight. Older campaigns initialize empty commercial/ambition records without changing people, old portraits or existing history. Narrative and artwork selection use deterministic hashes and do not consume simulation randomness. The game has no network narrative service, credentials or OpenAI API dependency. All assets and mechanics run locally once the static game is available.

## Portrait review

The library contains 24 human paintings, eight for each other humanoid or monstrous race, and eight for each illustrated Beastfolk species. Differences include face and muzzle shape, hair, fur markings, skin, scales, feathers, expression, apparent age, clothing and body presentation. Saved face keys, jaw/eye geometry and proportions persist through loading and succession. Children inherit proportions with small differences and avoid their parents’ base faces when alternatives fit. Adult facial aging preserves the saved face; young children retain the established child atlas.

Matching respects race/species, humanoid presentation, relative lifespan and explicit fur/bald/scar details. Within appropriate choices, deterministic usage balancing reduces repeated base paintings. Naturalistic portraits, framed court paintings and sepia Chronicle treatments use the same recognizable face. A paid portrait commission upgrades legacy artwork explicitly; changing treatment for an already upgraded portrait preserves its painted face.

The following galleries show sixteen generated characters of the same race/species, at profile size, rather than a mixed-race showcase:

- [Fox gallery](review-images/fox-gallery.png)
- [Wolf gallery](review-images/wolf-gallery.png)
- [Human gallery](review-images/human-gallery.png)
- [Dwarf gallery](review-images/dwarf-gallery.png)

Reproduce them with `scripts/portrait-gallery.mjs` and the browser-tool environment variables described in README. Eight genuinely different painted faces appear in the Fox and Wolf galleries; Human uses fourteen and Dwarf seven appropriate faces across ages and presentations. The library is finite: large populations can share painted base features, and arbitrary unillustrated animal heritages use a fallback. Art is stored as local WebP atlases; new gameplay art totals about 4.8 MB. Original saved artwork remains available.

## Narrative and records

Every new decision transition records actual before, after, delta, identity and historical name. Prose distinguishes improvement, deterioration, magnitude, unchanged outcomes, capped values, health recovery and skill mastery. Relationship grievances and fear use the correct direction. Mutual trust between named people is distinguished from trust in the ruler; completed mentorship records the actual course changes. Wording varies by record and identity, deterministically. An older delta-only entry uses its known delta without inventing a historical starting value or threshold crossing.

Numbers remain in state, strategic forecasts, Treasury and expandable exact ledgers. Seasonal reports include meaningful personal and local changes; the permanent seasonal archive retains realm changes while the most recent twelve detailed reports remain available. Founding records, receipts, deaths, generations and causal links remain permanent.

Promises retain their origin, responsible person, deadline, progress, completion and outcome. A missed deadline has a one-time trust consequence recorded from actual values. Education follows funded classes; debts retain actual repayments; a completed founding promise remains completed if the business later deteriorates. Succession does not erase obligations.

## Commercial rules

| Activity               | Base royal capital | Base seasonal upkeep | First outcome | Special constraint                                     |
| ---------------------- | -----------------: | -------------------: | ------------- | ------------------------------------------------------ |
| Caravan                |                 20 |                    1 | Two seasons   | At-risk capital; domestic or named foreign route       |
| Royal estate           |                 30 |                    2 | One season    | Tenants, local productivity and public costs           |
| Marketplace            |                 32 |                    2 | One season    | Requires a settled population; competing trade         |
| Commercial charter     |                 18 |                    1 | One season    | Expires after four operating years                     |
| Foreign agreement      |                 24 |                    1 | One season    | Named neighbor needs trust 50; bounded four-year terms |
| Prospecting expedition |                 26 |                    1 | Three seasons | Uses eight units of a finite surveyed deposit          |

Careful terms add six royal gold for preparation. Shared terms reduce royal capital by six and spend eight from a real proprietor’s personal wealth; private owners receive a fifth of gross receipts. Leaner terms retain base cost and accept greater risk; estates and charters can impose public consequences. Personal shares can be inherited without changing the undertaking’s founder or royal history.

Only one new undertaking can start each season. Towns carry three active holdings, provinces five; a delegate oversees at most two. Duplicate ongoing assets of the same kind/site/partner are blocked. Condition wears, failures worsen it, public hardship reduces trade, competing holdings reduce margins, neglected operations pause, and a dead operator stops work until a living delegate is appointed. A journey settles once. Deposits, bounded charter terms and one-time salvage prevent free repeatable gold.

Maintenance costs ten; expansion costs eighteen and adds upkeep, with two expansions maximum. Delegate replacement costs four. Review is limited to once per undertaking per season. Pausing stops receipts and upkeep; liquidation returns at most a quarter of initial capital adjusted for condition, once. Net return subtracts royal capital, upkeep, maintenance, expansion, replacement and commercial-recovery rulings. Receipt income enters the seasonal budget exactly once. Commercial funding forecasts are estimates, not guarantees.

Ruler ambitions are optional. They count new institutions, new actual graduates, new cooperative neighbors or net commercial return. Each ruler chooses their own purpose; an unfinished predecessor’s purpose remains historical. Fulfillment grants recognition once. Rare petitions remember a fulfilled ambition or an investment that survives its founder, and can establish an actual apprenticeship or commemorate actual workers. Their causes and participant identities are preserved; personal petitions close if their delegate dies.

## Validation results

Commands:

```sh
npm test
npm run build
node scripts/simulate-century.mjs
node scripts/simulate-commerce-century.mjs
# With an independently installed Playwright and Chromium:
node scripts/browser-check.mjs
node scripts/enhancement-browser-check.mjs
node scripts/portrait-gallery.mjs
```

The baseline century scripts start with ordinary resources, use actual choices, repeatedly save/load, and reach year 101 in both scales. They cover three reigns without seasons of empty food stores. Commercial century scenarios also begin with ordinary resources and exercise care, pauses, death, replacement, succession and liquidation.

| Scenario                    | Reigns | Ventures | Successful / failed receipts | Largest seasonal commercial receipt | Net commercial return | Compact save bytes |
| --------------------------- | -----: | -------: | ---------------------------: | ----------------------------------: | --------------------: | -----------------: |
| Town, ordinary baseline     |      3 |        0 |                            — |                                   0 |                     0 |          2,331,085 |
| Province, ordinary baseline |      3 |        0 |                            — |                                   0 |                     0 |          2,419,061 |
| Town, managed commerce      |      3 |        9 |                     333 / 25 |                                  49 |                    24 |          2,763,339 |
| Province, managed commerce  |      3 |       16 |                     404 / 24 |                                  47 |                   173 |          2,861,906 |

These are seeded scenarios, not a proof that every strategy is balanced. They demonstrate bounded income, real costs/losses, profitable maintained operations and multigenerational save continuity. Holdings can become unprofitable; starting resources, skill, public conditions and care matter. Long-run browser storage quotas still vary, so exported chronicles remain useful. No historical identities are discarded to fit storage.

**Final result: 130 tests passed, none failed or skipped. The static build passed. Both browser suites passed without JavaScript errors, and all four century scenarios reached year 101 across three reigns.** Tests cover historical narrative signs/thresholds/caps, old and new portraits, deterministic save replay, commercial budgets and risk, finite deposits and expiry, private ownership, operator death, promises, causal legacies and dynasty continuity. Browser checks cover creation, delegation, reports, hiring, mentorship, Chronicle and family navigation, compact export, old-save migration, Treasury decisions, portrait treatment, ambition links, place/faction art, keyboard dismissal, mobile dashboards and JavaScript errors.

## Review boundaries

This pass adds state-driven authored storytelling, not unlimited procedurally written literature. Illustrated places represent the region’s character; the separate recorded-development view and map markers show actual royal works and investments. Commercial holdings are abstract enterprises rather than detailed supply-chain simulations. Loans remain the existing grain-debt system. Arbitrary new animal species and independent custom paintings for every individual are outside this pass.

No production publication should occur before the user reviews this build. In particular, do not push these changes to `feature/living-world`, `main` or `gh-pages`, and do not change the Pages source as part of review.
