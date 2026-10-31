import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, applyAction, totalGold, publicState, expire, sentToday, receivedToday, activeOutgoing, validatePlan, scorePlans, dublinDay } from '../worker/game.mjs';
const NOW = Date.parse('2026-10-31T12:00:00Z');
let serial = 0;
const move = (s,actor,action,fields={},now=NOW) => applyAction(s,actor,{action,...fields},now,'game-'+(++serial),[0,0,3,4,5]);
function invite(s,from='jiet',to='dad',stake=100,now=NOW){return move(s,from,'invite',{to,stake},now).challengeId;}
function accept(s,id,actor='dad',now=NOW){return move(s,actor,'accept',{id},now);}
function lock(s,id,actor,plan=[2,2,2,3,3],now=NOW){return move(s,actor,'lock',{id,plan},now);}
test('reservation, acceptance and decisive payout conserve 7,000 gold',()=>{
 const s=initialState(NOW),id=invite(s);assert.equal(s.players.jiet.gold,900);assert.equal(totalGold(s),7000);
 accept(s,id);assert.equal(s.players.dad.gold,900);assert.equal(totalGold(s),7000);
 lock(s,id,'jiet');lock(s,id,'dad',[0,0,3,4,5]);
 assert.equal(s.players.jiet.gold,900);assert.equal(s.players.dad.gold,1100);assert.equal(totalGold(s),7000);
 assert.deepEqual([s.challenges[0].result.aScore,s.challenges[0].result.bScore],[3,12]);
 assert.throws(()=>lock(s,id,'dad'),/Accept the challenge/);assert.equal(totalGold(s),7000);
});
test('draw returns both stakes exactly',()=>{const s=initialState(NOW),id=invite(s);accept(s,id);lock(s,id,'jiet');lock(s,id,'dad');assert.equal(s.players.jiet.gold,1000);assert.equal(s.players.dad.gold,1000);assert.equal(s.challenges[0].result.winner,null);});
test('received matches do not consume the daily outgoing attack',()=>{
 const s=initialState(NOW);
 for(const from of ['dad','mom']){const id=invite(s,from,'jiet');accept(s,id,'jiet');}
 assert.equal(receivedToday(s,'jiet',NOW),2);assert.equal(sentToday(s,'jiet',NOW),0);
 const id=invite(s,'jiet','rong');accept(s,id,'rong');assert.equal(sentToday(s,'jiet',NOW),1);
 assert.equal(totalGold(s),7000);
});
test('incoming acceptances are unlimited and preserve the outgoing attack',()=>{
 const s=initialState(NOW);
 for(const from of ['dad','mom','hui','ying','yao']){const id=invite(s,from,'jiet',50);accept(s,id,'jiet');}
 assert.equal(receivedToday(s,'jiet',NOW),5);assert.equal(sentToday(s,'jiet',NOW),0);
 assert.doesNotThrow(()=>invite(s,'jiet','rong',100));
 assert.equal(totalGold(s),7000);
});
test('outgoing invite slot frees on decline/cancel/expiry; accepted daily attack stays spent',()=>{
 const s=initialState(NOW);let id=invite(s);assert.throws(()=>invite(s,'jiet','mom'),/outgoing challenge/);
 move(s,'dad','decline',{id});id=invite(s,'jiet','mom');move(s,'jiet','cancel',{id});
 id=invite(s);accept(s,id);lock(s,id,'jiet');lock(s,id,'dad');
 assert.equal(activeOutgoing(s,'jiet'),0);assert.throws(()=>invite(s,'jiet','mom'),/daily attack/);
 assert.doesNotThrow(()=>invite(s,'jiet','mom',100,NOW+86400000));
});
test('expiry refunds pending or accepted escrow only once',()=>{
 for(const accepted of [false,true]){const s=initialState(NOW),id=invite(s);if(accepted)accept(s,id);assert.equal(expire(s,NOW+86400000),true);assert.equal(expire(s,NOW+86400001),false);assert.equal(totalGold(s),7000);assert.equal(s.players.jiet.gold,1000);assert.equal(s.players.dad.gold,1000);if(accepted)assert.equal(sentToday(s,'jiet',NOW),1);}
});
test('secret plans are hidden from the opponent until both lock',()=>{
 const s=initialState(NOW),id=invite(s);accept(s,id);lock(s,id,'jiet',[0,0,3,4,5]);
 const dad=publicState(s,'dad',NOW).challenges[0];assert.equal(dad.myPlan,null);assert.equal(dad.plans,undefined);assert.equal(dad.result,undefined);assert.equal(dad.ready.jiet,true);
 assert.deepEqual(publicState(s,'jiet',NOW).challenges[0].myPlan,[0,0,3,4,5]);
 lock(s,id,'dad');assert.deepEqual(publicState(s,'dad',NOW).challenges[0].plans.jiet,[0,0,3,4,5]);
 assert.equal(publicState(s,'mom',NOW).challenges.length,0);
});
test('invalid plans and unauthorised actions are rejected',()=>{
 for(const p of [[6,0,0,3,3],[1,1,1,1,1],[2.5,2.5,2,2,3],[-1,3,3,3,4]])assert.throws(()=>validatePlan(p));
 const s=initialState(NOW),id=invite(s);assert.throws(()=>move(s,'mom','accept',{id}),/not found/);assert.throws(()=>lock(s,id,'jiet'),/Accept the challenge/);accept(s,id);lock(s,id,'jiet');assert.throws(()=>lock(s,id,'jiet'),/already locked/);assert.throws(()=>move(s,'jiet','cancel',{id}),/unanswered/);
});
test('custom stakes obey the smaller available balance and cannot be fractional',()=>{
 for(const stake of [0,-10,201,210,100.5]){const s=initialState(NOW);assert.throws(()=>invite(s,'jiet','dad',stake),/stake/);}
 const s=initialState(NOW);s.players.dad.gold=200;assert.throws(()=>invite(s,'jiet','dad',50),/stake/);assert.doesNotThrow(()=>invite(s,'jiet','dad',40));
});
test('free practice can be replayed without consuming quota or gold',()=>{
 const s=initialState(NOW);for(let i=0;i<6;i++){const id=move(s,'jiet','practice').challengeId;lock(s,id,'jiet');}
 assert.equal(totalGold(s),7000);assert.equal(sentToday(s,'jiet',NOW),0);assert.equal(receivedToday(s,'jiet',NOW),0);assert.equal(s.challenges.length,6);
});
test('Dublin date handles the October clock change',()=>{assert.equal(dublinDay(Date.parse('2026-10-24T23:30Z')),'2026-10-25');assert.equal(dublinDay(Date.parse('2026-10-25T23:30Z')),'2026-10-25');});
test('scoring is symmetric for 500 independently generated valid plan pairs',()=>{
 function plan(){const a=[0,0,0,0,0];for(let i=0;i<12;i++){const k=a.findIndex(n=>n<5);const valid=a.map((n,j)=>n<5?j:-1).filter(j=>j>=0);a[valid[(i*7+serial++)%valid.length]]++;}return a;}
 for(let i=0;i<500;i++){const a=plan(),b=plan(),ab=scorePlans(a,b),ba=scorePlans(b,a);assert.equal(ab.aScore,ba.bScore);assert.equal(ab.bScore,ba.aScore);}
});
