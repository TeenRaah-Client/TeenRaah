import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { ok, fail } from "../utils/apiResponse.js";
import { getAnalyticsRange } from "../utils/analyticsRange.js";

// Read-only business reporting. This endpoint does not mutate orders, payments,
// inventory, customers, or wallet balances.
export const getBusinessAnalytics = asyncHandler(async (req, res) => {
  let range;
  try {
    range = getAnalyticsRange(typeof req.query.period === "string" ? req.query.period : "30d");
  } catch (error) {
    return fail(res, error.message, error.statusCode || 400);
  }

  const { start, end, period } = range;
  const paidMatch = {
    createdAt: { $gte: start, $lte: end },
    "payment.status": { $in: ["paid", "refunded"] },
  };
  const dateMatch = { createdAt: { $gte: start, $lte: end } };

  const runAggregate = (pipeline) => Order.aggregate(pipeline).option({ maxTimeMS: 15000 });

  const [summaryRows, dailyRows, topProducts, orderStatuses, newCustomers, lowStockProducts] = await Promise.all([
    runAggregate([
      { $match: paidMatch },
      {
        $group: {
          _id: null,
          paidOrders: { $sum: 1 },
          grossCollected: { $sum: "$totalAmount" },
          refundsProcessed: {
            $sum: {
              $cond: [
                { $eq: ["$returnRequest.refundStatus", "processed"] },
                { $ifNull: ["$returnRequest.refundAmount", 0] },
                0,
              ],
            },
          },
        },
      },
    ]),
    runAggregate([
      { $match: paidMatch },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" },
          },
          orders: { $sum: 1 },
          grossCollected: { $sum: "$totalAmount" },
          refundsProcessed: {
            $sum: {
              $cond: [
                { $eq: ["$returnRequest.refundStatus", "processed"] },
                { $ifNull: ["$returnRequest.refundAmount", 0] },
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    runAggregate([
      { $match: paidMatch },
      { $unwind: "$items" },
      {
        $group: {
          _id: { product: "$items.product", name: "$items.name" },
          unitsSold: { $sum: "$items.quantity" },
          orderValue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { unitsSold: -1, orderValue: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, productId: "$_id.product", name: "$_id.name", unitsSold: 1, orderValue: 1 } },
    ]),
    runAggregate([
      { $match: dateMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    User.countDocuments({ role: "customer", createdAt: { $gte: start, $lte: end } }),
    Product.find({ isActive: true, stock: { $lte: 5 } })
      .select("name sku stock category")
      .sort({ stock: 1, name: 1 })
      .limit(20)
      .maxTimeMS(5000)
      .lean(),
  ]);

  const summary = summaryRows[0] || { paidOrders: 0, grossCollected: 0, refundsProcessed: 0 };
  const grossCollected = Number(summary.grossCollected || 0);
  const refundsProcessed = Number(summary.refundsProcessed || 0);

  return ok(res, {
    period,
    range: { start, end },
    generatedAt: new Date(),
    summary: {
      paidOrders: summary.paidOrders || 0,
      grossCollected,
      refundsProcessed,
      netCollected: grossCollected - refundsProcessed,
      averageOrderValue: summary.paidOrders ? grossCollected / summary.paidOrders : 0,
      newCustomers,
    },
    daily: dailyRows.map((row) => ({
      date: row._id,
      orders: row.orders,
      grossCollected: row.grossCollected || 0,
      refundsProcessed: row.refundsProcessed || 0,
      netCollected: (row.grossCollected || 0) - (row.refundsProcessed || 0),
    })),
    // Product order value is item price × quantity and is shown before refunds.
    topProducts,
    orderStatuses: orderStatuses.map((row) => ({ status: row._id || "Unknown", count: row.count })),
    lowStockProducts,
    definitions: {
      grossCollected: "Sum of totalAmount for paid or refunded orders created in the selected period.",
      refundsProcessed: "Only refunds marked processed by the payment reconciliation flow are deducted.",
      netCollected: "Gross collected less processed refunds; excludes gateway fees, taxes not separately recorded, and operating costs.",
      topProducts: "Item price multiplied by quantity on paid/refunded orders; shown before refunds.",
    },
  });
});
