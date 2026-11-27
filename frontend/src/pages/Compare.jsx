import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeftRight, ShoppingBag, X } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import { useCart } from "../context/CartContext";
import {
  readCompareList,
  removeCompareProduct,
  writeCompareList,
  COMPARE_EVENT,
  COMPARE_LIMIT,
} from "../utils/compareList";
import { getDifferenceRows, optimizeImageUrl } from "../utils/storefront";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const COMPARISON_ROWS = [
  ["Category", (p) => p.category || "—"],
  ["Price", (p) => money(p.price)],
  ["MRP", (p) => (p.mrp > p.price ? money(p.mrp) : "—")],
  ["Material", (p) => p.material || "Not specified"],
  ["Capacity", (p) => (p.capacityLitres ? `${p.capacityLitres} L` : "Not specified")],
  ["Available colours", (p) => (p.colors?.length ? p.colors.join(", ") : "Not specified")],
  [
    "Customer rating",
    (p) => (p.ratingsCount ? `${p.ratingsAverage.toFixed(1)} / 5 (${p.ratingsCount} reviews)` : "No reviews yet"),
  ],
  ["Availability", (p) => (p.stock > 0 ? "In stock" : "Out of stock")],
];

export default function Compare() {
  const [products, setProducts] = useState(() => readCompareList(window.localStorage));
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const sync = () => setProducts(readCompareList(window.localStorage));
    window.addEventListener(COMPARE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COMPARE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = (next) => {
    const saved = writeCompareList(window.localStorage, next);
    setProducts(saved);
    window.dispatchEvent(new Event(COMPARE_EVENT));
  };

  const remove = (id) => {
    update(removeCompareProduct(products, id));
    toast.success("Removed from comparison");
  };

  const clear = () => {
    update([]);
    toast.success("Comparison cleared");
  };

  const quickAdd = async (product) => {
    try {
      await addItem(product._id, 1, product.colors?.[0] || "");
    } catch (error) {
      if (error?.requiresLogin) navigate("/login");
      else toast.error(error?.message || "Could not add this product");
    }
  };

  const visibleRows = differencesOnly ? getDifferenceRows(COMPARISON_ROWS, products) : COMPARISON_ROWS;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-trail-600">MAKE THE RIGHT CHOICE</p>
          <h1 className="mt-1 font-display text-4xl md:text-5xl tracking-wide">COMPARE PRODUCTS</h1>
          <p className="mt-2 text-sm text-stone">
            {products.length} of {COMPARE_LIMIT} products selected
          </p>
        </div>

        {products.length > 0 && (
          <div className="flex items-center gap-4">
            {products.length > 1 && (
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer bg-white px-3.5 py-2 rounded-full border border-ink/12">
                <input
                  type="checkbox"
                  checked={differencesOnly}
                  onChange={(e) => setDifferencesOnly(e.target.checked)}
                  className="accent-trail-500 rounded"
                />
                Show differences only
              </label>
            )}
            <button type="button" onClick={clear} className="text-sm font-semibold text-stone hover:text-rose">
              Clear comparison
            </button>
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink/15 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-trail-50 text-trail-700">
            <ArrowLeftRight className="h-6 w-6" />
          </div>
          <h2 className="mt-5 font-display text-2xl">NOTHING TO COMPARE YET</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone">
            Add up to four bags from the shop to compare their price, capacity, material, colours and customer ratings side by side.
          </p>
          <Link to="/shop" className="mt-6 inline-flex">
            <Button>Explore the collection</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-card">
          <div className="min-w-[640px]">
            <div
              className="grid border-b border-ink/10"
              style={{ gridTemplateColumns: `165px repeat(${products.length}, minmax(160px, 1fr))` }}
            >
              <div className="p-4 flex items-end text-xs font-semibold uppercase tracking-wider text-stone sticky left-0 bg-white z-10">
                Product details
              </div>
              {products.map((product) => (
                <div key={product._id} className="relative p-4 border-l border-ink/10">
                  <button
                    type="button"
                    onClick={() => remove(product._id)}
                    aria-label={`Remove ${product.name}`}
                    className="absolute right-3 top-3 rounded-full p-1.5 text-stone hover:bg-rose/10 hover:text-rose"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <Link to={`/product/${product.slug}`} className="block">
                    <div className="aspect-[4/5] overflow-hidden rounded-xl bg-paper-dark">
                      {product.image ? (
                        <img
                          src={optimizeImageUrl(product.image, 420)}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-stone">No image</div>
                      )}
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-ink">{product.name}</h3>
                  </Link>
                  <p className="mt-1 text-xs font-bold text-ink tnum">{money(product.price)}</p>
                  <button
                    type="button"
                    onClick={() => quickAdd(product)}
                    disabled={product.stock <= 0}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> {product.stock > 0 ? "Add to bag" : "Out of stock"}
                  </button>
                </div>
              ))}
            </div>

            {visibleRows.length === 0 ? (
              <div className="p-8 text-center text-sm text-stone">
                All compared products share identical values across every listed specification.
              </div>
            ) : (
              visibleRows.map(([label, value]) => (
                <div
                  key={label}
                  className="grid border-b border-ink/5 last:border-0"
                  style={{ gridTemplateColumns: `165px repeat(${products.length}, minmax(160px, 1fr))` }}
                >
                  <div className="bg-paper/90 p-4 text-xs font-semibold text-stone sticky left-0">{label}</div>
                  {products.map((product) => (
                    <div key={product._id} className="border-l border-ink/5 p-4 text-sm text-ink">
                      {value(product)}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-stone">
        Comparison uses the product details saved when you added each item. Visit its product page for the latest price and availability before checkout.
      </p>
    </div>
  );
}
