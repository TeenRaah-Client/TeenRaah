import crypto from "crypto";

/**
 * Double-submit cookie CSRF protection.
 *
 * Frontend:
 *   https://teenraah.shop
 *
 * API:
 *   https://api.teenraah.shop
 *
 * The CSRF cookie is intentionally JS-readable so the frontend can
 * send its value back through the x-csrf-token header.
 */

const CSRF_COOKIE_NAME = "tr_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";

const isProduction = process.env.NODE_ENV === "production";

const csrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  domain: isProduction ? ".teenraah.shop" : undefined,
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

/**
 * Issue a CSRF token if the browser does not already have one.
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
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

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