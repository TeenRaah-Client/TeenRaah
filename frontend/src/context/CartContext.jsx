import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const applyCartResponse = (data) => {
    setItems(data.items || []);
    setSubtotal(data.subtotal || 0);
  };

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setSubtotal(0);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get("/cart");
      applyCartResponse(data);
    } catch {
      // silent — cart just stays empty if this fails
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (productId, quantity = 1, color = "") => {
    if (!isAuthenticated) {
      toast.error("Log in to add items to your cart");
      throw { requiresLogin: true };
    }
    const { data } = await api.post("/cart", { productId, quantity, color });
    applyCartResponse(data);
    toast.success("Added to cart");
    setIsOpen(true);
    return data;
  };

  const updateItem = async (productId, quantity, color = "") => {
    const { data } = await api.put(`/cart/${productId}`, { quantity, color });
    applyCartResponse(data);
    return data;
  };

  const removeItem = async (productId, color = "") => {
    const { data } = await api.delete(`/cart/${productId}`, { params: { color } });
    applyCartResponse(data);
    toast.success("Removed from cart");
    return data;
  };

  const clearCart = async () => {
    const { data } = await api.delete("/cart");
    applyCartResponse(data);
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        itemCount,
        loading,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        updateItem,
        removeItem,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
