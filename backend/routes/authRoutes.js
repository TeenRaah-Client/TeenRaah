import express from "express";
import {
  register,
  verifyOtpHandler,
  resendOtp,
  login,
  adminLogin,
  verifyAdminTotp,
  setupAdminTotp,
  confirmAdminTotp,
  disableAdminTotp,
  logout,
  getMe,
} from "../controllers/authController.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { registerValidator, loginValidator, otpValidator, totpCodeValidator } from "../utils/validators.js";
import { body } from "express-validator";

const router = express.Router();

router.post("/register", authLimiter, registerValidator, validate, register);
router.post("/verify-otp", authLimiter, otpValidator, validate, verifyOtpHandler);
router.post(
  "/resend-otp",
  otpLimiter,
  [body("email").trim().isEmail().withMessage("Enter a valid email").normalizeEmail()],
  validate,
  resendOtp
);
router.post("/login", authLimiter, loginValidator, validate, login);
router.post("/admin-login", authLimiter, loginValidator, validate, adminLogin);
router.post("/admin-login/verify-totp", authLimiter, totpCodeValidator, validate, verifyAdminTotp);
router.post("/logout", logout);
router.get("/me", protect, getMe);

// Admin 2FA setup — must already be logged in as admin to turn this on.
router.post("/admin/2fa/setup", protect, requireAdmin, setupAdminTotp);
router.post("/admin/2fa/confirm", protect, requireAdmin, totpCodeValidator, validate, confirmAdminTotp);
router.post("/admin/2fa/disable", protect, requireAdmin, totpCodeValidator, validate, disableAdminTotp);

export default router;
