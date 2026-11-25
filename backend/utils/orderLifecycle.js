/**
 * Explicit order-state machine. A status may only move forward through the
 * fulfilment lifecycle. Cancellation and return are deliberately excluded:
 * both affect captured funds and require dedicated refund workflows.
 */
export const ORDER_TRANSITIONS = Object.freeze({
  Placed: ["Confirmed"],
  Confirmed: ["Packed"],
  Packed: ["Shipped"],
  Shipped: ["Out for Delivery"],
  "Out for Delivery": ["Delivered"],
  Delivered: [],
  Cancelled: [],
  Returned: [],
});

export const canTransitionOrder = (currentStatus, nextStatus) =>
  Boolean(ORDER_TRANSITIONS[currentStatus]?.includes(nextStatus));

export const getAllowedOrderTransitions = (currentStatus) =>
  [...(ORDER_TRANSITIONS[currentStatus] || [])];
