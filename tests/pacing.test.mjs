import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {trackingLimit,contractReward,supportedCapture,eventIndexAt,supplyWork} from '../src/systems/pacing.ts';
import {acceptContract,trackedPool,activities,startDispatch,finishDispatch} from '../src/systems/activities.ts';
import {capture,survey,validateSave} from '../src/systems/campaign.ts';
import {explorationPool} from '../src/systems/exploration.ts';
const c=JSON.parse(fs.readFileSync(new URL('../src/data/campaign.json',import.meta.url),'utf8'));
const fresh=()=>structuredClone(c.initial);
test('first contract appears by second search and capture support works after earlier captures',()=>{
 const s=fresh(),q=activities.contracts[0];s.stats.captures=2;acceptContract(s,q.id);
 const pool=explorationPool(s,c.encounters);trackedPool(s,pool,false);assert.equal(trackingLimit(s),2);
 const guaranteed=trackedPool(s,pool,false);assert.deepEqual(guaranteed.map(p=>p.id),[q.pokemonId]);
 const e={...guaranteed[0],siteId:q.siteId};assert.ok(supportedCapture(s,e));assert.ok(capture(s,e,()=>.999,false,supportedCapture(s,e)));
 assert.equal(supportedCapture(s,{...e,siteId:'moon'}),false);assert.ok(contractReward(s,q.reward).money>=c.buildings[0].money);assert.ok(contractReward(s,q.reward).materials>=c.buildings[0].materials);
 s.activities.completedContracts.push(q.id);assert.equal(trackingLimit(s),5);assert.equal(supportedCapture(s,e),false);assert.deepEqual(contractReward(s,q.reward),q.reward);
});
test('tutorial event is at three, subsequent gaps cycle through four five six',()=>{
 const hits=[];for(let i=1;i<=48;i++)if(eventIndexAt(i)!==null)hits.push(i);
 assert.deepEqual(hits.slice(0,7),[3,7,12,18,22,27,33]);
});
test('limited full supplies advance dispatch, emergency supplies never advance dispatch or strand player',()=>{
 const s=fresh();s.captures[25]=1;startDispatch(s,'scout',{id:25,type:['电']});
 supplyWork(s,c.rules);supplyWork(s,c.rules);assert.equal(s.activities.supplyCredits,0);assert.equal(s.activities.dispatchActions,2);
 const before=s.money;for(let i=0;i<3;i++)supplyWork(s,c.rules);assert.equal(s.activities.dispatchActions,2);assert.equal(s.money,before+activities.supply.emergencyMoney*3);assert.throws(()=>finishDispatch(s,'scout'));
 survey(s,c.rules,c.encounters,()=>0);assert.equal(s.activities.dispatchActions,3);finishDispatch(s,'scout');
 survey(s,c.rules,c.encounters,()=>0);survey(s,c.rules,c.encounters,()=>0);assert.equal(s.activities.supplyCredits,1);
});
test('existing dispatch remaining progress survives clock migration; bad new counters rejected',()=>{
 const old=fresh();old.turns=20;old.captures[25]=1;delete old.activities.dispatchActions;delete old.activities.supplyCredits;old.activities.dispatches=[{jobId:'analysis',pokemonId:25,finishTurn:23,bonus:true}];
 const migrated=validateSave(old);assert.equal(migrated.activities.dispatchActions,20);assert.equal(migrated.activities.dispatches[0].finishTurn-migrated.activities.dispatchActions,3);assert.equal(migrated.activities.supplyCredits,2);
 for(const patch of [{dispatchActions:-1},{supplyCredits:-1},{dispatchActions:NaN}])assert.throws(()=>validateSave({...migrated,activities:{...migrated.activities,...patch}}));
});
