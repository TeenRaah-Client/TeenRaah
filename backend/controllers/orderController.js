import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Coupon from "../models/Coupon.js";
import { ok, fail } from "../utils/apiResponse.js";
import { generateOrderNumber } from "../utils/generateCodes.js";
import { consumePaymentIntent } from "./paymentController.js";
import { clearCartForUser } from "./cartController.js";
import { emitOrderUpdate, emitNewOrderToAdmin } from "../sockets/index.js";
import { sendOrderStatusEmail } from "../utils/sendEmail.js";
import { REFERRAL_REFERRER_REWARD, REFERRAL_NEW_USER_BONUS } from "../utils/constants.js";
import { recordAuditLog } from "../utils/auditLog.js";

// Core order-finalization logic, usable both from the browser-driven
// /api/payment/verify flow AND from the Razorpay webhook (webhookController.js)
// — the webhook has no req.user, so userId always comes from the stored
// payment intent itself, never from a request session.
//
// Returns { order, alreadyFinalized: false } on success, or
// { order: null, alreadyFinalized: true } if this payment was already
// finalized by the other path (the intent is gone from Redis either way —
// exactly once, whichever route gets there first).
export const finalizeOrderCore = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const intent = await consumePaymentIntent(razorpayOrderId);
  if (!intent) {
    return { order: null, alreadyFinalized: true };
  }

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  // Atomic, conditional decrement — the $gte guard means this can never push
  // stock negative, even if two customers pay for the last unit in the same
  // instant. Stock was already checked (non-atomically) back when the
  // Razorpay order was created, so a failure here means someone else bought
  // the last one in the narrow window between then and payment completing —
  // rare, but real under concurrent checkouts on a popular item. Since the
  // customer has *already paid* at this point, we don't silently drop their
  // order — we still create it, flag it, and let the admin resolve it
  // (refund or restock) rather than pretending this is solved automatically.
  const stockResults = await Promise.all(
    intent.items.map((i) =>
      Product.updateOne({ _id: i.product, stock: { $gte: i.quantity } }, { $inc: { stock: -i.quantity } })
    )
  );
  const stockIssues = intent.items.filter((_, idx) => stockResults[idx].modifiedCount === 0);
  if (stockIssues.length > 0) {
    console.warn(
      `⚠️  Stock oversold on paid order (payment ${razorpayPaymentId}): ${stockIssues.map((i) => i.name).join(", ")}`
    );
  }

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: intent.userId,
    items: intent.items,
    shippingAddress: intent.shippingAddress,
    itemsTotal: intent.itemsTotal,
    discount: intent.discount,
    couponCode: intent.couponCode,
    walletUsed: intent.walletUsed,
    deliveryFee: intent.deliveryFee,
    totalAmount: intent.totalAmount,
    payment: {
      method: "razorpay",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      status: "paid",
      paidAt: new Date(),
    },
    status: "Placed",
    hasStockIssue: stockIssues.length > 0,
    trackingHistory: [
      {
        status: "Placed",
        note:
          stockIssues.length > 0
            ? `Payment confirmed, but ${stockIssues.map((i) => i.name).join(", ")} sold out in the same moment — needs admin attention (refund or restock).`
            : "Order placed and payment confirmed",
      },
    ],
    estimatedDelivery,
  });

  if (intent.couponCode) {
    await Coupon.updateOne({ code: intent.couponCode }, { $inc: { usedCount: 1 } });
  }

  const user = await User.findById(intent.userId);
  if (user) {
    if (intent.walletUsed > 0) {
      user.walletBalance = Math.max(0, user.walletBalance - intent.walletUsed);
    }

    // First-ever paid order from someone who signed up via a referral code:
    // reward both sides of the loop.
    if (user.referredBy && !user.referralRewardGiven) {
      const priorPaidOrders = await Order.countDocuments({
        user: user._id,
        "payment.status": "paid",
        _id: { $ne: order._id },
      });
      if (priorPaidOrders === 0) {
        await User.updateOne({ _id: user.referredBy }, { $inc: { walletBalance: REFERRAL_REFERRER_REWARD } });
        user.walletBalance += REFERRAL_NEW_USER_BONUS;
        user.referralRewardGiven = true;
      }
    }
    await user.save();
    await clearCartForUser(intent.userId);
    sendOrderStatusEmail({ to: user.email, name: user.name, orderNumber: order.orderNumber, status: "Placed" }).catch(
      () => {}
    );
  }

  emitOrderUpdate(intent.userId, order);
  emitNewOrderToAdmin(order);

  return { order, alreadyFinalized: false };
};

// Mounted as the second handler on POST /api/payment/verify, right after
// verifyPaymentSignature confirms the Razorpay signature is genuine.
export const finalizeOrderFromPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.paymentVerified;

  const { order, alreadyFinalized } = await finalizeOrderCore({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });

  if (alreadyFinalized) {
    // Most likely the Razorpay webhook (see webhookController.js) already
    // finalized this exact payment moments earlier — not an error, just tell
    // the browser to go find the order it already has.
    const existing = await Order.findOne({ "payment.razorpayOrderId": razorpay_order_id, user: req.user._id });
    if (existing) return ok(res, { order: existing }, "Order placed successfully!", 201);
    return fail(res, "This payment session expired. If money was deducted, contact support with your payment ID.", 400);
  }

  if (order.user.toString() !== req.user._id.toString()) {
    return fail(res, "Order session mismatch", 400);
  }

  return ok(res, { order }, "Order placed successfully!", 201);
});

// @route GET /api/orders/mine
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  return ok(res, { orders });
});

// @route GET /api/orders/:id  (also used as the tracking page data source)
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return fail(res, "Order not found", 404);
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return fail(res, "Not authorized to view this order", 403);
  }
  return ok(res, { order });
});

// ---------------- Admin ----------------

// @route GET /api/admin/orders?status=&page=&limit=
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Number(limit));

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments(query),
  ]);

  return ok(res, { orders, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

// @route PUT /api/admin/orders/:id/status  { status, note }
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) return fail(res, "Order not found", 404);

  order.status = status;
  order.trackingHistory.push({ status, note: note || "", at: new Date() });
  if (status === "Cancelled") {
    // restock on cancellation
    await Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } })));
  }
  await order.save();

  emitOrderUpdate(order.user._id.toString(), order);
  sendOrderStatusEmail({ to: order.user.email, name: order.user.name, orderNumber: order.orderNumber, status }).catch(
    () => {}
  );

  await recordAuditLog({
    req,
    action: "order.status_update",
    targetType: "Order",
    targetId: order._id,
    summary: `Marked order ${order.orderNumber} as "${status}"`,
  });
  return ok(res, { order }, "Order status updated");
});
