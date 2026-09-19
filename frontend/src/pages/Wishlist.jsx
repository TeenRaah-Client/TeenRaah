import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import api from "../api/axios";
import ProductCard from "../components/ui/ProductCard";
import { ProductCardSkeleton } from "../components/ui/Loader";
import Button from "../components/ui/Button";

const Wishlist = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users/wishlist");
      setProducts(data.products);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-8">MY WISHLIST</h1>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-ink/15">
          <Heart className="w-10 h-10 text-stone mx-auto mb-4" />
          <p className="text-stone mb-4">Nothing saved yet — tap the heart on any product to add it here.</p>
          <Link to="/shop">
            <Button variant="outline">Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} isWishlisted onWishlistChange={fetchWishlist} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
