import express from "express";
import { protect } from "../middleware/auth.js";
import { searchAddress, reverseGeocode, checkPincodeServiceability } from "../controllers/locationController.js";

const router = express.Router();

// Public delivery estimator for product pages
router.get("/pincode/:pincode", checkPincodeServiceability);

// Authenticated address picker helpers
router.use(protect);
router.get("/search", searchAddress);
router.get("/reverse", reverseGeocode);

export default router;
