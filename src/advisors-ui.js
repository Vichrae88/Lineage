import { decisionAdvice } from './advisors.js?v=0.5.4';
import { portraitMarkup } from './portraits.js?v=0.5.4';
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
export function advisorView(
  g,
  decision,
  options = decision.options,
  agent = null,
) {
  const voices = decisionAdvice(g, decision, options, agent);
  if (!voices.length)
    return decision.blocked
      ? ''
      : '<p class="counsel-note">No serving advisor can offer a funded recommendation on this matter. Your ruling remains your own.</p>';
  return (
    '<section class="advisor-council" aria-label="Advisor commentary and recommendations"><span class="eyebrow">VOICES AT YOUR TABLE</span><h3>The council’s advice</h3><p>Different offices and allegiances can lead to different answers. Their counsel uses the current state of your realm.</p>' +
    voices
      .map(
        (v) =>
          '<article class="advisor-voice">' +
          portraitMarkup(
            g.people[v.person] || g.court.find((p) => p.id === v.person),
          ) +
          '<div><button class="text-button" data-action="person" data-id="' +
          esc(v.person) +
          '">' +
          esc(v.name) +
          '</button> <small>· ' +
          esc(v.role) +
          '</small><blockquote>“' +
          esc(v.commentary) +
          '”</blockquote><p class="advisor-recommends"><strong>Recommends: ' +
          esc(v.label) +
          '.</strong> ' +
          esc(v.tradeoff) +
          '</p><p class="quiet">' +
          esc(v.bias) +
          ' ' +
          esc(v.expertise) +
          '</p></div></article>',
      )
      .join('') +
    '</section>'
  );
}
