import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, X, Loader2, CheckCircle2 } from "lucide-react";
import api from "../../api/axios";

/** props: subtotal, appliedCoupon, onApply({code, discount}), onRemove() */
const CouponInput = ({ subtotal, appliedCoupon, onApply, onRemove }) => {
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const handleApply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setChecking(true);
    setError("");
    try {
      const { data } = await api.post("/coupons/validate", { code: code.trim(), subtotal });
      onApply({ code: data.code, discount: data.discount });
      setCode("");
    } catch (err) {
      setError(err.message || "Invalid coupon");
    } finally {
      setChecking(false);
    }
  };

  if (appliedCoupon) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-trail-50 border border-trail-200 rounded-xl px-4 py-3"
      >
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-trail-600" />
          <span className="font-semibold text-trail-700">{appliedCoupon.code}</span>
          <span className="text-trail-600">applied — you saved ₹{appliedCoupon.discount.toLocaleString("en-IN")}</span>
        </div>
        <button onClick={onRemove} aria-label="Remove coupon">
          <X className="w-4 h-4 text-trail-700" />
        </button>
      </motion.div>
    );
  }

  return (
    <div>
      <form onSubmit={handleApply} className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Coupon code"
            className="w-full pl-10 pr-3 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500 uppercase"
          />
        </div>
        <button
          type="submit"
          disabled={checking}
          className="px-5 rounded-xl border-2 border-ink text-sm font-semibold hover:bg-ink hover:text-white transition-colors disabled:opacity-50"
        >
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
        </button>
      </form>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-rose mt-2">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CouponInput;
