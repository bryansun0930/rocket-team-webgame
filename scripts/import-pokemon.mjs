// Build-time importer only. Game clients read local JSON and PNGs, never the upstream APIs.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataRoot='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
const spriteRoot='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/';
const maxSpecies=386;
const cache=path.join(root,'ART/pokemon-sources');
await fs.mkdir(cache,{recursive:true});
await fs.mkdir(path.join(root,'public/assets/pokemon/sprites'),{recursive:true});
async function download(url) {
 for(let attempt=0;attempt<3;attempt++) {
  try {const response=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!response.ok)throw new Error(`${response.status} ${url}`);return Buffer.from(await response.arrayBuffer());}
  catch(error){if(attempt===2)throw error;}
 }
}
function csv(text) {
 const rows=[];let row=[],value='',quoted=false;
 for(let i=0;i<text.length;i++) {
  const ch=text[i];
  if(ch==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
  else if(ch===','&&!quoted){row.push(value);value='';}
  else if(ch==='\n'&&!quoted){row.push(value.replace(/\r$/,''));rows.push(row);row=[];value='';}
  else value+=ch;
 }
 if(value||row.length){row.push(value);rows.push(row);}
 const headers=rows.shift();return rows.filter(row=>row.length===headers.length).map(row=>Object.fromEntries(headers.map((header,i)=>[header,row[i]])));
}
async function table(filename) {
 const file=path.join(cache,filename);let data;
 try {data=await fs.readFile(file);} catch {data=await download(dataRoot+filename);await fs.writeFile(file,data);}
 return csv(data.toString('utf8'));
}
const [names,species,types,stats]=await Promise.all(['pokemon_species_names.csv','pokemon_species.csv','pokemon_types.csv','pokemon_stats.csv'].map(table));
const nameMap=new Map(names.filter(p=>p.local_language_id==='12').map(p=>[Number(p.pokemon_species_id),p]));
const englishMap=new Map(names.filter(p=>p.local_language_id==='9').map(p=>[Number(p.pokemon_species_id),p.name]));
const speciesMap=new Map(species.map(p=>[Number(p.id),p]));
const typeNames={1:'一般',2:'格斗',3:'飞行',4:'毒',5:'地面',6:'岩石',7:'虫',8:'幽灵',9:'钢',10:'火',11:'水',12:'草',13:'电',14:'超能力',15:'冰',16:'龙',17:'恶',18:'妖精'};
const habitats={1:'洞穴',2:'森林',3:'草地',4:'山地',5:'稀有区域',6:'荒野',7:'海洋',8:'水边',9:'城市'};
const old=JSON.parse(await fs.readFile(path.join(root,'public/data/pokemon.json'),'utf8'));
const entries=[];
for(let id=1;id<=maxSpecies;id++) {
 const s=speciesMap.get(id),n=nameMap.get(id);if(!s||!n||!englishMap.has(id))throw new Error(`Missing species ${id}`);
 const type=types.filter(p=>Number(p.pokemon_id)===id).sort((a,b)=>Number(a.slot)-Number(b.slot)).map(p=>typeNames[p.type_id]);
 const total=stats.filter(p=>Number(p.pokemon_id)===id).reduce((sum,p)=>sum+Number(p.base_stat),0);
 const rarity=s.is_legendary==='1'||s.is_mythical==='1'?'legendary':total>=500?'rare':s.evolves_from_species_id||Number(s.capture_rate)<100?'uncommon':'common';
 const habitat=habitats[s.habitat_id]??'未知区域';
 const previous=old.find(p=>p.id===id);
 entries.push({id,name:n.name,englishName:englishMap.get(id),type,category:n.genus,description:previous?.description??`${n.name}是${n.genus}，拥有${type.join('、')}属性。图鉴栖息地记录为${habitat}，可在外围调查中寻找。`,rocketValue:previous?.rocketValue??Math.round(total/5),researchValue:previous?.researchValue??Math.round(total/8),sprite:`assets/pokemon/sprites/${String(id).padStart(3,'0')}.png`,rarity,habitat});
}
let completed=0,index=0;
async function worker() {
 while(index<entries.length) {
  const pokemon=entries[index++];const file=path.join(root,'public',pokemon.sprite);
  let valid=false;try{const data=await fs.readFile(file);valid=data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));}catch{}
  if(!valid){const png=await download(spriteRoot+pokemon.id+'.png');if(!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error(`Invalid PNG ${pokemon.id}`);await fs.writeFile(file,png);}
  completed++;if(completed%25===0||completed===entries.length)console.log(`Sprites: ${completed}/${entries.length}`);
 }
}
await Promise.all(Array.from({length:6},worker));
const configFile=path.join(root,'src/data/campaign.json');const config=JSON.parse(await fs.readFile(configFile,'utf8'));
const existingOrder=config.encounters.map(p=>p.id).filter(id=>id<=maxSpecies);const order=[...new Set([...existingOrder,...entries.map(p=>p.id)])];
const weights={common:8,uncommon:4,rare:1,legendary:.25};
config.encounters=order.map(id=>{const p=entries.find(p=>p.id===id),s=speciesMap.get(id);return {id,name:p.name,chance:Math.max(.15,Math.min(.8,Number(s.capture_rate)/255)),weight:weights[p.rarity],rarity:p.rarity};});
await fs.writeFile(path.join(root,'public/data/pokemon.json'),JSON.stringify(entries,null,2)+'\n');
await fs.writeFile(configFile,JSON.stringify(config,null,2)+'\n');
await fs.writeFile(path.join(cache,'sources.json'),JSON.stringify({importedAt:new Date().toISOString(),count:entries.length,dataRoot,spriteRoot,language:'zh-Hans (12), English (9)',description:'Existing authored descriptions preserved; new descriptions composed from structured fields.',sprites:'Generation III Emerald front sprites, original files retained without edits.'},null,2)+'\n');
console.log(`Imported ${entries.length} species, local sprites and weighted encounters.`);
