import crypto from "crypto";

/**
 * Double-submit cookie CSRF protection.
 *
 * Works both for same-site subdomains (when COOKIE_DOMAIN is set, e.g.
 * `.teenraah.shop`) and cross-domain deployments (e.g. `*.vercel.app` +
 * `*.onrender.com`) where `document.cookie` cannot read the backend's cookie
 * directly — in that case, the frontend fetches the token from
 * `GET /api/csrf-token` and echoes it in `x-csrf-token`.
 */

const CSRF_COOKIE_NAME = "tr_csrf_v2";
const CSRF_HEADER_NAME = "x-csrf-token";

const isProduction = process.env.NODE_ENV === "production";
const cookieDomain = process.env.COOKIE_DOMAIN?.trim() || undefined;

const csrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  ...(cookieDomain ? { domain: cookieDomain } : {}),
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

/**
 * Issue a CSRF token if one does not already exist, and expose it on `req.csrfToken`.
 */
export const issueCsrfToken = (req, res, next) => {
  let token = req.cookies?.[CSRF_COOKIE_NAME];

  if (!token) {
    token = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions);
  }

  req.csrfToken = token;
  next();
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Verify CSRF token on state-changing requests.
 */
export const verifyCsrfToken = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message:
        "Request blocked for your security — please refresh the page and try again.",
    });
  }

  next();
};