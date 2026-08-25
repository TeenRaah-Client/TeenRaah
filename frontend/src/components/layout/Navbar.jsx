import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, ShoppingBag, Menu, X, MapPin, PackageSearch } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

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
  "Refer a friend and you both earn wallet credit",
  "New arrivals dropping weekly",
  "Easy 7-day returns",
];

const Navbar = () => {
  const { isAuthenticated, user } = useAuth();
  const { itemCount, openCart } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const submitSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <header className="sticky top-0 z-40">
      {/* Utility marquee bar */}
      <div className="bg-ink text-white text-xs py-2 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...OFFERS, ...OFFERS].map((offer, i) => (
            <span key={i} className="mx-8 tracking-wide opacity-90">
              {offer}
            </span>
          ))}
        </div>
      </div>

      {/* Main nav */}
      <div className="bg-paper/95 backdrop-blur-md border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2"
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

            <nav className="hidden md:flex items-center gap-7 mx-8">
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
              <button onClick={() => setSearchOpen((v) => !v)} className="p-2.5 hover:bg-ink/5 rounded-full transition-colors" aria-label="Search">
                <Search className="w-5 h-5" />
              </button>

              <Link to="/orders" className="hidden sm:flex p-2.5 hover:bg-ink/5 rounded-full transition-colors" aria-label="Track order">
                <PackageSearch className="w-5 h-5" />
              </Link>

              <Link
                to={isAuthenticated ? "/profile" : "/login"}
                className="p-2.5 hover:bg-ink/5 rounded-full transition-colors"
                aria-label="Account"
              >
                <User className="w-5 h-5" />
              </Link>

              <button onClick={openCart} className="relative p-2.5 hover:bg-ink/5 rounded-full transition-colors" aria-label="Cart">
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

        {/* Expandable search */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-ink/10 overflow-hidden"
            >
              <form onSubmit={submitSearch} className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex gap-2">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search backpacks, totes, wallets…"
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-stone"
                />
                <button type="submit" className="text-sm font-semibold text-trail-600">
                  Search
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
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
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-paper z-50 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-ink/10">
                <span className="font-display text-xl">MENU</span>
                <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-1">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    to={`/shop?category=${encodeURIComponent(cat)}`}
                    onClick={() => setMobileOpen(false)}
                    className="block py-3 text-lg font-medium border-b border-ink/5"
                  >
                    {cat}
                  </Link>
                ))}
                <Link to="/referral" onClick={() => setMobileOpen(false)} className="block py-3 text-lg font-medium text-trail-600">
                  Refer & Earn
                </Link>
                <Link to="/addresses" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-3 text-lg font-medium">
                  <MapPin className="w-4 h-4" /> My Addresses
                </Link>
              </div>
              {isAuthenticated && (
                <div className="p-5 border-t border-ink/10 text-sm text-stone">Signed in as {user?.name}</div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
