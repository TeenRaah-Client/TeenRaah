import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import { redis } from "../config/redis.js";
import { ok, fail } from "../utils/apiResponse.js";

// Cart lives entirely in Redis, keyed per user — carts are read/written on
// almost every page view, so this avoids hammering Mongo for something
// this ephemeral. It's cleared once the order is actually placed.
const cartKey = (userId) => `cart:${userId}`;
const CART_TTL = 60 * 60 * 24 * 14; // 14 days of inactivity before it's dropped

const readRawCart = async (userId) => {
  const raw = await redis.get(cartKey(userId));
  return raw ? JSON.parse(raw) : [];
};

const writeRawCart = async (userId, items) => {
  await redis.set(cartKey(userId), JSON.stringify(items), "EX", CART_TTL);
};

/** Hydrates the {productId, quantity, color} pairs with live product data. */
const hydrateCart = async (rawItems) => {
  if (!rawItems.length) return { items: [], subtotal: 0 };

  const products = await Product.find({ _id: { $in: rawItems.map((i) => i.productId) } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const items = rawItems
    .filter((i) => productMap.has(i.productId)) // drop items whose product was deleted
    .map((i) => {
      const p = productMap.get(i.productId);
      return {
        productId: p._id,
        name: p.name,
        slug: p.slug,
        image: p.images[0]?.url,
        price: p.price,
        mrp: p.mrp,
        color: i.color || "",
        quantity: i.quantity,
        stock: p.stock,
        lineTotal: p.price * i.quantity,
      };
    });

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return { items, subtotal };
};

// @route GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  const raw = await readRawCart(req.user._id.toString());
  const hydrated = await hydrateCart(raw);
  return ok(res, hydrated);
});

// @route POST /api/cart  { productId, quantity, color }
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, color = "" } = req.body;
  const product = await Product.findById(productId);
  if (!product) return fail(res, "Product not found", 404);
  if (product.stock < 1) return fail(res, "This product is out of stock", 400);

  const userId = req.user._id.toString();
  const raw = await readRawCart(userId);

  const existing = raw.find((i) => i.productId === productId && i.color === color);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + Number(quantity), product.stock);
  } else {
    raw.push({ productId, quantity: Math.min(Number(quantity), product.stock), color });
  }

  await writeRawCart(userId, raw);
  const hydrated = await hydrateCart(raw);
  return ok(res, hydrated, "Added to cart");
});

// @route PUT /api/cart/:productId  { quantity, color }
export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity, color = "" } = req.body;
  const userId = req.user._id.toString();
  let raw = await readRawCart(userId);

  const item = raw.find((i) => i.productId === req.params.productId && i.color === color);
  if (!item) return fail(res, "Item not in cart", 404);

  if (Number(quantity) <= 0) {
    raw = raw.filter((i) => !(i.productId === req.params.productId && i.color === color));
  } else {
    item.quantity = Number(quantity);
  }

  await writeRawCart(userId, raw);
  const hydrated = await hydrateCart(raw);
  return ok(res, hydrated, "Cart updated");
});

// @route DELETE /api/cart/:productId?color=
export const removeCartItem = asyncHandler(async (req, res) => {
  const color = req.query.color || "";
  const userId = req.user._id.toString();
  const raw = (await readRawCart(userId)).filter(
    (i) => !(i.productId === req.params.productId && i.color === color)
  );
  await writeRawCart(userId, raw);
  const hydrated = await hydrateCart(raw);
  return ok(res, hydrated, "Item removed");
});

// @route DELETE /api/cart
export const clearCart = asyncHandler(async (req, res) => {
  await redis.del(cartKey(req.user._id.toString()));
  return ok(res, { items: [], subtotal: 0 }, "Cart cleared");
});

// Internal helper reused by orderController after a successful payment
export const getRawCartForUser = readRawCart;
export const clearCartForUser = (userId) => redis.del(cartKey(userId));
export const hydrateCartForUser = hydrateCart;
