import { riskForecast } from './dilemmas.js?v=0.5.5';
import { hazardKinds } from './dilemma-catalog.js?v=0.5.5';
import { ethicalWeights } from './moral-beliefs.js?v=0.5.5';
export { ethicalWeights };
const actual = (p, k, n) =>
  Math.max(0, Math.min(k === 'wealth' ? Infinity : 100, p[k] + n)) - p[k];
export function moralAssessment(g, d, p, o) {
  if (!o.stakes) return { score: 0, argument: '' };
  const values = ethicalWeights(p),
    actors = {
      ...(d.dilemma?.actors || d.seasonal?.actors),
      ruler: g.ruler.id,
      ...(d.agent ? { adviser: d.agent } : {}),
    };
  let score = o.stakes.values.reduce((n, v) => n + (values[v] || 0) * 4, 0);
  for (const [role, changes] of Object.entries(o.stakes.personal)) {
    const target = g.people[actors[role]];
    if (!target?.alive) continue;
    for (const [k, n] of Object.entries(changes)) {
      const signed = k === 'grievance' ? -1 : 1;
      const interest =
        target.id === p.id ? 1.1 : target.faction === p.faction ? 0.7 : 0.3;
      score +=
        actual(target, k, n) *
        signed *
        (k === 'reputation' || k === 'loyalty' ? 0.7 : 0.4) *
        interest;
    }
  }
  const r = riskForecast(g, d, o);
  if (r) {
    const hazard = hazardKinds[o.stakes.risk.kind],
      victim = g.people[actors[o.stakes.risk.actor]];
    const lifeWeight = (p.traits || []).some((t) =>
      ['Compassionate', 'Merciful', 'Gentle', 'Protective'].includes(t),
    )
      ? 7
      : (p.traits || []).includes('Ruthless')
        ? 1
        : 3;
    score -= r.chance * (hazard.loss[1] + hazard.lethal * 8) * lifeWeight;
    if (victim?.id === p.id)
      score -=
        r.chance *
        hazard.injury *
        ((p.traits || []).some((t) => ['Courageous', 'Fearless'].includes(t))
          ? 0.1
          : 0.4);
  }
  const favored = [...o.stakes.values].sort(
    (a, b) => (values[b] || 0) - (values[a] || 0),
  )[0];
  const argumentsFor = {
    mercy:
      'I favor protection for people who have little power to protect themselves.',
    truth:
      'I favor an account that witnesses can question, even when it embarrasses the crown.',
    duty: 'I give weight to the promises and service already sworn, even when keeping them hurts.',
    order:
      'I favor an enforceable answer; I accept that authority takes freedom from someone.',
    autonomy:
      'Consent matters here. A person should not become the price of another person’s protection.',
    reciprocity:
      'I favor sharing responsibility, though a bargain can bind the weaker party more tightly.',
    tradition:
      'An inherited promise is still a claim on us, but the living will pay to keep it.',
    provision:
      'Livelihoods and future care matter, even when preserving them compromises another right.',
    restraint:
      'I favor avoiding an irreversible loss, accepting the danger left unresolved.',
    solidarity:
      'Those who carried the burden should not be abandoned when they ask us to share it.',
    expedience:
      'Time can be a moral cost too; delay may harm people while we preserve a cleaner conscience.',
  };
  return {
    score,
    argument: argumentsFor[favored],
    risk: r,
    personalRisk: actors[o.stakes.risk?.actor] === p.id,
  };
}
