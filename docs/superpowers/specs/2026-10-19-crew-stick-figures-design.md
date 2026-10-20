# Crew stick figures — design

Date: 2026-10-19

> Update (same day): the owner asked for the suitcase and umbrella props to be removed after seeing
> them — too small to read. Everything below about suitcases and umbrellas is no longer built; the
> cast per day (who is present, waving on the home day) stays.

## Intent

A playful strip at the top of the **Today** tab where the seven of us walk around as stick
figures wearing our head stickers. It is there to make the family smile every time they open
the app, before and during the trip. Tapping someone makes them react in their own voice;
dragging them around is just for fun.

## Goals

- The first thing you see on the Today tab is the family wandering about. No tapping needed.
- Tap a figure → it jumps, says a short line in its own voice (zh/en by app language), with a
  little ☘️ burst.
- Drag a figure → it follows your finger, dangles while carried, wobbles when dropped. Drop it
  next to someone → the two high-five once.
- The scene reflects the day being shown on the Today tab: who has arrived, who has gone home,
  suitcases on travel days, umbrellas when today's forecast is rainy.
- Runs smoothly on a 3–4-year-old phone, works offline, respects reduced motion.

## Non-goals

- No shared state (poke counters, positions) across phones. Everything is local and forgotten
  on reload. (A shared poke counter is a possible later addition.)
- No physics engine, no collisions, no sound.
- Not a game; no scoring, no goals.

## Anti-goals (what would make this a failure)

- Making the Today tab heavier or janky: a scene that burns battery, stutters scrolling, or
  delays the day's plan from showing.
- Figures that are hard to tell apart. Each must be recognisable at a glance (head sticker +
  the person's colour).
- Taps that fire while scrolling the page, or drags that fight page scrolling.

## Where it lives

Top of the Today tab, directly under the "你好，捷 👋" greeting and above the countdown /
day switcher. Full width of the content column (max 448px), about 150px tall. It stays
visible while previewing other days and reflects the previewed day.

## The scene

- A flat ground line near the bottom, cream background matching the app. A faint road or
  grass strip is fine; keep it quiet so the figures are the focus.
- Each figure: stick body (head-to-foot ~80px) drawn as inline SVG strokes in the person's
  colour (`person.color`), with the head sticker (`/avatars/<id>.webp`, ~36px) on top. Same
  fallback as `Avatar`: if the image fails, a coloured circle with the initial.
- Figures face the way they walk (flip horizontally).

### Idle behaviour (always on)

- Each figure has a state machine: `walk` (pick a target x within the strip, walk there at a
  gentle speed, legs/arms swing via CSS keyframes) → `stand` (1–4 s, occasionally `wave` to a
  nearby figure) → `walk`. Randomised so they don't move in lockstep.
- Walking keeps figures inside the strip and loosely spaced (don't pile up on one spot).
- Motion loop: one `requestAnimationFrame` loop updating positions in refs and writing CSS
  transforms directly; React re-renders only on state changes (bubble, high-five). Loop pauses
  when the tab is hidden (`visibilitychange`) or the Today tab isn't mounted.
- `prefers-reduced-motion`: figures stand still, spaced evenly; taps still show the bubble
  (no jump); drag still works.

### Trip awareness

Derived from the day currently shown on the Today tab (`day.n`) plus the day's weather.

| Situation | What shows |
|---|---|
| Day 0 (travel day; also what shows before the trip) | All 7, packed and waiting: everyone who flies carries a suitcase; Rong (already in Ireland) doesn't. |
| Day 1 | Dad, Mum, Yao, Jiet, Rong. No suitcases. |
| Day 2–12 | All 7. |
| Day 13 (6 Nov, fly home) | All 7; Dad, Mum, Yao, Jiet, Ying, Hui carry suitcases. |
| Day 14 (home) | All 7, no suitcases, everyone waving. |
| Rain | If the shown day's forecast has rain probability ≥ 50% or a rainy weather code (Open-Meteo codes 51–67, 80–82, 95–99), every figure holds a small umbrella. No forecast → no umbrellas. |

Presence per person lives in a small data table (`arrives` / `leaves` day numbers), not in
if-chains, so it's easy to adjust. The cast is a function of the shown day number only
(builder check, my call): whether today is before the trip doesn't change it, so previewing
day 5 before the trip shows the normal day-5 cast.

### Tap

- A tap (pointer down + up without moving more than ~8px) on a figure:
  - It jumps (CSS keyframe, ~500 ms).
  - A speech bubble appears above it for ~2.5 s with a line from that person's list, picked at
    random but never the same line twice in a row. Lines are bilingual (`L`) and shown via the
    app's `p()`.
  - 4–6 ☘️ particles burst out and fade (CSS animation, DOM nodes removed afterwards).
- Tapping another figure while a bubble is up just adds another bubble; bubbles don't block.

### Drag

- Pointer down on a figure, then moving more than ~8px, starts a drag. `touch-action: none`
  goes on the figures only (builder check, my call), so a swipe that starts on empty ground
  still scrolls the page; use pointer capture so a drag that slips off the figure continues.
- While dragging: the figure is lifted (slightly bigger, stronger shadow) and swings gently
  (`dangle` keyframe). It follows the finger in x; y is clamped to the strip so it can't leave.
- On release: it drops to the ground line with a quick wobble, then resumes idle behaviour
  from the new spot.
- If released within ~40px of another figure, both do a one-shot high-five (arms up + a "✋"
  bubble on each) and then carry on.

### Lines (voice)

Each person gets 5 short lines, zh + en, kept in `lib/crew.ts` alongside the presence table.
Tone: warm and a bit cheeky; references to the trip (keep left, umbrellas, Rong's place, Ying
& Hui's late flight, Dad's credit card for the car, Halloween costumes). The builder writes
them; the family can edit the file later.

## Constraints

- Static export (`next build` → `out/`), no new dependencies; CSS keyframes + a single rAF
  loop + pointer events only.
- No new network calls: rain comes from the same Open-Meteo request DayView already makes.
  Lift `useWeather` out of `DayView` into a shared module so both use one request per day.
- Bilingual via the existing `L` / `p()` pattern and `ui` strings in `lib/i18n.ts`.
- Matches the app's look: cream background, ink text, rounded 3xl cards, Noto Sans SC.
- Works with the service worker's offline caching (avatars are same-origin assets, so they're
  already cache-first).

## Decided

- Location: Today tab, under the greeting (my call, approved in chat).
- Interactions: idle wander, trip-aware cast, rain umbrellas, tap → jump + bubble + ☘️,
  drag → dangle/wobble, drop-near → high-five (approved in chat).
- No shared poke counter in this round.
- Figures are `<button>`s with `aria-label` of the person's name (zh/en).

## Left to the builder

- Exact stick-figure proportions, stroke width, walk/jump/dangle keyframes.
- Speeds, pause lengths, and spacing rules.
- The actual lines for each person (within the tone above).
- How the suitcase and umbrella are drawn (tiny SVG shapes in the person's colour is fine).
- Whether the strip is a `Card` or borderless; whichever looks better in the real app.
