# 🏴‍☠️ Pirate game v2 — design

Date: 2026-10-20. Supersedes `2026-10-20-pirate-game-design.md` (v1: bank/risk, weighted slices).
Everything not mentioned here (intent, where it lives, calendar, no-login trust model, practice
season, data safety rules, dev `?today=` override, offline state) is unchanged from v1.

## What changed and why

The owner played v1 and wanted a Pirate Kings feel: an honest wheel with equal wedges, no
bank/risk decision, attacks on other people, hidden shields, a reflecting shield, extra spins,
and all gold visible. Rules below were agreed in chat on 2026-10-20.

## Rules (v2)

- **Gold:** everyone starts a season with **1,000**; never below 0; visible to all, always; the
  richest on 7 Nov is Pirate King 👑 (ties share).
- **Spins:** a balance, not "draws used today". **+5 credited per Dublin day** (every missed day
  is credited too), carry over, **no cap**. One spin = one wheel turn. No spins before the game
  opens for the season? No: practice season works the same way, and Day 1 resets the balance
  to 5.
- **Wheel: 10 equal wedges (10% each)**, laid out so no two specials touch:
  💰50 · 🏴‍☠️ Steal · 💰100 · 🛡️ Shield · 💰150 · 💣 Boom · 💰200 · 🎰 +3 spins · 💰300 · 💰500.
- **💰 coins:** added to your gold immediately.
- **🎰 +3 spins:** balance +3 (the spin itself is still used).
- **🛡️ Shield:** +1, **max 3**; a shield drawn at 3 becomes 💰100 instead. Shields are **hidden
  from everyone else**.
- **🏴‍☠️ Steal:** the victim is picked **at random by the server** among the other six with gold > 0.
  You take **15% of their gold**, rounded down to a multiple of 10.
- **💣 Boom:** **you pick** the victim (anyone but you with gold > 0). They lose **20% of their
  gold** (rounded down to 10s), destroyed, not transferred.
- **🪞 Mirror:** the only thing you can "buy": **exchange 2 shields for 1 mirror**, max one held,
  hidden. A mirror blocks an attack **and sends the same hit back**: the amount is computed on
  the victim as usual (15% / 20% of the victim's gold), then applied to the attacker instead,
  capped at what the attacker has. A reflected steal moves that amount from the attacker to the
  victim; a reflected boom destroys it from the attacker. Used up when it triggers.
- **Defence order on any attack:** mirror first (reflect), else a shield (block, shields −1), else
  the attack lands. Attacker's spin is used either way.
- **Feed** shows every event in zh/en, including who attacked whom and whether it was blocked or
  reflected. **Nobody's shields or mirrors are shown**, only your own on your card.

## What the player sees (changes from v1)

- **Your card:** head, gold, **🎰 spins left**, your **🛡️ ×n** and **🪞** (only you see these), and an
  **"🛡️🛡️ → 🪞 Exchange"** button (enabled when shields ≥ 2 and no mirror).
- **Action area:** **SPIN** (big) when spins > 0. The wheel turns ~3.5 s and stops on the result.
  Then:
  - coins / spins / shield: caption, "Spin again" (if spins left) or nothing.
  - steal: caption with the victim and amount, or "blocked by X's shield", or "X's mirror! you lost N".
  - boom: after the wheel stops, **pick a victim** (list of the other six with gold), then the
    caption with the outcome.
  - spins = 0: "No spins left" with the big hh:mm:ss countdown to the next Dublin day (+5).
- **Leaderboard:** gold + 👑 only. No shield markers.
- **Rules** section rewritten for v2.

## Data (v2)

`pirate_players`: `id text pk`, `gold int`, `shields int` (0–3), `mirror bool`, `spins int`,
`day text` (last Dublin day credited), `season text`, `updated_at`.
`pirate_events`: `id`, `at`, `season`, `day`, `actor`, `kind`, `target`, `amount`, `turn_key unique`.
Kinds: `win` (amount) · `spins` (3) · `shield` · `shield_full` (100) · `mirror` · `steal` (target,
amount) · `boom` (target, amount) · `steal_blocked` / `boom_blocked` (target) ·
`steal_reflected` / `boom_reflected` (target = intended victim, amount = the reflected hit, taken from the attacker) ·
`reset`.

Functions (security definer, anon may execute; same validation as v1: allowlisted ids, date
within ±1 day of Dublin today and ≤ 2026-11-07, forward-only days, season derived from the
date, turn-key replay returns the original result):
- `pirate_open(p_player, p_season, p_day) → row`: create at 1,000 / 5 spins; season mismatch →
  reset (gold 1,000, shields 0, mirror false, spins 5) + `reset` event; day moved forward →
  `spins += 5 × days elapsed`, `day = p_day`.
- `pirate_spin(p_player, p_day, p_kind, p_amount, p_victim, p_turn_key) → jsonb
  {applied, reason, row, victim, amount, outcome}` where `p_kind ∈ win|spins|shield|steal|boom`,
  `p_amount` for `win` must be one of 50,100,150,200,300,500, `p_victim` only for `boom`.
  Requires `spins > 0`; `spins −= 1`; applies the wedge; for attacks locks both rows in id order,
  resolves mirror → shield → hit, logs the matching kind; `outcome ∈ hit|blocked|reflected`,
  `victim` = who was targeted, `amount` = gold moved/destroyed (on reflect: the attacker's loss).
- `pirate_exchange(p_player, p_day, p_turn_key) → jsonb {applied, reason, row}`: shields ≥ 2 and
  no mirror → shields −2, mirror true, `mirror` event.
- The v1 tables are dropped and recreated (no real data yet); `supabase/pirate.sql` is rewritten
  so a fresh project can be set up from it in one run.

## Constraints

As v1: static export, no new deps, pure rules in `lib/pirate.ts` with `node --test`, bilingual,
app look. The client decides the wedge (trusted, as v1); the server decides steal victims and
all amounts for attacks.

## Decided (owner, 2026-10-20)

Equal wedges; 5 spins/day + 3 from the wedge, no cap; shields hidden, stack to 3; 2 shields → 1
mirror that reflects; gold always visible; boom targets chosen, steal targets random; no shop.

## Builder check (my calls, 2026-10-20)

- `shield`, `shield_full` and `mirror` events are logged but shown in the feed **only to the person
  they belong to**. "Hidden" is UI-only: the anon key can read every column, which is accepted
  under the no-login trust model.
- A trip-season row created or reset on day *n* starts with **5 × n spins** (5 per day since Day 1),
  so skipping Day 1 costs nothing; practice rows start with 5.
- An attack with nobody to target, or whose 15% / 20% rounds down to 0, **consumes the spin and
  changes nothing**; logged as `steal_none` / `boom_none`, caption "nobody to rob".

## Left to the builder

Layout of the 10-wedge wheel labels, captions wording, exact animation timings, how the boom
victim list looks.

## v2.1 balance (owner, 2026-10-20, after simulating 14 days)

- **Coin wedges grow with the trip:** value × (1 + trip day ÷ 7), rounded to 10s; practice ×1.
  The wheel shows today's actual values. Keeps spins worth taking when piles are big.
- **Buy a mirror:** 20% of your gold (min 200), max one, **public** in the feed
  (`mirror_bought`, amount). The 2-shield exchange stays private. Both reflect the same way.
- **One boom per person per day:** a victim boomed today (hit, blocked or reflected) can't be
  boomed again until the next Dublin day; greyed out in the picker. Stops the leader being
  gang-boomed to nothing (simulation: lead changes 92 → 46 times).
- **Last place can't be stolen from:** steals never pick the poorest of the seven (unless nobody
  else has gold). Booms still can.
- **No expiry** on shields or mirrors; spins always carry over, no cap. The last-day ambush is
  allowed.
