import jwt from "jsonwebtoken";

const COOKIE_NAME = "tr_token";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export const signToken = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
};

// Short-lived, single-purpose token for the gap between "password correct"
// and "TOTP code correct" in the admin 2FA flow — never a valid session
// token on its own (verifyPendingTotpToken checks the purpose claim), and
// expires in 5 minutes so a leaked value is only briefly useful.
export const signPendingTotpToken = (userId) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ id: userId, purpose: "admin_totp_pending" }, process.env.JWT_SECRET, { expiresIn: "5m" });
};

export const verifyPendingTotpToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.purpose !== "admin_totp_pending") throw new Error("Invalid token purpose");
  return decoded;
};

export const sendAuthCookie = (res, user) => {
  const token = signToken({
    id: user._id.toString(),
    role: user.role,
  });

  res.cookie(COOKIE_NAME, token, cookieOptions);

  return token;
};

export const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
  });
};