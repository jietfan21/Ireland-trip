-- Forced virtual-gold duels, approved under the existing family-name trust model.
-- No balances or existing match outcomes are reset.
alter table duel_private.matches add column forced boolean not null default false;
alter table duel_private.matches add column auto_defended boolean not null default false;

create function duel_private.random_plan() returns integer[]
language sql volatile set search_path='' as $$
 select array[a,b,c,d,e] from pg_catalog.generate_series(0,5) a
 cross join pg_catalog.generate_series(0,5) b cross join pg_catalog.generate_series(0,5) c
 cross join pg_catalog.generate_series(0,5) d cross join pg_catalog.generate_series(0,5) e
 where a+b+c+d+e=12 order by pg_catalog.random() limit 1;
$$;
create function duel_private.plan(p jsonb) returns integer[]
language plpgsql immutable set search_path='' as $$
declare result integer[];
begin
 if jsonb_typeof(p) is distinct from 'array' then raise exception 'invalid_plan'; end if;
 if jsonb_array_length(p)<>5 or exists(select 1 from jsonb_array_elements_text(p) x where x is null or x !~ '^[0-5]$') then raise exception 'invalid_plan'; end if;
 select array_agg(v::integer order by ord) into result from jsonb_array_elements_text(p) with ordinality as t(v,ord);
 if (select sum(x) from unnest(result) x)<>12 then raise exception 'invalid_plan'; end if;
 return result;
end $$;
create function duel_private.settle(p_id uuid,p_now timestamptz) returns void
language plpgsql security definer set search_path='' as $$
declare q duel_private.matches; n integer; sa integer:=0; sb integer:=0; target text;
begin
 select * into q from duel_private.matches where id=p_id for update;
 if not found or q.status<>'accepted' or q.a_plan is null or q.b_plan is null then return; end if;
 for n in 1..5 loop
  if q.a_plan[n]>q.b_plan[n] then sa:=sa+n;
  elsif q.b_plan[n]>q.a_plan[n] then sb:=sb+n; end if;
 end loop;
 target:=case when sa>sb then q.a when sb>sa then q.b else null end;
 if not q.practice then
  update public.pirate_players set duel_reserved=duel_reserved-q.stake,
   gold=gold+case when target is null then q.stake when id=target then q.stake*2 else 0 end where id in(q.a,q.b);
  insert into public.pirate_events(season,day,actor,kind,target,amount,turn_key)
   values('trip',(p_now at time zone 'Europe/Dublin')::date::text,q.a,'duel',q.b,
    case when target=q.a then q.stake when target=q.b then -q.stake else 0 end,'duel:'||q.id);
 end if;
 update duel_private.matches set status='complete',a_score=sa,b_score=sb,winner=target,finished_at=p_now where id=p_id;
end $$;
create function duel_private.tick(p_now timestamptz) returns integer
language plpgsql security definer set search_path='' as $$
declare q duel_private.matches; handled integer:=0;
begin
 perform pg_advisory_xact_lock(20261101,12);
 perform id from public.pirate_players order by id for update;
 for q in select * from duel_private.matches where status in('pending','accepted') and expires_at<=p_now order by id for update loop
  -- Only a full 24-hour response window causes auto-defence. Short season-cutoff
  -- windows refund instead; practice never becomes a paid official game.
  if q.forced and q.status='accepted' and q.a_plan is not null and p_now>=q.created_at+interval '24 hours'
   and q.expires_at>=q.created_at+interval '24 hours' then
   if q.b_plan is null then
    update duel_private.matches set b_plan=duel_private.random_plan(),auto_defended=true where id=q.id;
   end if;
   perform duel_private.settle(q.id,p_now);
  else
   if not q.practice then
    update public.pirate_players set gold=gold+q.stake,duel_reserved=duel_reserved-q.stake where id=q.a;
    if q.status='accepted' then update public.pirate_players set gold=gold+q.stake,duel_reserved=duel_reserved-q.stake where id=q.b; end if;
   end if;
   update duel_private.matches set status='expired',finished_at=p_now where id=q.id;
  end if;
  handled:=handled+1;
 end loop;
 return handled;
end $$;

-- Preserve the already-tested optional-duel flow for existing legacy matches.
alter function duel_private.run(text,text,jsonb,uuid,timestamptz) rename to run_v1;
create function duel_private.project(p_player text,p_now timestamptz) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 result:=duel_private.run_v1(p_player,'state','{}',null,p_now);
 return result || jsonb_build_object('matches',coalesce((select jsonb_agg(item order by priority,created_at desc) from (
  select created_at,case when status in('pending','accepted') then 0 else 1 end as priority,
   jsonb_build_object('id',id,'a',a,'b',b,'stake',stake,'practice',practice,'status',status,'expires',expires_at,
    'aReady',a_plan is not null,'bReady',b_plan is not null,
    'aPlan',case when status='complete' then a_plan end,'bPlan',case when status='complete' then b_plan end,
    'aScore',a_score,'bScore',b_score,'winner',winner,'forced',forced,'autoDefended',auto_defended) as item
  from duel_private.matches where p_player in(a,b)
  order by case when status in('pending','accepted') then 0 else 1 end,created_at desc limit 80
 ) visible),'[]'::jsonb));
end $$;
create function duel_private.run(p_player text,p_action text,p_payload jsonb,p_key uuid,p_now timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 d date:=(p_now at time zone 'Europe/Dublin')::date;
 q duel_private.matches; previous duel_private.requests; target text; amount integer; smaller integer;
 is_practice boolean; shots integer[]; chosen uuid; result jsonb;
 sig text:=md5(p_action||coalesce(p_payload,'{}')::text);
begin
 if p_player is null or p_player not in ('dad','mom','rong','yao','jiet','ying','hui') then raise exception 'unknown_player'; end if;
 if not exists(select 1 from public.pirate_players where id=p_player) then raise exception 'unknown_player'; end if;
 perform pg_advisory_xact_lock(20261101,12);
 perform id from public.pirate_players order by id for update;
 perform duel_private.tick(p_now);
 if p_action='state' then return duel_private.project(p_player,p_now); end if;
 if p_action='invite' then raise exception 'update_required'; end if;
 if p_action not in ('launch','accept','decline','cancel','lock') or p_action is null then raise exception 'bad_action'; end if;
 if p_key is null then raise exception 'request_key_required'; end if;
 select * into previous from duel_private.requests where key=p_key;
 if found then
  if previous.actor<>p_player or previous.signature<>sig then raise exception 'request_key_conflict'; end if;
  return duel_private.project(p_player,p_now)||jsonb_build_object('selected',previous.match_id);
 end if;
 if p_action='launch' then
  if d>date '2026-11-07' then raise exception 'game_over'; end if;
  target:=p_payload->>'target';
  if target is null or target=p_player or target not in ('dad','mom','rong','yao','jiet','ying','hui','bot') then raise exception 'choose_player'; end if;
  if target<>'bot' and not exists(select 1 from public.pirate_players where id=target) then raise exception 'choose_player'; end if;
  shots:=duel_private.plan(p_payload->'plan');
  is_practice:=d<date '2026-11-01' or target='bot' or coalesce((p_payload->>'practice')::boolean,false);
  if is_practice and target<>'bot' and exists(select 1 from duel_private.matches where a=p_player and practice and status in('pending','accepted')) then raise exception 'outgoing_active'; end if;
  if not is_practice and exists(select 1 from duel_private.matches where a=p_player and not practice and accepted_day=d) then raise exception 'daily_attack_used'; end if;
  amount:=case when is_practice then 0 else (p_payload->>'stake')::integer end;
  if not is_practice then
   select least((select gold from public.pirate_players where id=p_player),(select gold from public.pirate_players where id=target)) into smaller;
   if smaller is null or amount is null or amount<10 or amount%10<>0 or amount>floor(smaller*0.2/10)*10 then raise exception 'stake_changed'; end if;
   update public.pirate_players set gold=gold-amount,duel_reserved=duel_reserved+amount where id in(p_player,target);
  end if;
  insert into duel_private.matches(a,b,stake,practice,status,created_at,expires_at,accepted_day,a_plan,b_plan,forced)
   values(p_player,target,amount,is_practice,'accepted',p_now,
    least(p_now+interval '24 hours',case when d<date '2026-11-01' then timestamptz '2026-11-01 00:00:00 Europe/Dublin' else timestamptz '2026-11-08 00:00:00 Europe/Dublin' end),
    d,shots,case when target='bot' then duel_private.random_plan() else null end,true)
   returning id into chosen;
  if target='bot' then perform duel_private.settle(chosen,p_now); end if;
 else
  chosen:=(p_payload->>'id')::uuid;
  select * into q from duel_private.matches where id=chosen for update;
  if not found or p_player not in(q.a,q.b) then raise exception 'not_found'; end if;
  if not q.forced then
   result:=duel_private.run_v1(p_player,p_action,p_payload,p_key,p_now);
   return duel_private.project(p_player,p_now)||jsonb_build_object('selected',result->'selected');
  end if;
  if p_action<>'lock' then raise exception 'attack_started'; end if;
  -- A late response sees the saved automatic result instead of rerolling it.
  if q.status<>'complete' then
   if q.status<>'accepted' then raise exception 'invitation_closed'; end if;
   if p_player<>q.b or q.b_plan is not null then raise exception 'plan_locked'; end if;
   shots:=duel_private.plan(p_payload->'plan');
   update duel_private.matches set b_plan=shots where id=chosen;
   perform duel_private.settle(chosen,p_now);
  end if;
 end if;
 insert into duel_private.requests(key,actor,signature,match_id) values(p_key,p_player,sig,chosen);
 return duel_private.project(p_player,p_now)||jsonb_build_object('selected',chosen);
end $$;
revoke all on all functions in schema duel_private from public,anon,authenticated;
create or replace function public.pirate_duel(p_player text,p_action text default 'state',p_payload jsonb default '{}',p_key uuid default null)
returns jsonb language sql security definer set search_path='' as $$
 select duel_private.run(p_player,p_action,p_payload,p_key,now());
$$;
revoke all on function public.pirate_duel(text,text,jsonb,uuid) from public;
grant execute on function public.pirate_duel(text,text,jsonb,uuid) to anon,authenticated;
