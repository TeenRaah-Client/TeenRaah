import test from "node:test";
import assert from "node:assert/strict";
import { classifyCustomer, buildCustomerIntelligence } from "../utils/customerIntelligence.js";

test("classifies recent high-frequency customers as Champions", () => {
  assert.equal(classifyCustomer({ orderCount: 4, daysSinceLastOrder: 12 }), "Champions");
});

test("classifies repeat customers by recency", () => {
  assert.equal(classifyCustomer({ orderCount: 2, daysSinceLastOrder: 45 }), "Loyal");
  assert.equal(classifyCustomer({ orderCount: 3, daysSinceLastOrder: 90 }), "At Risk");
  assert.equal(classifyCustomer({ orderCount: 3, daysSinceLastOrder: 160 }), "Dormant");
});

test("classifies a recent first-time customer as New", () => {
  assert.equal(classifyCustomer({ orderCount: 1, daysSinceLastOrder: 3 }), "New");
});

test("does not assign an unknown or zero-order row to an active segment", () => {
  assert.equal(classifyCustomer({ orderCount: 0, daysSinceLastOrder: 1 }), "Dormant");
  assert.equal(classifyCustomer({ orderCount: 2, daysSinceLastOrder: null }), "Dormant");
});

test("builds aggregate metrics and clamps net revenue at zero", () => {
  const now = new Date("2026-11-25T12:00:00.000Z");
  const report = buildCustomerIntelligence([
    { orderCount: 3, grossRevenue: 6000, processedRefunds: 1000, lastOrderAt: "2026-11-20T12:00:00.000Z" },
    { orderCount: 1, grossRevenue: 1200, processedRefunds: 1500, lastOrderAt: "2026-11-24T12:00:00.000Z" },
  ], now);

  assert.equal(report.summary.purchasingCustomers, 2);
  assert.equal(report.summary.repeatCustomers, 1);
  assert.equal(report.summary.repeatPurchaseRate, 50);
  assert.equal(report.summary.netRevenue, 5000);
  assert.equal(report.summary.revenuePerCustomer, 2500);
  assert.equal(report.segments.find((item) => item.name === "Champions").customers, 1);
  assert.equal(report.segments.find((item) => item.name === "New").customers, 1);
});

test("returns stable zero metrics for an empty dataset", () => {
  const report = buildCustomerIntelligence([], new Date("2026-11-25T12:00:00.000Z"));
  assert.equal(report.summary.purchasingCustomers, 0);
  assert.equal(report.summary.repeatPurchaseRate, 0);
  assert.equal(report.segments.reduce((sum, item) => sum + item.customers, 0), 0);
});
