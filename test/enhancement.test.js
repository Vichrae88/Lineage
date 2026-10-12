import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  enact,
  resolveEvent,
  eventOptions,
  advance,
  parseSave,
  succession,
  prepareAudience,
} from '../src/game.js';
import { serializeGame } from '../src/persistence.js';
import { newPerson } from '../src/characters.js';
import {
  makePortraitRecipe,
  initializePortraits,
  portraitMarkup,
} from '../src/portraits.js';
import { portraitCatalog, paintedFace } from '../src/portrait-catalog.js';
import { tickAmbitions } from '../src/ambitions.js';
import { createInstitution } from '../src/settlements.js';
import {
  commerceProposals,
  resolveCommerceEvent,
} from '../src/commerce-events.js';
import { addPromise, tickPromises } from '../src/promises.js';
import { recordDeath } from '../src/living.js';
import { describeChange } from '../src/narrative.js';
const make = (seed = 562, scale = 'town') => {
  const g = createGame({
    seed,
    scale,
    race: 'Beastfolk',
    species: 'Fox',
    history: 'Inherited',
  });
  resolveEvent(g, 'decline');
  g.storyCursor = g.storyDeck.length;
  g.resources.gold = 1000;
  g.resources.food = 1000;
  return g;
};
const turn = (g) => {
  let n = 0;
  while (g.event) {
    assert.ok(++n < 30);
    assert.ok(
      resolveEvent(
        g,
        eventOptions(g)
          .filter((o) => !o.disabled && o.cost <= g.resources.gold)
          .at(-1).id,
      ).ok,
    );
  }
  const before = g.turn;
  advance(g);
  assert.equal(g.turn, before + 1);
};
test('many characters of one race and species draw visibly different painted faces rather than backgrounds', () => {
  const g = make(),
    people = Array.from({ length: 24 }, () =>
      newPerson(g, {
        race: 'Beastfolk',
        species: 'Fox',
        age: 38,
        site: 'capital',
      }),
    );
  initializePortraits(g);
  assert.ok(new Set(people.map((p) => p.portraitRecipe.paint)).size >= 4);
  assert.ok(
    portraitCatalog.filter((p) => p.race === 'Beastfolk' && p.species === 'Fox')
      .length >= 4,
  );
  assert.ok(
    new Set(
      people.map((p) =>
        [
          p.portraitRecipe.paint,
          p.portraitRecipe.eyeWidth,
          p.portraitRecipe.jaw,
        ].join(':'),
      ),
    ).size >= 22,
  );
});
test('explicit fur, scarring and baldness alter the visible painted face and not just a coat of arms', () => {
  const g = make(),
    p = g.ruler;
  p.appearance = 'white fur, scar across the eye';
  const white = makePortraitRecipe(g, p);
  p.appearance = 'black fur';
  const black = makePortraitRecipe(g, p);
  assert.notEqual(white.paint, black.paint);
  assert.match(white.paintDescription, /white/);
  assert.match(black.paintDescription, /black/);
  assert.equal(white.visibleScar, true);
  assert.equal(black.visibleScar, false);
  const q =
    g.court.find((p) => p.race === 'Human') ||
    newPerson(g, { race: 'Human', age: 55, site: 'capital' });
  q.gender = 'Man';
  q.appearance = 'bald head';
  assert.match(makePortraitRecipe(g, q).paintDescription, /bald/);
});
test('painted age and gender remain appropriate, including nonbinary presentation', () => {
  const g = make();
  for (const gender of ['Man', 'Woman', 'Nonbinary'])
    for (const age of [25, 75]) {
      const p = newPerson(g, { race: 'Human', age, site: 'capital' });
      p.gender = gender;
      p.appearance = 'An unadorned face';
      const r = makePortraitRecipe(g, p),
        f = paintedFace(r.paint);
      if (gender !== 'Nonbinary') assert.equal(f.gender, gender);
      assert.notEqual(f.age, age === 25 ? 'elder' : 'young');
    }
});
test('saved portrait identities survive presentation changes, royal repainting and replay', () => {
  const g = make(),
    p = g.court[0],
    face = p.portraitRecipe.paint,
    id = p.id,
    rng = g.rng;
  assert.ok(enact(g, 'portrait', id, 'chronicle').ok);
  assert.equal(p.portraitRecipe.paint, face);
  assert.equal(g.rng, rng);
  assert.match(portraitMarkup(p), /treatment-chronicle/);
  const b = parseSave(serializeGame(g));
  assert.equal(portraitMarkup(b.people[id]), portraitMarkup(p));
  const raw = serializeGame(g);
  assert.equal(enact(g, 'portrait', id, 'formal').ok, false);
  assert.equal(serializeGame(g), raw);
});
test('children inherit facial proportions without duplicating either parent’s painted face', () => {
  const g = make(),
    parent = g.ruler,
    child = newPerson(g, {
      race: parent.race,
      species: parent.species,
      age: 20,
      site: 'capital',
    });
  child.parentIds = [parent.id];
  child.portraitRecipe = makePortraitRecipe(g, child);
  assert.notEqual(child.portraitRecipe.paint, parent.portraitRecipe.paint);
  assert.ok(
    Math.abs(child.portraitRecipe.eyeWidth - parent.portraitRecipe.eyeWidth) <=
      2,
  );
  assert.ok(
    Math.abs(child.portraitRecipe.jaw - parent.portraitRecipe.jaw) <= 2,
  );
});
test('unrecognized portrait versions and a paint of the wrong species are rejected', () => {
  for (const change of [
    (p) => (p.portraitRecipe.version = 99),
    (p) => (p.portraitRecipe.paint = 'human-faces-0'),
    (p) => (p.portraitRecipe.paint = 'https://example.com/a.png'),
  ]) {
    const g = make();
    change(g.ruler);
    assert.throws(() => parseSave(serializeGame(g)));
  }
});
test('ambitions count new actual works, grant recognition once, and keep their original causal record', () => {
  const g = make();
  assert.ok(enact(g, 'ambition', 'builder', 'builder').ok);
  const a = g.ambitions[0],
    before = g.ruler.reputation;
  g.resources.infrastructure = 80;
  tickAmbitions(g);
  assert.equal(a.status, 'active');
  for (const kind of ['bridge', 'granary', 'watch'])
    createInstitution(g, kind, 'capital', a.source);
  tickAmbitions(g);
  assert.equal(a.status, 'fulfilled');
  assert.equal(g.ruler.reputation, Math.min(100, before + 5));
  const count = g.archive.length;
  tickAmbitions(g);
  assert.equal(g.archive.length, count);
  assert.equal(g.archive.find((e) => e.id === a.result).cause, a.source);
  assert.equal(enact(g, 'ambition', 'scholar', 'scholar').ok, false);
});
test('commercial ambitions include capital, upkeep and restoration instead of confusing revenue with profit', () => {
  const g = make();
  enact(g, 'ambition', 'prosperous', 'prosperous');
  enact(g, 'commercial', 'estate', 'prudent', g.court[0].id);
  turn(g);
  tickAmbitions(g);
  assert.equal(g.ambitions[0].progress, 0);
  assert.ok(g.ventures[0].profit < 0);
  assert.equal(g.ambitions[0].status, 'active');
});
test('unfinished ambitions and lasting businesses preserve their founders across multiple rulers', () => {
  const g = make();
  enact(g, 'ambition', 'builder', 'builder');
  enact(g, 'commercial', 'estate', 'shared', g.court[0].id);
  turn(g);
  g.heir = g.court[2].id;
  g.resources.legitimacy = 90;
  g.factions.find((f) => f.id === 'nobles').grievance = 0;
  succession(g, 'illness');
  tickAmbitions(g);
  assert.equal(g.ambitions[0].status, 'unfinished');
  assert.equal(g.ventures[0].founder, 'sovereign');
  assert.ok(enact(g, 'ambition', 'scholar', 'scholar').ok);
  const b = parseSave(serializeGame(g));
  for (let n = 0; n < 6; n++) {
    turn(g);
    turn(b);
  }
  assert.deepEqual(g, b);
});
test('a surviving commercial legacy creates a named apprenticeship with linked historical causality', () => {
  const g = make();
  enact(g, 'commercial', 'estate', 'prudent', g.court[0].id);
  for (let n = 0; n < 8; n++) turn(g);
  g.heir = g.court[2].id;
  g.resources.legitimacy = 90;
  g.factions.find((f) => f.id === 'nobles').grievance = 0;
  succession(g, 'illness');
  const v = g.ventures[0],
    e = commerceProposals(g).find((e) => e.template === 'commercial-legacy');
  assert.ok(e);
  assert.equal(e.origin, v.source);
  e.speaker = e.speaker.id;
  e.decisionOrigin = v.source;
  const before = Object.keys(g.people).length;
  resolveCommerceEvent(g, e, 'apprentice');
  assert.equal(Object.keys(g.people).length, before + 1);
  assert.ok(
    g.institutions.some(
      (i) => i.kind === 'apprenticeship' && i.source === v.source,
    ),
  );
  assert.ok(g.promises.some((p) => p.kind === 'education'));
  assert.ok(
    !commerceProposals(g).some(
      (e) => e.template === 'commercial-legacy' && e.venture === v.id,
    ),
  );
});
test('a personal commercial audience closes when its actual delegate dies', () => {
  const g = make();
  enact(g, 'commercial', 'estate', 'prudent', g.court[0].id);
  const v = g.ventures[0];
  v.status = 'failed';
  const e = commerceProposals(g).find(
    (e) => e.template === 'commercial-concern',
  );
  e.speaker = e.speaker.id;
  e.engine = 'emergent';
  recordDeath(g, g.people[e.speaker]);
  prepareAudience(g, e);
  assert.match(e.closedReason, /participants/);
  assert.equal(e.options[0].cost, 0);
  assert.equal(e.engine, undefined);
});
test('a missed promise records accurate personal consequences only once, and remains visible after succession', () => {
  const g = make(),
    p = g.court[0],
    source = g.archive[0].id,
    a = addPromise(g, {
      kind: 'commission',
      title: 'A promised but unfinished repair',
      source,
      due: 0,
      person: p.id,
    });
  const before = p.trust;
  g.turn = 1;
  tickPromises(g);
  assert.equal(a.status, 'late');
  assert.equal(p.trust, before - 3);
  const e = g.archive.find((e) => e.id === a.result),
    t = e.transitions.find((t) => t.field === 'trust');
  assert.equal(t.before, before);
  assert.equal(t.after, p.trust);
  tickPromises(g);
  assert.equal(p.trust, before - 3);
  assert.deepEqual(parseSave(serializeGame(g)).promises, g.promises);
});
test('personal and faction prose varies naturally without changing sign, magnitude or the random stream', () => {
  const g = make(),
    rng = g.rng;
  for (const scope of ['person', 'faction']) {
    const t = {
      scope,
      id: scope === 'person' ? g.court[0].id : 'guild',
      name: 'The River Guild',
      field: 'trust',
      before: 50,
      after: 53,
    };
    const lines = new Set(
      Array.from({ length: 18 }, (_, i) =>
        describeChange(g, { ...t, record: 'r-' + i }),
      ),
    );
    assert.ok(lines.size >= 2);
    for (const line of lines) assert.match(line, /grown|deepened/);
  }
  assert.equal(g.rng, rng);
});

test('imported portrait preferences cannot inject markup into SVG definitions', () => {
  const g = make();
  g.portraitPresentation = 'bad-markup';
  assert.throws(() => parseSave(serializeGame(g)));
  assert.ok(!portraitMarkup(g.ruler, '', '<script>').includes('<script>'));
});
