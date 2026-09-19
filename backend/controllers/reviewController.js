import asyncHandler from "express-async-handler";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { ok, fail } from "../utils/apiResponse.js";
import { cacheDeleteByPrefix } from "../config/redis.js";
import { recordAuditLog } from "../utils/auditLog.js";

/** Recomputes a product's ratingsAverage/ratingsCount from its actual
 * visible reviews — called after any review is created, edited, hidden, or
 * deleted so the number on the product card never drifts from reality. */
const recalculateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId, isVisible: true } },
    { $group: { _id: "$product", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const { avg, count } = stats[0] || { avg: 0, count: 0 };
  await Product.updateOne(
    { _id: productId },
    { ratingsAverage: count > 0 ? Math.round(avg * 10) / 10 : 0, ratingsCount: count }
  );
  await cacheDeleteByPrefix("products:list:");
  await cacheDeleteByPrefix("products:detail:");
};

// @route GET /api/products/:slug/reviews
export const getProductReviews = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) return fail(res, "Product not found", 404);

  const reviews = await Review.find({ product: product._id, isVisible: true })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  return ok(res, { reviews });
});

// @route GET /api/products/:slug/reviews/eligibility
// Tells the frontend whether the logged-in customer can review this product
// (and whether they already have) — drives whether the "Write a Review"
// button shows up at all.
export const getReviewEligibility = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) return fail(res, "Product not found", 404);

  const [deliveredOrder, existingReview] = await Promise.all([
    Order.findOne({ user: req.user._id, status: "Delivered", "items.product": product._id }).sort({ createdAt: -1 }),
    Review.findOne({ product: product._id, user: req.user._id }),
  ]);

  return ok(res, {
    canReview: Boolean(deliveredOrder) && !existingReview,
    hasReviewed: Boolean(existingReview),
    existingReview: existingReview || null,
    reason: !deliveredOrder ? "You can review this product once your order for it is delivered." : null,
  });
});

// @route POST /api/products/:slug/reviews   body: { rating, comment }
export const submitReview = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) return fail(res, "Product not found", 404);

  // The strict part: only someone with a DELIVERED order containing this
  // product can review it — never just "logged in and asked nicely".
  const deliveredOrder = await Order.findOne({
    user: req.user._id,
    status: "Delivered",
    "items.product": product._id,
  }).sort({ createdAt: -1 });

  if (!deliveredOrder) {
    return fail(res, "You can only review products from a delivered order", 403);
  }

  const { rating, comment } = req.body;

  const review = await Review.findOneAndUpdate(
    { product: product._id, user: req.user._id },
    { rating, comment, order: deliveredOrder._id, isVisible: true },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await recalculateProductRating(product._id);
  return ok(res, { review }, "Review submitted — thank you!", 201);
});

// @route DELETE /api/products/:slug/reviews/mine
export const deleteMyReview = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) return fail(res, "Product not found", 404);

  await Review.deleteOne({ product: product._id, user: req.user._id });
  await recalculateProductRating(product._id);
  return ok(res, {}, "Review removed");
});

// ---------------- Admin moderation ----------------

// @route GET /api/admin/reviews
export const getAllReviewsAdmin = asyncHandler(async (req, res) => {
  const reviews = await Review.find({})
    .populate("user", "name email")
    .populate("product", "name slug")
    .sort({ createdAt: -1 });
  return ok(res, { reviews });
});

// @route PUT /api/admin/reviews/:id/visibility   body: { isVisible }
export const setReviewVisibility = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return fail(res, "Review not found", 404);

  review.isVisible = Boolean(req.body.isVisible);
  await review.save();
  await recalculateProductRating(review.product);
  await recordAuditLog({
    req,
    action: "review.visibility",
    targetType: "Review",
    targetId: review._id,
    summary: `${review.isVisible ? "Shown" : "Hidden"} a review (rating ${review.rating}/5)`,
  });
  return ok(res, { review }, review.isVisible ? "Review shown" : "Review hidden");
});

// @route DELETE /api/admin/reviews/:id
export const deleteReviewAdmin = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return fail(res, "Review not found", 404);

  await review.deleteOne();
  await recalculateProductRating(review.product);
  await recordAuditLog({
    req,
    action: "review.delete",
    targetType: "Review",
    targetId: review._id,
    summary: `Deleted a review (rating ${review.rating}/5)`,
  });
  return ok(res, {}, "Review deleted");
});
