import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,enact,resolveEvent,eventOptions,advance,parseSave,seasonProjection,succession} from '../src/game.js';
const make=(seed=2,extra={})=>{const g=createGame({scale:'town',race:'Human',history:'Inherited',seed,...extra});resolveEvent(g,'decline');g.resources.gold=500;g.resources.food=500;return g;};
const answer=g=>{let count=0;while(g.event){assert.ok(++count<20);const o=eventOptions(g).find(o=>!o.disabled&&o.cost<=g.resources.gold);assert.ok(resolveEvent(g,o.id).ok);}};
test('a mill decision changes a place and a person, then produces linked consequences across a reign',()=>{
  let g=make();const actor=g.court[0],wealth=actor.wealth,place=g.settlements.fields,production=place.foodProduction;
  const r=enact(g,'project','mill','repair',actor.id);assert.ok(r.ok);const origin=r.entry;
  advance(g);assert.ok(place.foodProduction>production);assert.ok(actor.wealth>wealth);assert.ok(g.institutions.some(i=>i.kind==='mill'));
  const result=g.archive.find(e=>e.kind==='assignment'&&e.project==='mill');assert.equal(result.cause,origin);
  for(let n=0;n<2;n++){answer(g);advance(g);}
  while(g.event&&g.event.engine!=='consequence')resolveEvent(g,eventOptions(g).find(o=>o.cost<=g.resources.gold&&!o.disabled).id);
  assert.equal(g.event.arc,g.consequences.find(c=>c.kind==='mill-community').id);
  resolveEvent(g,'market');g.heir=actor.id;g.resources.legitimacy=95;g.factions.find(f=>f.id==='nobles').grievance=0;succession(g);
  g=parseSave(JSON.stringify(g));
  for(let n=0;n<12;n++){answer(g);advance(g);}
  assert.ok(g.archive.some(e=>e.cause===result.id&&e.kind==='consequence'));assert.ok(g.consequences.some(c=>c.kind==='mill-legacy'));
  assert.equal(g.archive.find(e=>e.id===origin).ruler,'sovereign');
});
test('funded schooling actually educates a named pupil; suspended work does not graduate them',()=>{
  const g=make(4);enact(g,'project','school','public',g.court[0].id);advance(g);answer(g);
  const school=g.institutions.find(i=>i.kind==='school'),pupil=g.notables.find(p=>p.id===school.students[0]),before=pupil.skills.scholarship;
  for(let n=0;n<3;n++){advance(g);answer(g);}assert.ok(pupil.skills.scholarship>before);
  enact(g,'institution',school.id,'close');const seasons=pupil.education.seasons;
  for(let n=0;n<8;n++){advance(g);answer(g);}assert.equal(pupil.education.seasons,seasons);assert.equal(pupil.education.status,'studying');
  assert.ok(enact(g,'institution',school.id,'fund').ok);
  for(let n=0;n<8;n++){advance(g);answer(g);}assert.equal(pupil.education.status,'graduated');
  assert.ok(g.archive.some(e=>e.kind==='education'&&e.people.includes(pupil.id)));
});
test('forecast and actual accounts agree when no commission or counsel changes the assumptions',()=>{
  for(const scale of ['town','province']){
    const g=make(8,{scale}),before={...g.resources},p=seasonProjection(g);
    advance(g);assert.equal(g.resources.gold-before.gold,p.balance);assert.equal(g.resources.food-before.food,p.foodBalance);
    assert.equal(g.lastSeasonReport.changes.gold,p.balance);
  }
});
test('a stable province can feed its population through four seasonal harvest cycles',()=>{
  const g=make(8,{scale:'province'});g.resources.food=115;
  for(let n=0;n<16;n++){answer(g);advance(g);assert.ok(g.resources.food>0);}
});
test('completed consequences and their rewards cannot be applied a second time after loading',()=>{
  const g=make(9);enact(g,'project','mill','guild',g.court[0].id);advance(g);for(let n=0;n<2;n++){answer(g);advance(g);}
  while(g.event&&g.event.engine!=='consequence')resolveEvent(g,eventOptions(g).find(o=>!o.disabled&&o.cost<=g.resources.gold).id);
  const duplicate=structuredClone(g.event);resolveEvent(g,'reserve');const saved=parseSave(JSON.stringify(g)),gold=saved.resources.gold,prosperity=saved.settlements.fields.prosperity;
  saved.event=duplicate;resolveEvent(saved,'market');assert.equal(saved.resources.gold,gold);assert.equal(saved.settlements.fields.prosperity,prosperity);
});
test('damaged consequence state is rejected before it reaches the interface',()=>{
  for(const mutate of [g=>g.consequences.push({id:'bad',kind:'mill-community',due:0,status:'scheduled',source:'missing'}),g=>g.settlements.fields.population=-1,g=>g.archive[0].cause='missing',g=>g.serial.fact=-1]){
    const g=make();mutate(g);assert.throws(()=>parseSave(JSON.stringify(g)));
  }
});
