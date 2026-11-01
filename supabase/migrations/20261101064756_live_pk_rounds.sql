-- Live PK: secret choices, one round at a time, 24 hours per round.
-- Existing gold, reservations and legacy duels are preserved.
create table duel_private.pk_matches (
 id uuid primary key default gen_random_uuid(),
 a text not null references public.pirate_players(id), b text not null,
 stake integer not null check(stake>=0), practice boolean not null,
 status text not null check(status in('pending','lobby','active','complete','cancelled','expired')),
 created_at timestamptz not null, expires_at timestamptz not null,
 accepted_day date, ready_a boolean not null default false, ready_b boolean not null default false,
 round_no integer not null default 1 check(round_no between 1 and 5),
 remaining_a integer not null default 12 check(remaining_a between 0 and 12),
 remaining_b integer not null default 12 check(remaining_b between 0 and 12),
 a_score integer not null default 0, b_score integer not null default 0,
 winner text, finished_at timestamptz, check(a<>b),check(practice or stake>=10)
);
create index pk_a_day on duel_private.pk_matches(a,accepted_day);
create index pk_b_open on duel_private.pk_matches(b,status);
create index pk_deadlines on duel_private.pk_matches(status,expires_at);
create table duel_private.pk_rounds (
 match_id uuid references duel_private.pk_matches(id) on delete cascade,
 n integer check(n between 1 and 5), a_shot integer check(a_shot between 0 and 12),
 b_shot integer check(b_shot between 0 and 12),
 auto_a boolean not null default false, auto_b boolean not null default false,
 revealed_at timestamptz, primary key(match_id,n)
);
create table duel_private.pk_requests(key uuid primary key,actor text not null,signature text not null,match_id uuid);
alter table duel_private.pk_matches enable row level security;
alter table duel_private.pk_rounds enable row level security;
alter table duel_private.pk_requests enable row level security;
revoke all on duel_private.pk_matches,duel_private.pk_rounds,duel_private.pk_requests from public,anon,authenticated;

create function duel_private.pk_random_shot(budget integer,n integer) returns integer
language sql volatile set search_path='' as $$
 select case when n=5 then budget else floor(random()*(budget+1))::integer end;
$$;
create function duel_private.pk_open(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare q duel_private.pk_matches;
begin
 select * into strict q from duel_private.pk_matches where id=p_id;
 insert into duel_private.pk_rounds(match_id,n,b_shot)
 values(q.id,q.round_no,case when q.b='bot' then duel_private.pk_random_shot(q.remaining_b,q.round_no) else null end);
end $$;
create function duel_private.pk_resolve(p_id uuid,p_now timestamptz) returns void
language plpgsql security definer set search_path='' as $$
declare q duel_private.pk_matches;r duel_private.pk_rounds;sa integer;sb integer;victor text;
begin
 select * into q from duel_private.pk_matches where id=p_id for update;
 if not found or q.status<>'active' then return; end if;
 select * into strict r from duel_private.pk_rounds where match_id=q.id and n=q.round_no for update;
 if r.revealed_at is not null or r.a_shot is null or r.b_shot is null then return; end if;
 if r.a_shot>q.remaining_a or r.b_shot>q.remaining_b then raise exception 'invalid_shot';end if;
 sa:=q.a_score+case when r.a_shot>r.b_shot then q.round_no else 0 end;
 sb:=q.b_score+case when r.b_shot>r.a_shot then q.round_no else 0 end;
 update duel_private.pk_rounds set revealed_at=p_now where match_id=q.id and n=q.round_no;
 update duel_private.pk_matches set remaining_a=remaining_a-r.a_shot,remaining_b=remaining_b-r.b_shot,a_score=sa,b_score=sb where id=q.id;
 if q.round_no=5 then
  victor:=case when sa>sb then q.a when sb>sa then q.b else null end;
  if not q.practice then
   update public.pirate_players set duel_reserved=duel_reserved-q.stake,
    gold=gold+case when victor is null then q.stake when id=victor then q.stake*2 else 0 end where id in(q.a,q.b);
   insert into public.pirate_events(season,day,actor,kind,target,amount,turn_key)
    values('trip',(p_now at time zone 'Europe/Dublin')::date::text,q.a,'duel',q.b,
      case when victor=q.a then q.stake when victor=q.b then -q.stake else 0 end,'pk:'||q.id);
  end if;
  update duel_private.pk_matches set status='complete',winner=victor,finished_at=p_now where id=q.id;
 else
  update duel_private.pk_matches set round_no=round_no+1,expires_at=p_now+interval '24 hours' where id=q.id;
  perform duel_private.pk_open(q.id);
 end if;
end $$;
create function duel_private.pk_tick(p_now timestamptz) returns integer
language plpgsql security definer set search_path='' as $$
declare q duel_private.pk_matches;handled integer:=0;
begin
 perform pg_advisory_xact_lock(20261101,12);
 perform id from public.pirate_players order by id for update;
 for q in select * from duel_private.pk_matches where status in('pending','lobby','active') and expires_at<=p_now order by id for update loop
  if q.status in('pending','lobby') then
   update duel_private.pk_matches set status='expired',finished_at=p_now where id=q.id;
  else
   update duel_private.pk_rounds set
    auto_a=auto_a or a_shot is null,auto_b=auto_b or b_shot is null,
    a_shot=coalesce(a_shot,duel_private.pk_random_shot(q.remaining_a,q.round_no)),
    b_shot=coalesce(b_shot,duel_private.pk_random_shot(q.remaining_b,q.round_no))
   where match_id=q.id and n=q.round_no and revealed_at is null;
   perform duel_private.pk_resolve(q.id,p_now);
  end if;
  handled:=handled+1;
 end loop;
 return handled;
end $$;
create function duel_private.pk_project(p_player text,p_now timestamptz) returns jsonb
language plpgsql security definer set search_path='' as $$
declare base jsonb;items jsonb;
begin
 base:=duel_private.run(p_player,'state','{}',null,p_now);
 select coalesce(jsonb_agg(item order by priority,created_at desc),'[]'::jsonb) into items from (
 select q.created_at,case when q.status in('pending','lobby','active') then 0 else 1 end as priority,
 jsonb_build_object('id',q.id,'a',q.a,'b',q.b,'stake',q.stake,'practice',q.practice,'status',q.status,'mode','live',
  'expires',q.expires_at,'round',q.round_no,'remainingA',q.remaining_a,'remainingB',q.remaining_b,
  'readyA',q.ready_a,'readyB',q.ready_b,'aReady',r.a_shot is not null,'bReady',r.b_shot is not null,
  'yourShot',case when r.revealed_at is null then case when q.a=p_player then r.a_shot else r.b_shot end end,
  'aScore',q.a_score,'bScore',q.b_score,'winner',q.winner,
  'aPlan',case when q.status='complete' then (select array_agg(a_shot order by n) from duel_private.pk_rounds where match_id=q.id) end,
  'bPlan',case when q.status='complete' then (select array_agg(b_shot order by n) from duel_private.pk_rounds where match_id=q.id) end,
  'autoDefended',exists(select 1 from duel_private.pk_rounds where match_id=q.id and revealed_at is not null and (auto_a or auto_b)),
  'rounds',coalesce((select jsonb_agg(jsonb_build_object('n',n,'a',a_shot,'b',b_shot,'autoA',auto_a,'autoB',auto_b) order by n) from duel_private.pk_rounds where match_id=q.id and revealed_at is not null),'[]'::jsonb)) as item
 from duel_private.pk_matches q left join duel_private.pk_rounds r on r.match_id=q.id and r.n=q.round_no
 where p_player in(q.a,q.b)
 order by case when q.status in('pending','lobby','active') then 0 else 1 end,q.created_at desc limit 80
 ) visible;
 return base||jsonb_build_object('pkVersion',1,'matches',items||coalesce(base->'matches','[]'::jsonb),
 'used',coalesce((base->>'used')::boolean,false) or exists(select 1 from duel_private.pk_matches where a=p_player and not practice and accepted_day=(p_now at time zone 'Europe/Dublin')::date));
end $$;
create function duel_private.pk_run(p_player text,p_action text,p_payload jsonb,p_key uuid,p_now timestamptz) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q duel_private.pk_matches;r duel_private.pk_rounds;receipt duel_private.pk_requests;
 target text;amount integer;smaller integer;practice_mode boolean;chosen uuid;shot integer;shot_round integer;
 d date:=(p_now at time zone 'Europe/Dublin')::date;sig text:=md5(p_action||coalesce(p_payload,'{}')::text);old_result jsonb;
begin
 if p_player is null or p_player not in('dad','mom','rong','yao','jiet','ying','hui') or not exists(select 1 from public.pirate_players where id=p_player) then raise exception 'unknown_player';end if;
 perform pg_advisory_xact_lock(20261101,12);
 perform id from public.pirate_players order by id for update;
 perform duel_private.pk_tick(p_now);
 if p_action='state' then return duel_private.pk_project(p_player,p_now);end if;
 if p_action like 'legacy_%' then
  if substr(p_action,8) not in('accept','decline','cancel','lock') then raise exception 'bad_action';end if;
  old_result:=duel_private.run(p_player,substr(p_action,8),p_payload,p_key,p_now);
  return duel_private.pk_project(p_player,p_now)||jsonb_build_object('selected',old_result->'selected');
 end if;
 if p_action is null or p_action not in('invite','join','ready','cancel','leave','shot') then raise exception 'bad_action';end if;
 if p_key is null then raise exception 'request_key_required';end if;
 select * into receipt from duel_private.pk_requests where key=p_key;
 if found then
  if receipt.actor<>p_player or receipt.signature<>sig then raise exception 'request_key_conflict';end if;
  return duel_private.pk_project(p_player,p_now)||jsonb_build_object('selected',receipt.match_id);
 end if;
 if p_action='invite' then
  if d>date '2026-11-07' then raise exception 'game_over';end if;
  target:=p_payload->>'target';
  if target is null or target=p_player or target not in('dad','mom','rong','yao','jiet','ying','hui','bot') or (target<>'bot' and not exists(select 1 from public.pirate_players where id=target)) then raise exception 'choose_player';end if;
  if exists(select 1 from duel_private.pk_matches where a=p_player and status in('pending','lobby') and (b='bot')=(target='bot')) then raise exception 'outgoing_active';end if;
  practice_mode:=d<date '2026-11-01' or target='bot' or coalesce((p_payload->>'practice')::boolean,false);
  if not practice_mode and ((duel_private.pk_project(p_player,p_now)->>'used')::boolean) then raise exception 'daily_attack_used';end if;
  amount:=case when practice_mode then 0 else (p_payload->>'stake')::integer end;
  select least((select gold from public.pirate_players where id=p_player),(select gold from public.pirate_players where id=target)) into smaller;
  if not practice_mode and (amount is null or amount<10 or amount%10<>0 or amount>floor(smaller*0.2/10)*10) then raise exception 'stake_changed';end if;
  insert into duel_private.pk_matches(a,b,stake,practice,status,created_at,expires_at,ready_b)
   values(p_player,target,amount,practice_mode,case when target='bot' then 'lobby' else 'pending' end,p_now,
     least(p_now+interval '24 hours',timestamptz '2026-11-08 00:00:00 Europe/Dublin'),target='bot') returning id into chosen;
 else
  chosen:=(p_payload->>'id')::uuid;
  select * into q from duel_private.pk_matches where id=chosen for update;
  if not found or p_player not in(q.a,q.b) then raise exception 'not_found';end if;
  if p_action='cancel' then
   if q.a<>p_player or q.status not in('pending','lobby') then raise exception 'battle_started';end if;
   update duel_private.pk_matches set status='cancelled',finished_at=p_now where id=chosen;
  elsif p_action='leave' then
   if q.b<>p_player or q.status<>'lobby' then raise exception 'battle_started';end if;
   update duel_private.pk_matches set status='pending',ready_a=false,ready_b=false where id=chosen;
  elsif p_action='join' then
   if q.b<>p_player or q.status not in('pending','lobby') then raise exception 'invitation_closed';end if;
   update duel_private.pk_matches set status='lobby' where id=chosen;
  elsif p_action='ready' then
   if q.status not in('lobby','active','complete') then raise exception 'invitation_closed';end if;
   if q.status='lobby' then
    if d>date '2026-11-07' then raise exception 'game_over';end if;
    update duel_private.pk_matches set ready_a=ready_a or p_player=a,ready_b=ready_b or p_player=b where id=chosen returning * into q;
    if q.ready_a and q.ready_b then
     if not q.practice then
      if (duel_private.pk_project(q.a,p_now)->>'used')::boolean then raise exception 'daily_attack_used';end if;
      select least((select gold from public.pirate_players where id=q.a),(select gold from public.pirate_players where id=q.b)) into smaller;
      if smaller is null or q.stake>floor(smaller*0.2/10)*10 then raise exception 'stake_changed';end if;
      update public.pirate_players set gold=gold-q.stake,duel_reserved=duel_reserved+q.stake where id in(q.a,q.b);
     end if;
     update duel_private.pk_matches set status='active',accepted_day=d,expires_at=p_now+interval '24 hours' where id=chosen;
     perform duel_private.pk_open(chosen);
    end if;
   end if;
  elsif p_action='shot' then
   if q.status not in('active','complete') then raise exception 'invitation_closed';end if;
   if q.status='active' then
    if coalesce(p_payload->>'round','') !~ '^[1-5]$' then raise exception 'invalid_round';end if;
    shot_round:=(p_payload->>'round')::integer;
    -- A late submission observes the saved timeout result, without replacing it.
    if shot_round=q.round_no then
     if coalesce(p_payload->>'shot','') !~ '^([0-9]|1[0-2])$' or jsonb_typeof(p_payload->'shot')<>'number' then raise exception 'invalid_shot';end if;
     shot:=(p_payload->>'shot')::integer;
     smaller:=case when q.a=p_player then q.remaining_a else q.remaining_b end;
     if shot>smaller or (q.round_no=5 and shot<>smaller) then raise exception 'invalid_shot';end if;
     select * into strict r from duel_private.pk_rounds where match_id=chosen and n=q.round_no for update;
     if (q.a=p_player and r.a_shot is not null) or (q.b=p_player and r.b_shot is not null) then raise exception 'plan_locked';end if;
     update duel_private.pk_rounds set a_shot=case when q.a=p_player then shot else a_shot end,b_shot=case when q.b=p_player then shot else b_shot end where match_id=chosen and n=q.round_no;
     perform duel_private.pk_resolve(chosen,p_now);
    elsif shot_round>q.round_no then raise exception 'invalid_round';end if;
   end if;
  end if;
 end if;
 insert into duel_private.pk_requests(key,actor,signature,match_id) values(p_key,p_player,sig,chosen);
 return duel_private.pk_project(p_player,p_now)||jsonb_build_object('selected',chosen);
end $$;
revoke all on function duel_private.pk_random_shot(integer,integer),duel_private.pk_open(uuid),duel_private.pk_resolve(uuid,timestamptz),duel_private.pk_tick(timestamptz),duel_private.pk_project(text,timestamptz),duel_private.pk_run(text,text,jsonb,uuid,timestamptz) from public,anon,authenticated;
create function public.pirate_pk(p_player text,p_action text default 'state',p_payload jsonb default '{}',p_key uuid default null) returns jsonb
language sql security definer set search_path='' as $$select duel_private.pk_run(p_player,p_action,p_payload,p_key,now());$$;
revoke all on function public.pirate_pk(text,text,jsonb,uuid) from public;
grant execute on function public.pirate_pk(text,text,jsonb,uuid) to anon,authenticated;
-- Stale clients can finish previous duels, but must reload to create a new PK.
create or replace function public.pirate_duel(p_player text,p_action text default 'state',p_payload jsonb default '{}',p_key uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$begin
 if p_action in('launch','invite') then raise exception 'update_required';end if;
 return duel_private.run(p_player,p_action,p_payload,p_key,now());
end $$;
