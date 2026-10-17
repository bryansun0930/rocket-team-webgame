import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'vite';
import {createPinia} from 'pinia';
import {createSSRApp} from 'vue';
import {renderToString} from '@vue/server-renderer';

test('contract to capture to claim to matched dispatch works through store actions and UI',async()=>{
 const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'}),originalRandom=Math.random;
 try{
  Math.random=()=>0;
  const {useCampaignStore}=await server.ssrLoadModule('/src/stores/campaign.ts');
  const {usePokedexStore}=await server.ssrLoadModule('/src/stores/pokedex.ts');
  const {default:Contracts}=await server.ssrLoadModule('/src/ui/ContractBoard.vue');
  const {default:Dispatch}=await server.ssrLoadModule('/src/ui/DispatchPanel.vue');
  const {validateSave}=await server.ssrLoadModule('/src/systems/campaign.ts');
  const pinia=createPinia(),campaign=useCampaignStore(pinia),dex=usePokedexStore(pinia);
  campaign.initialized=true;campaign.persist=async()=>{campaign.save.activities.contact=campaign.encounter?{...campaign.encounter}:null;};
  dex.entries=JSON.parse(fs.readFileSync(new URL('../public/data/pokemon.json',import.meta.url),'utf8'));dex.loaded=true;
  const render=C=>renderToString(createSSRApp(C).use(pinia));
  campaign.acceptCaptureContract('viridian-capture');assert.match(await render(Contracts),/寻找皮卡丘/);
  for(let i=0;i<5;i++){
   campaign.investigateContract();
   if(campaign.pendingEvent){const before=JSON.stringify(campaign.save);campaign.explore();assert.equal(JSON.stringify(campaign.save),before);campaign.chooseEvent('pursue');}
   if(campaign.encounter?.id===25)break;
   campaign.abandonEncounter();
  }
  assert.equal(campaign.encounter.id,25);
  const snapshot=validateSave(JSON.parse(JSON.stringify(campaign.save)));assert.equal(snapshot.activities.contact.id,25);
  campaign.catchPokemon();assert.equal(campaign.save.activities.contract.progress,1);assert.match(await render(Contracts),/领取捕获委托奖励/);
  campaign.claimCaptureContract();assert.equal(campaign.save.captures[25],1);assert.ok(campaign.save.activities.completedContracts.includes('viridian-capture'));
  campaign.sendDispatch('analysis',25);const dispatchClock=campaign.save.activities.dispatchActions;for(let i=0;i<5;i++)campaign.rest();assert.equal(campaign.save.activities.dispatchActions,dispatchClock);assert.equal(campaign.collection[0].available,0);const active=await render(Dispatch);assert.match(active,/属性加成已生效/);assert.match(active,/还需 5 次行动/);
  const count=campaign.save.captures[25];campaign.tradePokemon(25);assert.equal(campaign.save.captures[25],count);
  for(let i=0;i<5;i++){campaign.explore();if(campaign.pendingEvent)campaign.chooseEvent('supplies');else campaign.abandonEncounter();}assert.equal(campaign.readyDispatches,1);assert.match(await render(Dispatch),/派遣已完成/);
  const points=campaign.save.research;campaign.collectDispatch('analysis');assert.equal(campaign.save.research,points+20);assert.equal(campaign.collection[0].available,1);
  const before=JSON.stringify(campaign.save);campaign.collectDispatch('analysis');assert.equal(JSON.stringify(campaign.save),before);
 }finally{Math.random=originalRandom;await server.close();}
});
