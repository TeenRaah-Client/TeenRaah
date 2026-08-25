import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import ProductCard from "../ui/ProductCard";
import { ProductCardSkeleton } from "../ui/Loader";

const FeaturedProducts = ({ title = "BESTSELLERS", subtitle = "Loved by thousands, restocked often", featured = true }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await api.get("/products", { params: { featured: featured || undefined, limit: 8, sort: "newest" } });
        setProducts(data.products);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, [featured]);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-20">
      <div className="flex items-end justify-between mb-8">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl tracking-wide"
          >
            {title}
          </motion.h2>
          <p className="text-stone text-sm mt-1">{subtitle}</p>
        </div>
        <div className="hidden md:flex gap-2">
          <button onClick={() => scroll(-1)} className="w-10 h-10 rounded-full border border-ink/15 flex items-center justify-center hover:bg-ink/5" aria-label="Scroll left">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll(1)} className="w-10 h-10 rounded-full border border-ink/15 flex items-center justify-center hover:bg-ink/5" aria-label="Scroll right">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[70%] sm:w-[45%] md:w-[23%] shrink-0 snap-start">
                <ProductCardSkeleton />
              </div>
            ))
          : products.map((p) => (
              <div key={p._id} className="w-[70%] sm:w-[45%] md:w-[23%] shrink-0 snap-start">
                <ProductCard product={p} />
              </div>
            ))}
      </div>

      <div className="text-center mt-10">
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-trail-600 hover:text-trail-700 border-b-2 border-trail-500 pb-0.5">
          View All Products
        </Link>
      </div>
    </section>
  );
};

export default FeaturedProducts;
