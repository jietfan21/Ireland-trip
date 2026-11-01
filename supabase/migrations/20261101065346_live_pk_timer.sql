-- A private timer advances expired rounds even with no open app.
create extension if not exists pg_cron;
create function duel_private.pk_scheduled_tick() returns void
language plpgsql security definer set search_path='' as $$
begin
 perform duel_private.pk_tick(now());
 if now()>=timestamptz '2026-11-08 00:00:00 Europe/Dublin'
  and not exists(select 1 from duel_private.pk_matches where status in('pending','lobby','active')) then
  perform cron.unschedule('clover-pk-round-timeouts');
 end if;
end $$;
revoke all on function duel_private.pk_scheduled_tick() from public,anon,authenticated;
select cron.schedule('clover-pk-round-timeouts','* * * * *',$job$select duel_private.pk_scheduled_tick();$job$);
