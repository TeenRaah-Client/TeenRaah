import { useEffect } from "react";
import { getSocket } from "../api/socket";

/** Fires `onUpdate(order)` whenever the server pushes a status change for this order. */
export const useOrderTrackingSocket = (orderId, onUpdate) => {
  useEffect(() => {
    if (!orderId) return;
    const socket = getSocket();

    const handler = (order) => {
      if (order._id === orderId) onUpdate(order);
    };

    socket.on("order:update", handler);
    return () => socket.off("order:update", handler);
  }, [orderId, onUpdate]);
};

/** Admin dashboard variant — fires whenever ANY new order comes in. */
export const useAdminNewOrderSocket = (onNewOrder) => {
  useEffect(() => {
    const socket = getSocket();
    socket.on("order:new", onNewOrder);
    return () => socket.off("order:new", onNewOrder);
  }, [onNewOrder]);
};
