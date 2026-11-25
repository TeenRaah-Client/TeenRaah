export const COMPARE_STORAGE_KEY = "teenraah_compare_v1";
export const COMPARE_LIMIT = 4;
export const COMPARE_EVENT = "teenraah:compare-change";

export function normalizeCompareProduct(product) {
  if (!product || !product._id || !product.slug || !product.name) return null;
  return {
    _id: String(product._id),
    slug: String(product.slug),
    name: String(product.name),
    category: product.category || "",
    price: Number(product.price) || 0,
    mrp: Number(product.mrp) || 0,
    material: product.material || "",
    capacityLitres: Number(product.capacityLitres) || 0,
    colors: Array.isArray(product.colors) ? product.colors.filter(Boolean) : [],
    stock: Math.max(0, Number(product.stock) || 0),
    ratingsAverage: Number(product.ratingsAverage) || 0,
    ratingsCount: Math.max(0, Number(product.ratingsCount) || 0),
    image: product.images?.[0]?.url || "",
  };
}

export function addCompareProduct(list, product) {
  const normalized = normalizeCompareProduct(product);
  if (!normalized) return { list: [...(list || [])], error: "invalid" };
  const current = Array.isArray(list) ? list : [];
  if (current.some((item) => String(item._id) === normalized._id)) {
    return { list: current, error: "duplicate" };
  }
  if (current.length >= COMPARE_LIMIT) {
    return { list: current, error: "limit" };
  }
  return { list: [...current, normalized], error: null };
}

export function removeCompareProduct(list, productId) {
  return (Array.isArray(list) ? list : []).filter((item) => String(item._id) !== String(productId));
}

export function readCompareList(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(COMPARE_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.slice(0, COMPARE_LIMIT) : [];
  } catch {
    return [];
  }
}

export function writeCompareList(storage, list) {
  const safeList = (Array.isArray(list) ? list : []).slice(0, COMPARE_LIMIT);
  storage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(safeList));
  return safeList;
}
