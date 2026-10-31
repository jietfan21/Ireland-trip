# 爱尔兰之旅 · Ireland Trip

Mobile web app for the family's 13-day Ireland road trip (24 Oct – 8 Nov 2026).
Simplified Chinese / English, no login.

## What's in it

- **今天 Today** — opens on today's day (by Irish date): plan, drive time, currency, sunset, weather,
  tonight's stay with big Navigate / Call buttons. Before the trip it shows a countdown and lets you preview any day.
- **行程 Trip** — all days at a glance.
- **地图 Map** — route by day with numbered stops; tap a pin to navigate in Google Maps.
- **资料 Info** — stays, flights, car rental rules, emergency numbers.
- **清单 Checklist** — team to-dos, documents, packing (per person) + € / £ / RM / A$ converter.

Everyone taps their name once; the phone remembers it.

All trip content is in `lib/trip.ts`. Booking PINs and confirmation codes are left out on purpose.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in out/
```

## Shared checklist (optional)

Without configuration, ticks are saved on each phone only. To share them across the family:

1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (in Vercel → Project → Environment Variables).

## Deploy

Any static host works (`out/` folder). On Vercel, import this repo — it detects Next.js automatically.

The site has names, addresses and dates but no login: anyone with the link can see it, so share the link only with family.

Live data (map tiles from OpenFreeMap, weather from Open-Meteo, rates from Frankfurter) needs internet;
the app itself is cached for patchy signal.


## Treasure Duel

Clover Cove → **Duel** uses the same dark/gold UI and family avatars. First visits open Duel with a short skippable tour, remembered per captain per device. 31 October 2026 is free practice; official gold attacks open at **00:00 Europe/Dublin on 1 November**. Existing wheel gold is preserved.

### Attack and defend

Choose an opponent and 5/10/20% stake (custom: multiples of 10, capped at 20% of the smaller available balance), arrange all **12 shots** across five islands (0–5 each), and launch. The attacker’s plan locks and both stakes reserve in one transaction. There is no acceptance/decline step and no cancellation for new attacks. One official outgoing attack per Dublin day is counted on launch; incoming attacks are unlimited and do not consume the defender’s own attack. Multiple captains may target the same person.

The defender has 24 hours to lock a plan. If absent, the server chooses one of the 780 valid allocations uniformly, saves it once, and resolves the duel normally. Automatic defence can win. No additional shield penalty is applied. Retries or refreshes cannot reroll or repay. Staked coins stay in wealth rankings and are held outside wheel attacks.

Practice attacks never change gold and do not consume the official allowance. Bot practice is unlimited, even while a human practice attack waits. Unfinished practice is refunded/closed at the official-start boundary. At the trip’s end (00:00 Dublin on 8 November), incomplete attacks with less than a full 24-hour response window are refunded rather than auto-defended early. Older optional invitations retain their original acceptance/refund rules.

Results use a five-round 2D sea-battle reveal with avatars on ships, simultaneous cannon counts, island capture and running scores. **Next round** advances immediately; **Skip to result** shows the saved final result. No reveal control calls a gold mutation. Reduced-motion users get manual, static round results. Hidden browser tabs pause the reveal. The same no-login/family-name trust model remains intentionally enabled for virtual game gold, with no payments or cash-out.

### Database and timer

Apply the three additive migrations in `supabase/migrations/` in order; do not re-run the destructive original wheel installer. Secret plans and replay receipts live in `duel_private`, which has no anonymous schema access. The public RPC remains `pirate_duel`. New clients use `launch`, `lock`, and `state`; old invitation creation is rejected with `update_required`. Existing legacy invitations still work.

The latest migration enables `pg_cron` and runs a private settlement function every minute. The timer settles overdue attacks even with no open phones. API reads also settle due attacks. Both paths use the same advisory lock and row order, so payout happens once. The scheduled job removes itself after the trip ends and all open matches are resolved. Private clock helpers cannot be called by anonymous clients.

### Validation

`npm run lint`, `npm test`, `npm run test:duel-db`, `npm run build`.

The isolated PostgreSQL integration tests apply the original and upgrade migrations against synthetic 1,000-coin accounts using PGlite, never the live project. They cover reservations and gold conservation, forced launch, timer settlement, manual/late defence, no reroll, defender victory, unlimited incoming attacks, missing accounts, invalid plans, season cutoffs, legacy compatibility and keeping pending defences visible behind large practice histories. Reveal reducer tests cover stale timers, rapid Next/Skip and reduced motion.
