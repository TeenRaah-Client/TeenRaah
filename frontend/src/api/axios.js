import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const ADMIN_KEY_STORAGE = "tr_admin_key";

let adminKey = null;

// Restore admin key for the current browser session.
try {
  adminKey = sessionStorage.getItem(ADMIN_KEY_STORAGE);
} catch {
  adminKey = null;
}

/**
 * Set or clear the admin authentication key.
 *
 * The key is stored only for the current browser session.
 */
export const setAdminKey = (key) => {
  adminKey = key || null;

  try {
    if (adminKey) {
      sessionStorage.setItem(ADMIN_KEY_STORAGE, adminKey);
    } else {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    }
  } catch {
    // Ignore storage errors.
    // In-memory authentication will still work.
  }
};

/**
 * Returns the currently configured admin key.
 */
export const getAdminKey = () => adminKey;

/**
 * Attach the admin key to admin API requests.
 */
const attachAdminKey = (config) => {
  const url = config.url || "";

  if (adminKey && url.includes("/admin/")) {
    config.headers = config.headers || {};
    config.headers["x-admin-key"] = adminKey;
  }

  return config;
};

/**
 * Reads the CSRF token issued by the backend.
 *
 * The cookie is intentionally NOT httpOnly because the frontend
 * needs to read it and send it back through the x-csrf-token header.
 */
export const getCsrfCookie = () => {
  const match = document.cookie.match(
    /(?:^|;\s*)tr_csrf_v2=([^;]+)/
  );

  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Safe HTTP methods do not require CSRF protection.
 */
const SAFE_METHODS = new Set([
  "get",
  "head",
  "options",
]);

/**
 * Makes sure a CSRF cookie exists before a state-changing request.
 *
 * This is particularly important for:
 *
 *   POST /auth/login
 *   POST /auth/admin-login
 *   POST /users/wishlist/:productId
 *
 * because the very first request from a fresh browser session may
 * otherwise have no CSRF cookie yet.
 */
let csrfBootstrapPromise = null;

const ensureCsrfToken = async () => {
  // Already available.
  if (getCsrfCookie()) {
    return;
  }

  // Prevent multiple simultaneous requests from creating
  // multiple bootstrap requests.
  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = axios
      .get(`${API_BASE_URL}/csrf-token`, {
        withCredentials: true,
      })
      .finally(() => {
        csrfBootstrapPromise = null;
      });
  }

  await csrfBootstrapPromise;

  // Verify that the backend actually issued the cookie.
  if (!getCsrfCookie()) {
    throw new Error(
      "Unable to initialize security token. Please refresh the page and try again."
    );
  }
};

/**
 * Attach CSRF token to mutating requests.
 */
const attachCsrfToken = async (config) => {
  const method = (config.method || "get").toLowerCase();

  if (SAFE_METHODS.has(method)) {
    return config;
  }

  await ensureCsrfToken();

  const token = getCsrfCookie();

  if (!token) {
    throw new Error(
      "Security token missing. Please refresh the page and try again."
    );
  }

  config.headers = config.headers || {};
  config.headers["x-csrf-token"] = token;

  return config;
};

/**
 * Convert Axios errors into the application's consistent
 * error format.
 */
const unwrapError = (error) => {
  const message =
    error.response?.data?.message ||
    error.message ||
    "Something went wrong";

  return Promise.reject({
    message,
    status: error.response?.status,
    data: error.response?.data,
  });
};

/**
 * Standard JSON API client.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Multipart API client.
 *
 * Do not manually set Content-Type here.
 * Axios/browser automatically generates the multipart boundary.
 */
export const apiMultipart = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/**
 * Automatically attach:
 *
 * - x-admin-key to admin requests
 * - x-csrf-token to mutating requests
 */
api.interceptors.request.use(
  async (config) => {
    config = attachAdminKey(config);
    config = await attachCsrfToken(config);

    return config;
  },
  (error) => Promise.reject(error)
);

apiMultipart.interceptors.request.use(
  async (config) => {
    config = attachAdminKey(config);
    config = await attachCsrfToken(config);

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Consistent response/error handling.
 */
api.interceptors.response.use(
  (response) => response,
  unwrapError
);

apiMultipart.interceptors.response.use(
  (response) => response,
  unwrapError
);

export default api;