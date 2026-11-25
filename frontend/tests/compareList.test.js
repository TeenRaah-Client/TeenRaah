import test from "node:test";
import assert from "node:assert/strict";
import {
  addCompareProduct,
  removeCompareProduct,
  normalizeCompareProduct,
  readCompareList,
  writeCompareList,
  COMPARE_STORAGE_KEY,
} from "../src/utils/compareList.js";

const product = (id, overrides = {}) => ({
  _id: id, slug: `bag-${id}`, name: `Bag ${id}`, category: "Backpacks",
  price: 1200, mrp: 1500, material: "Polyester", capacityLitres: 20,
  colors: ["Black"], stock: 4, ratingsAverage: 4.5, ratingsCount: 10,
  images: [{ url: "https://example.com/bag.jpg" }], ...overrides,
});

test("normalizes only comparison fields", () => {
  const result = normalizeCompareProduct(product("1", { internalSecret: "no" }));
  assert.equal(result._id, "1");
  assert.equal(result.capacityLitres, 20);
  assert.equal("internalSecret" in result, false);
});

test("adds a product and rejects duplicates", () => {
  const first = addCompareProduct([], product("1"));
  assert.equal(first.error, null);
  const duplicate = addCompareProduct(first.list, product("1"));
  assert.equal(duplicate.error, "duplicate");
  assert.equal(duplicate.list.length, 1);
});

test("limits the comparison list to four products", () => {
  const list = ["1", "2", "3", "4"].map((id) => normalizeCompareProduct(product(id)));
  const result = addCompareProduct(list, product("5"));
  assert.equal(result.error, "limit");
  assert.equal(result.list.length, 4);
});

test("rejects malformed products", () => {
  assert.equal(addCompareProduct([], { name: "Missing ID" }).error, "invalid");
});

test("removes only the selected product", () => {
  const list = ["1", "2", "3"].map((id) => normalizeCompareProduct(product(id)));
  assert.deepEqual(removeCompareProduct(list, "2").map((item) => item._id), ["1", "3"]);
});

test("reads malformed storage safely", () => {
  const storage = { getItem: () => "{broken" };
  assert.deepEqual(readCompareList(storage), []);
});

test("writes no more than four items using the stable storage key", () => {
  let savedKey = "";
  let savedValue = "";
  const storage = { setItem: (key, value) => { savedKey = key; savedValue = value; } };
  const list = ["1", "2", "3", "4", "5"].map((id) => normalizeCompareProduct(product(id)));
  const result = writeCompareList(storage, list);
  assert.equal(savedKey, COMPARE_STORAGE_KEY);
  assert.equal(result.length, 4);
  assert.equal(JSON.parse(savedValue).length, 4);
});
