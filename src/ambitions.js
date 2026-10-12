import { appendRecord, snapshot } from './history.js?v=0.5.1';
import { transitionsBetween } from './transitions.js?v=0.5.1';
import { bound, idValid } from './sim-core.js?v=0.5.1';
export const royalAmbitions = {
  builder: {
    name: 'Leave works that outlive my reign',
    description:
      'Found three new enduring institutions and raise infrastructure to at least 65.',
  },
  scholar: {
    name: 'Open learning to lives beyond the court',
    description:
      'See three named pupils graduate after making this commitment.',
  },
  prosperous: {
    name: 'Build prosperity beyond the levy',
    description:
      'Earn 60 gold of additional net commercial return, after capital and upkeep.',
  },
  peacemaker: {
    name: 'Turn wary neighbors into partners',
    description:
      'Bring two new neighboring factions into wholehearted cooperation, with trust of at least 70.',
  },
};
const neighbours = ['goblins', 'gnolls', 'elves', 'bugbears', 'beastfolk'];
export function initAmbitions(g) {
  g.ambitions ||= [];
  g.memorableEvents ||= {};
}
export function declareAmbition(g, kind, source) {
  const a = {
    id: 'ambition-' + g.serial.arc++,
    kind,
    person: g.ruler.id,
    source,
    started: g.turn,
    status: 'active',
    progress: 0,
    baseline: {
      institutions: g.institutions.map((i) => i.id),
      graduates: Object.values(g.people)
        .filter((p) => p.education?.status === 'graduated')
        .map((p) => p.id),
      profit: g.ventures.reduce((n, v) => n + v.profit, 0),
      partners: g.factions
        .filter((f) => neighbours.includes(f.id) && f.trust >= 70)
        .map((f) => f.id),
    },
  };
  g.ambitions.push(a);
  return a;
}
export function tickAmbitions(g) {
  for (const a of g.ambitions.filter((a) => a.status === 'active')) {
    const ruler = g.people[a.person];
    if (!ruler.alive || a.person !== g.ruler.id) {
      a.status = 'unfinished';
      a.ended = g.turn;
      continue;
    }
    const before = snapshot(g);
    let achieved = false;
    if (a.kind === 'builder') {
      a.progress = g.institutions.filter(
        (i) => i.status === 'active' && !a.baseline.institutions.includes(i.id),
      ).length;
      achieved = a.progress >= 3 && g.resources.infrastructure >= 65;
    }
    if (a.kind === 'scholar') {
      a.progress = Object.values(g.people).filter(
        (p) =>
          p.education?.status === 'graduated' &&
          !a.baseline.graduates.includes(p.id),
      ).length;
      achieved = a.progress >= 3;
    }
    if (a.kind === 'prosperous') {
      a.progress = Math.max(
        0,
        g.ventures.reduce((n, v) => n + v.profit, 0) - a.baseline.profit,
      );
      achieved = a.progress >= 60;
    }
    if (a.kind === 'peacemaker') {
      a.progress = g.factions.filter(
        (f) =>
          neighbours.includes(f.id) &&
          f.trust >= 70 &&
          !a.baseline.partners.includes(f.id),
      ).length;
      achieved = a.progress >= 2;
    }
    if (achieved) {
      a.status = 'fulfilled';
      a.ended = g.turn;
      g.resources.legitimacy = bound(g.resources.legitimacy + 3);
      ruler.reputation = bound(ruler.reputation + 5);
      const e = appendRecord(g, {
        kind: 'royal-milestone',
        cause: a.source,
        people: [ruler.id],
        text:
          ruler.name +
          ' fulfills a personal ambition: ' +
          royalAmbitions[a.kind].name.toLowerCase() +
          '. The realm has changed in ways that can be traced through actual works and lives.',
        transitions: transitionsBetween(before, g),
      });
      a.result = e.id;
      ruler.achievements.push({
        kind: 'royal ambition',
        turn: g.turn,
        source: e.id,
      });
    }
  }
}
export function ambitionsValid(g) {
  return (
    Array.isArray(g.ambitions) &&
    g.memorableEvents &&
    typeof g.memorableEvents === 'object' &&
    !Array.isArray(g.memorableEvents) &&
    new Set(g.ambitions.map((a) => a.id)).size === g.ambitions.length &&
    Object.values(g.memorableEvents).every((v) => typeof v === 'boolean') &&
    g.ambitions.every(
      (a) =>
        a &&
        idValid(a.id) &&
        royalAmbitions[a.kind] &&
        g.people[a.person] &&
        g.archive.some((e) => e.id === a.source) &&
        Number.isInteger(a.started) &&
        Number.isFinite(a.progress) &&
        a.progress >= 0 &&
        (!a.result || g.archive.some((e) => e.id === a.result)) &&
        ['active', 'fulfilled', 'unfinished'].includes(a.status) &&
        a.baseline &&
        ['institutions', 'graduates', 'partners'].every(
          (k) =>
            Array.isArray(a.baseline[k]) &&
            a.baseline[k].every((x) => typeof x === 'string'),
        ) &&
        Number.isFinite(a.baseline.profit),
    )
  );
}
