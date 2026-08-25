import express from "express";
import { protect, requireAdmin } from "../middleware/auth.js";
import { getMyOrders, getOrderById, getAllOrders, updateOrderStatus } from "../controllers/orderController.js";

const router = express.Router();

router.use(protect);

router.get("/mine", getMyOrders);
router.get("/:id", getOrderById);

export default router;

// ---- Admin (mounted at /api/admin/orders) ----
export const adminOrderRouter = express.Router();
adminOrderRouter.use(protect, requireAdmin);
adminOrderRouter.get("/", getAllOrders);
adminOrderRouter.put("/:id/status", updateOrderStatus);
