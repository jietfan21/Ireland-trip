import test from 'node:test';
import assert from 'node:assert/strict';
import {duelSeason,duelStake,validDuelPlan,duelScores} from './duel.ts';
import {leaderboard} from './pirate.ts';
test('31 October is practice; 1 November opens official play; 8 November closes',()=>{assert.equal(duelSeason('2026-10-31'),'practice');assert.equal(duelSeason('2026-11-01'),'official');assert.equal(duelSeason('2026-11-07'),'official');assert.equal(duelSeason('2026-11-08'),'over');});
test('stakes use smaller available balance, rounded down to tens',()=>{assert.equal(duelStake(1000,400,20),80);assert.equal(duelStake(950,1000,5),40);assert.equal(duelStake(20,1000,20),0);});
test('plans require five integers, no more than five per island, and twelve total',()=>{assert.equal(validDuelPlan([0,0,3,4,5]),true);for(const x of [[5,5,2,0],[6,0,0,3,3],[2,2,2,2,2],[2.5,2.5,2,2,3]])assert.equal(validDuelPlan(x),false);});
test('sacrificing small islands can win; a tied island awards neither side',()=>{assert.deepEqual(duelScores([0,0,3,4,5],[2,2,2,3,3]),[12,3]);assert.deepEqual(duelScores([2,2,2,3,3],[2,2,2,3,3]),[0,0]);});
test('reserved gold remains in the wealth ranking',()=>{const row={id:'dad',gold:800,duel_reserved:200,shields:0,mirror:false,spins:0,boom_pending:false,boomed_day:null,day:'2026-11-01',season:'trip'};assert.equal(leaderboard(['dad'],[row],'trip')[0].gold,1000);});
