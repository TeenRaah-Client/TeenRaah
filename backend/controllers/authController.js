import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { ok, fail } from "../utils/apiResponse.js";
import { generateOTP, storeOTP, verifyOTP, isOnCooldown } from "../utils/otp.js";
import { sendOTPEmail } from "../utils/sendEmail.js";
import { generateReferralCode } from "../utils/generateCodes.js";
import { sendAuthCookie, clearAuthCookie } from "../utils/generateToken.js";

// @route  POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, referralCode } = req.body;

  if (!name || !email || !password) {
    return fail(res, "Name, email and password are required", 400);
  }
  if (password.length < 6) {
    return fail(res, "Password must be at least 6 characters", 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    if (existing.isVerified) return fail(res, "An account with this email already exists", 400);
    // Unverified leftover — let them re-register cleanly.
    await existing.deleteOne();
  }

  let referredBy = null;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    if (!referrer) return fail(res, "Invalid referral code", 400);
    referredBy = referrer._id;
  }

  const myReferralCode = await generateReferralCode(name);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone,
    referredBy,
    referralCode: myReferralCode,
  });

  const otp = generateOTP();
  await storeOTP(user.email, otp);

  try {
    await sendOTPEmail({ to: user.email, name: user.name, otp });
  } catch {
    // Registration still succeeds even if the email provider isn't configured yet
    // (e.g. RESEND_API_KEY still a placeholder in a fresh clone) — the OTP is
    // still in Redis and /resend-otp can be retried once real keys are added.
  }

  return ok(
    res,
    { email: user.email },
    "Account created. Enter the verification code we emailed you.",
    201
  );
});

// @route  POST /api/auth/verify-otp
export const verifyOtpHandler = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return fail(res, "Email and OTP are required", 400);

  const { valid, reason } = await verifyOTP(email, otp);
  if (!valid) {
    return fail(res, reason === "expired" ? "Code expired. Request a new one." : "Incorrect code.", 400);
  }

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { isVerified: true, lastLoginAt: new Date() },
    { new: true }
  );
  if (!user) return fail(res, "Account not found", 404);

  sendAuthCookie(res, user);
  return ok(res, { user: user.toSafeObject() }, "Email verified! Welcome to TeenRaah.");
});

// @route  POST /api/auth/resend-otp
export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return fail(res, "Email is required", 400);

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return fail(res, "Account not found", 404);
  if (user.isVerified) return fail(res, "This account is already verified", 400);

  if (await isOnCooldown(user.email)) {
    return fail(res, "Please wait a minute before requesting another code", 429);
  }

  const otp = generateOTP();
  await storeOTP(user.email, otp);
  await sendOTPEmail({ to: user.email, name: user.name, otp });

  return ok(res, {}, "A new code has been sent to your email.");
});

// @route  POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, "Email and password are required", 400);

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return fail(res, "Invalid email or password", 401);
  }

  if (!user.isVerified) {
    const otp = generateOTP();
    await storeOTP(user.email, otp);
    await sendOTPEmail({ to: user.email, name: user.name, otp }).catch(() => {});
    return fail(res, "Please verify your email first. We've sent a new code.", 403, {
      requiresVerification: true,
      email: user.email,
    });
  }

  user.lastLoginAt = new Date();
  await user.save();

  sendAuthCookie(res, user);
  return ok(res, { user: user.toSafeObject() }, "Logged in successfully");
});

// @route  POST /api/auth/admin-login
// Deliberately separate from the customer login so admin creds never touch
// the public login form/rate-limit path or reveal whether an email is an admin.
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase(), role: "admin" }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return fail(res, "Invalid credentials", 401);
  }

  sendAuthCookie(res, user);
  return ok(res, { user: user.toSafeObject(), adminKey: process.env.ADMIN_PANEL_ACCESS_KEY }, "Welcome back");
});

// @route  POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  return ok(res, {}, "Logged out");
});

// @route  GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  return ok(res, { user: req.user.toSafeObject() });
});
