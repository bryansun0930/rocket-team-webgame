import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'vite';
import {createSSRApp} from 'vue';
import {renderToString} from '@vue/server-renderer';
import {createPinia} from 'pinia';

test('catalog renders all species as continuous rows, filters and a detail dialog',async()=>{
 const server=await createServer({server:{middlewareMode:true},appType:'custom'});
 try {
  const {default:Pokedex}=await server.ssrLoadModule('/src/ui/Pokedex.vue');
  const {usePokedexStore}=await server.ssrLoadModule('/src/stores/pokedex.ts');
  const pinia=createPinia(),dex=usePokedexStore(pinia);
  dex.entries=JSON.parse(fs.readFileSync(new URL('../public/data/pokemon.json',import.meta.url),'utf8'));dex.loaded=true;
  const render=()=>renderToString(createSSRApp(Pokedex).use(pinia));
  const all=await render();assert.equal([...all.matchAll(/aria-label="查看[^"]+详情"/g)].length,386);assert.doesNotMatch(all,/下一页|上一页|图鉴分页/);assert.match(all,/class="dex-list"/);assert.doesNotMatch(all,/<img/);
  dex.query='皮卡丘';const filtered=await render();assert.doesNotMatch(filtered,/<img/);assert.match(filtered,/皮卡丘/);assert.doesNotMatch(filtered,/没有符合条件/);assert.equal([...filtered.matchAll(/aria-label="查看[^"]+详情"/g)].length,1);
  dex.query='不存在';assert.match(await render(),/没有符合条件/);
  dex.selectedId=384;const detail=await render();assert.match(detail,/<dialog[^>]+aria-labelledby="pokemon-detail-title"/);assert.match(detail,/384.png/);assert.match(detail,/烈空坐/);assert.match(detail,/传说/);assert.match(detail,/关闭宝可梦详情/);
 } finally {await server.close();}
});
