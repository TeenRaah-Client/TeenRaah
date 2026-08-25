import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import Button from "../ui/Button";

const CartDrawer = () => {
  const { isOpen, closeCart, items, subtotal, updateItem, removeItem } = useCart();

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
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-paper z-[60] flex flex-col shadow-lift"
          >
            <div className="flex items-center justify-between p-5 border-b border-ink/10">
              <h2 className="font-display text-2xl tracking-wide">YOUR BAG</h2>
              <button onClick={closeCart} aria-label="Close cart">
                <X className="w-6 h-6" />
              </button>
            </div>

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
                      <img src={item.image} alt={item.name} className="w-20 h-24 object-cover rounded-xl bg-paper-dark shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-ink line-clamp-2">{item.name}</h4>
                        {item.color && <p className="text-xs text-stone mt-0.5">Color: {item.color}</p>}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-ink/15 rounded-full">
                            <button
                              onClick={() => updateItem(item.productId, item.quantity - 1, item.color)}
                              className="p-1.5 hover:bg-ink/5 rounded-full"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs w-6 text-center tnum">{item.quantity}</span>
                            <button
                              onClick={() => updateItem(item.productId, item.quantity + 1, item.color)}
                              disabled={item.quantity >= item.stock}
                              className="p-1.5 hover:bg-ink/5 rounded-full disabled:opacity-30"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-bold text-sm tnum">₹{item.lineTotal.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.color)}
                        className="text-stone hover:text-rose self-start"
                        aria-label="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>

                <div className="p-5 border-t border-ink/10 space-y-4">
                  <div className="flex justify-between text-sm text-stone">
                    <span>Subtotal</span>
                    <span className="font-bold text-ink tnum">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-xs text-stone">Shipping & taxes calculated at checkout.</p>
                  <Link to="/checkout" onClick={closeCart}>
                    <Button variant="dark" className="w-full" size="lg">
                      Checkout
                    </Button>
                  </Link>
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
