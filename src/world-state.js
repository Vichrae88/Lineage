import { initSeasonal, seasonalValid } from './seasonal.js?v=0.5.5';
import { initCourtWork, courtWorkValid } from './court-initiatives.js?v=0.5.5';
import { initDilemmas, dilemmasValid } from './dilemmas.js?v=0.5.5';
import { initAmbitions, ambitionsValid } from './ambitions.js?v=0.5.5';
import { initCommerce, commerceValid } from './commerce.js?v=0.5.5';
import { initPromises, promisesValid } from './promises.js?v=0.5.5';
import { worldReferencesValid } from './integrity.js?v=0.5.5';
import { initDynasty, dynastyValid } from './dynasty.js?v=0.5.5';
import {
  initializeDemographics,
  demographicValid,
} from './demographics.js?v=0.5.5';
import { initializePortraits, portraitsValid } from './portraits.js?v=0.5.5';
import { initEmergent } from './emergent.js?v=0.5.5';
import { initializeKnownFigures } from './living.js?v=0.5.5';
import { canonicalizePeople, charactersValid } from './characters.js?v=0.5.5';
import { sites, factionLore, expeditions, relics } from './data.js?v=0.5.5';
import { initHistory, historyValid } from './history.js?v=0.5.5';
import { initSettlements, developmentProjects } from './settlements.js?v=0.5.5';
import { personList, hash, idValid } from './sim-core.js?v=0.5.5';
export function initializeWorld(g, projects) {
  g.preparedIdentities ??= Boolean(g.storyDeck);
  g.world ||= {
    sites: structuredClone(sites),
    factionLore: structuredClone(factionLore),
    expeditions: structuredClone(expeditions),
    relics: structuredClone(relics),
    projects: structuredClone(projects),
    projectReports: {},
    river: 'Alder River',
    predominantRace: g.ruler.race,
  };
  for (const p of developmentProjects)
    if (!g.world.projects.some((old) => old.id === p.id))
      g.world.projects.push(structuredClone(p));
  g.kin ||= [];
  g.notables ||= [];
  g.futurePeople ||= [];
  canonicalizePeople(g);
  g.simulationVersion = Math.max(g.simulationVersion || 0, 10);
  initEmergent(g);
  g.obligations ||= [];
  for (const p of personList(g)) {
    p.alive ??= true;
    p.wealth ??= 8 + (hash(p.id) % 28);
    p.id ||= 'sovereign';
  }
  initHistory(g);
  initSettlements(g, g.world.sites);
  initializeKnownFigures(g);
  initDynasty(g, Boolean(g.newDynasty));
  delete g.newDynasty;
  initializeDemographics(g);
  initializePortraits(g);
  initPromises(g);
  initCommerce(g);
  initAmbitions(g);
  initDilemmas(g);
  initSeasonal(g);
  initCourtWork(g);
  g.version = 5;
  return g;
}
export function worldStateValid(g) {
  if (
    g.portraitPresentation !== undefined &&
    !['natural', 'formal', 'chronicle'].includes(g.portraitPresentation)
  )
    return false;
  if (g.simulationVersion >= 10 && (!seasonalValid(g) || !courtWorkValid(g)))
    return false;
  if (g.simulationVersion >= 9 && !dilemmasValid(g)) return false;
  if (g.simulationVersion >= 8 && !ambitionsValid(g)) return false;
  if (g.simulationVersion >= 7 && !commerceValid(g)) return false;
  if (g.simulationVersion >= 6 && !promisesValid(g)) return false;
  if (g.simulationVersion >= 5 && !dynastyValid(g)) return false;
  if (g.simulationVersion >= 4 && (!demographicValid(g) || !portraitsValid(g)))
    return false;
  if (
    g.simulationVersion >= 3 &&
    (!g.eventMemory ||
      !g.eventMemory.templates ||
      Array.isArray(g.eventMemory.templates) ||
      !g.eventMemory.subjects ||
      Array.isArray(g.eventMemory.subjects) ||
      !g.eventMemory.fingerprints ||
      Array.isArray(g.eventMemory.fingerprints) ||
      !Array.isArray(g.obligations) ||
      g.obligations.some(
        (o) =>
          !o ||
          !Number.isInteger(o.due) ||
          !Number.isFinite(o.amount) ||
          o.amount < 0 ||
          !g.archive.some((e) => e.id === o.source),
      ))
  )
    return false;
  if (g.simulationVersion >= 2 && !charactersValid(g)) return false;
  if (
    !g.serial ||
    !['record', 'fact', 'institution', 'arc', 'event', 'person'].every(
      (k) => Number.isInteger(g.serial[k]) && g.serial[k] >= 0,
    )
  )
    return false;
  if (
    !Array.isArray(g.archive) ||
    !g.facts ||
    Array.isArray(g.facts) ||
    !Array.isArray(g.institutions) ||
    !g.settlements ||
    Array.isArray(g.settlements) ||
    !Array.isArray(g.reports) ||
    !historyValid(g)
  )
    return false;
  if (
    Object.entries(g.settlements).some(
      ([id, s]) =>
        !s ||
        id !== s.id ||
        !idValid(id) ||
        typeof s.name !== 'string' ||
        ![
          'population',
          'prosperity',
          'infrastructure',
          'health',
          'security',
          'trade',
          'foodProduction',
        ].every((k) => Number.isFinite(s[k]) && s[k] >= 0) ||
        !['problems', 'institutions', 'residents', 'families', 'history'].every(
          (k) =>
            Array.isArray(s[k]) && s[k].every((x) => typeof x === 'string'),
        ),
    )
  )
    return false;
  if (
    g.institutions.some(
      (i) =>
        !i ||
        !idValid(i.id) ||
        ![
          'bridge',
          'mill',
          'school',
          'academy',
          'apprenticeship',
          'granary',
          'watch',
        ].includes(i.kind) ||
        !g.settlements[i.site] ||
        typeof i.name !== 'string' ||
        !Number.isFinite(i.budget) ||
        i.budget < 0 ||
        i.budget > 100 ||
        !Number.isFinite(i.condition) ||
        !Number.isFinite(i.quality) ||
        !['active', 'closed', 'ruined'].includes(i.status) ||
        !Array.isArray(i.students) ||
        !Array.isArray(i.staff),
    )
  )
    return false;
  if (
    g.reports.length > 12 ||
    g.reports.some(
      (r) =>
        !r ||
        typeof r.id !== 'string' ||
        !Number.isInteger(r.turn) ||
        !r.changes ||
        typeof r.changes !== 'object' ||
        Object.values(r.changes).some((v) => !Number.isFinite(v)),
    )
  )
    return false;
  if (g.simulationVersion >= 5 && !worldReferencesValid(g)) return false;
  return true;
}
