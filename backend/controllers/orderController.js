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
import { canTransitionOrder } from "../utils/orderLifecycle.js";
import mongoose from "mongoose";
import razorpay from "../config/razorpay.js";
import { canRequestReturn, RETURN_WINDOW_DAYS } from "../utils/returnPolicy.js";
import { markRefundProcessed } from "../utils/refundReconciliation.js";
import { getFullRefundAmountPaise, isFullOrderRefund } from "../utils/refundPolicy.js";
import { buildOrderInvoiceData } from "../utils/invoiceBuilder.js";

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

// @route GET /api/orders/:id/invoice
// Returns structured GST tax invoice data for the order owner or admin.
export const getOrderInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return fail(res, "Order not found", 404);
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return fail(res, "Not authorized to view this invoice", 403);
  }
  const invoice = buildOrderInvoiceData(order);
  return ok(res, { invoice });
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
  if (typeof status !== "string" || !status.trim()) {
    return fail(res, "A valid order status is required", 400);
  }

  // Paid orders must never be marked cancelled or returned through this
  // generic fulfilment editor. Those operations affect captured funds and
  // must use a dedicated refund workflow with gateway reconciliation.
  if (status === "Returned") {
    return fail(res, "Returns must be completed through the return-review workflow so the refund is reconciled", 409);
  }
  if (status === "Cancelled") {
    return fail(res, "Paid orders cannot be cancelled from the status editor. A refund-backed cancellation workflow is required", 409);
  }

  // Keep fulfilment state changes transactional. Cancellation is deliberately
  // excluded here until a refund-backed cancellation workflow is used.
  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      order = await Order.findById(req.params.id).session(session).populate("user", "name email");
      if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
      }
      if (!canTransitionOrder(order.status, status)) {
        const error = new Error(`Invalid order transition: ${order.status} → ${status}`);
        error.statusCode = 409;
        throw error;
      }

      order.status = status;
      order.trackingHistory.push({ status, note: note || "", at: new Date() });
      await order.save({ session });
    });
  } catch (error) {
    if (error.statusCode) return fail(res, error.message, error.statusCode);
    throw error;
  } finally {
    await session.endSession();
  }

  // Side effects happen only after the database transaction commits.
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


// @route POST /api/orders/:id/return
// Customer return request. A request is only accepted for paid, delivered
// orders inside the published return window. No inventory is restocked here.
export const requestOrderReturn = asyncHandler(async (req, res) => {
  const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";
  const customerNote = typeof req.body.note === "string" ? req.body.note.trim() : "";
  const allowedReasons = ["Damaged item", "Wrong item received", "Different from description", "Quality issue", "Other"];
  if (!allowedReasons.includes(reason)) return fail(res, "Select a valid return reason", 400);
  if (customerNote.length > 1000) return fail(res, "Return note must be 1,000 characters or fewer", 400);

  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return fail(res, "Order not found", 404);
  if (!canRequestReturn({
    orderStatus: order.status,
    paymentStatus: order.payment?.status,
    trackingHistory: order.trackingHistory,
  })) {
    return fail(res, `Returns are available for paid, delivered orders within ${RETURN_WINDOW_DAYS} days of delivery`, 409);
  }

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, user: req.user._id, status: "Delivered", "payment.status": "paid", "returnRequest.status": "none" },
    {
      $set: {
        "returnRequest.status": "requested",
        "returnRequest.reason": reason,
        "returnRequest.customerNote": customerNote,
        "returnRequest.requestedAt": new Date(),
        "returnRequest.refundStatus": "none",
      },
    },
    { new: true, runValidators: true }
  );
  if (!updated) return fail(res, "A return request already exists or the order is no longer eligible", 409);
  return ok(res, { order: updated }, "Return request submitted for review", 201);
});

// @route GET /api/admin/orders/returns
export const getReturnRequests = asyncHandler(async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : "requested";
  const allowed = ["requested", "processing", "approved", "rejected"];
  if (!allowed.includes(status)) return fail(res, "Invalid return-request status filter", 400);
  const orders = await Order.find({ "returnRequest.status": status })
    .populate("user", "name email phone")
    .sort({ "returnRequest.requestedAt": -1 });
  return ok(res, { orders });
});

// @route PUT /api/admin/orders/:id/return
// Approval triggers one full Razorpay refund. The request is atomically moved
// to processing before calling Razorpay. If the gateway response is ambiguous,
// it remains processing with refundStatus=unknown for manual reconciliation;
// the endpoint deliberately will not issue a second refund automatically.
export const reviewOrderReturn = asyncHandler(async (req, res) => {
  const action = req.body.action;
  const adminNote = typeof req.body.note === "string" ? req.body.note.trim() : "";
  if (!["approve", "reject"].includes(action)) return fail(res, "Action must be approve or reject", 400);
  if (adminNote.length > 1000) return fail(res, "Admin note must be 1,000 characters or fewer", 400);

  if (action === "reject") {
    const rejected = await Order.findOneAndUpdate(
      { _id: req.params.id, "returnRequest.status": "requested" },
      {
        $set: {
          "returnRequest.status": "rejected",
          "returnRequest.reviewedAt": new Date(),
          "returnRequest.reviewedBy": req.user._id,
          "returnRequest.adminNote": adminNote,
        },
      },
      { new: true, runValidators: true }
    ).populate("user", "name email");
    if (!rejected) return fail(res, "Return request not found or already reviewed", 409);
    await recordAuditLog({ req, action: "order.return_rejected", targetType: "Order", targetId: rejected._id, summary: `Rejected return for ${rejected.orderNumber}` });
    return ok(res, { order: rejected }, "Return request rejected");
  }

  const claimed = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      status: "Delivered",
      "payment.status": "paid",
      "payment.razorpayPaymentId": { $exists: true, $ne: "" },
      "returnRequest.status": "requested",
    },
    {
      $set: {
        "returnRequest.status": "processing",
        "returnRequest.refundStatus": "pending",
        "returnRequest.reviewedAt": new Date(),
        "returnRequest.reviewedBy": req.user._id,
        "returnRequest.adminNote": adminNote,
        "returnRequest.refundAmount": 0,
      },
    },
    { new: true, runValidators: true }
  ).populate("user", "name email");
  if (!claimed) return fail(res, "Eligible pending return request not found, or payment reference is unavailable", 409);

  const refundAmountPaise = getFullRefundAmountPaise(claimed.totalAmount);
  try {
    const refund = await razorpay.payments.refund(claimed.payment.razorpayPaymentId, {
      amount: refundAmountPaise,
      notes: { orderNumber: claimed.orderNumber, reason: claimed.returnRequest.reason },
    });
    if (!isFullOrderRefund(claimed.totalAmount, refund.amount) || !refund.id) {
      throw new Error("Razorpay returned an unexpected refund amount or missing refund reference");
    }

    // Persist the gateway response without overwriting a refund.processed
    // webhook that may have arrived before this HTTP response.
    let approved = await Order.findOneAndUpdate(
      { _id: claimed._id, "returnRequest.status": { $in: ["processing", "approved"] } },
      {
        $set: {
          status: "Returned",
          "returnRequest.status": "approved",
          "returnRequest.refundId": refund.id || "",
          "returnRequest.refundAmount": refundAmountPaise / 100,
          "returnRequest.refundStatus": refund.status === "failed" ? "failed" : "pending",
        },
        $push: {
          trackingHistory: {
            status: "Returned",
            note: `Return approved. Razorpay refund ${refund.id || "submitted"}. Item requires inspection before inventory restock.`,
            at: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    ).populate("user", "name email");
    if (!approved) approved = await Order.findById(claimed._id).populate("user", "name email");

    if (refund.status === "processed") {
      await markRefundProcessed({
        paymentId: claimed.payment.razorpayPaymentId,
        refundId: refund.id,
        amountPaise: refundAmountPaise,
      });
      approved = await Order.findById(claimed._id).populate("user", "name email");
    }
    emitOrderUpdate(approved.user._id.toString(), approved);
    sendOrderStatusEmail({ to: approved.user.email, name: approved.user.name, orderNumber: approved.orderNumber, status: "Returned" }).catch(() => {});
    await recordAuditLog({ req, action: "order.return_approved", targetType: "Order", targetId: approved._id, summary: `Approved return and initiated refund for ${approved.orderNumber}`, metadata: { refundId: refund.id, amount: refundAmountPaise / 100, refundStatus: approved.returnRequest.refundStatus } });
    return ok(res, { order: approved }, "Return approved and refund submitted to Razorpay");
  } catch (error) {
    // Do not reset to requested: the gateway may have accepted the refund
    // even if the network timed out before returning its response. Reconcile
    // the payment in Razorpay Dashboard before taking any further action.
    await Order.updateOne(
      { _id: claimed._id, "returnRequest.status": "processing" },
      { $set: { "returnRequest.refundStatus": "unknown", "returnRequest.adminNote": [adminNote, `Gateway response requires reconciliation: ${error.message}`].filter(Boolean).join("\n") } }
    );
    await recordAuditLog({ req, action: "order.return_refund_unknown", targetType: "Order", targetId: claimed._id, summary: `Refund response requires manual reconciliation for ${claimed.orderNumber}` });
    return fail(res, "Razorpay did not return a definitive refund result. Do not retry; reconcile this payment in the Razorpay Dashboard.", 502);
  }
});
