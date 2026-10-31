// Real PostgreSQL semantics in an isolated WASM database, never the live project.
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;
create table public.pirate_players(id text primary key,gold integer not null default 1000);
create table public.pirate_events(season text,day text,actor text,kind text,target text,amount integer,turn_key text unique);
insert into public.pirate_players(id) values ('dad'),('mom'),('jiet'),('hui'),('rong'),('yao'),('ying');`);
await db.exec(await readFile(new URL('../supabase/migrations/20261031122859_treasure_duel.sql',import.meta.url),'utf8'));
const OFFICIAL='2026-11-01T12:00:00Z',PRACTICE='2026-10-31T12:00:00Z';
async function rpc(actor,action='state',payload={},at=OFFICIAL,key=randomUUID()){
 const r=await db.query('select duel_private.run($1,$2,$3::jsonb,$4::uuid,$5::timestamptz) as value',[actor,action,JSON.stringify(payload),key,at]);return r.rows[0].value;
}
async function clean(){await db.exec('truncate duel_private.matches,duel_private.requests,public.pirate_events;update public.pirate_players set gold=1000,duel_reserved=0');}
async function total(){return Number((await db.query('select sum(gold+duel_reserved) as total from public.pirate_players')).rows[0].total);}
async function invite(a='jiet',b='dad',stake=100,at=OFFICIAL){return (await rpc(a,'invite',{target:b,stake},at)).selected;}
async function battle(a='jiet',b='dad',aPlan=[0,0,3,4,5],bPlan=[2,2,2,3,3]){const id=await invite(a,b);await rpc(b,'accept',{id});await rpc(a,'lock',{id,plan:aPlan});await rpc(b,'lock',{id,plan:bPlan});return id;}
let passed=0;
async function check(label,run){await clean();await run();assert.equal(await total(),7000,'gold conserved');console.log('✓ '+label);passed++;}
await check('practice on 31 October never touches gold; official starts 1 November',async()=>{
 assert.equal((await rpc('jiet','state',{},PRACTICE)).practice,true);
 const id=await invite('jiet','dad',200,PRACTICE);await rpc('dad','accept',{id},PRACTICE);await rpc('jiet','lock',{id,plan:[0,0,3,4,5]},PRACTICE);await rpc('dad','lock',{id,plan:[2,2,2,3,3]},PRACTICE);
 assert.equal((await rpc('jiet','state',{},PRACTICE)).players.find(p=>p.id==='jiet').gold,1000);
 assert.equal((await rpc('jiet')).practice,false);assert.equal((await rpc('jiet')).used,false);
});
await check('one-time escrow, nonce replay, secret plans and winner payout',async()=>{
 const key=randomUUID(),payload={target:'dad',stake:100};const first=await rpc('jiet','invite',payload,OFFICIAL,key);await rpc('jiet','invite',payload,OFFICIAL,key);
 assert.equal(first.players.find(p=>p.id==='jiet').gold,900);const id=first.selected;await rpc('dad','accept',{id});
 await rpc('jiet','lock',{id,plan:[0,0,3,4,5]});let s=await rpc('dad');assert.equal(s.matches[0].aPlan,null);assert.equal(s.matches[0].aReady,true);
 const lockKey=randomUUID();await rpc('dad','lock',{id,plan:[2,2,2,3,3]},OFFICIAL,lockKey);s=await rpc('dad','lock',{id,plan:[2,2,2,3,3]},OFFICIAL,lockKey);
 assert.equal(s.matches[0].aScore,12);assert.equal(s.matches[0].bScore,3);assert.equal(s.players.find(p=>p.id==='jiet').gold,1100);assert.equal(s.players.find(p=>p.id==='dad').gold,900);
 assert.equal((await db.query('select count(*)::int as n from public.pirate_events')).rows[0].n,1);
 await assert.rejects(()=>rpc('mom','invite',{target:'dad',stake:100},OFFICIAL,key),/request_key_conflict/);
});
await check('six incoming acceptances cannot consume or block own attack, including a counter-invite',async()=>{
 for(const sender of ['dad','mom','rong','hui','yao','ying']){const id=await invite(sender,'jiet',50);await rpc('jiet','accept',{id});}
 assert.equal((await rpc('jiet')).used,false);const id=await invite('jiet','dad',50);await rpc('dad','accept',{id});assert.equal((await rpc('jiet')).used,true);
});
await check('accepted daily attack cannot repeat after completion; next day opens again',async()=>{
 await battle();await assert.rejects(()=>invite('jiet','mom'),/daily_attack_used/);
 await assert.doesNotReject(()=>invite('jiet','mom',100,'2026-11-02T12:00:00Z'));
});
await check('decline and cancellation refund reservations without using daily attack',async()=>{
 let id=await invite();await rpc('dad','decline',{id});assert.equal((await rpc('jiet')).used,false);
 id=await invite('jiet','mom');await rpc('jiet','cancel',{id});assert.equal((await rpc('jiet')).players.find(p=>p.id==='jiet').gold,1000);
});
await check('pending and half-submitted accepted duels expire and refund exactly once',async()=>{
 const id=await invite();await rpc('dad','accept',{id});await rpc('jiet','lock',{id,plan:[0,0,3,4,5]});
 const pending=await invite('mom','hui');let s=await rpc('jiet','state',{},'2026-11-02T13:00:00Z');assert.equal(s.players.every(p=>p.gold===1000&&p.reserved===0),true);
 await rpc('jiet','state',{},'2026-11-02T14:00:00Z');assert.equal(await total(),7000);
});
await check('practice invitations end at official midnight rather than becoming gold matches',async()=>{
 await invite('jiet','dad',200,PRACTICE);const s=await rpc('jiet','state',{},'2026-11-01T00:00:00Z');assert.equal(s.matches[0].status,'expired');assert.equal(s.used,false);assert.equal(s.practice,false);
});
await check('stake limits and invalid/null/fractional plans are checked on server',async()=>{
 for(const stake of [0,-10,210,101])await assert.rejects(()=>invite('jiet','dad',stake),/stake_changed/);
 const id=await invite();await rpc('dad','accept',{id});
 for(const plan of [[5,5,2,null,null],[2.5,2.5,2,2,3],[6,0,0,3,3],[1,1,1,1,1],[]])await assert.rejects(()=>rpc('jiet','lock',{id,plan}),/invalid_plan/);
 await assert.rejects(()=>rpc('mom','lock',{id,plan:[0,0,3,4,5]}),/not_found/);
});
await check('draws refund both stakes; bot practice remains unlimited',async()=>{
 await battle('jiet','dad',[2,2,2,3,3],[2,2,2,3,3]);assert.equal((await rpc('jiet')).players.every(p=>p.gold===1000),true);
 for(let i=0;i<4;i++){const id=(await rpc('jiet','invite',{target:'bot',practice:true})).selected;await rpc('jiet','lock',{id,plan:[2,2,2,3,3]});}
});
await check('private allocations and internal clock cannot be called by anon',async()=>{
 const r=await db.query("select has_schema_privilege('anon','duel_private','USAGE') as schema_access,has_function_privilege('anon','duel_private.run(text,text,jsonb,uuid,timestamptz)','EXECUTE') as internal_call");assert.equal(r.rows[0].schema_access,false);assert.equal(r.rows[0].internal_call,false);
});
await check('final-day deadline releases holds at season end',async()=>{
 const id=await invite('jiet','dad',100,'2026-11-07T23:50:00Z');await rpc('dad','accept',{id},'2026-11-07T23:55:00Z');const s=await rpc('jiet','state',{},'2026-11-08T00:00:00Z');assert.equal(s.ended,true);assert.equal(s.matches[0].status,'expired');await assert.rejects(()=>invite('jiet','mom',100,'2026-11-08T00:00:01Z'),/game_over/);
});
console.log(passed+' PostgreSQL integration checks passed. No live database was used.');
await db.close();
