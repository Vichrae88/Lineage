import { gold as coins } from './format.js?v=0.5.5';
import {
  attributes,
  skills,
  traitRules,
  professionalForecast,
} from './characters.js?v=0.5.5';
import { personById } from './sim-core.js?v=0.5.5';
import { escapeText as esc } from './reports-ui.js?v=0.5.5';
const action = (label, type, id) =>
  '<button type="button" data-action="decision" data-type="' +
  type +
  '" data-id="' +
  id +
  '">' +
  label +
  '</button>';
export function characterDevelopmentView(g, p) {
  const jobs = g.trainingJobs.filter(
    (j) => j.status === 'active' && (j.student === p.id || j.mentor === p.id),
  );
  return (
    '<section class="character-development"><details open><summary>Capabilities & professional character</summary><div class="attribute-grid">' +
    attributes
      .map(
        (k) =>
          '<div><small>' +
          k +
          '</small><strong>' +
          p.attributes[k] +
          ' / 20</strong><meter aria-label="' +
          k +
          '" min="1" max="20" value="' +
          p.attributes[k] +
          '"></meter></div>',
      )
      .join('') +
    '</div><h4>How their traits matter</h4>' +
    p.traits
      .map(
        (t) =>
          '<p><strong>' +
          esc(t) +
          '.</strong> ' +
          Object.entries(traitRules[t] || {})
            .map(
              ([skill, n]) =>
                esc(skill) +
                (n > 0
                  ? ' benefits from this disposition'
                  : ' is made more difficult by it'),
            )
            .join('; ') +
          '.</p>',
      )
      .join('') +
    '<h4>Professional development</h4><p>' +
    esc(p.profession) +
    ' · ' +
    p.experience +
    ' assignment experience.</p>' +
    jobs
      .map(
        (j) =>
          '<p class="training-status">' +
          (j.student === p.id
            ? 'Studying ' + esc(j.skill)
            : 'Mentoring ' + esc(personById(g, j.student).name)) +
          ' · ' +
          j.remaining +
          ' more seasons.</p>',
      )
      .join('') +
    '</details><details><summary>Personal life & resources</summary><div class="personal-ledger"><p>Personal wealth: ' +
    coins(p.wealth) +
    ' gold. Usual income: ' +
    coins(p.income) +
    ' per working season.</p><p>Morale: ' +
    Math.round(p.morale) +
    '/100 · Reputation: ' +
    Math.round(p.reputation) +
    '/100 · Connections: ' +
    Math.round(p.connections) +
    '/100.</p><p>Property: ' +
    (p.property
      .map((x) => esc(typeof x === 'string' ? x : x.kind))
      .join(', ') || 'No recorded holding') +
    '.</p><p>Equipment: ' +
    (p.equipment
      .map((x) => esc(typeof x === 'string' ? x : x.kind))
      .join(', ') || 'Ordinary working possessions') +
    '.</p></div><h4>Goals of their own</h4>' +
    p.goals
      .map(
        (goal) =>
          '<p>Working toward ' +
          esc(goal.kind) +
          ' · ' +
          Math.round(goal.progress) +
          ' progress.</p>',
      )
      .join('') +
    '</details><details><summary>Past service & achievements</summary>' +
    p.performance
      .slice(0, 8)
      .map(
        (row) =>
          '<p>' +
          esc(row.project) +
          ' · ' +
          (row.success ? 'completed' : 'partial result') +
          ' · ' +
          esc(row.skill) +
          ' improved ' +
          row.gain.toFixed(1) +
          '.</p>',
      )
      .join('') +
    p.achievements
      .slice(-8)
      .map(
        (a) =>
          '<p>' +
          esc(a.kind) +
          ' in ' +
          esc(a.skill || 'public service') +
          ' · Year ' +
          (Math.floor(a.turn / 4) + 1) +
          '.</p>',
      )
      .join('') +
    '</details>' +
    (p.alive && p.tier !== 'reserve'
      ? '<div class="profile-actions">' +
        action('Fund professional study', 'training', p.id) +
        action('Arrange a mentor', 'mentorship', p.id) +
        action('Reward their service', 'reward', p.id) +
        '</div>'
      : '') +
    '</section>'
  );
}
export function forecastView(g, p, projectId) {
  const project = g.world.projects.find((j) => j.id === projectId);
  if (!p || !project) return '';
  const f = professionalForecast(g, p, project);
  return (
    '<details class="assignment-forecast"><summary>' +
    esc(f.description) +
    '</summary><p>The relevant craft is ' +
    esc(f.skill) +
    '. The estimate weighs capabilities, personality and the actual state of the realm.</p><ul>' +
    f.contributions
      .map(
        (c) =>
          '<li><strong>' +
          esc(c.label) +
          '</strong><span>' +
          (c.value === null
            ? c.modifier > 0
              ? 'An advantage'
              : 'A difficulty'
            : c.value !== undefined
              ? c.value + (c.label === f.attribute ? ' / 20' : ' / 100')
              : c.modifier > 1
                ? 'Supports the effort'
                : c.modifier < -1
                  ? 'Makes the task harder'
                  : 'Little additional effect') +
          '</span></li>',
      )
      .join('') +
    '</ul><p>Estimated chance of a full result: ' +
    Math.round(f.chance * 100) +
    '%. Even incomplete work develops their craft.</p></details>'
  );
}
