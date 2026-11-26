import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";

let io = null;

/**
 * Real-time layer used for:
 *  - pushing live order status updates to the customer's tracking page
 *    (customer joins room `user:<userId>`)
 *  - notifying the admin dashboard the instant a new order comes in
 *    (admin sockets join room `admin`)
 */
export const initSocket = (httpServer) => {
  const isProduction = process.env.NODE_ENV === "production";

  const configuredOrigins = [
    ...(process.env.ALLOWED_ORIGINS || "").split(","),
    ...(process.env.CLIENT_URL || "").split(","),
  ]
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

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

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) {
          return callback(null, true);
        }
        return callback(new Error(`Socket.IO CORS blocked: ${origin}`));
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const raw = socket.handshake.headers.cookie;
      const token = raw ? cookie.parse(raw).tr_token : null;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.role = decoded.role;
      }
      next();
    } catch {
      next(); // allow anonymous sockets too — they just won't join private rooms
    }
  });

  io.on("connection", (socket) => {
    if (socket.userId) socket.join(`user:${socket.userId}`);
    if (socket.role === "admin") socket.join("admin");

    socket.on("disconnect", () => {});
  });

  return io;
};

export const getIO = () => io;

export const emitOrderUpdate = (userId, order) => {
  io?.to(`user:${userId}`).emit("order:update", order);
};

export const emitNewOrderToAdmin = (order) => {
  io?.to("admin").emit("order:new", order);
};
