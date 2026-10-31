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

Clover Cove → **Duel** uses the same family avatars and dark/gold game UI. 31 October 2026 is free practice; official gold challenges open automatically at **00:00 Europe/Dublin on 1 November**, and close with the trip on 8 November. This does not reset existing wheel gold. Unfinished practice invitations expire at the official start.

Each captain can start one accepted official challenge per Dublin day and accept unlimited incoming invitations. Incoming battles do not block a counter-invite to the sender. Stakes are 5/10/20% of the smaller available balance (custom: multiples of 10, capped at 20%). Reserved coins are held outside wheel attacks, remain in wealth rankings, and return on cancellation/decline/expiry; accepted challenges expire after 24 hours. Plans are stored in a private schema and returned only after both lock. The family-name/no-login trust model remains the same as the existing wheel; this is virtual game gold with no payments or cash-out.

Before releasing the UI, apply `supabase/migrations/20261031122859_treasure_duel.sql` to the existing Ireland Trip project. This is additive; do **not** re-run the destructive wheel installer. The new RPC is `pirate_duel`; its internal helper and tables cannot be accessed by anonymous clients.

Validation: `npm test`, `npm run lint`, `npm run test:duel-db`, `npm run build`. The database test runs the actual migration against an isolated PostgreSQL engine (PGlite), using fictional 1,000-coin accounts, and never connects to the live project.
