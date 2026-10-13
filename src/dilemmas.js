import { ethicalWeights } from './moral-beliefs.js?v=0.5.4';
import {
  dilemmas,
  moralChoices,
  hazardKinds,
  aftermathVoices,
  liveMoralOptions,
} from './dilemma-catalog.js?v=0.5.4';
import { appendRecord, addFact, snapshot } from './history.js?v=0.5.4';
import { transitionsBetween } from './transitions.js?v=0.5.4';
import {
  personById,
  bound,
  hash,
  idValid,
  rememberPerson,
} from './sim-core.js?v=0.5.4';
import { isBusy } from './characters.js?v=0.5.4';
import { recordDeath } from './living.js?v=0.5.4';
import { apportionPopulation } from './demographics.js?v=0.5.4';
import { addPromise } from './promises.js?v=0.5.4';
const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const roles = ['affected', 'sponsor', 'adviser', 'subject', 'ruler'];
const metrics = [
  'health',
  'trust',
  'loyalty',
  'respect',
  'reputation',
  'grievance',
  'ambition',
  'morale',
  'wealth',
  'connections',
];
export const principles = [
  'mercy',
  'truth',
  'duty',
  'order',
  'autonomy',
  'reciprocity',
  'tradition',
  'provision',
  'restraint',
  'solidarity',
  'expedience',
];
const opposition = {
  'broken-sluice': 'nobles',
  'false-weights': 'guild',
  'apprentice-oath': 'guild',
  'burial-road': 'commons',
  'clinic-fever': 'guild',
  'river-charter': 'nobles',
  'refugee-caravan': 'nobles',
  'mountain-rescue': 'nobles',
  'sealed-library': 'nobles',
  'orchard-blight': 'guild',
  'unpaid-watch': 'guild',
  'shrine-duel': 'commons',
  'forged-letter': 'nobles',
  'winter-rent': 'nobles',
  'water-rights': 'guild',
  'escaped-construct': 'guild',
  'festival-mask': 'guild',
  'guild-inheritance': 'nobles',
  'smuggled-seed': 'nobles',
  'family-feud': 'nobles',
  'lost-census': 'nobles',
  'tournament-debt': 'guild',
  'harvest-fire': 'nobles',
  'exiled-ambassador': 'gnolls',
  'clockwork-tax': 'guild',
  'night-school': 'guild',
  'border-bell': 'nobles',
};
const qualifications = {
  'broken-sluice/support': [
    {
      scope: 'realm',
      field: 'military',
      minimum: 10,
      label: 'A watch strong enough to protect the engineers is needed.',
    },
  ],
  'missing-scout/support': [
    {
      scope: 'realm',
      field: 'military',
      minimum: 12,
      label: 'The watch needs enough remaining strength to mount this search.',
    },
  ],
  'clinic-fever/support': [
    {
      scope: 'realm',
      field: 'military',
      minimum: 10,
      label:
        'The watch cannot enforce a ward without leaving essential posts unmanned.',
    },
  ],
  'refugee-caravan/support': [
    {
      scope: 'realm',
      field: 'food',
      minimum: 12,
      label: 'Enough stored food is needed to make a shelter promise credible.',
    },
  ],
  'unpaid-watch/support': [
    {
      scope: 'realm',
      field: 'food',
      minimum: 10,
      label: 'There is no relief reserve left to transfer to the watch.',
    },
  ],
  'water-rights/support': [
    {
      scope: 'realm',
      field: 'military',
      minimum: 12,
      label:
        'Requisition requires a watch capable of enforcing the river order.',
    },
  ],
  'sleeping-ward/mediate': [
    {
      scope: 'actor',
      actor: 'subject',
      field: 'trust',
      minimum: 30,
      label:
        'The recognized courtier does not trust the crown enough to accept this protected approach.',
    },
  ],
  'exiled-ambassador/mediate': [
    {
      scope: 'faction',
      id: 'gnolls',
      field: 'trust',
      minimum: 25,
      label:
        'A witnessed return needs a foreign council willing to acknowledge the covenant.',
    },
  ],
  'oath-illness/mediate': [
    {
      scope: 'actor',
      actor: 'subject',
      field: 'loyalty',
      minimum: 35,
      label:
        'The veteran will not accept a confidential shared command from a crown they no longer trust.',
    },
  ],
};
export function attachDilemma(e, people, court) {
  const spec = dilemmas[e.archetype];
  if (!spec) return e;
  const sponsor = people.find(
    (p) =>
      p.alive &&
      p.age >= 18 &&
      p.id !== e.speaker &&
      p.faction === (opposition[e.archetype] || 'nobles'),
  );
  const subject =
    e.archetype === 'oath-illness'
      ? court.find((p) => p.role === 'Marshal')
      : e.archetype === 'sleeping-ward'
        ? court.find((p) => p.id === e.adviser)
        : null;
  e.dilemma = {
    version: 1,
    key: e.archetype,
    phase: 'petition',
    question: spec.question,
    actors: {
      affected: e.speaker,
      adviser: e.adviser || null,
      ...(sponsor ? { sponsor: sponsor.id } : {}),
      ...(subject ? { subject: subject.id } : {}),
    },
  };
  e.options = moralChoices(e.archetype, e.options);
  for (const o of e.options) {
    o.stakes.conditions = structuredClone(
      qualifications[e.archetype + '/' + o.id] || [],
    );
    if (['oath-illness', 'sleeping-ward'].includes(e.archetype)) {
      if (o.stakes.personal.adviser) {
        o.stakes.personal.subject = o.stakes.personal.adviser;
        delete o.stakes.personal.adviser;
      }
      if (o.stakes.risk?.actor === 'adviser') o.stakes.risk.actor = 'subject';
    }
  }
  if (subject && ['oath-illness', 'sleeping-ward'].includes(e.archetype))
    e.text +=
      '\n\n' +
      subject.name +
      ' is the court member whose future is at stake. Their service belongs to a living person, not only to the office they hold.';
  e.text += '\n\n' + spec.question;
  return e;
}
const pledgeAnswers = {
  'broken-sluice/mediate': ['land-grant'],
  'clinic-fever/support': ['erase-register'],
  'river-charter/refuse': ['tenant-ownership'],
  'refugee-caravan/support': ['settlement-rights', 'end-labor'],
  'unpaid-watch/support': ['restore-relief'],
  'sleeping-ward/refuse': ['temple-watch'],
  'oath-illness/support': ['return-command'],
};
export function attachLiveDilemma(g, e) {
  const key = 'live-' + e.template,
    spec = dilemmas[key];
  if (!spec) return e;
  const civilian = Object.values(g.people).find(
    (p) =>
      p.alive &&
      p.age >= 18 &&
      p.tier !== 'reserve' &&
      p.siteId === e.site &&
      p.id !== g.ruler.id &&
      !g.court.some((c) => c.id === p.id),
  );
  const sponsor =
    e.template === 'rivalry'
      ? e.relation?.find((id) => id !== e.speaker)
      : g.world.factionLore.guild?.leaderId;
  e.dilemma = {
    version: 1,
    key,
    phase: 'petition',
    question: spec.question,
    actors: {
      affected:
        e.template === 'frontier' ? civilian?.id || e.speaker : e.speaker,
      ...(sponsor ? { sponsor } : {}),
      ...(g.court.find((p) => p.alive && p.status === 'serving')
        ? { adviser: g.court.find((p) => p.alive && p.status === 'serving').id }
        : {}),
    },
  };
  e.options = liveMoralOptions(e.template, e.options);
  e.text += '\n\n' + spec.question;
  return e;
}
export function initDilemmas(g) {
  g.dilemmas ||= [];
}
const actorIds = (g, e) => ({
  ...e.dilemma?.actors,
  ruler: g.ruler.id,
  ...(e.agent ? { adviser: e.agent } : {}),
});
export function chooseDilemmaAgent(g, e) {
  if (!e?.dilemma || e.dilemma.phase !== 'petition') return;
  const eligible = g.court.filter(
    (p) => p.alive && p.status === 'serving' && !isBusy(g, p.id),
  );
  if (eligible.some((p) => p.id === e.agent)) return;
  e.agent =
    eligible.find((p) => p.id === e.adviser)?.id || eligible[0]?.id || null;
}
export function dilemmaOptions(g, e) {
  const options = e.options || [],
    actors = actorIds(g, e);
  const c =
    e.dilemma?.caseId && g.dilemmas.find((c) => c.id === e.dilemma.caseId);
  return options.map((o) => {
    let reason = null;
    if (e.closedReason) return o;
    if (e.dilemma?.phase === 'reckoning' && c?.status !== 'offered')
      reason = 'The report has not yet reached the court.';
    if (o.stakes?.risk?.actor === 'adviser' && !e.agent)
      reason = 'No available court member can take the dangerous charge.';
    for (const q of o.stakes?.conditions || []) {
      const target =
        q.scope === 'realm'
          ? g.resources
          : q.scope === 'faction'
            ? g.factions.find((f) => f.id === q.id)
            : personById(g, actors[q.actor]);
      if (
        !target ||
        target[q.field] < q.minimum ||
        (q.scope === 'actor' &&
          (q.status === 'deceased' ? target.alive : !target.alive))
      )
        reason = q.label;
    }
    if (
      ['oath-illness', 'sleeping-ward'].includes(e.dilemma?.key) &&
      e.dilemma.phase === 'petition' &&
      !personById(g, actors.subject)?.alive
    )
      reason =
        'This named court member can no longer take part in the decision.';
    if (
      o.stakes?.position &&
      (!personById(g, actors[o.stakes.position.actor])?.alive ||
        actors[o.stakes.position.actor] === g.ruler.id)
    )
      reason =
        'A living court member who is not the ruler must accept this office.';
    return { ...o, disabled: !!reason, reason };
  });
}
export function dilemmaDecision(g, e) {
  if (!e.dilemma || e.dilemma.phase !== 'petition') return null;
  const hazard = e.options.find((o) => o.stakes?.risk)?.stakes.risk;
  return {
    type: 'dilemma',
    archetype: e.archetype,
    target: e.id,
    title: e.title,
    text: e.text,
    requiresAgent: true,
    skill: hazardKinds[hazard?.kind]?.skill || 'negotiation',
    adviser: e.adviser || null,
    faction: e.faction || null,
    origin: e.origin,
    dilemma: e.dilemma,
    agent: e.agent,
    options: dilemmaOptions(g, e),
  };
}
function personal(g, changes, actors, text) {
  for (const [role, fields] of Object.entries(changes || {})) {
    const p = personById(g, actors[role]);
    if (!p?.alive || (p.id === g.ruler.id && role !== 'ruler')) continue;
    for (const [field, n] of Object.entries(fields))
      p[field] =
        field === 'wealth' ? Math.max(0, p[field] + n) : bound(p[field] + n);
    if (text) rememberPerson(g, p, text);
  }
}
function effects(g, changes) {
  for (const [k, n] of Object.entries(changes || {}))
    if (Number.isFinite(g.resources[k]))
      g.resources[k] = ['gold', 'food', 'population'].includes(k)
        ? Math.max(0, g.resources[k] + n)
        : bound(g.resources[k] + n);
}
export function riskForecast(g, e, o) {
  const r = o.stakes?.risk;
  if (!r) return null;
  const spec = hazardKinds[r.kind],
    delegate = personById(g, e.professional || e.agent),
    victim = personById(g, (e.actors || actorIds(g, e))[r.actor]);
  const skill =
    delegate?.alive && delegate.status === 'serving'
      ? delegate.skills[spec.skill]
      : 25;
  const trust = delegate?.alive ? delegate.loyalty : 35,
    condition = g.resources[spec.field] || 0;
  const chance = bound(
    r.chance +
      (50 - skill) / 250 +
      (50 - trust) / 600 +
      (50 - condition) / 700 +
      (victim?.health < 35 ? 0.07 : 0) +
      (['bargain', 'secret', 'inquest', 'reprisal', 'passage'].includes(r.kind)
        ? (50 - g.ruler.reputation) / 600
        : 0),
    0.04,
    0.72,
  );
  return {
    chance,
    skill: spec.skill,
    delegate: delegate?.id || null,
    level:
      chance < 0.16
        ? 'a guarded risk'
        : chance < 0.3
          ? 'a serious uncertainty'
          : 'a substantial danger',
    lives: spec.loss[1] > 0 || spec.lethal > 0,
  };
}
export function settleDilemma(g, e, o, source) {
  const reactions = [];
  for (const p of g.court.filter((p) => p.alive && p.status === 'serving')) {
    const belief = ethicalWeights(p),
      average =
        Object.values(belief).reduce((n, x) => n + x, 0) / principles.length;
    const commitment =
      o.stakes.values.reduce((n, v) => n + (belief[v] || 0), 0) /
        o.stakes.values.length -
      average;
    const before = { loyalty: p.loyalty, morale: p.morale };
    if (commitment > 1.4) {
      p.loyalty = bound(p.loyalty + 2);
      p.morale = bound(p.morale + 2);
    } else if (commitment < -0.7) {
      p.loyalty = bound(p.loyalty - 2);
      p.morale = bound(p.morale - 3);
    }
    if (p.loyalty !== before.loyalty || p.morale !== before.morale)
      reactions.push({
        person: p.id,
        stance: commitment > 0 ? 'supported' : 'troubled',
        before,
        after: { loyalty: p.loyalty, morale: p.morale },
      });
  }
  const ruling = g.archive.find((a) => a.id === source);
  if (ruling) ruling.courtResponses = reactions;

  const actors = actorIds(g, e);
  const position = o.stakes.position,
    appointed = position && personById(g, actors[position.actor]);
  if (appointed?.alive && appointed.id !== g.ruler.id) {
    appointed.role = position.office;
    appointed.profession = position.profession;
    appointed.achievements.push({
      kind: 'a new civic calling',
      turn: g.turn,
      source,
    });
  }
  personal(
    g,
    o.stakes?.personal,
    actors,
    'At “' + e.title + '”, the crown chose to ' + o.label.toLowerCase() + '.',
  );
  if (e.dilemma.phase === 'reckoning') {
    const c = g.dilemmas.find((c) => c.id === e.dilemma.caseId);
    if (!c || c.status !== 'offered') return;
    c.status = 'closed';
    c.closed = g.turn;
    c.answer = o.id;
    c.answerSource = source;
    const promise = g.promises.find((p) => p.dilemma === c.id);
    const honors =
      o.honor !== false &&
      (!promise?.accepts || promise.accepts.includes(o.id));
    if (promise) {
      promise.status =
        c.key === 'oath-illness' && !personById(g, c.actors.subject)?.alive
          ? 'released'
          : !honors
            ? 'broken'
            : 'completed';
      promise.progress = !honors ? 0 : 1;
      promise.finished = g.turn;
      promise.result = source;
    }
    if (promise && !honors && promise.status !== 'released') {
      g.ruler.reputation = bound(g.ruler.reputation - 4);
      const affected = personById(g, c.actors.affected);
      if (affected?.alive) affected.trust = bound(affected.trust - 4);
    }
    addFact(
      g,
      'moral-settlement',
      {
        people: Object.values(actors).filter(Boolean),
        dilemma: c.id,
        answer: o.id,
      },
      source,
    );
    return;
  }
  if (g.dilemmas.some((c) => c.event === e.id)) return;
  const id = 'dilemma-' + g.serial.arc++,
    due = g.turn + (o.stakes.risk ? 1 : 2);
  const c = {
    id,
    key: e.dilemma.key,
    event: e.id,
    title: e.title,
    choice: o.id,
    label: o.label,
    source,
    created: g.turn,
    due,
    status: 'pending',
    site: e.site,
    faction: e.faction || null,
    founder: g.ruler.id,
    actors,
    professional: o.stakes.risk ? e.agent : null,
    stakes: structuredClone(o.stakes),
    followup: e.id + '-aftermath',
  };
  g.dilemmas.push(c);
  addFact(
    g,
    'moral-ruling',
    {
      people: [...new Set(Object.values(actors).filter(Boolean))],
      dilemma: id,
      values: o.stakes.values,
      choice: o.id,
      site: c.site,
    },
    source,
  );
  if (o.stakes.pledge)
    addPromise(g, {
      kind: 'dilemma',
      dilemma: id,
      title: o.stakes.pledge.title,
      source,
      due: g.turn + o.stakes.pledge.deadline,
      person: c.key === 'oath-illness' ? actors.subject : actors.affected,
      site: c.site,
      accepts: pledgeAnswers[c.key + '/' + c.choice] || null,
    });
  const spec = dilemmas[c.key];
  return {
    id: c.followup,
    type: 'followup',
    archetype: c.key + '-aftermath',
    title: 'The unanswered part of ' + e.title.toLowerCase(),
    text:
      'The court waits for the people who must live with “' +
      o.label.toLowerCase() +
      '”. ' +
      spec.question,
    speaker: e.speaker,
    adviser: e.adviser || null,
    backdrop: e.backdrop,
    scene: e.scene || e.site,
    site: e.site,
    faction: e.faction || null,
    origin: source,
    due,
    dilemma: {
      version: 1,
      key: c.key,
      phase: 'reckoning',
      caseId: id,
      actors: structuredClone(actors),
      question: spec.question,
    },
    options: structuredClone(spec.aftermath),
  };
}
function casualties(g, c, count) {
  const local = g.settlements[c.site],
    actual = Math.min(count, Math.max(0, local.population - 1));
  local.population -= actual;
  local.demographics = apportionPopulation(
    local.population,
    local.demographics,
  );
  g.resources.population = Object.values(g.settlements).reduce(
    (n, s) => n + s.population,
    0,
  );
  return actual;
}
const draw = (g, c, salt) =>
  hash(
    String(g.seed) +
      ':dilemma:' +
      c.id +
      ':' +
      c.choice +
      ':' +
      c.due +
      ':' +
      salt,
  ) / 4294967296;
export function tickDilemmas(g) {
  for (const c of g.dilemmas.filter(
    (c) => c.status === 'pending' && c.due <= g.turn,
  )) {
    const before = snapshot(g),
      o = { stakes: c.stakes },
      forecast = riskForecast(g, c, o),
      failed = !!forecast && draw(g, c, 'outcome') < forecast.chance;
    const hazard = c.stakes.risk && hazardKinds[c.stakes.risk.kind];
    const result = appendRecord(g, {
      kind: 'dilemma-result',
      type: 'dilemma-result',
      cause: c.source,
      site: c.site,
      people: [...new Set(Object.values(c.actors).filter(Boolean))],
      factions: c.faction ? [c.faction] : [],
      dilemma: c.id,
      choice: c.choice,
      founder: c.founder,
      text: 'The people return with an account of the ruling.',
    });
    let lost = 0,
      dead = null,
      wounded = null;
    if (hazard) {
      effects(g, { [hazard.field]: failed ? -4 : 2 });
      if (failed) {
        const target = personById(g, c.actors[c.stakes.risk.actor]);
        lost =
          hazard.loss[0] +
          Math.floor(
            draw(g, c, 'casualties') * (hazard.loss[1] - hazard.loss[0] + 1),
          );
        if (target?.alive && target.id !== g.ruler.id && hazard.injury) {
          target.health = bound(target.health - hazard.injury);
          if (target.health === 0 || draw(g, c, 'fatality') < hazard.lethal) {
            target.health = 0;
            dead = target.name;
            lost = Math.max(1, lost);
            recordDeath(
              g,
              target,
              'injuries during “' + c.title + '”',
              result.id,
              c.site,
            );
          } else wounded = target.name;
        }
        lost = casualties(g, c, lost);
        personal(
          g,
          { adviser: { loyalty: -3 }, ruler: { reputation: -3 } },
          c.actors,
          'The human cost of “' +
            c.label.toLowerCase() +
            '” remains in their memory.',
        );
        if (c.stakes.risk.kind === 'departure') effects(g, { trade: -3 });
      }
    }
    c.status = 'offered';
    c.outcome = failed ? 'failed' : hazard ? 'held' : 'settled';
    c.result = result.id;
    c.lost = lost;
    c.dead = dead;
    c.wounded = wounded;
    c.chance = forecast?.chance || 0;
    result.text =
      'After “' +
      c.label.toLowerCase() +
      '”: ' +
      (hazard ? (failed ? hazard.failure : hazard.success) + ' ' : '') +
      aftermathVoices[c.key] +
      (lost
        ? ' ' + lost + ' citizen' + (lost === 1 ? ' has' : 's have') + ' died.'
        : '') +
      (dead
        ? ' ' + dead + ' is among those whose deaths enter the Chronicle.'
        : wounded
          ? ' ' + wounded + ' survives with injuries.'
          : '') +
      ' ' +
      dilemmas[c.key].question;
    result.transitions = transitionsBetween(before, g);
    result.effects = Object.fromEntries(
      result.transitions
        .filter((t) => t.scope === 'realm')
        .map((t) => [t.field, t.change]),
    );
    result.humanCost = { lost, dead, wounded };
    if (forecast)
      result.riskAssessment = {
        chanceOfHarm: forecast.chance,
        skill: forecast.skill,
        delegate: c.professional,
      };
    const letter = [g.event, ...g.pending, ...g.scheduled].find(
      (e) => e?.id === c.followup,
    );
    if (letter) {
      letter.text =
        result.text +
        '\n\nThe next ruling will decide whether the people can rely on what was promised, not whether the first answer sounded generous.';
      letter.origin = result.id;
      letter.dilemma.pending = false;
      if (!personById(g, letter.speaker)?.alive)
        letter.speaker =
          Object.values(g.people).find(
            (p) =>
              p.alive &&
              p.age >= 18 &&
              p.tier !== 'reserve' &&
              p.siteId === c.site &&
              p.id !== g.ruler.id,
          )?.id || g.court.find((p) => p.alive && p.status === 'serving')?.id;
    }
  }
}
export function stakesValid(s) {
  if (s === undefined) return true;
  const finite = (v) => Number.isFinite(v) && Math.abs(v) <= 30;
  return (
    object(s) &&
    Array.isArray(s.values) &&
    s.values.length >= 1 &&
    s.values.length <= 4 &&
    s.values.every((v) => principles.includes(v)) &&
    object(s.personal) &&
    Object.entries(s.personal).every(
      ([role, m]) =>
        roles.includes(role) &&
        object(m) &&
        Object.entries(m).every(([k, n]) => metrics.includes(k) && finite(n)),
    ) &&
    (s.risk === null ||
      (object(s.risk) &&
        Object.hasOwn(hazardKinds, s.risk.kind) &&
        Number.isFinite(s.risk.chance) &&
        s.risk.chance >= 0 &&
        s.risk.chance <= 0.65 &&
        roles.includes(s.risk.actor) &&
        s.risk.actor !== 'ruler')) &&
    (s.pledge === null ||
      (object(s.pledge) &&
        typeof s.pledge.title === 'string' &&
        s.pledge.title.length < 200 &&
        Number.isInteger(s.pledge.deadline) &&
        s.pledge.deadline >= 2 &&
        s.pledge.deadline <= 8)) &&
    (s.position === undefined ||
      (object(s.position) &&
        roles.includes(s.position.actor) &&
        [
          'Steward',
          'Marshal',
          'Ambassador',
          'Spymaster',
          'Councillor',
        ].includes(s.position.office) &&
        typeof s.position.profession === 'string' &&
        s.position.profession.length < 80)) &&
    Array.isArray(s.conditions) &&
    s.conditions.length <= 3 &&
    s.conditions.every(
      (q) =>
        object(q) &&
        ['realm', 'faction', 'actor'].includes(q.scope) &&
        (q.scope === 'realm'
          ? ['military', 'food', 'health', 'security', 'justice'].includes(
              q.field,
            )
          : metrics.includes(q.field)) &&
        Number.isFinite(q.minimum) &&
        q.minimum >= 0 &&
        q.minimum <= 100 &&
        typeof q.label === 'string' &&
        q.label.length < 200 &&
        (q.status === undefined ||
          (q.scope === 'actor' && q.status === 'deceased')) &&
        (q.scope !== 'actor' || roles.includes(q.actor)) &&
        (q.scope !== 'faction' || idValid(q.id)),
    )
  );
}
export function dilemmaEventValid(g, e) {
  if (!e?.dilemma) return true;
  const d = e.dilemma;
  return (
    object(d) &&
    d.version === 1 &&
    Object.hasOwn(dilemmas, d.key) &&
    ['petition', 'reckoning'].includes(d.phase) &&
    typeof d.question === 'string' &&
    d.question.length < 250 &&
    object(d.actors) &&
    Object.entries(d.actors).every(
      ([role, id]) => roles.includes(role) && idValid(id) && !!g.people[id],
    ) &&
    (d.phase !== 'reckoning' ||
      g.dilemmas?.some(
        (c) => c.id === d.caseId && c.key === d.key && c.followup === e.id,
      )) &&
    e.options.every((o) => object(o.stakes) && stakesValid(o.stakes))
  );
}
export function dilemmasValid(g) {
  const records = new Set(g.archive.map((e) => e.id));
  return (
    Array.isArray(g.dilemmas) &&
    new Set(g.dilemmas.map((c) => c.id)).size === g.dilemmas.length &&
    g.dilemmas.every(
      (c) =>
        object(c) &&
        idValid(c.id) &&
        Object.hasOwn(dilemmas, c.key) &&
        ['pending', 'offered', 'closed'].includes(c.status) &&
        idValid(c.event) &&
        idValid(c.followup) &&
        records.has(c.source) &&
        g.archive.find((r) => r.id === c.source)?.kind === 'decision' &&
        c.followup === c.event + '-aftermath' &&
        typeof c.title === 'string' &&
        typeof c.label === 'string' &&
        typeof c.choice === 'string' &&
        g.people[c.founder] &&
        g.settlements[c.site] &&
        (c.professional === null || !!g.people[c.professional]) &&
        Number.isInteger(c.created) &&
        Number.isInteger(c.due) &&
        c.due >= c.created &&
        object(c.stakes) &&
        stakesValid(c.stakes) &&
        object(c.actors) &&
        Object.entries(c.actors).every(
          ([role, id]) => roles.includes(role) && !!g.people[id],
        ) &&
        (c.status === 'pending'
          ? c.result === undefined
          : records.has(c.result) &&
            g.archive.some(
              (r) =>
                r.id === c.result &&
                r.kind === 'dilemma-result' &&
                r.cause === c.source &&
                r.dilemma === c.id,
            ) &&
            ['failed', 'held', 'settled'].includes(c.outcome) &&
            Number.isInteger(c.lost) &&
            c.lost >= 0 &&
            Number.isFinite(c.chance) &&
            c.chance >= 0 &&
            c.chance <= 0.72) &&
        (c.status !== 'closed' ||
          (records.has(c.answerSource) &&
            Number.isInteger(c.closed) &&
            c.closed >= c.due &&
            typeof c.answer === 'string')),
    )
  );
}
