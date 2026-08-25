import { motion } from "framer-motion";

export const Loader = ({ label = "Loading" }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      {[8, 16, 24].map((r, i) => (
        <motion.circle
          key={r}
          cx="28"
          cy="28"
          r={r}
          stroke="#2F5233"
          strokeWidth="2"
          fill="none"
          strokeDasharray="6 4"
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "28px 28px" }}
        />
      ))}
    </svg>
    <span className="text-stone text-sm tracking-wide">{label}…</span>
  </div>
);

export const ProductCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="aspect-[4/5] bg-paper-dark rounded-2xl mb-3" />
    <div className="h-3 bg-paper-dark rounded w-3/4 mb-2" />
    <div className="h-3 bg-paper-dark rounded w-1/2" />
  </div>
);

export const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Loader label="Finding your path" />
  </div>
);

export default Loader;
