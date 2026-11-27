import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "../ui/ProductCard";
import { readRecentlyViewed } from "../../utils/storefront";

const RecentlyViewed = ({ excludeId }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const stored = readRecentlyViewed(window.localStorage).filter(
      (p) => !excludeId || String(p._id) !== String(excludeId)
    );
    setItems(stored.slice(0, 4));
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16 border-t border-ink/8">
      <div className="mb-7">
        <p className="text-xs font-semibold tracking-[0.18em] text-trail-600 uppercase mb-1">
          PICK UP WHERE YOU LEFT OFF
        </p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl md:text-4xl tracking-wide"
        >
          RECENTLY VIEWED
        </motion.h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none md:grid md:grid-cols-4 md:gap-6 md:overflow-visible">
        {items.map((product) => (
          <div key={product._id} className="w-[68%] sm:w-[44%] md:w-auto shrink-0 snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
