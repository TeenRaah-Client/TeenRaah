import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { ok, fail } from "../utils/apiResponse.js";

// @route GET /api/users/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "wishlist",
    select: "name slug price mrp images category stock ratingsAverage",
  });
  // A wishlisted product may since have been deleted — populate() leaves a
  // null in that slot rather than throwing, so filter those out.
  return ok(res, { products: user.wishlist.filter(Boolean) });
});

// @route POST /api/users/wishlist/:productId
export const addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return fail(res, "Product not found", 404);

  await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: product._id } });
  return ok(res, {}, "Added to wishlist");
});

// @route DELETE /api/users/wishlist/:productId
export const removeFromWishlist = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $pull: { wishlist: req.params.productId } });
  return ok(res, {}, "Removed from wishlist");
});
