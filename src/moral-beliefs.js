const convictions = {
  Compassionate: { mercy: 4, solidarity: 2, restraint: 1, order: -1 },
  Merciful: { mercy: 4, restraint: 2, order: -1 },
  Gentle: { mercy: 3, restraint: 3 },
  Generous: { solidarity: 3, mercy: 2 },
  Principled: { truth: 4, duty: 2, expedience: -3 },
  Honest: { truth: 4, reciprocity: 2, expedience: -3 },
  Candid: { truth: 4, autonomy: 2, expedience: -2 },
  Loyal: { duty: 4, solidarity: 2, autonomy: -1 },
  Ruthless: { order: 4, expedience: 3, mercy: -2, restraint: -1 },
  Ambitious: { order: 2, provision: 2 },
  Greedy: { provision: 3, reciprocity: 2, truth: -1 },
  Cautious: { restraint: 4, duty: 1 },
  Patient: { restraint: 3, reciprocity: 2 },
  Meticulous: { order: 2, truth: 2 },
  Courageous: { duty: 3, solidarity: 3, restraint: -1 },
  Fearless: { duty: 2, solidarity: 2, restraint: -1 },
  Scholarly: { truth: 3, autonomy: 2 },
  Curious: { truth: 2, autonomy: 2 },
  Inventive: { autonomy: 3, provision: 1 },
  Protective: { duty: 2, mercy: 2 },
  Diplomatic: { reciprocity: 4, restraint: 2 },
  Secretive: { expedience: 3, restraint: 1, truth: -2 },
};
const offices = {
  Steward: { provision: 2, reciprocity: 1, duty: 1 },
  Marshal: { order: 2, duty: 2, solidarity: 1 },
  Ambassador: { reciprocity: 2, autonomy: 1, restraint: 1 },
  Spymaster: { expedience: 2, order: 1 },
  Councillor: { autonomy: 1, truth: 1, mercy: 1 },
};
export function ethicalWeights(p) {
  const result = { ...(offices[p.role] || offices.Councillor) };
  for (const trait of p.traits || [])
    for (const [key, n] of Object.entries(convictions[trait] || {}))
      result[key] = (result[key] || 0) + n;
  return result;
}
