import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Ananya R.",
    location: "Bengaluru",
    text: "The Trailmark Daypack has survived two years of daily commutes and still looks new. The laptop sleeve is genuinely padded, not just for show.",
    rating: 5,
  },
  {
    name: "Kabir S.",
    location: "Delhi",
    text: "Ordered the Summit Ridge for a 10-day trip and it fit everything without needing checked baggage. Zippers feel premium, straps don't dig in.",
    rating: 5,
  },
  {
    name: "Meher P.",
    location: "Mumbai",
    text: "Tracking was actually accurate down to the day, and customer support replied within minutes when I asked about an exchange.",
    rating: 4,
  },
];

const Testimonials = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-20">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-display text-3xl md:text-4xl text-center tracking-wide mb-3"
      >
        FROM THE COMMUNITY
      </motion.h2>
      <p className="text-center text-stone text-sm mb-12">Real stories from people on their own path</p>

      <div className="grid md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="bg-white rounded-2xl p-7 shadow-card relative"
          >
            <Quote className="w-7 h-7 text-trail-100 absolute top-6 right-6" fill="currentColor" />
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star key={s} className={`w-4 h-4 ${s < t.rating ? "fill-amber-400 text-amber-400" : "text-paper-dark"}`} />
              ))}
            </div>
            <p className="text-sm text-ink/80 leading-relaxed mb-5">{t.text}</p>
            <div>
              <p className="font-semibold text-sm">{t.name}</p>
              <p className="text-xs text-stone">{t.location}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
