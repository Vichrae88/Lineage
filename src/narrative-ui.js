import { narrativeForRecord, recordTransitions } from './narrative.js?v=0.5.1';
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
export function narrativeView(g, e) {
  const lines = narrativeForRecord(g, e);
  if (!lines.length)
    return '<p class="narrative-outcome quiet">This ruling leaves the realm’s fortunes much as they were; its story and promises remain in the Chronicle.</p>';
  return (
    '<div class="narrative-outcome">' +
    lines
      .slice(0, 12)
      .map((l) => '<p>' + esc(l.text) + '</p>')
      .join('') +
    (lines.length > 12
      ? '<details><summary>Hear the other voices affected</summary>' +
        lines
          .slice(12)
          .map((l) => '<p>' + esc(l.text) + '</p>')
          .join('') +
        '</details>'
      : '') +
    '</div>'
  );
}
export function exactLedger(g, e) {
  const rows = recordTransitions(e),
    signed = (n) => (n > 0 ? '+' : '') + Math.round(n * 100) / 100;
  return (
    '<details class="outcome-ledger"><summary>Open the clerk’s exact ledger</summary><div class="change-grid">' +
    rows
      .map(
        (t) =>
          '<div><small>' +
          esc(
            t.name ||
              g.people[t.id]?.name ||
              g.factions.find((f) => f.id === t.id)?.name ||
              t.scope,
          ) +
          ' · ' +
          esc(t.field) +
          '</small><strong>' +
          (Number.isFinite(t.before)
            ? t.before + ' → ' + t.after + ' · '
            : '') +
          signed(t.change) +
          '</strong></div>',
      )
      .join('') +
    '</div></details>'
  );
}
export function promisesView(g) {
  const due = (n) =>
    ['Spring', 'Summer', 'Autumn', 'Winter'][((n % 4) + 4) % 4] +
    ', Year ' +
    (Math.floor(n / 4) + 1);
  const promises = g.promises.map((p) => ({
    title: p.title,
    status: p.status,
    progress: p.progress + '/' + p.total,
    due: p.due,
    person: p.person,
    source: p.source,
    text:
      p.kind === 'education'
        ? 'Progress follows actual funded classes, not the passing calendar.'
        : p.status === 'partial'
          ? 'The commission made partial progress; its original promise remains in the record.'
          : p.status === 'late'
            ? 'The deadline passed; the people waiting have lost some confidence.'
            : 'The undertaking and its result stay recorded across reigns.',
  }));
  const debts = g.obligations.map((o) => ({
    title: o.title || 'The guild’s grain advance',
    status:
      o.status === 'paid'
        ? 'completed'
        : o.due > o.originalDue
          ? 'late'
          : 'active',
    due: o.originalDue || o.due,
    progress: o.status === 'paid' ? 'Repaid' : o.amount + ' gold remains due',
    source: o.source,
    text:
      o.status === 'paid'
        ? 'The debt has been honored.'
        : 'Missed payments strain the lender’s relationship with the crown.',
  }));
  const arcs = g.consequences
    .filter((c) => ['scheduled', 'offered'].includes(c.status))
    .map((c) => ({
      title:
        {
          'mill-community': 'Hear the households after the mill settlement',
          'mill-legacy': 'Revisit the valley’s inherited settlement',
          'school-maturity': 'Give the graduate a voice in their future',
          'road-commerce': 'The crossing’s promised commerce',
        }[c.kind] || 'An earlier undertaking',
      status: c.status === 'offered' ? 'awaiting a ruling' : 'active',
      due: c.due,
      progress:
        c.status === 'offered'
          ? 'The petitioner is waiting'
          : 'Preparations are in motion',
      source: c.source,
      text: 'A consequence of an earlier ruling, rather than a new promise imposed without your consent.',
    }));
  const rows = [...promises, ...debts, ...arcs].sort((a, b) => a.due - b.due);
  return (
    '<span class="eyebrow">THE WORD OF THE CROWN</span><h2 id="dialog-title">Promises & obligations</h2><p class="lead">A new ruler inherits unfinished work as well as the throne. These records follow actual commissions, education, bargains and debts.</p>' +
    rows
      .map(
        (p) =>
          '<article class="promise-card ' +
          (p.status === 'late' ? 'overdue' : '') +
          '"><small>' +
          esc(p.status) +
          ' · ' +
          due(p.due) +
          '</small><h3>' +
          esc(p.title) +
          '</h3><p>' +
          esc(p.progress) +
          (p.person ? ' · ' + esc(g.people[p.person]?.name) : '') +
          '</p><p>' +
          esc(p.text) +
          '</p><button data-action="entry" data-id="' +
          p.source +
          '" class="text-button">Read the originating promise →</button></article>',
      )
      .join('') +
    (rows.length
      ? ''
      : '<p>The crown has no recorded outstanding undertaking. Your next commission or agreement can begin one.</p>')
  );
}
