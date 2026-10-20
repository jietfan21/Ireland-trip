// Run: node --test lib/pirate.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COIN_AMOUNTS,
  WEDGES,
  coinValue,
  dayMultiplier,
  mirrorPrice,
  eventText,
  hitAmount,
  leaderboard,
  nextDublinMidnightMs,
  pickWedge,
  seasonFor,
  todayOverride,
  tripDayNumber,
  victims,
  visibleEvents,
} from "./pirate.ts";

test("ten wedges in the agreed order, specials never adjacent", () => {
  assert.equal(WEDGES.length, 10);
  assert.deepEqual(
    WEDGES.map((w) => (w.kind === "win" ? w.amount : w.kind)),
    [50, "steal", 100, "shield", 150, "boom", 200, "spins", 300, 500],
  );
  for (let i = 0; i < 10; i++) {
    const a = WEDGES[i].kind, b = WEDGES[(i + 1) % 10].kind;
    assert.ok(a === "win" || b === "win", `wedges ${i} and ${i + 1} are both specials`);
  }
  assert.deepEqual(COIN_AMOUNTS, [50, 100, 150, 200, 300, 500]);
});

test("pickWedge is uniform over the ten wedges", () => {
  assert.equal(pickWedge(() => 0.0), 0);
  assert.equal(pickWedge(() => 0.05), 0);
  assert.equal(pickWedge(() => 0.15), 1);
  assert.equal(pickWedge(() => 0.95), 9);
  assert.equal(pickWedge(() => 0.999999), 9);
});

test("coin wedges grow with the trip day; practice is ×1", () => {
  assert.equal(dayMultiplier("2026-10-20"), 1);
  assert.equal(dayMultiplier("2026-10-25"), 1 + 1 / 7);
  assert.equal(dayMultiplier("2026-11-07"), 3);
  assert.equal(coinValue(500, "2026-10-20"), 500);
  assert.equal(coinValue(500, "2026-11-07"), 1500);
  assert.equal(coinValue(50, "2026-10-31"), 100); // 50 × 2 on Day 7
  assert.equal(coinValue(150, "2026-10-25"), 170); // 171.4 → nearest 10
});

test("mirror price is 20% of gold, at least 200", () => {
  assert.equal(mirrorPrice(1000), 200);
  assert.equal(mirrorPrice(6234), 1240);
  assert.equal(mirrorPrice(300), 200);
});

test("hitAmount: percent of gold, floored to tens", () => {
  assert.equal(hitAmount(1234, 15), 180);
  assert.equal(hitAmount(1000, 20), 200);
  assert.equal(hitAmount(40, 20), 0);
  assert.equal(hitAmount(0, 15), 0);
});

test("seasons and day numbers", () => {
  assert.equal(seasonFor("2026-10-24"), "practice");
  assert.equal(seasonFor("2026-10-25"), "trip");
  assert.equal(seasonFor("2026-11-07"), "trip");
  assert.equal(seasonFor("2026-11-08"), "over");
  assert.equal(tripDayNumber("2026-10-25"), 1);
  assert.equal(tripDayNumber("2026-11-07"), 14);
});

test("next Dublin midnight across the clock change", () => {
  assert.equal(nextDublinMidnightMs(new Date("2026-10-24T22:30:00Z")), Date.parse("2026-10-24T23:00:00Z"));
  assert.equal(nextDublinMidnightMs(new Date("2026-10-25T12:00:00Z")), Date.parse("2026-10-26T00:00:00Z"));
});

const rows = [
  { id: "dad", gold: 1300, shields: 2, mirror: true, spins: 3, boom_pending: false, boomed_day: "2026-10-25", day: "2026-10-25", season: "trip" },
  { id: "mom", gold: 1300, shields: 0, mirror: false, spins: 0, boom_pending: true, boomed_day: null, day: "2026-10-25", season: "trip" },
  { id: "yao", gold: 2000, shields: 0, mirror: false, spins: 5, boom_pending: false, boomed_day: "2026-10-24", day: "2026-10-20", season: "practice" },
  { id: "jiet", gold: 0, shields: 0, mirror: false, spins: 5, boom_pending: false, boomed_day: null, day: "2026-10-25", season: "trip" },
];

test("leaderboard: missing and old-season rows are 1000; ties share the crown", () => {
  const lb = leaderboard(["dad", "mom", "yao", "jiet", "hui"], rows, "trip");
  assert.deepEqual(
    lb.map((x) => [x.id, x.gold, x.leader]),
    [["dad", 1300, true], ["mom", 1300, true], ["yao", 1000, false], ["hui", 1000, false], ["jiet", 0, false]],
  );
});

test("boom victims: everyone but me with gold, flagged if already boomed today, no shield info", () => {
  const v = victims("mom", ["dad", "mom", "yao", "jiet"], rows, "trip", "2026-10-25");
  assert.deepEqual(v, [{ id: "dad", gold: 1300, boomedToday: true }, { id: "yao", gold: 1000, boomedToday: false }]);
});

test("event text covers every kind", () => {
  const name = (id: string) => ({ dad: "Dad", mom: "Mum" })[id] ?? id;
  const base = { id: 1, at: "", season: "trip", day: "2026-10-25", actor: "mom", target: "dad", amount: 180 };
  const en = (kind: string, extra: object = {}) => eventText({ ...base, kind, ...extra }, name).en;
  assert.equal(en("win", { target: null }), "Mum spun 💰 +180");
  assert.equal(en("spins", { target: null, amount: 3 }), "Mum won 🎰 +3 spins");
  assert.equal(en("steal"), "Mum stole 180 from Dad 🏴‍☠️");
  assert.equal(en("boom"), "Mum boomed Dad −180 💣");
  assert.match(en("steal_blocked"), /Dad's shield blocked Mum/);
  assert.match(en("boom_reflected"), /mirror/);
  assert.match(en("steal_none", { target: null }), /nobody/);
  assert.match(en("mirror", { target: null }), /mirror/);
  assert.match(en("mirror_bought", { target: null, amount: 1240 }), /bought a mirror.*1,240/);
  assert.match(en("reset", { target: null, amount: null }), /1,000/);
  for (const k of ["win", "spins", "shield", "shield_full", "mirror", "mirror_bought", "steal", "boom", "steal_blocked", "boom_blocked", "steal_reflected", "boom_reflected", "steal_none", "boom_none", "reset"]) {
    const t = eventText({ ...base, kind: k }, name);
    assert.ok(t.zh && t.en && !t.en.includes("·"), `text for ${k}`);
  }
});

test("visibleEvents: unknown ids dropped; shield and mirror events only for their owner", () => {
  const e = (id: number, kind: string, actor = "mom", target: string | null = null) => ({ id, at: "", season: "trip", day: "", actor, kind, target, amount: null });
  const list = [e(1, "steal", "mom", "dad"), e(2, "steal", "ghost", "dad"), e(3, "shield", "mom"), e(4, "mirror", "dad"), e(5, "shield_full", "dad"), e(6, "steal_blocked", "mom", "dad"), e(7, "boom_pending", "mom"), e(8, "mirror_bought", "dad")];
  assert.deepEqual(visibleEvents(list, ["dad", "mom"], "mom").map((x) => x.id), [1, 3, 6, 8]); // bought mirrors are public; a pending boom is bookkeeping
  assert.deepEqual(visibleEvents(list, ["dad", "mom"], "dad").map((x) => x.id), [1, 4, 5, 6, 8]);
  assert.deepEqual(visibleEvents(list, ["dad", "mom"], null).map((x) => x.id), [1, 6, 8]);
});

test("today override only on localhost", () => {
  assert.equal(todayOverride("?today=2026-10-27", "localhost"), "2026-10-27");
  assert.equal(todayOverride("?today=2026-10-27", "ireland-trip.vercel.app"), null);
});
