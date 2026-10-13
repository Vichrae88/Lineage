import { transitionsBetween } from './transitions.js?v=0.5.4';
import { appendRecord, snapshot } from './history.js?v=0.5.4';
import { bound, idValid } from './sim-core.js?v=0.5.4';
export function initPromises(g) {
  g.promises ||= [];
  for (const q of g.queue) {
    if (q.decisionId && !g.promises.some((p) => p.source === q.decisionId))
      addPromise(g, {
        kind: 'commission',
        title: 'Carry out ' + g.world.projects.find((p) => p.id === q.id)?.name,
        source: q.decisionId,
        due: g.turn + 1,
        person: q.who,
        site: q.site,
        project: q.id,
      });
  }
  for (const debt of g.obligations) {
    debt.originalDue ??= debt.due;
    debt.principal ??= debt.amount || null;
    debt.paid ??= 0;
  }
}
export function addPromise(g, data) {
  const old = g.promises.find(
    (p) => p.source === data.source && p.kind === data.kind,
  );
  if (old) return old;
  const p = {
    id: 'promise-' + g.serial.arc++,
    created: g.turn,
    ruler: g.ruler.id,
    status: 'active',
    progress: 0,
    total: 1,
    person: null,
    site: null,
    ...Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    ),
  };
  g.promises.push(p);
  return p;
}
export function tickPromises(g) {
  for (const p of g.promises.filter(
    (p) => p.status === 'active' || p.status === 'late',
  )) {
    if (p.kind === 'commission') {
      const result = g.archive.find(
        (e) => e.kind === 'assignment' && e.cause === p.source,
      );
      if (result) {
        p.progress = result.success ? 1 : 0.35;
        p.status = result.success ? 'completed' : 'partial';
        p.finished = g.turn;
        p.result = result.id;
        continue;
      }
    }
    if (p.kind === 'education') {
      const pupil = g.people[p.person];
      p.progress = Math.min(8, pupil?.education?.seasons || 0);
      p.total = 8;
      if (pupil?.education?.status === 'graduated') {
        p.status = 'completed';
        p.finished = g.turn;
        p.result = pupil.education.result || p.source;
        continue;
      }
      if (!pupil?.alive) {
        p.status = 'released';
        p.finished = g.turn;
        continue;
      }
    }
    if (g.turn > p.due && p.status !== 'late') {
      const before = snapshot(g);
      p.status = 'late';
      p.missed = 1;
      if (p.person && g.people[p.person]?.alive)
        g.people[p.person].trust = bound(g.people[p.person].trust - 3);
      const e = appendRecord(g, {
        kind: 'promise',
        cause: p.source,
        people: p.person ? [p.person] : [],
        site: p.site,
        transitions: transitionsBetween(before, g),
        text:
          'The promised work “' +
          p.title +
          '” has passed its deadline. Those waiting for it have less confidence in the crown’s word.',
      });
      p.result = e.id;
    }
  }
}
export function promisesValid(g) {
  return (
    Array.isArray(g.promises) &&
    new Set(g.promises.map((p) => p.id)).size === g.promises.length &&
    g.promises.every(
      (p) =>
        p &&
        idValid(p.id) &&
        ['commission', 'education', 'commercial', 'dilemma'].includes(p.kind) &&
        typeof p.title === 'string' &&
        Number.isInteger(p.created) &&
        Number.isInteger(p.due) &&
        [
          'active',
          'late',
          'partial',
          'completed',
          'released',
          'broken',
        ].includes(p.status) &&
        Number.isFinite(p.progress) &&
        p.progress >= 0 &&
        Number.isFinite(p.total) &&
        p.total > 0 &&
        g.archive.some((e) => e.id === p.source) &&
        g.people[p.ruler] &&
        (p.kind !== 'dilemma' ||
          g.dilemmas?.some(
            (c) => c.id === p.dilemma && c.source === p.source,
          )) &&
        (p.accepts === undefined ||
          p.accepts === null ||
          (Array.isArray(p.accepts) &&
            p.accepts.length > 0 &&
            p.accepts.every(idValid))) &&
        (!p.result || g.archive.some((e) => e.id === p.result)) &&
        (!p.person || g.people[p.person]) &&
        (!p.site || g.settlements[p.site]),
    )
  );
}
