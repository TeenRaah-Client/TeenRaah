import express from "express";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { addressValidator, mongoIdParam } from "../utils/validators.js";
import {
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getReferralInfo,
} from "../controllers/userController.js";
import { getWishlist, addToWishlist, removeFromWishlist } from "../controllers/wishlistController.js";

const router = express.Router();

router.use(protect);

router.put("/me", updateProfile);

router.get("/addresses", getAddresses);
router.post("/addresses", addressValidator, validate, addAddress);
router.put("/addresses/:addressId", mongoIdParam("addressId"), validate, updateAddress);
router.delete("/addresses/:addressId", mongoIdParam("addressId"), validate, deleteAddress);

router.get("/referral", getReferralInfo);

router.get("/wishlist", getWishlist);
router.post("/wishlist/:productId", mongoIdParam("productId"), validate, addToWishlist);
router.delete("/wishlist/:productId", mongoIdParam("productId"), validate, removeFromWishlist);

export default router;
