import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";

/**
 * "Firewall" for an Express API, in the sense that actually matters for this
 * app — not a network appliance, but the standard hardening layer that
 * blocks the request classes that hit public APIs constantly:
 *
 *  - helmet: sets ~15 security headers in one call (HSTS, no-sniff,
 *    clickjacking protection, hides X-Powered-By, disables cross-origin
 *    resource sharing where it shouldn't happen, etc.)
 *  - express-mongo-sanitize: strips any `$` or `.` prefixed keys from
 *    req.body/query/params before they ever reach a Mongoose query — closes
 *    off NoSQL operator injection (e.g. `{"email": {"$ne": null}}` style
 *    payloads trying to bypass login/lookups).
 *  - hpp: collapses duplicate query-string keys (?category=A&category=B)
 *    down to a single value, so a handler that expects a string can't be
 *    handed an array it never validated for.
 *
 * Applied globally in server.js, before any route is mounted.
 */
export const applyFirewall = (app) => {
  app.use(
    helmet({
      // The API serves JSON to a separate frontend origin, not HTML pages
      // that load cross-origin scripts — a strict default CSP would only
      // add noise here without protecting anything this server renders.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(
    mongoSanitize({
      replaceWith: "_",
      onSanitize: ({ key }) => {
        console.warn(`⚠️  Sanitized a NoSQL-injection-shaped key in request: "${key}"`);
      },
    })
  );

  app.use(hpp());
};
