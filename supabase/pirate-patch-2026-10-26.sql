-- Patch for a live game (keeps all gold, shields and history): run this in the Supabase SQL editor.
-- 1. Bombs: no daily limit, anyone can be boomed any number of times a day.
-- 2. Mirror gold price: 30% of gold, at least 300 (was 20%, at least 200). Shield trade stays at 2.
-- Same function bodies as supabase/pirate.sql. Safe to run more than once.

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

