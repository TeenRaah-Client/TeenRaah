import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  RotateCcw,
  ArrowLeftRight,
  Share2,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import Button from "../components/ui/Button";
import { PageLoader } from "../components/ui/Loader";
import ProductReviews from "../components/product/ProductReviews";
import RelatedProducts from "../components/product/RelatedProducts";
import BagFitGuide from "../components/product/BagFitGuide";
import PincodeChecker from "../components/product/PincodeChecker";
import RecentlyViewed from "../components/home/RecentlyViewed";
import NotFound from "./NotFound";
import toast from "react-hot-toast";
import { addCompareProduct, readCompareList, writeCompareList, COMPARE_EVENT } from "../utils/compareList";
import { getColorSwatch, optimizeImageUrl, recordRecentlyViewed } from "../utils/storefront";

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef(null);

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
        recordRecentlyViewed(window.localStorage, data.product);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo({ top: 0 });
  }, [slug]);

  useEffect(() => {
    if (!lightboxOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxOpen]);

  if (loading) return <PageLoader />;
  if (notFound || !product) return <NotFound />;

  const media = [
    ...(product.images || []).map((m) => ({ ...m, type: "image" })),
    ...(product.videos || []).map((m) => ({ ...m, type: "video" })),
  ];
  const discountPercent =
    product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const stepMedia = (delta) => {
    if (media.length <= 1) return;
    setActiveMedia((idx) => (idx + delta + media.length) % media.length);
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 40) {
      stepMedia(diff < 0 ? 1 : -1);
    }
    touchStartX.current = null;
  };

  const handleCompare = () => {
    const result = addCompareProduct(readCompareList(window.localStorage), product);
    if (result.error === "duplicate") return toast("Already in your comparison");
    if (result.error === "limit") return toast.error("Compare up to 4 products at a time");
    if (result.error) return toast.error("This product cannot be compared");
    writeCompareList(window.localStorage, result.list);
    window.dispatchEvent(new Event(COMPARE_EVENT));
    toast.success("Added to compare");
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: `${product.name} — TeenRaah`,
      text: `Check out ${product.name} on TeenRaah (₹${product.price.toLocaleString("en-IN")})`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Product link copied!");
      }
    } catch {
      // user cancelled native share
    }
  };

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
    <div className="pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-stone flex items-center gap-2 mb-6 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>/</span>
          <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-ink">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-ink font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          {/* Gallery */}
          <div className="md:sticky md:top-24 self-start">
            <div
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-paper-dark mb-4 select-none group"
            >
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
                    transition={{ duration: 0.25 }}
                    src={optimizeImageUrl(media[activeMedia]?.url, 1100)}
                    alt={product.name}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setLightboxOpen(true)}
                  />
                )}
              </AnimatePresence>

              {media.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => stepMedia(-1)}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-ink shadow-card flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepMedia(1)}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-ink shadow-card flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {media[activeMedia]?.type !== "video" && (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Zoom image"
                  className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-ink/75 text-white flex items-center justify-center backdrop-blur-sm"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}

              {media.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
                  {media.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        activeMedia === i ? "w-5 bg-white" : "w-1.5 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {media.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {media.map((m, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setActiveMedia(i)}
                    className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${
                      activeMedia === i ? "border-trail-500" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    {m.type === "video" ? (
                      <video src={m.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={optimizeImageUrl(m.url, 180)} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="text-xs font-bold tracking-widest2 uppercase text-trail-600">{product.category}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCompare}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/75 transition-colors hover:border-ink/40 hover:bg-white"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" /> Compare
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share product"
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/75 transition-colors hover:border-ink/40 hover:bg-white"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share
                </button>
              </div>
            </div>

            <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-3">{product.name}</h1>

            <div className="flex items-center gap-2 mb-5">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(product.ratingsAverage) ? "fill-amber-400 text-amber-400" : "text-paper-dark"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-stone tnum">
                {product.ratingsAverage?.toFixed(1)} ({product.ratingsCount} reviews)
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-5 tnum">
              <span className="font-display text-4xl">₹{product.price.toLocaleString("en-IN")}</span>
              {discountPercent > 0 && (
                <>
                  <span className="text-lg text-stone line-through">₹{product.mrp.toLocaleString("en-IN")}</span>
                  <span className="bg-rose/10 text-rose font-bold text-xs px-2.5 py-1 rounded-full">
                    SAVE {discountPercent}%
                  </span>
                </>
              )}
            </div>

            <p className="text-ink/75 leading-relaxed mb-6">{product.description}</p>

            {product.colors?.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold mb-3">
                  Color: <span className="font-normal text-stone">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border-2 transition-colors ${
                        selectedColor === c
                          ? "border-ink bg-ink text-white"
                          : "border-ink/15 bg-white hover:border-ink/40"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/40 shrink-0"
                        style={{ background: getColorSwatch(c) }}
                      />
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <BagFitGuide product={product} />

            <p className={`text-sm font-semibold mb-4 ${product.stock > 0 ? "text-trail-600" : "text-rose"}`}>
              {product.stock > 5
                ? `In stock (${product.stock} ready to ship)`
                : product.stock > 0
                ? `Hurry — only ${product.stock} left in stock`
                : "Currently out of stock"}
            </p>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-ink/15 rounded-full bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 hover:bg-ink/5 rounded-full"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-semibold tnum">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))}
                  className="p-3 hover:bg-ink/5 rounded-full"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <Button
                variant="dark"
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                loading={adding}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? "Out of Stock" : "Add to Bag"}
              </Button>
            </div>

            <PincodeChecker price={product.price * quantity} />

            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-ink/10">
              {[
                { icon: Truck, label: "Free shipping ₹999+" },
                { icon: RotateCcw, label: "7-day returns" },
                { icon: ShieldCheck, label: "Razorpay secure" },
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

      {/* Sticky mobile bottom CTA bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur-md border-t border-ink/10 px-4 py-3 pb-safe shadow-[0_-6px_24px_-10px_rgba(11,11,12,0.2)] flex items-center justify-between gap-4">
        <div className="tnum">
          <p className="font-display text-2xl leading-none text-ink">
            ₹{product.price.toLocaleString("en-IN")}
          </p>
          {discountPercent > 0 && (
            <p className="text-[11px] text-trail-600 font-semibold">{discountPercent}% off · Inclusive of GST</p>
          )}
        </div>
        <Button
          variant="dark"
          size="md"
          className="flex-1 max-w-[220px]"
          onClick={handleAddToCart}
          loading={adding}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? "Out of Stock" : "Add to Bag"}
        </Button>
      </div>

      {/* Fullscreen Image Lightbox */}
      <AnimatePresence>
        {lightboxOpen && media[activeMedia]?.type !== "video" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
            className="fixed inset-0 z-[80] bg-ink/95 flex items-center justify-center p-4"
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close zoom view"
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={optimizeImageUrl(media[activeMedia]?.url, 1600)}
              alt={product.name}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88dvh] max-w-full rounded-2xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ProductReviews slug={product.slug} />
      <RelatedProducts category={product.category} excludeSlug={product.slug} />
      <RecentlyViewed excludeId={product._id} />
    </div>
  );
};

export default ProductDetail;
