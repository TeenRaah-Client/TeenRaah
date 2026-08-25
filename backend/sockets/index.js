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
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || "*").split(",");

  io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
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
