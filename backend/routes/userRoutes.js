import express from "express";
import { protect } from "../middleware/auth.js";
import {
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getReferralInfo,
} from "../controllers/userController.js";

const router = express.Router();

router.use(protect);

router.put("/me", updateProfile);

router.get("/addresses", getAddresses);
router.post("/addresses", addAddress);
router.put("/addresses/:addressId", updateAddress);
router.delete("/addresses/:addressId", deleteAddress);

router.get("/referral", getReferralInfo);

export default router;
