import express from "express";
import { protect } from "../middleware/auth.js";
import { createPaymentOrder, verifyPaymentSignature } from "../controllers/paymentController.js";
import { finalizeOrderFromPayment } from "../controllers/orderController.js";
import { validate } from "../middleware/validate.js";
import { createPaymentOrderValidator, verifyPaymentValidator } from "../utils/validators.js";

const router = express.Router();

router.use(protect);

router.post("/create-order", createPaymentOrderValidator, validate, createPaymentOrder);
// verifyPaymentSignature checks the HMAC and calls next(); finalizeOrderFromPayment
// then does the actual DB writes. Splitting it this way keeps "is this payment
// real" cleanly separate from "what do we do about it".
router.post("/verify", verifyPaymentValidator, validate, verifyPaymentSignature, finalizeOrderFromPayment);

export default router;
