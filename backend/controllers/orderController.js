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

// Mounted as the second handler on POST /api/payment/verify, right after
// verifyPaymentSignature confirms the Razorpay signature is genuine.
export const finalizeOrderFromPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.paymentVerified;

  const intent = await consumePaymentIntent(razorpay_order_id);
  if (!intent) {
    return fail(res, "This payment session expired. If money was deducted, contact support with your payment ID.", 400);
  }
  if (intent.userId !== req.user._id.toString()) {
    return fail(res, "Order session mismatch", 400);
  }

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: req.user._id,
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
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: "paid",
      paidAt: new Date(),
    },
    status: "Placed",
    trackingHistory: [{ status: "Placed", note: "Order placed and payment confirmed" }],
    estimatedDelivery,
  });

  // Decrement stock (sequential — see README for the Atlas-transaction note)
  await Promise.all(
    intent.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: -i.quantity } }))
  );

  if (intent.couponCode) {
    await Coupon.updateOne({ code: intent.couponCode }, { $inc: { usedCount: 1 } });
  }

  const user = await User.findById(req.user._id);
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

  await clearCartForUser(req.user._id.toString());

  emitOrderUpdate(req.user._id.toString(), order);
  emitNewOrderToAdmin(order);
  sendOrderStatusEmail({ to: user.email, name: user.name, orderNumber: order.orderNumber, status: "Placed" }).catch(
    () => {}
  );

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

  return ok(res, { order }, "Order status updated");
});
