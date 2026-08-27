import { Link } from "react-router-dom";

const ChatProductCard = ({ product, onNavigate }) => {
  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  return (
    <Link
      to={`/product/${product.slug}`}
      onClick={onNavigate}
      className="shrink-0 w-32 bg-white rounded-xl border border-ink/8 overflow-hidden hover:border-trail-400 transition-colors"
    >
      <div className="aspect-square bg-paper-dark">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-2">
        <p className="text-[11px] font-semibold line-clamp-2 leading-snug text-ink">{product.name}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xs font-bold tnum">₹{product.price.toLocaleString("en-IN")}</span>
          {discount > 0 && <span className="text-[9px] text-rose font-bold">{discount}% off</span>}
        </div>
        {!product.inStock && <span className="text-[9px] text-rose font-semibold">Out of stock</span>}
      </div>
    </Link>
  );
};

export default ChatProductCard;
