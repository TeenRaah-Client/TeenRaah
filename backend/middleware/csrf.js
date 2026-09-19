import crypto from "crypto";

/**
 * Double-submit cookie CSRF protection.
 *
 * Frontend:
 *   https://teenraah.shop
 *
 * Backend:
 *   https://api.teenraah.shop
 *
 * The CSRF cookie is intentionally readable by JavaScript.
 * The frontend sends the same value through:
 *
 *   x-csrf-token
 *
 * The backend compares the cookie value with the header value.
 */

const CSRF_COOKIE_NAME = "tr_csrf_v2";
const CSRF_HEADER_NAME = "x-csrf-token";

const isProduction = process.env.NODE_ENV === "production";

/**
 * CSRF cookie configuration.
 */
const csrfCookieOptions = {
  httpOnly: false,

  secure: isProduction,

  sameSite: isProduction ? "none" : "lax",

  /**
   * Share the cookie between:
   *
   * teenraah.shop
   * api.teenraah.shop
   */
  domain: isProduction ? ".teenraah.shop" : undefined,

  path: "/",

  // 30 days
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

/**
 * Issue a CSRF token if one does not already exist.
 */
export const issueCsrfToken = (req, res, next) => {
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = crypto.randomBytes(32).toString("hex");

    res.cookie(
      CSRF_COOKIE_NAME,
      token,
      csrfCookieOptions
    );
  }

  next();
};

const SAFE_METHODS = new Set([
  "GET",
  "HEAD",
  "OPTIONS",
]);

/**
 * Verify CSRF token on state-changing requests.
 */
export const verifyCsrfToken = (req, res, next) => {
  // Safe requests do not modify application state.
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  /**
   * Both tokens must exist and match.
   */
  if (
    !cookieToken ||
    !headerToken ||
    cookieToken !== headerToken
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Request blocked for your security — please refresh the page and try again.",
    });
  }

  next();
};