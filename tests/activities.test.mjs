import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {activities,acceptContract,trackedPool,contractCapture,claimContract,createEvent,resolveEvent,startDispatch,finishDispatch,availablePokemon} from '../src/systems/activities.ts';
import {validateSave,capture,trade,study} from '../src/systems/campaign.ts';
import {explorationPool} from '../src/systems/exploration.ts';
const c=JSON.parse(fs.readFileSync(new URL('../src/data/campaign.json',import.meta.url),'utf8'));
const dex=JSON.parse(fs.readFileSync(new URL('../public/data/pokemon.json',import.meta.url),'utf8'));
const fresh=()=>structuredClone(c.initial);
const target=q=>({...c.encounters.find(p=>p.id===q.pokemonId),siteId:q.siteId,regionId:q.regionId,location:'测试地点'});

test('every contract target belongs to its stated regional site',()=>{for(const q of activities.contracts){const s=fresh();s.exploration={regionId:q.regionId,siteId:q.siteId};assert.ok(explorationPool(s,c.encounters).some(p=>p.id===q.pokemonId));}});
test('contract tracking boosts only active location and guarantees target by configured limit',()=>{
 const s=fresh(),q=activities.contracts[0];acceptContract(s,q.id);const pool=explorationPool(s,c.encounters),tracked=trackedPool(s,pool,false);
 assert.equal(tracked.find(p=>p.id===q.pokemonId).weight,pool.find(p=>p.id===q.pokemonId).weight*activities.tracking.weightMultiplier);
 const before=s.activities.contract.searches;s.exploration.siteId='moon';assert.deepEqual(trackedPool(s,pool,false),pool);assert.equal(s.activities.contract.searches,before);s.exploration.siteId=q.siteId;
 for(let i=1;i<activities.tracking.guaranteeAfter;i++)trackedPool(s,pool,false);
 assert.deepEqual(trackedPool(s,pool,false).map(p=>p.id),[q.pokemonId]);
});
test('contract accepts only new captures at correct site and claims exactly once without consuming partner',()=>{
 const s=fresh(),q=activities.contracts[0];s.captures[q.pokemonId]=1;acceptContract(s,q.id);assert.equal(s.activities.contract.progress,0);
 contractCapture(s,{...target(q),siteId:'moon'});assert.equal(s.activities.contract.progress,0);
 const before=structuredClone(s);assert.throws(()=>claimContract(s));assert.deepEqual(s,before);
 capture(s,target(q),()=>0);contractCapture(s,target(q));assert.equal(s.activities.contract.progress,1);const money=s.money;claimContract(s);assert.equal(s.money,money+activities.tracking.firstReward.money);assert.equal(s.captures[q.pokemonId],2);assert.throws(()=>claimContract(s));assert.throws(()=>acceptContract(s,q.id));
});
test('events trigger at intervals, persist choices, and resolve once with meaningful tradeoff',()=>{
 for(const choice of ['pursue','supplies']){const s=fresh(),e=target(activities.contracts[0]);s.stats.surveys=1;assert.equal(createEvent(s,e,false),false);s.stats.surveys=activities.eventInterval;assert.equal(createEvent(s,e,true),false);assert.equal(createEvent(s,e,false),false);assert.equal(createEvent(s,e,false),true);const restored=validateSave(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.activities.event,s.activities.event);const before=structuredClone(s);assert.throws(()=>resolveEvent(s,'invalid',c.rules));assert.deepEqual(s,before);const result=resolveEvent(s,choice,c.rules);if(choice==='pursue'){assert.ok(result.chance>e.chance);assert.ok(s.wanted>before.wanted);}else{assert.equal(result,null);assert.ok(s.materials>before.materials);}const after=structuredClone(s);assert.throws(()=>resolveEvent(s,choice,c.rules));assert.deepEqual(s,after);}
});
test('risk choices trigger raid rules rather than bypass wanted threshold',()=>{const s=fresh();s.wanted=99;s.money=100;s.stats.surveys=3;s.activities.normalSurveys=2;createEvent(s,target(activities.contracts[0]),false);resolveEvent(s,'pursue',c.rules);assert.equal(s.wanted,40);assert.equal(s.money,100-c.rules.raidMoney);});
test('dispatch reserves individuals, blocks trade/research and cannot double assign same individual',()=>{
 const s=fresh(),p=dex.find(p=>p.id===25);s.captures[p.id]=1;startDispatch(s,'analysis',p);assert.equal(availablePokemon(s,p.id),0);const before=structuredClone(s);assert.throws(()=>startDispatch(s,'transport',p));assert.throws(()=>trade(s,p.id,c.rules));assert.throws(()=>study(s,p.id,c.rules));assert.deepEqual(s,before);finishDispatch(s,'analysis',true);assert.equal(availablePokemon(s,p.id),1);assert.equal(s.research,0);
});
test('dispatch has action-based duration, matched type bonus, slot cap and one-time settlement',()=>{
 const s=fresh(),p=dex.find(p=>p.id===25);s.captures[p.id]=3;startDispatch(s,'analysis',p);startDispatch(s,'transport',p);assert.throws(()=>startDispatch(s,'scout',p));assert.throws(()=>finishDispatch(s,'analysis'));assert.equal(s.activities.dispatches[0].bonus,true);s.activities.dispatchActions+=5;const before=s.research;finishDispatch(s,'analysis');const job=activities.dispatches.find(j=>j.id==='analysis');assert.equal(s.research,before+job.reward.research+job.bonus.research);assert.throws(()=>finishDispatch(s,'analysis'));assert.equal(s.captures[p.id],3);
});
test('legacy activity migration and pending encounter round trip reject malformed reservations/events',()=>{
 const legacy=fresh();delete legacy.activities;assert.deepEqual(validateSave(legacy).activities,c.initial.activities);
 const s=fresh();s.activities.contact=target(activities.contracts[0]);assert.deepEqual(validateSave(s),s);
 for(const patch of [{completedContracts:['invalid']},{dispatches:[{jobId:'analysis',pokemonId:25,finishTurn:2,bonus:true}]},{event:{id:'bad',encounter:s.activities.contact}},{contact:{...s.activities.contact,chance:2}},{contract:{id:activities.contracts[0].id,progress:2,searches:0}}])assert.throws(()=>validateSave({...s,activities:{...s.activities,...patch}}));
});
