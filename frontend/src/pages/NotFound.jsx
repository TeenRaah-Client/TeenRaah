import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import Button from "../components/ui/Button";

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12 }}
      >
        <Compass className="w-16 h-16 text-trail-400 mb-6" strokeWidth={1.3} />
      </motion.div>
      <h1 className="font-display text-6xl md:text-7xl tracking-wide mb-3">LOST THE PATH?</h1>
      <p className="text-stone max-w-sm mb-8">
        We couldn't find that page. Let's get you back on track.
      </p>
      <Link to="/">
        <Button variant="dark" size="lg">
          Back to Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
