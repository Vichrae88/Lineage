import { hash, personById } from './sim-core.js?v=0.5.2';
const adjectives = {
  trust: ['trust in your rule', 'grown', 'waned'],
  loyalty: ['loyalty to the crown', 'strengthened', 'weakened'],
  affection: ['affection for you', 'deepened', 'cooled'],
  respect: ['respect for your judgment', 'grown', 'diminished'],
  grievance: ['resentment', 'eased', 'deepened'],
  reputation: ['standing among their peers', 'risen', 'fallen'],
  morale: ['spirits', 'lifted', 'sunk'],
  connections: ['circle of useful acquaintances', 'widened', 'narrowed'],
  health: ['health', 'improved', 'deteriorated'],
  ambition: ['political ambition', 'grown', 'receded'],
  fear: ['fear of the crown', 'eased', 'intensified'],
};
const personalVerbs = {
  trust: [
    ['grown', 'deepened', 'grown firmer'],
    ['waned', 'waned into greater doubt', 'waned in confidence'],
  ],
  loyalty: [
    ['strengthened', 'steadied', 'deepened in its roots'],
    ['weakened', 'faltered', 'lost its former assurance'],
  ],
  affection: [
    ['deepened', 'warmed', 'softened into tenderness'],
    ['cooled', 'receded', 'faded in warmth'],
  ],
  respect: [
    ['grown', 'deepened', 'risen'],
    ['diminished', 'faded', 'suffered'],
  ],
  grievance: [
    ['eased', 'softened', 'begun to lose its old bitterness'],
    ['deepened', 'grown sharper', 'deepened into a harder bitterness'],
  ],
  reputation: [
    ['risen', 'strengthened', 'gained weight'],
    ['fallen', 'suffered', 'declined'],
  ],
  morale: [
    ['lifted', 'brightened', 'improved'],
    ['sunk', 'darkened', 'faltered'],
  ],
  connections: [
    ['widened', 'broadened', 'expanded'],
    ['narrowed', 'contracted', 'diminished in reach'],
  ],
  health: [
    ['improved', 'recovered', 'strengthened'],
    ['deteriorated', 'weakened', 'declined'],
  ],
  ambition: [
    ['grown', 'risen', 'intensified'],
    ['receded', 'diminished', 'subsided'],
  ],
  fear: [
    ['eased', 'diminished', 'receded'],
    ['intensified', 'deepened', 'grown sharper'],
  ],
};
const capWords = {
  trust: 'remains wholehearted',
  loyalty: 'remains steadfast',
  affection: 'remains deeply felt',
  respect: 'remains undiminished',
  reputation: 'remains at its highest standing',
  morale: 'remain buoyant',
  connections: 'remains as broad as it can presently become',
  health: 'remains robust',
  ambition: 'remains fiercely held',
};
const publicNames = {
  gold: 'The treasury',
  food: 'The realm’s store of food',
  population: 'The community',
  infrastructure: 'The network of roads and public works',
  happiness: 'The feeling among the hearths',
  military: 'The realm’s readiness',
  trade: 'Commerce',
  security: 'Safety along the roads',
  legitimacy: 'Recognition of the crown',
  health: 'Public health',
  learning: 'Learning in the realm',
  ecology: 'The health of the land and its waters',
  justice: 'Confidence in the law',
  faith: 'The realm’s sacred life',
  prosperity: 'Local livelihoods',
  foodProduction: 'The land’s ability to feed its people',
  power: 'The family’s influence',
  cohesion: 'The family’s unity',
  fortune: 'The family’s fortunes',
  standing: 'The family’s standing',
};
const skills = new Set([
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
]);
const choice = (g, t, words) =>
  words[
    hash(
      String(g.seed) +
        ':' +
        t.record +
        ':' +
        t.scope +
        ':' +
        t.id +
        ':' +
        t.field,
    ) % words.length
  ];
const strength = (t) => {
  const n = Math.abs(
    t.after !== undefined ? t.after - t.before : t.change || 0,
  );
  if (['gold', 'food', 'population', 'wealth'].includes(t.field))
    return n / Math.max(20, Math.abs(t.before || 100));
  return n / 100;
};
const possessive = (name) => (name.endsWith('s') ? name + '’' : name + '’s');
export function describeChange(g, t) {
  const change = t.after !== undefined ? t.after - t.before : t.change || 0;
  const subject =
    t.name ||
    (t.scope === 'person'
      ? personById(g, t.id)?.name
      : t.scope === 'faction'
        ? g.factions.find((f) => f.id === t.id)?.name
        : t.scope === 'family'
          ? g.families.find((f) => f.id === t.id)?.name
          : t.scope === 'settlement'
            ? g.settlements[t.id]?.name
            : null) ||
    'The realm';
  const personal = t.scope === 'person',
    negativeField = ['grievance', 'fear'].includes(t.field),
    improves = negativeField ? change < 0 : change > 0,
    n = strength(t);
  const extent =
    n >= 0.15
      ? 'greatly'
      : n >= 0.08
        ? 'noticeably'
        : n <= 0.02
          ? 'slightly'
          : '';
  if (t.scope === 'relationship') {
    const label =
      {
        trust: 'mutual trust',
        loyalty: 'loyalty',
        respect: 'respect',
        affection: 'affection',
        rivalry: 'rivalry',
        fear: 'fear',
        grievance: 'unsettled grievance',
      }[t.field] || t.field;
    const better = ['rivalry', 'grievance', 'fear'].includes(t.field)
      ? change < 0
      : change > 0;
    return (
      'Between ' +
      subject +
      ', ' +
      label +
      (change === 0
        ? ' remains much as it was.'
        : ' has ' +
          (extent ? extent + ' ' : '') +
          choice(
            g,
            t,
            better
              ? t.field === 'rivalry' || negativeField
                ? ['eased', 'softened', 'diminished']
                : ['grown', 'deepened', 'strengthened']
              : t.field === 'rivalry' || negativeField
                ? ['deepened', 'intensified', 'grown sharper']
                : ['weakened', 'waned', 'diminished'],
          ) +
          '.')
    );
  }
  if (change === 0) {
    const capped =
      !['gold', 'food', 'population', 'wealth'].includes(t.field) &&
      Number.isFinite(t.before) &&
      t.before === t.after &&
      t.before >= 100;
    if (personal && adjectives[t.field])
      return (
        possessive(subject) +
        ' ' +
        adjectives[t.field][0] +
        (capped
          ? negativeField
            ? ' still runs deep; this ruling does not make it stronger.'
            : ' ' +
              (capWords[t.field] || 'remains undiminished') +
              '; this ruling adds no further change.'
          : t.field === 'morale'
            ? ' remain much as they were.'
            : ' remains much as it was.')
      );
    return (
      (personal
        ? possessive(subject) + ' ' + t.field
        : publicNames[t.field] || t.field) +
      (capped
        ? ' is already flourishing; this ruling brings no further gain.'
        : ' remains unchanged by this ruling.')
    );
  }
  if (personal && skills.has(t.field)) {
    if (
      change > 0 &&
      Number.isFinite(t.before) &&
      t.before < 80 &&
      t.after >= 80
    )
      return (
        subject +
        ' now approaches ' +
        t.field +
        ' with the assurance of a master.'
      );
    return (
      subject +
      (change > 0
        ? choice(g, t, [
            ' has become ' +
              (extent ? extent + ' ' : '') +
              'more practiced in ',
            ' has deepened their command of ',
            ' handles ',
          ])
        : ' has lost some of their former assurance in ') +
      t.field +
      (change > 0 &&
      hash(
        String(g.seed) +
          ':' +
          t.record +
          ':' +
          t.scope +
          ':' +
          t.id +
          ':' +
          t.field,
      ) %
        3 ===
        2
        ? ' with greater assurance.'
        : '.')
    );
  }
  if (personal && t.field === 'wealth')
    return (
      subject +
      (change > 0
        ? choice(g, t, [
            ' has more means to shape their own future.',
            ' can now meet more of their household’s needs.',
            ' keeps a fuller purse after this ruling.',
          ])
        : choice(g, t, [
            ' has fewer resources to support their household.',
            ' has borne a personal cost in carrying this decision.',
            ' must now manage their own affairs with less coin.',
          ]))
    );
  if (personal && adjectives[t.field]) {
    const [label] = adjectives[t.field],
      verb = choice(g, t, personalVerbs[t.field][improves ? 0 : 1]);
    let text =
      possessive(subject) +
      ' ' +
      label +
      (t.field === 'morale' ? ' have ' : ' has ') +
      (extent ? extent + ' ' : '') +
      verb +
      '.';
    if (
      t.field === 'trust' &&
      Number.isFinite(t.before) &&
      t.before >= 40 &&
      t.after < 40
    )
      text += ' They now approach the throne with suspicion.';
    if (
      t.field === 'health' &&
      Number.isFinite(t.before) &&
      t.before <= 25 &&
      t.after > 25
    )
      text += ' The gravest immediate danger has begun to pass.';
    return text;
  }
  if (t.scope === 'faction') {
    if (adjectives[t.field])
      return (
        possessive(subject) +
        ' ' +
        adjectives[t.field][0] +
        (t.field === 'morale' ? ' have ' : ' has ') +
        (extent ? extent + ' ' : '') +
        choice(g, t, personalVerbs[t.field][improves ? 0 : 1]) +
        '.'
      );
    const label = adjectives[t.field]?.[0] || 'commercial relationship';
    return (
      subject +
      (improves
        ? choice(g, t, [
            ' finds more reason to stand with the crown.',
            ' has received the ruling more warmly.',
            ' sees a firmer place for itself in the royal bargain.',
          ])
        : choice(g, t, [
            ' has grown more wary of the throne.',
            ' carries a heavier disappointment away from this ruling.',
            ' finds its dealings with the crown more troubled.',
          ])) +
      (extent === 'greatly'
        ? ' This is a substantial change in its ' + label + '.'
        : '')
    );
  }
  if (t.scope === 'family') {
    const label =
      {
        power: 'influence',
        cohesion: 'unity',
        fortune: 'fortunes',
        standing: 'standing with the crown',
      }[t.field] || t.field;
    return (
      possessive(subject) +
      ' ' +
      label +
      (t.field === 'fortune' ? ' have ' : ' has ') +
      (extent ? extent + ' ' : '') +
      choice(
        g,
        t,
        change > 0
          ? ['strengthened', 'grown firmer', 'improved']
          : ['weakened', 'come under strain', 'suffered'],
      ) +
      '.'
    );
  }
  const prefix = t.scope === 'settlement' ? subject + ' — ' : '';
  const resource = publicNames[t.field] || t.field;
  const verbs = {
    gold:
      change > 0
        ? [
            'has a little more room for the promises ahead',
            'is better able to support the work of the realm',
            'has been replenished',
          ]
        : [
            'has less room for another promise',
            'has borne the cost of this season’s decisions',
            'must now be managed more carefully',
          ],
    food:
      change > 0
        ? [
            'is better provisioned',
            'has gained a welcome measure of resilience',
            'can carry its households further toward the next harvest',
          ]
        : [
            'has been drawn down',
            'has less shelter against a difficult winter',
            'has grown thinner',
          ],
    population:
      change > 0
        ? [
            'has welcomed more residents',
            'is growing around its shared hearths',
            'has room for more lives and livelihoods',
          ]
        : [
            'has lost residents',
            'is smaller than before',
            'has fewer households to share its work',
          ],
  };
  const phrase = verbs[t.field]
    ? choice(g, t, verbs[t.field])
    : change > 0
      ? choice(g, t, [
          'has improved',
          'is on firmer ground',
          'has become stronger',
        ])
      : choice(g, t, [
          'has deteriorated',
          'is under greater strain',
          'has become less secure',
        ]);
  let text =
    prefix +
    resource +
    ' ' +
    phrase +
    (extent === 'greatly'
      ? ' to a marked degree'
      : extent === 'slightly'
        ? ' a little'
        : '') +
    '.';
  if (t.field === 'food' && Number.isFinite(t.after) && t.after === 0)
    text += ' Nothing remains in the public stores; relief can no longer wait.';
  if (t.field === 'gold' && Number.isFinite(t.after) && t.after === 0)
    text +=
      ' The treasury is empty, and some commitments may need to be postponed.';
  return text;
}
export function recordTransitions(e) {
  if (Array.isArray(e.transitions))
    return e.transitions.map((t) => ({ ...t, record: e.id }));
  return [
    ...Object.entries(e.effects || {}).map(([field, change]) => ({
      scope: 'realm',
      field,
      change,
      record: e.id,
    })),
    ...(e.changes || []).map((c) => ({
      scope: c.person ? 'person' : 'faction',
      id: c.person || c.faction,
      field: c.field,
      change: c.change,
      record: e.id,
    })),
  ];
}
export function narrativeForRecord(g, e) {
  return recordTransitions(e).map((t) => ({
    scope: t.scope,
    id: t.id,
    text: describeChange(g, t),
  }));
}
