import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { ok } from "../utils/apiResponse.js";
import { buildCategoryPreferences, rankRecommendedProducts } from "../utils/productRecommendations.js";

const RECOMMENDATION_LIMIT = 8;
const RECENT_ORDER_LIMIT = 10;

// @route GET /api/products/recommendations
// Optional-auth, read-only recommendations. No customer profile fields are
// returned and anonymous visitors receive a popular-product fallback.
export const getProductRecommendations = asyncHandler(async (req, res) => {
  let preferences = [];
  const excludedIds = new Set();

  if (req.user?._id) {
    const wishlistIds = (req.user.wishlist || []).map((id) => String(id));
    wishlistIds.forEach((id) => excludedIds.add(id));

    const [wishlistProducts, recentOrders] = await Promise.all([
      wishlistIds.length
        ? Product.find({ _id: { $in: wishlistIds }, isActive: true }).select("category").lean()
        : [],
      Order.find({ user: req.user._id, "payment.status": "paid" })
        .sort({ createdAt: -1 })
        .limit(RECENT_ORDER_LIMIT)
        .select("items.product")
        .lean(),
    ]);

    const purchasedIds = [...new Set(
      recentOrders.flatMap((order) => (order.items || []).map((item) => String(item.product)))
    )];
    purchasedIds.forEach((id) => excludedIds.add(id));

    const purchasedProducts = purchasedIds.length
      ? await Product.find({ _id: { $in: purchasedIds }, isActive: true }).select("category").lean()
      : [];

    preferences = buildCategoryPreferences({
      wishlistCategories: wishlistProducts.map((product) => product.category),
      purchasedCategories: purchasedProducts.map((product) => product.category),
    });
  }

  const preferredCategories = preferences.map((item) => item.category);
  const baseQuery = {
    isActive: true,
    stock: { $gt: 0 },
    ...(excludedIds.size ? { _id: { $nin: [...excludedIds] } } : {}),
  };

  let candidates = preferredCategories.length
    ? await Product.find({ ...baseQuery, category: { $in: preferredCategories } })
        .select("name slug price mrp images category ratingsAverage ratingsCount stock")
        .limit(40)
        .lean()
    : [];

  if (candidates.length < RECOMMENDATION_LIMIT) {
    const fallback = await Product.find(baseQuery)
      .select("name slug price mrp images category ratingsAverage ratingsCount stock")
      .sort({ ratingsAverage: -1, ratingsCount: -1, createdAt: -1 })
      .limit(24)
      .lean();
    const seen = new Set(candidates.map((product) => String(product._id)));
    candidates.push(...fallback.filter((product) => !seen.has(String(product._id))));
  }

  const ranked = rankRecommendedProducts(candidates, preferences).slice(0, RECOMMENDATION_LIMIT);
  return ok(res, {
    products: ranked,
    personalized: Boolean(req.user?._id && preferences.length),
    basis: req.user?._id && preferences.length ? "wishlist_and_recent_paid_orders" : "popular_products",
  });
});
