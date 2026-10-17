import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parsePokemon,filterPokemon} from '../src/systems/pokemon.ts';
import {chooseEncounter} from '../src/systems/campaign.ts';
const pokemon=parsePokemon(JSON.parse(fs.readFileSync(new URL('../public/data/pokemon.json',import.meta.url),'utf8')));

test('Gen I–III catalog contains all 386 species with localized names and fields',()=>{assert.equal(pokemon.length,386);assert.deepEqual(pokemon.map(p=>p.id),Array.from({length:386},(_,i)=>i+1));assert.equal(pokemon[24].name,'皮卡丘');assert.equal(pokemon[149].name,'超梦');assert.equal(pokemon[150].name,'梦幻');assert.equal(pokemon[251].name,'木守宫');assert.equal(pokemon[383].name,'烈空坐');assert.equal(pokemon[385].name,'代欧奇希斯');for(const p of pokemon){assert.ok(p.category);assert.ok(p.type.every(Boolean));assert.match(p.name,/[\u4e00-\u9fff]/);}});
test('every catalog sprite is a complete 64x64 local PNG',()=>{for(const p of pokemon){const b=fs.readFileSync(new URL('../public/'+p.sprite,import.meta.url));assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(b.readUInt32BE(16),64);assert.equal(b.readUInt32BE(20),64);assert.equal(b.subarray(-8,-4).toString(),'IEND');}});
test('search, dual type and rarity filters combine',()=>{assert.equal(filterPokemon(pokemon,'PIKACHU','')[0].id,25);assert.equal(filterPokemon(pokemon,'#150','','legendary')[0].name,'超梦');assert.equal(filterPokemon(pokemon,'','毒').some(p=>p.id===1),true);assert.equal(filterPokemon(pokemon,'超梦','水').length,0);assert.equal(filterPokemon(pokemon,'','','legendary').length,21);});
test('invalid image references and rarity rejected',()=>{assert.throws(()=>parsePokemon([{...pokemon[0],sprite:'https://external.example/image.png'}]));assert.throws(()=>parsePokemon([{...pokemon[0],rarity:'unknown'}]));});
test('weighted encounter selection respects configured frequencies',()=>{const pool=[{id:1,name:'common',chance:.5,weight:8},{id:2,name:'rare',chance:.5,weight:2}];assert.equal(chooseEncounter(pool,()=>.79).id,1);assert.equal(chooseEncounter(pool,()=>.8).id,2);assert.equal(chooseEncounter(pool,()=>.999).id,2);assert.throws(()=>chooseEncounter([]));});
