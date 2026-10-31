import test from 'node:test';
import assert from 'node:assert/strict';
import {duelSeason,duelStake,validDuelPlan,duelScores} from './duel.ts';
import {leaderboard} from './pirate.ts';
test('31 October is practice; 1 November opens official play; 8 November closes',()=>{assert.equal(duelSeason('2026-10-31'),'practice');assert.equal(duelSeason('2026-11-01'),'official');assert.equal(duelSeason('2026-11-07'),'official');assert.equal(duelSeason('2026-11-08'),'over');});
test('stakes use smaller available balance, rounded down to tens',()=>{assert.equal(duelStake(1000,400,20),80);assert.equal(duelStake(950,1000,5),40);assert.equal(duelStake(20,1000,20),0);});
test('plans allow any nonnegative integer split of twelve across five islands',()=>{
 for(const x of [[0,0,3,4,5],[6,0,0,3,3],[0,0,0,0,12],[0,0,0,6,6]])assert.equal(validDuelPlan(x),true);
 for(const x of [[5,5,2,0],[13,0,0,0,0],[-1,1,0,0,12],[2,2,2,2,2],[2.5,2.5,2,2,3],[NaN,0,0,0,12]])assert.equal(validDuelPlan(x),false);
 assert.deepEqual(duelScores([0,0,0,0,12],[3,3,3,3,0]),[5,10]);
});
test('sacrificing small islands can win; a tied island awards neither side',()=>{assert.deepEqual(duelScores([0,0,3,4,5],[2,2,2,3,3]),[12,3]);assert.deepEqual(duelScores([2,2,2,3,3],[2,2,2,3,3]),[0,0]);});
test('reserved gold remains in the wealth ranking',()=>{const row={id:'dad',gold:800,duel_reserved:200,shields:0,mirror:false,spins:0,boom_pending:false,boomed_day:null,day:'2026-11-01',season:'trip'};assert.equal(leaderboard(['dad'],[row],'trip')[0].gold,1000);});
