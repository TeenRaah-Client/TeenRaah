import test from "node:test";
import assert from "node:assert/strict";
import { canRequestReturn, getDeliveryTimestamp, RETURN_WINDOW_DAYS } from "../utils/returnPolicy.js";

const now = new Date("2026-11-26T12:00:00.000Z");
const history = [{ status: "Placed", at: new Date("2026-11-10T10:00:00.000Z") }, { status: "Delivered", at: new Date("2026-11-20T12:00:00.000Z") }];

test("accepts a paid delivered order inside the return window", () => {
  assert.equal(canRequestReturn({ orderStatus: "Delivered", paymentStatus: "paid", trackingHistory: history, now }), true);
});

test("rejects unpaid, undelivered, and expired orders", () => {
  assert.equal(canRequestReturn({ orderStatus: "Shipped", paymentStatus: "paid", trackingHistory: history, now }), false);
  assert.equal(canRequestReturn({ orderStatus: "Delivered", paymentStatus: "pending", trackingHistory: history, now }), false);
  const oldHistory = [{ status: "Delivered", at: new Date(now.getTime() - (RETURN_WINDOW_DAYS + 1) * 86400000) }];
  assert.equal(canRequestReturn({ orderStatus: "Delivered", paymentStatus: "paid", trackingHistory: oldHistory, now }), false);
});

test("rejects missing or future delivery timestamps", () => {
  assert.equal(getDeliveryTimestamp([]), null);
  assert.equal(canRequestReturn({ orderStatus: "Delivered", paymentStatus: "paid", trackingHistory: [{ status: "Delivered", at: new Date(now.getTime() + 1000) }], now }), false);
});

test("uses the actual delivered event when later tracking events exist", () => {
  const events = [...history, { status: "Returned", at: new Date("2026-11-26T11:00:00.000Z") }];
  assert.equal(getDeliveryTimestamp(events).toISOString(), "2026-11-20T12:00:00.000Z");
});
