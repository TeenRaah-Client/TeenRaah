import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionOrder,
  getAllowedOrderTransitions,
} from "../utils/orderLifecycle.js";

test("allows the normal fulfilment lifecycle", () => {
  const path = [
    ["Placed", "Confirmed"],
    ["Confirmed", "Packed"],
    ["Packed", "Shipped"],
    ["Shipped", "Out for Delivery"],
    ["Out for Delivery", "Delivered"],
  ];
  for (const [from, to] of path) assert.equal(canTransitionOrder(from, to), true);
});

test("does not allow cancellation through the generic fulfilment state machine", () => {
  for (const status of ["Placed", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Returned", "Cancelled"]) {
    assert.equal(canTransitionOrder(status, "Cancelled"), false);
  }
});

test("prevents skipping fulfilment states and reopening terminal states", () => {
  assert.equal(canTransitionOrder("Placed", "Shipped"), false);
  assert.equal(canTransitionOrder("Delivered", "Packed"), false);
  assert.equal(canTransitionOrder("Cancelled", "Confirmed"), false);
  assert.equal(canTransitionOrder("Delivered", "Returned"), false);
  assert.deepEqual(getAllowedOrderTransitions("Returned"), []);
});

test("unknown statuses fail closed", () => {
  assert.equal(canTransitionOrder("Unknown", "Delivered"), false);
  assert.deepEqual(getAllowedOrderTransitions("Unknown"), []);
});
