import asyncHandler from "express-async-handler";
import Coupon from "../models/Coupon.js";
import { ok, fail } from "../utils/apiResponse.js";

const calcDiscount = (coupon, subtotal) => {
  let discount =
    coupon.discountType === "percentage" ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  return Math.min(Math.round(discount), subtotal);
};

/**
 * Shared validation used by both the /validate endpoint and the payment
 * controller (which must re-validate server-side rather than trust
 * whatever discount the client says it already applied).
 * Returns { coupon, discount } or throws an Error with a user-facing message.
 */
export const findValidCouponOrThrow = async (code, subtotal, userId) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) throw new Error("Invalid coupon code");
  if (!coupon.isValidNow()) throw new Error("This coupon has expired or is no longer active");
  if (coupon.assignedTo && coupon.assignedTo.toString() !== userId.toString()) {
    throw new Error("This coupon isn't valid for your account");
  }
  if (subtotal < coupon.minOrderValue) {
    throw new Error(`Add ₹${coupon.minOrderValue - subtotal} more to use this coupon`);
  }
  return { coupon, discount: calcDiscount(coupon, subtotal) };
};

// @route POST /api/coupons/validate  { code, subtotal }
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code || subtotal == null) return fail(res, "Coupon code and subtotal are required", 400);

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) return fail(res, "Invalid coupon code", 404);
  if (!coupon.isValidNow()) return fail(res, "This coupon has expired or is no longer active", 400);
  if (coupon.assignedTo && coupon.assignedTo.toString() !== req.user._id.toString()) {
    return fail(res, "This coupon isn't valid for your account", 400);
  }
  if (subtotal < coupon.minOrderValue) {
    return fail(res, `Add ₹${coupon.minOrderValue - subtotal} more to use this coupon`, 400);
  }

  const discount = calcDiscount(coupon, subtotal);
  return ok(res, { code: coupon.code, discount, discountType: coupon.discountType }, "Coupon applied");
});

// ---------------- Admin ----------------

// @route GET /api/admin/coupons
export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 });
  return ok(res, { coupons });
});

// @route POST /api/admin/coupons
export const createCoupon = asyncHandler(async (req, res) => {
  const { code, description, discountType, discountValue, maxDiscount, minOrderValue, usageLimit, expiresAt } =
    req.body;

  if (!code || !discountType || !discountValue || !expiresAt) {
    return fail(res, "Code, discount type, value and expiry are required", 400);
  }

  const exists = await Coupon.findOne({ code: code.toUpperCase() });
  if (exists) return fail(res, "A coupon with this code already exists", 400);

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue,
    maxDiscount: maxDiscount || null,
    minOrderValue: minOrderValue || 0,
    usageLimit: usageLimit || null,
    expiresAt,
    createdBy: req.user._id,
  });

  return ok(res, { coupon }, "Coupon created", 201);
});

// @route PUT /api/admin/coupons/:id
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return fail(res, "Coupon not found", 404);

  const fields = ["description", "discountType", "discountValue", "maxDiscount", "minOrderValue", "usageLimit", "expiresAt", "isActive"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) coupon[f] = req.body[f];
  });

  await coupon.save();
  return ok(res, { coupon }, "Coupon updated");
});

// @route DELETE /api/admin/coupons/:id
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return fail(res, "Coupon not found", 404);
  await coupon.deleteOne();
  return ok(res, {}, "Coupon deleted");
});
