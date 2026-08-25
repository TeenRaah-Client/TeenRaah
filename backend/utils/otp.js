import { redis } from "../config/redis.js";

const OTP_TTL_SECONDS = 10 * 60; // 10 minutes
const RESEND_COOLDOWN_SECONDS = 60; // 1 minute between resends

export const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000)); // 6 digits

const otpKey = (email) => `otp:${email.toLowerCase()}`;
const cooldownKey = (email) => `otp:cooldown:${email.toLowerCase()}`;

export const storeOTP = async (email, otp) => {
  await redis.set(otpKey(email), otp, "EX", OTP_TTL_SECONDS);
  await redis.set(cooldownKey(email), "1", "EX", RESEND_COOLDOWN_SECONDS);
};

export const isOnCooldown = async (email) => {
  const val = await redis.get(cooldownKey(email));
  return Boolean(val);
};

export const verifyOTP = async (email, submittedOtp) => {
  const stored = await redis.get(otpKey(email));
  if (!stored) return { valid: false, reason: "expired" };
  if (stored !== String(submittedOtp)) return { valid: false, reason: "mismatch" };
  await redis.del(otpKey(email));
  return { valid: true };
};
