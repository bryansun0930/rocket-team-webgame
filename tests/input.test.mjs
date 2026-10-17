import test from 'node:test';
import assert from 'node:assert/strict';
import {PointerDirections,emptyDirections,movement} from '../src/systems/input.ts';
test('held touch moves and releasing stops',()=>{const p=new PointerDirections();p.press(1,'right');assert.deepEqual(movement(emptyDirections(),p.snapshot()),{x:1,y:0});p.release(1);assert.deepEqual(movement(emptyDirections(),p.snapshot()),{x:0,y:0});});
test('two fingers create normalized diagonal movement',()=>{const p=new PointerDirections();p.press(1,'up');p.press(2,'right');const v=movement(emptyDirections(),p.snapshot());assert.ok(Math.abs(Math.hypot(v.x,v.y)-1)<1e-10);p.release(1);assert.deepEqual(movement(emptyDirections(),p.snapshot()),{x:1,y:0});});
test('cancellation and background reset all directions',()=>{const p=new PointerDirections();p.press(1,'left');p.press(2,'up');p.clear();assert.deepEqual(p.snapshot(),emptyDirections());});
test('two fingers holding same direction release independently',()=>{const p=new PointerDirections();p.press(1,'left');p.press(2,'left');p.release(1);assert.equal(p.snapshot().left,true);p.release(2);assert.equal(p.snapshot().left,false);});
test('opposite touch and keyboard directions cancel',()=>{assert.deepEqual(movement({...emptyDirections(),left:true},{...emptyDirections(),right:true}),{x:0,y:0});});
