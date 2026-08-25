import express from "express";
import { protect } from "../middleware/auth.js";
import { searchAddress, reverseGeocode } from "../controllers/locationController.js";

const router = express.Router();

router.use(protect);

router.get("/search", searchAddress);
router.get("/reverse", reverseGeocode);

export default router;
