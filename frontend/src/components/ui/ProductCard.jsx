import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Star, Plus, Clock, Heart } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";

const useCountdown = (target) => {
  const [remaining, setRemaining] = useState(() => (target ? new Date(target) - new Date() : null));

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setRemaining(new Date(target) - new Date()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target || remaining <= 0) return null;
  const d = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const h = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const m = Math.floor((remaining / (1000 * 60)) % 60);
  return { d, h, m };
};

/** props: product, isWishlisted?: known initial state (e.g. always true on the Wishlist page), onWishlistChange?: called after a successful toggle */
const ProductCard = ({ product, isWishlisted = false, onWishlistChange }) => {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const countdown = useCountdown(product.saleEndsAt);

  const discountPercent = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    try {
      await addItem(product._id, 1, product.colors?.[0] || "");
    } catch (err) {
      if (err?.requiresLogin) navigate("/login");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setWishlistBusy(true);
    const next = !wishlisted;
    try {
      if (next) {
        await api.post(`/users/wishlist/${product._id}`);
        toast.success("Added to wishlist");
      } else {
        await api.delete(`/users/wishlist/${product._id}`);
        toast.success("Removed from wishlist");
      }
      setWishlisted(next);
      onWishlistChange?.();
    } catch (err) {
      toast.error(err.message || "Could not update wishlist");
    } finally {
      setWishlistBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="group"
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-paper-dark mb-3">
          <motion.img
            src={product.images?.[0]?.url}
            alt={product.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          {discountPercent > 0 && (
            <span className="absolute top-3 left-3 bg-rose text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {discountPercent}% OFF
            </span>
          )}

          {countdown && (
            <div className="absolute bottom-3 left-3 right-3 bg-ink/85 backdrop-blur-sm text-white text-[11px] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 tnum">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span>
                {countdown.d}d {countdown.h}h {countdown.m}m left
              </span>
            </div>
          )}

          <motion.button
            onClick={handleToggleWishlist}
            disabled={wishlistBusy}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center shadow-sm disabled:opacity-60"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-4 h-4 transition-colors ${wishlisted ? "fill-rose text-rose" : "text-ink/60"}`} />
          </motion.button>

          <motion.button
            onClick={handleQuickAdd}
            disabled={adding}
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.08 }}
            className="absolute bottom-3 right-3 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity bg-white text-ink rounded-full w-9 h-9 flex items-center justify-center shadow-lift disabled:opacity-60"
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="flex items-center gap-1 text-xs text-stone mb-1">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>{product.ratingsAverage?.toFixed(1) || "4.5"}</span>
        </div>
        <h3 className="font-body font-semibold text-ink text-sm leading-snug mb-1 line-clamp-2">{product.name}</h3>
        <div className="flex items-baseline gap-2 tnum">
          <span className="font-bold text-ink">₹{product.price?.toLocaleString("en-IN")}</span>
          {product.mrp > product.price && (
            <span className="text-xs text-stone line-through">₹{product.mrp?.toLocaleString("en-IN")}</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
