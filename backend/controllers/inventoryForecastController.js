import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { ok } from "../utils/apiResponse.js";
import { calculateInventoryForecast } from "../utils/inventoryForecast.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// Read-only forecast: it never reserves stock, edits products, or creates POs.
export const getInventoryForecast = asyncHandler(async (_req, res) => {
  const now = new Date();
  const recentStart = new Date(now.getTime() - 30 * DAY_MS);
  const previousStart = new Date(now.getTime() - 60 * DAY_MS);

  const [products, salesRows] = await Promise.all([
    Product.find({ isActive: true })
      .select("name sku category stock price")
      .sort({ name: 1 })
      .limit(500)
      .maxTimeMS(5000)
      .lean(),
    Order.aggregate([
      {
        $match: {
          "payment.status": { $in: ["paid", "refunded"] },
          createdAt: { $gte: previousStart, $lt: now },
          status: { $ne: "Cancelled" },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          recentUnits: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", recentStart] }, "$items.quantity", 0],
            },
          },
          previousUnits: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ["$createdAt", previousStart] }, { $lt: ["$createdAt", recentStart] }] },
                "$items.quantity",
                0,
              ],
            },
          },
        },
      },
    ]).option({ maxTimeMS: 15000 }),
  ]);

  const salesByProduct = new Map(
    salesRows.map((row) => [String(row._id), row])
  );

  const forecasts = products.map((product) => {
    const sales = salesByProduct.get(String(product._id)) || {};
    return {
      productId: String(product._id),
      name: product.name,
      sku: product.sku || "",
      category: product.category,
      price: product.price,
      ...calculateInventoryForecast({
        stock: product.stock,
        recentUnits: sales.recentUnits || 0,
        previousUnits: sales.previousUnits || 0,
      }),
    };
  });

  forecasts.sort((a, b) => {
    const priority = { urgent: 0, reorder: 1, monitor: 2, no_sales_no_stock: 3 };
    return (priority[a.recommendation] ?? 4) - (priority[b.recommendation] ?? 4)
      || (a.estimatedDaysOfStock ?? Number.MAX_SAFE_INTEGER) - (b.estimatedDaysOfStock ?? Number.MAX_SAFE_INTEGER);
  });

  return ok(res, {
    generatedAt: now,
    horizonDays: 30,
    assumptions: {
      demandWindowDays: 30,
      comparisonWindowDays: 30,
      reorderTargetDays: 30,
      reorderAlertAtDaysOfCover: 14,
      minimumUnitsForSuggestedQuantity: 14,
      method: "Average daily units sold in the most recent 30 calendar days, compared with the previous rolling 30-day window.",
      limitations: [
        "This is a transparent baseline estimate, not machine learning or a guaranteed demand prediction.",
        "Promotions, seasonality, supplier lead times, stockouts, and returns by individual item are not modeled.",
        "Suggested quantities are planning guidance only; no stock or purchase order is changed.",
        "Only the first 500 active products are included.",
      ],
    },
    products: forecasts,
    totals: {
      productsAnalyzed: forecasts.length,
      urgent: forecasts.filter((item) => item.recommendation === "urgent").length,
      reorder: forecasts.filter((item) => item.recommendation === "reorder").length,
      insufficientHistory: forecasts.filter((item) => !item.historySufficient).length,
    },
  });
});
