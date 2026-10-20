import { test } from "node:test";
import assert from "node:assert/strict";
import { orderedFlights } from "./flights.ts";

test("flight cards run from the first departure to the last across time zones", () => {
  const rows = orderedFlights();
  assert.deepEqual(rows.map((f) => f.code), ["AK605", "QR853", "QR019", "SK596", "SK2537", "EI602", "QR020", "CI74", "QR844", "AK604"]);
  assert.ok(rows.every((f, i) => Number.isFinite(Date.parse(f.departsAt)) && (!i || Date.parse(f.departsAt) >= Date.parse(rows[i - 1].departsAt))));
  assert.equal(rows.filter((f) => f.showGroup).length, 3);
});

test("flight stickers include Jiet on the shared Qatar flights as well as his Perth flights", () => {
  for (const row of orderedFlights()) {
    assert.deepEqual(row.passengers.map((p) => p.id), row.group === "kl4" ? ["dad", "mom", "yao", "jiet"] : row.group === "iceland" ? ["ying", "hui"] : ["jiet"]);
    assert.ok(!row.passengers.some((p) => p.id === "rong"));
  }
});
