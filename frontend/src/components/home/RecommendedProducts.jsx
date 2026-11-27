import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../api/axios";
import ProductCard from "../ui/ProductCard";
import { ProductCardSkeleton } from "../ui/Loader";
import { dedupeProducts } from "../../utils/storefront";

export default function RecommendedProducts({ excludeIds = [] }) {
  const [products, setProducts] = useState([]);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const excludeKey = excludeIds.join(",");

  useEffect(() => {
    let active = true;
    api
      .get("/products/recommendations")
      .then(({ data }) => {
        if (!active) return;
        const raw = Array.isArray(data.products) ? data.products : [];
        const unique = dedupeProducts(raw, excludeIds);
        setProducts((unique.length > 0 ? unique : raw).slice(0, 4));
        setPersonalized(Boolean(data.personalized));
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excludeKey]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-20">
      <div className="mb-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-2 text-xs font-semibold tracking-[0.18em] text-trail-600"
        >
          {personalized ? "SELECTED AROUND YOUR TASTE" : "DISCOVER MORE"}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl tracking-wide md:text-4xl"
        >
          {personalized ? "PICKED FOR YOU" : "POPULAR PICKS"}
        </motion.h2>
        <p className="mt-1 text-sm text-stone">
          {personalized
            ? "Suggestions informed by your wishlist and recent purchases."
            : "A considered selection from the TeenRaah collection."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4 md:gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <ProductCardSkeleton key={index} />)
          : products.map((product) => <ProductCard key={product._id} product={product} />)}
      </div>
    </section>
  );
}
