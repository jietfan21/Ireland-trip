# 🏴‍☠️ Pirate game — design

Date: 2026-10-20

## Intent

A one-minute-a-day family game inside the trip app: draw, win gold, steal from each other,
protect your gold, be the richest pirate when we fly home. It gives everyone a reason to open
the app daily and something to tease each other about at dinner. Virtual gold only, no money.

## Goals

- One short session per person per day: draw → bank or risk → done. Under a minute.
- Shared across all seven phones: one gold total per person, one feed, one leaderboard.
- Playable before the trip as practice, then a clean reset on Day 1.
- Works on patchy signal: a clear "needs signal" state, never a half-applied turn.

## Non-goals

- No login, no PINs. Anyone can play as anyone (the owner decided; the feed is the honesty check).
- No server-side game logic beyond two small SQL functions for atomic writes.
- No stick-figure steal animation (deferred).
- No push notifications.

## Anti-goals

- A turn that applies twice or half-applies on bad signal (double steal, lost bank).
- A bomb that eats banked gold. Parents would quit.
- Rules nobody can remember. Five slices, one decision.

## Where it lives

- A **🏴‍☠️ button in the top bar**, left of the avatar. A small red dot on it when the current
  person still has a free draw today (or the game needs their attention after Day 14).
- Tapping it opens the game as a **full-screen sheet** over the app (same pattern as
  "Who are you?"), with an ✕ to close. The bottom tabs stay as they are.

## Calendar

- A game day is a **Dublin calendar day** (`irelandToday()`, Europe/Dublin).
- **Practice season:** from launch until 24 Oct 2026 inclusive. Full game, same odds. The screen
  carries a "练习赛 · Practice until Day 1" banner.
- **Trip season:** Day 1 = 25 Oct 2026 … Day 14 = 7 Nov 2026 (`days[].n` in `lib/trip.ts`).
  On a player's first load on/after 25 Oct, their row resets to 1,000 gold, no shield, no pot,
  and `season = 'trip'`. The leaderboard and feed show only the current season.
- **After Day 14** (8 Nov onward): no draws; the sheet shows the final leaderboard with 👑 on the
  winner (ties share it).

## Rules

- Everyone starts each season with **1,000 gold** (banked).
- Each day you get **1 free draw**, and may take up to **3 draws**. After every draw you choose
  **BANK** (today's pot goes into your gold, turn over) or **RISK IT** (draw again). The third
  draw auto-banks. Your unbanked gold for the day is the **pot**.
- Draw outcomes and odds:
  | Slice | Odds | Effect |
  |---|---|---|
  | 💰 | 40% | pot +100 |
  | 💎 | 15% | pot +300 |
  | 🏴‍☠️ Steal | 20% | pick a victim: take **min(150, their gold)** straight into your gold |
  | 🛡️ Shield | 15% | you hold a shield until it blocks a steal (max one; a second is wasted → pot +50 as a consolation) |
  | 💣 Boom | 10% | pot → 0 and your turn is over for today |
- **First draw of the day is never a bomb** (re-rolled).
- **Steal targets:** everyone except yourself; people with a shield are shown greyed out and can't
  be picked. If nobody can be robbed (all shielded or at 0 gold), the slice becomes "nobody to
  rob — you find 150 on deck": pot +150.
- **Shield on the victim:** if a steal lands on a shielded victim anyway (race), the shield is
  consumed and nothing is taken; the feed says so.
- Gold never goes negative. Stolen gold and the shield are applied **immediately**, not via the pot.
- An unbanked pot left overnight is **auto-banked** when that player next opens the game on a
  later day (no punishment for forgetting).

## What the player sees

**Header of the sheet:** "🏴‍☠️ 海盗王 · Pirate King", the season/day ("Day 5 of 14" or the
practice banner), ✕.

**Your card:** your head sticker, gold (big), 🛡️ if held, today's pot if > 0, draws used (●●○).

**Action area**, one of:
- **DRAW** button (big) when draws remain and no pot decision is pending.
- The **roll**: the five slice emojis flick through for ~1.2 s, then the result lands big with a
  one-line caption in the app's language.
- **BANK / RISK IT** when a draw just landed, draws remain, and the pot > 0 (if the pot is 0 after
  a steal or shield, only "Draw again / Done").
- **Pick a victim**: the other six as a list of head + name + gold; shielded ones greyed.
- **Done for today** state with the time until the next day (Dublin midnight).
- **Needs signal** state when Supabase isn't reachable or configured.

**Leaderboard:** all seven, sorted by gold, head stickers, 🛡️ marker, 👑 on the leader. A
person who hasn't opened the game this season shows at 1,000.

**Feed:** latest 30 events, newest first, in zh/en: "妈妈 从 爸爸 那里偷了 150 💰" / "Mum stole 150
from Dad", bombs, shields, blocked steals, big wins (💎), and season resets.

**Rules:** a collapsed "How to play" section at the bottom, the table above in plain words.

## Data (Supabase, anon key, RLS open like the checklist)

`pirate_players` — one row per person, keyed by `id` (= `people[].id`):
`gold int`, `shield bool`, `pot int`, `draws int` (used today), `done bool` (turn over for today),
`day text` (Dublin date the `draws`/`pot`/`done` belong to), `season text` ('practice' | 'trip'),
`updated_at`.

`pirate_events` — `id bigserial`, `at timestamptz`, `season text`, `day text`, `actor text`,
`kind text` ('win' | 'jackpot' | 'steal' | 'blocked' | 'shield' | 'boom' | 'bank' | 'reset'),
`target text null`, `amount int null`, `turn_key text null` (unique when set).

**The client never overwrites a row.** Every game write goes through two SQL functions
(SECURITY DEFINER, granted to `anon`) that use relative updates (`gold = gold + …`), so two
phones acting on the same person, or a steal landing between someone's draws, can't undo each
other (builder check, my call):

- `pirate_open(p_player, p_season, p_day) → pirate_players row`: creates the row at 1,000 if
  missing; if `season` differs → reset to 1,000 / no shield / no pot / `done=false` and log
  'reset'; if `day` differs → auto-bank any pot (log 'bank' if > 0), `draws=0`, `done=false`,
  `day=p_day`. Returns the row. Called whenever the sheet opens or the day changes.
- `pirate_apply(p_player, p_season, p_day, p_kind, p_victim, p_turn_key) → json
  {row, stolen, blocked}`: applies one resolved draw or a bank. Rejects (returns the row
  unchanged, `applied=false`) if the player is `done`, has `draws >= 3`, is on another
  season/day, or `p_turn_key` was already used (idempotent retry on bad signal). Otherwise, in
  one transaction: `win` pot+100; `jackpot` pot+300; `shield` → shield=true, or pot+50 if already
  held; `boom` pot=0, done=true; `steal` → `pirate_open` the victim first (so a no-row or
  practice-season victim counts as a fresh 1,000), then if victim.shield → shield=false,
  stolen=0, blocked (kind logged 'blocked'), else stolen=least(150, victim.gold), victim.gold-=,
  thief.gold+=; `bank` → gold+=pot, pot=0, done=true. Each draw kind increments `draws`; the 3rd
  draw also auto-banks. Logs the event with `turn_key`.

**When a draw is committed (builder check, my call):** the phone picks the slice at random,
then calls `pirate_apply` *before* playing the roll animation (the animation is cosmetic). For a
steal, the call happens after the victim is picked; closing the app during the pick means the
draw was never used, nothing lost. A pot left with BANK/RISK unanswered is already in the row,
so reopening the same day shows the choice again; overnight it auto-banks via `pirate_open`.

Leaderboard: all seven from `people`, joined to rows of the current season; missing or
other-season rows show as 1,000 (my call). Feed: `pirate_events` of the current season, newest
30. Realtime: subscribe to both tables (like `ireland_checks`), plus reload on focus and every
60 s.

The SQL lives in `supabase/pirate.sql` (committed) and is applied to the live project by the
builder through the Supabase connector before the game ships.

**Dev/testing:** on `localhost` only, `?today=YYYY-MM-DD` in the URL overrides the Dublin date,
so Day 1 reset, overnight auto-bank and the post–Day 14 state can be tested without waiting.

**Dates (builder check, my call):** Day 14 is 7 Nov 2026 (`days[14]`, the day the family lands
back in KL): last drawable day 7 Nov, winner shown from 8 Nov. The "time until next day"
countdown must be computed to the next Dublin midnight, not a fixed 24 h (Dublin clocks change
on 25 Oct).

## Constraints

- Static export, no new dependencies (Supabase JS is already there).
- Rules as pure functions in `lib/pirate.ts`, unit-tested with `node --test`, using an
  injectable random source.
- Bilingual via `L` / `p()` and `ui` keys in `lib/i18n.ts`.
- Visual language of the app: cream, ink, rounded 3xl cards, the person colours and head
  stickers; the draw result should feel like a little event (scale-in, emoji burst reuse from the
  crew strip is fine).
- Odds, amounts and dates are constants at the top of `lib/pirate.ts` so they can be tuned.

## Decided

- Entry point in the top bar, full-screen sheet (owner).
- No PIN; anyone can play as anyone (owner).
- Practice season then reset on Day 1 (owner).
- No steal animation this round (owner).
- Five slices with the odds above; bomb ends the turn; first draw never a bomb; stolen gold and
  shields apply immediately; second shield → +50 (my calls).

## Left to the builder

- Exact layout, animations and copy, within the tone above.
- How the red dot is computed on the header (a light read of the player's own row).
- Timers for the roll and result reveal.
