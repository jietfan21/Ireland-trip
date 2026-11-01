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


## Live PK

Clover Cove → **Duel / Live PK** keeps the bilingual family-name trust model (no login) and virtual gold only. There are no payments or cash-out. New challenges use a live, resumable room; previous duels and outcomes remain available under **Previous duels**.

Choose a captain and stake, send the invitation, and ask them verbally to open PK and join. The invitation/lobby lasts up to 24 hours and can be cancelled before play. No gold or daily allowance is used until **both players tap Ready**. At that point both stakes are checked and reserved atomically. One official outgoing start per Dublin day; unlimited incoming battles. Multiple battles can wait for responses without blocking a captain’s own daily start. Bot practice is free, follows the same five-round flow and never uses the official allowance.

Five islands are worth 1, 2, 3, 4 and 5 points. Each captain has **12 shots for the whole match, with no per-island cap**. Choose only the current round. Choices lock privately and reveal together when both are saved. Players then choose their next move with the previous results visible. The final round uses the remaining budget. Higher shots wins island points; tied islands award neither side points. Highest total wins the pot; a draw refunds both stakes.

Each new round gets **24 hours** from when it opens. Disconnecting has no immediate penalty: return to the saved match and choice. A private per-minute timer saves random valid shots only for missing choices after the deadline, reveals the round and opens a fresh 24-hour window. Late submissions see the saved result and cannot reroll it or accidentally submit to the next round. An unattended match can take several days. New challenges close at 00:00 Dublin on 8 November; already-started PKs retain full round windows and can finish afterward. Unjoined invitations never cross that new-challenge cutoff.

Stakes remain 5/10/20% of the smaller available balance; custom multiples of 10 are capped at 20%. Staked gold stays in wealth rankings and outside wheel attacks. Existing balances are preserved. Practice on 31 October and free bot practice never change gold. Official starts opened on 1 November.

### Deployment

Apply the additive migrations in `supabase/migrations/` in order. Do not rerun the original destructive wheel installer. The new public RPC is `pirate_pk`; room, round and receipt tables are private with RLS and no client table grants. Internal clock/projection helpers are not callable by anonymous clients. The existing public `pirate_duel` permits finishing old matches but rejects new old-style launches with `update_required`.

`clover-pk-round-timeouts` runs every minute and removes itself after the season has closed and all started rooms finish. Its shared advisory lock and ordered player locks match the existing game; scoring and payouts are transactional and exactly once. The old timer continues to finish legacy duels independently.

### Validation

Run `npm run lint`, `npm test`, `npm run test:duel-db`, `npm run test:pk-db`, and `npm run build`.

PostgreSQL integration checks use PGlite and fictional accounts, never the live database. PK coverage includes secret choices, remaining budgets, all-in moves, per-round deadlines, reconnect/late responses, no reroll or duplicate payout, readiness and balance races, invitation expiry, unlimited incoming matches, bot practice, season boundaries, legacy compatibility and private helper permissions.
