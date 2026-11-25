export function buildCategoryPreferences({ wishlistCategories = [], purchasedCategories = [] } = {}) {
  const scores = new Map();
  for (const category of wishlistCategories) {
    if (category) scores.set(category, (scores.get(category) || 0) + 2);
  }
  for (const category of purchasedCategories) {
    if (category) scores.set(category, (scores.get(category) || 0) + 3);
  }
  return [...scores.entries()]
    .map(([category, score]) => ({ category, score }))
    .sort((a, b) => b.score - a.score || a.category.localeCompare(b.category));
}

export function rankRecommendedProducts(products, preferences = []) {
  const preferenceMap = new Map(preferences.map(({ category, score }) => [category, score]));
  return [...(products || [])].sort((a, b) => {
    const score = (product) =>
      (preferenceMap.get(product.category) || 0) * 10 +
      Math.max(0, Math.min(5, Number(product.ratingsAverage) || 0)) * 2 +
      Math.log1p(Math.max(0, Number(product.ratingsCount) || 0));
    return score(b) - score(a) || String(a.name || "").localeCompare(String(b.name || ""));
  });
}
