import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import { ok } from "../utils/apiResponse.js";
import { buildCustomerIntelligence } from "../utils/customerIntelligence.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// Read-only, bounded-window aggregation. It does not access or mutate customer
// profile fields and returns aggregate segments only (no names, emails, or IDs).
export const getCustomerIntelligence = asyncHandler(async (_req, res) => {
  const end = new Date();
  const start = new Date(end.getTime() - 365 * DAY_MS);

  const customerRows = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        "payment.status": "paid",
      },
    },
    {
      $group: {
        _id: "$user",
        orderCount: { $sum: 1 },
        grossRevenue: { $sum: { $ifNull: ["$totalAmount", 0] } },
        processedRefunds: {
          $sum: {
            $cond: [
              { $eq: ["$returnRequest.refundStatus", "processed"] },
              { $ifNull: ["$returnRequest.refundAmount", 0] },
              0,
            ],
          },
        },
        lastOrderAt: { $max: { $ifNull: ["$payment.paidAt", "$createdAt"] } },
      },
    },
    { $project: { _id: 0, orderCount: 1, grossRevenue: 1, processedRefunds: 1, lastOrderAt: 1 } },
  ]).option({ maxTimeMS: 15000, allowDiskUse: false });

  return ok(res, buildCustomerIntelligence(customerRows, end));
});
