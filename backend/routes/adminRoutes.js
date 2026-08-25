import express from "express";
import { protect, requireAdmin } from "../middleware/auth.js";
import { getDashboardStats, getCustomers, getCustomerMapPoints } from "../controllers/adminController.js";

const router = express.Router();

router.use(protect, requireAdmin);

router.get("/dashboard", getDashboardStats);
router.get("/customers", getCustomers);
router.get("/customers/map-points", getCustomerMapPoints);

export default router;
