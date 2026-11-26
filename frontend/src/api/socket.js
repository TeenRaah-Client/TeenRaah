import { io } from "socket.io-client";

let socket = null;

const resolveSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase && /^https?:\/\//i.test(apiBase)) {
    try {
      return new URL(apiBase).origin;
    } catch {
      // fall through
    }
  }

  if (import.meta.env.PROD && typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:5000";
};

/** Lazily creates a single shared socket connection (cookie-authenticated). */
export const getSocket = () => {
  if (!socket) {
    socket = io(resolveSocketUrl(), {
      withCredentials: true,
      autoConnect: true,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
