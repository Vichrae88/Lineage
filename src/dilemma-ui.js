import { riskForecast } from './dilemmas.js?v=0.5.4';
import { hazardKinds } from './dilemma-catalog.js?v=0.5.4';
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
export const principleNames = {
  mercy: 'Mercy',
  truth: 'Truth',
  duty: 'Sworn duty',
  order: 'Public order',
  autonomy: 'Free consent',
  reciprocity: 'A shared burden',
  tradition: 'Inherited promises',
  provision: 'Livelihoods',
  restraint: 'Restraint',
  solidarity: 'Solidarity',
  expedience: 'Urgency',
};
export function dilemmaContext(g, e) {
  if (!e.dilemma) return '';
  const a = e.dilemma.actors;
  const people = [
    ['affected', 'Their household is affected'],
    ['sponsor', 'Their authority or claim is affected'],
    ['subject', 'Their life and service are at stake'],
  ].filter(([role]) => a[role] && g.people[a[role]]);
  return (
    '<section class="dilemma-context"><span class="eyebrow">THE PRICE BEYOND COIN</span><p>' +
    esc(e.dilemma.question) +
    '</p><div class="dilemma-people">' +
    people
      .map(
        ([role, label]) =>
          '<span><button class="text-button" data-action="person" data-id="' +
          esc(a[role]) +
          '">' +
          esc(g.people[a[role]].name) +
          '</button><small>' +
          esc(label) +
          '</small></span>',
      )
      .join('') +
    '</div><p class="quiet">Protection, consent, duty and survival can pull in different directions. Money cannot guarantee any of them.</p></section>'
  );
}
export function stakesSummary(g, e, o) {
  const s = o.stakes;
  if (!s) return '';
  const actors = {
    ...e?.dilemma?.actors,
    ruler: g.ruler.id,
    ...(e?.agent ? { adviser: e.agent } : {}),
  };
  const costs = [];
  for (const [role, changes] of Object.entries(s.personal))
    for (const [field, n] of Object.entries(changes)) {
      const p = g.people[actors[role]];
      if (
        p?.alive &&
        n < 0 &&
        ['loyalty', 'reputation', 'trust'].includes(field) &&
        p[field] > 0
      )
        costs.push(
          (role === 'ruler'
            ? 'Your public reputation'
            : p.name + '’s ' + field) + ' is put under strain.',
        );
    }
  const r = riskForecast(g, e || {}, o);
  return (
    '<span class="choice-values">' +
    s.values
      .map((v) => '<span>' + esc(principleNames[v]) + '</span>')
      .join('') +
    '</span>' +
    (costs.length
      ? '<span class="choice-stake">' +
        esc(costs.slice(0, 2).join(' ')) +
        '</span>'
      : '') +
    (r
      ? '<span class="choice-risk">' +
        esc(r.level[0].toUpperCase() + r.level.slice(1)) +
        ': ' +
        (r.lives
          ? 'people may be injured or killed; '
          : 'the promise may fail; ') +
        esc(r.skill) +
        ' and current conditions matter.</span>'
      : '') +
    (s.pledge
      ? '<span class="choice-pledge">A recorded promise: ' +
        esc(s.pledge.title) +
        '.</span>'
      : '')
  );
}
export function dilemmaReport(g, e) {
  if (!e.riskAssessment && !e.humanCost) return '';
  const r = e.riskAssessment;
  return (
    '<details class="outcome-ledger"><summary>Read the risk and human cost</summary>' +
    (r
      ? '<p>The recorded chance of harm at the time of the undertaking was ' +
        Math.round(r.chanceOfHarm * 100) +
        '%. It reflected ' +
        esc(r.skill) +
        ' and the actual conditions, rather than the size of the payment.</p>'
      : '') +
    (e.humanCost
      ? '<p>' +
        e.humanCost.lost +
        ' recorded citizen deaths' +
        (e.humanCost.dead ? ' · ' + esc(e.humanCost.dead) + ' died' : '') +
        (e.humanCost.wounded
          ? ' · ' + esc(e.humanCost.wounded) + ' survived with injuries'
          : '') +
        '.</p>'
      : '') +
    '</details>'
  );
}
