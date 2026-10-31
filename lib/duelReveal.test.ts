import test from 'node:test';
import assert from 'node:assert/strict';
import {initialReveal,revealReducer} from './duelReveal.ts';
test('automatic reveal visits all five rounds then stops at the final result',()=>{let s=initialReveal;const rounds=[];for(let n=0;n<15;n++){if(s.phase==='intro')rounds.push(s.round);s=revealReducer(s,{type:'tick',round:s.round,phase:s.phase});}assert.deepEqual(rounds,[0,1,2,3,4]);assert.deepEqual(s,{round:4,phase:'final'});});
test('a stale animation timer cannot skip another round after Next',()=>{const first=initialReveal,next=revealReducer(first,{type:'next'});assert.deepEqual(revealReducer(next,{type:'tick',round:first.round,phase:first.phase}),next);});
test('Skip to result is final even if old timers or rapid next events arrive',()=>{let s=revealReducer(initialReveal,{type:'skip'});for(let i=0;i<10;i++){s=revealReducer(s,{type:'next'});s=revealReducer(s,{type:'tick',round:0,phase:'intro'});}assert.deepEqual(s,{round:4,phase:'final'});});
test('five immediate Next presses finish without exceeding island five',()=>{let s=initialReveal;for(let i=0;i<5;i++)s=revealReducer(s,{type:'next'});assert.deepEqual(s,{round:4,phase:'final'});});
test('reduced-motion reveal can display the current result without firing',()=>{assert.deepEqual(revealReducer(initialReveal,{type:'reduce'}),{round:0,phase:'result'});});
