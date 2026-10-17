import test from 'node:test';
import assert from 'node:assert/strict';
import {findPath} from '../src/systems/pathfinding.ts';
test('tap destination creates a walkable route around walls',()=>{const grid=[[true,false,true],[true,false,true],[true,true,true]];const path=findPath(grid,{x:0,y:0},{x:2,y:0});assert.equal(path.length,6);let previous={x:0,y:0};for(const cell of path){assert.ok(grid[cell.y][cell.x]);assert.equal(Math.abs(cell.x-previous.x)+Math.abs(cell.y-previous.y),1);previous=cell;}assert.deepEqual(previous,{x:2,y:0});});
test('blocked destination, out of bounds and inaccessible island rejected',()=>{const grid=[[true,false],[false,true]];assert.equal(findPath(grid,{x:0,y:0},{x:1,y:0}),null);assert.equal(findPath(grid,{x:0,y:0},{x:-1,y:0}),null);assert.equal(findPath(grid,{x:0,y:0},{x:1,y:1}),null);});
test('same tile tap produces no movement',()=>{assert.deepEqual(findPath([[true]],{x:0,y:0},{x:0,y:0}),[]);});
test('empty map is safe',()=>{assert.equal(findPath([],{x:0,y:0},{x:0,y:0}),null);});
