import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import api from "../api/axios";
import ProductCard from "../components/ui/ProductCard";
import { ProductCardSkeleton } from "../components/ui/Loader";

const CATEGORIES = [
  "Backpacks",
  "Handbags",
  "Sling Bags",
  "Tote Bags",
  "Office Bags",
  "Travel & Luggage",
  "Duffle Bags",
  "Wallets",
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "priceLowHigh", label: "Price: Low to High" },
  { value: "priceHighLow", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = Number(searchParams.get("page") || 1);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products", {
        params: { category: category || undefined, search: search || undefined, sort, page, limit: 12 },
      });
      setProducts(data.products);
      setPagination(data.pagination);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, page]);

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchProducts]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl tracking-wide">
          {category || (search ? `Results for "${search}"` : "ALL PRODUCTS")}
        </h1>
        {pagination && <p className="text-stone text-sm mt-2">{pagination.total} products</p>}
      </div>

      <div className="flex items-center justify-between mb-6 md:hidden">
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-2 text-sm font-semibold border border-ink/15 rounded-full px-4 py-2"
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
        <select
          value={sort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="text-sm border border-ink/15 rounded-full px-4 py-2 bg-white"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-10">
        {/* Desktop sidebar filters */}
        <aside className="hidden md:block w-56 shrink-0">
          <h3 className="font-semibold text-sm mb-4 tracking-wide uppercase text-stone">Category</h3>
          <ul className="space-y-2 mb-8">
            <li>
              <button
                onClick={() => updateParam("category", "")}
                className={`text-sm ${!category ? "text-trail-600 font-semibold" : "text-ink/70 hover:text-ink"}`}
              >
                All Categories
              </button>
            </li>
            {CATEGORIES.map((c) => (
              <li key={c}>
                <button
                  onClick={() => updateParam("category", c)}
                  className={`text-sm ${category === c ? "text-trail-600 font-semibold" : "text-ink/70 hover:text-ink"}`}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>

          <h3 className="font-semibold text-sm mb-4 tracking-wide uppercase text-stone">Sort By</h3>
          <ul className="space-y-2">
            {SORT_OPTIONS.map((o) => (
              <li key={o.value}>
                <button
                  onClick={() => updateParam("sort", o.value)}
                  className={`text-sm ${sort === o.value ? "text-trail-600 font-semibold" : "text-ink/70 hover:text-ink"}`}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-stone">No products found. Try a different filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}

          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: pagination.pages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => updateParam("page", String(i + 1))}
                  className={`w-9 h-9 rounded-full text-sm font-medium ${
                    page === i + 1 ? "bg-ink text-white" : "border border-ink/15 hover:bg-ink/5"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
              className="fixed inset-0 bg-ink/50 z-50 md:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-paper rounded-t-3xl z-50 md:hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-ink/10">
                <span className="font-display text-xl">FILTERS</span>
                <button onClick={() => setFiltersOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-sm mb-3 uppercase text-stone">Category</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["", ...CATEGORIES].map((c) => (
                    <button
                      key={c || "all"}
                      onClick={() => {
                        updateParam("category", c);
                        setFiltersOpen(false);
                      }}
                      className={`text-sm px-4 py-2 rounded-full border ${
                        category === c ? "bg-ink text-white border-ink" : "border-ink/15"
                      }`}
                    >
                      {c || "All"}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shop;
