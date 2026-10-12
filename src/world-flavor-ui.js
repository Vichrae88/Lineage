import { gold as coins } from './format.js?v=0.5.3';
import { royalAmbitions } from './ambitions.js?v=0.5.3';
import { escapeText as esc } from './reports-ui.js?v=0.5.3';
import { hash } from './sim-core.js?v=0.5.3';
const link = (g, id, label) =>
  g.archive.some((e) => e.id === id)
    ? '<button class="text-button" data-action="entry" data-id="' +
      esc(id) +
      '">' +
      esc(label) +
      '</button>'
    : esc(label);
export function achievementView(g, p) {
  const list = p.achievements.slice(-4);
  if (!list.length) return '';
  return (
    '<section class="achievement-panel"><span class="eyebrow">A LIFE OF ACCOMPLISHMENT</span>' +
    list
      .map(
        (a) =>
          '<p><span aria-hidden="true">✦</span> ' +
          link(
            g,
            a.source,
            a.kind === 'mastery'
              ? 'Recognized for mastery of ' + a.skill
              : a.kind === 'commercial steward'
                ? 'A trusted steward of a lasting undertaking'
                : a.kind === 'royal ambition'
                  ? 'An ambition fulfilled through real works and lives'
                  : a.kind === 'training'
                    ? 'Completed a course in ' + a.skill
                    : a.kind === 'graduation'
                      ? 'Completed a course of study'
                      : 'Recognized for ' + a.kind,
          ) +
          (a.turn !== undefined
            ? ' <small>in the ' +
              ['spring', 'summer', 'autumn', 'winter'][a.turn % 4] +
              ' of year ' +
              (Math.floor(a.turn / 4) + 1) +
              '</small>'
            : '') +
          '</p>',
      )
      .join('') +
    '</section>'
  );
}
export function ambitionView(g) {
  const a = g.ambitions.find((a) => a.person === g.ruler.id),
    old = g.ambitions.filter((a) => a.person !== g.ruler.id);
  const targets = { builder: 3, scholar: 3, prosperous: 60, peacemaker: 2 };
  return (
    '<section class="section-inset ambition-panel"><span class="eyebrow">WHAT YOU HOPE TO LEAVE BEHIND</span><h3>A personal ambition</h3>' +
    (!a
      ? '<p>The realm has no prescribed victory. If you wish, give this reign a personal purpose. Your heir will be free to choose their own.</p><div class="ambition-options">' +
        Object.entries(royalAmbitions)
          .map(
            ([k, v]) =>
              '<button data-action="decision" data-type="ambition" data-id="' +
              k +
              '"><strong>' +
              esc(v.name) +
              '</strong><span>' +
              esc(v.description) +
              '</span></button>',
          )
          .join('') +
        '</div>'
      : '<h4>' +
        esc(royalAmbitions[a.kind].name) +
        '</h4><p>' +
        esc(royalAmbitions[a.kind].description) +
        '</p><p>' +
        {
          active: 'This remains a purpose of your reign.',
          fulfilled:
            'Your court recognizes that this purpose has been fulfilled.',
          unfinished: 'This purpose remained unfinished when the reign ended.',
        }[a.status] +
        '</p><progress aria-label="Progress toward this ambition" value="' +
        Math.min(a.progress, targets[a.kind]) +
        '" max="' +
        targets[a.kind] +
        '"></progress><details class="ledger"><summary>Read the evidence of progress</summary><p>' +
        (a.kind === 'prosperous'
          ? coins(a.progress)
          : Math.round(a.progress * 100) / 100) +
        ' of ' +
        targets[a.kind] +
        (a.kind === 'builder' ? '; infrastructure must also reach 65.' : '') +
        '</p></details>' +
        link(
          g,
          a.result || a.source,
          a.result
            ? 'Read the achievement in the Chronicle'
            : 'Read the original commitment',
        )) +
    (old.length
      ? '<details><summary>Purposes remembered from earlier reigns</summary>' +
        old
          .map(
            (a) =>
              '<p>' +
              esc(g.people[a.person].name) +
              ': ' +
              esc(royalAmbitions[a.kind].name) +
              ' — ' +
              esc(a.status) +
              '. ' +
              link(g, a.result || a.source, 'Read their record') +
              '</p>',
          )
          .join('') +
        '</details>'
      : '') +
    '</section>'
  );
}
const sites = {
  capital: 0,
  fields: 1,
  forest: 2,
  border: 3,
  mountains: 4,
  ruins: 5,
};
export function placePainting(g, s, cls = '') {
  const n = sites[s.id] ?? 0;
  return (
    '<div class="place-painting ' +
    cls +
    '" role="img" aria-label="' +
    esc(s.name) +
    ': ' +
    [
      'a citadel above a river town',
      'farmland and a working watermill',
      'an ancient forest and woodland bridge',
      'a frontier market and palisade',
      'mountain halls and mines',
      'a ruined temple beside dark water',
    ][n] +
    '" style="background-position:' +
    (n % 2) * 100 +
    '% ' +
    Math.floor(n / 2) * 50 +
    '%"><span>' +
    esc(s.name) +
    '</span></div>'
  );
}
export function developmentScene(g, id) {
  const s = g.settlements[id];
  if (!s) return '';
  const works = g.institutions.filter(
      (i) => i.site === id && i.status === 'active',
    ),
    businesses = g.ventures.filter(
      (v) => v.site === id && v.status === 'operating',
    );
  const buildings = [
    ...works.map((i) => ({
      name: i.name,
      kind: i.kind,
      condition: i.condition,
    })),
    ...businesses.map((v) => ({
      name: v.name,
      kind: v.kind,
      condition: v.condition,
    })),
  ];
  const symbols = {
    mill: '⚙',
    bridge: '⌒',
    school: '▤',
    academy: '▥',
    apprenticeship: '⚒',
    granary: '♧',
    watch: '♜',
    estate: '♧',
    market: '⚖',
    charter: '⚑',
    agreement: '⚓',
  };
  return (
    '<section class="development-scene"><h3>The place as it is becoming</h3><p>' +
    esc(s.name) +
    (s.infrastructure >= 70
      ? ' is visibly changing: reliable paths connect its working households.'
      : s.infrastructure >= 40
        ? ' has begun to gather around its paths, workshops and hearths.'
        : ' still bears the marks of difficult roads and scattered households.') +
    (s.prosperity < 30
      ? ' Many doors are quiet, and families have little to spare.'
      : s.prosperity >= 65
        ? ' Busy doorways and full stalls speak of steadier livelihoods.'
        : ' Its households are finding their way between opportunity and uncertainty.') +
    '</p><div class="settlement-silhouette" aria-label="Recorded development in ' +
    esc(s.name) +
    '"><span class="hearth-cluster" aria-hidden="true">⌂ ⌂ ⌂</span>' +
    buildings
      .map(
        (b) =>
          '<span class="built-landmark ' +
          (b.condition < 35 ? 'worn' : '') +
          '" title="' +
          esc(b.name) +
          (b.condition < 35 ? ' — in need of care' : '') +
          '"><i aria-hidden="true">' +
          (symbols[b.kind] || '⌂') +
          '</i><small>' +
          esc(b.kind) +
          '</small></span>',
      )
      .join('') +
    '</div>' +
    (!buildings.length
      ? '<p class="quiet">No royal institution or commercial holding has yet become a lasting landmark here.</p>'
      : '<p class="quiet">Each landmark represents a recorded institution or operating investment. Worn landmarks need care.</p>') +
    '</section>'
  );
}
const emblems = {
  guard: '<path d="M23 27h34v20q-4 13-17 19-13-6-17-19zM40 33v24M31 42h18"/>',
  commons: '<path d="M26 43q14-25 28 0v17H26zM34 43v-9h12v9M36 52h8v8"/>',
  guild:
    '<circle cx="40" cy="45" r="17"/><path d="M40 32v26M45 35h-9v9h8v9h-9"/>',
  nobles: '<path d="M21 33l8 7 11-14 11 14 8-7-5 24H26zM27 61h26"/>',
  faith:
    '<path d="M32 37h16v23H32zM40 25v11M23 44l-7-3M57 44l7-3M24 26l-5-5M56 26l5-5"/><path d="M40 43q-6 8 0 12q6-4 0-12z"/>',
  elves:
    '<path d="M40 61V24q-22 8-15 24q6 8 15-8q9 16 15 8q7-16-15-24M40 40L29 31M40 45l12-9"/>',
  goblins: '<path d="M22 53l18-30 18 30zM29 58h22M40 37v16"/>',
  gnolls:
    '<path d="M23 30l8 4 9-7 9 7 8-4-3 21-14 13-14-13zM30 45h6M44 45h6M37 54h6"/>',
  bugbears:
    '<path d="M23 30l10 5h14l10-5-3 21-14 11-14-11zM29 43h7M44 43h7M36 53h8"/>',
  beastfolk:
    '<circle cx="40" cy="50" r="12"/><ellipse cx="24" cy="37" rx="5" ry="8"/><ellipse cx="36" cy="29" rx="5" ry="8"/><ellipse cx="49" cy="30" rx="5" ry="8"/><ellipse cx="58" cy="41" rx="5" ry="8"/>',
};
export function factionCrest(g, f) {
  const shades = ['#374c43', '#63443b', '#344650', '#5b4738', '#494051'],
    color = shades[hash(g.seed + ':' + f.id) % shades.length];
  return (
    '<span class="faction-crest" role="img" aria-label="The banner of ' +
    esc(f.name) +
    '"><svg viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg"><path d="M10 8h60v42q-3 24-30 36Q13 74 10 50z" fill="' +
    color +
    '" stroke="#ad8b4d" stroke-width="3"/><g fill="none" stroke="#e7d4a5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
    (emblems[f.id] || emblems.commons) +
    '</g></svg></span>'
  );
}
export function historicLandmarks(g, id) {
  const events = g.archive.filter(
    (e) =>
      e.site === id &&
      [
        'institution',
        'development',
        'commercial-milestone',
        'birth',
        'battle',
        'settlement',
        'commerce',
      ].includes(e.kind),
  );
  return events.length
    ? '<details class="place-history"><summary>Changes remembered in this place</summary>' +
        events
          .slice(-5)
          .map((e) => '<p>' + link(g, e.id, e.text) + '</p>')
          .join('') +
        '</details>'
    : '';
}

export function mapWorks(g, id, x, y) {
  const works = g.institutions.filter(
      (i) => i.site === id && i.status === 'active',
    ),
    traders = g.ventures.filter(
      (v) => v.site === id && v.status === 'operating',
    );
  if (!works.length && !traders.length) return '';
  const label = [
    ...works.map((i) => i.name),
    ...traders.map((v) => v.name),
  ].join('; ');
  return (
    '<g class="map-works"><title>' +
    esc(label) +
    '</title><rect x="' +
    (x + 7) +
    '" y="' +
    (y - 14) +
    '" width="26" height="13" rx="3" fill="#ded0a1" stroke="#a58b51"/><text x="' +
    (x + 20) +
    '" y="' +
    (y - 4) +
    '" text-anchor="middle" fill="#304b3b">' +
    (works.length ? '▤' : '⚖') +
    ' ' +
    (works.length + traders.length) +
    '</text></g>'
  );
}
