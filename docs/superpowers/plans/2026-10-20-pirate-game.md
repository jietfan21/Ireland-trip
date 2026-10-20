# Pirate Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A daily draw / bank-or-risk / steal game shared across the family's phones, opened from a 🏴‍☠️ button in the top bar, backed by two Supabase tables and two SQL functions.

**Architecture:** Pure rules (odds, slice picking, day/season calendar, leaderboard shaping, feed text) in `lib/pirate.ts`, unit-tested with `node --test`. All writes go through `pirate_open` / `pirate_apply` SQL functions (relative updates, idempotent by turn key) in `supabase/pirate.sql`, called from a small client module `lib/pirateStore.ts` that also owns realtime/focus/60 s refresh. The UI is one full-screen sheet `components/PirateSheet.tsx` plus a header button in `app/page.tsx`.

**Tech Stack:** Next.js 16 static export, React 19, Tailwind 4, Supabase JS (already a dependency), Postgres (plpgsql), Node 22 `node --test`. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-20-pirate-game-design.md`

**Commits:** none during execution (owner decides when to push; everything uncommitted so far is committed together). Each task ends with `npm test && npm run lint` instead.

## Global Constraints

- Starting gold 1000; slices 💰 +100 (40%), 💎 +300 (15%), 🏴‍☠️ steal 150 (20%), 🛡️ shield (15%), 💣 boom (10%); first draw of the day never a bomb; max 3 draws/day; 3rd draw auto-banks; boom → pot 0 and done; second shield → pot +50; no victims → pot +150; steal = min(150, victim gold).
- Seasons: `practice` until 2026-10-24 inclusive; `trip` from 2026-10-25 (Day 1) to 2026-11-07 (Day 14); from 2026-11-08 no draws, winner shown.
- Dublin calendar day via `irelandToday()`; on `localhost` only, `?today=YYYY-MM-DD` overrides it.
- The client never overwrites a row; only `pirate_open` and `pirate_apply` write game data.
- Bilingual via `L`/`p()` and `ui` keys; cream/ink look, head stickers, person colours.
- Static export; no new dependencies.

## Review Focus

1. Two phones playing the same person at once (allowed by design): the server caps draws at 3 and ignores a repeated `turn_key`; the UI must not show a 4th draw after a refresh. (Task 1 SQL test + Task 5 manual.)
2. A steal lands while the victim is mid-draw: the victim's next `pirate_apply` must not restore the stolen gold (relative updates). (Task 1 SQL test.)
3. Supabase unconfigured or offline: the sheet shows the "needs signal" state and the header button still opens it; no throw. (Task 4.)
4. Season change while the sheet is open (midnight into 25 Oct): next `pirate_open` resets the row and the UI shows 1,000 again without a reload loop. (Task 2 calendar test + Task 5 manual with `?today=`.)
5. A person who never opened the game is stolen from on Day 1: they're treated as a fresh 1,000 and the feed names them. (Task 1 SQL test.)

---

### Task 1: Database schema and functions

**Files:**
- Create: `supabase/pirate.sql`
- Apply to the live project `nnrzkcigcnukgdvvtivg` via the Supabase connector (`apply_migration`, name `pirate_game`), then test with `execute_sql`.

**Interfaces:**
- Produces tables `pirate_players(id text pk, gold int, shield bool, pot int, draws int, done bool, day text, season text, updated_at timestamptz)` and `pirate_events(id bigserial pk, at timestamptz, season text, day text, actor text, kind text, target text, amount int, turn_key text unique)`; RLS: anon may select both; no direct insert/update for anon (writes only via functions).
- `pirate_open(p_player text, p_season text, p_day text) returns pirate_players` — security definer, as the spec describes (create at 1000; season mismatch → reset + 'reset' event; day mismatch → auto-bank pot with 'bank' event if pot > 0, draws 0, done false).
- `pirate_apply(p_player text, p_season text, p_day text, p_kind text, p_victim text, p_turn_key text) returns jsonb` → `{ "applied": bool, "row": <pirate_players>, "stolen": int, "blocked": bool }`. Kinds: 'win' | 'jackpot' | 'shield' | 'boom' | 'steal' | 'found' (no-victim fallback, pot +150) | 'bank'. Rules exactly as the spec's Data section. `kind='bank'` requires pot > 0 or returns applied=false. Steal with `p_victim` null/self → applied=false.
- Both tables added to `supabase_realtime`; `grant execute` on both functions to `anon`.

- [ ] **Step 1: Write `supabase/pirate.sql`** (DDL, RLS, functions, grants, publication). Use `FOR UPDATE` row locks on thief and victim rows (lock in `id` order to avoid deadlocks) inside `pirate_apply`.

- [ ] **Step 2: Apply it** with `apply_migration` (project `nnrzkcigcnukgdvvtivg`, name `pirate_game`).
Expected: `{"success":true}`.

- [ ] **Step 3: SQL tests via `execute_sql`** (each returns the stated value):
  - `select (pirate_open('dad','practice','2026-10-20')).gold` → 1000.
  - Three `pirate_apply('dad','practice','2026-10-20','win',null,'k1'|'k2'|'k3')` → after the 3rd, `row.gold = 1300, pot = 0, done = true` (auto-bank). A 4th with 'k4' → `applied = false`.
  - Repeat with key 'k3' → `applied = false`, gold unchanged (idempotent).
  - `pirate_apply('mom','practice','2026-10-20','steal','dad','k5')` → `stolen = 150`; dad's gold 1150, mom's 1150; a `pirate_events` row with kind 'steal', target 'dad', amount 150.
  - `pirate_apply('yao','practice','2026-10-20','shield',null,'k6')` then `pirate_apply('mom','practice','2026-10-20','steal','yao','k7')` → `blocked = true, stolen = 0`, yao.shield false.
  - Victim with no row: `pirate_apply('mom','practice','2026-10-20','steal','hui','k8')` → stolen 150, hui row exists with gold 850.
  - Day rollover: `pirate_apply('jiet','practice','2026-10-20','win',null,'k9')` (pot 100), then `pirate_open('jiet','practice','2026-10-21')` → gold 1100, pot 0, draws 0, done false.
  - Season reset: `pirate_open('dad','trip','2026-10-25')` → gold 1000, and a 'reset' event for dad.
  - Finally clean up: `delete from pirate_events; delete from pirate_players;`.

- [ ] **Step 4: Verify** `select count(*) from pirate_players` → 0 after cleanup; `npm run lint` unaffected.

---

### Task 2: Rules and calendar in `lib/pirate.ts`

**Files:**
- Create: `lib/pirate.ts`
- Test: `lib/pirate.test.ts` (add to the `npm test` glob automatically)

**Interfaces:**
- Consumes: `type L` from `./trip` (type-only); `people` ids as strings.
- Produces:
  - Constants: `START_GOLD = 1000`, `MAX_DRAWS = 3`, `STEAL = 150`, `FOUND = 150`, `SECOND_SHIELD = 50`, `WIN = 100`, `JACKPOT = 300`, `ODDS: { kind: Slice; weight: number }[]` (win 40, jackpot 15, steal 20, shield 15, boom 10), `TRIP_DAY1 = "2026-10-25"`, `LAST_DAY = "2026-11-07"`.
  - `type Slice = "win" | "jackpot" | "steal" | "shield" | "boom"`.
  - `pickSlice(rnd: () => number, firstDrawOfDay: boolean): Slice` — weighted by ODDS; when `firstDrawOfDay` and the roll is 'boom', re-roll excluding boom (renormalised).
  - `seasonFor(day: string): "practice" | "trip" | "over"` — `< TRIP_DAY1` → practice; `≤ LAST_DAY` → trip; else over.
  - `tripDayNumber(day: string): number` — 1 for TRIP_DAY1 … 14 for LAST_DAY (uses `daysBetween`-style arithmetic on `YYYY-MM-DD`); 0 before, 15+ after.
  - `nextDublinMidnightMs(now: Date): number` — epoch ms of the next 00:00 Europe/Dublin (use `Intl.DateTimeFormat` parts; works across the 25 Oct clock change).
  - `type PlayerRow = { id: string; gold: number; shield: boolean; pot: number; draws: number; done: boolean; day: string; season: string }`.
  - `leaderboard(ids: string[], rows: PlayerRow[], season: string): { id: string; gold: number; shield: boolean; leader: boolean }[]` — missing/other-season rows → 1000, no shield; sorted by gold desc; `leader` true for all tied at max.
  - `victims(me: string, ids: string[], rows: PlayerRow[], season: string): { id: string; gold: number; shielded: boolean; robbable: boolean }[]` — everyone but `me`; `robbable = !shielded && gold > 0`.
  - `type Event = { id: number; at: string; season: string; day: string; actor: string; kind: string; target: string | null; amount: number | null }`.
  - `eventText(e: Event, name: (id: string) => string): L` — zh/en strings for every kind, e.g. steal → `{ zh: "妈妈 从 爸爸 那里偷了 150 💰", en: "Mum stole 150 from Dad 🏴‍☠️" }`; blocked → "…的盾牌挡住了…" / "Dad's shield blocked Mum 🛡️"; jackpot, boom, shield, bank (amount), reset ("新赛季开始" / "New season — everyone back to 1,000").
  - `todayOverride(search: string, hostname: string): string | null` — returns the `today` query value only when hostname is `localhost` or `127.0.0.1` and it matches `YYYY-MM-DD`.

- [ ] **Step 1: Write the failing tests in `lib/pirate.test.ts`**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { ODDS, eventText, leaderboard, nextDublinMidnightMs, pickSlice, seasonFor, todayOverride, tripDayNumber, victims } from "./pirate.ts";

test("odds sum to 100 and cover five slices", () => {
  assert.equal(ODDS.reduce((s, o) => s + o.weight, 0), 100);
  assert.deepEqual(ODDS.map((o) => o.kind).sort(), ["boom", "jackpot", "shield", "steal", "win"]);
});
test("pickSlice follows the cumulative weights", () => {
  assert.equal(pickSlice(() => 0.0, false), "win");
  assert.equal(pickSlice(() => 0.399, false), "win");
  assert.equal(pickSlice(() => 0.40, false), "jackpot");
  assert.equal(pickSlice(() => 0.55, false), "steal");
  assert.equal(pickSlice(() => 0.75, false), "shield");
  assert.equal(pickSlice(() => 0.95, false), "boom");
});
test("first draw of the day is never a bomb", () => {
  for (let i = 0; i < 100; i++) assert.notEqual(pickSlice(() => 0.9 + i / 1000, true), "boom");
});
test("seasons and day numbers", () => {
  assert.equal(seasonFor("2026-10-20"), "practice");
  assert.equal(seasonFor("2026-10-24"), "practice");
  assert.equal(seasonFor("2026-10-25"), "trip");
  assert.equal(seasonFor("2026-11-07"), "trip");
  assert.equal(seasonFor("2026-11-08"), "over");
  assert.equal(tripDayNumber("2026-10-25"), 1);
  assert.equal(tripDayNumber("2026-11-07"), 14);
});
test("next Dublin midnight across the clock change", () => {
  // 24 Oct 2026 23:30 Dublin (IST, UTC+1) → midnight 25 Oct is 23:00Z; 25 Oct clocks go back so 26 Oct 00:00 is 00:00Z
  assert.equal(nextDublinMidnightMs(new Date("2026-10-24T22:30:00Z")), Date.parse("2026-10-24T23:00:00Z"));
  assert.equal(nextDublinMidnightMs(new Date("2026-10-25T12:00:00Z")), Date.parse("2026-10-26T00:00:00Z"));
});
const rows = [
  { id: "dad", gold: 1300, shield: true, pot: 0, draws: 3, done: true, day: "2026-10-25", season: "trip" },
  { id: "mom", gold: 1300, shield: false, pot: 0, draws: 1, done: false, day: "2026-10-25", season: "trip" },
  { id: "yao", gold: 2000, shield: false, pot: 0, draws: 0, done: false, day: "2026-10-20", season: "practice" },
];
test("leaderboard: missing and old-season rows are 1000; ties share the crown", () => {
  const lb = leaderboard(["dad", "mom", "yao", "jiet"], rows, "trip");
  assert.deepEqual(lb.map((x) => [x.id, x.gold, x.leader]), [["dad", 1300, true], ["mom", 1300, true], ["yao", 1000, false], ["jiet", 1000, false]]);
  assert.equal(lb[0].shield, true);
});
test("victims: not me, shielded greyed, zero gold not robbable", () => {
  const v = victims("mom", ["dad", "mom", "yao"], [...rows, { ...rows[1], id: "yao", gold: 0 }], "trip");
  assert.deepEqual(v.map((x) => [x.id, x.robbable]), [["dad", false], ["yao", false]]);
});
test("event text", () => {
  const name = (id: string) => ({ dad: "Dad", mom: "Mum" })[id] ?? id;
  const e = { id: 1, at: "", season: "trip", day: "2026-10-25", actor: "mom", kind: "steal", target: "dad", amount: 150 };
  assert.equal(eventText(e, name).en, "Mum stole 150 from Dad 🏴‍☠️");
  assert.match(eventText({ ...e, kind: "blocked", amount: 0 }, name).en, /shield/);
  assert.match(eventText({ ...e, kind: "reset", target: null, amount: null }, name).en, /1,000/);
});
test("today override only on localhost", () => {
  assert.equal(todayOverride("?today=2026-10-27", "localhost"), "2026-10-27");
  assert.equal(todayOverride("?today=2026-10-27", "ireland-trip.vercel.app"), null);
  assert.equal(todayOverride("?today=nope", "localhost"), null);
});
```

- [ ] **Step 2: Run** `node --test lib/pirate.test.ts` → fails: cannot find module './pirate.ts'.
- [ ] **Step 3: Implement `lib/pirate.ts`** per Interfaces.
- [ ] **Step 4: Run** `npm test` → all pass (crew 11 + pirate 9). `npm run lint` clean.

---

### Task 3: Client store `lib/pirateStore.ts`

**Files:**
- Create: `lib/pirateStore.ts`
- Modify: `lib/store.ts` — export the `db()` accessor (rename to `supabase()` export) so both stores share one client.

**Interfaces:**
- Consumes: `supabase()` from `./store`; `PlayerRow`, `Event`, `Slice` from `./pirate`.
- Produces:
  - `usePirate(me: string | null, today: string)` → `{ ready: boolean; online: boolean; rows: PlayerRow[]; events: Event[]; mine: PlayerRow | null; open(): Promise<void>; apply(kind: Slice | "found" | "bank", victim?: string): Promise<{ applied: boolean; stolen: number; blocked: boolean }>; refresh(): Promise<void> }`.
  - `open()` calls `pirate_open(me, season, today)` and refreshes; `apply()` generates a `turn_key` (`crypto.randomUUID()`), calls `pirate_apply`, retries once on network error with the same key, then refreshes. `online=false` when `supabase()` is null or the last call threw.
  - Subscribes to `postgres_changes` on both tables, reloads on `focus`, every 60 s, and when `today` changes (season/day rollover triggers `open()` again).

- [ ] **Step 1:** Export `supabase()` from `lib/store.ts` (keep `useTicks` using it). `npm run lint` clean.
- [ ] **Step 2:** Implement `usePirate` as specified. Reads: `pirate_players` (all rows), `pirate_events` where `season = current` ordered by `at desc` limit 30.
- [ ] **Step 3:** `npm run lint && npm run build` green.

---

### Task 4: The sheet and the header button

**Files:**
- Create: `components/PirateSheet.tsx`
- Modify: `app/page.tsx` (Header: 🏴‍☠️ button left of the avatar, red dot; `pirate` state to open/close the sheet)
- Modify: `lib/i18n.ts` (keys: `pirate`, `practiceBanner`, `dayOf`, `draw`, `bank`, `riskIt`, `drawAgain`, `doneToday`, `nextDay`, `pickVictim`, `needsSignal`, `leaderboard`, `feed`, `howToPlay`, `gameOver`, `king`, `pot`, `drawsLeft`, plus one caption per slice `cap_win`, `cap_jackpot`, `cap_steal`, `cap_shield`, `cap_shield2`, `cap_boom`, `cap_found`, `cap_blocked`)
- Modify: `app/globals.css` (keyframes: `pirate-roll` flicker, `pirate-land` scale-in)

**Interfaces:**
- Consumes: `usePirate` (Task 3); `pickSlice`, `seasonFor`, `tripDayNumber`, `nextDublinMidnightMs`, `leaderboard`, `victims`, `eventText`, `todayOverride` (Task 2); `Avatar`, `useApp`, `irelandToday` from `./common`; `people` from `@/lib/trip`.
- Produces: `export default function PirateSheet({ onClose }: { onClose: () => void })`; `export function useDrawAvailable(me: string | null): boolean` (for the header dot: true when online, season ≠ over, and `mine` is null or `!done && draws < 3`).

- [ ] **Step 1: Sheet skeleton.** Fixed full-screen, cream background, scrollable, `pt-safe`, header row (title, season/day label, ✕). States in order of precedence: needs-signal → game over (final leaderboard + 👑) → playing. `today = todayOverride(location.search, location.hostname) ?? irelandToday()`, re-evaluated every minute.
- [ ] **Step 2: Your card** (sticker 52px, gold big, 🛡️, pot chip, ●●○ draws).
- [ ] **Step 3: Draw flow.** `DRAW` → `slice = pickSlice(Math.random, mine.draws === 0)`; if `steal`: show victim picker first (list from `victims()`; if none robbable → `apply("found")` directly); otherwise `apply(slice)` immediately, then play the roll (1.2 s flicker through the 5 emojis, then land on the result with the caption). After landing: if `done` → "Done for today" + countdown to `nextDublinMidnightMs`; else if `pot > 0` → BANK / RISK IT; else → Draw again / Done (Done = just close the action area; the turn stays open).
- [ ] **Step 4: Leaderboard, feed, rules** sections below. Feed via `eventText` and `p()`.
- [ ] **Step 5: Header button** in `app/page.tsx`: `<button aria-label={t("pirate")}>🏴‍☠️</button>` with a red dot (`useDrawAvailable(person?.id)`), opens `<PirateSheet>`; hidden while `!person`.
- [ ] **Step 6:** `npm run lint && npm run build` green.

---

### Task 5: Manual verification in the browser (dev server with `.env.local`)

- [ ] **Step 1:** `npm run dev`; open `http://localhost:3000/?today=2026-10-20`; pick Jiet; tap 🏴‍☠️. Expected: practice banner, 1,000 gold, DRAW button, leaderboard of 7 at 1,000, empty feed.
- [ ] **Step 2:** Draw up to three times, choosing RISK IT; expected: roll animation, pot rises/boom clears it, 3rd draw auto-banks, "Done for today" with a countdown; feed shows the events; `pirate_events` rows visible via `execute_sql`.
- [ ] **Step 3:** Second tab as Mum: steal from Jiet (pick victim list), expected 150 moves and the feed line appears on both tabs without reload.
- [ ] **Step 4:** `?today=2026-10-25` → both reset to 1,000 with "Day 1 of 14" and a reset event; `?today=2026-11-08` → winner screen.
- [ ] **Step 5:** Stop Supabase access (bad key in `.env.local` temporarily or offline in devtools) → "needs signal" state; restore.
- [ ] **Step 6:** Clean the test data: `delete from pirate_events; delete from pirate_players;`. Mobile preset screenshot of the sheet.
