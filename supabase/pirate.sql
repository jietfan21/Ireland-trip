-- 🏴‍☠️ Pirate game (v2) for the Ireland trip app.
-- No login by design: anyone with the link can read; every write goes through the functions
-- below (security definer, relative updates, replay-safe by turn key), and they validate
-- everything the client sends. Design: docs/superpowers/specs/2026-10-20-pirate-game-v2-design.md
-- Safe to run on a fresh project; re-running drops and recreates the game (no data kept).

drop function if exists public.pirate_apply(text, text, text, text, text, text);
drop function if exists public.pirate_spin(text, text, text, int, text, text);
drop function if exists public.pirate_exchange(text, text, text);
drop function if exists public.pirate_buy_mirror(text, text, text);
drop function if exists public.pirate_mult(text);
drop function if exists public.pirate_boom(text, text, text, text);
drop function if exists public.pirate_open(text, text, text);
drop function if exists public.pirate_check(text, text);
drop function if exists public.pirate_attack; -- no signature: the row type may not exist yet on a fresh project
drop function if exists public.pirate_replay(text, text);
drop function if exists public.pirate_season(text);
drop function if exists public.pirate_hit(int, int);
drop function if exists public.pirate_start_spins(text);
drop table if exists public.pirate_events;
drop table if exists public.pirate_players;

create table public.pirate_players (
  id text primary key,                     -- people[].id
  gold int not null default 1000,
  shields int not null default 0,          -- 0..3, hidden from others
  mirror boolean not null default false,   -- at most one, hidden from others
  spins int not null default 5,            -- balance: +5 per Dublin day, +3 from the wedge, no cap
  boom_pending boolean not null default false, -- a 💣 was spun (spin used), victim not chosen yet
  boomed_day text,                         -- last Dublin day this player was boomed (informational; no daily limit)
  day text not null,                       -- last Dublin day (YYYY-MM-DD) spins were credited for
  season text not null,                    -- 'practice' | 'trip'
  updated_at timestamptz not null default now()
);

create table public.pirate_events (
  id bigserial primary key,
  at timestamptz not null default now(),
  season text not null,
  day text not null,
  actor text not null,
  kind text not null,  -- win | spins | shield | shield_full | mirror | mirror_bought | steal | boom | boom_pending | steal_blocked | boom_blocked | steal_reflected | boom_reflected | steal_none | boom_none | reset
  target text,
  amount int,
  turn_key text unique                     -- one per spin/exchange: a retried call can't apply twice
);

alter table public.pirate_players enable row level security;
alter table public.pirate_events enable row level security;
create policy "anyone can read players" on public.pirate_players for select to anon using (true);
create policy "anyone can read events" on public.pirate_events for select to anon using (true);
-- No insert/update policies on purpose: writes only via the functions.

-- Validation of what the client sends: known player, a date that is today ±1 in Dublin and not past the last day.
create or replace function public.pirate_check(p_player text, p_day text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'Europe/Dublin')::date;
  d date;
begin
  if p_player is null or p_player not in ('dad', 'mom', 'rong', 'yao', 'jiet', 'ying', 'hui') then return 'unknown player'; end if;
  -- Exactly YYYY-MM-DD: Postgres would also accept 'tomorrow' or 'Oct 21 2026', which then compare wrongly as text.
  if p_day is null or p_day !~ '^\d{4}-\d{2}-\d{2}$' then return 'bad day'; end if;
  begin
    d := p_day::date;
  exception when others then
    return 'bad day';
  end;
  if d::text <> p_day then return 'bad day'; end if;
  if d > date '2026-11-07' then return 'game over'; end if;
  if abs(d - today) > 1 then return 'bad day'; end if;
  return null;
end $$;

create or replace function public.pirate_season(p_day text)
returns text
language sql immutable as $$
  select case when p_day < '2026-10-25' then 'practice' else 'trip' end
$$;

-- pct% of gold, rounded down to a multiple of 10.
create or replace function public.pirate_hit(gold int, pct int)
returns int
language sql immutable as $$
  select (floor(gold * pct / 100.0 / 10) * 10)::int
$$;

-- Coin wedges grow with the trip: ×(1 + day/7), so 500 on Day 14 pays 1,500. Practice is ×1.
create or replace function public.pirate_mult(p_day text)
returns numeric
language sql immutable as $$
  select case when p_day < '2026-10-25' then 1 else 1 + (p_day::date - date '2026-10-25' + 1) / 7.0 end
$$;

-- Spins a brand-new (or just-reset) row starts with: 5 per trip day so far, or 5 in practice.
create or replace function public.pirate_start_spins(p_day text)
returns int
language sql immutable as $$
  select case when p_day < '2026-10-25' then 5 else 5 * (p_day::date - date '2026-10-25' + 1) end
$$;

-- Ensure the player's row exists and is current: season reset, daily spin credit.
-- Days only move forward: a stale date (a phone a minute behind midnight) leaves the row alone.
create or replace function public.pirate_open(p_player text, p_season text, p_day text)
returns public.pirate_players
language plpgsql security definer set search_path = public as $$
declare
  r public.pirate_players;
  v_season text := pirate_season(p_day);
  err text := pirate_check(p_player, p_day);
  missed int;
begin
  if err is not null then raise exception 'pirate_open: %', err; end if;
  -- A fresh trip-season row gets 5 spins for every day since Day 1, so skipping Day 1 costs nothing.
  insert into pirate_players (id, day, season, spins) values (p_player, p_day, v_season, pirate_start_spins(p_day))
    on conflict (id) do nothing;
  select * into r from pirate_players where id = p_player for update;
  if p_day < r.day then
    return r;
  end if;
  if r.season <> v_season then
    update pirate_players
      set gold = 1000, shields = 0, mirror = false, spins = pirate_start_spins(p_day), day = p_day, season = v_season, updated_at = now()
      where id = p_player returning * into r;
    insert into pirate_events (season, day, actor, kind) values (v_season, p_day, p_player, 'reset');
  elsif r.day <> p_day then
    missed := p_day::date - r.day::date; -- every day gets its 5, even missed ones
    update pirate_players
      set spins = spins + 5 * missed, day = p_day, updated_at = now()
      where id = p_player returning * into r;
  end if;
  return r;
end $$;

-- Resolve an attack (steal or boom) from r on v. Both rows are already locked. Returns the event kind logged.
create or replace function public.pirate_attack(
  p_kind text, r public.pirate_players, v public.pirate_players, v_season text, p_day text, p_turn_key text,
  out amount int, out outcome text
) language plpgsql security definer set search_path = public as $$
declare
  pct int := case when p_kind = 'steal' then 15 else 20 end;
begin
  amount := 0;
  if v.id is null or v.season <> v_season or pirate_hit(v.gold, pct) = 0 then
    -- nobody to target, a row from another season, or too poor for the hit to round to anything
    outcome := 'none';
    insert into pirate_events (season, day, actor, kind, target, turn_key) values (v_season, p_day, r.id, p_kind || '_none', v.id, p_turn_key);
    return;
  end if;
  amount := pirate_hit(v.gold, pct);
  if p_kind = 'boom' then
    update pirate_players set boomed_day = p_day where id = v.id; -- counts whatever happens next
  end if;
  if v.mirror then
    -- The same hit, sent back: taken from the attacker (capped at what they have).
    outcome := 'reflected';
    amount := least(amount, r.gold);
    update pirate_players set mirror = false, updated_at = now() where id = v.id;
    update pirate_players set gold = gold - amount, updated_at = now() where id = r.id;
    if p_kind = 'steal' then
      update pirate_players set gold = gold + amount, updated_at = now() where id = v.id;
    end if;
    insert into pirate_events (season, day, actor, kind, target, amount, turn_key) values (v_season, p_day, r.id, p_kind || '_reflected', v.id, amount, p_turn_key);
  elsif v.shields > 0 then
    outcome := 'blocked';
    amount := 0;
    update pirate_players set shields = shields - 1, updated_at = now() where id = v.id;
    insert into pirate_events (season, day, actor, kind, target, turn_key) values (v_season, p_day, r.id, p_kind || '_blocked', v.id, p_turn_key);
  else
    outcome := 'hit';
    update pirate_players set gold = gold - amount, updated_at = now() where id = v.id;
    if p_kind = 'steal' then
      update pirate_players set gold = gold + amount, updated_at = now() where id = r.id;
    end if;
    insert into pirate_events (season, day, actor, kind, target, amount, turn_key) values (v_season, p_day, r.id, p_kind, v.id, amount, p_turn_key);
  end if;
end $$;

-- Replay of an earlier call with the same turn key (the response got lost): its original result.
create or replace function public.pirate_replay(p_player text, p_turn_key text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  prev record;
  r public.pirate_players;
begin
  select kind, target, amount into prev from pirate_events where turn_key = p_turn_key;
  if not found then return null; end if;
  select * into r from pirate_players where id = p_player;
  return jsonb_build_object('applied', true, 'replayed', true, 'row', to_jsonb(r), 'victim', prev.target, 'amount', coalesce(prev.amount, 0),
    'outcome', case
      when prev.kind in ('steal', 'boom') then 'hit'
      when prev.kind like '%_blocked' then 'blocked'
      when prev.kind like '%_reflected' then 'reflected'
      when prev.kind like '%_none' then 'none'
      else null end);
end $$;

-- One spin of the wheel. p_kind: win (p_amount in 50/100/150/200/300/500) | spins | shield | steal | boom.
-- A boom only marks the player as "boom pending" (the spin is used); pirate_boom then picks the victim.
-- Returns { applied, reason, replayed, row, victim, amount, outcome } with outcome hit | blocked | reflected | none | null.
create or replace function public.pirate_spin(
  p_player text, p_day text, p_kind text, p_amount int, p_victim text, p_turn_key text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r public.pirate_players;
  v public.pirate_players;
  v_season text := pirate_season(p_day);
  err text := pirate_check(p_player, p_day);
  victim text := null;
  amount int := 0;
  outcome text := null;
  j jsonb;
  a record;
begin
  if err is not null then
    return jsonb_build_object('applied', false, 'reason', err);
  end if;
  if p_turn_key is null then
    return jsonb_build_object('applied', false, 'reason', 'no turn key');
  end if;
  j := pirate_replay(p_player, p_turn_key);
  if j is not null then return j; end if;
  if p_kind not in ('win', 'spins', 'shield', 'steal', 'boom') then
    return jsonb_build_object('applied', false, 'reason', 'bad kind');
  end if;
  if p_kind = 'win' and (p_amount is null or p_amount not in (50, 100, 150, 200, 300, 500)) then
    return jsonb_build_object('applied', false, 'reason', 'bad amount');
  end if;

  if p_kind = 'steal' then
    -- Random victim among the other six who have gold (someone who never opened counts as 1,000),
    -- never the poorest of the seven: last place can't be stolen from (falls back to anyone with gold).
    select c into victim from (
      select c, coalesce((select gold from pirate_players p where p.id = c and p.season = v_season), 1000) as g
      from unnest(array['dad', 'mom', 'rong', 'yao', 'jiet', 'ying', 'hui']) as c
    ) x
    where c <> p_player and g > 0
      and g > (select min(coalesce((select gold from pirate_players p where p.id = c2 and p.season = v_season), 1000))
               from unnest(array['dad', 'mom', 'rong', 'yao', 'jiet', 'ying', 'hui']) as c2)
    order by random() limit 1;
    if victim is null then
      select c into victim
        from unnest(array['dad', 'mom', 'rong', 'yao', 'jiet', 'ying', 'hui']) as c
        where c <> p_player
          and coalesce((select gold from pirate_players p where p.id = c and p.season = v_season), 1000) > 0
        order by random() limit 1;
    end if;
  end if;

  -- Lock rows in id order so two mutual attacks can't deadlock.
  if victim is not null and victim < p_player then
    v := pirate_open(victim, v_season, p_day);
    r := pirate_open(p_player, v_season, p_day);
  else
    r := pirate_open(p_player, v_season, p_day);
    if victim is not null then v := pirate_open(victim, v_season, p_day); end if;
  end if;

  -- A phone a little behind midnight: the row is already on the newer day, play on that day.
  if p_day < r.day then p_day := r.day; v_season := r.season; end if;
  if r.spins <= 0 then
    return jsonb_build_object('applied', false, 'reason', 'no spins', 'row', to_jsonb(r));
  end if;
  update pirate_players set spins = spins - 1, updated_at = now() where id = p_player;

  if p_kind = 'win' then
    amount := (round(p_amount * pirate_mult(p_day) / 10) * 10)::int;
    update pirate_players set gold = gold + amount, updated_at = now() where id = p_player;
    insert into pirate_events (season, day, actor, kind, amount, turn_key) values (v_season, p_day, p_player, 'win', amount, p_turn_key);
  elsif p_kind = 'spins' then
    amount := 3;
    update pirate_players set spins = spins + 3, updated_at = now() where id = p_player;
    insert into pirate_events (season, day, actor, kind, amount, turn_key) values (v_season, p_day, p_player, 'spins', 3, p_turn_key);
  elsif p_kind = 'shield' then
    if r.shields >= 3 then
      amount := 100;
      update pirate_players set gold = gold + 100, updated_at = now() where id = p_player;
      insert into pirate_events (season, day, actor, kind, amount, turn_key) values (v_season, p_day, p_player, 'shield_full', 100, p_turn_key);
    else
      update pirate_players set shields = shields + 1, updated_at = now() where id = p_player;
      insert into pirate_events (season, day, actor, kind, turn_key) values (v_season, p_day, p_player, 'shield', p_turn_key);
    end if;
  elsif p_kind = 'boom' then
    -- Spin used now; the victim comes in pirate_boom. Closing the app in between keeps the bomb waiting.
    update pirate_players set boom_pending = true, updated_at = now() where id = p_player;
    insert into pirate_events (season, day, actor, kind, turn_key) values (v_season, p_day, p_player, 'boom_pending', p_turn_key);
  else
    select * into a from pirate_attack('steal', r, v, v_season, p_day, p_turn_key);
    amount := a.amount;
    outcome := a.outcome;
  end if;

  select * into r from pirate_players where id = p_player;
  return jsonb_build_object('applied', true, 'row', to_jsonb(r), 'victim', victim, 'amount', amount, 'outcome', outcome);
exception when unique_violation then
  -- The same turn key landed concurrently (a retry racing its first call): hand back that result.
  return pirate_replay(p_player, p_turn_key);
end $$;

-- Second half of a boom: choose the victim (null = nobody left to boom). Needs a pending boom.
create or replace function public.pirate_boom(p_player text, p_day text, p_victim text, p_turn_key text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r public.pirate_players;
  v public.pirate_players;
  v_season text := pirate_season(p_day);
  err text := pirate_check(p_player, p_day);
  j jsonb;
  a record;
  n int;
begin
  if err is not null then return jsonb_build_object('applied', false, 'reason', err); end if;
  if p_turn_key is null then return jsonb_build_object('applied', false, 'reason', 'no turn key'); end if;
  j := pirate_replay(p_player, p_turn_key);
  if j is not null then return j; end if;
  if p_victim is not null and (p_victim = p_player or pirate_check(p_victim, p_day) is not null) then
    return jsonb_build_object('applied', false, 'reason', 'bad victim');
  end if;
  if p_victim is not null and p_victim < p_player then
    v := pirate_open(p_victim, v_season, p_day);
    r := pirate_open(p_player, v_season, p_day);
  else
    r := pirate_open(p_player, v_season, p_day);
    if p_victim is not null then v := pirate_open(p_victim, v_season, p_day); end if;
  end if;
  if p_day < r.day then p_day := r.day; v_season := r.season; end if;
  if not r.boom_pending then
    return jsonb_build_object('applied', false, 'reason', 'no boom pending', 'row', to_jsonb(r));
  end if;
  -- No daily limit: the same person can be boomed any number of times a day.
  if p_victim is null then
    -- "Nobody to boom" is only allowed when it's true.
    select count(*) into n from pirate_players p
      where p.id <> p_player and p.season = v_season and pirate_hit(p.gold, 20) > 0;
    if n > 0 or exists (
      select 1 from unnest(array['dad', 'mom', 'rong', 'yao', 'jiet', 'ying', 'hui']) c
      where c <> p_player and not exists (select 1 from pirate_players p where p.id = c and p.season = v_season)
    ) then
      return jsonb_build_object('applied', false, 'reason', 'pick a victim', 'row', to_jsonb(r));
    end if;
  end if;
  update pirate_players set boom_pending = false, updated_at = now() where id = p_player;
  select * into a from pirate_attack('boom', r, v, v_season, p_day, p_turn_key);
  select * into r from pirate_players where id = p_player;
  return jsonb_build_object('applied', true, 'row', to_jsonb(r), 'victim', p_victim, 'amount', a.amount, 'outcome', a.outcome);
exception when unique_violation then
  return pirate_replay(p_player, p_turn_key);
end $$;

-- Buy a mirror for 30% of your gold (at least 300). Public: everyone sees it in the feed.
create or replace function public.pirate_buy_mirror(p_player text, p_day text, p_turn_key text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r public.pirate_players;
  v_season text := pirate_season(p_day);
  err text := pirate_check(p_player, p_day);
  price int;
begin
  if err is not null then return jsonb_build_object('applied', false, 'reason', err); end if;
  if p_turn_key is null then return jsonb_build_object('applied', false, 'reason', 'no turn key'); end if;
  if exists (select 1 from pirate_events where turn_key = p_turn_key) then
    select * into r from pirate_players where id = p_player;
    return jsonb_build_object('applied', true, 'replayed', true, 'row', to_jsonb(r));
  end if;
  r := pirate_open(p_player, v_season, p_day);
  if p_day < r.day then p_day := r.day; v_season := r.season; end if;
  if r.mirror then return jsonb_build_object('applied', false, 'reason', 'mirror held', 'row', to_jsonb(r)); end if;
  price := greatest(300, pirate_hit(r.gold, 30));
  if r.gold < price then return jsonb_build_object('applied', false, 'reason', 'not enough gold', 'row', to_jsonb(r)); end if;
  update pirate_players set gold = gold - price, mirror = true, updated_at = now() where id = p_player returning * into r;
  insert into pirate_events (season, day, actor, kind, amount, turn_key) values (v_season, p_day, p_player, 'mirror_bought', price, p_turn_key);
  return jsonb_build_object('applied', true, 'row', to_jsonb(r), 'amount', price);
end $$;

-- Trade 2 shields for 1 mirror.
create or replace function public.pirate_exchange(p_player text, p_day text, p_turn_key text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r public.pirate_players;
  v_season text := pirate_season(p_day);
  err text := pirate_check(p_player, p_day);
begin
  if err is not null then return jsonb_build_object('applied', false, 'reason', err); end if;
  if p_turn_key is null then return jsonb_build_object('applied', false, 'reason', 'no turn key'); end if;
  if exists (select 1 from pirate_events where turn_key = p_turn_key) then
    select * into r from pirate_players where id = p_player;
    return jsonb_build_object('applied', true, 'replayed', true, 'row', to_jsonb(r));
  end if;
  r := pirate_open(p_player, v_season, p_day);
  if p_day < r.day then p_day := r.day; v_season := r.season; end if;
  if r.mirror then return jsonb_build_object('applied', false, 'reason', 'mirror held', 'row', to_jsonb(r)); end if;
  if r.shields < 2 then return jsonb_build_object('applied', false, 'reason', 'not enough shields', 'row', to_jsonb(r)); end if;
  update pirate_players set shields = shields - 2, mirror = true, updated_at = now() where id = p_player returning * into r;
  insert into pirate_events (season, day, actor, kind, turn_key) values (v_season, p_day, p_player, 'mirror', p_turn_key);
  return jsonb_build_object('applied', true, 'row', to_jsonb(r));
end $$;

grant execute on function public.pirate_check(text, text) to anon, authenticated;
grant execute on function public.pirate_season(text) to anon, authenticated;
grant execute on function public.pirate_hit(int, int) to anon, authenticated;
grant execute on function public.pirate_start_spins(text) to anon, authenticated;
grant execute on function public.pirate_open(text, text, text) to anon, authenticated;
grant execute on function public.pirate_spin(text, text, text, int, text, text) to anon, authenticated;
grant execute on function public.pirate_boom(text, text, text, text) to anon, authenticated;
revoke execute on function public.pirate_attack(text, public.pirate_players, public.pirate_players, text, text, text) from public, anon, authenticated;
revoke execute on function public.pirate_replay(text, text) from public, anon, authenticated;
grant execute on function public.pirate_exchange(text, text, text) to anon, authenticated;
grant execute on function public.pirate_buy_mirror(text, text, text) to anon, authenticated;
grant execute on function public.pirate_mult(text) to anon, authenticated;

alter publication supabase_realtime add table public.pirate_players, public.pirate_events;
