import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { X, Minus, Plus, ShoppingBag, Truck, CheckCircle2 } from "lucide-react";
import { useCart } from "../../context/CartContext";
import Button from "../ui/Button";
import api from "../../api/axios";
import { getFreeShippingProgress, optimizeImageUrl } from "../../utils/storefront";

const CartDrawer = () => {
  const { isOpen, closeCart, items, subtotal, updateItem, removeItem, addItem } = useCart();
  const [upsells, setUpsells] = useState([]);
  const [addingUpsellId, setAddingUpsellId] = useState(null);

  const shippingProgress = getFreeShippingProgress(subtotal);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, closeCart]);

  // Fetch affordable add-ons when cart is open and shopper is close to free shipping
  useEffect(() => {
    if (!isOpen || items.length === 0 || shippingProgress.unlocked) {
      setUpsells([]);
      return;
    }
    let active = true;
    api
      .get("/products", { params: { maxPrice: 1200, inStock: "true", sort: "priceLowHigh", limit: 6 } })
      .then(({ data }) => {
        if (!active) return;
        const inCartIds = new Set(items.map((i) => String(i.productId)));
        const suggestions = (data.products || []).filter((p) => !inCartIds.has(String(p._id))).slice(0, 2);
        setUpsells(suggestions);
      })
      .catch(() => {
        if (active) setUpsells([]);
      });
    return () => {
      active = false;
    };
  }, [isOpen, items, shippingProgress.unlocked]);

  const handleQuickUpsell = async (product) => {
    setAddingUpsellId(product._id);
    try {
      await addItem(product._id, 1, product.colors?.[0] || "");
    } finally {
      setAddingUpsellId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-ink/50 z-[60]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            className="fixed top-0 right-0 h-dvh-safe w-full max-w-md bg-paper z-[60] flex flex-col shadow-lift"
          >
            <div className="flex items-center justify-between p-5 border-b border-ink/10 shrink-0">
              <div className="flex items-baseline gap-2">
                <h2 className="font-display text-2xl tracking-wide">YOUR BAG</h2>
                {items.length > 0 && (
                  <span className="text-xs font-semibold text-stone">
                    ({items.reduce((acc, i) => acc + i.quantity, 0)} items)
                  </span>
                )}
              </div>
              <button type="button" onClick={closeCart} className="p-2 -mr-2" aria-label="Close cart">
                <X className="w-6 h-6" />
              </button>
            </div>

            {items.length > 0 && (
              <div className="px-5 py-3 bg-white border-b border-ink/8 shrink-0">
                <div className="flex items-center gap-2 text-xs font-medium mb-2">
                  {shippingProgress.unlocked ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-trail-600 shrink-0" />
                      <span className="text-trail-700 font-semibold">
                        You've unlocked FREE shipping!
                      </span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-ink/80">
                        Add <strong className="text-ink tnum">₹{shippingProgress.remaining.toLocaleString("en-IN")}</strong> more for{" "}
                        <strong className="text-trail-600">FREE shipping</strong>
                      </span>
                    </>
                  )}
                </div>
                <div className="h-1.5 w-full rounded-full bg-paper-dark overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${shippingProgress.percent}%` }}
                    transition={{ duration: 0.35 }}
                    className={`h-full rounded-full ${shippingProgress.unlocked ? "bg-trail-500" : "bg-amber-400"}`}
                  />
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-topo-light bg-paper-dark flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-stone" />
                </div>
                <p className="text-stone text-sm">Your bag is empty. Let's find something for your path.</p>
                <Link to="/shop" onClick={closeCart}>
                  <Button variant="outline" size="sm">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 divide-y divide-ink/8">
                  {items.map((item) => (
                    <motion.div
                      layout
                      key={`${item.productId}-${item.color}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-4 py-5"
                    >
                      <Link to={`/product/${item.slug}`} onClick={closeCart} className="shrink-0">
                        <img
                          src={optimizeImageUrl(item.image, 200)}
                          alt={item.name}
                          className="w-20 h-24 object-cover rounded-xl bg-paper-dark"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${item.slug}`} onClick={closeCart}>
                          <h4 className="font-semibold text-sm text-ink line-clamp-2 hover:text-trail-600 transition-colors">
                            {item.name}
                          </h4>
                        </Link>
                        {item.color && <p className="text-xs text-stone mt-0.5">Color: {item.color}</p>}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-ink/15 rounded-full">
                            <button
                              type="button"
                              onClick={() => updateItem(item.productId, item.quantity - 1, item.color)}
                              className="p-2 hover:bg-ink/5 rounded-full"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs w-6 text-center tnum">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateItem(item.productId, item.quantity + 1, item.color)}
                              disabled={item.quantity >= item.stock}
                              className="p-2 hover:bg-ink/5 rounded-full disabled:opacity-30"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-bold text-sm tnum">₹{item.lineTotal.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.color)}
                        className="text-stone hover:text-rose self-start p-1"
                        aria-label="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}

                  {upsells.length > 0 && (
                    <div className="py-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-stone mb-3">
                        Pair with your bag
                      </p>
                      <div className="space-y-2.5">
                        {upsells.map((p) => (
                          <div
                            key={p._id}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-ink/8"
                          >
                            <img
                              src={optimizeImageUrl(p.images?.[0]?.url, 140)}
                              alt={p.name}
                              className="w-12 h-14 rounded-lg object-cover bg-paper-dark shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-ink line-clamp-1">{p.name}</p>
                              <p className="text-xs font-bold text-trail-700 tnum">
                                ₹{Number(p.price).toLocaleString("en-IN")}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={addingUpsellId === p._id}
                              onClick={() => handleQuickUpsell(p)}
                              className="px-3 py-1.5 rounded-full bg-ink text-white text-[11px] font-semibold hover:bg-ink-800 disabled:opacity-40 shrink-0"
                            >
                              {addingUpsellId === p._id ? "Adding…" : "+ Add"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 border-t border-ink/10 space-y-3 bg-paper pb-safe shrink-0">
                  <div className="flex justify-between text-sm text-stone">
                    <span>Subtotal</span>
                    <span className="font-bold text-ink text-base tnum">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-xs text-stone">Coupons, wallet credits &amp; taxes applied at checkout.</p>
                  <div className="flex gap-2.5">
                    <Link to="/cart" onClick={closeCart} className="shrink-0">
                      <Button variant="outline" size="md">
                        View Bag
                      </Button>
                    </Link>
                    <Link to="/checkout" onClick={closeCart} className="flex-1">
                      <Button variant="dark" className="w-full" size="md">
                        Checkout
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
