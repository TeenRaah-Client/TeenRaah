import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Search, Heart, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

const MobileBottomNav = ({ onOpenSearch }) => {
  const { pathname } = useLocation();
  const { itemCount, openCart } = useCart();
  const { isAuthenticated } = useAuth();

  // Hide on dedicated checkout & product detail (which have their own sticky CTA bars)
  const hiddenRoutes = ["/checkout"];
  if (hiddenRoutes.includes(pathname) || pathname.startsWith("/product/")) {
    return null;
  }

  const navItemClass = (active) =>
    `flex flex-col items-center justify-center gap-1 flex-1 py-2 min-h-[54px] text-[10px] font-semibold transition-colors ${
      active ? "text-trail-600" : "text-stone hover:text-ink"
    }`;

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur-md border-t border-ink/10 pb-safe shadow-[0_-6px_24px_-12px_rgba(11,11,12,0.18)]"
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto px-1">
        <Link to="/" className={navItemClass(pathname === "/")}>
          <Home className="w-5 h-5" strokeWidth={pathname === "/" ? 2.2 : 1.75} />
          <span>Home</span>
        </Link>

        <Link to="/shop" className={navItemClass(pathname === "/shop")}>
          <Compass className="w-5 h-5" strokeWidth={pathname === "/shop" ? 2.2 : 1.75} />
          <span>Shop</span>
        </Link>

        <button type="button" onClick={onOpenSearch} className={navItemClass(false)} aria-label="Search products">
          <Search className="w-5 h-5" strokeWidth={1.75} />
          <span>Search</span>
        </button>

        <Link
          to={isAuthenticated ? "/wishlist" : "/login"}
          className={navItemClass(pathname === "/wishlist")}
        >
          <Heart className="w-5 h-5" strokeWidth={pathname === "/wishlist" ? 2.2 : 1.75} />
          <span>Saved</span>
        </Link>

        <button type="button" onClick={openCart} className={`relative ${navItemClass(pathname === "/cart")}`} aria-label="Open bag">
          <span className="relative">
            <ShoppingBag className="w-5 h-5" strokeWidth={pathname === "/cart" ? 2.2 : 1.75} />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-trail-500 text-white text-[9px] font-bold flex items-center justify-center">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </span>
          <span>Bag</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
