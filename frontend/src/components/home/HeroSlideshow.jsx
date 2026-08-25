import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1509762774605-f07235a08f1f?w=1000&auto=format&fit=crop&q=80",
    alt: "Hiking backpack on a rock at sunset",
    price: "899",
  },
  {
    src: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1000&auto=format&fit=crop&q=80",
    alt: "Black everyday backpack",
    price: "1,099",
  },
  {
    src: "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=1000&auto=format&fit=crop&q=80",
    alt: "Person carrying a black backpack",
    price: "999",
  },
  {
    src: "https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=1000&auto=format&fit=crop&q=80",
    alt: "Red leather backpack",
    price: "1,499",
  },
  {
    src: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=1000&auto=format&fit=crop&q=80",
    alt: "Brown leather backpack",
    price: "1,299",
  },
];

const AUTOPLAY_MS = 3800;

const HeroSlideshow = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef(null);
  const touchX = useRef(null);

  const goTo = useCallback((next) => {
    setDirection(next > index || (index === SLIDES.length - 1 && next === 0) ? 1 : -1);
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, [index]);

  const next = useCallback(() => goTo(index + 1), [index, goTo]);

  useEffect(() => {
    timerRef.current = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const restartTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, AUTOPLAY_MS);
  };

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(delta) > 40) {
      delta < 0 ? goTo(index + 1) : goTo(index - 1);
      restartTimer();
    }
    touchX.current = null;
  };

  const variants = {
    enter: (dir) => ({ opacity: 0, scale: 1.06, x: dir > 0 ? 24 : -24 }),
    center: { opacity: 1, scale: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, scale: 1.02, x: dir > 0 ? -24 : 24 }),
  };

  return (
    <div className="relative">
      <div
        className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-lift select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.img
            key={index}
            src={SLIDES[index].src}
            alt={SLIDES[index].alt}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        </AnimatePresence>

        {/* Bottom gradient so dots/text stay legible over any photo */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Dot indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.src}
              onClick={() => {
                goTo(i);
                restartTimer();
              }}
              aria-label={`Show slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-amber-400" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Price badge */}
      <motion.div
  key={`price-${index}`}
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: 0.15 }}
  className="absolute -bottom-6 -left-4 sm:-left-6 px-5 py-4
             bg-white/10 backdrop-blur-md
             border border-white/20
             text-white rounded-2xl shadow-lift"
>
  <p className="text-xs text-white/70">Starting at</p>
  <p className="font-display text-2xl text-white">
    ₹{SLIDES[index].price}
  </p>
</motion.div>
    </div>
  );
};

export default HeroSlideshow;
