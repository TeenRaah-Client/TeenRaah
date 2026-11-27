import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Check } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { optimizeImageUrl } from "../../utils/storefront";

const ChatProductCard = ({ product, onNavigate }) => {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product._id || !product.inStock) return;
    setAdding(true);
    try {
      await addItem(product._id, 1, product.colors?.[0] || "");
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch (err) {
      if (err?.requiresLogin) {
        onNavigate?.();
        navigate("/login");
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="shrink-0 w-36 bg-white rounded-xl border border-ink/8 overflow-hidden hover:border-trail-400 transition-colors flex flex-col">
      <Link to={`/product/${product.slug}`} onClick={onNavigate} className="block flex-1">
        <div className="aspect-square bg-paper-dark">
          <img
            src={optimizeImageUrl(product.image, 260)}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-2 pb-1">
          <p className="text-[11px] font-semibold line-clamp-2 leading-snug text-ink">{product.name}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs font-bold tnum">₹{Number(product.price).toLocaleString("en-IN")}</span>
            {discount > 0 && <span className="text-[9px] text-rose font-bold">{discount}% off</span>}
          </div>
          {!product.inStock && <span className="text-[9px] text-rose font-semibold">Out of stock</span>}
        </div>
      </Link>
      {product._id && product.inStock && (
        <div className="px-2 pb-2 pt-1">
          <button
            type="button"
            disabled={adding}
            onClick={handleQuickAdd}
            className="w-full inline-flex items-center justify-center gap-1 rounded-full bg-ink text-white py-1 text-[10px] font-semibold hover:bg-ink-800 disabled:opacity-50"
          >
            {added ? (
              <>
                <Check className="w-3 h-3 text-amber-400" /> Added
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" /> {adding ? "Adding…" : "Add to Bag"}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatProductCard;
