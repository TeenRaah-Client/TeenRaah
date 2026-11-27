import { useState, useCallback } from "react";
import Hero from "../components/home/Hero";
import CategoryShowcase from "../components/home/CategoryShowcase";
import FeaturedProducts from "../components/home/FeaturedProducts";
import PromoBanner from "../components/home/PromoBanner";
import Testimonials from "../components/home/Testimonials";
import RecommendedProducts from "../components/home/RecommendedProducts";
import RecentlyViewed from "../components/home/RecentlyViewed";

const Home = () => {
  const [bestsellerIds, setBestsellerIds] = useState([]);
  const [newArrivalIds, setNewArrivalIds] = useState([]);

  const handleBestsellersLoaded = useCallback((ids) => setBestsellerIds(ids), []);
  const handleNewArrivalsLoaded = useCallback((ids) => setNewArrivalIds(ids), []);

  return (
    <div>
      <Hero />
      <CategoryShowcase />
      <FeaturedProducts
        title="BESTSELLERS"
        subtitle="Loved by thousands, restocked often"
        featured
        onLoadedIds={handleBestsellersLoaded}
      />
      <PromoBanner />
      <FeaturedProducts
        title="NEW ARRIVALS"
        subtitle="Fresh off the line"
        featured={false}
        excludeIds={bestsellerIds}
        onLoadedIds={handleNewArrivalsLoaded}
      />
      <RecommendedProducts excludeIds={[...bestsellerIds, ...newArrivalIds]} />
      <RecentlyViewed />
      <Testimonials />
    </div>
  );
};

export default Home;
