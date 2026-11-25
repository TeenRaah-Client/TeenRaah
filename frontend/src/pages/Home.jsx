import Hero from "../components/home/Hero";
import CategoryShowcase from "../components/home/CategoryShowcase";
import FeaturedProducts from "../components/home/FeaturedProducts";
import PromoBanner from "../components/home/PromoBanner";
import Testimonials from "../components/home/Testimonials";\nimport RecommendedProducts from "../components/home/RecommendedProducts";

const Home = () => {
  return (
    <div>
      <Hero />
      <CategoryShowcase />
      <FeaturedProducts title="BESTSELLERS" subtitle="Loved by thousands, restocked often" featured />
      <PromoBanner />
      <FeaturedProducts title="NEW ARRIVALS" subtitle="Fresh off the line" featured={false} />\n      <RecommendedProducts />
      <Testimonials />
    </div>
  );
};

export default Home;
