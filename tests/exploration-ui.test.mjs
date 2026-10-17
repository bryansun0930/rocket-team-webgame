import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {createSSRApp} from 'vue';
import {renderToString} from '@vue/server-renderer';
import {createPinia} from 'pinia';

test('region actions restrict pools, preserve active contacts and render unlock progress',async()=>{
 const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {default:Panel}=await server.ssrLoadModule('/src/ui/ExplorationPanel.vue');
  const {useCampaignStore}=await server.ssrLoadModule('/src/stores/campaign.ts');
  const {explorationPool}=await server.ssrLoadModule('/src/systems/exploration.ts');
  const {default:config}=await server.ssrLoadModule('/src/data/campaign.json');
  const pinia=createPinia(),campaign=useCampaignStore(pinia);campaign.initialized=true;campaign.persist=async()=>{};
  const render=()=>renderToString(createSSRApp(Panel).use(pinia));
  assert.match(await render(),/调查常青森林/);
  campaign.selectLocation('hoenn');assert.equal(campaign.save.exploration.siteId,'petalburg');
  const before=JSON.stringify(campaign.save);campaign.explore(undefined,true);assert.equal(campaign.encounter,null);assert.equal(JSON.stringify(campaign.save),before);assert.match(campaign.notice,/9 种/);
  campaign.explore('chimney');assert.equal(campaign.encounter.location,'丰缘·烟突山');assert.ok(explorationPool(campaign.save,config.encounters).some(p=>p.id===campaign.encounter.id));
  const contact=JSON.stringify(campaign.encounter),turns=campaign.save.turns;
  campaign.explore('hoenn-sea');assert.equal(campaign.save.turns,turns);assert.equal(JSON.stringify(campaign.encounter),contact);
  campaign.selectLocation('kanto');assert.equal(campaign.save.exploration.regionId,'hoenn');
  const active=await render();assert.match(active,/当前遭遇/);assert.match(active,/请先捕获或放弃/);assert.match(active,/9 种物种研究解锁/);
  campaign.encounter=null;campaign.save.studied=Array.from({length:9},(_,i)=>i+1);campaign.explore(undefined,true);
  assert.equal(campaign.encounter.rarity,'legendary');assert.equal(campaign.encounter.location,'丰缘·远古信号');
  campaign.encounter=null;campaign.selectLocation('bad');assert.equal(campaign.save.exploration.regionId,'hoenn');
 }finally{await server.close();}
});
