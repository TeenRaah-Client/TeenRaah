import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const AuthLayout = ({ eyebrow, title, subtitle, children }) => {
  return (
    <div className="grid md:grid-cols-2 min-h-[calc(100vh-140px)]">
      <div className="hidden md:flex relative bg-ink text-white items-center justify-center p-14 overflow-hidden">
        <div className="absolute inset-0 bg-topo-dark" />
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 600 800" preserveAspectRatio="none">
          <motion.path
            d="M -20 700 C 150 650, 180 400, 350 380 C 480 365, 500 200, 620 100"
            stroke="#E3A857"
            strokeWidth="2"
            strokeDasharray="8 6"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </svg>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-sm"
        >
          <Link to="/" className="flex items-center gap-2 mb-10">
            <img src="/logo.png" alt="TeenRaah" className="h-11 w-11 rounded-lg" />
            <span className="font-display text-2xl tracking-wide">TEENRAAH</span>
          </Link>
          <h1 className="font-display text-5xl leading-[0.95] tracking-wide mb-5">{eyebrow}</h1>
          <p className="text-white/60 leading-relaxed">{subtitle}</p>
        </motion.div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Link to="/" className="flex md:hidden items-center gap-2 mb-8">
            <img src="/logo.png" alt="TeenRaah" className="h-9 w-9 rounded-lg" />
            <span className="font-display text-xl tracking-wide">TEENRAAH</span>
          </Link>
          <h2 className="font-display text-3xl tracking-wide mb-2">{title}</h2>
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
