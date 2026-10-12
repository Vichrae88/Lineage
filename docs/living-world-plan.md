# Living world iteration — review branch

The specification is implemented on feature/living-world. Do not push this branch to main or publish its build before review; the production site stays at 0.4.0.

The audit found usable seeded generation, seasonal progression, court commissions, audience queues, permanent story-instance registries, and migrations from versions 1–4. Missing foundations are structured causes, actual local institutions, personal capabilities and resources, individual identity across arrays and succession, and opportunities after the initial deck.

Implementation order:
1. Add permanent decision records and facts, local consequences, institutions, a complete mill story, shared economic calculations, projections and actual seasonal reports. Bump the save schema to 5, preserving known older state.
2. Add one canonical person registry, attributes and meaningful traits, professional forecasts, bounded practice, personal resources, timed training and mentorship. Integrate the same resolver into commissions and council forecasts.
3. Tick major and secondary NPCs at different frequencies; create incidents from actual shortages, careers, relations and established facts. Bound active arcs and queues, and distinguish unique instances from recurring templates.
4. Add stable hybrid portrait recipes around the existing illustrated assets, minority representation, regional population cohorts and migration.
5. Preserve parents, siblings, partners, descendants and reigns; connect succession, family grievances, inheritance, settlements and realm promotion to the archive.
6. Verify real workflows, old migrations, deterministic replay, mixed communities, three rulers, economic balance and a century of play. Document the implemented scope and remaining limitations.

Architecture: focused browser ES modules; no framework or backend. The existing game module remains the compatibility facade. New modules own histories, settlements, character development, emergent situations and presentation. Historical facts use stable references; recent prose is a view of that history. Saves may store compact identity references and remain importable from earlier releases.

Risks to check: duplicate identities when hiring or inheriting, double-applied rewards, dead speakers, growing event backlogs, incorrect food projections, training exploits, historical references lost during migration, and oversized saves. Each checkpoint must build and pass meaningful tests before work continues.
