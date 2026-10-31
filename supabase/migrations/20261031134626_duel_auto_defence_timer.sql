-- Resolve virtual-game duels while phones are offline; stop after this trip.
create extension if not exists pg_cron;
create function duel_private.scheduled_tick() returns void
language plpgsql security definer set search_path='' as $$
begin
 perform duel_private.tick(now());
 if now()>=timestamptz '2026-11-08 00:00:00 Europe/Dublin'
  and not exists(select 1 from duel_private.matches where status in('pending','accepted')) then
  perform cron.unschedule('clover-duel-auto-defence');
 end if;
end $$;
revoke all on function duel_private.scheduled_tick() from public,anon,authenticated;
select cron.schedule('clover-duel-auto-defence','* * * * *',$job$select duel_private.scheduled_tick();$job$);
