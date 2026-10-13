import { closeKin } from './dynasty.js?v=0.5.5';
import { apportionPopulation } from './demographics.js?v=0.5.5';
import {
  bound,
  roll,
  hash,
  personById,
  rememberPerson,
} from './sim-core.js?v=0.5.5';
import {
  newPerson,
  practice,
  relationship,
  isBusy,
} from './characters.js?v=0.5.5';
import { appendRecord, addFact } from './history.js?v=0.5.5';
import { races } from './data.js?v=0.5.5';
export const lifeExpectancy = (p) =>
  ({
    Human: 85,
    Elf: 220,
    Dwarf: 150,
    Halfling: 105,
    Orc: 85,
    Goblin: 80,
    Gnoll: 80,
    Bugbear: 90,
    Beastfolk: 90,
  })[p.race] || 85;
const related = (a, b) =>
  a.id === b.id ||
  a.parentIds.includes(b.id) ||
  b.parentIds.includes(a.id) ||
  a.parentIds.some((id) => b.parentIds.includes(id)) ||
  a.siblingIds.includes(b.id) ||
  (a.house && a.house === b.house);
export function recordMarriage(g, a, b, source = null) {
  if (a.spouseId || b.spouseId || a.age < 18 || b.age < 18 || closeKin(g, a, b))
    return false;
  a.spouseId = b.id;
  b.spouseId = a.id;
  const r = relationship(g, a.id, b.id, 'marriage');
  r.affection = bound(r.affection + 10);
  r.trust = bound(r.trust + 8);
  const e = appendRecord(g, {
    kind: 'marriage',
    cause: source,
    people: [a.id, b.id],
    text:
      a.name +
      ' and ' +
      b.name +
      ' marry. Their households and loyalties now share a future.',
  });
  rememberPerson(g, a, e.text);
  rememberPerson(g, b, e.text);
  return e;
}
export function recordDeath(
  g,
  p,
  cause = 'illness',
  source = null,
  site = p.siteId,
) {
  if (p.deathRecorded) return;
  p.deathRecorded = true;
  p.alive = false;
  p.status = 'deceased';
  p.deathTurn = g.turn;
  const e = appendRecord(g, {
    kind: 'death',
    cause: source,
    people: [p.id],
    site,
    text:
      p.name + ' dies of ' + cause + '. Their history and obligations remain.',
  });
  const heirs = p.childIds
    .map((id) => personById(g, id))
    .filter((p) => p?.alive);
  if (!heirs.length && p.spouseId && personById(g, p.spouseId)?.alive)
    heirs.push(personById(g, p.spouseId));
  if (!heirs.length && g.heir && personById(g, g.heir)?.alive)
    heirs.push(personById(g, g.heir));
  for (const h of heirs) {
    h.wealth += Math.floor(p.wealth / Math.max(1, heirs.length));
    h.achievements.push({ kind: 'inheritance', turn: g.turn, source: e.id });
    rememberPerson(g, h, 'They inherited part of ' + p.name + '’s estate.');
  }
  if (heirs[0]) {
    heirs[0].property.push(
      ...p.property.map((item) => ({ ...item, inheritedFrom: p.id })),
    );
    heirs[0].equipment.push(
      ...p.equipment.map((item) => ({ ...item, inheritedFrom: p.id })),
    );
  }
  p.property = [];
  p.equipment = [];
  p.wealth = 0;
  if (p.spouseId) {
    const spouse = personById(g, p.spouseId);
    if (spouse) {
      spouse.formerSpouseIds.push(p.id);
      spouse.spouseId = null;
      spouse.morale = bound(spouse.morale - 10);
    }
    p.formerSpouseIds.push(p.spouseId);
    p.spouseId = null;
  }
  if (g.spouse === p.id) g.spouse = null;
  for (const local of Object.values(g.settlements))
    if (local.governorId === p.id) local.governorId = null;
}
export function acknowledgeBirth(g, child, a, b) {
  child.familyIds = [
    ...new Set([...(a.familyIds || []), ...(b.familyIds || [])]),
  ];
  for (const h of g.families)
    if (child.familyIds.includes(h.id) && !h.memberIds.includes(child.id))
      h.memberIds.push(child.id);
  child.profession = 'Child';
  child.wealth = 0;
  child.income = 0;
  child.tier = 'secondary';
  for (const skill of Object.keys(child.skills))
    child.skills[skill] = Math.min(15, child.skills[skill]);
  for (const key of Object.keys(child.attributes))
    child.attributes[key] = Math.max(
      2,
      Math.round((a.attributes[key] + b.attributes[key]) / 4),
    );
  child.parentIds = [a.id, b.id];
  child.house = a.house;
  child.birthTurn = g.turn;
  child.role = 'Child';
  for (const p of [a, b]) {
    if (!p.childIds.includes(child.id)) p.childIds.push(child.id);
    p.lastBirthTurn = g.turn;
  }
  for (const sibling of Object.values(g.people).filter(
    (p) =>
      p.id !== child.id &&
      p.parentIds.some((id) => child.parentIds.includes(id)),
  )) {
    if (!child.siblingIds.includes(sibling.id))
      child.siblingIds.push(sibling.id);
    if (!sibling.siblingIds.includes(child.id))
      sibling.siblingIds.push(child.id);
  }
  const e = appendRecord(g, {
    kind: 'birth',
    people: [child.id, a.id, b.id],
    site: a.siteId,
    text:
      child.name +
      ' is born into the household of ' +
      a.name +
      ' and ' +
      b.name +
      '.',
  });
  child.birthRecord = e.id;
}
export function tickPeople(g) {
  const listed = new Set(
    [...g.court, ...g.children, ...g.kin, g.ruler].map((p) => p.id),
  );
  const living = Object.values(g.people).filter((p) => p.tier !== 'reserve');
  for (const p of living) {
    if (!p.alive) {
      recordDeath(g, p, p.health <= 0 ? 'illness' : 'old age');
      continue;
    }
    if (g.season === 0 && !listed.has(p.id)) {
      p.age++;
      if (p.age > lifeExpectancy(p) * 0.7) p.health = bound(p.health - 3);
      if (
        p.health <= 0 ||
        (p.age > lifeExpectancy(p) && roll(g, p.id + '-mortality') < 0.18)
      ) {
        recordDeath(g, p, p.health <= 0 ? 'illness' : 'old age');
        continue;
      }
    }
    if (g.season === 0 && p.age <= 18 && p.parentIds.length) {
      for (const key of Object.keys(p.attributes))
        p.attributes[key] = bound(p.attributes[key] + 0.5, 1, 20);
    }
    if (p.age < 18) {
      if (p.age >= 12 && !isBusy(g, p.id) && g.season === 0)
        practice(g, p, 'scholarship', 1);
      continue;
    }
    if (p.tier === 'secondary' && (g.turn + hash(p.id)) % 4 !== 0) continue;
    const wages =
      p.status === 'serving' || p.id === g.ruler.id
        ? p.income * (g.wageFraction ?? 1)
        : Math.max(1, p.income);
    const shortage = g.resources.food === 0;
    p.wealth = Math.max(
      0,
      Math.round((p.wealth + wages - (shortage ? 3 : 1)) * 100) / 100,
    );
    p.morale = bound(p.morale + (shortage ? -5 : 1));
    if (p.health < 85 && !shortage && p.age < lifeExpectancy(p) * 0.7)
      p.health = bound(p.health + 1);
    for (const injury of p.injuries)
      if (injury.until <= g.turn) injury.status = 'healed';
    if (p.id === g.ruler.id || isBusy(g, p.id)) continue;
    const goal = p.goals.find((goal) => goal.status === 'active');
    if (!goal) continue;
    goal.progress += 1;
    const last = p.performance[0];
    if ((!last || last.turn < g.turn - 1) && goal.kind === 'learn')
      practice(
        g,
        p,
        p.profession === 'Teacher'
          ? 'training'
          : p.profession === 'Scholar'
            ? 'scholarship'
            : 'trade',
        0.5,
      );
    if (
      goal.kind === 'wealth' &&
      goal.progress >= 6 &&
      p.wealth >= 24 &&
      p.property.length < 3
    ) {
      p.wealth -= 18;
      p.property.push({ kind: 'workshop', site: p.siteId, founded: g.turn });
      p.income = Math.min(6, p.income + 0.5);
      p.reputation = bound(p.reputation + 3);
      goal.progress = 0;
      const local = g.settlements[p.siteId];
      local.trade = bound(local.trade + 2);
      local.prosperity = bound(local.prosperity + 2);
      const e = appendRecord(g, {
        kind: 'enterprise',
        people: [p.id],
        site: p.siteId,
        text:
          p.name +
          ' invests their own savings in a workshop at ' +
          local.name +
          '. Its trade belongs to the local economy.',
      });
      addFact(
        g,
        'private-enterprise',
        { site: p.siteId, people: [p.id] },
        e.id,
      );
    }
    if (goal.kind === 'community' && goal.progress >= 5 && p.wealth >= 12) {
      p.wealth -= 6;
      g.settlements[p.siteId].health = bound(
        g.settlements[p.siteId].health + 2,
      );
      goal.progress = 0;
      p.reputation = bound(p.reputation + 2);
    }
    if (goal.kind === 'influence' && goal.progress >= 5) {
      p.connections = bound(p.connections + 2);
      p.reputation = bound(p.reputation + 1);
      goal.progress = 0;
    }
    const peers = living.filter(
      (other) =>
        other.alive &&
        other.tier !== 'reserve' &&
        other.id !== p.id &&
        other.id !== g.ruler.id &&
        other.age >= 18 &&
        other.siteId === p.siteId,
    );
    const other = peers[Math.floor(roll(g, p.id + '-peer') * peers.length)];
    if (other) {
      const bond = relationship(g, p.id, other.id);
      const competing =
        p.traits.includes('Suspicious') ||
        p.traits.includes('Ruthless') ||
        (p.ambition > 65 && other.ambition > 65);
      if (competing) {
        bond.rivalry = bound(bond.rivalry + 2);
        bond.grievance = bound(bond.grievance + 1);
      } else {
        bond.trust = bound(bond.trust + 2);
        bond.affection = bound(bond.affection + 3);
      }
      if (
        !p.spouseId &&
        !other.spouseId &&
        other.spouseId !== g.ruler.id &&
        bond.affection >= 65 &&
        Math.abs(p.age - other.age) <= 20 &&
        roll(g, p.id + '-marriage') < 0.2
      )
        recordMarriage(g, p, other);
    }
    const partner = personById(g, p.spouseId);
    if (
      partner?.alive &&
      partner.id !== g.ruler.id &&
      p.id < partner.id &&
      p.age < lifeExpectancy(p) * 0.55 &&
      partner.age < lifeExpectancy(partner) * 0.55 &&
      g.turn - (p.lastBirthTurn ?? -10) >= 5 &&
      roll(g, p.id + '-child') < 0.12 &&
      Object.values(g.people).filter((p) => p.alive && p.tier !== 'reserve')
        .length < 400
    ) {
      const parent = roll(g, p.id + '-heritage') < 0.5 ? p : partner;
      const child = newPerson(g, {
        race: parent.race,
        species: parent.species,
        age: 0,
        role: 'Child',
        site: p.siteId,
        parents: [p.id, partner.id],
        house: p.house,
      });
      acknowledgeBirth(g, child, p, partner);
    }
    if (p.status === 'serving' && p.loyalty < 15 && p.morale < 35) {
      p.status = 'departed';
      p.location = g.settlements[p.siteId].name;
      const e = appendRecord(g, {
        kind: 'departure',
        people: [p.id],
        text:
          p.name +
          ' leaves royal service. Low confidence and poor morale have made their office a burden.',
      });
      addFact(
        g,
        'former-adviser',
        { people: [p.id], choice: 'departure' },
        e.id,
      );
      if (g.heir === p.id) g.heir = null;
    }
  }
  for (const child of g.children)
    if (!child.birthRecord && child.parentIds.length === 2)
      acknowledgeBirth(
        g,
        child,
        personById(g, child.parentIds[0]),
        personById(g, child.parentIds[1]),
      );
  if (
    g.turn % 8 === 0 &&
    g.resources.happiness >= 55 &&
    g.resources.justice >= 45 &&
    g.resources.population < (g.scale === 'town' ? 4500 : 26000)
  ) {
    const race = races[Math.floor(roll(g, 'migration-race') * races.length)];
    const site = roll(g, 'migration-place') < 0.6 ? 'border' : 'capital';
    const p = newPerson(g, {
      race,
      age: 20 + Math.floor(roll(g, 'migration-age') * 18),
      role: 'Newcomer',
      site,
    });
    p.goals = [{ kind: 'wealth', progress: 0, status: 'active' }];
    const s = g.settlements[site];
    s.population += 12;
    if (s.demographics) s.demographics[race] = (s.demographics[race] || 0) + 12;
    appendRecord(g, {
      kind: 'migration',
      people: [p.id],
      site,
      text:
        p.name +
        ' arrives with eleven other newcomers, drawn by the realm’s safety and welcome.',
    });
  }
  updateLeaders(g);
}
function updateLeaders(g) {
  for (const h of g.families) {
    const alive = (h.memberIds || [])
      .map((id) => personById(g, id))
      .filter((p) => p?.alive);
    const head = alive.find((p) => p.id === h.headId) || alive[0];
    if (head) {
      h.headId = head.id;
      h.head = head.name;
    } else {
      h.headId = null;
      h.head = 'The remembered line';
    }
  }
  for (const f of g.factions) {
    const lore = g.world.factionLore[f.id];
    if (personById(g, lore.leaderId)?.alive) continue;
    const p =
      Object.values(g.people).find(
        (p) =>
          p.alive &&
          p.tier !== 'reserve' &&
          p.age >= 18 &&
          p.faction === f.id &&
          p.id !== g.ruler.id,
      ) ||
      newPerson(g, {
        race:
          f.id === 'elves'
            ? 'Elf'
            : f.id === 'gnolls'
              ? 'Gnoll'
              : f.id === 'goblins'
                ? 'Goblin'
                : f.id === 'bugbears'
                  ? 'Bugbear'
                  : f.id === 'beastfolk'
                    ? 'Beastfolk'
                    : g.ruler.race,
        role: 'Faction representative',
        site: 'capital',
      });
    lore.leader = p.name;
    lore.leaderId = p.id;
    p.faction = f.id;
    p.factionIds = [f.id];
    lore.story =
      p.name +
      ' now represents ' +
      f.name +
      '. Earlier leaders and bargains remain part of its history. ' +
      lore.goal;
  }
  for (const company of g.parties) {
    if (personById(g, company.leaderId)?.alive) continue;
    const p =
      (company.memberIds || [])
        .map((id) => personById(g, id))
        .find((p) => p?.alive) ||
      newPerson(g, { role: 'Company captain', site: 'border' });
    company.leaderId = p.id;
    company.leader = p.name;
    company.memberIds ||= [];
    if (!company.memberIds.includes(p.id)) company.memberIds.push(p.id);
    company.members = company.memberIds
      .map((id) => {
        const p = personById(g, id);
        return p
          ? p.name + (p.alive ? '' : ' (remembered)')
          : 'An earlier companion';
      })
      .join('; ');
  }
}
export function tickCommunities(g) {
  const locals = Object.values(g.settlements);
  const current = locals.reduce((n, s) => n + s.population, 0);
  const capacity =
    (g.scale === 'town'
      ? g.title === 'City'
        ? 4200
        : 1800
      : g.title === 'Kingdom'
        ? 38000
        : 18000) +
    g.institutions.filter((i) => i.status === 'active').length * 150;
  for (const s of locals) {
    const rate =
      g.resources.food === 0
        ? -0.012
        : g.resources.happiness > 50 && g.resources.health > 35
          ? 0.006 * (1 - current / capacity)
          : -0.003;
    const old = s.population;
    s.population = Math.max(10, Math.round(old * (1 + rate)));
    if (s.demographics)
      s.demographics = apportionPopulation(s.population, s.demographics);
    s.health = bound(
      s.health +
        (g.resources.health - s.health) * 0.05 -
        (g.resources.food === 0 ? 2 : 0),
    );
    s.security = bound(s.security + (g.resources.security - s.security) * 0.08);
    s.prosperity = bound(
      s.prosperity +
        (g.resources.food === 0 ? -2 : 0.1) -
        (g.policies.tax === 'heavy' ? 0.4 : 0),
    );
    if (g.resources.food === 0 && !s.problems.includes('food shortage')) {
      s.problems.push('food shortage');
      s.shortageEpisode = (s.shortageEpisode || 0) + 1;
    }
    if (g.resources.food > 0)
      s.problems = s.problems.filter((p) => p !== 'food shortage');
  }
  g.resources.population = locals.reduce((n, s) => n + s.population, 0);
}

export function initializeKnownFigures(g) {
  for (const [id, lore] of Object.entries(g.world.factionLore)) {
    if (lore.leaderId) continue;
    const old = Object.values(g.people).find((p) => p.name === lore.leader);
    const p =
      old ||
      newPerson(g, {
        race:
          id === 'elves'
            ? 'Elf'
            : id === 'goblins'
              ? 'Goblin'
              : id === 'gnolls'
                ? 'Gnoll'
                : id === 'bugbears'
                  ? 'Bugbear'
                  : id === 'beastfolk'
                    ? 'Beastfolk'
                    : g.ruler.race,
        role: 'Faction representative',
        site: 'capital',
      });
    if (!old) p.name = lore.leader;
    p.faction = id;
    p.factionIds = [id];
    lore.leaderId = p.id;
  }
  for (const company of g.parties) {
    if (company.leaderId) continue;
    const p = newPerson(g, { role: 'Company captain', site: 'border' });
    p.name = company.leader;
    company.leaderId = p.id;
    company.memberIds = [p.id];
  }
  for (const h of g.families) {
    if (h.memberIds) continue;
    const old = Object.values(g.people).find((p) => p.name === h.head);
    const p =
      old ||
      newPerson(g, {
        race: h.faction === 'elves' ? 'Elf' : g.ruler.race,
        role: 'Head of family',
        site: 'fields',
      });
    if (!old) p.name = h.head;
    p.house = h.name.replace(/^House /, '');
    p.familyId = h.id;
    h.memberIds = [p.id];
    h.headId = p.id;
  }
}
