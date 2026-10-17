import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {createSSRApp} from 'vue';
import {renderToString} from '@vue/server-renderer';
import {createPinia} from 'pinia';
import fs from 'node:fs';

test('completed campaign renders ending and postgame state',async()=>{
  const server=await createServer({server:{middlewareMode:true},appType:'custom'});
  try {
    const {default:Operations}=await server.ssrLoadModule('/src/ui/Operations.vue');
    const {useCampaignStore}=await server.ssrLoadModule('/src/stores/campaign.ts');
    const config=JSON.parse(fs.readFileSync(new URL('../src/data/campaign.json',import.meta.url),'utf8'));
    const pinia=createPinia();const campaign=useCampaignStore(pinia);
    campaign.save={...structuredClone(config.initial),chapter:10,completed:config.missions.map(m=>m.id),ended:true};
    const app=createSSRApp(Operations,{panel:'missions'});app.use(pinia);
    const html=await renderToString(app);
    assert.match(html,/地下王者/);assert.match(html,/完成全部十章主线/);assert.match(html,/继续探索/);
    assert.equal(campaign.rank,'地下首领');
  } finally {await server.close();}
});
