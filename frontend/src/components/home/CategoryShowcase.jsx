import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Backpack, ShoppingBag, Briefcase, Plane, WalletCards, ShoppingBasket, Luggage, Package } from "lucide-react";

const CATEGORY_ICONS = [
  { name: "Backpacks", icon: Backpack },
  { name: "Sling Bags", icon: ShoppingBag },
  { name: "Office Bags", icon: Briefcase },
  { name: "Travel & Luggage", icon: Plane },
  { name: "Duffle Bags", icon: Luggage },
  { name: "Tote Bags", icon: Package },
  { name: "Wallets", icon: WalletCards },
  { name: "Handbags", icon: ShoppingBasket },
];

const CategoryShowcase = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-20">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-display text-3xl md:text-4xl text-center tracking-wide mb-10"
      >
        SHOP BY CATEGORY
      </motion.h2>

      <div className="flex flex-wrap justify-center gap-5 md:gap-8">
        {CATEGORY_ICONS.map(({ name, icon: Icon }, i) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
          >
            <Link to={`/shop?category=${encodeURIComponent(name)}`} className="flex flex-col items-center gap-3 group w-20 md:w-24">
              <motion.div
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.95 }}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white border-2 border-ink/10 group-hover:border-trail-400 flex items-center justify-center shadow-card transition-colors"
              >
                <Icon className="w-6 h-6 md:w-7 md:h-7 text-ink group-hover:text-trail-600 transition-colors" strokeWidth={1.6} />
              </motion.div>
              <span className="text-xs font-medium text-center text-ink/70 group-hover:text-trail-600 transition-colors leading-tight">
                {name}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CategoryShowcase;
