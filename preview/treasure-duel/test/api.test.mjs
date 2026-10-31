import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
import { database } from '../scripts/sqlite-adapter.mjs';
function fixture(){const DB=database();let serial=0;return {DB,async get(actor='jiet'){return (await worker.fetch(new Request('https://demo.test/api/state?actor='+actor),{DB})).json();},async action(actor,action,fields={},key='key-'+(++serial)+'-request'){const res=await worker.fetch(new Request('https://demo.test/api/action',{method:'POST',headers:{origin:'https://demo.test','content-type':'application/json'},body:JSON.stringify({actor,action,...fields,key})}),{DB});return {status:res.status,data:await res.json()};}};}
test('retries and concurrent duplicate invites reserve gold just once',async()=>{
 const f=fixture();const results=await Promise.all([f.action('jiet','invite',{to:'dad',stake:100},'same-request-key'),f.action('jiet','invite',{to:'dad',stake:100},'same-request-key')]);
 assert.ok(results.every(x=>x.status===200));const s=await f.get();assert.equal(s.players.find(p=>p.id==='jiet').available,900);assert.equal(s.challenges.length,1);
 const collision=await f.action('mom','invite',{to:'dad',stake:100},'same-request-key');assert.equal(collision.status,409);
});
test('concurrent acceptance and locking settle once, hide plans, and survive reload',async()=>{
 const f=fixture(),invite=await f.action('jiet','invite',{to:'dad',stake:100}),id=invite.data.challengeId;
 const accepts=await Promise.all([f.action('dad','accept',{id},'accept-duplicate'),f.action('dad','accept',{id},'accept-duplicate')]);assert.ok(accepts.every(x=>x.status===200));
 await f.action('jiet','lock',{id,plan:[0,0,3,4,5]});const before=await f.get('dad');assert.equal(before.challenges[0].plans,undefined);assert.equal(before.challenges[0].myPlan,null);
 const locks=await Promise.all([f.action('dad','lock',{id,plan:[2,2,2,3,3]},'lock-duplicate-key'),f.action('dad','lock',{id,plan:[2,2,2,3,3]},'lock-duplicate-key')]);assert.ok(locks.every(x=>x.status===200));
 const after=await f.get('jiet');assert.equal(after.players.find(p=>p.id==='jiet').available,1100);assert.equal(after.players.find(p=>p.id==='dad').available,900);assert.equal(after.players.reduce((n,p)=>n+p.total,0),7000);assert.equal(after.challenges[0].status,'complete');
});
test('concurrent incoming acceptances remain unlimited and preserve own attack',async()=>{
 const f=fixture(),invitations=[];for(const actor of ['dad','mom','hui']){invitations.push((await f.action(actor,'invite',{to:'jiet',stake:50})).data.challengeId);}
 const accepts=await Promise.all(invitations.map(id=>f.action('jiet','accept',{id})));
 assert.equal(accepts.filter(x=>x.status===200).length,3);
 const outgoing=await f.action('jiet','invite',{to:'rong',stake:100});assert.equal(outgoing.status,200);const s=await f.get();assert.equal(s.players.find(p=>p.id==='jiet').active,4);assert.equal(s.players.reduce((n,p)=>n+p.total,0),7000);
});
test('same-origin API rejects cross-origin writes and unsupported methods',async()=>{const f=fixture();const cross=await worker.fetch(new Request('https://demo.test/api/action',{method:'POST',headers:{origin:'https://evil.test'},body:'{}'}),{DB:f.DB});assert.equal(cross.status,403);const method=await worker.fetch(new Request('https://demo.test/api/action'),{DB:f.DB});assert.equal(method.status,405);const page=await worker.fetch(new Request('https://demo.test/'),{DB:f.DB});assert.equal(page.status,200);assert.match(await page.text(),/Outsmart the crew/);});
