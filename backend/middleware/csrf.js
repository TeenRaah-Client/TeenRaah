import crypto from "crypto";

/**
 * Double-submit cookie CSRF protection. The auth session lives in an
 * httpOnly cookie, which the browser attaches automatically to same-origin
 * *and* cross-origin requests alike — exactly the gap CSRF exploits. This
 * closes it cheaply: a second, JS-readable cookie holds a random token;
 * the frontend echoes it back as a header on every mutating request; a
 * cross-origin attacker's forged request can trigger the cookie to be sent
 * automatically, but can't read its value to also set the matching header
 * (browsers block cross-origin cookie reads), so the two never match.
 */

const CSRF_COOKIE_NAME = "tr_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const isProduction = process.env.NODE_ENV === "production";

const csrfCookieOptions = {
  httpOnly: false, // must be readable by frontend JS to echo back in the header
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

/** Applied globally, early — makes sure every visitor has a token before
 * they ever submit a form, including their very first page load. */
export const issueCsrfToken = (req, res, next) => {
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions);
  }
  next();
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Applied to /api — rejects any state-changing request whose header token
 * doesn't match its cookie token. GET/HEAD/OPTIONS are never mutating, so
 * they're exempt (and the Razorpay webhook never reaches this middleware at
 * all — it's mounted earlier in server.js and already responds before this
 * point in the stack). */
export const verifyCsrfToken = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ success: false, message: "Request blocked for your security — please refresh the page and try again." });
  }
  next();
};
