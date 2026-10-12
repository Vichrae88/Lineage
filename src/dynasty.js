import { newPerson, relationship } from './characters.js?v=0.5.0';
import { personById, bound } from './sim-core.js?v=0.5.0';
import { appendRecord, addFact } from './history.js?v=0.5.0';
import { apportionPopulation } from './demographics.js?v=0.5.0';
export const courtCapacity = (g) =>
  g.title === 'Kingdom' ? 12 : g.title === 'City' ? 10 : 8;
export const commissionCapacity = (g) =>
  g.title === 'Kingdom' ? 5 : g.title === 'City' ? 4 : 3;
export function ancestors(g, p, depth = 5) {
  const ids = new Set(),
    visit = (person, d) => {
      if (!person || !d) return;
      for (const id of person.parentIds || []) {
        if (ids.has(id)) continue;
        ids.add(id);
        visit(personById(g, id), d - 1);
      }
    };
  visit(p, depth);
  return ids;
}
export function closeKin(g, a, b) {
  if (a.id === b.id) return true;
  const x = ancestors(g, a),
    y = ancestors(g, b);
  return (
    x.has(b.id) ||
    y.has(a.id) ||
    [...x].some((id) => y.has(id)) ||
    a.siblingIds.includes(b.id)
  );
}
function attachParents(g, child, parents) {
  child.parentIds = parents.map((p) => p.id);
  for (const p of parents)
    if (!p.childIds.includes(child.id)) p.childIds.push(child.id);
  const siblings = Object.values(g.people).filter(
    (p) =>
      p.id !== child.id &&
      p.parentIds.some((id) => child.parentIds.includes(id)),
  );
  for (const p of siblings) {
    if (!child.siblingIds.includes(p.id)) child.siblingIds.push(p.id);
    if (!p.siblingIds.includes(child.id)) p.siblingIds.push(child.id);
  }
}
export function initDynasty(g, fresh = false) {
  if (!g.familyModel) {
    g.familyModel = 1;
    if (fresh) {
      const r = g.ruler;
      const parents = ['Woman', 'Man'].map((gender, i) => {
        const p = newPerson(g, {
          race: r.race,
          species: r.species,
          age: r.age + 24 + i * 4,
          role: 'Remembered ancestor',
          site: 'capital',
          house: r.house,
        });
        p.gender = gender;
        p.alive = false;
        p.status = 'deceased';
        p.deathRecorded = true;
        p.deathTurn = -4 - i * 2;
        p.health = 0;
        p.story =
          p.name +
          ' died before ' +
          r.name +
          ' came to the throne. The family register preserves their place in the royal line.';
        return p;
      });
      attachParents(g, r, parents);
      const grandparents = [0, 1].map((i) => {
        const p = newPerson(g, {
          race: r.race,
          species: r.species,
          age: r.age + 50 + i * 3,
          role: 'Remembered ancestor',
          site: 'capital',
          house: r.house,
        });
        p.alive = false;
        p.status = 'deceased';
        p.deathRecorded = true;
        p.deathTurn = -20;
        p.health = 0;
        return p;
      });
      attachParents(g, parents[0], grandparents);
      for (const k of g.kin) {
        if (['Brother', 'Sister'].includes(k.kinship))
          attachParents(g, k, parents);
        else if (['Aunt', 'Uncle'].includes(k.kinship))
          attachParents(g, k, grandparents);
        else if (k.kinship === 'Cousin') {
          let parent = g.kin.find((k) => ['Aunt', 'Uncle'].includes(k.kinship));
          if (!parent) {
            parent = newPerson(g, {
              race: k.race,
              species: k.species,
              age: Math.max(k.age + 22, r.age + 20),
              role: 'Remembered royal kin',
              site: 'capital',
              house: r.house,
            });
            parent.alive = false;
            parent.status = 'deceased';
            parent.deathRecorded = true;
            attachParents(g, parent, grandparents);
          }
          k.age = Math.min(k.age, Math.max(12, parent.age - 18));
          k.birthTurn = -k.age * 4;
          attachParents(g, k, [parent]);
        }
      }
    } else {
      const siblings = g.kin.filter(
        (k) =>
          ['Brother', 'Sister'].includes(k.kinship) &&
          (!k.relatedTo || k.relatedTo === g.ruler.name),
      );
      for (const k of siblings) {
        if (!g.ruler.siblingIds.includes(k.id)) g.ruler.siblingIds.push(k.id);
        if (!k.siblingIds.includes(g.ruler.id)) k.siblingIds.push(g.ruler.id);
      }
    }
  }
  g.reigns ||= [{ person: g.ruler.id, number: g.dynasty, start: 0, end: null }];
  if (!g.reigns.some((r) => r.person === g.ruler.id && r.end === null))
    g.reigns.push({
      person: g.ruler.id,
      number: g.dynasty,
      start: g.turn,
      end: null,
    });
  for (const h of g.families) {
    h.headId ??=
      h.memberIds?.find((id) => personById(g, id)?.name === h.head) ||
      h.memberIds?.[0] ||
      null;
    for (const id of h.memberIds || []) {
      const p = personById(g, id);
      if (p && !p.familyIds?.includes(h.id)) {
        p.familyIds ||= [];
        p.familyIds.push(h.id);
      }
    }
    h.site ||= personById(g, h.headId)?.siteId || 'fields';
    const local = g.settlements[h.site];
    if (local && !local.families.includes(h.id)) local.families.push(h.id);
  }
}
export function claimStrength(g, p, named = false) {
  const royal = g.reigns.map((r) => r.person);
  const blood = royal.some((id) => p.parentIds.includes(id))
    ? 18
    : royal.some((id) => ancestors(g, p).has(id))
      ? 10
      : 0;
  const standing =
    (p.reputation - 50) / 5 +
    (p.skills.leadership - 40) / 8 +
    (p.connections - 40) / 8;
  return {
    score: Math.round((named ? 35 : 10) + blood + standing),
    blood,
    named,
    standing: Math.round(standing),
  };
}
export function competingClaim(g, heir) {
  return (
    Object.values(g.people)
      .filter(
        (p) =>
          p.alive &&
          p.age >= 18 &&
          p.tier !== 'reserve' &&
          p.id !== heir?.id &&
          p.id !== g.ruler.id &&
          p.status !== 'departed' &&
          (g.kin.some((k) => k.id === p.id) ||
            g.court.some((k) => k.id === p.id) ||
            ancestors(g, p).has(g.reigns[0].person)),
      )
      .sort(
        (a, b) =>
          claimStrength(g, b).score - claimStrength(g, a).score ||
          a.id.localeCompare(b.id),
      )[0] || null
  );
}
export function beginReign(g, prior, next) {
  const old = g.reigns.find((r) => r.person === prior.id && r.end === null);
  if (old) old.end = g.turn;
  if (!g.reigns.some((r) => r.person === next.id && r.end === null))
    g.reigns.push({
      person: next.id,
      number: g.dynasty,
      start: g.turn,
      end: null,
    });
  for (const p of g.court.filter((p) => p.alive && p.id !== next.id)) {
    const bond = relationship(g, p.id, next.id);
    p.trust = bound((p.trust + bond.trust) / 2);
    p.affection = bond.affection;
    p.loyalty = bound((p.loyalty + bond.loyalty) / 2);
  }
}
export function evolveRealm(g) {
  if (
    !['City', 'Kingdom'].includes(g.title) ||
    g.realmEvolution?.title === g.title
  )
    return;
  g.realmEvolution = { title: g.title, turn: g.turn };
  const capital = g.settlements.capital,
    id = 'chartered-quarter',
    population = Math.max(10, Math.floor(capital.population * 0.2));
  const counts = apportionPopulation(population, capital.demographics);
  capital.population -= population;
  for (const [race, n] of Object.entries(counts))
    capital.demographics[race] -= n;
  const name = g.name + (g.title === 'City' ? ' New Quarter' : ' Crown March');
  const site = {
    id,
    name,
    kind:
      g.title === 'City'
        ? 'Chartered urban district'
        : 'Crown-administered march',
    x: 273,
    y: 217,
    scene: 'market',
    story:
      'Recognition as a ' +
      g.title.toLowerCase() +
      ' has brought these households into a new chartered district. They need a voice in the expanding administration.',
    strength: 'A new charter opens room for workshops and public service.',
    risk: 'Distant government can lose the trust of local households.',
    rumor: 'The new charter still waits for its first appointed governor.',
  };
  g.world.sites.push(site);
  g.settlements[id] = {
    ...structuredClone(capital),
    id,
    name,
    population,
    demographics: counts,
    institutions: [],
    residents: [],
    families: [],
    history: [],
    demographicStory:
      'Households from the old capital carry their cultures into the new charter.',
    governorId: null,
  };
  const move = capital.residents
    .map((id) => personById(g, id))
    .filter((p) => p?.alive && p.id !== g.ruler.id && p.tier !== 'reserve')
    .slice(0, 3);
  for (const p of move) {
    p.siteId = id;
    p.location = name;
    g.settlements[id].residents.push(p.id);
    capital.residents = capital.residents.filter((old) => old !== p.id);
  }
  const e = appendRecord(g, {
    kind: 'realm-growth',
    site: id,
    people: [g.ruler.id],
    text:
      g.name +
      ' becomes a ' +
      g.title.toLowerCase() +
      '. ' +
      name +
      ' receives a real district charter, ' +
      population +
      ' residents, and new administrative responsibilities. The court can now sustain ' +
      commissionCapacity(g) +
      ' seasonal commissions and ' +
      courtCapacity(g) +
      ' serving retainers.',
  });
  g.settlements[id].history.push(e.id);
  addFact(g, 'realm-charter', { site: id, title: g.title }, e.id);
}
export function governDistricts(g) {
  for (const local of Object.values(g.settlements).filter(
    (s) => s.governorId,
  )) {
    const p = personById(g, local.governorId);
    if (!p?.alive || p.status !== 'serving') {
      local.governorId = null;
      continue;
    }
    const modifier = bound((p.skills.administration - 35) / 80, 0, 0.8);
    local.prosperity = bound(local.prosperity + modifier);
    local.security = bound(local.security + (p.skills.leadership - 30) / 100);
    p.wealth += g.fundedInstitutions ? 1 : 0;
  }
}
export function dynastyValid(g) {
  if (
    !Array.isArray(g.reigns) ||
    !g.reigns.length ||
    g.reigns.some(
      (r) =>
        !g.people[r.person] ||
        !Number.isInteger(r.number) ||
        !Number.isInteger(r.start) ||
        (r.end !== null && !Number.isInteger(r.end)),
    )
  )
    return false;
  if (
    Object.values(g.settlements).some(
      (s) =>
        s.governorId &&
        (!g.people[s.governorId] || !g.people[s.governorId].alive),
    )
  )
    return false;
  for (const p of Object.values(g.people)) {
    if (
      p.parentIds.length > 2 ||
      p.parentIds.some((id) =>
        ancestors(g, g.people[id], Object.keys(g.people).length).has(p.id),
      )
    )
      return false;
    if (
      p.parentIds.some((id) => !g.people[id].childIds.includes(p.id)) ||
      p.childIds.some((id) => !g.people[id].parentIds.includes(p.id)) ||
      p.siblingIds.some((id) => !g.people[id].siblingIds.includes(p.id))
    )
      return false;
    if (
      p.spouseId &&
      (g.people[p.spouseId].spouseId !== p.id ||
        !p.alive ||
        !g.people[p.spouseId].alive)
    )
      return false;
  }
  return true;
}
