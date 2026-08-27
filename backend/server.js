import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { createServer } from "http";

dotenv.config();

import { connectDB } from "./config/db.js";
import "./config/redis.js"; // connects on import
import { initSocket } from "./sockets/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { generalApiLimiter } from "./middleware/rateLimiter.js";
import { applyFirewall } from "./middleware/security.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes, { adminProductRouter } from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import couponRoutes, { adminCouponRouter } from "./routes/couponRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import orderRoutes, { adminOrderRouter } from "./routes/orderRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// ---- CORS ----
// The client's final domain isn't locked in yet, so this reads from an env
// list rather than a hardcoded origin — update ALLOWED_ORIGINS in .env
// (no code changes) once the client picks a domain.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || "http://localhost:5173").split(
  ","
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Sanitizes req.body/query/params against NoSQL-injection payloads and HTTP
// parameter pollution — must run after the body parsers above, since it
// needs req.body to already be populated.
applyFirewall(app);
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));
app.use("/api", generalApiLimiter);

// ---- Routes ----
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/chat", chatRoutes);

// Secret admin panel's API surface — the frontend route that calls these
// lives at a hidden, non-guessable path (see frontend VITE_ADMIN_PATH),
// and every request here additionally requires the x-admin-key header
// (see middleware/auth.js requireAdmin).
app.use("/api/admin", adminRoutes);
app.use("/api/admin/products", adminProductRouter);
app.use("/api/admin/coupons", adminCouponRouter);
app.use("/api/admin/orders", adminOrderRouter);

app.get("/", (req, res) => res.send("TeenRaah API is running"));
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use(notFound);
app.use(errorHandler);

initSocket(httpServer);

httpServer.listen(PORT, async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error("❌ Could not connect to MongoDB:", err.message);
  }
  console.log(`🚀 TeenRaah API running on port ${PORT}`);
});
