import express from "express";
import { register, verifyOtpHandler, resendOtp, login, adminLogin, logout, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/verify-otp", authLimiter, verifyOtpHandler);
router.post("/resend-otp", otpLimiter, resendOtp);
router.post("/login", authLimiter, login);
router.post("/admin-login", authLimiter, adminLogin);
router.post("/logout", logout);
router.get("/me", protect, getMe);

export default router;
