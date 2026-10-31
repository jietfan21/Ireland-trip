-- Twelve shots total, with no separate per-island cap. Saved plans/outcomes stay unchanged.
create or replace function duel_private.plan(p jsonb) returns integer[]
language plpgsql immutable set search_path='' as $$
declare result integer[];
begin
 if jsonb_typeof(p) is distinct from 'array' then raise exception 'invalid_plan'; end if;
 if jsonb_array_length(p)<>5 or exists(select 1 from jsonb_array_elements_text(p) x where x is null or x !~ '^([0-9]|1[0-2])$') then raise exception 'invalid_plan'; end if;
 select array_agg(v::integer order by ord) into result from jsonb_array_elements_text(p) with ordinality as t(v,ord);
 if (select sum(x) from unnest(result) x)<>12 then raise exception 'invalid_plan'; end if;
 return result;
end $$;
-- Enumerate the 1,820 integer splits exactly once, then choose uniformly.
create or replace function duel_private.random_plan() returns integer[]
language sql volatile set search_path='' as $$
 select array[a,b,c,d,12-a-b-c-d]
 from pg_catalog.generate_series(0,12) a
 cross join lateral pg_catalog.generate_series(0,12-a) b
 cross join lateral pg_catalog.generate_series(0,12-a-b) c
 cross join lateral pg_catalog.generate_series(0,12-a-b-c) d
 order by pg_catalog.random() limit 1;
$$;
-- Existing optional invitations use the same validator when they finish.
do $upgrade$
declare definition text; old_validation text := $old$if jsonb_typeof(p_payload->'plan') is distinct from 'array' then raise exception 'invalid_plan'; end if;
     if jsonb_array_length(p_payload->'plan')<>5 or exists(select 1 from jsonb_array_elements_text(p_payload->'plan') x where x is null or x !~ '^[0-5]$') then raise exception 'invalid_plan'; end if;
     select array_agg(value::integer order by ord) into plan from jsonb_array_elements_text(p_payload->'plan') with ordinality as t(value,ord);
     if (select sum(x) from unnest(plan) x)<>12 then raise exception 'invalid_plan'; end if;$old$;
begin
 definition:=pg_get_functiondef('duel_private.run_v1(text,text,jsonb,uuid,timestamptz)'::regprocedure);
 if strpos(definition,old_validation)=0 then raise exception 'legacy_validator_changed'; end if;
 execute replace(definition,old_validation,$new$plan:=duel_private.plan(p_payload->'plan');$new$);
end $upgrade$;
revoke all on function duel_private.plan(jsonb),duel_private.random_plan() from public,anon,authenticated;
