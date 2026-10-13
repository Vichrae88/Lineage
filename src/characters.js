import {
  bound,
  hash,
  personById,
  rememberPerson,
  roll,
  idValid,
} from './sim-core.js?v=0.5.5';
import { transitionsBetween } from './transitions.js?v=0.5.5';
import { appendRecord, addFact, snapshot } from './history.js?v=0.5.5';
import { generatePerson, animalHeritages } from './campaign.js?v=0.5.5';
export const attributes = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
];
export const skills = [
  'stewardship',
  'martial',
  'diplomacy',
  'intrigue',
  'recruiting',
  'leadership',
  'training',
  'trade',
  'craftsmanship',
  'agriculture',
  'medicine',
  'scholarship',
  'negotiation',
  'administration',
  'investigation',
];
export const traitRules = {
  'Magnetic Personality': { recruiting: 8, diplomacy: 5 },
  Charismatic: { recruiting: 5, diplomacy: 5, negotiation: 3 },
  'Inspiring Leader': { recruiting: 5, leadership: 7, training: 4 },
  Inspiring: { recruiting: 4, leadership: 6 },
  Scholarly: { scholarship: 7, training: 4, medicine: 2 },
  Honest: { negotiation: 4, administration: 4, intrigue: -3 },
  Principled: { administration: 4, investigation: 3 },
  Ambitious: { leadership: 3, intrigue: 3 },
  Compassionate: { medicine: 5, training: 3 },
  Merciful: { medicine: 4, training: 2 },
  Protective: { recruiting: 3, martial: 3, medicine: 2 },
  Ruthless: { intrigue: 6, martial: 3, negotiation: -3 },
  Cautious: { investigation: 5, stewardship: 3 },
  Courageous: { martial: 5, leadership: 3 },
  Patient: { training: 6, scholarship: 3 },
  Greedy: { trade: 5, training: -3 },
  Loyal: { leadership: 4, administration: 3 },
  Suspicious: { investigation: 6, intrigue: 3, negotiation: -3 },
  Resourceful: { stewardship: 5, craftsmanship: 4, trade: 2 },
  Inventive: { craftsmanship: 6, scholarship: 3 },
  Meticulous: { administration: 6, stewardship: 3 },
  Inquisitive: { investigation: 5, scholarship: 4 },
  Warm: { recruiting: 4, training: 4 },
  Candid: { diplomacy: 3, negotiation: 3, intrigue: -2 },
  Reserved: { scholarship: 3, intrigue: 3, recruiting: -2 },
  Restless: { recruiting: 2, training: -2 },
  Stubborn: { martial: 3, negotiation: -3 },
  Diplomatic: { diplomacy: 7, negotiation: 5 },
  Reckless: { martial: 4, investigation: -5 },
  Generous: { recruiting: 4, training: 4 },
  Secretive: { intrigue: 7, investigation: 2 },
  'Quietly stubborn': { stewardship: 3, negotiation: -2 },
  Blunt: { leadership: 3, diplomacy: -2 },
  Proud: { leadership: 4, recruiting: -1 },
  Observant: { investigation: 5, medicine: 2 },
  Witty: { diplomacy: 4, recruiting: 2 },
  Gentle: { medicine: 4, training: 3 },
  Fearless: { martial: 4, investigation: -2 },
  Homesick: { agriculture: 2, leadership: -1 },
  Cultured: { negotiation: 4, scholarship: 3 },
  Curious: { scholarship: 4, investigation: 3 },
  Impatient: { trade: 2, training: -3 },
  Practical: { stewardship: 4, craftsmanship: 3 },
  Skeptical: { investigation: 4, negotiation: 2 },
  Independent: { craftsmanship: 4, leadership: 2 },
  Idealistic: { training: 3, administration: 3 },
  'Dry-witted': { negotiation: 3, intrigue: 2 },
  Steady: { training: 3, stewardship: 3 },
  Tenacious: { leadership: 4, martial: 3 },
  Frank: { administration: 3, diplomacy: 2 },
  Courteous: { diplomacy: 4, negotiation: 3 },
  Experienced: { leadership: 3, training: 3 },
  Watchful: { investigation: 5, martial: 2 },
};
const professionSkill = {
  Steward: 'administration',
  Marshal: 'martial',
  Ambassador: 'diplomacy',
  Spymaster: 'investigation',
  Scholar: 'scholarship',
  Teacher: 'training',
  'Guild representative': 'trade',
  'Company captain': 'leadership',
  Scout: 'martial',
  'Lore keeper': 'scholarship',
  Student: 'scholarship',
};
export function normalizePerson(g, p, reserve = false) {
  p.id ||= 'sovereign';
  p.role ||= p === g.ruler ? 'Sovereign' : 'Citizen';
  p.profession ||= p.role;
  p.status ||= p === g.ruler ? 'ruler' : 'citizen';
  p.alive ??= true;
  p.age ??= 26;
  p.gender ||= 'Nonbinary';
  p.disposition ||= 'Patient';
  p.appearance ||= 'The familiar clothing and bearing of their home.';
  p.skills ||= {};
  for (const key of ['stewardship', 'martial', 'diplomacy', 'intrigue'])
    p.skills[key] ??= p.age < 18 ? 15 : 40;
  p.attributes ||= Object.fromEntries(
    attributes.map((key, i) => [
      key,
      p.age < 12 ? 6 + (hash(p.id + key) % 5) : 8 + (hash(p.id + key) % 10),
    ]),
  );
  const basis = {
    recruiting: 'diplomacy',
    leadership: 'martial',
    training: 'stewardship',
    trade: 'diplomacy',
    craftsmanship: 'stewardship',
    agriculture: 'stewardship',
    medicine: 'stewardship',
    scholarship: 'intrigue',
    negotiation: 'diplomacy',
    administration: 'stewardship',
    investigation: 'intrigue',
  };
  for (const key of skills)
    p.skills[key] ??=
      p.age < 18
        ? 12
        : bound(
            Math.round(
              (p.skills[basis[key]] || 35) * 0.68 + (hash(p.id + key) % 22),
            ),
          );
  p.traits ||= ['Experienced', 'Watchful'];
  p.memories ||= [];
  p.wealth ??= 8 + (hash(p.id) % 28);
  p.income ??= reserve ? 0 : p.status === 'serving' ? 2 : 1 + (hash(p.id) % 3);
  p.reputation ??= p.respect || 50;
  p.morale ??= 65;
  p.connections ??= 25 + (hash(p.id) % 35);
  p.health ??= 90;
  p.loyalty ??= 55;
  p.trust ??= 50;
  p.affection ??= 35;
  p.respect ??= 50;
  p.ambition ??= 40;
  p.grievance ??= 10;
  p.experience ??= 0;
  p.values ||=
    p.disposition === 'Generous'
      ? 'Compassion'
      : p.disposition === 'Bold'
        ? 'Strength'
        : p.disposition === 'Pragmatic'
          ? 'Prosperity'
          : 'Harmony';
  p.parentIds ||= [];
  p.childIds ||= [];
  p.siblingIds ||= [];
  p.spouseId ??= null;
  p.formerSpouseIds ||= [];
  p.factionIds ||= p.faction ? [p.faction] : ['commons'];
  p.property ||= [];
  p.equipment ||= [];
  p.skillExperience ||= Object.fromEntries(skills.map((k) => [k, 0]));
  p.practiceTurns ||= {};
  p.performance ||= [];
  p.achievements ||= [];
  p.injuries ||= [];
  p.goals ||= [
    {
      kind: p.traits.includes('Ambitious')
        ? 'influence'
        : p.traits.includes('Scholarly') || p.traits.includes('Inquisitive')
          ? 'learn'
          : p.traits.includes('Protective')
            ? 'community'
            : 'wealth',
      progress: 0,
      status: 'active',
    },
  ];
  p.tier = reserve
    ? 'reserve'
    : p === g.ruler ||
        g.court.some((c) => c.id === p.id) ||
        g.children.some((c) => c.id === p.id) ||
        (g.kin || []).some((c) => c.id === p.id)
      ? 'major'
      : 'secondary';
  if (p.birthTurn === undefined)
    p.birthTurn = reserve ? null : g.turn - p.age * 4;
  if (!reserve && p.birthTurn === null) p.birthTurn = g.turn - p.age * 4;
  return p;
}
export function canonicalizePeople(g) {
  const people = g.people || {};
  const reserve = new Set((g.futurePeople || []).map((p) => p.id));
  const sources = [
    ...(g.futurePeople || []),
    ...g.applicants,
    ...(g.notables || []),
    ...(g.kin || []),
    ...g.children,
    ...g.court,
    g.ruler,
  ];
  for (const p of sources) {
    if (!p) continue;
    p.id ||= 'sovereign';
    if (!idValid(p.id))
      throw Error('This household contains an invalid identity.');
    const old = people[p.id];
    if (old && old !== p) Object.assign(old, p);
    else people[p.id] = p;
  }
  g.people = people;
  for (const key of [
    'court',
    'children',
    'kin',
    'applicants',
    'notables',
    'futurePeople',
  ])
    g[key] = (g[key] || []).map((p) => people[p.id]);
  g.ruler = people[g.ruler.id];
  for (const p of Object.values(people))
    normalizePerson(g, p, reserve.has(p.id));
  g.trainingJobs ||= [];
  g.relationships ||= {};
  for (const b of g.bonds) {
    const key = [b.a, b.b].sort().join('|');
    g.relationships[key] ||= {
      a: b.a,
      b: b.b,
      trust: b.trust,
      affection: b.affection,
      rivalry: b.rivalry,
      loyalty: 50,
      respect: 50,
      fear: 10,
      grievance: 10,
      kind: 'colleagues',
      favors: 0,
    };
  }
}
export function relationship(g, a, b, kind = 'acquaintances') {
  const key = [a, b].sort().join('|');
  return (g.relationships[key] ||= {
    a,
    b,
    trust: 40,
    affection: 30,
    rivalry: 10,
    loyalty: 40,
    respect: 45,
    fear: 10,
    grievance: 10,
    kind,
    favors: 0,
  });
}
export const isBusy = (g, id) =>
  (personById(g, id)?.awayUntil || 0) > g.turn ||
  (g.courtWork?.initiatives || []).some(
    (i) => i.status === 'active' && i.person === id,
  ) ||
  (g.dilemmas || []).some(
    (c) => c.status === 'pending' && c.professional === id,
  ) ||
  (g.ventures || []).some(
    (v) => v.actor === id && ['forming', 'outbound'].includes(v.status),
  ) ||
  g.queue.some((q) => q.who === id) ||
  g.trainingJobs?.some(
    (j) => j.status === 'active' && (j.student === id || j.mentor === id),
  );
export function availableMentors(g, target) {
  return Object.values(g.people).filter(
    (p) =>
      p.alive &&
      p.age >= 18 &&
      p.id !== target &&
      p.tier !== 'reserve' &&
      p.status !== 'departed' &&
      p.status !== 'ruler' &&
      !isBusy(g, p.id) &&
      (g.court.some((c) => c.id === p.id) ||
        p.role === 'Teacher' ||
        p.role === 'Scholar'),
  );
}
export const actionSkill = {
  recruit: 'recruiting',
  guard: 'martial',
  school: 'scholarship',
  roads: 'stewardship',
  granary: 'agriculture',
  mill: 'craftsmanship',
  embassy: 'diplomacy',
  festival: 'negotiation',
  inquiry: 'investigation',
};
export function professionalForecast(g, p, project, funding = null) {
  const skill = actionSkill[project.id] || project.skill,
    attribute = ['recruit', 'embassy', 'festival'].includes(project.id)
      ? 'charisma'
      : project.id === 'guard'
        ? 'wisdom'
        : 'intelligence';
  const contributions = [
    { label: skill, value: p.skills[skill], modifier: p.skills[skill] },
    {
      label: attribute,
      value: p.attributes[attribute],
      modifier: (p.attributes[attribute] - 10) * 1.4,
    },
  ];
  let trait = 0;
  for (const t of p.traits) {
    const n = traitRules[t]?.[skill] || 0;
    if (n) {
      trait += n;
      contributions.push({ label: t, value: null, modifier: n });
    }
  }
  trait = bound(trait, -12, 14);
  const authority =
    (project.skill === 'martial' && p.role === 'Marshal') ||
    (project.skill === 'stewardship' && p.role === 'Steward') ||
    (project.skill === 'diplomacy' && p.role === 'Ambassador') ||
    (project.skill === 'intrigue' && p.role === 'Spymaster')
      ? 6
      : 0;
  const condition = bound((p.health - 70) / 8 + (p.morale - 50) / 10, -18, 8);
  const support = bound(
    (p.loyalty - 50) / 12 +
      (p.reputation - 50) / 15 +
      (p.connections - 40) / 20,
    -12,
    9,
  );
  const situation =
    project.id === 'recruit'
      ? bound(
          (g.resources.happiness - 50) / 7 +
            (g.factions.find((f) => f.id === 'guard').respect - 50) / 12,
          -14,
          8,
        )
      : bound(
          (g.resources.security - 50) / 15 -
            g.factions.find((f) => f.id === project.faction).grievance / 20,
          -10,
          5,
        );
  const equipment = bound(
    p.equipment.reduce((n, e) => n + (e.quality || 0) / 30, 0),
    0,
    4,
  );
  contributions.push({ label: 'Professional equipment', modifier: equipment });
  const leadership = ['recruit', 'guard'].includes(project.id)
    ? bound((p.skills.leadership - 50) / 10, -5, 5)
    : 0;
  contributions.push({ label: 'Leadership', modifier: leadership });
  const funded =
    funding === null ? 0 : bound((funding - project.cost) / 4, -5, 5);
  contributions.push(
    { label: 'Office and authority', modifier: authority },
    { label: 'Health and morale', modifier: condition },
    { label: 'Loyalty, reputation and connections', modifier: support },
    { label: 'Local conditions', modifier: situation },
    { label: 'Funding', modifier: funded },
  );
  const score = bound(
    p.skills[skill] +
      contributions[1].modifier +
      trait +
      authority +
      condition +
      support +
      situation +
      funded +
      equipment +
      leadership,
    5,
    110,
  );
  return {
    skill,
    attribute,
    score,
    chance: bound(0.27 + score / 155, 0.18, 0.92),
    contributions,
    description:
      score >= 85
        ? 'Promising, though never certain'
        : score >= 60
          ? 'A sound prospect with manageable risks'
          : score >= 40
            ? 'Possible, but the obstacles are substantial'
            : 'A difficult charge for these circumstances',
  };
}
export function practice(g, p, skill, amount = 2) {
  if (!p || p.practiceTurns[skill] === g.turn) return 0;
  p.practiceTurns[skill] = g.turn;
  const old = p.skills[skill] || 0,
    gain = amount * (old >= 90 ? 0.2 : old >= 80 ? 0.5 : 1);
  p.skills[skill] = bound(Math.round((old + gain) * 100) / 100);
  p.skillExperience[skill] =
    (p.skillExperience[skill] || 0) + Math.round(amount * 5);
  return p.skills[skill] - old;
}
export function assignmentDevelopment(
  g,
  p,
  project,
  success,
  forecast,
  source,
) {
  const skill = forecast.skill,
    gain = practice(g, p, skill, 2);
  if (project.skill !== skill) practice(g, p, project.skill, 1);
  p.reputation = bound(p.reputation + (success ? 3 : -1));
  p.morale = bound(p.morale + (success ? 3 : -3));
  const performance = {
    turn: g.turn,
    project: project.id,
    success,
    skill,
    gain,
    score: forecast.score,
    source,
  };
  p.performance.unshift(performance);
  p.performance = p.performance.slice(0, 80);
  if (project.id === 'recruit') {
    g.guards ||= { count: 18, quality: 40, morale: 55 };
    const capacity = Math.round(g.resources.population * 0.08),
      count = Math.min(
        Math.max(0, capacity - g.guards.count),
        Math.round((success ? 10 : 3) + forecast.score / 8),
      );
    g.guards.count += count;
    g.guards.quality = bound((g.guards.quality * 3 + p.skills.training) / 4);
    g.guards.morale = bound((g.guards.morale * 3 + p.morale) / 4);
    addFact(
      g,
      'recruits-trained',
      { people: [p.id], site: 'capital', count, quality: g.guards.quality },
      source,
    );
  }
  if (
    p.skills[skill] >= 80 &&
    !p.achievements.some((a) => a.kind === 'mastery' && a.skill === skill)
  ) {
    p.achievements.push({ kind: 'mastery', skill, turn: g.turn, source });
    p.connections = bound(p.connections + 5);
    appendRecord(g, {
      kind: 'achievement',
      people: [p.id],
      cause: source,
      text:
        p.name +
        ' has become a respected practitioner of ' +
        skill +
        '. Their accumulated work supports the reputation.',
    });
  }
}
export function startTraining(g, target, skill, mentor = null, source = null) {
  const student = personById(g, target),
    teacher = mentor ? personById(g, mentor) : null;
  const bond = teacher
    ? relationship(g, teacher.id, student.id, 'mentorship')
    : null;
  const baseline = {
    resources: {},
    people: { [student.id]: { skills: { [skill]: student.skills[skill] } } },
    relationships: {},
  };
  if (teacher) {
    baseline.people[teacher.id] = {
      skills: { training: teacher.skills.training },
    };
    baseline.relationships[[teacher.id, student.id].sort().join('|')] = {
      ...bond,
    };
  }
  g.trainingJobs.push({
    baseline,
    id: 'training-' + g.serial.arc++,
    student: target,
    mentor: mentor || null,
    skill,
    source,
    status: 'active',
    remaining: teacher ? 2 : 3,
    started: g.turn,
  });
  student.morale = bound(student.morale + 3);
}
export function tickTraining(g) {
  for (const j of g.trainingJobs.filter((j) => j.status === 'active')) {
    const student = personById(g, j.student),
      teacher = j.mentor ? personById(g, j.mentor) : null;
    if (!student?.alive || (j.mentor && !teacher?.alive)) {
      j.status = 'cancelled';
      appendRecord(g, {
        kind: 'training',
        cause: j.source,
        people: [j.student],
        text: 'The course ends early because its student or mentor has died.',
      });
      continue;
    }
    const before = j.baseline || snapshot(g);
    const ability = teacher
      ? Math.min(teacher.skills[j.skill], teacher.skills.training + 15)
      : 58;
    const temperament =
      teacher?.traits.reduce((n, t) => n + (traitRules[t]?.training || 0), 0) ||
      0;
    const bond = teacher
      ? relationship(g, teacher.id, student.id, 'mentorship')
      : null;
    const amount = bound(
      1 +
        (ability - student.skills[j.skill]) / 25 +
        temperament / 12 +
        (bond ? bond.trust / 100 : 0),
      0.25,
      4,
    );
    practice(g, student, j.skill, amount);
    if (teacher) {
      practice(g, teacher, 'training', 1);
      bond.trust = bound(bond.trust + 3);
      bond.affection = bound(bond.affection + 2);
    }
    j.remaining--;
    if (j.remaining === 0) {
      j.status = 'completed';
      const e = appendRecord(g, {
        kind: 'training',
        cause: j.source,
        transitions: transitionsBetween(before, g),
        people: [student.id, ...(teacher ? [teacher.id] : [])],
        text:
          student.name +
          ' completes ' +
          j.skill +
          ' training' +
          (teacher
            ? ' with ' + teacher.name
            : ' through a paid professional course') +
          '. Their ability has improved through actual practice.',
      });
      student.achievements.push({
        kind: 'training',
        skill: j.skill,
        turn: g.turn,
        source: e.id,
      });
      rememberPerson(g, student, e.text);
      if (teacher)
        rememberPerson(
          g,
          teacher,
          'They mentored ' + student.name + ' in ' + j.skill + '.',
        );
    }
  }
}
export function newPerson(
  g,
  {
    race = g.ruler.race,
    species,
    age = 26,
    role = 'Citizen',
    site = 'capital',
    parents = [],
    status = 'citizen',
    house,
  } = {},
) {
  let p,
    attempt = 0,
    id = 'person-' + g.serial.person++;
  while (g.people[id]) id = 'person-' + g.serial.person++;
  do {
    p = generatePerson(hash(String(g.seed) + id + attempt++), id, race, role, {
      age,
      origin: g.settlements[site].name,
      status,
      ...(species
        ? { species: animalHeritages.includes(species) ? species : 'Cat' }
        : {}),
      ...(house ? { house } : {}),
    });
  } while (
    Object.values(g.people).some((old) => old.name === p.name) &&
    attempt < 100
  );
  if (Object.values(g.people).some((old) => old.name === p.name))
    p.name += ' of ' + g.settlements[site].name;
  if (race === 'Beastfolk' && species) p.species = species;
  if (age < 18) {
    for (const k of Object.keys(p.skills)) p.skills[k] = 15;
  }
  p.siteId = site;
  p.location = g.settlements[site].name;
  p.parentIds = parents;
  p.birthTurn = g.turn - age * 4;
  g.people[id] = normalizePerson(g, p);
  g.notables.push(p);
  g.settlements[site].residents.push(id);
  return p;
}
export function charactersValid(g) {
  if (
    !g.people ||
    Array.isArray(g.people) ||
    !Array.isArray(g.trainingJobs) ||
    !g.relationships ||
    Array.isArray(g.relationships)
  )
    return false;
  for (const [id, p] of Object.entries(g.people)) {
    if (
      !p ||
      !idValid(id) ||
      p.id !== id ||
      typeof p.name !== 'string' ||
      !Number.isFinite(p.age) ||
      typeof p.alive !== 'boolean' ||
      !attributes.every(
        (k) =>
          Number.isFinite(p.attributes?.[k]) &&
          p.attributes[k] >= 1 &&
          p.attributes[k] <= 20,
      ) ||
      !skills.every(
        (k) =>
          Number.isFinite(p.skills?.[k]) &&
          p.skills[k] >= 0 &&
          p.skills[k] <= 100,
      ) ||
      ![
        'wealth',
        'income',
        'reputation',
        'morale',
        'connections',
        'experience',
        'health',
        'trust',
        'loyalty',
        'respect',
        'affection',
        'ambition',
        'grievance',
      ].every((k) => Number.isFinite(p[k]) && p[k] >= 0) ||
      ![
        'parentIds',
        'childIds',
        'siblingIds',
        'formerSpouseIds',
        'factionIds',
        'property',
        'equipment',
        'goals',
        'performance',
        'achievements',
        'injuries',
      ].every((k) => Array.isArray(p[k])) ||
      !p.practiceTurns ||
      !p.skillExperience ||
      Object.entries(p.skills).some(
        ([k, v]) =>
          !skills.includes(k) || !Number.isFinite(v) || v < 0 || v > 100,
      )
    )
      return false;
    if (
      p.achievements.some(
        (a) =>
          !a ||
          typeof a.kind !== 'string' ||
          !Number.isInteger(a.turn) ||
          (a.source && !g.archive.some((e) => e.id === a.source)),
      ) ||
      p.property.some(
        (item) =>
          !item || typeof item.kind !== 'string' || !g.settlements[item.site],
      ) ||
      p.injuries.some(
        (i) => !i || typeof i.kind !== 'string' || !Number.isInteger(i.until),
      )
    )
      return false;
    if (
      p.performance.some(
        (row) =>
          !row ||
          !Number.isFinite(row.gain) ||
          !Number.isFinite(row.score) ||
          typeof row.project !== 'string',
      ) ||
      p.equipment.some(
        (e) => !e || typeof e.kind !== 'string' || !Number.isFinite(e.quality),
      ) ||
      p.goals.some(
        (goal) =>
          !goal ||
          typeof goal.kind !== 'string' ||
          !Number.isFinite(goal.progress),
      )
    )
      return false;
    if (
      [
        ...p.parentIds,
        ...p.childIds,
        ...p.siblingIds,
        ...p.formerSpouseIds,
      ].some((other) => !g.people[other] || other === id) ||
      (p.spouseId && !g.people[p.spouseId])
    )
      return false;
  }
  if (
    g.trainingJobs.some(
      (j) =>
        !j ||
        !idValid(j.id) ||
        !g.people[j.student] ||
        (j.mentor && !g.people[j.mentor]) ||
        !skills.includes(j.skill) ||
        !Number.isInteger(j.remaining) ||
        j.remaining < 0 ||
        !['active', 'completed', 'cancelled'].includes(j.status) ||
        (j.source && !g.archive.some((e) => e.id === j.source)),
    )
  )
    return false;
  return Object.values(g.relationships).every(
    (r) =>
      r &&
      g.people[r.a] &&
      g.people[r.b] &&
      r.a !== r.b &&
      [
        'trust',
        'affection',
        'rivalry',
        'loyalty',
        'respect',
        'fear',
        'grievance',
        'favors',
      ].every((k) => Number.isFinite(r[k])),
  );
}
