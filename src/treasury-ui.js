import { gold as coins } from './format.js?v=0.5.4';
import {
  commercialKinds,
  commercialForecast,
  projectedCommerce,
} from './commerce.js?v=0.5.4';
import { seasonProjection } from './economy.js?v=0.5.4';
import { escapeText as esc } from './reports-ui.js?v=0.5.4';
const button = (text, kind, target) =>
  '<button data-action="decision" data-type="' +
  kind +
  '" data-id="' +
  target +
  '">' +
  text +
  '</button>';
export function treasuryView(g, modal = false) {
  const p = seasonProjection(g),
    business = projectedCommerce(g),
    last = g.commerce.receipts;
  return (
    '<div class="sheet-heading"><span class="eyebrow">THE MEANS TO KEEP A PROMISE</span><h2 ' +
    (modal ? 'id="dialog-title"' : '') +
    '>The royal Treasury</h2><p class="lead">A prosperous realm needs more than a levy. A caravan risks coin on the roads; a market needs its neighbors; an estate must repay the care it receives.</p></div><div class="treasury-summary"><article><small>Coin available</small><strong>' +
    coins(g.resources.gold) +
    ' gold</strong></article><article><small>Expected seasonal income</small><strong>' +
    coins(p.income) +
    ' gold</strong></article><article><small>Expected spending</small><strong>' +
    coins(p.spending) +
    ' gold</strong></article><article><small>Projected balance</small><strong>' +
    coins(p.balance, true) +
    ' gold</strong></article></div><p class="quiet">Commercial receipts are estimates with risk, not guaranteed returns. Journey capital is at risk until the cargo returns.</p><div class="projection-grid"><section><h3>Where the coin comes from</h3><p>Levy, customary dues and existing trade: ' +
    coins(p.taxIncome ?? p.income) +
    ' gold.</p>' +
    business
      .map(
        (b) =>
          '<p>' +
          esc(b.name) +
          ': about ' +
          coins(b.expected) +
          ' gold; upkeep ' +
          coins(b.upkeep) +
          '.</p>',
      )
      .join('') +
    '</section><section><h3>Promises already drawing on it</h3><p>Court wages: ' +
    coins(p.wages) +
    ' gold.</p><p>Institutions, watch, governors and commercial upkeep: ' +
    coins(p.upkeep) +
    ' gold.</p><p>Justice and relief administration: ' +
    coins(p.law) +
    ' gold.</p><button data-action="promises" class="text-button">Review promises and debts →</button></section></div><section class="section-inset"><h3>Undertakings of the crown</h3><div class="venture-grid">' +
    g.ventures
      .filter((v) => !['closed', 'completed', 'failed'].includes(v.status))
      .map(
        (v) =>
          '<article class="venture-card"><small>' +
          esc(v.kind) +
          ' · ' +
          esc(v.status) +
          '</small><h4>' +
          esc(v.name) +
          '</h4><p>Entrusted to <button data-action="person" data-id="' +
          v.actor +
          '" class="text-button">' +
          esc(g.people[v.actor]?.name) +
          '</button>.</p><p>' +
          (v.status === 'outbound' || v.status === 'forming'
            ? 'Expected in ' + Math.max(0, v.due - g.turn) + ' seasons.'
            : v.condition < 40
              ? 'Its condition is deteriorating; the promise needs attention.'
              : 'Its working condition remains serviceable.') +
          (v.expires
            ? ' The charter closes in ' +
              Math.max(0, v.expires - g.turn) +
              ' seasons.'
            : '') +
          '</p><details><summary>The investment ledger</summary><p>Original royal capital ' +
          coins(v.capital) +
          ' gold · net return after investment and upkeep ' +
          coins(v.profit) +
          ' gold so far · condition ' +
          Math.round(v.condition) +
          '/100 · scale ' +
          v.level +
          '/3.</p></details>' +
          button('Review the undertaking', 'venture', v.id) +
          button('Appoint its delegate', 'operator', v.id) +
          '</article>',
      )
      .join('') +
    '</div>' +
    (g.ventures.some(
      (v) => !['closed', 'completed', 'failed'].includes(v.status),
    )
      ? ''
      : '<p>No royal commercial undertaking is active yet.</p>') +
    '</section><section class="section-inset"><h3>Ways to build prosperity</h3><div class="venture-grid">' +
    Object.entries(commercialKinds)
      .map(
        ([kind, c]) =>
          '<article class="opportunity-card"><span class="venture-symbol" aria-hidden="true">' +
          {
            caravan: '♜',
            estate: '♧',
            market: '⚖',
            charter: '❧',
            agreement: '↔',
            expedition: '◇',
          }[kind] +
          '</span><h4>' +
          esc(c.name) +
          '</h4><p>' +
          esc(c.description) +
          '</p><p class="quiet">Plans begin at ' +
          coins(c.cost - 6) +
          ' gold, with ' +
          coins(c.upkeep) +
          ' gold of seasonal upkeep.</p>' +
          (kind === 'agreement'
            ? '<div class="trading-partners">' +
              g.factions
                .filter((f) =>
                  [
                    'goblins',
                    'gnolls',
                    'elves',
                    'bugbears',
                    'beastfolk',
                  ].includes(f.id),
                )
                .map((f) =>
                  button(
                    'Discuss terms with ' + esc(f.name),
                    'commercial',
                    kind + ':' + f.id,
                  ),
                )
                .join('') +
              '</div>'
            : kind === 'expedition'
              ? Object.entries(g.commerce.deposits)
                  .map(
                    ([site, n]) =>
                      '<p>' +
                      esc(g.settlements[site].name) +
                      ' · ' +
                      (n >= 24
                        ? 'rich prospects'
                        : n >= 8
                          ? 'limited prospects'
                          : 'surveyed resources exhausted') +
                      '</p>' +
                      button(
                        'Consider this expedition',
                        'commercial',
                        kind + ':' + site,
                      ),
                  )
                  .join('')
              : button('Consider the undertaking →', 'commercial', kind) +
                (kind === 'caravan'
                  ? '<details><summary>Consider a foreign route</summary>' +
                    g.factions
                      .filter((f) =>
                        [
                          'goblins',
                          'gnolls',
                          'elves',
                          'bugbears',
                          'beastfolk',
                        ].includes(f.id),
                      )
                      .map((f) =>
                        button(
                          'Carry cargo to ' + esc(f.name),
                          'commercial',
                          'caravan:' + f.id,
                        ),
                      )
                      .join('') +
                    '</details>'
                  : '')) +
          '</article>',
      )
      .join('') +
    '</div></section><section class="section-inset"><h3>Recent returns and setbacks</h3>' +
    last
      .slice(0, 6)
      .map(
        (r) =>
          '<p>' +
          esc(
            g.archive.find((e) => e.id === r.source)?.text ||
              'An earlier commercial return.',
          ) +
          ' <button data-action="entry" data-id="' +
          r.source +
          '" class="text-button">Read the report →</button></p>',
      )
      .join('') +
    '</section>'
  );
}
export function commercialAdvice(g, d, p) {
  if (!p || !d.commercialKind) return '';
  const f = commercialForecast(
    g,
    p,
    d.commercialKind,
    'prudent',
    d.site,
    d.faction,
  );
  return (
    '<details class="assignment-forecast"><summary>' +
    esc(f.description) +
    '</summary><p>' +
    esc(p.name) +
    ' brings ' +
    esc(f.skill) +
    ', commercial judgment and personal reputation to this undertaking. Local safety and the partner’s trust affect the bargain.</p><p>Careful plan: about ' +
    Math.round(f.chance * 100) +
    '% chance of a sound result. Competition reduces the available margin.</p></details>'
  );
}
