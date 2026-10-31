-- Additive Treasure Duel installation. Existing trip gold is preserved.
create schema if not exists duel_private;
revoke all on schema duel_private from public, anon, authenticated;
alter table public.pirate_players add column if not exists duel_reserved integer not null default 0 check (duel_reserved >= 0);
create table duel_private.matches (
 id uuid primary key default gen_random_uuid(), a text not null, b text not null,
 stake integer not null check(stake>=0), practice boolean not null,
 status text not null check(status in ('pending','accepted','complete','declined','cancelled','expired')),
 created_at timestamptz not null, expires_at timestamptz not null,
 accepted_day date, a_plan integer[], b_plan integer[], a_score integer, b_score integer,
 winner text, finished_at timestamptz
);
create index duel_matches_a_day on duel_private.matches(a,accepted_day);
create index duel_matches_open on duel_private.matches(status,expires_at);
create table duel_private.requests (key uuid primary key, actor text not null, signature text not null, match_id uuid);
alter table duel_private.matches enable row level security;
alter table duel_private.requests enable row level security;
revoke all on all tables in schema duel_private from public,anon,authenticated;

create or replace function duel_private.run(p_player text,p_action text,p_payload jsonb,p_key uuid,p_now timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 d date := (p_now at time zone 'Europe/Dublin')::date;
 is_practice boolean := d < date '2026-11-01';
 q duel_private.matches; e duel_private.matches; previous duel_private.requests;
 target text; amount integer; smaller integer; plan integer[]; n integer; sa integer; sb integer;
 chosen uuid; sig text := md5(p_action || coalesce(p_payload,'{}')::text);
begin
 if p_player is null or p_player not in ('dad','mom','rong','yao','jiet','ying','hui') then raise exception 'unknown_player'; end if;
 if p_action is null or p_action not in ('state','invite','accept','decline','cancel','lock') then raise exception 'bad_action'; end if;
 perform pg_advisory_xact_lock(20261101,12);
 -- Same row order as wheel attacks: no lost updates or competing payouts.
 perform id from public.pirate_players order by id for update;
 for e in select * from duel_private.matches where status in ('pending','accepted') and expires_at<=p_now order by id for update loop
  if not e.practice then
   update public.pirate_players set gold=gold+e.stake,duel_reserved=duel_reserved-e.stake where id=e.a;
   if e.status='accepted' then update public.pirate_players set gold=gold+e.stake,duel_reserved=duel_reserved-e.stake where id=e.b; end if;
  end if;
  update duel_private.matches set status='expired',finished_at=p_now where id=e.id;
 end loop;
 if p_action<>'state' then
  if p_key is null then raise exception 'request_key_required'; end if;
  select * into previous from duel_private.requests where key=p_key;
  if found then
   if previous.actor<>p_player or previous.signature<>sig then raise exception 'request_key_conflict'; end if;
   chosen:=previous.match_id;
  else
   if p_action='invite' then
    if d>date '2026-11-07' then raise exception 'game_over'; end if;
    target:=p_payload->>'target';
    if target is null or target=p_player or target not in ('dad','mom','rong','yao','jiet','ying','hui','bot') then raise exception 'choose_player'; end if;
    is_practice:=is_practice or target='bot' or coalesce((p_payload->>'practice')::boolean,false);
    if exists(select 1 from duel_private.matches where a=p_player and practice=is_practice and status in ('pending','accepted')) then raise exception 'outgoing_active'; end if;
    if exists(select 1 from duel_private.matches where practice=is_practice and status in ('pending','accepted') and (a=p_player and b=target)) then raise exception 'already_invited'; end if;
    if not is_practice and exists(select 1 from duel_private.matches where a=p_player and not practice and accepted_day=d) then raise exception 'daily_attack_used'; end if;
    amount:=case when is_practice then 0 else (p_payload->>'stake')::integer end;
    if not is_practice then
     select least((select gold from public.pirate_players where id=p_player),(select gold from public.pirate_players where id=target)) into smaller;
     if amount is null or amount<10 or amount%10<>0 or amount>floor(smaller*0.2/10)*10 then raise exception 'stake_changed'; end if;
     update public.pirate_players set gold=gold-amount,duel_reserved=duel_reserved+amount where id=p_player;
    end if;
    insert into duel_private.matches(a,b,stake,practice,status,created_at,expires_at,b_plan)
    values(p_player,target,amount,is_practice,case when target='bot' then 'accepted' else 'pending' end,p_now,
      least(p_now+interval '24 hours',case when d<date '2026-11-01' then timestamptz '2026-11-01 00:00:00 Europe/Dublin' else timestamptz '2026-11-08 00:00:00 Europe/Dublin' end),
      case when target='bot' then (select array_agg(v order by random()) from unnest(array[0,1,3,3,5]) as v) else null end)
    returning id into chosen;
   else
    chosen:=(p_payload->>'id')::uuid;
    select * into q from duel_private.matches where id=chosen for update;
    if not found or p_player not in (q.a,q.b) then raise exception 'not_found'; end if;
    if p_action='accept' then
     if q.status<>'pending' or q.b<>p_player then raise exception 'invitation_closed'; end if;
     if d>date '2026-11-07' then raise exception 'game_over'; end if;
     if not q.practice then
      if exists(select 1 from duel_private.matches where a=q.a and not practice and accepted_day=d) then raise exception 'daily_attack_used'; end if;
      select least((select gold+q.stake from public.pirate_players where id=q.a),(select gold from public.pirate_players where id=q.b)) into smaller;
      if q.stake>floor(smaller*0.2/10)*10 then raise exception 'stake_changed'; end if;
      update public.pirate_players set gold=gold-q.stake,duel_reserved=duel_reserved+q.stake where id=q.b;
     end if;
     update duel_private.matches set status='accepted',accepted_day=d,expires_at=least(p_now+interval '24 hours',case when d<date '2026-11-01' then timestamptz '2026-11-01 00:00:00 Europe/Dublin' else timestamptz '2026-11-08 00:00:00 Europe/Dublin' end) where id=chosen;
    elsif p_action in ('decline','cancel') then
     if q.status<>'pending' or (p_action='decline' and q.b<>p_player) or (p_action='cancel' and q.a<>p_player) then raise exception 'invitation_closed'; end if;
     if not q.practice then update public.pirate_players set gold=gold+q.stake,duel_reserved=duel_reserved-q.stake where id=q.a; end if;
     update duel_private.matches set status=case when p_action='decline' then 'declined' else 'cancelled' end,finished_at=p_now where id=chosen;
    elsif p_action='lock' then
     if q.status<>'accepted' then raise exception 'invitation_closed'; end if;
     if (p_player=q.a and q.a_plan is not null) or (p_player=q.b and q.b_plan is not null) then raise exception 'plan_locked'; end if;
     if jsonb_typeof(p_payload->'plan') is distinct from 'array' then raise exception 'invalid_plan'; end if;
     if jsonb_array_length(p_payload->'plan')<>5 or exists(select 1 from jsonb_array_elements_text(p_payload->'plan') x where x is null or x !~ '^[0-5]$') then raise exception 'invalid_plan'; end if;
     select array_agg(value::integer order by ord) into plan from jsonb_array_elements_text(p_payload->'plan') with ordinality as t(value,ord);
     if (select sum(x) from unnest(plan) x)<>12 then raise exception 'invalid_plan'; end if;
     if p_player=q.a then update duel_private.matches set a_plan=plan where id=chosen;
     else update duel_private.matches set b_plan=plan where id=chosen; end if;
     select * into q from duel_private.matches where id=chosen;
     if q.a_plan is not null and q.b_plan is not null then
      sa:=0;sb:=0;
      for n in 1..5 loop
       if q.a_plan[n]>q.b_plan[n] then sa:=sa+n;
       elsif q.a_plan[n]<q.b_plan[n] then sb:=sb+n; end if;
      end loop;
      target:=case when sa>sb then q.a when sb>sa then q.b else null end;
      if not q.practice then
       update public.pirate_players set duel_reserved=duel_reserved-q.stake,
        gold=gold+case when target is null then q.stake when id=target then q.stake*2 else 0 end
        where id in(q.a,q.b);
       insert into public.pirate_events(season,day,actor,kind,target,amount,turn_key)
        values('trip',d::text,q.a,'duel',q.b,case when target=q.a then q.stake when target=q.b then -q.stake else 0 end,'duel:'||chosen);
      end if;
      update duel_private.matches set status='complete',a_score=sa,b_score=sb,winner=target,finished_at=p_now where id=chosen;
     end if;
    end if;
   end if;
   insert into duel_private.requests(key,actor,signature,match_id) values(p_key,p_player,sig,chosen);
  end if;
 end if;
 return jsonb_build_object(
  'day',d,'practice',d<date '2026-11-01','ended',d>date '2026-11-07','selected',chosen,
  'used',exists(select 1 from duel_private.matches where a=p_player and not practice and accepted_day=d),
  'players',(select jsonb_agg(jsonb_build_object('id',id,'gold',gold,'reserved',duel_reserved) order by id) from public.pirate_players),
  'matches',coalesce((select jsonb_agg(item order by created_at desc) from (
   select created_at,jsonb_build_object('id',id,'a',a,'b',b,'stake',stake,'practice',practice,'status',status,'expires',expires_at,
    'aReady',a_plan is not null,'bReady',b_plan is not null,
    'aPlan',case when status='complete' then a_plan end,'bPlan',case when status='complete' then b_plan end,
    'aScore',a_score,'bScore',b_score,'winner',winner) as item
   from duel_private.matches where p_player in(a,b) order by created_at desc limit 60
  ) items),'[]'::jsonb));
end $$;
revoke all on function duel_private.run(text,text,jsonb,uuid,timestamptz) from public,anon,authenticated;
create or replace function public.pirate_duel(p_player text,p_action text default 'state',p_payload jsonb default '{}',p_key uuid default null)
returns jsonb language sql security definer set search_path='' as $$
 select duel_private.run(p_player,p_action,p_payload,p_key,now());
$$;
revoke all on function public.pirate_duel(text,text,jsonb,uuid) from public;
grant execute on function public.pirate_duel(text,text,jsonb,uuid) to anon,authenticated;
