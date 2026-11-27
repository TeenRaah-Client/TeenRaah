import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, Check, RotateCcw } from "lucide-react";
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
  "Accessories",
];

const PRICE_RANGES = [
  { id: "all", label: "Any Price", min: "", max: "" },
  { id: "under1000", label: "Under ₹1,000", min: "", max: "999" },
  { id: "1000-2000", label: "₹1,000 – ₹2,000", min: "1000", max: "2000" },
  { id: "2000-3500", label: "₹2,000 – ₹3,500", min: "2000", max: "3500" },
  { id: "over3500", label: "₹3,500+", min: "3500", max: "" },
];

const CAPACITY_OPTIONS = [
  { id: "all", label: "Any Size", min: "", max: "" },
  { id: "compact", label: "Compact (Under 20L)", min: "", max: "19" },
  { id: "everyday", label: "Everyday (20L – 30L)", min: "20", max: "30" },
  { id: "travel", label: "Travel (30L+)", min: "30", max: "" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Top Rated" },
  { value: "priceLowHigh", label: "Price: Low to High" },
  { value: "priceHighLow", label: "Price: High to Low" },
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
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const minCapacity = searchParams.get("minCapacity") || "";
  const maxCapacity = searchParams.get("maxCapacity") || "";
  const inStock = searchParams.get("inStock") === "true";
  const page = Number(searchParams.get("page") || 1);

  const activeFilterCount = [
    Boolean(category),
    Boolean(minPrice || maxPrice),
    Boolean(minCapacity || maxCapacity),
    inStock,
  ].filter(Boolean).length;

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== "" && value !== false && value !== null && value !== undefined) {
        next.set(key, String(value));
      } else {
        next.delete(key);
      }
    });
    if (!("page" in updates)) {
      next.delete("page");
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams();
    if (search) next.set("search", search);
    setSearchParams(next);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products", {
        params: {
          category: category || undefined,
          search: search || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          minCapacity: minCapacity || undefined,
          maxCapacity: maxCapacity || undefined,
          inStock: inStock ? "true" : undefined,
          sort,
          page,
          limit: 12,
        },
      });
      setProducts(data.products || []);
      setPagination(data.pagination || null);
    } catch {
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [category, search, minPrice, maxPrice, minCapacity, maxCapacity, inStock, sort, page]);

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchProducts]);

  useEffect(() => {
    if (!filtersOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [filtersOpen]);

  const currentPriceRange =
    PRICE_RANGES.find((r) => r.min === minPrice && r.max === maxPrice)?.id || "all";
  const currentCapacity =
    CAPACITY_OPTIONS.find((c) => c.min === minCapacity && c.max === maxCapacity)?.id || "all";

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl tracking-wide">
            {category || (search ? `Results for "${search}"` : "ALL PRODUCTS")}
          </h1>
          {pagination && (
            <p className="text-stone text-sm mt-1.5 tnum">
              {pagination.total} {pagination.total === 1 ? "product" : "products"}
            </p>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <label htmlFor="desktop-sort" className="text-xs font-semibold uppercase tracking-wider text-stone">
            Sort
          </label>
          <select
            id="desktop-sort"
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="text-sm border border-ink/15 rounded-full px-4 py-2 bg-white outline-none focus:border-trail-500"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick filter pill bar — works great on phones & tablets */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none">
        <button
          type="button"
          onClick={() => updateParams({ inStock: inStock ? "" : "true" })}
          className={`shrink-0 text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
            inStock ? "bg-ink text-white border-ink" : "bg-white border-ink/15 text-ink/80 hover:border-ink/40"
          }`}
        >
          In Stock Only
        </button>
        <button
          type="button"
          onClick={() =>
            updateParams(
              maxPrice === "1500" && !minPrice ? { minPrice: "", maxPrice: "" } : { minPrice: "", maxPrice: "1500" }
            )
          }
          className={`shrink-0 text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
            maxPrice === "1500" && !minPrice
              ? "bg-ink text-white border-ink"
              : "bg-white border-ink/15 text-ink/80 hover:border-ink/40"
          }`}
        >
          Under ₹1,500
        </button>
        <button
          type="button"
          onClick={() =>
            updateParams(
              minCapacity === "20" && !maxCapacity
                ? { minCapacity: "", maxCapacity: "" }
                : { minCapacity: "20", maxCapacity: "" }
            )
          }
          className={`shrink-0 text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
            minCapacity === "20" && !maxCapacity
              ? "bg-ink text-white border-ink"
              : "bg-white border-ink/15 text-ink/80 hover:border-ink/40"
          }`}
        >
          20L+ Laptop &amp; Travel
        </button>
        {(activeFilterCount > 0 || search) && (
          <button
            type="button"
            onClick={() => setSearchParams(new URLSearchParams())}
            className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-3.5 py-2 rounded-full text-rose hover:bg-rose/5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset all
          </button>
        )}
      </div>

      {/* Mobile filter & sort trigger bar */}
      <div className="flex items-center justify-between gap-3 mb-6 md:hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-2 text-sm font-semibold border border-ink/15 bg-white rounded-full px-4 py-2.5"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 w-5 h-5 rounded-full bg-trail-500 text-white text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        <select
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          aria-label="Sort products"
          className="text-sm border border-ink/15 rounded-full px-4 py-2.5 bg-white"
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
        <aside className="hidden md:block w-60 shrink-0 space-y-7">
          <div>
            <h3 className="font-semibold text-xs mb-3 tracking-widest2 uppercase text-stone">Category</h3>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => updateParams({ category: "" })}
                  className={`text-sm ${!category ? "text-trail-600 font-bold" : "text-ink/75 hover:text-ink"}`}
                >
                  All Categories
                </button>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() => updateParams({ category: c })}
                    className={`text-sm ${category === c ? "text-trail-600 font-bold" : "text-ink/75 hover:text-ink"}`}
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-5 border-t border-ink/8">
            <h3 className="font-semibold text-xs mb-3 tracking-widest2 uppercase text-stone">Price</h3>
            <ul className="space-y-2">
              {PRICE_RANGES.map((range) => (
                <li key={range.id}>
                  <button
                    type="button"
                    onClick={() => updateParams({ minPrice: range.min, maxPrice: range.max })}
                    className={`text-sm ${
                      currentPriceRange === range.id ? "text-trail-600 font-bold" : "text-ink/75 hover:text-ink"
                    }`}
                  >
                    {range.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-5 border-t border-ink/8">
            <h3 className="font-semibold text-xs mb-3 tracking-widest2 uppercase text-stone">Capacity</h3>
            <ul className="space-y-2">
              {CAPACITY_OPTIONS.map((cap) => (
                <li key={cap.id}>
                  <button
                    type="button"
                    onClick={() => updateParams({ minCapacity: cap.min, maxCapacity: cap.max })}
                    className={`text-sm ${
                      currentCapacity === cap.id ? "text-trail-600 font-bold" : "text-ink/75 hover:text-ink"
                    }`}
                  >
                    {cap.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-5 border-t border-ink/8">
            <label className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => updateParams({ inStock: e.target.checked ? "true" : "" })}
                className="w-4 h-4 rounded accent-trail-500"
              />
              <span className="font-medium text-ink">In stock only</span>
            </label>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-ink/15 px-6">
              <p className="font-display text-2xl tracking-wide mb-2">NO MATCHING GEAR</p>
              <p className="text-stone text-sm mb-5">
                Try clearing a price or capacity filter to see more from the collection.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-2 rounded-full bg-ink text-white px-6 py-2.5 text-sm font-semibold hover:bg-ink-800"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}

          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center flex-wrap gap-2 mt-10">
              {Array.from({ length: pagination.pages }).map((_, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => updateParams({ page: String(i + 1) })}
                  className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
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

      {/* Mobile filter bottom sheet */}
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
              className="fixed bottom-0 left-0 right-0 bg-paper rounded-t-3xl z-50 md:hidden max-h-[85dvh] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-ink/10 shrink-0">
                <span className="font-display text-xl">FILTERS</span>
                <div className="flex items-center gap-3">
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="text-xs font-semibold text-rose"
                    >
                      Reset
                    </button>
                  )}
                  <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-6">
                <div>
                  <h3 className="font-semibold text-xs mb-3 uppercase tracking-wider text-stone">Category</h3>
                  <div className="flex flex-wrap gap-2">
                    {["", ...CATEGORIES].map((c) => (
                      <button
                        type="button"
                        key={c || "all"}
                        onClick={() => updateParams({ category: c })}
                        className={`text-xs font-semibold px-3.5 py-2 rounded-full border ${
                          category === c ? "bg-ink text-white border-ink" : "bg-white border-ink/15"
                        }`}
                      >
                        {c || "All"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-xs mb-3 uppercase tracking-wider text-stone">Price</h3>
                  <div className="flex flex-wrap gap-2">
                    {PRICE_RANGES.map((range) => (
                      <button
                        type="button"
                        key={range.id}
                        onClick={() => updateParams({ minPrice: range.min, maxPrice: range.max })}
                        className={`text-xs font-semibold px-3.5 py-2 rounded-full border ${
                          currentPriceRange === range.id ? "bg-ink text-white border-ink" : "bg-white border-ink/15"
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-xs mb-3 uppercase tracking-wider text-stone">Capacity</h3>
                  <div className="flex flex-wrap gap-2">
                    {CAPACITY_OPTIONS.map((cap) => (
                      <button
                        type="button"
                        key={cap.id}
                        onClick={() => updateParams({ minCapacity: cap.min, maxCapacity: cap.max })}
                        className={`text-xs font-semibold px-3.5 py-2 rounded-full border ${
                          currentCapacity === cap.id ? "bg-ink text-white border-ink" : "bg-white border-ink/15"
                        }`}
                      >
                        {cap.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => updateParams({ inStock: inStock ? "" : "true" })}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-sm font-semibold ${
                      inStock ? "bg-trail-50 border-trail-500 text-trail-800" : "bg-white border-ink/12 text-ink"
                    }`}
                  >
                    <span>Show in-stock items only</span>
                    {inStock && <Check className="w-4 h-4 text-trail-600" />}
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-ink/10 bg-paper pb-safe shrink-0">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="w-full py-3.5 rounded-full bg-ink text-white text-sm font-bold"
                >
                  Show {pagination ? `${pagination.total} ` : ""}Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shop;
