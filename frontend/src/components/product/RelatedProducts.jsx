import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../api/axios";
import ProductCard from "../ui/ProductCard";
import { ProductCardSkeleton } from "../ui/Loader";

/** props: category, excludeSlug */
const RelatedProducts = ({ category, excludeSlug }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/products", { params: { category, limit: 5 } });
        setProducts(data.products.filter((p) => p.slug !== excludeSlug).slice(0, 4));
      } finally {
        setLoading(false);
      }
    };
    fetchRelated();
  }, [category, excludeSlug]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-14 border-t border-ink/8">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-display text-3xl tracking-wide mb-8"
      >
        YOU MAY ALSO LIKE
      </motion.h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>
    </section>
  );
};

export default RelatedProducts;
