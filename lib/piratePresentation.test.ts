import { test } from "node:test";
import assert from "node:assert/strict";
import { fittedWheelSize, animatedGoldValue, nextWheelRotation, stealCandidates, mirrorOrderChanged } from "./piratePresentation.ts";

test("wheel stays inside short, narrow and resized stages with room for its decoration", () => {
  for (const [width, height] of [[354, 250], [354, 125], [284, 400], [420, 600], [100, 60]]) {
    const size = fittedWheelSize(width, height);
    assert.ok(size + 24 <= width);
    assert.ok(size + 28 <= height);
    assert.ok(size <= 380);
  }
  assert.equal(fittedWheelSize(420, 600), 380);
  assert.equal(fittedWheelSize(354, 125), 97);
  assert.equal(fittedWheelSize(0, 0), 0);
  assert.equal(fittedWheelSize(300, 10), 0);
});

test("gold count stays between balances and finishes at the exact server total", () => {
  for (const [from, to] of [[1000, 1500], [1500, 1200], [0, 500], [2345, 2375]]) {
    assert.equal(animatedGoldValue(from, to, 0), from);
    assert.equal(animatedGoldValue(from, to, 1), to);
    assert.equal(animatedGoldValue(from, to, 2), to);
    assert.equal(animatedGoldValue(from, to, -1), from);
    const values = Array.from({ length: 20 }, (_, i) => animatedGoldValue(from, to, i / 19));
    assert.ok(values.every((n) => n >= Math.min(from, to) && n <= Math.max(from, to)));
    assert.ok(values.every((n, i) => i === 0 || (to > from ? n >= values[i - 1] : n <= values[i - 1])));
  }
});

test("every landing aligns with the pointer and repeated spins keep moving forward", () => {
  for (const count of [1, 2, 6, 10]) {
    let previous = 0;
    for (const target of [...Array(count).keys(), 0, 0, count - 1]) {
      const rotation = nextWheelRotation(previous, target, count);
      assert.ok(rotation >= previous + 1800);
      assert.ok(Math.abs(((rotation + (target + 0.5) * 360 / count) % 360)) < 0.00001);
      previous = rotation;
    }
  }
});

test("steal wheel protects last place, falls back for ties, and includes the actual server victim", () => {
  const board = [{ id: "me", gold: 1000 }, { id: "rich", gold: 2000 }, { id: "poor", gold: 100 }];
  assert.deepEqual(stealCandidates(board, "me", "rich"), ["rich"]);
  assert.deepEqual(stealCandidates(board, "me", "poor"), ["rich", "poor"]);
  assert.deepEqual(stealCandidates(board.map((x) => ({ ...x, gold: 1000 })), "me", "rich"), ["rich", "poor"]);
  assert.deepEqual(stealCandidates([{ id: "me", gold: 1000 }], "me", "late"), ["late"]);
});

test("mirror confirmation must be reviewed again if the resource being spent changes", () => {
  const order = { kind: "buy" as const, gold: 1000, shields: 3, price: 200 };
  assert.equal(mirrorOrderChanged(order, { gold: 900, shields: 3 }, 200), true);
  assert.equal(mirrorOrderChanged(order, { gold: 1000, shields: 2 }, 200), false);
  assert.equal(mirrorOrderChanged({ ...order, kind: "trade" }, { gold: 1000, shields: 2 }, 200), true);
});
