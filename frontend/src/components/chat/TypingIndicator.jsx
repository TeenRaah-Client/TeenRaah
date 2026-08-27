import { motion } from "framer-motion";

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-3 bg-white rounded-2xl rounded-bl-sm w-fit shadow-sm">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-stone"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
      />
    ))}
  </div>
);

export default TypingIndicator;
