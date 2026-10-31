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

await clean();
await db.exec(await readFile(new URL('../supabase/migrations/20261031134319_forced_duels.sql',import.meta.url),'utf8'));
await db.exec(await readFile(new URL('../supabase/migrations/20261031184626_uncapped_duel_shots.sql',import.meta.url),'utf8'));
await db.exec('alter table public.pirate_players add column shields integer default 3');
async function launch(a='jiet',b='dad',stake=100,at=OFFICIAL,plan=[0,0,3,4,5],key=randomUUID(),practice=false){return rpc(a,'launch',{target:b,stake,plan,practice},at,key);}
async function advance(at){return (await db.query('select duel_private.tick($1::timestamptz) as n',[at])).rows[0].n;}
await check('forced launch reserves both stakes immediately and consumes only the attacker allowance',async()=>{
 const r=await launch();const c=r.matches.find(c=>c.id===r.selected);assert.equal(c.status,'accepted');assert.equal(c.forced,true);assert.equal(c.aReady,true);assert.equal(c.bReady,false);assert.equal(c.aPlan,null);assert.equal(c.bPlan,null);assert.equal(r.used,true);assert.equal(r.players.find(p=>p.id==='jiet').gold,900);assert.equal(r.players.find(p=>p.id==='dad').gold,900);assert.equal((await rpc('dad')).used,false);
 for(const action of ['decline','cancel'])await assert.rejects(()=>rpc(action==='decline'?'dad':'jiet',action,{id:c.id}),/attack_started/);
});
await check('no launch without a valid complete attacker plan, and no empty-wallet minting',async()=>{
 for(const plan of [[],[5,5,2,null,null],[1,1,1,1,1],[2.5,2.5,2,2,3]])await assert.rejects(()=>launch('jiet','dad',100,OFFICIAL,plan),/invalid_plan/);
 await db.exec("delete from public.pirate_players where id='dad'");await assert.rejects(()=>launch(),/choose_player/);await db.exec("insert into public.pirate_players(id) values('dad')");
 assert.equal((await db.query('select sum(duel_reserved)::int as held from public.pirate_players')).rows[0].held,0);
});
await check('launch retries reserve only once and cannot steal a reused request key',async()=>{
 const key=randomUUID(),r=await launch('jiet','dad',100,OFFICIAL,[0,0,3,4,5],key);await launch('jiet','dad',100,OFFICIAL,[0,0,3,4,5],key);
 assert.equal((await rpc('jiet')).matches.length,1);assert.equal((await rpc('jiet')).players.find(p=>p.id==='jiet').gold,900);
 await assert.rejects(()=>launch('mom','dad',100,OFFICIAL,[0,0,3,4,5],key),/request_key_conflict/);
 await rpc('dad','lock',{id:r.selected,plan:[2,2,2,3,3]});await assert.rejects(()=>launch('jiet','mom'),/daily_attack_used/);
});
await check('24-hour server timer saves one random defence and settles exactly once while nobody opens the app',async()=>{
 const r=await launch();assert.equal(await advance('2026-11-02T11:59:59Z'),0);assert.equal(await advance('2026-11-02T12:00:00Z'),1);
 let s=await rpc('jiet','state',{},'2026-11-02T12:01:00Z'),m=s.matches.find(m=>m.id===r.selected);const saved=JSON.stringify(m.bPlan);
 assert.equal(m.status,'complete');assert.equal(m.autoDefended,true);assert.equal(m.bPlan.length,5);assert.equal(m.bPlan.reduce((a,b)=>a+b,0),12);assert.equal(m.bPlan.every(n=>Number.isInteger(n)&&n>=0&&n<=12),true);
 assert.equal(await advance('2026-11-02T12:02:00Z'),0);s=await rpc('jiet','state',{},'2026-11-02T12:03:00Z');assert.equal(JSON.stringify(s.matches.find(m=>m.id===r.selected).bPlan),saved);
 assert.equal((await db.query('select count(*)::int as n from public.pirate_events')).rows[0].n,1);
 assert.equal((await db.query('select bool_and(shields=3) as same from public.pirate_players')).rows[0].same,true);
});
await check('manual defence before the deadline wins normally without an automatic flag',async()=>{
 const r=await launch('jiet','dad',100,OFFICIAL,[2,2,2,3,3]);const s=await rpc('dad','lock',{id:r.selected,plan:[0,0,3,4,5]},'2026-11-02T11:59:59Z');const m=s.matches.find(m=>m.id===r.selected);
 assert.equal(m.winner,'dad');assert.equal(m.autoDefended,false);assert.equal(s.players.find(p=>p.id==='dad').gold,1100);
});
await check('a late defence returns the saved automatic result rather than replacing it',async()=>{
 const r=await launch();const s=await rpc('dad','lock',{id:r.selected,plan:[0,0,0,0,0]},'2026-11-02T12:00:01Z');const m=s.matches.find(m=>m.id===r.selected);
 assert.equal(m.status,'complete');assert.equal(m.autoDefended,true);assert.equal(m.bPlan.reduce((a,b)=>a+b,0),12);assert.equal((await db.query('select count(*)::int as n from public.pirate_events')).rows[0].n,1);
});
await check('several attackers may target one captain without consuming that captain’s own attack',async()=>{
 for(const a of ['dad','mom','rong','hui','yao','ying'])await launch(a,'jiet',50);
 const before=await rpc('jiet');assert.equal(before.matches.filter(m=>m.status==='accepted').length,6);assert.equal(before.used,false);
 await assert.doesNotReject(()=>launch('jiet','dad',50));assert.equal((await rpc('jiet')).used,true);
});
await check('a new Dublin day grants an attack even while yesterday’s attack awaits its full 24-hour deadline',async()=>{
 await launch('jiet','dad',100,'2026-11-01T18:00:00Z');
 const r=await launch('jiet','mom',100,'2026-11-02T08:00:00Z');assert.equal(r.matches.filter(m=>m.status==='accepted').length,2);assert.equal(r.used,true);
 await assert.rejects(()=>launch('jiet','hui',100,'2026-11-02T09:00:00Z'),/daily_attack_used/);
});
await check('random plans are valid, varied and independent of the attacking plan',async()=>{
 const plans=[];for(let i=0;i<30;i++){const p=(await db.query('select duel_private.random_plan() as plan')).rows[0].plan;assert.equal(p.length,5);assert.equal(p.reduce((a,b)=>a+b,0),12);assert.equal(p.every(n=>n>=0&&n<=12),true);plans.push(JSON.stringify(p));}
 assert.ok(new Set(plans).size>1);
});
await check('automatic defence can win; the server never awards a default win to the attacker',async()=>{
 let seed=0,expected;const a=[5,5,2,0,0];
 for(let i=1;i<=100;i++){seed=i/101;await db.query('select setseed($1)',[seed]);const b=(await db.query('select duel_private.random_plan() as plan')).rows[0].plan;let sa=0,sb=0;for(let j=0;j<5;j++){if(a[j]>b[j])sa+=j+1;else if(b[j]>a[j])sb+=j+1;}if(sb>sa){expected=b;break;}}
 assert.ok(expected);const r=await launch('jiet','dad',100,OFFICIAL,a);await db.query('select setseed($1)',[seed]);await advance('2026-11-02T12:00:00Z');const m=(await rpc('jiet','state',{},'2026-11-02T12:01:00Z')).matches.find(m=>m.id===r.selected);assert.deepEqual(m.bPlan,expected);assert.equal(m.winner,'dad');
});
await check('practice remains free and expires at official midnight without becoming a paid attack',async()=>{
 const r=await launch('jiet','dad',200,PRACTICE);assert.equal(r.players.every(p=>p.gold===1000),true);
 await advance('2026-11-01T00:00:00Z');const s=await rpc('jiet');assert.equal(s.matches.find(m=>m.id===r.selected).status,'expired');assert.equal(s.used,false);assert.equal(s.players.every(p=>p.reserved===0),true);
});
await check('free bot practice works even while a human practice or official attack is waiting',async()=>{
 await launch('jiet','dad',100,PRACTICE);for(let i=0;i<3;i++){const r=await launch('jiet','bot',0,PRACTICE,[0,0,3,4,5],randomUUID(),true);assert.equal(r.matches.find(m=>m.id===r.selected).status,'complete');}assert.equal(await total(),7000);
});
await check('active incoming defences stay visible after more than eighty practice results',async()=>{
 const r=await launch('dad','jiet');await db.exec(`insert into duel_private.matches(a,b,stake,practice,status,created_at,expires_at,a_plan,b_plan,a_score,b_score,forced)
 select 'jiet','bot',0,true,'complete',timestamptz '2026-11-01 12:00Z'+n*interval '1 second',timestamptz '2026-11-02 12:00Z',array[0,0,3,4,5],array[0,0,3,4,5],0,0,true from generate_series(1,90) n`);
 const s=await rpc('jiet');assert.equal(s.matches.length,80);assert.equal(s.matches[0].id,r.selected);
});
await check('existing optional invitations retain their original acceptance/refund flow',async()=>{
 const r=(await db.query('select duel_private.run_v1($1,$2,$3::jsonb,$4::uuid,$5::timestamptz) as s',['jiet','invite',JSON.stringify({target:'dad',stake:100}),randomUUID(),OFFICIAL])).rows[0].s;
 await rpc('dad','decline',{id:r.selected});assert.equal((await rpc('jiet')).players.every(p=>p.gold===1000),true);
});
await check('the season ending earlier than 24 hours refunds instead of forcing an early defence',async()=>{
 const r=await launch('jiet','dad',100,'2026-11-07T23:50:00Z');await advance('2026-11-08T00:00:00Z');const s=await rpc('jiet','state',{},'2026-11-08T00:00:00Z');const m=s.matches.find(m=>m.id===r.selected);assert.equal(m.status,'expired');assert.equal(m.autoDefended,false);assert.equal(s.players.every(p=>p.gold===1000&&p.reserved===0),true);
});
await check('new internal random and settlement helpers are inaccessible to anonymous clients',async()=>{
 for(const signature of ['duel_private.random_plan()','duel_private.tick(timestamptz)','duel_private.settle(uuid,timestamptz)','duel_private.plan(jsonb)','duel_private.project(text,timestamptz)']){const r=await db.query("select has_function_privilege('anon',$1,'execute') as allowed",[signature]);assert.equal(r.rows[0].allowed,false);}
});
await check('uncapped launch and defence score and pay once, with all twelve allowed on any island',async()=>{
 const r=await launch('jiet','dad',100,OFFICIAL,[0,0,0,0,12]);
 const key=randomUUID();const s=await rpc('dad','lock',{id:r.selected,plan:[3,3,3,3,0]},OFFICIAL,key);
 const m=s.matches.find(m=>m.id===r.selected);assert.deepEqual(m.aPlan,[0,0,0,0,12]);assert.equal(m.aScore,5);assert.equal(m.bScore,10);assert.equal(m.winner,'dad');
 await rpc('dad','lock',{id:r.selected,plan:[3,3,3,3,0]},OFFICIAL,key);assert.equal((await rpc('dad')).players.find(p=>p.id==='dad').gold,1100);
 for(let i=0;i<5;i++){const plan=[0,0,0,0,0];plan[i]=12;assert.deepEqual((await db.query('select duel_private.plan($1::jsonb) as plan',[JSON.stringify(plan)])).rows[0].plan,plan);}
});
await check('uncapped validation still rejects negatives, fractions, nulls, huge entries and wrong totals',async()=>{
 for(const plan of [[13,0,0,0,0],[-1,1,0,0,12],[6,6,0,0,1],[6,5,0,0,0],[12,null,0,0,0],[11.5,0.5,0,0,0],[99999999999999,0,0,0,0]])await assert.rejects(()=>launch('jiet','dad',100,OFFICIAL,plan),/invalid_plan/);
});
await check('legacy invitations can also lock more than five shots after upgrade',async()=>{
 const r=(await db.query('select duel_private.run_v1($1,$2,$3::jsonb,$4::uuid,$5::timestamptz) as s',['jiet','invite',JSON.stringify({target:'dad',stake:100}),randomUUID(),OFFICIAL])).rows[0].s;
 await rpc('dad','accept',{id:r.selected});await rpc('jiet','lock',{id:r.selected,plan:[0,0,0,0,12]});
 const s=await rpc('dad','lock',{id:r.selected,plan:[3,3,3,3,0]});assert.equal(s.matches.find(m=>m.id===r.selected).winner,'dad');
});
await check('bot and saved automatic defence use the expanded plan space',async()=>{
 await db.query('select setseed(0.25)');let expanded=false;
 for(let i=0;i<50;i++){const p=(await db.query('select duel_private.random_plan() as plan')).rows[0].plan;assert.equal(p.reduce((a,b)=>a+b,0),12);if(p.some(n=>n>5))expanded=true;}
 assert.equal(expanded,true);
 const r=await launch('jiet','bot',0,PRACTICE,[12,0,0,0,0],randomUUID(),true);assert.equal(r.matches.find(m=>m.id===r.selected).status,'complete');
});
console.log(passed+' total PostgreSQL integration checks passed. No live database was used.');
await db.close();
