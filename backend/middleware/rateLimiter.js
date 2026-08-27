import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts. Please try again in a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { success: false, message: "Too many OTP requests. Please wait a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat calls a paid-by-token LLM API — generous enough for a real
// conversation, tight enough that a script can't run up a bill.
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  message: { success: false, message: "You're sending messages a little fast — give it a few seconds." },
  standardHeaders: true,
  legacyHeaders: false,
  // Logged-in users are limited per account, guests per IP — otherwise a
  // shared office/campus IP would throttle every guest shopper together.
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});

// Image generation bills per call with no free tier (see README) — this
// limiter is deliberately strict; the real per-user daily cap is enforced
// separately in the tool itself (backend/utils/chatTools.js) since it must
// survive server restarts, which an in-memory rate limiter does not.
export const imageGenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 6,
  message: { success: false, message: "AI image generation is limited for now — please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});
