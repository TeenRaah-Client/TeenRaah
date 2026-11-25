import test from "node:test";
import assert from "node:assert/strict";
import { calculateInventoryForecast } from "../utils/inventoryForecast.js";

test("calculates average daily demand and stock coverage", () => {
  const result = calculateInventoryForecast({ stock: 20, recentUnits: 30, previousUnits: 15 });
  assert.equal(result.averageUnitsPerDay, 1);
  assert.equal(result.estimatedDaysOfStock, 20);
  assert.equal(result.trendPercent, 100);
});

test("suggests reorder quantity only when history is sufficient", () => {
  const result = calculateInventoryForecast({ stock: 8, recentUnits: 60, previousUnits: 30 });
  assert.equal(result.recommendation, "reorder");
  assert.equal(result.suggestedReorderQty, 52);
  assert.equal(result.historySufficient, true);
});

test("does not produce a suggested quantity with insufficient sales history", () => {
  const result = calculateInventoryForecast({ stock: 0, recentUnits: 4, previousUnits: 0 });
  assert.equal(result.suggestedReorderQty, 0);
  assert.equal(result.historySufficient, false);
  assert.equal(result.recommendation, "urgent");
});

test("handles no sales without division by zero", () => {
  const result = calculateInventoryForecast({ stock: 0, recentUnits: 0, previousUnits: 0 });
  assert.equal(result.averageUnitsPerDay, 0);
  assert.equal(result.estimatedDaysOfStock, null);
  assert.equal(result.trendPercent, null);
  assert.equal(result.recommendation, "no_sales_no_stock");
});

test("clamps invalid and negative numeric inputs safely", () => {
  const result = calculateInventoryForecast({ stock: -10, recentUnits: "bad", previousUnits: -5 });
  assert.equal(result.stock, 0);
  assert.equal(result.averageUnitsPerDay, 0);
  assert.equal(result.suggestedReorderQty, 0);
});
