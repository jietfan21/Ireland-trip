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
