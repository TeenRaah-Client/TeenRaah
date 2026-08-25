import asyncHandler from "express-async-handler";
import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import { redis } from "../config/redis.js";
import { ok, fail } from "../utils/apiResponse.js";
import { getRawCartForUser, hydrateCartForUser, clearCartForUser } from "./cartController.js";
import { findValidCouponOrThrow } from "./couponController.js";
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE, PAYMENT_INTENT_TTL_SECONDS } from "../utils/constants.js";

const intentKey = (razorpayOrderId) => `payment_intent:${razorpayOrderId}`;

// @route POST /api/payment/create-order
// body: { addressId, couponCode?, useWallet? }
// Computes the real, trusted total server-side and opens a Razorpay order for it.
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { addressId, couponCode, useWallet } = req.body;

  const address = req.user.addresses.id(addressId);
  if (!address) return fail(res, "Select a valid delivery address", 400);

  const rawCart = await getRawCartForUser(req.user._id.toString());
  const { items, subtotal } = await hydrateCartForUser(rawCart);
  if (!items.length) return fail(res, "Your cart is empty", 400);

  // Stock sanity check before we ask the customer to pay
  const outOfStock = items.find((i) => i.quantity > i.stock);
  if (outOfStock) return fail(res, `${outOfStock.name} only has ${outOfStock.stock} left in stock`, 400);

  let discount = 0;
  let appliedCouponCode = null;
  if (couponCode) {
    try {
      const result = await findValidCouponOrThrow(couponCode, subtotal, req.user._id);
      discount = result.discount;
      appliedCouponCode = result.coupon.code;
    } catch (err) {
      return fail(res, err.message, 400);
    }
  }

  const afterCoupon = subtotal - discount;
  const deliveryFee = afterCoupon >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

  // Wallet can cover most of the order but we always leave a minimum ₹1
  // payable through Razorpay rather than special-casing a ₹0 gateway order.
  let walletUsed = 0;
  if (useWallet && req.user.walletBalance > 0) {
    const maxUsable = Math.max(0, afterCoupon + deliveryFee - 1);
    walletUsed = Math.min(req.user.walletBalance, maxUsable);
  }

  const totalAmount = Math.max(1, Math.round(afterCoupon + deliveryFee - walletUsed));

  const razorpayOrder = await razorpay.orders.create({
    amount: totalAmount * 100, // paise
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
  });

  const intent = {
    userId: req.user._id.toString(),
    items: items.map((i) => ({
      product: i.productId,
      name: i.name,
      image: i.image,
      price: i.price,
      quantity: i.quantity,
      color: i.color,
    })),
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
      lat: address.lat,
      lng: address.lng,
    },
    itemsTotal: subtotal,
    discount,
    couponCode: appliedCouponCode,
    deliveryFee,
    walletUsed,
    totalAmount,
  };

  await redis.set(intentKey(razorpayOrder.id), JSON.stringify(intent), "EX", PAYMENT_INTENT_TTL_SECONDS);

  return ok(res, {
    razorpayOrderId: razorpayOrder.id,
    amount: totalAmount,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
    pricing: { itemsTotal: subtotal, discount, deliveryFee, walletUsed, totalAmount },
  });
});

// Exported so orderController can build the actual Order after verification
// without a circular import back into paymentController.
export const consumePaymentIntent = async (razorpayOrderId) => {
  const raw = await redis.get(intentKey(razorpayOrderId));
  if (!raw) return null;
  await redis.del(intentKey(razorpayOrderId));
  return JSON.parse(raw);
};

// @route POST /api/payment/verify
// body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
export const verifyPaymentSignature = asyncHandler(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return fail(res, "Missing payment verification fields", 400);
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return fail(res, "Payment verification failed. If money was deducted, it will be auto-refunded.", 400);
  }

  // Hand off to the order controller to actually create the Order document,
  // decrement stock, apply referral rewards, and emit the real-time events.
  req.paymentVerified = { razorpay_order_id, razorpay_payment_id, razorpay_signature };
  next();
});
