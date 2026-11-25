/**
 * TeenRaah currently supports full-order refunds only. Razorpay amounts are
 * expressed in the smallest currency unit (paise for INR).
 */
export const getFullRefundAmountPaise = (orderTotalRupees) => {
  const amount = Number(orderTotalRupees);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new TypeError("Order total must be a positive finite amount");
  }
  return Math.round(amount * 100);
};

export const isFullOrderRefund = (orderTotalRupees, refundAmountPaise) => {
  try {
    return Number(refundAmountPaise) === getFullRefundAmountPaise(orderTotalRupees);
  } catch {
    return false;
  }
};
