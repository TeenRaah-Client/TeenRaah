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
 * The key is kept in memory and sessionStorage only.
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
    // Ignore storage errors; in-memory authentication still works.
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
 * Reads the CSRF token cookie the backend issues on every response
 * (see backend/middleware/csrf.js). Not httpOnly, so it's readable here —
 * that's the point of the double-submit pattern: a cross-origin attacker
 * can't read it to forge a matching header even though the cookie itself
 * gets attached automatically.
 */
export const getCsrfCookie = () => {
  const match = document.cookie.match(/(?:^|;\s*)tr_csrf=([^;]+)/);
  return match ? match[1] : null;
};

const SAFE_METHODS = new Set(["get", "head", "options"]);

const attachCsrfToken = (config) => {
  const method = (config.method || "get").toLowerCase();
  if (SAFE_METHODS.has(method)) return config;

  const token = getCsrfCookie();
  if (token) {
    config.headers = config.headers || {};
    config.headers["x-csrf-token"] = token;
  }
  return config;
};

/**
 * Convert Axios errors into the application's consistent error format.
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
 * Automatically attach x-admin-key to every /admin/ request, and the CSRF
 * token to every mutating request.
 */
api.interceptors.request.use(
  (config) => attachCsrfToken(attachAdminKey(config)),
  (error) => Promise.reject(error)
);

apiMultipart.interceptors.request.use(
  (config) => attachCsrfToken(attachAdminKey(config)),
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