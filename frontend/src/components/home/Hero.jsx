import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import HeroSlideshow from "./HeroSlideshow";

const Hero = () => {
  return (
    <section className="relative bg-ink text-white overflow-hidden">
      <div className="absolute inset-0 bg-topo-dark" />

      {/* The drawn "path" line — the brand's signature motif, animated once on load */}
      <svg
        className="absolute inset-0 w-full h-full opacity-40"
        viewBox="0 0 1200 600"
        preserveAspectRatio="none"
        fill="none"
      >
        <motion.path
          d="M -50 480 C 200 480, 250 200, 480 220 C 700 240, 680 420, 900 380 C 1050 350, 1100 180, 1260 140"
          stroke="#E3A857"
          strokeWidth="2"
          strokeDasharray="8 6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.4, ease: "easeInOut" }}
        />
      </svg>

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-8 pb-16 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
        {/* Slideshow first in DOM so it's the first thing seen on mobile */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="order-1 md:order-2 md:rotate-3 mb-10 md:mb-0"
        >
          <HeroSlideshow />
        </motion.div>

        <div className="order-2 md:order-1">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-block text-amber-400 text-xs font-bold tracking-widest2 uppercase mb-4 md:mb-5"
          >
            New Season Arrivals
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-display text-6xl sm:text-7xl md:text-8xl leading-[0.9] tracking-wide text-balance"
          >
            FIND
            <br />
            YOUR <span className="text-trail-400">PATH</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-6 text-white/70 max-w-md leading-relaxed"
          >
            Backpacks, totes and travel gear built to keep up — wherever the day takes you. Durable materials,
            everyday design, made to move.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-9 flex flex-wrap gap-4"
          >
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 bg-amber-400 text-ink font-bold px-7 py-3.5 rounded-full hover:bg-amber-500 transition-colors"
            >
              Shop the Collection
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/shop?category=Backpacks"
              className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-7 py-3.5 rounded-full hover:bg-white/10 transition-colors"
            >
              Explore Backpacks
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
