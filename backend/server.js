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

import {
  notFound,
  errorHandler,
} from "./middleware/errorHandler.js";

import { generalApiLimiter } from "./middleware/rateLimiter.js";

import { applyFirewall } from "./middleware/security.js";

import {
  issueCsrfToken,
  verifyCsrfToken,
} from "./middleware/csrf.js";

import {
  handleRazorpayWebhook,
} from "./controllers/webhookController.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import productRoutes, {
  adminProductRouter,
} from "./routes/productRoutes.js";

import cartRoutes from "./routes/cartRoutes.js";

import couponRoutes, {
  adminCouponRouter,
} from "./routes/couponRoutes.js";

import paymentRoutes from "./routes/paymentRoutes.js";

import orderRoutes, {
  adminOrderRouter,
} from "./routes/orderRoutes.js";

import locationRoutes from "./routes/locationRoutes.js";

import adminRoutes, {
  adminReviewRouter,
} from "./routes/adminRoutes.js";

import chatRoutes from "./routes/chatRoutes.js";


const app = express();

/*
|--------------------------------------------------------------------------
| Reverse Proxy
|--------------------------------------------------------------------------
|
| Trust the hosting proxy in production (Render/Railway).
| Do not trust arbitrary X-Forwarded-* headers during local
| development.
|
*/

const isProduction = process.env.NODE_ENV === "production";
app.set("trust proxy", isProduction ? 1 : false);


/*
|--------------------------------------------------------------------------
| HTTP Server
|--------------------------------------------------------------------------
*/

const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;


/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

const configuredOrigins = [
  ...(process.env.ALLOWED_ORIGINS || "").split(","),
  ...(process.env.CLIENT_URL || "").split(","),
]
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

// Local origins are accepted only in development. This supports the
// Vite default port plus common alternate/dev-preview ports without
// weakening production CORS.
const localDevelopmentOrigins = isProduction
  ? []
  : [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
      "http://localhost:4173",
      "http://127.0.0.1:4173",
    ];

const allowedOrigins = new Set([
  ...configuredOrigins,
  ...localDevelopmentOrigins,
]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header are typically server-to-server
      // calls (e.g. health checks and payment-provider webhooks).
      if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }

      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "X-Admin-Key",
      "X-Admin-Access-Key",
    ],
  })
);


/*
|--------------------------------------------------------------------------
| Razorpay Webhook
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This must be registered BEFORE express.json().
|
| Razorpay signs the raw request body.
| express.json() would consume and parse that body.
|
*/

app.post(
  "/api/payment/webhook",
  express.raw({
    type: "application/json",
  }),
  handleRazorpayWebhook
);


/*
|--------------------------------------------------------------------------
| Body Parsers
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);


/*
|--------------------------------------------------------------------------
| Cookies
|--------------------------------------------------------------------------
|
| Must run BEFORE CSRF middleware because the CSRF
| middleware reads req.cookies.
|
*/

app.use(cookieParser());


/*
|--------------------------------------------------------------------------
| Security Firewall
|--------------------------------------------------------------------------
|
| Must run after body parsers because the firewall
| sanitizes request body/query/params.
|
*/

applyFirewall(app);


/*
|--------------------------------------------------------------------------
| CSRF Token Issuing
|--------------------------------------------------------------------------
|
| Every request passes through this middleware.
|
| If the browser does not have tr_csrf_v2, the backend
| creates one.
|
*/

app.use(issueCsrfToken);


/*
|--------------------------------------------------------------------------
| Development Logging
|--------------------------------------------------------------------------
*/

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}


/*
|--------------------------------------------------------------------------
| API Rate Limiting
|--------------------------------------------------------------------------
*/

app.use(
  "/api",
  generalApiLimiter
);


/*
|--------------------------------------------------------------------------
| CSRF Verification
|--------------------------------------------------------------------------
|
| GET / HEAD / OPTIONS are allowed automatically.
|
| POST / PUT / PATCH / DELETE require:
|
| Cookie:
|   tr_csrf_v2=<token>
|
| Header:
|   x-csrf-token: <same token>
|
*/

app.use(
  "/api",
  verifyCsrfToken
);


/*
|--------------------------------------------------------------------------
| CSRF Bootstrap Endpoint
|--------------------------------------------------------------------------
|
| This endpoint is intentionally GET.
|
| The frontend Axios client calls:
|
| GET /api/csrf-token
|
| when it needs to initialize the CSRF token.
|
| issueCsrfToken() runs before this route and creates:
|
| tr_csrf_v2
|
| if it does not already exist.
|
*/

app.get(
  "/api/csrf-token",
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "CSRF token initialized",
      csrfToken: req.csrfToken,
    });
  }
);


/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

app.use(
  "/api/auth",
  authRoutes
);


/*
|--------------------------------------------------------------------------
| User Routes
|--------------------------------------------------------------------------
*/

app.use(
  "/api/users",
  userRoutes
);


/*
|--------------------------------------------------------------------------
| Product Routes
|--------------------------------------------------------------------------
*/

app.use(
  "/api/products",
  productRoutes
);


/*
|--------------------------------------------------------------------------
| Cart Routes
|--------------------------------------------------------------------------
*/

app.use(
  "/api/cart",
  cartRoutes
);


/*
|--------------------------------------------------------------------------
| Coupon Routes
|--------------------------------------------------------------------------
*/

app.use(
  "/api/coupons",
  couponRoutes
);


/*
|--------------------------------------------------------------------------
| Payment Routes
|--------------------------------------------------------------------------
*/

app.use(
  "/api/payment",
  paymentRoutes
);


/*
|--------------------------------------------------------------------------
| Order Routes
|--------------------------------------------------------------------------
*/

app.use(
  "/api/orders",
  orderRoutes
);


/*
|--------------------------------------------------------------------------
| Location Routes
|--------------------------------------------------------------------------
*/

app.use(
  "/api/location",
  locationRoutes
);


/*
|--------------------------------------------------------------------------
| Chat Routes
|--------------------------------------------------------------------------
*/

app.use(
  "/api/chat",
  chatRoutes
);


/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/admin/products",
  adminProductRouter
);

app.use(
  "/api/admin/coupons",
  adminCouponRouter
);

app.use(
  "/api/admin/orders",
  adminOrderRouter
);

app.use(
  "/api/admin/reviews",
  adminReviewRouter
);


/*
|--------------------------------------------------------------------------
| Root / Health
|--------------------------------------------------------------------------
*/

app.get(
  "/",
  (req, res) => {
    res.send("TeenRaah API is running");
  }
);


app.get(
  "/api/health",
  (req, res) => {
    res.json({
      status: "ok",
      environment: process.env.NODE_ENV || "development",
      time: new Date().toISOString(),
    });
  }
);


/*
|--------------------------------------------------------------------------
| 404 + Error Handling
|--------------------------------------------------------------------------
*/

app.use(notFound);

app.use(errorHandler);


/*
|--------------------------------------------------------------------------
| Socket.IO
|--------------------------------------------------------------------------
*/

initSocket(httpServer);


/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

httpServer.listen(
  PORT,
  async () => {
    try {
      await connectDB();

      console.log(
        "✅ MongoDB connected successfully"
      );
    } catch (err) {
      console.error(
        "❌ Could not connect to MongoDB:",
        err.message
      );
    }

    console.log(
      `🚀 TeenRaah API running on port ${PORT}`
    );
  }
);