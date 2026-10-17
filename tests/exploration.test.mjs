import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {regions,validateLocation,getLocation,explorationPool} from '../src/systems/exploration.ts';
import {survey,validateSave} from '../src/systems/campaign.ts';
const config=JSON.parse(fs.readFileSync(new URL('../src/data/campaign.json',import.meta.url),'utf8'));
const fresh=()=>structuredClone(config.initial);

test('nine configured sites have valid species, distinct pools and regional crossover',()=>{
 assert.equal(regions.length,3);
 const all=new Set(),siteIds=new Set();
 for(const region of regions){
  assert.equal(region.sites.length,3);
  for(const site of region.sites){
   assert.ok(!siteIds.has(site.id));siteIds.add(site.id);
   const s=fresh();s.exploration={regionId:region.id,siteId:site.id};
   const pool=explorationPool(s,config.encounters);
   assert.equal(pool.length,new Set(site.pokemonIds).size);
   assert.ok(pool.length>0);assert.ok(pool.every(e=>e.rarity!=='legendary'));
   for(const id of site.featured)assert.ok(pool.some(e=>e.id===id));
   for(const e of pool)all.add(e.id);
  }
  const s=fresh();s.exploration={regionId:region.id,siteId:region.sites[0].id};s.studied=Array.from({length:region.specialResearch},(_,i)=>i+1);
  const special=explorationPool(s,config.encounters,true);assert.equal(special.length,region.specialPokemonIds.length);
  assert.ok(special.every(e=>e.rarity==='legendary'));special.forEach(e=>all.add(e.id));
 }
 assert.equal(all.size,386);
 assert.ok(regions.find(r=>r.id==='hoenn').sites.some(s=>s.pokemonIds.includes(25)));
 assert.notDeepEqual(regions[0].sites[0].pokemonIds,regions[1].sites[0].pokemonIds);
});
test('special investigations require research and fail before changing resources',()=>{
 for(const region of regions){const s=fresh();s.exploration={regionId:region.id,siteId:region.sites[0].id};s.studied=Array.from({length:region.specialResearch-1},(_,i)=>i+1);const before=structuredClone(s);assert.throws(()=>explorationPool(s,config.encounters,true),/研究/);assert.deepEqual(s,before);s.studied.push(386);assert.ok(explorationPool(s,config.encounters,true).length);}
});
test('legacy saves migrate to Kanto and selected locations survive a round trip',()=>{
 const old=fresh();delete old.exploration;assert.deepEqual(validateSave(old).exploration,{regionId:'kanto',siteId:'viridian'});
 const s=fresh();s.exploration={regionId:'hoenn',siteId:'chimney'};assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);
 for(const invalid of [null,{}, {regionId:'hoenn',siteId:'viridian'},{regionId:'bad',siteId:'bad'}])assert.throws(()=>validateSave({...s,exploration:invalid}));
 assert.equal(getLocation(s.exploration).site.name,'烟突山');assert.throws(()=>validateLocation('hoenn'));
});
test('regional surveys stay in their selected pool and retain existing economic rules',()=>{
 for(const region of regions)for(const site of region.sites){
  const s=fresh();s.exploration={regionId:region.id,siteId:site.id};const before=structuredClone(s),pool=explorationPool(s,config.encounters);
  for(const roll of [0,.25,.5,.99])assert.ok(site.pokemonIds.includes(survey(s,config.rules,pool,()=>roll).id));
  assert.equal(s.balls,before.balls);assert.equal(s.money,before.money+config.rules.surveyMoney*4);assert.equal(s.stats.surveys,4);
 }
});
