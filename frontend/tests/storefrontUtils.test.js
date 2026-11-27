import test from "node:test";
import assert from "node:assert/strict";
import {
  getColorSwatch,
  getFreeShippingProgress,
  optimizeImageUrl,
  inferBagSpecs,
  buildRatingBreakdown,
  dedupeProducts,
  getDifferenceRows,
  readRecentlyViewed,
  recordRecentlyViewed,
  readRecentSearches,
  recordRecentSearch,
} from "../src/utils/storefront.js";

const createMemoryStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
  };
};

test("getFreeShippingProgress calculates remaining amount, percent, and unlock state", () => {
  assert.deepEqual(getFreeShippingProgress(0), {
    threshold: 999,
    remaining: 999,
    percent: 0,
    unlocked: false,
  });

  const partial = getFreeShippingProgress(500);
  assert.equal(partial.remaining, 499);
  assert.equal(partial.percent, 50);
  assert.equal(partial.unlocked, false);

  const unlocked = getFreeShippingProgress(1499);
  assert.equal(unlocked.remaining, 0);
  assert.equal(unlocked.percent, 100);
  assert.equal(unlocked.unlocked, true);
});

test("optimizeImageUrl adds responsive Cloudinary params without duplicating or touching external URLs", () => {
  const raw = "https://res.cloudinary.com/demo/image/upload/v1234/teenraah/bag.jpg";
  assert.equal(
    optimizeImageUrl(raw, 600),
    "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_600/v1234/teenraah/bag.jpg"
  );

  const already = "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/bag.jpg";
  assert.equal(optimizeImageUrl(already, 600), already);

  const external = "https://images.unsplash.com/photo-123";
  assert.equal(optimizeImageUrl(external, 600), external);
});

test("inferBagSpecs derives laptop fit, weather protection, and cabin compliance from product fields", () => {
  const specs = inferBagSpecs({
    name: "Trailmark Daypack",
    category: "Backpacks",
    material: "Water-resistant Ripstop Nylon",
    capacityLitres: 22,
    description: 'Padded 15" laptop sleeve and daily commute compartments',
    tags: ["commute"],
  });

  assert.equal(specs.capacityLabel, "22L capacity");
  assert.equal(specs.laptopFit, 'Up to 15" laptop');
  assert.equal(specs.waterResistant, true);
  assert.equal(specs.cabinFriendly, true);
  assert.equal(specs.bestFor, "Work & daily commute");
});

test("getColorSwatch resolves exact names, partial names, and fallback color", () => {
  assert.equal(getColorSwatch("Charcoal"), "#33363B");
  assert.equal(getColorSwatch("Dark Forest Green"), "#23422E");
  assert.equal(getColorSwatch("UnknownHue"), "#8A8578");
});

test("buildRatingBreakdown computes exact counts, average, and percentages", () => {
  const result = buildRatingBreakdown([
    { rating: 5 },
    { rating: 5 },
    { rating: 4 },
    { rating: 2 },
  ]);
  assert.equal(result.total, 4);
  assert.equal(result.average, 4);
  assert.equal(result.rows[0].stars, 5);
  assert.equal(result.rows[0].count, 2);
  assert.equal(result.rows[0].percent, 50);
  assert.equal(result.rows[3].stars, 2);
  assert.equal(result.rows[3].count, 1);
});

test("dedupeProducts excludes previously shown IDs and removes duplicates", () => {
  const items = [{ _id: "1" }, { _id: "2" }, { _id: "2" }, { _id: "3" }];
  const result = dedupeProducts(items, ["1"]);
  assert.deepEqual(
    result.map((p) => p._id),
    ["2", "3"]
  );
});

test("getDifferenceRows keeps only rows where products differ", () => {
  const rows = [
    ["Category", (p) => p.category],
    ["Price", (p) => p.price],
  ];
  const products = [
    { category: "Backpacks", price: 1499 },
    { category: "Backpacks", price: 2499 },
  ];
  const diff = getDifferenceRows(rows, products);
  assert.equal(diff.length, 1);
  assert.equal(diff[0][0], "Price");
});

test("recordRecentlyViewed and recordRecentSearch deduplicate and persist cleanly", () => {
  const storage = createMemoryStorage();
  recordRecentlyViewed(storage, { _id: "a", slug: "bag-a", name: "Bag A", price: 999 });
  recordRecentlyViewed(storage, { _id: "b", slug: "bag-b", name: "Bag B", price: 1499 });
  recordRecentlyViewed(storage, { _id: "a", slug: "bag-a", name: "Bag A", price: 999 });

  const viewed = readRecentlyViewed(storage);
  assert.deepEqual(
    viewed.map((p) => p._id),
    ["a", "b"]
  );

  recordRecentSearch(storage, "Backpack");
  recordRecentSearch(storage, "Wallet");
  recordRecentSearch(storage, "backpack");
  assert.deepEqual(readRecentSearches(storage), ["backpack", "Wallet"]);
});
