// Run: node --test lib/crew.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { bubbleLeft, castForDay, crew, pickLine, releaseVelocity, stepToss, stepWalk } from "./crew.ts";
import { people } from "./trip.ts";

const ids = (n: number) => castForDay(n).map((c) => c.id).sort();
const all = people.map((p) => p.id).sort();

test("crew covers exactly the people", () => assert.deepEqual(crew.map((c) => c.id).sort(), all));

test("day 0: everyone, nobody waving", () => {
  const c = castForDay(0);
  assert.deepEqual(c.map((x) => x.id).sort(), all);
  assert.ok(c.every((x) => !x.waving));
});

test("day 1: Ying & Hui not yet", () => assert.deepEqual(ids(1), ["dad", "jiet", "mom", "rong", "yao"]));

test("day 2, 12 and 13: everyone, nobody waving", () => {
  for (const n of [2, 12, 13]) {
    assert.deepEqual(ids(n), all);
    assert.ok(castForDay(n).every((x) => !x.waving));
  }
});

test("day 14: everyone waving", () => assert.ok(castForDay(14).every((x) => x.waving)));

test("every member has 5 bilingual lines", () =>
  assert.ok(crew.every((m) => m.lines.length === 5 && m.lines.every((l) => l.zh && l.en))));

test("pickLine never repeats the last line", () => {
  for (let i = 0; i < 20; i++) assert.notEqual(pickLine(5, 2, () => i / 20), 2);
  assert.equal(pickLine(1, 0), 0);
  const k = pickLine(5, 4, () => 0.999);
  assert.ok(k >= 0 && k < 5 && k !== 4);
});

test("heights in cm per person", () => {
  const h = Object.fromEntries(crew.map((m) => [m.id, m.height]));
  assert.deepEqual(h, { dad: 180, yao: 180, rong: 180, hui: 175, jiet: 170, ying: 160, mom: 160 });
});

test("stepWalk: a target beyond the edge is reached at the edge and counts as arrived", () => {
  const r = stepWalk({ x: 290, target: 500, speed: 30, dir: 1 }, 1, 300);
  assert.deepEqual(r, { x: 300, dir: 1, arrived: true });
});

test("stepWalk: moves toward the target by speed*dt and faces that way", () => {
  assert.deepEqual(stepWalk({ x: 100, target: 20, speed: 20, dir: 1 }, 0.5, 300), { x: 90, dir: -1, arrived: false });
});

test("bubbleLeft keeps a 160px bubble inside the strip", () => {
  assert.equal(bubbleLeft(10, 343), 80);
  assert.equal(bubbleLeft(340, 343), 263);
  assert.equal(bubbleLeft(170, 343), 170);
  assert.equal(bubbleLeft(5, 100), 50);
});

test("flick uses recent movement, caps fast gestures and forgets momentum after a hold", () => {
  const samples = [{ x: 0, y: 0, at: 0 }, { x: 20, y: 10, at: 100 }, { x: 40, y: 30, at: 140 }];
  assert.deepEqual(releaseVelocity(samples, 150), { vx: 500, vy: 500 });
  assert.deepEqual(releaseVelocity(samples, 240), { vx: 0, vy: 0 });
  assert.deepEqual(releaseVelocity([{ x: 0, y: 0, at: 0 }, { x: 200, y: -100, at: 10 }], 10), { vx: 850, vy: -850 });
  assert.deepEqual(releaseVelocity([], 50), { vx: 0, vy: 0 });
});

test("throws bounce off both walls and ceiling and eventually settle on the ground", () => {
  const initial = { x: 150, y: 50, vx: 800, vy: 700, angle: 0, spin: 600 };
  const right = stepToss({ ...initial, x: 299 }, 0.032, 300, 100);
  assert.equal(right.x, 300); assert.ok(right.vx < 0);
  const left = stepToss({ ...initial, x: 1, vx: -800 }, 0.032, 300, 100);
  assert.equal(left.x, 0); assert.ok(left.vx > 0);
  const ceiling = stepToss({ ...initial, y: 99 }, 0.032, 300, 100);
  assert.equal(ceiling.y, 100); assert.ok(ceiling.vy < 0);
  for (const vx of [-850, 0, 850]) {
    let f = { ...initial, vx };
    let landed = false, bounced = false;
    for (let i = 0; i < 500 && !landed; i++) {
      const next = stepToss(f, i === 1 ? 5 : 1 / 60, 300, 100);
      assert.ok(next.x >= 0 && next.x <= 300 && next.y >= 0 && next.y <= 100);
      bounced ||= next.bounced; landed = next.landed; f = next;
    }
    assert.ok(bounced && landed); assert.equal(f.y, 0); assert.equal(f.vy, 0);
  }
});

