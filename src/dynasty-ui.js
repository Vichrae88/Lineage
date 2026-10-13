import { escapeText as esc } from './reports-ui.js?v=0.5.5';
import { claimStrength } from './dynasty.js?v=0.5.5';
export function familyTreeView(g, focus = g.ruler.id) {
  const p = g.people[focus] || g.ruler;
  const card = (id, label) => {
    const q = g.people[id];
    return q
      ? '<button class="tree-person ' +
          (q.alive ? '' : 'remembered') +
          '" data-action="person" data-id="' +
          q.id +
          '"><small>' +
          esc(label) +
          '</small><strong>' +
          esc(q.name) +
          '</strong><span>' +
          esc(q.race) +
          (q.species ? ' · ' + esc(q.species) : '') +
          ' · ' +
          (q.alive ? 'age ' + q.age : 'remembered') +
          '</span></button>'
      : '';
  };
  const row = (ids, label) =>
    '<div class="tree-row">' +
    ids.map((id) => card(id, label)).join('') +
    '</div>';
  return (
    '<section class="family-tree section-inset" aria-label="Family tree"><span class="eyebrow">THE FAMILY REGISTER</span><h3>Lives joined across generations</h3><p>Select any name to read their life and trace their own branch. Remembered relatives keep their place in the tree.</p>' +
    row(p.parentIds, 'Parent') +
    (p.parentIds.length
      ? ''
      : '<p class="quiet">Earlier ancestry is unrecorded in this chronicle.</p>') +
    '<div class="tree-row tree-focus">' +
    card(p.id, p.id === g.ruler.id ? 'The reigning ruler' : 'This branch') +
    (p.spouseId ? card(p.spouseId, 'Partner') : '') +
    p.formerSpouseIds.map((id) => card(id, 'Earlier partner')).join('') +
    '</div>' +
    row(p.childIds, 'Child') +
    row(p.siblingIds, 'Sibling') +
    '</section>'
  );
}
export function reignsView(g) {
  return (
    '<section class="section-inset"><h3>The crown’s successive lives</h3><div class="reign-register">' +
    g.reigns
      .map((r) => {
        const p = g.people[r.person];
        return (
          '<article><button data-action="person" data-id="' +
          p.id +
          '"><strong>' +
          esc(p.name) +
          '</strong></button><p>Reign ' +
          r.number +
          ' · Year ' +
          (Math.floor(r.start / 4) + 1) +
          ' to ' +
          (r.end === null ? 'the present' : Math.floor(r.end / 4) + 1) +
          '</p><p>' +
          esc(p.values) +
          ' · ' +
          esc(p.profession) +
          ' · ' +
          (p.alive ? 'Living' : 'Remembered') +
          '</p></article>'
        );
      })
      .join('') +
    '</div></section>'
  );
}
export function claimView(g, p) {
  const c = claimStrength(g, p, g.heir === p.id);
  return (
    '<details><summary>The grounds of their claim</summary><p>' +
    (c.named
      ? 'The sealed testament names them. '
      : 'The testament has not named them. ') +
    (c.blood
      ? 'A documented royal bloodline supports their claim. '
      : 'Their claim depends on recognition and service. ') +
    'Personal reputation, leadership and connections shape the support they can gather.</p><p class="quiet">Clerk’s assessment: ' +
    c.score +
    ' · testament ' +
    (c.named ? 35 : 0) +
    ' · ancestry ' +
    c.blood +
    ' · personal standing ' +
    c.standing +
    '.</p></details>'
  );
}
