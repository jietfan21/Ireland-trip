import test from 'node:test';import assert from 'node:assert/strict';import {validPkShot,pkRoundPoints,pkScoreAt} from './pk.ts';
test('PK spends only its remaining budget, keeps no per-island cap, and uses the rest in round five',()=>{
 for(const v of [[0,12,1],[12,12,1],[6,8,3],[0,0,4],[8,8,5]])assert.equal(validPkShot(...v as [number,number,number]),true);
 for(const v of [[13,12,1],[-1,12,1],[1.5,12,1],[5,4,2],[7,8,5],[0,12,5],[0,12,0],[0,12,6],[NaN,12,1]])assert.equal(validPkShot(...v as [number,number,number]),false);
});

test('round history distinguishes awarded points from shot counts and gives ties zero',()=>{
 assert.deepEqual(pkRoundPoints({n:3,a:1,b:7}),[0,3]);
 assert.deepEqual(pkRoundPoints({n:4,a:9,b:2}),[4,0]);
 assert.deepEqual(pkRoundPoints({n:5,a:3,b:3}),[0,0]);
});
test('replaying a round never reveals scores from later completed rounds',()=>{
 const rounds=[{n:1,a:6,b:1,autoA:false,autoB:false},{n:2,a:0,b:8,autoA:false,autoB:false},{n:3,a:0,b:0,autoA:false,autoB:false},{n:4,a:0,b:1,autoA:false,autoB:false},{n:5,a:6,b:2,autoA:false,autoB:false}];
 assert.deepEqual(pkScoreAt(rounds,0),[0,0]);assert.deepEqual(pkScoreAt(rounds,1),[1,0]);assert.deepEqual(pkScoreAt(rounds,2),[1,2]);assert.deepEqual(pkScoreAt(rounds,3),[1,2]);assert.deepEqual(pkScoreAt(rounds,5),[6,6]);
});
