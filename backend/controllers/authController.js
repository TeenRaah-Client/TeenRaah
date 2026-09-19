import asyncHandler from "express-async-handler";
import { generateSecret, generateURI, verify as verifyTotp } from "otplib";
import QRCode from "qrcode";
import User from "../models/User.js";
import { ok, fail } from "../utils/apiResponse.js";
import { generateOTP, storeOTP, verifyOTP, isOnCooldown } from "../utils/otp.js";
import { sendOTPEmail } from "../utils/sendEmail.js";
import { generateReferralCode } from "../utils/generateCodes.js";
import { sendAuthCookie, clearAuthCookie, signPendingTotpToken, verifyPendingTotpToken } from "../utils/generateToken.js";
import { recordAuditLog } from "../utils/auditLog.js";

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
  const user = await User.findOne({ email: email?.toLowerCase(), role: "admin" }).select("+password +totpSecret");

  if (!user || !(await user.comparePassword(password))) {
    return fail(res, "Invalid credentials", 401);
  }

  if (user.totpEnabled) {
    // Password is correct, but the session cookie doesn't get issued until
    // the TOTP step also passes — this pendingToken proves step 1 happened
    // without granting any actual access on its own.
    const pendingToken = signPendingTotpToken(user._id.toString());
    return ok(res, { requiresTotp: true, pendingToken }, "Enter your authenticator code");
  }

  sendAuthCookie(res, user);
  await recordAuditLog({ req, admin: user, action: "auth.admin_login", summary: `${user.name} logged into the admin panel` });
  return ok(res, { user: user.toSafeObject(), adminKey: process.env.ADMIN_PANEL_ACCESS_KEY }, "Welcome back");
});

// @route  POST /api/auth/admin-login/verify-totp   body: { pendingToken, code }
export const verifyAdminTotp = asyncHandler(async (req, res) => {
  const { pendingToken, code } = req.body;
  if (!pendingToken || !code) return fail(res, "Missing verification details", 400);

  let decoded;
  try {
    decoded = verifyPendingTotpToken(pendingToken);
  } catch {
    return fail(res, "Login session expired — please log in again", 401);
  }

  const user = await User.findOne({ _id: decoded.id, role: "admin" }).select("+totpSecret");
  if (!user || !user.totpEnabled) return fail(res, "Two-factor login is not available for this account", 400);

  const result = await verifyTotp({ secret: user.totpSecret, token: String(code) });
  if (!result.valid) return fail(res, "Incorrect code — check your authenticator app and try again", 401);

  sendAuthCookie(res, user);
  await recordAuditLog({ req, admin: user, action: "auth.admin_login", summary: `${user.name} logged into the admin panel (2FA)` });
  return ok(res, { user: user.toSafeObject(), adminKey: process.env.ADMIN_PANEL_ACCESS_KEY }, "Welcome back");
});

// ---------------- Admin 2FA setup ----------------

// @route  POST /api/auth/admin/2fa/setup   (protect + requireAdmin)
// Generates a new secret and returns a QR code to scan — NOT enabled yet
// until confirmAdminTotp verifies the admin actually scanned it correctly.
export const setupAdminTotp = asyncHandler(async (req, res) => {
  const secret = generateSecret();
  const otpauthUrl = generateURI({ issuer: "TeenRaah Admin", label: req.user.email, secret });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  await User.updateOne({ _id: req.user._id }, { totpSecret: secret, totpEnabled: false });

  return ok(res, { qrCodeDataUrl, secret }, "Scan this with your authenticator app, then confirm with a code");
});

// @route  POST /api/auth/admin/2fa/confirm   body: { code }
export const confirmAdminTotp = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+totpSecret");
  if (!user.totpSecret) return fail(res, "Start setup first", 400);

  const result = await verifyTotp({ secret: user.totpSecret, token: String(req.body.code) });
  if (!result.valid) return fail(res, "Incorrect code — try again", 400);

  user.totpEnabled = true;
  await user.save();
  await recordAuditLog({ req, action: "auth.2fa_enabled", summary: `${user.name} enabled two-factor authentication` });
  return ok(res, {}, "Two-factor authentication enabled");
});

// @route  POST /api/auth/admin/2fa/disable   body: { code }
// Requires a valid current code, not just being logged in — otherwise
// anyone with a hijacked session (but not the authenticator app) could
// quietly turn off the extra protection.
export const disableAdminTotp = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+totpSecret");
  if (!user.totpEnabled) return fail(res, "Two-factor authentication is not enabled", 400);

  const result = await verifyTotp({ secret: user.totpSecret, token: String(req.body.code) });
  if (!result.valid) return fail(res, "Incorrect code", 400);

  user.totpEnabled = false;
  user.totpSecret = undefined;
  await user.save();
  await recordAuditLog({ req, action: "auth.2fa_disabled", summary: `${user.name} disabled two-factor authentication` });
  return ok(res, {}, "Two-factor authentication disabled");
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
