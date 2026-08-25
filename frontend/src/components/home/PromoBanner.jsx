import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Truck, ShieldCheck, RotateCcw, Gift, ArrowRight } from "lucide-react";

const BADGES = [
  { icon: Truck, label: "Free Shipping", sub: "On orders over ₹999" },
  { icon: ShieldCheck, label: "Secure Payments", sub: "Razorpay encrypted checkout" },
  { icon: RotateCcw, label: "Easy 7-Day Returns", sub: "No questions asked" },
  { icon: Gift, label: "Refer & Earn", sub: "Wallet credit for both of you" },
];

const PromoBanner = () => {
  return (
    <>
      <section className="bg-paper-dark/50 border-y border-ink/8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {BADGES.map(({ icon: Icon, label, sub }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col md:flex-row items-center md:items-start gap-3 text-center md:text-left"
            >
              <div className="w-11 h-11 rounded-full bg-trail-50 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-trail-600" strokeWidth={1.7} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{label}</p>
                <p className="text-xs text-stone">{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-[2rem] overflow-hidden bg-trail-600 text-white px-8 py-14 md:py-20 text-center"
        >
          <div className="absolute inset-0 bg-topo-dark" />
          <div className="relative">
            <h2 className="font-display text-4xl md:text-5xl tracking-wide mb-4">SHARE YOUR PATH</h2>
            <p className="text-trail-50/90 max-w-lg mx-auto mb-8">
              Invite a friend to TeenRaah. When they place their first order, you both get wallet credit —
              no limit on how many friends you bring along.
            </p>
            <Link
              to="/referral"
              className="inline-flex items-center gap-2 bg-amber-400 text-ink font-bold px-7 py-3.5 rounded-full hover:bg-amber-500 transition-colors"
            >
              Get Your Referral Code
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
};

export default PromoBanner;
