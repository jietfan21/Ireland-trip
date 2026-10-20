# Pirate Game v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the pirate game to v2: 10 equal wedges, a spins balance (+5/day, +3 wedge, no cap), server-chosen steal victims, chosen boom victims, hidden shields (max 3), a 2-shields→1-mirror exchange that reflects the same hit, gold always visible.

**Architecture:** Same shape as v1: pure rules in `lib/pirate.ts` (node tests), SQL functions in `supabase/pirate.sql` doing every write atomically with relative updates and turn-key replay, `lib/pirateStore.ts` as the thin client, `components/PirateSheet.tsx` as the sheet. v1 tables are dropped and recreated (no real data). The wheel component gains 10 wedges.

**Tech Stack:** unchanged (Next 16 static export, React 19, Tailwind 4, Supabase JS, plpgsql, `node --test`).

**Spec:** `docs/superpowers/specs/2026-10-20-pirate-game-v2-design.md` (+ v1 spec for unchanged parts).

**Commits:** none during execution (owner decides); each task ends with `npm test && npm run lint`.

## Global Constraints

- Wedges in order: 💰50, 🏴‍☠️ steal, 💰100, 🛡️ shield, 💰150, 💣 boom, 💰200, 🎰 +3 spins, 💰300, 💰500; uniform 10% each.
- Spins: +5 per Dublin day elapsed, carry over, no cap; the 🎰 wedge adds 3 (the spin is still consumed).
- Shields max 3 (a 4th → +100 gold, kind `shield_full`); mirror max 1; exchange = shields −2, mirror +1.
- Steal 15%, boom 20%, floor to 10s, computed on the victim; reflect applies that amount to the attacker capped at the attacker's gold; defence order mirror → shield → hit.
- Server validation as v1 (allowlist, ±1 day, ≤ 2026-11-07, forward-only, season from date, turn-key replay).
- Nobody's shields/mirror visible except your own. Gold always visible.
- Static export, no new deps, bilingual, app look.

## Review Focus

1. Attacker and victim are the same person via a crafted call → rejected (Task 1 SQL test).
2. Steal when every other player has 0 gold → `outcome: 'none'`, spin still consumed, event `steal_none` (Task 1 test, Task 4 caption).
3. Mirror + shields held: mirror triggers first and shields untouched (Task 1 test).
4. Several days missed → spins credited ×days, and the Day-1 reset sets spins to exactly 5 even if days were missed across the boundary (Task 1 test).
5. Reflected amount capped at the attacker's gold; nobody goes below 0 (Task 1 test).

---

### Task 1: Database v2

**Files:** rewrite `supabase/pirate.sql`; apply via connector as migration `pirate_v2` (drop v1 tables/functions first); SQL assertions via `execute_sql`.

**Interfaces (produces):**
- `pirate_players(id pk, gold int default 1000, shields int default 0, mirror bool default false, spins int default 5, day text, season text, updated_at)`; `pirate_events(id, at, season, day, actor, kind, target, amount, turn_key unique)`; RLS select-only for anon; realtime publication.
- `pirate_open(p_player, p_season, p_day) → pirate_players` (spec).
- `pirate_spin(p_player, p_day, p_kind, p_amount int, p_victim, p_turn_key) → jsonb {applied, reason, replayed, row, victim, amount, outcome}`; outcome ∈ `hit|blocked|reflected|none|null`.
- `pirate_exchange(p_player, p_day, p_turn_key) → jsonb {applied, reason, row}`.
- Event kinds exactly: `win, spins, shield, shield_full, mirror, steal, boom, steal_blocked, boom_blocked, steal_reflected, boom_reflected, steal_none, reset`.

- [ ] **Step 1:** Write the SQL (helpers `pirate_check`, `pirate_season` kept; `pirate_hit(gold int, pct int) → int` = `floor(gold*pct/100/10)*10`). Random steal victim: `select id from pirate_players where id <> p_player and id in (allowlist) and gold > 0 order by random() limit 1` after `pirate_open`-ing all seven? No: open only the chosen victim; people without a row count as 1,000 → pick among allowlist ids, treating missing rows as 1,000 (create via `pirate_open` on pick). Lock order by id.
- [ ] **Step 2:** `apply_migration` `pirate_v2` → success.
- [ ] **Step 3:** SQL assertions (DO block, dates = Dublin today ±1): open creates gold 1000/spins 5; win 200 → gold 1200, spins 4; spins wedge → spins +3 −1; shield ×3 then 4th → gold +100 and kind `shield_full`; exchange with 1 shield → rejected; with 2 → mirror true, shields 0; steal (seeded victims) → victim −15% floor10, actor +; boom on chosen → −20%; boom on shielded → blocked, shields −1; boom on mirrored → reflected: attacker −amount (computed on victim), victim unchanged, mirror false; steal on mirrored → attacker −amount, victim +amount; mirror beats shield; attacker with less gold than the reflected amount → loses all, not negative; steal when all others 0 → outcome none; spins 0 → rejected 'no spins'; replay same key → replayed true; missed 3 days → +15 spins; season reset → spins 5; self-victim → rejected; cleanup.

### Task 2: Rules v2 in `lib/pirate.ts`

**Files:** `lib/pirate.ts`, `lib/pirate.test.ts` (rewrite the v1 slice tests).

**Produces:** `WEDGES: { kind: Wedge; amount?: number; emoji; label: L; color }[]` (10, in order), `type Wedge = "win"|"steal"|"shield"|"boom"|"spins"`, `pickWedge(rnd): number` (index, uniform), `hitAmount(gold, pct)`, `DAILY_SPINS=5`, `BONUS_SPINS=3`, `MAX_SHIELDS=3`, `STEAL_PCT=15`, `BOOM_PCT=20`, `COIN_AMOUNTS=[50,100,150,200,300,500]`; `PlayerRow` v2 (`shields, mirror, spins`); `leaderboard` (no shield field); `victims(me, ids, rows, season)` → `{id, gold}` with gold > 0 (for boom); `eventText` for all 13 kinds; keep `seasonFor`, `tripDayNumber`, `nextDublinMidnightMs`, `todayOverride`, `visibleEvents`.

- [ ] Tests first (RED): wedge order/uniform pick (`pickWedge(()=>0.05)=0`, `0.95→9`), `hitAmount(1234,15)=180`, `hitAmount(40,20)=0`, leaderboard ties, victims excludes me and 0-gold, eventText samples for steal/boom/blocked/reflected/none/spins/mirror/reset (en strings asserted), calendar tests kept.
- [ ] Implement → `npm test` green, `npm run lint` clean.

### Task 3: Store v2 `lib/pirateStore.ts`

**Produces:** `usePirate(me, today)` → `{ ready, online, rows, events, mine, season, dbSeason, open, spin(kind, amount?, victim?) → SpinResult, exchange() → {applied, reason}, refresh }` with `SpinResult = { applied, reason?, replayed?, row?, victim?: string|null, amount: number, outcome: "hit"|"blocked"|"reflected"|"none"|null }`; `useDrawAvailable` → true when row missing/old day or `spins > 0`; `usePirateLeaders` unchanged.

- [ ] Implement; `npm run lint && npm run build` green.

### Task 4: Sheet v2 `components/PirateSheet.tsx` + i18n + rules

- [ ] Wheel: 10 wedges from `WEDGES` (colors alternate: coins green/blue shades, steal ink, boom red, shield amber, spins purple), labels = amount or word; `wedgeFor` removed (index comes from `pickWedge`).
- [ ] Flow: SPIN → `idx = pickWedge(Math.random)`; if wedge is `boom` → spin the wheel first (no server call), then show the victim picker, then `spin("boom", undefined, victim)`; else call `spin(kind, amount)` in parallel with the wheel. Captions per outcome (new i18n keys: `spin`, `spinsLeft`, `noSpins`, `exchange`, `yourShields`, `cap_coins {n}`, `cap_spins`, `cap_shield`, `cap_shieldFull`, `cap_stealHit {who} {n}`, `cap_stealBlocked {who}`, `cap_stealReflected {who} {n}`, `cap_stealNone`, `cap_boomHit`, `cap_boomBlocked`, `cap_boomReflected`, `pickBoom`).
- [ ] Card: gold, `🎰 ×spins`, `🛡️ ×shields` + `🪞` (own only), Exchange button; spins 0 → big countdown block (reuse).
- [ ] Leaderboard without shields; feed via `eventText`; rules list rewritten.
- [ ] `npm run lint && npm run build` green.

### Task 5: Browser verification (dev server, `.env.local`)

- [ ] As Jiet: spin 5 times; coins add immediately, spins count down, 🎰 adds 3, shields show on own card only; `?today=+1` credits +5.
- [ ] Force wedges via `Math.random` override: boom → picker → hit on Mum; shield ×2 as Mum → Exchange → mirror; boom on Mum again → reflected caption on Jiet, Jiet's gold down, Mum's unchanged; steal → random victim shown; all-zero case not needed.
- [ ] Two tabs: feed/leaderboard update live; phone width screenshot; clean DB rows after.
