import express from "express";
import { protect, requireAdmin } from "../middleware/auth.js";
import { getDashboardStats, getCustomers, getCustomerMapPoints } from "../controllers/adminController.js";
import { getBusinessAnalytics } from "../controllers/analyticsController.js";
import { getInventoryForecast } from "../controllers/inventoryForecastController.js";
import { getCustomerIntelligence } from "../controllers/customerIntelligenceController.js";
import { listMarketingCampaigns, createMarketingCampaign, deleteMarketingCampaign } from "../controllers/marketingCampaignController.js";
import { getAllReviewsAdmin, setReviewVisibility, deleteReviewAdmin } from "../controllers/reviewController.js";
import AdminLog from "../models/AdminLog.js";
import { ok } from "../utils/apiResponse.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

router.use(protect, requireAdmin);

router.get("/dashboard", getDashboardStats);
router.get("/analytics", getBusinessAnalytics);
router.get("/inventory-forecast", getInventoryForecast);
router.get("/customer-intelligence", getCustomerIntelligence);
router.get("/marketing-campaigns", listMarketingCampaigns);
router.post("/marketing-campaigns", createMarketingCampaign);
router.delete("/marketing-campaigns/:id", deleteMarketingCampaign);
router.get("/customers", getCustomers);
router.get("/customers/map-points", getCustomerMapPoints);

// @route GET /api/admin/audit-log?page=&limit=
router.get(
  "/audit-log",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 40);

    const [logs, total] = await Promise.all([
      AdminLog.find({})
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AdminLog.countDocuments({}),
    ]);

    return ok(res, { logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  })
);

export default router;

// ---- Review moderation (mounted separately at /api/admin/reviews in server.js) ----
export const adminReviewRouter = express.Router();
adminReviewRouter.use(protect, requireAdmin);
adminReviewRouter.get("/", getAllReviewsAdmin);
adminReviewRouter.put("/:id/visibility", setReviewVisibility);
adminReviewRouter.delete("/:id", deleteReviewAdmin);
