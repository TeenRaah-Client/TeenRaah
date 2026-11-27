import express from "express";
import { protect, requireAdmin } from "../middleware/auth.js";
import {
  getMyOrders,
  getOrderById,
  getOrderInvoice,
  getAllOrders,
  updateOrderStatus,
  requestOrderReturn,
  getReturnRequests,
  reviewOrderReturn,
} from "../controllers/orderController.js";

const router = express.Router();

router.use(protect);

router.get("/mine", getMyOrders);
router.get("/:id/invoice", getOrderInvoice);
router.get("/:id", getOrderById);
router.post("/:id/return", requestOrderReturn);

export default router;

// ---- Admin (mounted at /api/admin/orders) ----
export const adminOrderRouter = express.Router();
adminOrderRouter.use(protect, requireAdmin);
adminOrderRouter.get("/", getAllOrders);
adminOrderRouter.get("/returns", getReturnRequests);
adminOrderRouter.put("/:id/return", reviewOrderReturn);
adminOrderRouter.put("/:id/status", updateOrderStatus);
