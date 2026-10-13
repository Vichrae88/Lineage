import {
  personalTimeCapacity,
  personalTimeRemaining,
} from './court-initiatives.js?v=0.5.5';
import { boonForecast, seasonalForecast } from './seasonal.js?v=0.5.5';
import { portraitMarkup } from './portraits.js?v=0.5.5';
import { narrativeView } from './narrative-ui.js?v=0.5.5';
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
const button = (label, action, id, extra = '') =>
  '<button type="button" data-action="' +
  action +
  '" data-id="' +
  esc(id) +
  '" ' +
  extra +
  '>' +
  esc(label) +
  '</button>';
export function personalTimeView(g) {
  const remaining = personalTimeRemaining(g),
    total = personalTimeCapacity(g);
  return (
    '<aside class="personal-time"><span class="eyebrow">TIME FOR PEOPLE</span><p>' +
    remaining +
    ' of ' +
    total +
    ' personal audiences remain this season. Listening, sharing a difficult case and public recognition cost no gold. A person can receive this attention once each season.</p></aside>'
  );
}
export function courtWorkView(g, person = null) {
  const all = g.courtWork?.initiatives || [],
    items = all
      .filter((i) => !person || i.person === person)
      .sort(
        (a, b) =>
          (b.status === 'active') - (a.status === 'active') ||
          b.started - a.started,
      )
      .slice(0, person ? 5 : 6);
  return (
    '<section class="court-own-work section-inset"><span class="eyebrow">JUDGMENT BEYOND YOUR ORDERS</span><h3>' +
    (person ? 'Work begun in their own name' : 'The court’s own undertakings') +
    '</h3>' +
    (person
      ? ''
      : '<p>Courtiers can begin modest improvements from their own savings, office and craft. New starts leave a serving member free for royal commissions. Existing work continues when new initiatives are held.</p>' +
        button(
          g.courtWork?.mode === 'held'
            ? 'New initiatives are held · Review'
            : 'Modest initiatives are entrusted · Review',
          'decision',
          '',
          'data-type="court-autonomy" class="text-button"',
        )) +
    (items.length
      ? '<div class="initiative-list">' +
        items
          .map((i) => {
            const p = g.people[i.person],
              r = g.archive.find((r) => r.id === i.report),
              status =
                i.status === 'active'
                  ? i.stalls
                    ? 'Paused by personal hardship'
                    : i.progress < 1
                      ? 'Gathering people and resources'
                      : i.progress < 2
                        ? 'The first practical steps'
                        : 'The final work is being tested'
                  : i.status === 'completed'
                    ? 'An improvement completed'
                    : i.status === 'partial'
                      ? 'Useful work, with a partial result'
                      : 'An undertaking ended';
            return (
              '<article class="initiative-card">' +
              portraitMarkup(p) +
              '<div><h4>' +
              esc(i.name) +
              '</h4>' +
              button(p.name, 'person', p.id, 'class="text-button"') +
              '<p class="initiative-status">' +
              esc(status) +
              '</p>' +
              (r?.kind === 'decision'
                ? '<p class="quiet">Your response to their work</p><p>'
                : '<blockquote>') +
              esc(r?.text || 'The court waits for the next report.') +
              (r?.kind === 'decision' ? '</p>' : '</blockquote>') +
              '<div class="profile-actions">' +
              (i.status === 'active'
                ? button(
                    'Answer their report',
                    'decision',
                    i.id,
                    'data-type="initiative"',
                  )
                : '') +
              button(
                'Trace their work',
                'entry',
                i.source,
                'class="text-button"',
              ) +
              '</div></div></article>'
            );
          })
          .join('') +
        '</div>'
      : '<p class="quiet">No undertaking is recorded yet. Skills, loyalty, health, free time and personal resources determine who is ready to begin.</p>') +
    '</section>'
  );
}
export function boonsView(g) {
  const items = g.seasonal?.boons || [];
  if (!items.length) return '';
  const totals = boonForecast(g);
  return (
    '<section class="seasonal-boons"><h3>Gifts entrusted to the realm</h3><p>These magical objects provide lasting care through the seasons and remain with the realm across successions. Overlapping gifts have a shared limit; their benefits do not grow without bound.</p>' +
    items
      .map(
        (b) =>
          '<article class="relic"><span aria-hidden="true">✧</span><div><h4>' +
          esc(b.name) +
          '</h4><p>Its quiet enchantment sustains ' +
          esc(b.field) +
          ' each season.</p>' +
          button('Read its arrival', 'entry', b.source, 'class="text-button"') +
          '</div></article>',
      )
      .join('') +
    '<details class="outcome-ledger"><summary>The recurring gift ledger</summary>' +
    Object.entries(totals)
      .map(
        ([k, n]) =>
          '<p>' +
          esc(k) +
          ': ' +
          n +
          ' each season after overlapping gifts are limited.</p>',
      )
      .join('') +
    '</details></section>'
  );
}
export function seasonalContext(g, e) {
  if (!e.seasonal) return '';
  if (e.seasonal.category !== 'decision')
    return (
      '<section class="seasonal-note"><p>Word from this season. These consequences have already occurred; hearing the report adds no charge or reward.</p>' +
      narrativeView(
        g,
        g.archive.find((r) => r.id === e.origin),
      ) +
      '</section>'
    );
  return '<section class="seasonal-note"><span class="eyebrow">AN UNEXPECTED MATTER</span><p>The people involved await your judgment. Some approaches have uncertain results. Your courtier’s craft and loyalty can improve the chances, while difficult terms or dangerous work may still bring a setback.</p></section>';
}
export function seasonalRiskView(g, e, o) {
  if (e?.seasonal?.category !== 'decision') return '';
  const f = seasonalForecast(g, e, o);
  return f.chance === 1
    ? ''
    : '<span class="choice-risk">An uncertain undertaking: ' +
        esc(f.skill) +
        ' and the judgment of the chosen courtier affect its outcome.</span>';
}
export function seasonalAssessmentView(e) {
  const a = e.seasonalAssessment;
  if (!a) return '';
  return (
    '<details class="outcome-ledger"><summary>Read the undertaking’s risk</summary><p>The chance of the intended outcome was ' +
    Math.round(a.chance * 100) +
    '%, based on ' +
    esc(a.skill) +
    ' and the actual courtier’s skill and loyalty. ' +
    (a.success ? 'The intended outcome held.' : 'The setback occurred.') +
    '</p></details>'
  );
}

export function courtWorkBrief(g) {
  const work = (g.courtWork?.initiatives || [])
    .filter((i) => i.status === 'active' || i.finished === g.turn)
    .slice(-3);
  if (!work.length) return '';
  return (
    '<section class="section-inset court-work-brief"><span class="eyebrow">NEWS FROM YOUR COURT</span><h3>Work beyond your orders</h3>' +
    work
      .map(
        (i) =>
          '<p><strong>' +
          esc(g.people[i.person].name) +
          '</strong> · ' +
          esc(i.name) +
          '. ' +
          button(
            'Read their latest report',
            'entry',
            i.report,
            'class="text-button"',
          ) +
          '</p>',
      )
      .join('') +
    '</section>'
  );
}
