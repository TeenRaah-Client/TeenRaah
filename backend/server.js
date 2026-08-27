import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { createServer } from "http";

dotenv.config();

import { connectDB } from "./config/db.js";
import "./config/redis.js";
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

// Render runs the application behind a reverse proxy.
// This allows express-rate-limit to correctly handle X-Forwarded-For.
app.set("trust proxy", 1);

const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// ---- CORS ----
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  process.env.CLIENT_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ---- Body Parsers ----
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ---- Cookies ----
app.use(cookieParser());

// ---- Security ----
// Must run after body parsers because the firewall
// sanitizes request body/query/params.
applyFirewall(app);

// ---- Logging ----
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ---- API Rate Limiting ----
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

// ---- Admin Routes ----
app.use("/api/admin", adminRoutes);
app.use("/api/admin/products", adminProductRouter);
app.use("/api/admin/coupons", adminCouponRouter);
app.use("/api/admin/orders", adminOrderRouter);

// ---- Health / Root ----
app.get("/", (req, res) => {
  res.send("TeenRaah API is running");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
  });
});

// ---- Error Handling ----
app.use(notFound);
app.use(errorHandler);

// ---- Socket.IO ----
initSocket(httpServer);

// ---- Start Server ----
httpServer.listen(PORT, async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error("❌ Could not connect to MongoDB:", err.message);
  }

  console.log(`🚀 TeenRaah API running on port ${PORT}`);
});