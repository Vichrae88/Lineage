import { seasonalAssessmentView } from './court-life-ui.js?v=0.5.5';
import { dilemmaReport } from './dilemma-ui.js?v=0.5.5';
import { advisorView } from './advisors-ui.js?v=0.5.5';
import { gold as coins, moneyField } from './format.js?v=0.5.5';
import { narrativeView, exactLedger } from './narrative-ui.js?v=0.5.5';
import { seasonProjection } from './economy.js?v=0.5.5';
import { personById } from './sim-core.js?v=0.5.5';
export const escapeText = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
const esc = escapeText;
const button = (text, action, extra = '') =>
  '<button type="button" data-action="' +
  action +
  '" ' +
  extra +
  '>' +
  text +
  '</button>';
const signed = (n) => (n > 0 ? '+' : '') + Math.round(n * 100) / 100;
export const changeList = (changes) =>
  '<div class="change-grid">' +
  Object.entries(changes || {})
    .map(
      ([k, n]) =>
        '<div><small>' +
        esc(k) +
        '</small><strong>' +
        (moneyField(k) ? coins(n, true) : signed(n)) +
        '</strong></div>',
    )
    .join('') +
  '</div>';
export function projectionView(g, choices) {
  const p = seasonProjection(g);
  return (
    '<span class="eyebrow">BEFORE THE CALENDAR TURNS</span><h2 id="dialog-title">The next season’s accounts</h2><p class="lead">' +
    esc(p.assumptions) +
    '</p><div class="projection-grid"><section><h3>The treasury</h3><dl><dt>Expected income</dt><dd>' +
    coins(p.income) +
    ' gold</dd>' +
    (p.magicalIncome
      ? '<dt>Of this, lasting magical gifts</dt><dd>' +
        coins(p.magicalIncome) +
        ' gold</dd>'
      : '') +
    '<dt>Court wages</dt><dd>' +
    coins(p.wages) +
    '</dd><dt>Institutions & watch</dt><dd>' +
    coins(p.upkeep) +
    '</dd><dt>Courts of justice</dt><dd>' +
    coins(p.law) +
    '</dd><dt>Projected balance</dt><dd>' +
    coins(p.balance, true) +
    ' gold</dd></dl></section><section><h3>The stores</h3><dl><dt>Consumption</dt><dd>' +
    p.consumption +
    '</dd><dt>Expected harvest</dt><dd>' +
    p.harvest +
    '</dd>' +
    (p.magicalFood
      ? '<dt>Lasting gifts to the stores</dt><dd>' + p.magicalFood + '</dd>'
      : '') +
    '<dt>Expected spoilage</dt><dd>' +
    p.spoilage +
    '</dd><dt>Projected change</dt><dd>' +
    signed(p.foodBalance) +
    '</dd></dl></section></div>' +
    (g.resources.gold + p.balance < 0
      ? '<p class="blocked">The treasury may not cover every obligation. Unfunded institutions lose condition.</p>'
      : '') +
    (g.resources.food + p.foodBalance <= 0
      ? '<p class="blocked">Stores may run short. Choose relief or replenish the granaries before hardship deepens.</p>'
      : '') +
    advisorView(g, { type: 'season', options: choices }) +
    '<h3>What counsel guides this season?</h3><div class="decision-options">' +
    choices
      .map((o) =>
        button(
          '<strong>' +
            esc(o.label) +
            '</strong><span>' +
            esc(o.note) +
            '</span><small>' +
            coins(o.cost) +
            ' gold</small>',
          'season-counsel',
          'data-choice="' +
            o.id +
            '" class="decision-option" ' +
            (g.resources.gold < o.cost ? 'disabled' : ''),
        ),
      )
      .join('') +
    '</div><p class="ink-note">Forecasts describe the current plan, not guaranteed project successes.</p>'
  );
}
export function outcomeView(g) {
  const o = g.lastOutcome,
    e = g.archive.find((e) => e.id === o?.entry);
  if (!e) return '<h2 id="dialog-title">The chronicle holds your decision</h2>';
  return (
    chronicleMoment(e) +
    '<span class="eyebrow">YOUR WORD HAS CONSEQUENCES</span><h2 id="dialog-title">The ruling is recorded</h2><p class="lead">' +
    esc(o.text) +
    '</p>' +
    narrativeView(g, e) +
    dilemmaReport(g, e) +
    seasonalAssessmentView(e) +
    exactLedger(g, e) +
    (o.facts.length
      ? '<h3>A lasting condition</h3>' +
        o.facts
          .map(
            (id) =>
              '<p>' + esc(g.facts[id]?.kind.replaceAll('-', ' ')) + '</p>',
          )
          .join('')
      : '') +
    '<div class="profile-actions">' +
    button(
      'Open the decision in the Chronicle',
      'entry',
      'data-id="' + e.id + '"',
    ) +
    button('Continue at court →', 'continue-court', 'class="primary"') +
    '</div>'
  );
}
export function assessmentView(e) {
  const a = e.assessment;
  if (!a) return '';
  return (
    '<details class="assignment-analysis"><summary>Why this commission ' +
    (e.success ? 'succeeded' : 'made partial progress') +
    '</summary><p>' +
    esc(a.skill) +
    ' supported an effectiveness assessment of ' +
    Math.round(a.score) +
    '. The estimated chance of full completion was ' +
    Math.round(a.chance * 100) +
    '%; uncertainty and local resistance remained.</p>' +
    a.contributions
      .map(
        (c) =>
          '<p>' +
          esc(c.label) +
          ': ' +
          (c.value !== undefined && c.value !== null ? c.value + ' · ' : '') +
          (c.modifier >= 0 ? '+' : '') +
          Math.round(c.modifier * 10) / 10 +
          '</p>',
      )
      .join('') +
    changeList(e.effects) +
    '</details>'
  );
}
export function seasonReportView(g) {
  const r = g.lastSeasonReport;
  if (!r) return '<h2 id="dialog-title">No season has passed yet</h2>';
  return (
    '<span class="eyebrow">WHAT ACTUALLY HAPPENED</span><h2 id="dialog-title">' +
    ['Spring', 'Summer', 'Autumn', 'Winter'][r.season] +
    ', Year ' +
    r.year +
    '</h2><p class="lead">Your commissions were tested, courtiers carried their own work forward, and the household’s obligations came due. Each new season also brings a 33% chance of an unexpected event.</p>' +
    narrativeView(g, {
      id: r.id,
      effects: r.changes,
      transitions: r.transitions,
    }) +
    exactLedger(g, {
      id: r.id,
      effects: r.changes,
      transitions: r.transitions,
    }) +
    (r.economy.unpaid
      ? '<p class="blocked">The treasury could not meet every planned commitment. Court wages were reduced and public institutions lost condition.</p>'
      : '') +
    '<h3>Work and lives changed</h3>' +
    r.outcomes
      .map((id) => {
        const e = g.archive.find((e) => e.id === id);
        return e
          ? '<p>' +
              esc(e.text) +
              ' ' +
              button(
                'Trace this chapter',
                'entry',
                'data-id="' + id + '" class="text-button"',
              ) +
              '</p>' +
              assessmentView(e)
          : '';
      })
      .join('') +
    '<div class="profile-actions">' +
    button(
      g.event ? 'Hear the next audience →' : 'Return to the realm →',
      'continue-court',
      'class="primary"',
    ) +
    button('Read the full Chronicle', 'chronicle') +
    '</div>'
  );
}
const selector = (key, label, values, value) =>
  '<label>' +
  label +
  '<select id="chronicle-' +
  key +
  '" data-chronicle-filter="' +
  key +
  '"><option value="">Every ' +
  label.toLowerCase() +
  '</option>' +
  values
    .map(
      ([id, name]) =>
        '<option value="' +
        esc(id) +
        '" ' +
        (value === String(id) ? 'selected' : '') +
        '>' +
        esc(name) +
        '</option>',
    )
    .join('') +
  '</select></label>';
export function archiveView(g, filters = {}) {
  const people = [
    ...new Map(
      g.archive
        .flatMap((e) => e.people)
        .map((id) => [id, personById(g, id)?.name || id]),
    ).entries(),
  ];
  const rulers = [
    ...new Map(
      g.archive.map((e) => [
        e.ruler,
        e.rulerName || personById(g, e.ruler)?.name || e.ruler,
      ]),
    ).entries(),
  ];
  const options = [
    [
      'kind',
      'Kind',
      [...new Set(g.archive.map((e) => e.kind))].map((k) => [k, k]),
    ],
    ['ruler', 'Ruler', rulers],
    ['person', 'Person', people],
    ['site', 'Place', Object.values(g.settlements).map((s) => [s.id, s.name])],
    ['family', 'Family', g.families.map((h) => [h.id, h.name])],
    ['faction', 'Faction', g.factions.map((f) => [f.id, f.name])],
    [
      'year',
      'Year',
      [...new Set(g.archive.map((e) => e.year))].map((n) => [n, n]),
    ],
  ];
  const entries = g.archive
    .filter(
      (e) =>
        (!filters.kind || e.kind === filters.kind) &&
        (!filters.ruler || e.ruler === filters.ruler) &&
        (!filters.person || e.people.includes(filters.person)) &&
        (!filters.site || e.site === filters.site) &&
        (!filters.family || e.families.includes(filters.family)) &&
        (!filters.faction || e.factions.includes(filters.faction)) &&
        (!filters.year || String(e.year) === filters.year),
    )
    .slice()
    .reverse();
  return (
    '<span class="eyebrow">A HISTORY BEYOND ONE REIGN</span><h2 id="dialog-title">The chronicle of ' +
    esc(g.name) +
    '</h2><div class="chronicle-filters">' +
    options
      .map(([key, label, values]) => selector(key, label, values, filters[key]))
      .join('') +
    '</div><p class="quiet">' +
    entries.length +
    ' recorded chapters. Major records are retained across reigns.</p>' +
    entries
      .slice(0, 100)
      .map(
        (e) =>
          '<article class="archive-entry"><small>' +
          ['Spring', 'Summer', 'Autumn', 'Winter'][e.season] +
          ', Year ' +
          e.year +
          ' · ' +
          esc(e.kind) +
          '</small><p>' +
          esc(e.text) +
          '</p>' +
          button(
            'Read its causes and consequences',
            'entry',
            'data-id="' + e.id + '" class="text-button"',
          ) +
          '</article>',
      )
      .join('') +
    (entries.length > 100
      ? '<p class="quiet">Showing the latest hundred matching chapters; narrow the filters for earlier history.</p>'
      : '')
  );
}
export function entryView(g, id) {
  const e = g.archive.find((e) => e.id === id);
  if (!e) return '<h2 id="dialog-title">This chapter is not in the record</h2>';
  const origin = g.archive.find((old) => old.id === e.cause);
  const later = g.archive.filter((child) => child.cause === e.id);
  return (
    chronicleMoment(e) +
    '<span class="eyebrow">THE CAUSE AND ITS CONSEQUENCES</span><h2 id="dialog-title">' +
    esc(e.kind.replaceAll('-', ' ')) +
    ' · Year ' +
    e.year +
    '</h2><p class="lead">' +
    esc(e.text) +
    '</p>' +
    narrativeView(g, e) +
    dilemmaReport(g, e) +
    seasonalAssessmentView(e) +
    exactLedger(g, e) +
    assessmentView(e) +
    (origin
      ? '<h3>Why it happened</h3><p>' +
        esc(origin.text) +
        '</p>' +
        button(
          'Read the originating decision',
          'entry',
          'data-id="' + origin.id + '" class="text-button"',
        )
      : '') +
    '<h3>The lasting facts</h3>' +
    Object.values(g.facts)
      .filter((f) => f.source === id)
      .map(
        (f) =>
          '<p>' +
          esc(f.kind.replaceAll('-', ' ')) +
          ' · ' +
          esc(f.status) +
          '</p>',
      )
      .join('') +
    '<h3>What followed</h3>' +
    later
      .map(
        (child) =>
          '<p>' +
          esc(child.text) +
          ' ' +
          button(
            'Follow this consequence',
            'entry',
            'data-id="' + child.id + '" class="text-button"',
          ) +
          '</p>',
      )
      .join('')
  );
}
export function localDevelopmentView(g, id) {
  const s = g.settlements[id];
  if (!s) return '';
  return (
    '<section class="local-development"><h3>The place as it stands</h3><p>' +
    Math.round(s.population).toLocaleString() +
    ' residents · ' +
    (s.prosperity > 65
      ? 'prospering'
      : s.prosperity < 35
        ? 'struggling'
        : 'working toward stability') +
    '. Local infrastructure ' +
    Math.round(s.infrastructure) +
    '; food production ' +
    Math.round(s.foodProduction) +
    '.</p>' +
    s.problems.map((p) => '<p class="blocked">' + esc(p) + '</p>').join('') +
    '<h3>The people who live here</h3><p>' +
    esc(s.demographicStory || '') +
    '</p><p>' +
    Object.entries(s.demographics || {})
      .filter(([, n]) => n > 0)
      .map(
        ([race, n]) =>
          esc(race) + ' ' + Math.round((n / s.population) * 100) + '%',
      )
      .join(' · ') +
    '</p><h3>Institutions and promises</h3>' +
    s.institutions
      .map((id) => g.institutions.find((i) => i.id === id))
      .filter(Boolean)
      .map(
        (i) =>
          '<article class="institution-card"><h4>' +
          esc(i.name) +
          '</h4><p>' +
          esc(i.status) +
          ' · ' +
          coins(i.budget) +
          ' gold upkeep each season · condition ' +
          Math.round(i.condition) +
          '/100</p><p>' +
          i.students
            .map((id) => esc(personById(g, id)?.name || id))
            .join(', ') +
          '</p>' +
          button(
            'Review its funding',
            'decision',
            'data-type="institution" data-id="' + i.id + '"',
          ) +
          button(
            'Read its founding',
            'entry',
            'data-id="' + i.source + '" class="text-button"',
          ) +
          '</article>',
      )
      .join('') +
    '</section>'
  );
}

function chronicleMoment(e) {
  const motifs = {
    succession: ['♛', 'A new reign'],
    ascension: ['♛', 'A new reign'],
    'realm-growth': ['♜', 'A realm transformed'],
    'institution-growth': ['▥', 'A lasting work grows'],
    birth: ['❧', 'A new life'],
    death: ['✧', 'A life remembered'],
    education: ['▤', 'A life of learning'],
    institution: ['⌂', 'A lasting work'],
    commerce: ['⚖', 'The royal bargain'],
    'royal-milestone': ['✦', 'An ambition fulfilled'],
    promotion: ['♜', 'A realm transformed'],
  };
  const m = motifs[e.kind];
  return m
    ? '<aside class="chronicle-moment"><i aria-hidden="true">' +
        m[0] +
        '</i><small>' +
        m[1] +
        '</small></aside>'
    : '';
}
