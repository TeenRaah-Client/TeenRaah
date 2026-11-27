import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Star, Plus, Clock, Heart, ArrowLeftRight } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { addCompareProduct, readCompareList, writeCompareList, COMPARE_EVENT } from "../../utils/compareList";
import { getColorSwatch, optimizeImageUrl } from "../../utils/storefront";

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

const ProductCard = ({ product, isWishlisted = false, onWishlistChange }) => {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");
  const countdown = useCountdown(product.saleEndsAt);

  useEffect(() => {
    setWishlisted(isWishlisted);
  }, [isWishlisted]);

  const discountPercent =
    product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const primaryImage = optimizeImageUrl(product.images?.[0]?.url, 600);
  const secondaryImage = product.images?.[1]?.url ? optimizeImageUrl(product.images[1].url, 600) : null;
  const isOutOfStock = Number(product.stock) <= 0;

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    setAdding(true);
    try {
      await addItem(product._id, 1, selectedColor || product.colors?.[0] || "");
    } catch (err) {
      if (err?.requiresLogin) navigate("/login");
    } finally {
      setAdding(false);
    }
  };

  const handleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const current = readCompareList(window.localStorage);
    const result = addCompareProduct(current, product);
    if (result.error === "duplicate") {
      toast("Already in your comparison");
      return;
    }
    if (result.error === "limit") {
      toast.error("Compare up to 4 products at a time");
      return;
    }
    if (result.error) {
      toast.error("This product cannot be compared");
      return;
    }
    writeCompareList(window.localStorage, result.list);
    window.dispatchEvent(new Event(COMPARE_EVENT));
    toast.success("Added to compare");
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
    setWishlisted(next);
    try {
      if (next) {
        await api.post(`/users/wishlist/${product._id}`);
        toast.success("Added to wishlist");
      } else {
        await api.delete(`/users/wishlist/${product._id}`);
        toast.success("Removed from wishlist");
      }
      onWishlistChange?.();
    } catch (err) {
      setWishlisted(!next);
      toast.error(err.message || "Could not update wishlist");
    } finally {
      setWishlistBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group"
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-paper-dark mb-3">
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover transition-all duration-500 ${
              secondaryImage ? "group-hover:opacity-0" : "group-hover:scale-105"
            } ${isOutOfStock ? "opacity-65 grayscale-[25%]" : ""}`}
          />
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${product.name} alternate view`}
              loading="lazy"
              decoding="async"
              className="hidden md:block absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            />
          )}

          {isOutOfStock ? (
            <span className="absolute top-3 left-3 bg-ink/85 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
              Out of Stock
            </span>
          ) : discountPercent > 0 ? (
            <span className="absolute top-3 left-3 bg-rose text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
              {discountPercent}% OFF
            </span>
          ) : null}

          {countdown && !isOutOfStock && (
            <div className="absolute bottom-3 left-3 right-14 bg-ink/85 backdrop-blur-sm text-white text-[11px] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 tnum">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">
                {countdown.d}d {countdown.h}h {countdown.m}m left
              </span>
            </div>
          )}

          <motion.button
            type="button"
            onClick={handleToggleWishlist}
            disabled={wishlistBusy}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-2.5 right-2.5 bg-white/92 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center shadow-sm disabled:opacity-60"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-4 h-4 transition-colors ${wishlisted ? "fill-rose text-rose" : "text-ink/70"}`} />
          </motion.button>

          <motion.button
            type="button"
            onClick={handleCompare}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-2.5 right-[52px] bg-white/92 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center shadow-sm"
            aria-label={`Compare ${product.name}`}
            title="Add to compare"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-ink/70" />
          </motion.button>

          {!isOutOfStock && (
            <motion.button
              type="button"
              onClick={handleQuickAdd}
              disabled={adding}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="absolute bottom-3 right-3 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity bg-white text-ink rounded-full w-10 h-10 flex items-center justify-center shadow-lift disabled:opacity-60"
              aria-label={`Quick add ${product.name} to bag`}
              title="Quick add to bag"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-stone mb-1">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="tnum">{product.ratingsAverage?.toFixed(1) || "4.5"}</span>
          </span>
          {product.capacityLitres ? (
            <span className="text-[11px] font-medium text-stone tnum">{product.capacityLitres}L</span>
          ) : null}
        </div>

        <h3 className="font-body font-semibold text-ink text-sm leading-snug mb-1 line-clamp-2 group-hover:text-trail-700 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2 tnum">
          <span className="font-bold text-ink">₹{product.price?.toLocaleString("en-IN")}</span>
          {product.mrp > product.price && (
            <span className="text-xs text-stone line-through">₹{product.mrp?.toLocaleString("en-IN")}</span>
          )}
        </div>

        {product.colors?.length > 1 && (
          <div className="flex items-center gap-1.5 mt-2" aria-label="Available colors">
            {product.colors.slice(0, 4).map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                aria-label={`Select color ${color}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedColor(color);
                }}
                style={{ background: getColorSwatch(color) }}
                className={`w-4 h-4 rounded-full border transition-transform ${
                  selectedColor === color ? "ring-2 ring-offset-1 ring-ink border-white scale-110" : "border-ink/20"
                }`}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-[10px] text-stone font-medium">+{product.colors.length - 4}</span>
            )}
          </div>
        )}
      </Link>
    </motion.div>
  );
};

export default ProductCard;
