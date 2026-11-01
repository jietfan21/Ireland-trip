-- New PKs award one point per island. Preserve started/completed outcomes and gold.
alter table duel_private.pk_matches add column scoring text not null default 'weighted' check(scoring in('weighted','equal'));
alter table duel_private.pk_matches alter column scoring set default 'equal';
update duel_private.pk_matches set scoring='equal' where status in('pending','lobby');

create or replace function duel_private.pk_resolve(p_id uuid,p_now timestamptz) returns void
language plpgsql security definer set search_path='' as $$
declare q duel_private.pk_matches;r duel_private.pk_rounds;sa integer;sb integer;victor text;
begin
 select * into q from duel_private.pk_matches where id=p_id for update;
 if not found or q.status<>'active' then return; end if;
 select * into strict r from duel_private.pk_rounds where match_id=q.id and n=q.round_no for update;
 if r.revealed_at is not null or r.a_shot is null or r.b_shot is null then return; end if;
 if r.a_shot>q.remaining_a or r.b_shot>q.remaining_b then raise exception 'invalid_shot';end if;
 sa:=q.a_score+case when r.a_shot>r.b_shot then case when q.scoring='equal' then 1 else q.round_no end else 0 end;
 sb:=q.b_score+case when r.b_shot>r.a_shot then case when q.scoring='equal' then 1 else q.round_no end else 0 end;
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

-- Include the rule in every projection, including historical replays.
do $upgrade$
declare definition text;
begin
 definition:=pg_get_functiondef('duel_private.pk_project(text,timestamptz)'::regprocedure);
 if strpos(definition,$old$'mode','live',$old$)=0 or strpos(definition,$old$'pkVersion',1$old$)=0 then raise exception 'pk_projection_changed';end if;
 definition:=replace(definition,$old$'mode','live',$old$,$new$'mode','live','scoring',q.scoring,$new$);
 definition:=replace(definition,$old$'pkVersion',1$old$,$new$'pkVersion',2$new$);
 execute definition;
end $upgrade$;
-- A stale client must reload rather than display the old island values in a new PK.
do $upgrade$
declare definition text; invite_check text := $old$ if p_action='invite' then$old$;
 actor_check text := $old$  if not found or p_player not in(q.a,q.b) then raise exception 'not_found';end if;$old$;
begin
 definition:=pg_get_functiondef('duel_private.pk_run(text,text,jsonb,uuid,timestamptz)'::regprocedure);
 if strpos(definition,invite_check)=0 or strpos(definition,actor_check)=0 then raise exception 'pk_runner_changed';end if;
 definition:=replace(definition,invite_check,invite_check||$new$
  if coalesce(p_payload->>'rulesVersion','')<>'2' then raise exception 'update_required';end if;$new$);
 definition:=replace(definition,actor_check,actor_check||$new$
  if q.scoring='equal' and p_action in('ready','shot') and coalesce(p_payload->>'rulesVersion','')<>'2' then raise exception 'update_required';end if;$new$);
 execute definition;
end $upgrade$;
revoke all on function duel_private.pk_resolve(uuid,timestamptz),duel_private.pk_project(text,timestamptz),duel_private.pk_run(text,text,jsonb,uuid,timestamptz) from public,anon,authenticated;
