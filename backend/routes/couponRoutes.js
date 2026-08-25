import express from "express";
import { protect, requireAdmin } from "../middleware/auth.js";
import { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon } from "../controllers/couponController.js";

const router = express.Router();

router.post("/validate", protect, validateCoupon);

export default router;

// ---- Admin (mounted at /api/admin/coupons) ----
export const adminCouponRouter = express.Router();
adminCouponRouter.use(protect, requireAdmin);
adminCouponRouter.get("/", getCoupons);
adminCouponRouter.post("/", createCoupon);
adminCouponRouter.put("/:id", updateCoupon);
adminCouponRouter.delete("/:id", deleteCoupon);
