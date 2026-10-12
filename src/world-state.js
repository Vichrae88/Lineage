import {canonicalizePeople,charactersValid} from './characters.js?v=0.5.0';
import {sites,factionLore,expeditions,relics} from './data.js?v=0.5.0';
import {initHistory,historyValid} from './history.js?v=0.5.0';
import {initSettlements,developmentProjects} from './settlements.js?v=0.5.0';
import {personList,hash,idValid} from './sim-core.js?v=0.5.0';
export function initializeWorld(g,projects) {
  g.preparedIdentities ??= Boolean(g.storyDeck);
  g.world ||= {sites:structuredClone(sites),factionLore:structuredClone(factionLore),expeditions:structuredClone(expeditions),relics:structuredClone(relics),projects:structuredClone(projects),projectReports:{},river:'Alder River',predominantRace:g.ruler.race};
  for(const p of developmentProjects)if(!g.world.projects.some(old=>old.id===p.id))g.world.projects.push(structuredClone(p));
  g.kin ||= [];g.notables ||= [];g.futurePeople ||= [];
  canonicalizePeople(g);
  g.simulationVersion=2;
  for(const p of personList(g)){
    p.alive ??= true;
    p.wealth ??= 8+hash(p.id)%28;
    p.id ||= 'sovereign';
  }
  initHistory(g);initSettlements(g,g.world.sites);
  g.version=5;
  return g;
}
export function worldStateValid(g) {
  if(g.simulationVersion>=2&&!charactersValid(g))return false;
  if(!g.serial||!['record','fact','institution','arc','event','person'].every(k=>Number.isInteger(g.serial[k])&&g.serial[k]>=0))return false;
  if(!Array.isArray(g.archive)||!g.facts||Array.isArray(g.facts)||!Array.isArray(g.institutions)||!g.settlements||Array.isArray(g.settlements)||!Array.isArray(g.reports)||!historyValid(g))return false;
  if(Object.entries(g.settlements).some(([id,s])=>!s||id!==s.id||!idValid(id)||typeof s.name!=='string'||!['population','prosperity','infrastructure','health','security','trade','foodProduction'].every(k=>Number.isFinite(s[k])&&s[k]>=0)||!['problems','institutions','residents','families','history'].every(k=>Array.isArray(s[k])&&s[k].every(x=>typeof x==='string'))))return false;
  if(g.institutions.some(i=>!i||!idValid(i.id)||!['bridge','mill','school','apprenticeship','granary','watch'].includes(i.kind)||!g.settlements[i.site]||typeof i.name!=='string'||!Number.isFinite(i.budget)||i.budget<0||i.budget>100||!Number.isFinite(i.condition)||!Number.isFinite(i.quality)||!['active','closed','ruined'].includes(i.status)||!Array.isArray(i.students)||!Array.isArray(i.staff)))return false;
  if(g.reports.length>12||g.reports.some(r=>!r||typeof r.id!=='string'||!Number.isInteger(r.turn)||!r.changes||typeof r.changes!=='object'||Object.values(r.changes).some(v=>!Number.isFinite(v))))return false;
  return true;
}
