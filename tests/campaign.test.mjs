import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {capture,complete,study,survey,trade,upgrade,validateSave} from '../src/systems/campaign.ts';
const config=JSON.parse(fs.readFileSync(new URL('../src/data/campaign.json',import.meta.url),'utf8'));
const fresh=()=>structuredClone(config.initial);
const zero=()=>0;

test('can play all ten chapters from fresh resources without changing objectives',()=>{
 const s=fresh();
 const encounter=survey(s,config.rules,config.encounters,zero);
 complete(s,config.missions[s.chapter],10);
 assert.ok(capture(s,encounter,zero));complete(s,config.missions[s.chapter],10);
 upgrade(s,config.buildings[0]);complete(s,config.missions[s.chapter],10);
 for(let i=0;i<2;i++){s.money+=config.rules.jobMoney;s.materials+=config.rules.jobMaterials;s.stats.jobs++;}
 complete(s,config.missions[s.chapter],10);
 study(s,41,config.rules);
 for(const id of [52,109,25,92]) { const e=config.encounters.find(e=>e.id===id);survey(s,config.rules,[e],zero);capture(s,e,zero); }
 study(s,52,config.rules);complete(s,config.missions[s.chapter],10);
 complete(s,config.missions[s.chapter],10);
 trade(s,25,config.rules);complete(s,config.missions[s.chapter],10);
 upgrade(s,config.buildings[1]);upgrade(s,config.buildings[2]);complete(s,config.missions[s.chapter],10);
 study(s,109,config.rules);complete(s,config.missions[s.chapter],10);complete(s,config.missions[s.chapter],10);
 assert.equal(s.ended,true);assert.equal(s.chapter,10);assert.equal(s.completed.length,10);
 assert.deepEqual(validateSave(s),s);
});
test('incomplete mission cannot claim or spend resources',()=>{const s=fresh(),before=structuredClone(s);assert.throws(()=>complete(s,config.missions[0],10));assert.deepEqual(s,before);});
test('repeated reward rejected',()=>{const s=fresh();survey(s,config.rules,config.encounters,zero);complete(s,config.missions[0],10);const before=structuredClone(s);assert.throws(()=>complete(s,config.missions[0],10));assert.deepEqual(s,before);});
test('failed capture spends one ball but never grants collection',()=>{const s=fresh();assert.equal(capture(s,config.encounters[0],()=>.99),false);assert.equal(s.balls,7);assert.equal(s.stats.captures,0);});
test('zero balls prevents capture without mutation',()=>{const s=fresh();s.balls=0;const before=structuredClone(s);assert.throws(()=>capture(s,config.encounters[0],zero));assert.deepEqual(s,before);});
test('research unique and trade inventory cannot go negative',()=>{const s=fresh();capture(s,config.encounters[0],zero);study(s,41,config.rules);assert.throws(()=>study(s,41,config.rules));trade(s,41,config.rules);assert.throws(()=>trade(s,41,config.rules));assert.equal(s.captures[41],0);});
test('upgrade affordability and cap enforced',()=>{const s=fresh();s.money=0;assert.throws(()=>upgrade(s,config.buildings[0]));assert.equal(s.buildings.lab,0);s.money=10000;s.materials=1000;for(let i=0;i<3;i++)upgrade(s,config.buildings[0]);assert.throws(()=>upgrade(s,config.buildings[0]));assert.equal(s.buildings.lab,3);});
test('raid floors money and reduces wanted',()=>{const s=fresh();s.money=0;s.wanted=99;survey(s,config.rules,config.encounters,zero);assert.equal(s.money,0);assert.equal(s.wanted,40);});
test('invalid saves rejected',()=>{for(const patch of [{version:2},{money:-1},{chapter:11},{ended:true},{completed:['x']},{buildings:{lab:99}},{captures:{x:1}}])assert.throws(()=>validateSave({...fresh(),...patch}));});
test('save round trip preserves all campaign fields',()=>{const s=fresh();capture(s,config.encounters[0],zero);assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);});
test('future mission cannot be completed out of order',()=>{const s=fresh();s.stats.captures=99;const before=structuredClone(s);assert.throws(()=>complete(s,config.missions[1],10));assert.deepEqual(s,before);});
test('all dex species are obtainable via encounter configuration',()=>{const dex=JSON.parse(fs.readFileSync(new URL('../public/data/pokemon.json',import.meta.url),'utf8'));const ids=new Set(config.encounters.map(e=>e.id));assert.equal(ids.size,dex.length);for(const p of dex)assert.ok(ids.has(p.id));});
test('configured tutorial assistance guarantees only the first capture',()=>{const s=fresh();assert.ok(capture(s,config.encounters[0],()=>.99,true));assert.equal(s.stats.captures,1);assert.equal(capture(s,config.encounters[0],()=>.99,true),false);assert.equal(s.stats.captures,1);assert.equal(s.balls,6);});
