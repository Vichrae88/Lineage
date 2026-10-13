import {
  bound,
  personById,
  idValid,
  rememberPerson,
} from './sim-core.js?v=0.5.5';
import { appendRecord, addFact, snapshot } from './history.js?v=0.5.5';
import { transitionsBetween } from './transitions.js?v=0.5.5';
import { isBusy, practice } from './characters.js?v=0.5.5';
import { seasonalDraw } from './seasonal.js?v=0.5.5';
const job = (id, role, name, skill, cost, realm, local, steps) => ({
  id,
  role,
  name,
  skill,
  cost,
  realm,
  local,
  steps,
});
export const initiativeCatalog = [
  job(
    'seed-reserve',
    'Steward',
    'A seed reserve held by the growers',
    'agriculture',
    8,
    { food: 9, ecology: 1 },
    { foodProduction: 1 },
    [
      'I am asking growers which seed they can spare without emptying their own stores.',
      'The sacks are sorted and the households have agreed who may draw on them.',
      'The reserve is ready, with records kept by the people who filled it.',
    ],
  ),
  job(
    'water-survey',
    'Steward',
    'A survey of the public water channels',
    'craftsmanship',
    7,
    { infrastructure: 3, health: 1 },
    { infrastructure: 2 },
    [
      'I have paid a small crew to walk the channels rather than trust the old map.',
      'We are clearing the narrow obstructions and marking the dangerous joints.',
      'The channels now carry water through the repaired sections.',
    ],
  ),
  job(
    'market-ledger',
    'Steward',
    'A market account anyone can question',
    'administration',
    6,
    { justice: 2, trade: 2 },
    { trade: 2 },
    [
      'I am comparing the public measures with the traders’ own books.',
      'The discrepancies are being heard in front of the affected sellers.',
      'A common account is posted where buyers and sellers can read it.',
    ],
  ),
  job(
    'winter-work',
    'Steward',
    'Useful work between the harvests',
    'stewardship',
    8,
    { infrastructure: 2, happiness: 2 },
    { prosperity: 2 },
    [
      'I am using my own savings to offer a few ordinary repairs between harvests.',
      'Households have chosen jobs that will still matter after winter.',
      'The repaired shelters are back in everyday use.',
    ],
  ),
  job(
    'civic-watch',
    'Marshal',
    'A watch taught by its neighbors',
    'recruiting',
    7,
    { military: 2, security: 2 },
    { security: 2 },
    [
      'I am asking households who would willingly learn the watch’s warning calls.',
      'The volunteers are practicing at the crossings they actually use.',
      'The new volunteers have taken their places without forced recruitment.',
    ],
  ),
  job(
    'guard-drill',
    'Marshal',
    'Patient drill for an uneven company',
    'training',
    6,
    { military: 3 },
    { security: 1 },
    [
      'I have arranged small practice groups instead of one exhausting parade.',
      'Veterans are teaching the least confident recruits at their own pace.',
      'The company can carry out the agreed drill together.',
    ],
  ),
  job(
    'safe-escort',
    'Marshal',
    'An escort schedule for vulnerable travelers',
    'leadership',
    7,
    { security: 3, trade: 1 },
    { trade: 1 },
    [
      'I am asking travelers which crossings leave them most exposed.',
      'The company is testing an escort schedule without stripping the main posts.',
      'The schedule is working and the travelers know where to find help.',
    ],
  ),
  job(
    'armory-care',
    'Marshal',
    'Tools cared for before they fail',
    'craftsmanship',
    8,
    { infrastructure: 2, military: 2 },
    { infrastructure: 1 },
    [
      'I have hired a careful smith from my own purse to inspect ordinary equipment.',
      'The company is learning how to spot a weakness before it becomes a wound.',
      'The repaired equipment is issued with a record of its condition.',
    ],
  ),
  job(
    'letters-road',
    'Ambassador',
    'Letters that keep a road open',
    'diplomacy',
    6,
    { trade: 2, legitimacy: 1 },
    { trade: 2 },
    [
      'I am writing to the people who actually keep the border crossings.',
      'We are testing small reciprocal promises before attempting a grand treaty.',
      'The keepers have agreed to a dependable exchange of notices.',
    ],
  ),
  job(
    'shared-language',
    'Ambassador',
    'Words shared across the frontier',
    'scholarship',
    5,
    { learning: 2, trade: 2 },
    { prosperity: 2 },
    [
      'I have bought blank books for interpreters from several communities.',
      'They are comparing phrases that too often turn a warning into an insult.',
      'The shared glossary is available to guides and ordinary petitioners.',
    ],
  ),
  job(
    'peace-table',
    'Ambassador',
    'A table for minor grievances',
    'negotiation',
    7,
    { justice: 2, security: 1 },
    { prosperity: 2 },
    [
      'I am inviting people with smaller grievances before they harden into threats.',
      'The witnesses are shaping agreements they can explain to their own households.',
      'Several modest disputes have ended without a demand for royal force.',
    ],
  ),
  job(
    'guest-rights',
    'Ambassador',
    'A clear welcome for traveling households',
    'administration',
    6,
    { legitimacy: 2, happiness: 1 },
    { health: 1 },
    [
      'I am gathering the unwritten rules that strangers discover only after breaking them.',
      'Hosts and visitors are comparing what a fair welcome should require.',
      'The agreed guest rights are posted at the crossing and the lodging house.',
    ],
  ),
  job(
    'hidden-cracks',
    'Spymaster',
    'An inspection of neglected weaknesses',
    'investigation',
    6,
    { infrastructure: 2, security: 2 },
    { infrastructure: 2 },
    [
      'I am checking quiet reports that seemed too small for an official inquiry.',
      'The witnesses are helping us distinguish ordinary faults from deliberate damage.',
      'The most dangerous weaknesses are repaired and the evidence remains open.',
    ],
  ),
  job(
    'honest-office',
    'Spymaster',
    'An office less hospitable to corruption',
    'administration',
    8,
    { justice: 3, gold: 4 },
    { security: 1 },
    [
      'I have paid independent copyists to compare receipts without accusing anyone first.',
      'The clerks are explaining entries that could not be reconciled.',
      'The office has recovered a small loss and adopted clearer witness rules.',
    ],
  ),
  job(
    'safe-witnesses',
    'Spymaster',
    'Safe passage for uneasy witnesses',
    'intrigue',
    7,
    { security: 2, justice: 2 },
    { security: 1 },
    [
      'I am finding discreet lodging for witnesses who fear the journey to a hearing.',
      'The routes are tested and nobody is asked to surrender their testimony in advance.',
      'Witnesses can now reach the hearing without exposing their households.',
    ],
  ),
  job(
    'rumor-record',
    'Spymaster',
    'Rumors tested against actual accounts',
    'investigation',
    5,
    { learning: 2, legitimacy: 2 },
    { prosperity: 1 },
    [
      'I am writing down where each rumor began instead of only who repeated it.',
      'We are hearing the people whose accounts were shortened in the telling.',
      'Several claims have been corrected with evidence the public can question.',
    ],
  ),
  job(
    'healing-round',
    'Councillor',
    'A round of visits to the overlooked sick',
    'medicine',
    8,
    { health: 3, happiness: 1 },
    { health: 3 },
    [
      'I am buying simple supplies from my own purse and asking who cannot travel to a healer.',
      'The visits are reaching households the usual lists missed.',
      'The round has brought ordinary care within reach of more households.',
    ],
  ),
  job(
    'open-lessons',
    'Councillor',
    'Lessons under an open hearth',
    'scholarship',
    6,
    { learning: 3, justice: 1 },
    { prosperity: 2 },
    [
      'I have gathered spare books and invited learners without asking for a family sponsor.',
      'The learners are helping decide which lessons serve their daily lives.',
      'The first lessons are complete and the books remain available.',
    ],
  ),
  job(
    'common-garden',
    'Councillor',
    'A garden tended in common',
    'agriculture',
    7,
    { ecology: 3, food: 6 },
    { foodProduction: 1 },
    [
      'I am buying seed and asking neighboring households which plot they can share.',
      'The beds are planted and the keepers have agreed how the harvest will be divided.',
      'The garden is feeding its keepers and restoring worn ground.',
    ],
  ),
  job(
    'craft-circle',
    'Councillor',
    'A circle of crafts taught freely',
    'training',
    6,
    { learning: 2, infrastructure: 2 },
    { prosperity: 2 },
    [
      'I am inviting craftspeople to teach one ordinary skill without a guild entrance fee.',
      'Learners are repairing simple things for their own households.',
      'The circle has left useful tools and people able to maintain them.',
    ],
  ),
];
export function initCourtWork(g) {
  g.courtWork ??= {
    version: 1,
    lastTurn: g.turn,
    mode: 'entrusted',
    initiatives: [],
  };
  g.personalTime ??= { turn: g.turn, used: 0 };
}
export const personalTimeCapacity = (g) =>
  g.title === 'Kingdom'
    ? 4
    : g.scale === 'province' || g.title === 'City'
      ? 3
      : 2;
export const personalTimeRemaining = (g) =>
  g.personalTime?.turn === g.turn
    ? Math.max(0, personalTimeCapacity(g) - g.personalTime.used)
    : personalTimeCapacity(g);
export function spendPersonalTime(g) {
  initCourtWork(g);
  if (!personalTimeRemaining(g)) return false;
  if (g.personalTime.turn !== g.turn)
    g.personalTime = { turn: g.turn, used: 0 };
  g.personalTime.used++;
  return true;
}
export function initiativeForecast(g, p, spec) {
  const talent = p.skills[spec.skill],
    traits = (p.traits || []).reduce(
      (n, t) =>
        n +
        ([
          'Resourceful',
          'Generous',
          'Patient',
          'Meticulous',
          'Inspiring',
          'Compassionate',
          'Loyal',
        ].includes(t)
          ? 2
          : t === 'Reckless'
            ? -4
            : 0),
      0,
    );
  return {
    score: bound(
      talent +
        (p.loyalty - 50) / 6 +
        (p.morale - 50) / 8 +
        (p.connections - 40) / 10 +
        traits,
    ),
    chance: bound(
      0.48 + talent / 220 + (p.loyalty - 50) / 600 + traits / 300,
      0.35,
      0.91,
    ),
  };
}
const specOf = (i) => initiativeCatalog.find((s) => s.id === i.project);
function report(g, i, text, kind = 'court-progress', before = null) {
  const p = personById(g, i.person),
    r = appendRecord(g, {
      kind,
      cause: i.source,
      site: i.site,
      people: [i.person],
      initiative: i.id,
      text:
        p.name +
        (p.alive
          ? ' reports on “'
          : '’s household preserves a final report on “') +
        i.name +
        '”: “' +
        text +
        '”',
      ...(before ? { transitions: transitionsBetween(before, g) } : {}),
    });
  i.report = r.id;
  i.reports.push(r.id);
  rememberPerson(g, p, text);
  return r;
}
export function tickCourtWork(g) {
  initCourtWork(g);
  const work = g.courtWork;
  if (g.turn <= work.lastTurn) return;
  work.lastTurn = g.turn;
  for (const i of work.initiatives.filter((i) => i.status === 'active')) {
    const p = personById(g, i.person),
      s = specOf(i),
      before = snapshot(g);
    if (
      !p.alive ||
      p.status !== 'serving' ||
      p.id === g.ruler.id ||
      p.role !== i.office
    ) {
      i.status = 'ended';
      i.finished = g.turn;
      report(
        g,
        i,
        !p.alive
          ? 'My undertaking ends with the loss of its founder. The household preserves the work already recorded.'
          : 'My changed responsibilities bring this personal undertaking to an end. The spent materials and prior reports remain.',
        'court-initiative',
        before,
      );
      continue;
    }
    if (p.health < 35 || p.morale < 25 || p.wealth < 1) {
      i.stalls++;
      if (i.stalls >= 3) {
        i.status = 'ended';
        i.finished = g.turn;
      }
      report(
        g,
        i,
        i.status === 'ended'
          ? 'I cannot carry this undertaking further. It ends without the promised improvement.'
          : 'I have paused the work. My health, spirits or remaining private resources cannot sustain the next step.',
        'court-progress',
        before,
      );
      continue;
    }
    const forecast = initiativeForecast(g, p, s),
      step = bound(0.6 + forecast.score / 150, 0.6, 1.2);
    i.progress = Math.min(3, i.progress + step);
    i.lastStep = g.turn;
    if (i.progress < 3) {
      report(
        g,
        i,
        s.steps[Math.min(1, Math.floor(i.progress))] +
          ' The work is still in progress.',
      );
      continue;
    }
    i.chance = forecast.chance;
    i.success =
      seasonalDraw(g.seed, i.started, i.id + ':completion') < forecast.chance;
    i.status = i.success ? 'completed' : 'partial';
    i.finished = g.turn;
    const local = g.settlements[i.site],
      previous = work.initiatives.filter(
        (j) =>
          j !== i &&
          j.project === i.project &&
          j.site === i.site &&
          j.status === 'completed',
      ).length;
    const factor = (i.success ? 1 : 0.35) / (1 + previous * 0.6);
    i.factor = factor;
    for (const [k, n] of Object.entries(s.realm))
      g.resources[k] = ['gold', 'food'].includes(k)
        ? Math.max(0, g.resources[k] + n * factor)
        : bound(g.resources[k] + n * factor);
    for (const [k, n] of Object.entries(s.local))
      local[k] = bound(local[k] + n * factor);
    if (s.id === 'civic-watch' && i.success) {
      g.guards.count = Math.max(
        g.guards.count,
        Math.min(g.guards.count + 2, Math.floor(g.resources.population * 0.08)),
      );
      p.reputation = bound(p.reputation + 2);
    }
    p.reputation = bound(p.reputation + (i.success ? 3 : 1));
    p.experience += i.success ? 6 : 2;
    const gain = practice(g, p, s.skill, i.success ? 1.5 : 0.5);
    const r = report(
      g,
      i,
      i.success
        ? s.steps[2]
        : 'Some useful work remains, but the undertaking did not achieve everything I intended. I will not claim a complete success.',
      'court-initiative',
      before,
    );
    p.performance.unshift({
      project: s.id,
      score: forecast.score,
      skill: s.skill,
      success: i.success,
      gain,
      turn: g.turn,
      source: r.id,
    });
    p.performance = p.performance.slice(0, 20);
    if (i.success)
      p.achievements.push({
        kind: 'a self-directed public improvement',
        turn: g.turn,
        skill: s.skill,
        source: r.id,
      });
    addFact(
      g,
      'court-improvement',
      { people: [p.id], site: i.site, initiative: i.id, success: i.success },
      r.id,
    );
    local.history.push(r.id);
  }
  if (work.mode === 'held') return;
  const court = g.court.filter(
      (p) => p.alive && p.status === 'serving' && p.id !== g.ruler.id,
    ),
    limit = Math.max(
      0,
      Math.min(3, Math.ceil(court.length / 3), court.length - 1),
    );
  let active = work.initiatives.filter((i) => i.status === 'active').length;
  for (const p of court) {
    if (active >= limit) break;
    if (court.filter((c) => !isBusy(g, c.id)).length <= 1) break;
    if (
      isBusy(g, p.id) ||
      p.health < 45 ||
      p.morale < 40 ||
      p.loyalty < 35 ||
      p.performance[0]?.turn >= g.turn - 1 ||
      work.initiatives.some(
        (i) => i.person === p.id && g.turn - (i.finished ?? i.started) < 8,
      )
    )
      continue;
    const candidates = initiativeCatalog.filter(
      (s) =>
        s.role === p.role && p.skills[s.skill] >= 45 && p.wealth >= s.cost + 3,
    );
    candidates.sort(
      (a, b) =>
        initiativeForecast(g, p, b).score - initiativeForecast(g, p, a).score ||
        a.id.localeCompare(b.id),
    );
    const s = candidates[0];
    if (!s) continue;
    if (
      seasonalDraw(g.seed, g.turn, p.id + ':initiative') >=
      bound(0.15 + p.skills[s.skill] / 400 + (p.loyalty - 50) / 600, 0.1, 0.45)
    )
      continue;
    const before = snapshot(g);
    p.wealth -= s.cost;
    const id = 'initiative-' + g.serial.arc++,
      record = appendRecord(g, {
        kind: 'court-initiative',
        initiative: id,
        people: [p.id],
        site: p.siteId,
        text:
          p.name +
          ' begins “' +
          s.name +
          '” on their own initiative. “' +
          s.steps[0] +
          ' I have pledged my own savings; no payment is requested from the treasury.”',
        transitions: transitionsBetween(before, g),
      });
    const i = {
      id,
      project: s.id,
      name: s.name,
      person: p.id,
      office: p.role,
      site: p.siteId,
      source: record.id,
      started: g.turn,
      status: 'active',
      progress: 0,
      stalls: 0,
      cost: s.cost,
      report: record.id,
      reports: [record.id],
      lastStep: g.turn,
      lastIntervened: -1,
    };
    work.initiatives.push(i);
    active++;
    rememberPerson(g, p, s.steps[0]);
  }
}
export function initiativeDecision(g, id) {
  const i = g.courtWork.initiatives.find((i) => i.id === id);
  if (!i) return null;
  return {
    type: 'initiative',
    target: id,
    title: i.name,
    text:
      personById(g, i.person).name +
      ' is carrying this work with private resources and professional judgment. Your response can encourage it, add material help, or end it.',
    blocked:
      i.status !== 'active'
        ? 'This undertaking has already ended.'
        : !personById(g, i.person)?.alive ||
            personById(g, i.person).status !== 'serving' ||
            personById(g, i.person).role !== i.office
          ? 'Its founder can no longer carry this undertaking. The final report will be preserved as the season turns.'
          : i.lastIntervened === g.turn
            ? 'You have already answered this undertaking this season.'
            : null,
    options: [
      {
        id: 'encourage',
        label: 'Hear the report and offer encouragement',
        note: 'No gold. Spend one personal audience; confidence grows and the next step becomes a little easier.',
        cost: 0,
        effects: {},
        disabled: personalTimeRemaining(g) === 0,
        reason: 'Your personal audiences are already committed this season.',
      },
      {
        id: 'materials',
        label: 'Contribute materials without taking over the work',
        note: '6 gold. Add to the courtier’s private resources; the result still depends on their craft.',
        cost: 6,
        effects: {},
      },
      {
        id: 'end',
        label: 'Ask them to end the undertaking and return to ordinary duties',
        note: 'No gold. The earlier expense is not recovered and their loyalty is strained.',
        cost: 0,
        effects: {},
      },
    ],
  };
}
export function interveneInitiative(g, id, choice) {
  const i = g.courtWork.initiatives.find((i) => i.id === id),
    p = personById(g, i.person);
  i.lastIntervened = g.turn;
  if (choice === 'encourage') {
    spendPersonalTime(g);
    p.loyalty = bound(p.loyalty + 2);
    p.morale = bound(p.morale + 3);
    i.progress = Math.min(2.9, i.progress + 0.25);
    return (
      'You hear ' +
      p.name +
      '’s report and encourage the work. Their next step is clearer, though its success remains uncertain.'
    );
  }
  if (choice === 'materials') {
    p.wealth += 6;
    i.progress = Math.min(2.9, i.progress + 0.4);
    return (
      'You contribute materials to ' +
      p.name +
      '’s undertaking without claiming it as a royal commission.'
    );
  }
  i.status = 'ended';
  i.finished = g.turn;
  p.loyalty = bound(p.loyalty - 3);
  return (
    p.name +
    ' ends the undertaking at your request. The earlier expense and reports remain part of their service.'
  );
}
export function recordInitiativeResponse(g, id, entry) {
  const i = g.courtWork.initiatives.find((i) => i.id === id);
  entry.initiative = i.id;
  i.report = entry.id;
  i.reports.push(entry.id);
}
export function courtWorkValid(g) {
  const w = g.courtWork,
    records = new Set(g.archive.map((r) => r.id)),
    p = g.personalTime;
  return (
    w &&
    w.version === 1 &&
    Number.isInteger(w.lastTurn) &&
    w.lastTurn >= 0 &&
    w.lastTurn <= g.turn &&
    ['entrusted', 'held'].includes(w.mode) &&
    Array.isArray(w.initiatives) &&
    new Set(w.initiatives.map((i) => i.id)).size === w.initiatives.length &&
    w.initiatives.every(
      (i) =>
        i &&
        idValid(i.id) &&
        specOf(i) &&
        specOf(i).role === i.office &&
        specOf(i).cost === i.cost &&
        specOf(i).name === i.name &&
        g.archive.some(
          (r) =>
            r.id === i.source &&
            r.kind === 'court-initiative' &&
            r.initiative === i.id &&
            r.people.includes(i.person),
        ) &&
        g.people[i.person] &&
        g.settlements[i.site] &&
        records.has(i.source) &&
        records.has(i.report) &&
        Array.isArray(i.reports) &&
        i.reports[0] === i.source &&
        i.reports.at(-1) === i.report &&
        new Set(i.reports).size === i.reports.length &&
        i.reports.every((id) =>
          g.archive.some(
            (r) =>
              r.id === id &&
              r.initiative === i.id &&
              r.people.includes(i.person) &&
              r.site === i.site &&
              (id === i.source || r.cause === i.source),
          ),
        ) &&
        ['active', 'completed', 'partial', 'ended'].includes(i.status) &&
        Number.isFinite(i.progress) &&
        i.progress >= 0 &&
        i.progress <= 3 &&
        Number.isInteger(i.started) &&
        i.started >= 0 &&
        i.started <= g.turn &&
        Number.isInteger(i.stalls) &&
        i.stalls >= 0 &&
        Number.isInteger(i.lastIntervened) &&
        i.lastIntervened <= g.turn &&
        (i.status === 'active' ||
          (Number.isInteger(i.finished) &&
            i.finished >= i.started &&
            i.finished <= g.turn)) &&
        (!['completed', 'partial'].includes(i.status) ||
          (typeof i.success === 'boolean' &&
            i.progress === 3 &&
            Number.isFinite(i.factor) &&
            i.factor > 0 &&
            i.factor <= 1)) &&
        (i.chance === undefined ||
          (Number.isFinite(i.chance) && i.chance >= 0.35 && i.chance <= 0.91)),
    ) &&
    p &&
    Number.isInteger(p.turn) &&
    p.turn >= 0 &&
    p.turn <= g.turn &&
    Number.isInteger(p.used) &&
    p.used >= 0 &&
    p.used <= personalTimeCapacity(g)
  );
}
