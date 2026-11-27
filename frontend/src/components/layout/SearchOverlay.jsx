import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Clock, ArrowUpRight, Loader2 } from "lucide-react";
import api from "../../api/axios";
import {
  optimizeImageUrl,
  readRecentSearches,
  recordRecentSearch,
} from "../../utils/storefront";

const QUICK_CATEGORIES = [
  "Backpacks",
  "Office Bags",
  "Travel & Luggage",
  "Sling Bags",
  "Tote Bags",
  "Wallets",
];

const SearchOverlay = ({ open, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => readRecentSearches(window.localStorage));

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get("/products/suggestions", { params: { q: trimmed } });
        if (!cancelled) {
          setResults(Array.isArray(data.products) ? data.products : []);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  const executeSearch = (term) => {
    const clean = term.trim();
    if (!clean) return;
    setRecentSearches(recordRecentSearch(window.localStorage, clean));
    navigate(`/shop?search=${encodeURIComponent(clean)}`);
    setQuery("");
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeSearch(query);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/55 backdrop-blur-sm z-[65]"
          />
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="Search TeenRaah catalog"
            className="fixed top-0 left-0 right-0 z-[66] bg-paper shadow-lift border-b border-ink/10 max-h-[88dvh] flex flex-col"
          >
            <form onSubmit={handleSubmit} className="max-w-4xl w-full mx-auto px-4 md:px-6 py-4 flex items-center gap-3 border-b border-ink/10">
              <Search className="w-5 h-5 text-stone shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search backpacks, 15.6 laptop bags, cabin luggage, wallets…"
                className="flex-1 bg-transparent outline-none text-base text-ink placeholder:text-stone"
              />
              {loading && <Loader2 className="w-4 h-4 animate-spin text-trail-600 shrink-0" />}
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-1.5 text-stone hover:text-ink rounded-full"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold uppercase tracking-wider text-stone hover:text-ink px-2 py-1"
              >
                Close
              </button>
            </form>

            <div className="max-w-4xl w-full mx-auto px-4 md:px-6 py-5 overflow-y-auto flex-1 space-y-6">
              {query.trim().length >= 2 ? (
                results.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone">Matching gear</p>
                      <button
                        type="button"
                        onClick={() => executeSearch(query)}
                        className="text-xs font-semibold text-trail-600 hover:text-trail-700"
                      >
                        View all results →
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {results.map((item) => (
                        <Link
                          key={item._id}
                          to={`/product/${item.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-ink/8 hover:border-trail-400 transition-colors"
                        >
                          <img
                            src={optimizeImageUrl(item.images?.[0]?.url, 180)}
                            alt={item.name}
                            className="w-14 h-16 rounded-xl object-cover bg-paper-dark shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-trail-600">
                              {item.category}
                            </p>
                            <p className="text-sm font-semibold text-ink line-clamp-1">{item.name}</p>
                            <div className="flex items-baseline gap-2 mt-0.5 tnum">
                              <span className="text-sm font-bold text-ink">
                                ₹{Number(item.price).toLocaleString("en-IN")}
                              </span>
                              {item.mrp > item.price && (
                                <span className="text-xs text-stone line-through">
                                  ₹{Number(item.mrp).toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-stone shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : !loading ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-stone mb-3">No direct matches for "{query.trim()}".</p>
                    <button
                      type="button"
                      onClick={() => executeSearch(query)}
                      className="text-sm font-semibold text-trail-600 hover:underline"
                    >
                      Search full catalog anyway →
                    </button>
                  </div>
                ) : null
              ) : (
                <>
                  {recentSearches.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone mb-2.5">
                        Recent searches
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => executeSearch(term)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full bg-white border border-ink/10 hover:border-trail-400 transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5 text-stone" />
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone mb-2.5">
                      Browse popular categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_CATEGORIES.map((cat) => (
                        <Link
                          key={cat}
                          to={`/shop?category=${encodeURIComponent(cat)}`}
                          onClick={onClose}
                          className="text-xs font-semibold px-4 py-2 rounded-full bg-white border border-ink/12 hover:bg-ink hover:text-white transition-colors"
                        >
                          {cat}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;
