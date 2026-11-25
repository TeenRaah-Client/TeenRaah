import test from "node:test";
import assert from "node:assert/strict";
import { buildCategoryPreferences, rankRecommendedProducts } from "../utils/productRecommendations.js";

test("weights purchased categories above wishlisted categories", () => {
  const result = buildCategoryPreferences({
    wishlistCategories: ["Backpacks", "Handbags"],
    purchasedCategories: ["Handbags", "Handbags"],
  });
  assert.deepEqual(result, [
    { category: "Handbags", score: 8 },
    { category: "Backpacks", score: 2 },
  ]);
});

test("ignores missing category values", () => {
  assert.deepEqual(buildCategoryPreferences({
    wishlistCategories: [null, "Backpacks"],
    purchasedCategories: [undefined],
  }), [{ category: "Backpacks", score: 2 }]);
});

test("ranks matching category before a higher rated non-matching category", () => {
  const products = [
    { name: "Popular Tote", category: "Tote Bags", ratingsAverage: 5, ratingsCount: 100 },
    { name: "Preferred Backpack", category: "Backpacks", ratingsAverage: 4, ratingsCount: 10 },
  ];
  const ranked = rankRecommendedProducts(products, [{ category: "Backpacks", score: 5 }]);
  assert.equal(ranked[0].name, "Preferred Backpack");
});

test("returns deterministic ranking for equal scores", () => {
  const products = [
    { name: "Zulu", category: "Tote Bags", ratingsAverage: 4, ratingsCount: 3 },
    { name: "Alpha", category: "Tote Bags", ratingsAverage: 4, ratingsCount: 3 },
  ];
  assert.deepEqual(rankRecommendedProducts(products).map((p) => p.name), ["Alpha", "Zulu"]);
});

test("does not mutate the input product array", () => {
  const products = [{ name: "B", category: "X" }, { name: "A", category: "X" }];
  const original = [...products];
  rankRecommendedProducts(products);
  assert.deepEqual(products, original);
});
