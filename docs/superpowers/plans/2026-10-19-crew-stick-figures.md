# Crew Stick Figures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A strip at the top of the Today tab where the 7 family members wander as stick figures with their head stickers, react to taps, can be dragged, and reflect the shown day and its weather.

**Architecture:** Pure logic (who is present, suitcases, rain, line picking) lives in `lib/crew.ts` and is unit-tested with `node --test`. The weather fetch moves out of `DayView` into `lib/weather.ts` so Today fetches once and passes it to both `DayView` and the new `components/Crew.tsx`. `Crew.tsx` owns all motion: one `requestAnimationFrame` loop writes transforms into refs; React state is only for bubbles/bursts/high-fives; CSS keyframes in `app/globals.css` do walk/jump/dangle/wobble.

**Tech Stack:** Next.js 16 static export, React 19, Tailwind 4, TypeScript 5.9, Node 22 (`node --test` with built-in type stripping). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-19-crew-stick-figures-design.md`

**Commits:** none during execution. The owner has uncommitted work (itinerary, head stickers, checklist presets) and is choosing when to push; everything is committed together when they say so. Each task ends with `npm run lint` (tsc) instead.

## Global Constraints

- No new dependencies; CSS keyframes + one rAF loop + pointer events only.
- Static export: `npm run build` must stay green; nothing server-side.
- No new network calls: rain comes from the existing Open-Meteo request (one per shown day).
- Bilingual via `L` + `p()`; aria-labels use the person's name in the current language.
- Look: cream background `#f5f2ea`, ink `#17322d`, person colours from `people[].color`, Noto Sans SC.
- Strip ≈150px tall, full content width (max 448px), under the greeting on the Today tab.
- Tap = pointer down/up moving ≤ 8px. Drag starts beyond 8px. High-five when dropped within 40px of another figure. Bubble 2.5 s, jump ~500 ms.
- Umbrellas when rain probability ≥ 50 or weather code in 51–67, 80–82, 95–99.
- `touch-action: none` on figures only; pointer capture during drag.
- Respect `prefers-reduced-motion`: no loop, figures evenly spaced, taps show bubble without jump.
- Loop pauses when `document.hidden`.

## Review Focus

1. Strip width is 0 on first render and changes on rotate → figures must be clamped to the measured width; never positioned off-screen. (Task 4: ResizeObserver + clamp on every frame.)
2. Head image fails to load (offline first run) → coloured circle with initial, figure still interactive. (Task 4: `onError` fallback like `Avatar`.)
3. Finger moves > 8px then lifts (a scroll attempt that started on a figure) → no bubble, no jump; figure ends where the finger left it. (Task 5 manual check.)
4. Today tab hidden (switch app) → rAF loop stops; coming back resumes without a jump in positions (use elapsed-time clamp ≤ 50 ms per frame). (Task 4.)
5. Weather request fails or is offline → `weather` is `null`, no umbrellas, scene renders and animates normally. (Task 2 unit test `isRainy(null) === false`; Task 5 manual check with network off.)

---

### Task 1: Weather hook shared by DayView and Today

**Files:**
- Create: `lib/weather.ts`
- Modify: `components/DayView.tsx` (remove local `Weather`, `weatherIcon`, `useWeather`; take `weather` as a prop)
- Modify: `components/TodayView.tsx` (call `useWeather(day)` and pass it down)

**Interfaces:**
- Produces: `export type Weather = { max: number; min: number; rain: number; code: number } | null`, `export function useWeather(day: Day): Weather`, `export function weatherIcon(code: number): string` in `lib/weather.ts`. `DayView` props become `{ day: Day; weather: Weather }`.

- [ ] **Step 1: Confirm `DayView` is only rendered by `TodayView`**

Run: `grep -rn "<DayView" components app`
Expected: one hit, in `components/TodayView.tsx`. (If there were others, they'd need the prop too.)

- [ ] **Step 2: Move `Weather`, `weatherIcon`, `useWeather` from `components/DayView.tsx` into `lib/weather.ts`** (`"use client"` at the top; the fetch body is unchanged).

- [ ] **Step 3: `DayView({ day, weather }: { day: Day; weather: Weather })`** — import `weatherIcon` and `Weather` from `@/lib/weather`; delete the local hook call.

- [ ] **Step 4: In `TodayView`, `const weather = useWeather(day);` after `const day = days[idx];` and render `<DayView day={day} weather={weather} />`.**

Note: `useWeather` must be called unconditionally; place it before the `if (!today) return null` early return by computing `day` from `idx` first (idx defaults to 0, so `days[idx]` always exists).

- [ ] **Step 5: Verify**

Run: `npm run lint && npm run build`
Expected: no TypeScript errors; build green. Open the site: the weather tile on Today still shows a forecast.

---

### Task 2: Crew data + pure logic

**Files:**
- Create: `lib/crew.ts`
- Test: `lib/crew.test.ts`

**Interfaces:**
- Consumes: `type L` from `./trip` (type-only import so Node can run the test without a bundler; do not import values from `./trip`).
- Produces:
  - `export type CrewMember = { id: string; arrives: number; leaves: number; local: boolean; lines: L[] }`
  - `export const crew: CrewMember[]` — one entry per `people[].id`: dad/mom/yao/jiet `arrives: 1, leaves: 13`; rong `arrives: 1, leaves: 99, local: true`; ying/hui `arrives: 2, leaves: 13`. 5 `lines` each in the spec's tone.
  - `export type Cast = { id: string; suitcase: boolean; waving: boolean }`
  - `export function castForDay(n: number): Cast[]` — day 0: all, suitcase = `!local`; day 1–12: members with `arrives <= n`, no suitcases; day 13: all, suitcase = `leaves === 13`; day 14: all, no suitcases, `waving: true`.
  - `export function isRainy(w: { rain: number; code: number } | null): boolean`
  - `export function pickLine(count: number, last: number, rnd: () => number = Math.random): number` — index in `[0, count)`, never `=== last` when `count > 1`.

- [ ] **Step 1: Write the failing tests in `lib/crew.test.ts`**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { castForDay, crew, isRainy, pickLine } from "./crew.ts";
import { people } from "./trip.ts";

const ids = (n: number) => castForDay(n).map((c) => c.id).sort();
const all = people.map((p) => p.id).sort();

test("crew covers exactly the people", () => assert.deepEqual(crew.map((c) => c.id).sort(), all));
test("day 0: everyone, flyers have suitcases, Rong doesn't", () => {
  const c = castForDay(0);
  assert.deepEqual(c.map((x) => x.id).sort(), all);
  assert.equal(c.find((x) => x.id === "rong")!.suitcase, false);
  assert.ok(c.filter((x) => x.id !== "rong").every((x) => x.suitcase));
  assert.ok(c.every((x) => !x.waving));
});
test("day 1: Ying & Hui not yet", () => assert.deepEqual(ids(1), ["dad", "jiet", "mom", "rong", "yao"]));
test("day 2 and 12: everyone, no suitcases", () => {
  for (const n of [2, 12]) {
    assert.deepEqual(ids(n), all);
    assert.ok(castForDay(n).every((x) => !x.suitcase && !x.waving));
  }
});
test("day 13: everyone except Rong carries a suitcase", () => {
  const c = castForDay(13);
  assert.deepEqual(c.map((x) => x.id).sort(), all);
  assert.deepEqual(c.filter((x) => x.suitcase).map((x) => x.id).sort(), all.filter((x) => x !== "rong"));
});
test("day 14: everyone waving, no suitcases", () => assert.ok(castForDay(14).every((x) => x.waving && !x.suitcase)));
test("every member has 5 bilingual lines", () =>
  assert.ok(crew.every((m) => m.lines.length === 5 && m.lines.every((l) => l.zh && l.en))));

test("isRainy", () => {
  assert.equal(isRainy(null), false);
  assert.equal(isRainy({ rain: 50, code: 1 }), true);
  assert.equal(isRainy({ rain: 20, code: 61 }), true);
  assert.equal(isRainy({ rain: 20, code: 80 }), true);
  assert.equal(isRainy({ rain: 20, code: 95 }), true);
  assert.equal(isRainy({ rain: 20, code: 2 }), false);
  assert.equal(isRainy({ rain: 49, code: 71 }), false);
});

test("pickLine never repeats the last line", () => {
  for (let i = 0; i < 20; i++) assert.notEqual(pickLine(5, 2, () => i / 20), 2);
  assert.equal(pickLine(1, 0), 0);
  const k = pickLine(5, 4, () => 0.999);
  assert.ok(k >= 0 && k < 5 && k !== 4);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test lib/crew.test.ts`
Expected: fails with "Cannot find module './crew.ts'".

- [ ] **Step 3: Implement `lib/crew.ts`** per the Interfaces block. `pickLine`: `if (count <= 1) return 0; const k = Math.floor(rnd() * (count - 1)); return k >= last ? k + 1 : k;`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test lib/crew.test.ts`
Expected: all pass. Then `npm run lint` clean.

---

### Task 3: Keyframes

**Files:**
- Modify: `app/globals.css` (append)

**Interfaces:**
- Produces CSS classes used by Task 4: `.crew-walk` (legs/arms swing, 0.55 s infinite, applied to the figure while walking), `.crew-jump` (translateY −22px and back, 500 ms), `.crew-dangle` (rotate ±8°, 0.9 s infinite, origin top centre), `.crew-wobble` (rotate −6°/5°/−2°/0, 450 ms), `.crew-wave` (arm rotates ±25° at the shoulder, 0.5 s ×3), `.crew-burst` (`--dx`/`--dy` custom props; translate to them, scale 0.4→1.1, fade; 700 ms forwards), `.crew-bubble-in` (scale 0.6→1 + fade, 180 ms). All wrapped so that under `@media (prefers-reduced-motion: reduce)` `.crew-walk`, `.crew-dangle`, `.crew-jump` have no animation.

- [ ] **Step 1: Append the keyframes and classes to `app/globals.css`.** Swinging limbs: the SVG groups `.leg-l`, `.leg-r`, `.arm-l`, `.arm-r` inside `.crew-walk` animate `rotate` around `transform-origin` at the hip/shoulder (`transform-box: fill-box` + `transform-origin: top center`), legs in antiphase.

- [ ] **Step 2: Verify**

Run: `npm run build`
Expected: green (Tailwind 4 passes plain CSS through unchanged).

---

### Task 4: The Crew scene component

**Files:**
- Create: `components/Crew.tsx`
- Modify: `components/TodayView.tsx` (render `<Crew day={day} weather={weather} />` right under the greeting `<p>`; above the countdown)

**Interfaces:**
- Consumes: `castForDay`, `crew`, `isRainy`, `pickLine` (Task 2); `Weather` (Task 1); `people`, `type Person` from `@/lib/trip`; `useApp` from `./common`; CSS classes (Task 3).
- Produces: `export default function Crew({ day, weather }: { day: Day; weather: Weather })`.

- [ ] **Step 1: Layout.** A `div` strip: `relative h-[150px] w-full overflow-hidden rounded-3xl`, cream background, a 2px ground line at `bottom: 18px` in `--color-line`. Measure width with a `ResizeObserver` into a ref (`widthRef`). Figures are absolutely positioned `button`s (`type="button"`, `aria-label={p(person)}`, `touch-action: none`, `user-select: none`, `-webkit-user-drag: none`) sized 40×80, bottom at the ground line; the `transform` is written directly to the DOM node from the loop: `translateX(${x}px) scaleX(${dir})`. Inside: head (`<img src="/avatars/{id}.webp">` 36px, `onError` → coloured circle with `person.zh.slice(-1)`, like `Avatar`), body as inline SVG `viewBox="0 0 40 60"` with stroke `person.color`, width 3, round caps: torso, two arms, two legs as groups `.arm-l .arm-r .leg-l .leg-r`; optional suitcase (small rounded rect hanging from the right hand) and umbrella (an arc + stick above the head) in `person.color`.

- [ ] **Step 2: Cast.** `const cast = useMemo(() => castForDay(day.n), [day.n])`; render one figure per cast entry (look up `people.find`). `const rainy = isRainy(weather)`. When the cast changes, keep existing figures' positions and give new ones a random x.

- [ ] **Step 3: Motion loop.** Per-figure state in a `useRef<Map<string, Fig>>` where `type Fig = { x: number; dir: 1 | -1; mode: "walk" | "stand" | "drag"; target: number; until: number }`. One `requestAnimationFrame` loop started in `useEffect`, cancelled on unmount; it also stops on `visibilitychange` when `document.hidden` and restarts when visible. Each frame: `dt = min(50, now - last)`; walking figures move toward `target` at 18–30 px/s (per-figure speed), arrive → `stand` for 1–4 s; standing figures past `until` pick a new target in `[8, width - 48]` retrying up to 5 times until ≥ 44 px from every other figure's x. When a figure starts standing and another figure is within 60 px, 20 % chance to add `.crew-wave` for 1.5 s. Clamp every x to `[0, width - 40]` each frame. Toggle class `crew-walk` on the node when mode is `walk`. Reduced motion (`matchMedia("(prefers-reduced-motion: reduce)").matches`): no loop; x = evenly spaced across the width.

- [ ] **Step 4: Tap.** `onPointerDown`: record `{id, x0, y0, moved: false}` and `setPointerCapture`. `onPointerMove`: if distance > 8 → `moved = true`, mode `drag`, add `.crew-dangle`, set x to `pointerX - stripLeft - 20` (clamped). `onPointerUp`: if `!moved` → tap: add `.crew-jump` for 500 ms (skip under reduced motion), push a bubble `{ id, key, text: p(line) }` using `pickLine(5, lastLineRef[id])`, remove it after 2500 ms; spawn 5 `.crew-burst` spans with random `--dx` in ±36px and `--dy` in −20…−56px, removed after 700 ms. If `moved` → drop: mode `stand` with `until = now + 800`, swap `.crew-dangle` for `.crew-wobble` (450 ms); if another figure is within 40 px, set `hiFive` on both for 900 ms (arms-up: add `.crew-wave` to both and a "✋" bubble on each).

- [ ] **Step 5: Bubble.** Absolutely positioned above the head, centred, `max-w-[160px]`, white, `rounded-2xl`, border `--color-line`, `text-[13px]`, ink, small triangle tail; it must not flip with `scaleX` (render bubbles in the strip, not inside the figure's transformed node, positioned from `fig.x`).

- [ ] **Step 6: Wire into `TodayView`** under the greeting. Build must pass: `npm run lint && npm run build`.

---

### Task 5: Manual verification in the browser

**Files:** none.

- [ ] **Step 1:** `npm run build`, serve `out/` on a local port, open the Today tab (pick a person first). Expected: 7 figures with heads and suitcases (today is before the trip, so day 0 shows), wandering and pausing; no console errors.
- [ ] **Step 2:** Preview day 1 with ▶. Expected: Ying and Hui disappear, no suitcases. Day 13: suitcases on everyone except Rong. Day 14: everyone waving.
- [ ] **Step 3:** Tap Dad. Expected: jump, bubble with one of Dad's lines in the current language, ☘️ burst, bubble gone after ~2.5 s. Toggle EN and tap again: English line.
- [ ] **Step 4:** Drag Mum next to Dad and release. Expected: dangles while carried, wobbles on drop, both raise arms and show ✋.
- [ ] **Step 5:** Press on a figure, move 30 px, release. Expected: no bubble, figure stays where released.
- [ ] **Step 6:** Mobile preset (375 px wide): nothing cut off, page still scrolls when swiping on empty ground. Switch tab to Trip and back: figures still animate.
- [ ] **Step 7:** With the browser set to a rainy forecast day (or by temporarily stubbing `weather` to `{ rain: 90, code: 61, max: 10, min: 7 }`), umbrellas show; with `null`, none. Remove any stub afterwards.
