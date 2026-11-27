export const FREE_DELIVERY_THRESHOLD = 999;
export const DELIVERY_FEE = 79;
export const RECENTLY_VIEWED_KEY = "teenraah_recently_viewed_v1";
export const RECENT_SEARCHES_KEY = "teenraah_recent_searches_v1";
export const SAVED_PINCODE_KEY = "teenraah_saved_pincode_v1";
export const RECENTLY_VIEWED_LIMIT = 8;

const COLOR_SWATCH_MAP = {
  black: "#151517",
  charcoal: "#33363B",
  slate: "#4E6070",
  "slate blue": "#4E6070",
  navy: "#1F2E4D",
  blue: "#2B5B84",
  olive: "#4B5943",
  forest: "#23422E",
  green: "#2F5233",
  pine: "#2F5233",
  rust: "#9E462F",
  terracotta: "#B55B41",
  brown: "#6C4A33",
  espresso: "#3E2723",
  tan: "#B68251",
  sand: "#D4C2A8",
  beige: "#D8CCB8",
  ivory: "#F2EDE3",
  white: "#F8F8F6",
  grey: "#8A8D91",
  gray: "#8A8D91",
  red: "#B23636",
  maroon: "#6E232A",
  pink: "#D68A9E",
  yellow: "#E3A857",
  mustard: "#C9922B",
  multicolour: "linear-gradient(135deg, #2F5233 0%, #E3A857 50%, #B55B41 100%)",
  multicolor: "linear-gradient(135deg, #2F5233 0%, #E3A857 50%, #B55B41 100%)",
};

export function getColorSwatch(colorName) {
  if (typeof colorName !== "string" || !colorName.trim()) return "#8A8578";
  const key = colorName.trim().toLowerCase();
  if (COLOR_SWATCH_MAP[key]) return COLOR_SWATCH_MAP[key];
  const matchedKey = Object.keys(COLOR_SWATCH_MAP).find((k) => key.includes(k));
  return matchedKey ? COLOR_SWATCH_MAP[matchedKey] : "#8A8578";
}

export function getFreeShippingProgress(subtotal, threshold = FREE_DELIVERY_THRESHOLD) {
  const amount = Math.max(0, Number(subtotal) || 0);
  const safeThreshold = Math.max(1, Number(threshold) || FREE_DELIVERY_THRESHOLD);
  const remaining = Math.max(0, Math.round(safeThreshold - amount));
  const percent = Math.min(100, Math.round((amount / safeThreshold) * 100));
  return {
    threshold: safeThreshold,
    remaining,
    percent,
    unlocked: remaining === 0 && amount > 0,
  };
}

/**
 * Optimizes Cloudinary image URLs with responsive width + auto format/quality.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function optimizeImageUrl(url, width = 800) {
  if (typeof url !== "string" || !url.trim()) return "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url;
  }
  const safeWidth = Math.max(120, Math.min(2000, Math.round(Number(width) || 800)));
  // Avoid double-injecting if f_auto already exists
  if (url.includes("f_auto")) return url;
  return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${safeWidth}/`);
}

/**
 * Derives practical bag & travel-gear fit guidance from existing Product fields
 * so customers get immediate sizing clarity without requiring schema migrations.
 */
export function inferBagSpecs(product = {}) {
  const text = `${product.name || ""} ${product.description || ""} ${product.material || ""} ${(product.tags || []).join(" ")}`.toLowerCase();
  const capacity = Number(product.capacityLitres) || 0;
  const category = String(product.category || "");

  let laptopFit = null;
  const explicitInch = text.match(/(\d{2}(?:\.\d)?)\s*(?:"|inch|in\b)/i);
  if (explicitInch && Number(explicitInch[1]) >= 12 && Number(explicitInch[1]) <= 17.5) {
    laptopFit = `Up to ${explicitInch[1]}" laptop`;
  } else if (text.includes("laptop") || category === "Office Bags") {
    laptopFit = 'Fits up to 15.6" laptop';
  } else if (category === "Backpacks" && capacity >= 20) {
    laptopFit = capacity >= 28 ? 'Fits up to 16" laptop' : 'Fits up to 15.6" laptop';
  } else if (category === "Tote Bags") {
    laptopFit = 'Fits up to 14" laptop';
  }

  const waterResistant = /water[- ]?resistant|waterproof|ripstop|polycarbonate|nylon/.test(text);
  const cabinFriendly =
    /cabin|flight[- ]?friendly|carry[- ]?on|trolley/.test(text) ||
    (["Backpacks", "Duffle Bags", "Travel & Luggage"].includes(category) && capacity > 0 && capacity <= 45);

  let bestFor = "Everyday carry";
  if (category === "Office Bags" || text.includes("office") || text.includes("commute")) {
    bestFor = "Work & daily commute";
  } else if (category === "Travel & Luggage" || category === "Duffle Bags" || capacity >= 32) {
    bestFor = "3–7 day trips & cabin travel";
  } else if (category === "Backpacks" && capacity >= 18) {
    bestFor = "College, commute & day trips";
  } else if (category === "Sling Bags" || category === "Wallets" || category === "Accessories") {
    bestFor = "Hands-free essentials";
  }

  return {
    capacityLabel: capacity > 0 ? `${capacity}L capacity` : null,
    laptopFit,
    waterResistant,
    cabinFriendly,
    material: product.material || null,
    bestFor,
  };
}

export function buildRatingBreakdown(reviews = []) {
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const total = safeReviews.length;
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  let sum = 0;
  for (const r of safeReviews) {
    const rating = Math.round(Number(r?.rating) || 0);
    if (rating >= 1 && rating <= 5) {
      counts[rating] += 1;
      sum += rating;
    }
  }

  const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
  const rows = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts[stars],
    percent: total > 0 ? Math.round((counts[stars] / total) * 100) : 0,
  }));

  return { total, average, rows };
}

export function dedupeProducts(products = [], excludeIds = []) {
  const excluded = new Set((Array.isArray(excludeIds) ? excludeIds : []).map((id) => String(id)));
  const seen = new Set();
  const result = [];

  for (const product of Array.isArray(products) ? products : []) {
    const id = product?._id ? String(product._id) : null;
    if (!id || excluded.has(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(product);
  }
  return result;
}

export function getDifferenceRows(rows = [], products = []) {
  if (!Array.isArray(products) || products.length <= 1) return rows;
  return rows.filter(([, formatter]) => {
    const values = new Set(products.map((p) => String(formatter(p))));
    return values.size > 1;
  });
}

export function readRecentlyViewed(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(RECENTLY_VIEWED_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.slice(0, RECENTLY_VIEWED_LIMIT) : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(storage, product) {
  if (!product || !product._id || !product.slug || !product.name) {
    return readRecentlyViewed(storage);
  }
  const entry = {
    _id: String(product._id),
    slug: String(product.slug),
    name: String(product.name),
    category: product.category || "",
    price: Number(product.price) || 0,
    mrp: Number(product.mrp) || 0,
    ratingsAverage: Number(product.ratingsAverage) || 4.5,
    stock: Math.max(0, Number(product.stock) || 0),
    colors: Array.isArray(product.colors) ? product.colors.slice(0, 5) : [],
    images: Array.isArray(product.images) ? product.images.slice(0, 2) : [],
  };
  const current = readRecentlyViewed(storage).filter((item) => String(item._id) !== entry._id);
  const next = [entry, ...current].slice(0, RECENTLY_VIEWED_LIMIT);
  try {
    storage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
  return next;
}

export function readRecentSearches(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(RECENT_SEARCHES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function recordRecentSearch(storage, term) {
  const clean = typeof term === "string" ? term.trim() : "";
  if (clean.length < 2) return readRecentSearches(storage);
  const current = readRecentSearches(storage).filter((s) => s.toLowerCase() !== clean.toLowerCase());
  const next = [clean, ...current].slice(0, 6);
  try {
    storage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  return next;
}
