import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {findPath} from '../src/systems/pathfinding.ts';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const markers=read('../src/data/interactions.json');
test('both compact hubs keep spawn and every NPC service reachable around collisions',()=>{
 for(const [area,file] of [['base','rocket_base'],['field','rocket_field']]){
  const map=read(`../public/assets/maps/${file}.json`),w=map.width,h=map.height;
  const layers=map.layers.filter(l=>l.type==='tilelayer');
  const blocked=new Set(map.tilesets[0].tiles.filter(t=>t.properties.some(p=>p.name==='collides'&&p.value)).map(t=>t.id+1));
  const walkable=Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>!layers.some(l=>blocked.has(l.data[y*w+x]))));
  const spawn=map.layers.find(l=>l.name==='spawns').objects.find(o=>o.name==='player');
  const start={x:Math.floor(spawn.x/16),y:Math.floor((spawn.y-4)/16)};
  assert.ok(walkable[start.y][start.x]);
  for(const marker of markers[area]){const x=Math.floor(marker.x/16),y=Math.floor(marker.y/16);assert.ok(walkable[y][x],`${area}: ${marker.name} placed on obstacle`);walkable[y][x]=false;}
  for(const marker of markers[area]){
   const x=Math.floor(marker.x/16),y=Math.floor(marker.y/16);
   assert.ok([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([gx,gy])=>findPath(walkable,start,{x:gx,y:gy})!==null),`${area}: ${marker.name} inaccessible`);
  }
 }
});
