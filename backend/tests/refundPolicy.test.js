import test from "node:test";
import assert from "node:assert/strict";
import { getFullRefundAmountPaise, isFullOrderRefund } from "../utils/refundPolicy.js";

test("converts a rupee order total to paise without floating point drift", () => {
  assert.equal(getFullRefundAmountPaise(1299), 129900);
  assert.equal(getFullRefundAmountPaise(99.99), 9999);
});

test("accepts only a full-order refund amount", () => {
  assert.equal(isFullOrderRefund(1299, 129900), true);
  assert.equal(isFullOrderRefund(1299, 50000), false);
  assert.equal(isFullOrderRefund(1299, "129900"), true);
});

test("rejects invalid order totals and malformed refund amounts", () => {
  assert.throws(() => getFullRefundAmountPaise(0), TypeError);
  assert.throws(() => getFullRefundAmountPaise("not-a-number"), TypeError);
  assert.equal(isFullOrderRefund(1299, undefined), false);
});
