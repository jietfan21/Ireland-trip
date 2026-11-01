import test from 'node:test';import assert from 'node:assert/strict';import {validPkShot} from './pk.ts';
test('PK spends only its remaining budget, keeps no per-island cap, and uses the rest in round five',()=>{
 for(const v of [[0,12,1],[12,12,1],[6,8,3],[0,0,4],[8,8,5]])assert.equal(validPkShot(...v as [number,number,number]),true);
 for(const v of [[13,12,1],[-1,12,1],[1.5,12,1],[5,4,2],[7,8,5],[0,12,5],[0,12,0],[0,12,6],[NaN,12,1]])assert.equal(validPkShot(...v as [number,number,number]),false);
});
