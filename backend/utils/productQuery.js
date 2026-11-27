const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const PRODUCT_SORT_MAP = {
  priceLowHigh: { price: 1, createdAt: -1 },
  priceHighLow: { price: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  rating: { ratingsAverage: -1, ratingsCount: -1, createdAt: -1 },
  popular: { ratingsCount: -1, ratingsAverage: -1, createdAt: -1 },
};

/**
 * Builds a safe, validated MongoDB filter query for GET /api/products.
 * Supports category, featured, price range, capacity range, color, inStock,
 * tag, and partial-word case-insensitive search.
 */
export const buildProductFilterQuery = (params = {}) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    minCapacity,
    maxCapacity,
    color,
    inStock,
    featured,
    tag,
  } = params;

  const query = { isActive: true };

  if (typeof category === "string" && category.trim()) {
    query.category = category.trim();
  }

  if (featured === "true" || featured === true) {
    query.isFeatured = true;
  }

  if (inStock === "true" || inStock === true) {
    query.stock = { $gt: 0 };
  }

  const parsedMinPrice = minPrice !== undefined && minPrice !== "" ? Number(minPrice) : null;
  const parsedMaxPrice = maxPrice !== undefined && maxPrice !== "" ? Number(maxPrice) : null;
  if (
    (parsedMinPrice !== null && Number.isFinite(parsedMinPrice) && parsedMinPrice >= 0) ||
    (parsedMaxPrice !== null && Number.isFinite(parsedMaxPrice) && parsedMaxPrice >= 0)
  ) {
    query.price = {};
    if (parsedMinPrice !== null && Number.isFinite(parsedMinPrice) && parsedMinPrice >= 0) {
      query.price.$gte = parsedMinPrice;
    }
    if (parsedMaxPrice !== null && Number.isFinite(parsedMaxPrice) && parsedMaxPrice >= 0) {
      query.price.$lte = parsedMaxPrice;
    }
  }

  const parsedMinCap = minCapacity !== undefined && minCapacity !== "" ? Number(minCapacity) : null;
  const parsedMaxCap = maxCapacity !== undefined && maxCapacity !== "" ? Number(maxCapacity) : null;
  if (
    (parsedMinCap !== null && Number.isFinite(parsedMinCap) && parsedMinCap >= 0) ||
    (parsedMaxCap !== null && Number.isFinite(parsedMaxCap) && parsedMaxCap >= 0)
  ) {
    query.capacityLitres = {};
    if (parsedMinCap !== null && Number.isFinite(parsedMinCap) && parsedMinCap >= 0) {
      query.capacityLitres.$gte = parsedMinCap;
    }
    if (parsedMaxCap !== null && Number.isFinite(parsedMaxCap) && parsedMaxCap >= 0) {
      query.capacityLitres.$lte = parsedMaxCap;
    }
  }

  if (typeof color === "string" && color.trim()) {
    query.colors = { $regex: new RegExp(`^${escapeRegex(color.trim())}$`, "i") };
  }

  if (typeof tag === "string" && tag.trim()) {
    query.tags = tag.trim().toLowerCase();
  }

  if (typeof search === "string" && search.trim()) {
    const cleanSearch = search.trim().slice(0, 100);
    const pattern = new RegExp(escapeRegex(cleanSearch), "i");
    query.$or = [
      { name: pattern },
      { description: pattern },
      { category: pattern },
      { material: pattern },
      { tags: pattern },
    ];
  }

  return query;
};

export const buildProductSort = (sort) => {
  return PRODUCT_SORT_MAP[sort] || PRODUCT_SORT_MAP.newest;
};

export const normalizePagination = (page = 1, limit = 12, maxLimit = 50) => {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);
  const pageNum = Number.isFinite(parsedPage) && parsedPage >= 1 ? Math.floor(parsedPage) : 1;
  const limitNum =
    Number.isFinite(parsedLimit) && parsedLimit >= 1
      ? Math.min(maxLimit, Math.floor(parsedLimit))
      : 12;
  return { page: pageNum, limit: limitNum, skip: (pageNum - 1) * limitNum };
};
