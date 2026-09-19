import express from "express";
import { protect, requireAdmin, attachUserIfPresent } from "../middleware/auth.js";
import { productMediaUpload, singleImageUpload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { productValidator, reviewValidator } from "../utils/validators.js";
import {
  getProducts,
  getCategories,
  getProductBySlug,
  createProduct,
  updateProduct,
  removeProductMedia,
  deleteProduct,
  getAdminProducts,
  generateAiStudioPreview,
  discardAiStudioAsset,
  promoteImageToAiVersion,
} from "../controllers/productController.js";
import { getProductReviews, getReviewEligibility, submitReview, deleteMyReview } from "../controllers/reviewController.js";

const router = express.Router();

// ---- Public ----
router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/:slug", getProductBySlug);

router.get("/:slug/reviews", getProductReviews);
router.get("/:slug/reviews/eligibility", protect, getReviewEligibility);
router.post("/:slug/reviews", protect, reviewValidator, validate, submitReview);
router.delete("/:slug/reviews/mine", protect, deleteMyReview);

export default router;

// ---- Admin (mounted separately at /api/admin/products in server.js) ----
export const adminProductRouter = express.Router();
adminProductRouter.use(protect, requireAdmin);
adminProductRouter.get("/", getAdminProducts);
adminProductRouter.post("/", productMediaUpload, productValidator, validate, createProduct);
adminProductRouter.put("/:id", productMediaUpload, updateProduct);
// AI Photo Studio — registered before "/:id/media" only matters if paths
// could collide, which they can't here, but kept together for readability.
adminProductRouter.post("/ai-studio", singleImageUpload, generateAiStudioPreview);
adminProductRouter.delete("/ai-studio", discardAiStudioAsset);
adminProductRouter.delete("/:id/media", removeProductMedia);
adminProductRouter.put("/:id/media/promote-ai", promoteImageToAiVersion);
adminProductRouter.delete("/:id", deleteProduct);
