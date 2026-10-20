// 🏴‍☠️ Pirate game (v2) rules and calendar. Pure functions; the SQL functions in
// supabase/pirate.sql apply the results. Design: docs/superpowers/specs/2026-10-20-pirate-game-v2-design.md
import type { L } from "./trip";

export const START_GOLD = 1000;
export const DAILY_SPINS = 5;
export const BONUS_SPINS = 3;
export const MAX_SHIELDS = 3;
export const STEAL_PCT = 15;
export const BOOM_PCT = 20;
export const COIN_AMOUNTS = [50, 100, 150, 200, 300, 500];
export const TRIP_DAY1 = "2026-10-25";
export const LAST_DAY = "2026-11-07"; // Day 14
export const DAYS = 14;

export type Wedge = "win" | "steal" | "shield" | "boom" | "spins";
export type WedgeDef = { kind: Wedge; amount?: number; emoji: string; label: L; color: string };

// Ten equal wedges, laid out so no two specials touch.
export const WEDGES: WedgeDef[] = [
  { kind: "win", amount: 50, emoji: "💰", label: { zh: "50", en: "50" }, color: "#1f7a5a" },
  { kind: "steal", emoji: "🏴‍☠️", label: { zh: "偷", en: "STEAL" }, color: "#17322d" },
  { kind: "win", amount: 100, emoji: "💰", label: { zh: "100", en: "100" }, color: "#0369a1" },
  { kind: "shield", emoji: "🛡️", label: { zh: "盾", en: "SHIELD" }, color: "#c7782b" },
  { kind: "win", amount: 150, emoji: "💰", label: { zh: "150", en: "150" }, color: "#1f7a5a" },
  { kind: "boom", emoji: "💣", label: { zh: "炸", en: "BOOM" }, color: "#b91c1c" },
  { kind: "win", amount: 200, emoji: "💰", label: { zh: "200", en: "200" }, color: "#0369a1" },
  { kind: "spins", emoji: "🎰", label: { zh: "+3 次", en: "+3 SPINS" }, color: "#7c3aed" },
  { kind: "win", amount: 300, emoji: "💰", label: { zh: "300", en: "300" }, color: "#1f7a5a" },
  { kind: "win", amount: 500, emoji: "💎", label: { zh: "500", en: "500" }, color: "#0369a1" },
];

// Coin wedges grow with the trip: ×(1 + day/7). Practice is ×1. Mirrors pirate_mult in SQL.
export function dayMultiplier(day: string): number {
  return seasonFor(day) === "practice" ? 1 : 1 + tripDayNumber(day) / 7;
}
export function coinValue(base: number, day: string): number {
  return Math.round((base * dayMultiplier(day)) / 10) * 10;
}
// A mirror costs 20% of your gold, at least 200 (mirrors pirate_buy_mirror in SQL).
export function mirrorPrice(gold: number): number {
  return Math.max(200, hitAmount(gold, BOOM_PCT));
}

// Uniform pick: the wheel is honest, every wedge is 10%.
export function pickWedge(rnd: () => number): number {
  return Math.min(WEDGES.length - 1, Math.floor(rnd() * WEDGES.length));
}

// pct% of gold, floored to a multiple of 10 (mirrors pirate_hit in SQL).
export function hitAmount(gold: number, pct: number): number {
  return Math.floor((gold * pct) / 100 / 10) * 10;
}

export type Season = "practice" | "trip" | "over";
export function seasonFor(day: string): Season {
  if (day < TRIP_DAY1) return "practice";
  if (day <= LAST_DAY) return "trip";
  return "over";
}

const dayMs = 86400000;
export function tripDayNumber(day: string): number {
  return Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${TRIP_DAY1}T00:00:00Z`)) / dayMs) + 1;
}

const dublin = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Dublin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
function dublinWallMs(at: number) {
  const p = Object.fromEntries(dublin.formatToParts(new Date(at)).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
}
// Epoch ms of the next 00:00 in Dublin (correct across the October clock change).
export function nextDublinMidnightMs(now: Date): number {
  const d = Object.fromEntries(dublin.formatToParts(now).filter((x) => ["year", "month", "day"].includes(x.type)).map((x) => [x.type, x.value]));
  const target = Date.UTC(+d.year, +d.month - 1, +d.day) + dayMs;
  let at = target;
  for (let i = 0; i < 2; i++) at = target - (dublinWallMs(at) - at);
  return at;
}

export type PlayerRow = {
  id: string;
  gold: number;
  shields: number;
  mirror: boolean;
  spins: number;
  boom_pending: boolean; // a 💣 was spun (spin used) but the victim not yet chosen
  boomed_day: string | null; // last Dublin day this player was boomed: one boom per person per day
  day: string;
  season: string;
};

function current(rows: PlayerRow[], season: string, id: string): PlayerRow | undefined {
  return rows.find((x) => x.id === id && x.season === season);
}

// Everyone, richest first; people who haven't opened the game this season count as fresh.
export function leaderboard(ids: string[], rows: PlayerRow[], season: string) {
  const list = ids.map((id) => ({ id, gold: current(rows, season, id)?.gold ?? START_GOLD, leader: false }));
  list.sort((a, b) => b.gold - a.gold);
  const top = list[0]?.gold ?? 0;
  for (const x of list) x.leader = x.gold === top;
  return list;
}

// Boom targets: everyone but me who has gold, flagged if already boomed today. Shields stay hidden.
export function victims(me: string, ids: string[], rows: PlayerRow[], season: string, today: string) {
  return ids
    .filter((id) => id !== me)
    .map((id) => {
      const r = current(rows, season, id);
      return { id, gold: r?.gold ?? START_GOLD, boomedToday: r?.boomed_day === today };
    })
    .filter((v) => v.gold > 0);
}

export type Event = {
  id: number;
  at: string;
  season: string;
  day: string;
  actor: string;
  kind: string;
  target: string | null;
  amount: number | null;
};

export function eventText(e: Event, name: (id: string) => string): L {
  const a = name(e.actor);
  const t = e.target ? name(e.target) : "";
  const n = e.amount ?? 0;
  switch (e.kind) {
    case "win":
      return { zh: `${a} 转到 💰 +${n}`, en: `${a} spun 💰 +${n}` };
    case "spins":
      return { zh: `${a} 转到 🎰 多 ${n} 次`, en: `${a} won 🎰 +${n} spins` };
    case "shield":
      return { zh: `${a} 拿到盾牌 🛡️`, en: `${a} got a shield 🛡️` };
    case "shield_full":
      return { zh: `${a} 盾牌已满，换成 +${n} 💰`, en: `${a} was full of shields, took +${n} 💰 instead` };
    case "mirror":
      return { zh: `${a} 用两块盾牌换了一面镜子 🪞`, en: `${a} traded two shields for a mirror 🪞` };
    case "mirror_bought":
      return { zh: `${a} 花 ${n.toLocaleString()} 金币买了一面镜子 🪞`, en: `${a} bought a mirror for ${n.toLocaleString()} gold 🪞` };
    case "steal":
      return { zh: `${a} 从 ${t} 那里偷了 ${n} 🏴‍☠️`, en: `${a} stole ${n} from ${t} 🏴‍☠️` };
    case "boom":
      return { zh: `${a} 炸了 ${t} −${n} 💣`, en: `${a} boomed ${t} −${n} 💣` };
    case "steal_blocked":
      return { zh: `${t} 的盾牌挡住了 ${a} 的偷窃 🛡️`, en: `${t}'s shield blocked ${a}'s steal 🛡️` };
    case "boom_blocked":
      return { zh: `${t} 的盾牌挡住了 ${a} 的炸弹 🛡️`, en: `${t}'s shield blocked ${a}'s boom 🛡️` };
    case "steal_reflected":
      return { zh: `${t} 的镜子反弹！${a} 反而赔了 ${n} 🪞`, en: `${t}'s mirror bounced it back: ${a} paid ${n} instead 🪞` };
    case "boom_reflected":
      return { zh: `${t} 的镜子反弹！${a} 自己炸掉 ${n} 🪞`, en: `${t}'s mirror bounced it back: ${a} lost ${n} 🪞` };
    case "steal_none":
      return { zh: `${a} 想偷，但没人可偷 🤷`, en: `${a} went stealing but found nobody to rob 🤷` };
    case "boom_none":
      return { zh: `${a} 的炸弹没炸到东西 🤷`, en: `${a}'s boom hit nothing 🤷` };
    case "reset":
      return { zh: `${a} 进入正式赛，从 1,000 金币开始`, en: `${a} starts the trip season at 1,000 gold` };
    default:
      return { zh: `${a} · ${e.kind}`, en: `${a} · ${e.kind}` };
  }
}

const PRIVATE_KINDS = new Set(["shield", "shield_full", "mirror"]);
const HIDDEN_KINDS = new Set(["boom_pending"]); // bookkeeping only
// Events the viewer may see: nobody outside the family, and shield/mirror news only for its owner.
export function visibleEvents(events: Event[], ids: string[], me: string | null = null): Event[] {
  return events.filter(
    (e) =>
      !HIDDEN_KINDS.has(e.kind) &&
      ids.includes(e.actor) &&
      (e.target == null || ids.includes(e.target)) &&
      (!PRIVATE_KINDS.has(e.kind) || e.actor === me),
  );
}

// Dev only: ?today=YYYY-MM-DD on localhost pretends it's another day.
export function todayOverride(search: string, hostname: string): string | null {
  if (hostname !== "localhost" && hostname !== "127.0.0.1") return null;
  const v = new URLSearchParams(search).get("today");
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}
