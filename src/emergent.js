import {
  commerceProposals,
  resolveCommerceEvent,
} from './commerce-events.js?v=0.5.2';
import { personById, bound } from './sim-core.js?v=0.5.2';
import { appendRecord, addFact } from './history.js?v=0.5.2';
import { createInstitution } from './settlements.js?v=0.5.2';
const option = (id, label, note, cost, effects = {}) => ({
  id,
  label,
  note,
  cost,
  effects,
});
export function initEmergent(g) {
  g.eventMemory ||= { templates: {}, subjects: {}, fingerprints: {} };
}
function proposals(g) {
  const people = Object.values(g.people).filter(
    (p) =>
      p.alive && p.age >= 18 && p.tier !== 'reserve' && p.id !== g.ruler.id,
  );
  const result = [],
    speaker = (site) => people.find((p) => p.siteId === site) || people[0];
  const shortage = Object.values(g.settlements).find((s) =>
    s.problems.includes('food shortage'),
  );
  if (shortage && speaker(shortage.id))
    result.push({
      template: 'shortage',
      priority: 100,
      site: shortage.id,
      speaker: speaker(shortage.id),
      fingerprint: shortage.id + '-' + shortage.shortageEpisode,
      title: 'The stores behind the closed doors',
      text:
        shortage.name +
        ' is short of food. Households have begun dividing meals and changing their work. Their speaker asks what protection should mean before the next harvest.',
      options: [
        option(
          'import',
          'Buy grain without a private privilege',
          '18 gold brings food now. The crown takes responsibility for the shortfall.',
          18,
          { food: 30, happiness: 2 },
        ),
        option(
          'ration',
          'Organize an equal public ration',
          'No coin is needed. Stretch food through shared limits; the loss of choice burdens everyone.',
          0,
          { food: 12, happiness: -3, health: 2 },
        ),
        option(
          'guild',
          'Accept the guild’s grain on credit',
          '6 gold now, with a recorded obligation to repay 8 gold after two seasons.',
          6,
          { food: 25 },
        ),
      ],
    });
  for (const i of g.institutions.filter(
    (i) => i.status === 'active' && i.condition < 50,
  )) {
    const p = speaker(i.site);
    if (p)
      result.push({
        template: 'institution',
        priority: 80,
        site: i.site,
        speaker: p,
        origin: i.source,
        institution: i.id,
        fingerprint: i.id + '-' + Math.floor(i.condition / 15),
        title: 'The promise under a leaking roof',
        text:
          i.name +
          ' has deteriorated to ' +
          Math.round(i.condition) +
          ' condition. Its staff can no longer deliver the work promised at its founding. The choices concern who will carry that obligation next.',
        options: [
          option(
            'repair',
            'Repair it and protect the original purpose',
            '16 gold restores the building; the royal upkeep continues.',
            16,
            { infrastructure: 3 },
          ),
          option(
            'guild',
            'Let the guild maintain it under a lease',
            'No immediate cost. Royal upkeep ends, and guild influence grows over access and work.',
            0,
            { trade: 3, justice: -2 },
          ),
          option(
            'close',
            'Close it honestly until the realm can afford it',
            'No immediate cost. The building remains, but its work and classes pause.',
            0,
            { happiness: -2 },
          ),
        ],
      });
  }
  for (const f of Object.values(g.facts).filter(
    (f) => f.kind === 'family-grievance' && f.status === 'active',
  )) {
    const family = g.families.find((h) => h.id === f.family),
      p = (family?.memberIds || [])
        .map((id) => personById(g, id))
        .find((p) => p?.alive && p.age >= 18 && p.id !== g.ruler.id);
    if (p && g.turn - f.turn >= 8)
      result.push({
        template: 'family-memory',
        priority: 68,
        site: p.siteId,
        speaker: p,
        origin: f.source,
        fact: f.id,
        family: family.id,
        fingerprint: f.id + '-' + p.id,
        title: 'A house remembers the old answer',
        text:
          p.name +
          ' speaks for ' +
          family.name +
          '. The house still carries the humiliation recorded in Year ' +
          f.year +
          '. A new ruler does not automatically settle a family’s grievance. They ask for a place in the realm’s future, rather than another apology in its archive.',
        options: [
          option(
            'charter',
            'Recognize a bounded family charter',
            '8 gold. Their standing recovers, while ordinary households question the privilege.',
            8,
            { legitimacy: 3, justice: -2 },
          ),
          option(
            'service',
            'Offer a public commission with clear duties',
            '5 gold. Recognition comes through useful work, which may leave private ambitions unsatisfied.',
            5,
            { justice: 3, infrastructure: 2 },
          ),
          option(
            'hearing',
            'Invite testimony before granting a privilege',
            'No coin is needed. Their grievance lessens, but they receive no private advantage.',
            0,
            { justice: 2 },
          ),
        ],
      });
  }
  const foreign = g.factions.find(
    (f) =>
      ['goblins', 'gnolls', 'elves', 'bugbears', 'beastfolk'].includes(f.id) &&
      (f.grievance >= 65 || f.trust < 20),
  );
  const envoy = foreign
    ? personById(g, g.world.factionLore[foreign.id].leaderId)
    : null;
  if (envoy?.alive)
    result.push({
      template: 'frontier',
      priority: 72,
      site: 'border',
      speaker: envoy,
      faction: foreign.id,
      fingerprint:
        foreign.id +
        '-' +
        Math.floor(foreign.grievance / 20) +
        '-' +
        Math.floor(foreign.trust / 20),
      origin:
        g.archive
          .filter(
            (e) => e.factions.includes(foreign.id) && e.kind === 'decision',
          )
          .at(-1)?.id || null,
      title: 'The border remembers our bargains',
      text:
        envoy.name +
        ' brings a sealed letter from ' +
        foreign.name +
        '. Old grievances now shape the markets at ' +
        g.settlements.border.name +
        '. Caravans hesitate at the boundary; families on both sides ask whether an earlier promise still protects them.',
      options: [
        option(
          'reparation',
          'Offer practical restitution and a new hearing',
          '16 gold repairs trust and trade, acknowledges the grievance, and gives border households relief.',
          16,
          { trade: 3, justice: 2 },
        ),
        option(
          'mediate',
          'Invite a neutral council at the crossing',
          '8 gold lowers tension, with a smaller recovery in trade and trust.',
          8,
          { legitimacy: 2 },
        ),
        option(
          'firm',
          'Hold the boundary and accept reduced trade',
          'No new expenditure. The watch gains authority, while foreign grievances and interrupted commerce persist.',
          0,
          { military: 3, trade: -3 },
        ),
      ],
    });
  const claimant = people.find((p) => p.grievance >= 20 && p.rejectedClaim);
  if (claimant)
    result.push({
      template: 'claimant',
      priority: 66,
      site: claimant.siteId,
      speaker: claimant,
      fingerprint: claimant.id + '-' + g.dynasty,
      origin: claimant.rejectedClaim.source || null,
      title: 'The heir whose name was crossed out',
      text:
        claimant.name +
        ' still lives under the testament that once promised them the throne. The new reign has not erased their disappointment. Their supporters ask for a hearing, a protected private estate, or a clear statement that the dispute is closed.',
      options: [
        option(
          'hearing',
          'Hear their claim and recognize honorable service',
          '6 gold. A public hearing lowers their personal grievance and gives the current reign a lawful answer.',
          6,
          { justice: 3, legitimacy: 2 },
        ),
        option(
          'estate',
          'Fund a private estate as a settlement',
          '12 gold passes into their actual wealth and a new local holding. Their claim remains part of history.',
          12,
        ),
        option(
          'close',
          'Defend the current succession without a grant',
          'No treasury expense. Authority grows, while the claimant’s personal grievance deepens.',
          0,
          { legitimacy: 2, happiness: -2 },
        ),
      ],
    });
  const rivalry = Object.values(g.relationships).find(
    (r) =>
      r.rivalry >= 65 && personById(g, r.a)?.alive && personById(g, r.b)?.alive,
  );
  if (rivalry) {
    const p = personById(g, rivalry.a);
    if (p.id !== g.ruler.id)
      result.push({
        template: 'rivalry',
        priority: 60,
        site: p.siteId,
        speaker: p,
        relation: [rivalry.a, rivalry.b],
        fingerprint:
          [rivalry.a, rivalry.b].sort().join('-') +
          '-' +
          Math.floor(rivalry.rivalry / 20),
        title: 'Two voices at the same table',
        text:
          p.name +
          ' and ' +
          personById(g, rivalry.b).name +
          ' have let their rivalry reach ' +
          Math.round(rivalry.rivalry) +
          '. Their work and friends now feel the strain. A forced peace, a useful competition, and a separation will change different parts of their lives.',
        options: [
          option(
            'mediate',
            'Hear both privately and negotiate boundaries',
            '6 gold supports mediation. Rivalry falls and trust has room to grow.',
            6,
          ),
          option(
            'contest',
            'Give them a shared task with separate credit',
            '4 gold. Professional practice can grow; personal affection may remain cold.',
            4,
            { infrastructure: 2 },
          ),
          option(
            'separate',
            'Give them room to work apart',
            'No coin is needed. Separation reduces rivalry, but also closes a useful connection.',
            0,
          ),
        ],
      });
  }
  const talent = people.find(
    (p) =>
      p.reputation >= 72 &&
      p.achievements.some((a) => a.kind === 'mastery') &&
      !g.court.some((c) => c.id === p.id),
  );
  if (talent)
    result.push({
      template: 'talent',
      priority: 45,
      site: talent.siteId,
      speaker: talent,
      fingerprint: talent.id + '-' + talent.achievements.length,
      title: 'A craft the court can no longer overlook',
      text:
        talent.name +
        ' has earned recognition through recorded work. Their actual professional skill and reputation now open a question: should that talent serve the crown, teach others, or travel beyond its patronage?',
      options: [
        option(
          'court',
          'Invite them to seek a royal appointment',
          '8 gold offers recognition and a place among candidates, with new expectations at court.',
          8,
          { legitimacy: 2 },
        ),
        option(
          'teach',
          'Sponsor them as an independent teacher',
          '6 gold strengthens local learning and leaves their career outside royal office.',
          6,
          { learning: 3 },
        ),
        option(
          'journey',
          'Encourage a journey and independent work',
          'No public cost. Their connections broaden, and the crown accepts a smaller claim on their service.',
          0,
          { trade: 2 },
        ),
      ],
    });
  const merchant = people.find(
    (p) => p.property.length && p.property.length < 5 && p.wealth >= 36,
  );
  if (merchant)
    result.push({
      template: 'enterprise',
      priority: 40,
      site: merchant.siteId,
      speaker: merchant,
      fingerprint: merchant.id + '-' + merchant.property.length,
      title: 'The workshop that outgrew its walls',
      text:
        merchant.name +
        ' has ' +
        Math.round(merchant.wealth) +
        ' gold of their own and a workshop at ' +
        g.settlements[merchant.siteId].name +
        '. They can expand independently, but ask whether a charter or a cooperative would serve the community better.',
      options: [
        option(
          'charter',
          'Offer a limited commercial charter',
          '4 gold. Trade grows, while the proprietor gains influence and a private advantage.',
          4,
          { trade: 5, justice: -1 },
        ),
        option(
          'cooperative',
          'Match their investment in a cooperative',
          '10 gold. Shared prosperity grows; the owner contributes personal savings too.',
          10,
          { trade: 3, justice: 3 },
        ),
        option(
          'independent',
          'Welcome expansion without a royal privilege',
          'No treasury cost. They spend their own money and keep responsibility for their bargain.',
          0,
          { trade: 2 },
        ),
      ],
    });
  const student = people.find(
    (p) => p.education?.status === 'graduated' && !p.independentStudyOffered,
  );
  if (student)
    result.push({
      template: 'graduate',
      priority: 35,
      site: student.siteId,
      speaker: student,
      fingerprint: student.id,
      title: 'A life beyond the classroom',
      text:
        student.name +
        ' has completed the education recorded in their biography. They ask for a useful task and a chance to choose what that learning becomes.',
      options: [
        option(
          'court',
          'Welcome them among court candidates',
          '10 gold offers a route to public employment, without a guaranteed office.',
          10,
          { learning: 2 },
        ),
        option(
          'teach',
          'Help them teach an apprentice',
          '6 gold strengthens local learning and their personal prospects.',
          6,
          { learning: 3 },
        ),
        option(
          'free',
          'Let them choose their own profession',
          'No expense. Their education stays with them and can serve an independent career.',
          0,
          { trade: 2 },
        ),
      ],
    });
  if (g.turn % 6 === 0 && people.length) {
    const p = people[Math.floor(g.turn / 6) % people.length],
      local = g.settlements[p.siteId];
    const previous = g.archive
      .filter((e) => e.site === p.siteId && e.kind === 'decision')
      .at(-1);
    const scenes = [
      p.name +
        ' lays a repaired tool on the table. At ' +
        local.name +
        ', households want work that can survive another difficult winter.',
      p.name +
        ' unrolls a list of neighbors who have agreed to share work at ' +
        local.name +
        '. They have organized themselves before asking the crown for anything.',
      p.name +
        ' brings a letter written by several hearths at ' +
        local.name +
        '. Their livelihoods depend on whether local agreements receive public recognition.',
      p.name +
        ' asks for a small audience before the grand council. The households of ' +
        local.name +
        ' have a practical plan and little patience for ceremony.',
    ];
    const situation =
      local.prosperity >= 65
        ? 'Recent prosperity has given them room to risk a larger undertaking.'
        : local.prosperity < 35
          ? 'Work has become scarce; a public promise now matters more than praise.'
          : 'Their daily work is steady, but tools and trusted agreements remain scarce.';
    result.push({
      template: 'local-initiative',
      priority: 20,
      site: p.siteId,
      speaker: p,
      fingerprint: p.id + '-' + Math.floor(g.turn / 24),
      title: [
        'Tools for the coming winter',
        'Neighbors who have already begun',
        'A letter from the working hearths',
        'A small plan before a grand council',
      ][Math.floor(g.turn / 6) % 4],
      origin: previous?.id || null,
      text:
        scenes[Math.floor(g.turn / 6) % 4] +
        ' ' +
        situation +
        (previous
          ? ' They recall the earlier ruling: ' + previous.text
          : ' They hope their first promise will earn a lasting place in the public record.'),
      options: [
        option(
          'tools',
          'Match a local investment in better tools',
          '10 gold. Work becomes more effective, and the organizer gains standing.',
          10,
          { infrastructure: 3 },
        ),
        option(
          'agreement',
          'Recognize a cooperative agreement',
          '4 gold. Local trust grows and the crown promises to hear its representatives.',
          4,
          { justice: 2 },
        ),
        option(
          'freedom',
          'Recognize their freedom to act',
          'No new grant or royal guarantee. Their own resources shape the result.',
          0,
          { happiness: 1 },
        ),
      ],
    });
  }
  result.push(...commerceProposals(g));
  return result;
}
export function generateEmergentEvent(g) {
  initEmergent(g);
  if (g.turn < 4 || g.pending.length >= 2) return null;
  const candidates = proposals(g).filter(
    (e) =>
      g.turn - (g.eventMemory.templates[e.template] ?? -100) >= 5 &&
      g.turn - (g.eventMemory.subjects[e.speaker.id] ?? -100) >= 6 &&
      !g.eventMemory.fingerprints[e.template + ':' + e.fingerprint],
  );
  const e = candidates.sort(
    (a, b) => b.priority - a.priority || a.template.localeCompare(b.template),
  )[0];
  if (!e) return null;
  const id = 'emergent-' + g.serial.event++;
  g.eventMemory.templates[e.template] = g.turn;
  g.eventMemory.subjects[e.speaker.id] = g.turn;
  g.eventMemory.fingerprints[e.template + ':' + e.fingerprint] = id;
  const name = e.speaker.name;
  return {
    ...e,
    id,
    type: 'audience',
    engine: 'emergent',
    speaker: e.speaker.id,
    people: [e.speaker.id],
    origin: e.origin || null,
    backdrop:
      e.template === 'enterprise'
        ? 'market'
        : e.template === 'institution'
          ? 'archive'
          : 'hall',
    text:
      'The chamberlain announces ' +
      name +
      ', who brings a matter from ' +
      g.settlements[e.site].name +
      '.\n\n' +
      e.text +
      '\n\nThe choices before you will enter the history of this place, alongside the work already done there.',
  };
}
export function resolveEmergent(g, e, choice) {
  if (
    ['commercial-concern', 'commercial-legacy', 'royal-legacy'].includes(
      e.template,
    )
  )
    resolveCommerceEvent(g, e, choice);
  const p = personById(g, e.speaker),
    local = g.settlements[e.site];
  if (e.template === 'shortage') {
    local.health = bound(local.health + 2);
    if (choice === 'guild') {
      const debt = appendRecord(g, {
        kind: 'obligation',
        cause: e.decisionOrigin || e.origin || null,
        people: [p.id],
        site: e.site,
        text: 'The guild advances grain, with 8 gold due after two seasons.',
      });
      g.obligations ||= [];
      g.obligations.push({
        id: 'debt-' + g.serial.arc++,
        source: debt.id,
        due: g.turn + 2,
        amount: 8,
        status: 'active',
        faction: 'guild',
      });
    }
  }
  if (e.template === 'institution') {
    const i = g.institutions.find((i) => i.id === e.institution);
    if (choice === 'repair') i.condition = bound(i.condition + 30);
    if (choice === 'guild') {
      i.owner = 'guild';
      i.budget = 0;
      i.condition = bound(i.condition + 15);
      local.trade = bound(local.trade + 3);
    }
    if (choice === 'close') {
      i.status = 'closed';
      i.budget = 0;
    }
  }
  if (e.template === 'family-memory') {
    const h = g.families.find((h) => h.id === e.family),
      f = g.facts[e.fact];
    h.standing = bound(h.standing + 8);
    h.fortune = bound(h.fortune + (choice === 'charter' ? 5 : 2));
    if (choice === 'charter') h.power = bound(h.power + 5);
    f.status = choice === 'hearing' ? 'ended' : 'reversed';
    f.ended = g.turn;
    p.grievance = bound(p.grievance - 12);
  }
  if (e.template === 'frontier') {
    const f = g.factions.find((f) => f.id === e.faction);
    f.trust = bound(
      f.trust + (choice === 'reparation' ? 14 : choice === 'mediate' ? 8 : -6),
    );
    f.grievance = bound(
      f.grievance +
        (choice === 'firm' ? 6 : choice === 'reparation' ? -18 : -10),
    );
    local.trade = bound(local.trade + (choice === 'firm' ? -5 : 4));
  }
  if (e.template === 'claimant') {
    p.grievance = bound(p.grievance + (choice === 'close' ? 8 : -15));
    if (choice === 'estate') {
      p.wealth += 12;
      p.property.push({
        kind: 'succession settlement',
        site: e.site,
        founded: g.turn,
      });
    }
    if (choice === 'hearing') p.respect = bound(p.respect + 5);
  }
  if (e.template === 'rivalry') {
    const key = e.relation.slice().sort().join('|'),
      r = g.relationships[key];
    r.rivalry = bound(
      r.rivalry - (choice === 'mediate' ? 18 : choice === 'separate' ? 12 : 6),
    );
    if (choice === 'mediate') r.trust = bound(r.trust + 8);
    if (choice === 'separate') r.affection = bound(r.affection - 5);
    if (choice === 'contest') {
      personById(g, r.a).skills.administration = bound(
        personById(g, r.a).skills.administration + 1,
      );
      personById(g, r.b).skills.administration = bound(
        personById(g, r.b).skills.administration + 1,
      );
    }
  }
  if (['talent', 'graduate'].includes(e.template)) {
    if (choice === 'court' && !g.applicants.some((a) => a.id === p.id))
      g.applicants.push(p);
    if (choice === 'teach') {
      p.profession = 'Teacher';
      p.role = p.status === 'serving' ? p.role : 'Teacher';
      p.wealth += 4;
      local.prosperity = bound(local.prosperity + 2);
    }
    if (choice === 'journey' || choice === 'free')
      p.connections = bound(p.connections + 5);
    p.independentStudyOffered = true;
  }
  if (e.template === 'enterprise') {
    const cost =
      choice === 'cooperative' ? 8 : choice === 'independent' ? 12 : 4;
    p.wealth = Math.max(0, p.wealth - cost);
    p.property.push({
      kind: choice === 'cooperative' ? 'cooperative' : 'expanded workshop',
      site: e.site,
      founded: g.turn,
    });
    if (choice === 'charter') p.connections = bound(p.connections + 8);
    local.prosperity = bound(
      local.prosperity + (choice === 'cooperative' ? 6 : 3),
    );
    local.trade = bound(local.trade + 3);
  }
  if (e.template === 'local-initiative') {
    if (choice === 'tools') {
      p.equipment.push({
        kind: 'local working tools',
        quality: 50,
        granted: g.turn,
      });
      local.infrastructure = bound(local.infrastructure + 5);
    }
    if (choice === 'agreement') p.connections = bound(p.connections + 4);
    if (choice === 'freedom') {
      p.wealth = Math.max(0, p.wealth - 4);
      local.prosperity = bound(local.prosperity + (p.wealth > 8 ? 2 : 0));
    }
  }
  const source = appendRecord(g, {
    kind: 'consequence',
    cause: e.decisionOrigin || e.origin,
    site: e.site,
    people: [p.id],
    families: e.family ? [e.family] : [],
    text:
      p.name +
      ' carries the ' +
      e.template.replaceAll('-', ' ') +
      ' ruling into life at ' +
      local.name +
      '. The chosen course was ' +
      choice +
      '.',
  });
  addFact(
    g,
    e.template + '-settlement',
    { site: e.site, people: [p.id], choice, instance: e.id },
    source.id,
  );
}
export function tickObligations(g) {
  g.obligations ||= [];
  for (const o of g.obligations.filter(
    (o) => o.status === 'active' && o.due <= g.turn,
  )) {
    const paid = Math.min(o.amount, g.resources.gold);
    g.resources.gold -= paid;
    o.amount -= paid;
    o.paid = (o.paid || 0) + paid;
    if (!o.amount) {
      o.status = 'paid';
      appendRecord(g, {
        kind: 'obligation',
        cause: o.source,
        text: 'The crown repays the guild’s grain advance in full.',
      });
    } else {
      o.due = g.turn + 2;
      g.factions.find((f) => f.id === o.faction).grievance = bound(
        g.factions.find((f) => f.id === o.faction).grievance + 5,
      );
    }
  }
}
