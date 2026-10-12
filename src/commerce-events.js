import { createInstitution } from './settlements.js?v=0.5.1';
import { newPerson, practice } from './characters.js?v=0.5.1';
import { addPromise } from './promises.js?v=0.5.1';
import { bound } from './sim-core.js?v=0.5.1';
export function commerceProposals(g) {
  const rows = [];
  for (const v of g.ventures) {
    const p = g.people[v.actor];
    if (!p?.alive || p.id === g.ruler.id) continue;
    if (
      (v.status === 'failed' ||
        (v.status === 'operating' && v.condition < 45)) &&
      !v.concernHandled
    ) {
      const failed = v.status === 'failed';
      rows.push({
        template: 'commercial-concern',
        priority: 78,
        site: v.site,
        speaker: p,
        venture: v.id,
        origin: v.source,
        fingerprint: v.id + '-concern',
        title: failed
          ? 'The price of a lost bargain'
          : 'The undertaking beneath its promises',
        text: failed
          ? p.name +
            ' lays the damaged account of ' +
            v.name +
            ' before the throne. The return has already been settled; no ruling can turn the lost cargo into a second profit. Workers and the delegate now ask how the crown will share the cost.'
          : p.name +
            ' brings news that ' +
            v.name +
            ' is losing its ability to serve the original bargain. Its condition has deteriorated, and local households fear that the crown will collect dues while leaving them the burden.',
        options: [
          {
            id: 'support',
            label: failed
              ? 'Help the people who bore the loss'
              : 'Repair the undertaking and protect its purpose',
            note: '10 gold supports actual personal recovery or working condition. The original financial result stays in the record.',
            cost: 10,
            effects: {},
          },
          {
            id: 'account',
            label: 'Hear the accounts and revise the work',
            note: '4 gold improves the delegate’s investigation and gives the community a clearer account of what happened.',
            cost: 4,
            effects: { justice: 2 },
          },
          {
            id: 'close',
            label: failed
              ? 'Accept the loss without a further grant'
              : 'Pause the undertaking rather than neglect it',
            note: 'No new expense. Unfinished hopes remain, while a paused operation stops drawing upkeep.',
            cost: 0,
            effects: {},
          },
        ],
      });
    }
    if (
      v.status === 'operating' &&
      v.founder !== g.ruler.id &&
      v.receipts >= 8 &&
      !g.memorableEvents['legacy-' + v.id]
    )
      rows.push({
        template: 'commercial-legacy',
        priority: 42,
        site: v.site,
        speaker: p,
        venture: v.id,
        origin: v.source,
        fingerprint: v.id + '-legacy',
        title: 'The old seal in a new hand',
        text:
          p.name +
          ' brings the original charter of ' +
          v.name +
          ', bearing ' +
          g.people[v.founder].name +
          '’s seal. The undertaking has survived its founder. The households remember what it made possible, but ask what the new reign intends to leave them.',
        options: [
          {
            id: 'apprentice',
            label: 'Give a new pupil a place in its future',
            note: '14 gold establishes a real local apprenticeship with upkeep and a named student. The founding bargain becomes an opportunity for another generation.',
            cost: 14,
            effects: { learning: 2 },
          },
          {
            id: 'memorial',
            label: 'Preserve the charter and honor its workers',
            note: '6 gold supports the current delegate’s actual personal resources and reputation. The old founder’s work remains publicly remembered.',
            cost: 6,
            effects: { legitimacy: 2 },
          },
          {
            id: 'quiet',
            label: 'Let the work carry its own memory',
            note: 'No royal expenditure or new institution. The undertaking continues under its existing terms.',
            cost: 0,
            effects: {},
          },
        ],
      });
  }
  const milestone = g.ambitions.find(
    (a) => a.status === 'fulfilled' && !g.memorableEvents[a.id],
  );
  if (milestone && g.turn - milestone.ended >= 2) {
    const p = g.court.find((p) => p.alive && p.status === 'serving');
    if (p)
      rows.push({
        template: 'royal-legacy',
        priority: 30,
        site: 'capital',
        speaker: p,
        ambition: milestone.id,
        origin: milestone.result,
        fingerprint: milestone.id,
        title: 'What the hearths will remember',
        text:
          p.name +
          ' returns from the villages with accounts of the ambition ' +
          g.people[milestone.person].name +
          ' fulfilled. Their praise carries a question: should this achievement become a privilege of the court, a public commemoration, or a quieter example for those who follow?',
        options: [
          {
            id: 'public',
            label: 'Celebrate the people who made it possible',
            note: '8 gold supports the celebration and deepens public belonging.',
            cost: 8,
            effects: { happiness: 3, justice: 1 },
          },
          {
            id: 'court',
            label: 'Recognize the work within the court',
            note: '4 gold rewards the delegate’s reputation and the court’s sense of purpose.',
            cost: 4,
            effects: {},
          },
          {
            id: 'quiet',
            label: 'Ask that the work speak through its effects',
            note: 'No new expenditure. Its record and achievements remain.',
            cost: 0,
            effects: {},
          },
        ],
      });
  }
  return rows;
}
export function resolveCommerceEvent(g, e, choice) {
  const p = g.people[e.speaker],
    v = g.ventures.find((v) => v.id === e.venture);
  if (e.template === 'commercial-concern') {
    v.concernHandled = true;
    const cost = choice === 'support' ? 10 : choice === 'account' ? 4 : 0;
    v.invested += cost;
    v.profit -= cost;
    if (choice === 'support') {
      if (v.status === 'failed') {
        p.wealth += 10;
        p.trust = bound(p.trust + 4);
      } else v.condition = bound(v.condition + 25);
    }
    if (choice === 'account') {
      practice(g, p, 'investigation', 1);
      p.reputation = bound(p.reputation + 3);
    }
    if (choice === 'close' && v.status !== 'failed') v.status = 'paused';
  }
  if (e.template === 'commercial-legacy') {
    g.memorableEvents['legacy-' + v.id] = true;
    if (choice === 'apprentice') {
      const pupil = newPerson(g, {
        race: g.world.predominantRace,
        age: 16,
        role: 'Student',
        site: v.site,
      });
      pupil.skills.scholarship = 18;
      const school = createInstitution(
        g,
        'apprenticeship',
        v.site,
        e.decisionOrigin,
        {
          name: g.settlements[v.site].name + ' Charter Apprenticeship',
          budget: 2,
          staff: [p.id],
          students: [pupil.id],
          quality: 65,
        },
      );
      pupil.education = {
        institution: school.id,
        seasons: 0,
        status: 'studying',
      };
      addPromise(g, {
        kind: 'education',
        title: 'Prepare ' + pupil.name + ' for skilled work',
        source: e.decisionOrigin,
        due: g.turn + 8,
        person: pupil.id,
        site: v.site,
        total: 8,
      });
    }
    if (choice === 'memorial') {
      p.wealth += 6;
      p.reputation = bound(p.reputation + 4);
    }
  }
  if (e.template === 'royal-legacy') {
    g.memorableEvents[e.ambition] = true;
    if (choice === 'court') {
      p.reputation = bound(p.reputation + 4);
      p.morale = bound(p.morale + 4);
    }
  }
}
