import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { ok } from "../utils/apiResponse.js";

// @route GET /api/admin/dashboard
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalOrders, totalRevenueAgg, totalCustomers, totalProducts, recentOrders, statusBreakdown] =
    await Promise.all([
      Order.countDocuments({ "payment.status": "paid" }),
      Order.aggregate([{ $match: { "payment.status": "paid" } }, { $group: { _id: null, sum: { $sum: "$totalAmount" } } }]),
      User.countDocuments({ role: "customer" }),
      Product.countDocuments({}),
      Order.find({}).sort({ createdAt: -1 }).limit(8).populate("user", "name email"),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

  // Last 7 days revenue, for a simple sparkline on the dashboard
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dailyRevenue = await Order.aggregate([
    { $match: { "payment.status": "paid", createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return ok(res, {
    totalOrders,
    totalRevenue: totalRevenueAgg[0]?.sum || 0,
    totalCustomers,
    totalProducts,
    recentOrders,
    statusBreakdown,
    dailyRevenue,
  });
});

// @route GET /api/admin/customers
// Every saved address (with lat/lng) is included so the admin can see
// exactly where their customer base is concentrated — the "location of
// address set by customers must be visible to admin" requirement.
export const getCustomers = asyncHandler(async (req, res) => {
  const customers = await User.find({ role: "customer" })
    .select("name email phone addresses walletBalance referralCode createdAt isVerified")
    .sort({ createdAt: -1 });

  const orderCounts = await Order.aggregate([{ $group: { _id: "$user", count: { $sum: 1 }, spent: { $sum: "$totalAmount" } } }]);
  const countMap = new Map(orderCounts.map((o) => [o._id.toString(), o]));

  const enriched = customers.map((c) => ({
    ...c.toObject(),
    orderCount: countMap.get(c._id.toString())?.count || 0,
    totalSpent: countMap.get(c._id.toString())?.spent || 0,
  }));

  return ok(res, { customers: enriched });
});

// @route GET /api/admin/customers/map-points
// Flat list of every address pin across all customers, for the admin map view.
export const getCustomerMapPoints = asyncHandler(async (req, res) => {
  const customers = await User.find({ role: "customer", "addresses.0": { $exists: true } }).select(
    "name email phone addresses"
  );

  const points = customers.flatMap((c) =>
    c.addresses.map((a) => ({
      customerName: c.name,
      customerEmail: c.email,
      customerPhone: c.phone || a.phone,
      label: a.label,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      lat: a.lat,
      lng: a.lng,
    }))
  );

  return ok(res, { points });
});
