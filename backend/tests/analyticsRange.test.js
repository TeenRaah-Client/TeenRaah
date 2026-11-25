import test from "node:test";
import assert from "node:assert/strict";
import { getAnalyticsRange } from "../utils/analyticsRange.js";

test("uses India calendar-day boundaries for supported periods", () => {
  const now = new Date("2026-11-26T12:30:00.000Z");
  const range = getAnalyticsRange("7d", now);
  assert.equal(range.period, "7d");
  assert.equal(range.start.toISOString(), "2026-11-19T18:30:00.000Z");
  assert.equal(range.end.toISOString(), now.toISOString());
});

test("defaults to 30 India calendar days", () => {
  const range = getAnalyticsRange(undefined, new Date("2026-11-26T12:30:00.000Z"));
  assert.equal(range.period, "30d");
  assert.equal(range.start.toISOString(), "2026-10-27T18:30:00.000Z");
});

test("rejects arbitrary periods", () => {
  assert.throws(() => getAnalyticsRange("all"), /Period must be one of/);
});
