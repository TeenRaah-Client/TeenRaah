import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import Button from "../components/ui/Button";

const Cart = () => {
  const { items, subtotal, updateItem, removeItem, loading } = useCart();

  if (!loading && items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 rounded-full bg-paper-dark flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-stone" />
        </div>
        <h1 className="font-display text-3xl tracking-wide mb-3">YOUR BAG IS EMPTY</h1>
        <p className="text-stone mb-8">Looks like you haven't found your path yet. Let's fix that.</p>
        <Link to="/shop">
          <Button variant="dark" size="lg">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
      <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-8">YOUR BAG</h1>

      <div className="grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2 divide-y divide-ink/8">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                layout
                key={`${item.productId}-${item.color}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex gap-5 py-6"
              >
                <Link to={`/product/${item.slug}`} className="shrink-0">
                  <img src={item.image} alt={item.name} className="w-24 h-28 object-cover rounded-xl bg-paper-dark" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-4">
                    <div>
                      <Link to={`/product/${item.slug}`} className="font-semibold text-ink hover:text-trail-600">
                        {item.name}
                      </Link>
                      {item.color && <p className="text-sm text-stone mt-0.5">Color: {item.color}</p>}
                      <p className="text-sm text-stone tnum">₹{item.price.toLocaleString("en-IN")} each</p>
                    </div>
                    <button onClick={() => removeItem(item.productId, item.color)} className="text-stone hover:text-rose h-fit" aria-label="Remove">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-ink/15 rounded-full">
                      <button onClick={() => updateItem(item.productId, item.quantity - 1, item.color)} className="p-2 hover:bg-ink/5 rounded-full">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm tnum">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.productId, item.quantity + 1, item.color)}
                        disabled={item.quantity >= item.stock}
                        className="p-2 hover:bg-ink/5 rounded-full disabled:opacity-30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="font-bold tnum">₹{item.lineTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div>
          <div className="bg-white rounded-2xl p-6 shadow-card sticky top-24">
            <h2 className="font-display text-xl tracking-wide mb-5">ORDER SUMMARY</h2>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-stone">Subtotal</span>
              <span className="font-semibold tnum">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <p className="text-xs text-stone mb-5">Coupons, wallet credit & delivery fee applied at checkout.</p>
            <Link to="/checkout">
              <Button variant="dark" size="lg" className="w-full">
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
