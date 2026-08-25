import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { fail } from "../utils/apiResponse.js";

const getTokenFromReq = (req) => {
  if (req.cookies?.tr_token) return req.cookies.tr_token;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.split(" ")[1];
  return null;
};

/** Requires a valid logged-in user (customer or admin). */
export const protect = asyncHandler(async (req, res, next) => {
  const token = getTokenFromReq(req);
  if (!token) return fail(res, "Not authorized, please log in", 401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return fail(res, "User no longer exists", 401);
    req.user = user;
    next();
  } catch (err) {
    return fail(res, "Session expired, please log in again", 401);
  }
});

/** Requires the logged-in user to be an admin, PLUS a shared secret header. */
export const requireAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return fail(res, "Admin access only", 403);
  }

  // Second layer of secrecy: even a stolen admin JWT is useless without
  // this header, which only ships inside the hidden admin panel bundle.
  const key = req.headers["x-admin-key"];
  if (!process.env.ADMIN_PANEL_ACCESS_KEY || key !== process.env.ADMIN_PANEL_ACCESS_KEY) {
    return fail(res, "Admin access only", 403);
  }

  next();
});

/** Optional auth — attaches req.user if a valid token is present, but never blocks the request. */
export const attachUserIfPresent = asyncHandler(async (req, res, next) => {
  const token = getTokenFromReq(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
  } catch {
    // ignore invalid token in optional-auth contexts
  }
  next();
});
