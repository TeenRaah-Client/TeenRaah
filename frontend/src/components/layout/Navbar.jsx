import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, ShoppingBag, Heart, Menu, X, MapPin, PackageSearch, ArrowLeftRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { readCompareList, COMPARE_EVENT } from "../../utils/compareList";

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

const OFFERS = [
  "Free shipping on orders over ₹999",
  "Refer a friend — you both earn wallet credit",
  "New arrivals dropping weekly",
  "Easy 7-day hassle-free returns",
];

const Navbar = ({ onOpenSearch }) => {
  const { isAuthenticated, user } = useAuth();
  const { itemCount, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [offerIdx, setOfferIdx] = useState(0);
  const [compareCount, setCompareCount] = useState(() => readCompareList(window.localStorage).length);

  useEffect(() => {
    const syncCompareCount = () => setCompareCount(readCompareList(window.localStorage).length);
    window.addEventListener(COMPARE_EVENT, syncCompareCount);
    window.addEventListener("storage", syncCompareCount);
    return () => {
      window.removeEventListener(COMPARE_EVENT, syncCompareCount);
      window.removeEventListener("storage", syncCompareCount);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setOfferIdx((i) => (i + 1) % OFFERS.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-40">
      {/* Calm, legible rotating announcement bar */}
      <div className="bg-ink text-white text-xs py-2 px-4 text-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={offerIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="tracking-wide opacity-90 truncate"
          >
            {OFFERS[offerIdx]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Main nav */}
      <div className="bg-paper/95 backdrop-blur-md border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 md:h-20 gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className="flex items-center justify-center h-9 w-9 md:h-11 md:w-11 rounded-lg bg-ink shrink-0">
                <img src="/logo-icon.png" alt="TeenRaah" className="h-6 w-6 md:h-7 md:w-7 object-contain" />
              </span>
              <span className="font-display text-xl md:text-2xl tracking-wide text-ink leading-none">TEENRAAH</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-6 mx-4">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <Link
                  key={cat}
                  to={`/shop?category=${encodeURIComponent(cat)}`}
                  className="text-sm font-medium text-ink/80 hover:text-trail-600 transition-colors relative group whitespace-nowrap"
                >
                  {cat}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-trail-500 group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1 md:gap-2">
              <button
                type="button"
                onClick={onOpenSearch}
                className="flex items-center gap-2 p-2.5 lg:px-3.5 lg:py-2 hover:bg-ink/5 lg:bg-white lg:border lg:border-ink/12 rounded-full transition-colors"
                aria-label="Search catalog"
              >
                <Search className="w-5 h-5 lg:w-4 lg:h-4 text-ink/80" />
                <span className="hidden lg:inline text-xs text-stone">Search bags…</span>
                <kbd className="hidden xl:inline-block text-[10px] font-semibold text-stone bg-paper-dark px-1.5 py-0.5 rounded">
                  /
                </kbd>
              </button>

              <Link to="/orders" className="hidden sm:flex p-2.5 hover:bg-ink/5 rounded-full transition-colors" aria-label="Track order">
                <PackageSearch className="w-5 h-5" />
              </Link>

              <Link to="/wishlist" className="hidden sm:flex p-2.5 hover:bg-ink/5 rounded-full transition-colors" aria-label="Wishlist">
                <Heart className="w-5 h-5" />
              </Link>

              <Link
                to="/compare"
                className="relative hidden sm:flex p-2.5 hover:bg-ink/5 rounded-full transition-colors"
                aria-label={`Compare products${compareCount ? `, ${compareCount} selected` : ""}`}
              >
                <ArrowLeftRight className="w-5 h-5" />
                {compareCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-trail-500 px-1 text-[10px] font-bold text-white">
                    {compareCount}
                  </span>
                )}
              </Link>

              <Link
                to={isAuthenticated ? "/profile" : "/login"}
                className="p-2.5 hover:bg-ink/5 rounded-full transition-colors"
                aria-label="Account"
              >
                <User className="w-5 h-5" />
              </Link>

              <button
                type="button"
                onClick={openCart}
                className="relative p-2.5 hover:bg-ink/5 rounded-full transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 bg-trail-500 text-white text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-ink/50 z-50 md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 left-0 h-dvh-safe w-[84%] max-w-sm bg-paper z-50 md:hidden flex flex-col shadow-lift"
            >
              <div className="flex items-center justify-between p-5 border-b border-ink/10">
                <span className="font-display text-xl">EXPLORE TEENRAAH</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-2 -mr-2"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-1">
                <Link
                  to="/shop"
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-base font-bold text-trail-600 border-b border-ink/10"
                >
                  Shop All Gear
                </Link>
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    to={`/shop?category=${encodeURIComponent(cat)}`}
                    onClick={() => setMobileOpen(false)}
                    className="block py-3 text-base font-medium border-b border-ink/5"
                  >
                    {cat}
                  </Link>
                ))}
                <Link to="/orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-3 text-base font-medium">
                  <PackageSearch className="w-4 h-4 text-trail-600" /> Track Orders
                </Link>
                <Link to="/compare" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-3 text-base font-medium">
                  <ArrowLeftRight className="w-4 h-4 text-trail-600" /> Compare Bags {compareCount > 0 ? `(${compareCount})` : ""}
                </Link>
                <Link to="/referral" onClick={() => setMobileOpen(false)} className="block py-3 text-base font-semibold text-trail-600">
                  Refer &amp; Earn Wallet Credit
                </Link>
                <Link to="/addresses" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-3 text-base font-medium">
                  <MapPin className="w-4 h-4 text-trail-600" /> My Addresses
                </Link>
              </div>
              <div className="p-5 border-t border-ink/10 pb-safe">
                {isAuthenticated ? (
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block text-sm font-medium text-ink"
                  >
                    Signed in as <span className="font-bold">{user?.name}</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center py-3 rounded-full bg-ink text-white text-sm font-semibold"
                  >
                    Sign In / Register
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
