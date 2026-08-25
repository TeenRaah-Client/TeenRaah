import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import { ok, fail } from "../utils/apiResponse.js";
import { cacheGet, cacheSet, cacheDeleteByPrefix } from "../config/redis.js";
import cloudinary, { uploadBufferToCloudinary, deleteFromCloudinary, buildAiStudioUrl } from "../config/cloudinary.js";

const LIST_CACHE_PREFIX = "products:list:";
const DETAIL_CACHE_PREFIX = "products:detail:";
const LIST_TTL = 120; // seconds — short enough that stock/price edits show up fast
const DETAIL_TTL = 300;

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

/** aiStudioImages arrives as a JSON string inside the multipart form — images
 * the admin already ran through AI Photo Studio and confirmed, so they should
 * be attached as-is rather than re-uploaded. */
const parseAiStudioImages = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i?.url && i?.publicId)
      .map((i) => ({ url: i.url, publicId: i.publicId }));
  } catch {
    return [];
  }
};

// @route  GET /api/products
// Supports: ?category=&search=&minPrice=&maxPrice=&sort=&page=&limit=&featured=
export const getProducts = asyncHandler(async (req, res) => {
  const { category, search, minPrice, maxPrice, sort, featured, page = 1, limit = 12 } = req.query;

  const cacheKey = `${LIST_CACHE_PREFIX}${JSON.stringify(req.query)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return ok(res, cached);

  const query = { isActive: true };
  if (category) query.category = category;
  if (featured === "true") query.isFeatured = true;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (search) query.$text = { $search: search };

  const sortMap = {
    priceLowHigh: { price: 1 },
    priceHighLow: { price: -1 },
    newest: { createdAt: -1 },
    rating: { ratingsAverage: -1 },
  };
  const sortBy = sortMap[sort] || { createdAt: -1 };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Number(limit));

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sortBy)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(query),
  ]);

  const payload = {
    products,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  };

  await cacheSet(cacheKey, payload, LIST_TTL);
  return ok(res, payload);
});

// @route  GET /api/products/categories  (distinct list for the nav/dome icons)
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct("category", { isActive: true });
  return ok(res, { categories });
});

// @route  GET /api/products/:slug
export const getProductBySlug = asyncHandler(async (req, res) => {
  const cacheKey = `${DETAIL_CACHE_PREFIX}${req.params.slug}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return ok(res, { product: cached });

  const product = await Product.findOne({ slug: req.params.slug, isActive: true });
  if (!product) return fail(res, "Product not found", 404);

  await cacheSet(cacheKey, product, DETAIL_TTL);
  return ok(res, { product });
});

// @route  POST /api/admin/products
export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, category, price, mrp, colors, material, capacityLitres, stock, tags, saleEndsAt } =
    req.body;

  if (!name || !description || !category || !price || !mrp) {
    return fail(res, "Name, description, category, price and MRP are required", 400);
  }

  const aiStudioImages = parseAiStudioImages(req.body.aiStudioImages);
  if (!req.files?.images?.length && aiStudioImages.length === 0) {
    return fail(res, "At least one product image is required", 400);
  }

  const uploadedImages = req.files?.images?.length
    ? await Promise.all(
        req.files.images.map((f) =>
          uploadBufferToCloudinary(f.buffer, { folder: "teenraah/products/images", resourceType: "image" })
        )
      )
    : [];
  const videos = req.files?.videos?.length
    ? await Promise.all(
        req.files.videos.map((f) =>
          uploadBufferToCloudinary(f.buffer, { folder: "teenraah/products/videos", resourceType: "video" })
        )
      )
    : [];

  let slug = slugify(name);
  const clash = await Product.findOne({ slug });
  if (clash) slug = `${slug}-${Date.now().toString(36)}`;

  const product = await Product.create({
    name,
    slug,
    description,
    category,
    price: Number(price),
    mrp: Number(mrp),
    colors: colors ? String(colors).split(",").map((c) => c.trim()) : [],
    material,
    capacityLitres: capacityLitres ? Number(capacityLitres) : undefined,
    stock: Number(stock) || 0,
    tags: tags ? String(tags).split(",").map((t) => t.trim()) : [],
    saleEndsAt: saleEndsAt || null,
    // AI Studio images go first — they're the ones the admin deliberately
    // polished, so they make the strongest default main-image candidates.
    images: [...aiStudioImages, ...uploadedImages.map((img) => ({ url: img.secure_url, publicId: img.public_id }))],
    videos: videos.map((v) => ({ url: v.secure_url, publicId: v.public_id })),
    createdBy: req.user._id,
  });

  await cacheDeleteByPrefix(LIST_CACHE_PREFIX);
  return ok(res, { product }, "Product created", 201);
});

// @route  PUT /api/admin/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return fail(res, "Product not found", 404);

  const editableFields = [
    "name",
    "description",
    "category",
    "price",
    "mrp",
    "material",
    "capacityLitres",
    "stock",
    "isFeatured",
    "isActive",
    "saleEndsAt",
  ];
  editableFields.forEach((f) => {
    if (req.body[f] !== undefined) product[f] = req.body[f];
  });
  if (req.body.colors) product.colors = String(req.body.colors).split(",").map((c) => c.trim());
  if (req.body.tags) product.tags = String(req.body.tags).split(",").map((t) => t.trim());

  if (req.files?.images?.length) {
    const newImages = await Promise.all(
      req.files.images.map((f) =>
        uploadBufferToCloudinary(f.buffer, { folder: "teenraah/products/images", resourceType: "image" })
      )
    );
    product.images.push(...newImages.map((img) => ({ url: img.secure_url, publicId: img.public_id })));
  }
  const aiStudioImages = parseAiStudioImages(req.body.aiStudioImages);
  if (aiStudioImages.length) {
    product.images.push(...aiStudioImages);
  }
  if (req.files?.videos?.length) {
    const newVideos = await Promise.all(
      req.files.videos.map((f) =>
        uploadBufferToCloudinary(f.buffer, { folder: "teenraah/products/videos", resourceType: "video" })
      )
    );
    product.videos.push(...newVideos.map((v) => ({ url: v.secure_url, publicId: v.public_id })));
  }

  await product.save();
  await cacheDeleteByPrefix(LIST_CACHE_PREFIX);
  await cacheDeleteByPrefix(`${DETAIL_CACHE_PREFIX}${product.slug}`);
  return ok(res, { product }, "Product updated");
});

// @route  DELETE /api/admin/products/:id/media
// body: { publicId, type: 'image' | 'video' }
export const removeProductMedia = asyncHandler(async (req, res) => {
  const { publicId, type } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return fail(res, "Product not found", 404);

  await deleteFromCloudinary(publicId, type === "video" ? "video" : "image");
  if (type === "video") {
    product.videos = product.videos.filter((v) => v.publicId !== publicId);
  } else {
    product.images = product.images.filter((img) => img.publicId !== publicId);
  }
  await product.save();
  await cacheDeleteByPrefix(LIST_CACHE_PREFIX);
  return ok(res, { product }, "Media removed");
});

// @route  DELETE /api/admin/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return fail(res, "Product not found", 404);

  await Promise.all([
    ...product.images.map((img) => deleteFromCloudinary(img.publicId, "image")),
    ...product.videos.map((v) => deleteFromCloudinary(v.publicId, "video")),
  ]);

  await product.deleteOne();
  await cacheDeleteByPrefix(LIST_CACHE_PREFIX);
  await cacheDeleteByPrefix(`${DETAIL_CACHE_PREFIX}${product.slug}`);
  return ok(res, {}, "Product deleted");
});

// @route  GET /api/admin/products  (admin sees inactive too, no cache — always fresh)
export const getAdminProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ createdAt: -1 });
  return ok(res, { products });
});

// ---------------- AI Photo Studio ----------------
// Turns a raw admin-uploaded bag photo into a clean, Amazon-style product
// shot: background removed, recomposited onto a plain studio background,
// padded to a square. Runs entirely as a Cloudinary transformation (the
// account's Background Removal add-on must be enabled — see backend/.env.example).

// @route  POST /api/admin/products/ai-studio
// EITHER a fresh file upload (field "image") to process a brand-new photo,
// OR { sourcePublicId } in the body to retroactively re-process a photo
// that's already attached to a product.
export const generateAiStudioPreview = asyncHandler(async (req, res) => {
  let publicId;
  let originalUrl;
  let isNewUpload;

  if (req.file) {
    const uploaded = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "teenraah/products/ai-studio-staging",
      resourceType: "image",
    });
    publicId = uploaded.public_id;
    originalUrl = uploaded.secure_url;
    isNewUpload = true;
  } else if (req.body.sourcePublicId) {
    publicId = req.body.sourcePublicId;
    originalUrl = cloudinary.url(publicId, { secure: true });
    isNewUpload = false;
  } else {
    return fail(res, "Upload a photo or provide sourcePublicId", 400);
  }

  const aiUrl = buildAiStudioUrl(publicId);
  return ok(res, { publicId, originalUrl, aiUrl, isNewUpload }, "AI Studio preview ready");
});

// @route  DELETE /api/admin/products/ai-studio
// body: { publicId } — cleans up a staging upload the admin decided not to
// keep. Refuses to touch anything currently attached to a real product, so
// this can never accidentally delete a live product photo.
export const discardAiStudioAsset = asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) return fail(res, "publicId is required", 400);

  const inUse = await Product.exists({
    $or: [{ "images.publicId": publicId }, { "videos.publicId": publicId }],
  });
  if (inUse) return fail(res, "This image is attached to a product and can't be discarded here", 400);

  await deleteFromCloudinary(publicId, "image");
  return ok(res, {}, "Staging image discarded");
});

// @route  PUT /api/admin/products/:id/media/promote-ai
// body: { publicId, aiUrl } — an EXISTING product photo was re-processed
// through AI Studio and the admin chose to keep it. Same underlying
// Cloudinary asset (nothing re-uploaded, nothing deleted) — this just swaps
// which derived URL the product points to.
export const promoteImageToAiVersion = asyncHandler(async (req, res) => {
  const { publicId, aiUrl } = req.body;
  if (!publicId || !aiUrl) return fail(res, "publicId and aiUrl are required", 400);

  const product = await Product.findById(req.params.id);
  if (!product) return fail(res, "Product not found", 404);

  const image = product.images.find((img) => img.publicId === publicId);
  if (!image) return fail(res, "That image isn't part of this product", 404);

  image.url = aiUrl;
  await product.save();
  await cacheDeleteByPrefix(LIST_CACHE_PREFIX);
  await cacheDeleteByPrefix(`${DETAIL_CACHE_PREFIX}${product.slug}`);
  return ok(res, { product }, "Switched to AI Studio version");
});
