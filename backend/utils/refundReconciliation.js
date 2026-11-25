import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";

/**
 * Finalizes a full refund exactly once. The original wallet contribution is
 * restored in the same MongoDB transaction as the refund state transition,
 * so duplicate webhook deliveries cannot double-credit the customer.
 */
export const markRefundProcessed = async ({ paymentId, refundId, amountPaise }) => {
  const session = await mongoose.startSession();
  let updatedOrder = null;
  try {
    await session.withTransaction(async () => {
      updatedOrder = await Order.findOneAndUpdate(
        {
          "payment.razorpayPaymentId": paymentId,
          "returnRequest.status": { $in: ["processing", "approved"] },
          "returnRequest.refundStatus": { $ne: "processed" },
          ...(refundId
            ? { $or: [{ "returnRequest.refundId": refundId }, { "returnRequest.refundId": "" }, { "returnRequest.refundId": { $exists: false } }] }
            : {}),
        },
        {
          $set: {
            "returnRequest.status": "approved",
            "returnRequest.refundStatus": "processed",
            ...(refundId ? { "returnRequest.refundId": refundId } : {}),
            ...(Number.isFinite(Number(amountPaise)) ? { "returnRequest.refundAmount": Number(amountPaise) / 100 } : {}),
            "payment.status": "refunded",
            status: "Returned",
          },
        },
        { new: true, session }
      );

      if (updatedOrder?.walletUsed > 0) {
        await User.updateOne(
          { _id: updatedOrder.user },
          { $inc: { walletBalance: updatedOrder.walletUsed } },
          { session }
        );
      }
    });
    return updatedOrder;
  } finally {
    await session.endSession();
  }
};
