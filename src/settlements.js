import {bound, hash, personById, personList, rememberPerson} from './sim-core.js?v=0.5.0';
import {addFact, appendRecord, schedule} from './history.js?v=0.5.0';
export const developmentProjects=[
  {id:'mill',name:'The mill that feeds the valley',desc:'The mill wheel has stopped. Restore a public mill, grant the guild a lease, or let the households decide how to continue.',skill:'stewardship',cost:18,effects:{food:16,infrastructure:4},faction:'commons'},
  {id:'school',name:'A school at the open hearth',desc:'Books and patient teachers can change the lives of people whose talents the court has never seen.',skill:'stewardship',cost:24,effects:{learning:5,justice:2},faction:'commons'},
  {id:'recruit',name:'New voices in the watch',desc:'A captain can seek volunteers, offer paid service, or organize a smaller civic reserve. Character and public feeling will shape the response.',skill:'martial',cost:18,effects:{military:6,security:4},faction:'guard'},
];
export const developmentChoices={
  mill:[
    {id:'repair',label:'Restore a mill held in public trust',note:'18 gold. Local food and skilled work recover; the crown maintains the wheel for 2 gold per season.',cost:18,effects:{food:16,infrastructure:4}},
    {id:'guild',label:'Lease the mill to its working guild',note:'10 gold. Guild capital can grow production without royal upkeep; contracts give the guild lasting influence.',cost:10,effects:{food:12,trade:5},relations:{guild:{trust:5},commons:{grievance:3}}},
    {id:'local',label:'Let the households reuse what remains',note:'No treasury cost or upkeep. Local independence grows, but milling capacity declines and workers must adapt.',cost:0,effects:{justice:3,food:-4}},
  ],
  school:[
    {id:'public',label:'Open a school to every hearth',note:'24 gold, then 3 each season. A named student learns with a funded teacher, and may grow into useful royal service.',cost:24,effects:{learning:5,justice:3}},
    {id:'guild',label:'Endow a guild apprenticeship',note:'16 gold, then 2 each season. Practical training and skilled trade grow; the guild chooses its apprentices.',cost:16,effects:{learning:3,trade:4},relations:{guild:{respect:5}}},
    {id:'patron',label:'Sponsor a small court tutorial',note:'12 gold, then 1 each season. One pupil receives a closer education; opportunities remain narrower.',cost:12,effects:{learning:2,legitimacy:2}},
  ],
  recruit:[
    {id:'volunteers',label:'Invite volunteers through trusted captains',note:'18 gold. Charisma, recruiting skill and reputation affect numbers and morale. Enthusiasm brings an expectation of fair service.',cost:18,effects:{military:6,security:4},relations:{commons:{respect:3}}},
    {id:'professional',label:'Offer paid professional service',note:'26 gold. More reliable training and equipment, with additional soldiers to maintain after the campaign.',cost:26,effects:{military:8,security:5}},
    {id:'reserve',label:'Raise a small civic reserve',note:'10 gold. Fewer recruits leave their trades; readiness grows more slowly, while local livelihoods are protected.',cost:10,effects:{military:3,justice:2}},
  ],
};
export function initSettlements(g,sites) {
  if(!g.settlements){
    const weights=[.3,.25,.12,.15,.1,.08];
    g.settlements=Object.fromEntries(sites.map((s,i)=>[s.id,{id:s.id,name:s.name,population:Math.floor(g.resources.population*weights[i]),prosperity:45+(hash(s.id+g.seed)%16),infrastructure:g.resources.infrastructure,health:g.resources.health,security:g.resources.security,trade:g.resources.trade,foodProduction:s.id==='fields'?80:35,problems:[],institutions:[],residents:[],families:[],history:[]}]));
    g.settlements[sites[0].id].population+=g.resources.population-Object.values(g.settlements).reduce((a,s)=>a+s.population,0);
  }
  for(const p of personList(g)){
    p.siteId ||= sites.find(s=>s.name===p.location||s.name===p.origin)?.id || 'capital';
    const local=g.settlements[p.siteId];if(local&&!local.residents.includes(p.id))local.residents.push(p.id);
  }
}
export function projectSite(g,id) {
  return ['roads','granary','mill'].includes(id)?'fields':id==='embassy'?'border':'capital';
}
export function createInstitution(g,kind,site,source,details={}) {
  const old=g.institutions.find(i=>i.kind===kind&&i.site===site&&i.status==='active');
  if(old){old.condition=bound(old.condition+12);old.quality=bound(old.quality+3);return old;}
  const local=g.settlements[site];
  const i={id:'institution-'+g.serial.institution++,kind,name:local.name+' '+({bridge:'Crossing',mill:'Mill',school:'School',apprenticeship:'Workshop',granary:'Granary',watch:'Watch house'}[kind]||'Hall'),site,source,founder:g.ruler.id,opened:g.turn,condition:70,quality:55,budget:1,status:'active',staff:[],students:[],milestones:[],...details};
  g.institutions.push(i);local.institutions.push(i.id);
  addFact(g,'institution-founded',{institution:i.id,site,people:i.staff.concat(i.students),name:i.name,kindOfInstitution:kind},source);
  local.history.push(source);
  return i;
}
export function commissionConsequences(g,q,success,source) {
  const site=q.site||projectSite(g,q.id),local=g.settlements[site],actor=personById(g,q.who);
  const progress=success?1:.35;
  local.infrastructure=bound(local.infrastructure+(q.id==='roads'?8:3)*progress);
  if(q.id==='roads') {
    createInstitution(g,'bridge',site,source,{quality:success?65:35,budget:1,staff:[q.who]});
    schedule(g,'road-commerce',source,3,{site,people:[q.who],strength:progress});
  }
  if(q.id==='granary')createInstitution(g,'granary',site,source,{quality:success?65:40,budget:1});
  if(q.id==='mill'){
    local.foodProduction=bound(local.foodProduction+(q.approach==='local'?-12:success?12:4));
    local.prosperity=bound(local.prosperity+(q.approach==='local'?-4:5));
    if(q.approach!=='local')createInstitution(g,'mill',site,source,{owner:q.approach==='guild'?'guild':'crown',budget:q.approach==='guild'?0:2,quality:success?65:38,staff:[q.who]});
    const f=addFact(g,'mill-decision',{site,people:[q.who],choice:q.approach,result:success?'completed':'partial'},source);
    schedule(g,'mill-community',source,3,{site,people:[q.who],fact:f.id,choice:q.approach});
  }
  if(q.id==='school'){
    const pupil=g.futurePeople?.shift() || personList(g).find(p=>p.alive&&p.status==='visitor');
    if(pupil){
      pupil.age=16;pupil.status='citizen';pupil.role='Student';pupil.siteId=site;pupil.location=local.name;pupil.skills.scholarship=18;pupil.education={institution:null,seasons:0,status:'studying'};
      g.notables.push(pupil);
      const kind=q.approach==='guild'?'apprenticeship':'school';
      const i=createInstitution(g,kind,site,source,{budget:q.approach==='public'?3:q.approach==='guild'?2:1,staff:[q.who],students:[pupil.id],quality:success?65:40});
      pupil.education.institution=i.id;
      schedule(g,'school-maturity',source,8,{site,people:[pupil.id],institution:i.id});
    }
  }
  if(actor){actor.wealth=(actor.wealth||12)+(success?4:1);rememberPerson(g,actor,'The work at '+local.name+' left a lasting place in the realm.');}
}
export function tickInstitutions(g) {
  for(const i of g.institutions.filter(i=>i.status==='active')){
    const local=g.settlements[i.site],funded=i.budget===0||g.fundedInstitutions;
    i.condition=bound(i.condition+(funded?.4:-5));
    if(!funded&& !local.problems.includes('unfunded institutions'))local.problems.push('unfunded institutions');
    if(funded&&['school','apprenticeship'].includes(i.kind)){
      for(const id of i.students){
        const p=personById(g,id);if(!p?.alive)continue;
        p.skills.scholarship=bound((p.skills.scholarship||0)+(i.quality>=60?1.5:.75));
        p.education.seasons++;
        if(p.education.seasons>=8&&p.education.status!=='graduated'){
          p.education.status='graduated';p.role=i.kind==='school'?'Apprentice scholar':'Guild apprentice';
          p.wealth=(p.wealth||0)+6;
          appendRecord(g,{kind:'education',people:[p.id],site:i.site,cause:i.source,text:p.name+' completes their first education at '+i.name+'. Their skills and prospects have changed.'});
        }
      }
    }
    if(i.kind==='mill'&&funded)local.prosperity=bound(local.prosperity+.3);
    if(i.kind==='granary'&&funded)local.foodProduction=bound(local.foodProduction+.2);
  }
}
export function dueConsequences(g) {
  const events=[];
  for(const c of g.consequences.filter(c=>c.status==='scheduled'&&c.due<=g.turn)){
    if(c.kind==='school-maturity'){
      const school=g.institutions.find(i=>i.id===c.institution);
      const pupil=c.people.map(id=>personById(g,id)).find(p=>p?.alive);
      if(!school||!pupil){c.status='cancelled';continue;}
      if(school.status!=='active'||pupil.education.seasons<8){c.due=g.turn+1;continue;}
    }
    c.status='offered';
    const local=g.settlements[c.site],origin=g.archive.find(e=>e.id===c.source);
    const speaker=c.people.map(id=>personById(g,id)).find(p=>p?.alive) || g.court.find(p=>p.alive&&p.status==='serving');
    if(!speaker){c.status='cancelled';continue;}
    if(c.kind==='road-commerce'){
      local.trade=bound(local.trade+6*c.strength);local.prosperity=bound(local.prosperity+4*c.strength);
      c.status='completed';
      appendRecord(g,{kind:'consequence',cause:c.source,people:[speaker.id],site:c.site,text:'The crossing at '+local.name+' has brought new work and trade to its households.'});
      continue;
    }
    const mill=c.kind.startsWith('mill-'),success=g.institutions.some(i=>i.kind==='mill'&&i.site===c.site&&i.status==='active');
    const story=c.kind==='mill-legacy'?'A new generation at '+local.name+' has inherited the mill settlement. The community is '+(local.prosperity>=60?'prospering through the old promise':'still finding its way through the old compromise')+'. '+speaker.name+' asks how its story should now be kept.':mill?success?'The wheel turns at '+local.name+'. Workers have begun to earn again; '+speaker.name+' asks whether the new prosperity should serve an open market or be kept as a reserve.':'Households at '+local.name+' have found other work since the mill was left to them. Some want a smaller shared wheel; others ask to leave the valley.':speaker.name+' has studied at '+g.institutions.find(i=>i.id===c.institution).name+'. Books now open work that was once beyond reach. The founding promise needs a next step.';
    events.push({id:'chain-'+c.id,type:'audience',engine:'consequence',arc:c.id,origin:c.source,site:c.site,speaker:speaker.id,backdrop:mill?'market':'archive',title:mill?'The valley after the mill':'The school that changed a life',text:story+'\n\nThe chronicle traces this to '+origin.text,options:mill?[
      {id:'market',label:'Make room for a public market',note:'12 gold. More trade and opportunity, with a continuing public obligation to protect it.',cost:12,effects:{trade:5,justice:2}},
      {id:'reserve',label:'Keep the gain as a community reserve',note:'6 gold. Food resilience grows; merchants receive less of the new prosperity.',cost:6,effects:{food:14,trade:-2}},
      {id:'independent',label:'Recognize the households’ own arrangements',note:'No new treasury promise. Local autonomy grows; the outcome follows the community’s existing resources.',cost:0,effects:{justice:3}},
    ]:[
      {id:'scholar',label:'Offer the graduate a royal appointment',note:'12 gold. Education opens public service; an established courtier may see a new rival.',cost:12,effects:{learning:4}},
      {id:'teacher',label:'Ask them to teach the next class',note:'8 gold. The school gains an experienced pupil as a teacher and spreads opportunity locally.',cost:8,effects:{learning:3,justice:2}},
      {id:'free',label:'Give them the freedom to choose their own work',note:'No royal expenditure or promised office. They keep their education and can pursue an independent career.',cost:0,effects:{trade:2}},
    ]});
  }
  return events;
}
export function settleConsequence(g,e,choice) {
  const c=g.consequences.find(c=>c.id===e.arc);
  if(!c||c.status==='completed')return;
  c.status='completed';
  const local=g.settlements[c.site],p=personById(g,e.speaker);
  if(c.kind==='mill-community'){
    local.prosperity=bound(local.prosperity+(choice==='market'?8:choice==='reserve'?3:2));
    local.trade=bound(local.trade+(choice==='market'?10:choice==='reserve'?-2:3));
    const origin=appendRecord(g,{kind:'consequence',cause:c.source,site:c.site,people:[p.id],text:p.name+' carries the mill settlement forward through '+choice+'.'});
    addFact(g,'community-settlement',{site:c.site,choice,people:[p.id]},origin.id);
    schedule(g,'mill-legacy',c.source,12,{site:c.site,people:[p.id],choice,stage:2});
  }else if(c.kind==='school-maturity'){
    p.role=choice==='scholar'?'Scholar':choice==='teacher'?'Teacher':'Independent scholar';p.wealth=(p.wealth||0)+(choice==='free'?3:8);
    if(choice==='scholar'&&!g.applicants.some(a=>a.id===p.id))g.applicants.push(p);
    if(choice==='teacher'){const i=g.institutions.find(i=>i.id===c.institution);if(!i.staff.includes(p.id))i.staff.push(p.id);}
  }else if(c.kind==='mill-legacy'){
    local.prosperity=bound(local.prosperity+3);
    addFact(g,'settlement-legacy',{site:c.site,people:[p.id],choice},c.source);
  }
}
