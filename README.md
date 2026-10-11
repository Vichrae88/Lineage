# Lineage
A playable browser prototype of a seasonal fantasy dynasty simulator. No runtime dependencies; Node.js 20+ is sufficient.

## Run
```sh
npm start
```
Open the server on port 3000 in your browser. `PORT` can override the port. Run `npm test` for simulation checks.

Choose town or province first, then establish your ruler and ascend. Commission up to three projects per season, each assigned to a different living councillor. Skill and loyalty affect outcomes. Cultivate and recruit court members, negotiate with factions and neighboring peoples, marry, name children and designate an adult heir. Resolve petitions before advancing. Growth into a city or kingdom requires the thresholds displayed on the dashboard. There is no prescribed victory condition.

Saves live in this browser's local storage. End-season autosaves supplement the manual Save button. Export/import JSON to transfer or back up games; browser storage is not a cloud account. All app assets work without external services and use local font fallbacks.

This first version includes a deterministic simulation, court growth and mortality, relationships between founding courtiers, multiple faction relationship metrics, seasonal food and treasury pressures, courtship, children, and peaceful or disputed succession. The map selects regional information. It does not yet model territorial conquest, tactical battles, editable settlements, a full genealogical editor, or procedurally generated worlds. Values guide roleplay in this version; history affects initial legitimacy. Cross-species marriage and children are deliberately unrestricted.

## GitHub Pages
`npm run build` assembles the dependency-free browser game in `dist/`. Asset paths are relative so the game works under `/Lineage/`. The Pages workflow tests, builds, and deploys pushes to `main`. Repository Settings → Pages must use **GitHub Actions** as the source. No Node server is deployed; GitHub serves the static build.
