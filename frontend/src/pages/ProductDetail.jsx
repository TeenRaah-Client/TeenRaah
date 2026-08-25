import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Minus, Plus, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import Button from "../components/ui/Button";
import { PageLoader } from "../components/ui/Loader";
import NotFound from "./NotFound";

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeMedia, setActiveMedia] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const { data } = await api.get(`/products/${slug}`);
        setProduct(data.product);
        setSelectedColor(data.product.colors?.[0] || "");
        setActiveMedia(0);
        setQuantity(1);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo({ top: 0 });
  }, [slug]);

  if (loading) return <PageLoader />;
  if (notFound || !product) return <NotFound />;

  const media = [...product.images.map((m) => ({ ...m, type: "image" })), ...product.videos.map((m) => ({ ...m, type: "video" }))];
  const discountPercent = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addItem(product._id, quantity, selectedColor);
    } catch (err) {
      if (err?.requiresLogin) navigate("/login");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-14">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16">
        {/* Gallery */}
        <div>
          <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-paper-dark mb-4">
            <AnimatePresence mode="wait">
              {media[activeMedia]?.type === "video" ? (
                <motion.video
                  key={activeMedia}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={media[activeMedia].url}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <motion.img
                  key={activeMedia}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={media[activeMedia]?.url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </AnimatePresence>
          </div>
          {media.length > 1 && (
            <div className="flex gap-3 overflow-x-auto">
              {media.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setActiveMedia(i)}
                  className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                    activeMedia === i ? "border-trail-500" : "border-transparent"
                  }`}
                >
                  {m.type === "video" ? (
                    <video src={m.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-xs font-bold tracking-widest2 uppercase text-trail-600 mb-2">{product.category}</p>
          <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-3">{product.name}</h1>

          <div className="flex items-center gap-2 mb-5">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(product.ratingsAverage) ? "fill-amber-400 text-amber-400" : "text-paper-dark"}`} />
              ))}
            </div>
            <span className="text-sm text-stone">
              {product.ratingsAverage?.toFixed(1)} ({product.ratingsCount} reviews)
            </span>
          </div>

          <div className="flex items-baseline gap-3 mb-6 tnum">
            <span className="font-display text-4xl">₹{product.price.toLocaleString("en-IN")}</span>
            {discountPercent > 0 && (
              <>
                <span className="text-lg text-stone line-through">₹{product.mrp.toLocaleString("en-IN")}</span>
                <span className="text-rose font-bold text-sm">{discountPercent}% OFF</span>
              </>
            )}
          </div>

          <p className="text-ink/70 leading-relaxed mb-6">{product.description}</p>

          {product.colors?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold mb-3">Color: <span className="font-normal text-stone">{selectedColor}</span></p>
              <div className="flex gap-2.5">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-4 py-2 rounded-full text-sm border-2 transition-colors ${
                      selectedColor === c ? "border-ink bg-ink text-white" : "border-ink/15 hover:border-ink/40"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-3 text-sm text-stone">
            {product.material && <p>Material: {product.material}</p>}
            {product.capacityLitres && <p>Capacity: {product.capacityLitres}L</p>}
            <p className={product.stock > 0 ? "text-trail-600" : "text-rose"}>
              {product.stock > 0 ? `In stock (${product.stock} left)` : "Out of stock"}
            </p>
          </div>

          <div className="flex items-center gap-4 my-6">
            <div className="flex items-center border border-ink/15 rounded-full">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-3 hover:bg-ink/5 rounded-full" aria-label="Decrease">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center tnum">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="p-3 hover:bg-ink/5 rounded-full"
                aria-label="Increase"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <Button variant="dark" size="lg" className="flex-1" onClick={handleAddToCart} loading={adding} disabled={product.stock === 0}>
              {product.stock === 0 ? "Out of Stock" : "Add to Bag"}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-ink/10">
            {[
              { icon: Truck, label: "Free shipping ₹999+" },
              { icon: RotateCcw, label: "7-day returns" },
              { icon: ShieldCheck, label: "Secure checkout" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center text-center gap-2">
                <Icon className="w-5 h-5 text-trail-600" strokeWidth={1.6} />
                <span className="text-[11px] text-stone leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
