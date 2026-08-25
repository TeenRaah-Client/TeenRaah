import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { Plus, Trash2, X, Tag } from "lucide-react";
import api from "../../api/axios";
import { Loader } from "../../components/ui/Loader";
import Button from "../../components/ui/Button";

const emptyForm = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  maxDiscount: "",
  minOrderValue: "",
  usageLimit: "",
  expiresAt: "",
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/coupons");
      setCoupons(data.coupons);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/coupons", form);
      toast.success("Coupon created");
      setFormOpen(false);
      setForm(emptyForm);
      fetchCoupons();
    } catch (err) {
      toast.error(err.message || "Could not create coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      await api.put(`/admin/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      fetchCoupons();
    } catch (err) {
      toast.error(err.message || "Could not update coupon");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch (err) {
      toast.error(err.message || "Could not delete coupon");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl tracking-wide">COUPONS</h1>
        <Button variant="dark" icon={Plus} onClick={() => setFormOpen(true)}>New Coupon</Button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <motion.div key={c._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 shadow-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-trail-600" />
                  <span className="font-display text-lg tracking-wide">{c.code}</span>
                </div>
                <button onClick={() => handleDelete(c._id)} className="text-stone hover:text-rose"><Trash2 className="w-4 h-4" /></button>
              </div>
              <p className="text-sm text-ink/70 mb-3">{c.description || "No description"}</p>
              <div className="text-xs text-stone space-y-1 mb-4">
                <p>Discount: {c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`}{c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}</p>
                <p>Min order: ₹{c.minOrderValue}</p>
                <p>Used: {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</p>
                <p>Expires: {new Date(c.expiresAt).toLocaleDateString("en-IN")}</p>
              </div>
              <button
                onClick={() => handleToggleActive(c)}
                className={`w-full text-xs font-bold py-2 rounded-full ${c.isActive ? "bg-trail-50 text-trail-700" : "bg-stone/10 text-stone"}`}
              >
                {c.isActive ? "Active — tap to disable" : "Disabled — tap to enable"}
              </button>
            </motion.div>
          ))}
          {coupons.length === 0 && <p className="text-stone col-span-full text-center py-10">No coupons yet.</p>}
        </div>
      )}

      <AnimatePresence>
        {formOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFormOpen(false)} className="fixed inset-0 bg-ink/50 z-50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-paper rounded-2xl z-50 max-h-[80vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-paper flex items-center justify-between p-5 border-b border-ink/10">
                <h2 className="font-display text-2xl tracking-wide">NEW COUPON</h2>
                <button onClick={() => setFormOpen(false)} aria-label="Close"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <input
                  required
                  placeholder="Coupon code (e.g. WELCOME10)"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500 uppercase"
                />
                <input
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-ink/15 text-sm bg-white outline-none focus:border-trail-500"
                  >
                    <option value="percentage">Percentage %</option>
                    <option value="flat">Flat ₹</option>
                  </select>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="Value"
                    value={form.discountValue}
                    onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
                  />
                  {form.discountType === "percentage" && (
                    <input
                      type="number"
                      min="0"
                      placeholder="Max discount ₹ (optional)"
                      value={form.maxDiscount}
                      onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                      className="px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500 col-span-2"
                    />
                  )}
                  <input
                    type="number"
                    min="0"
                    placeholder="Min order value ₹"
                    value={form.minOrderValue}
                    onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Usage limit (optional)"
                    value={form.usageLimit}
                    onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone uppercase mb-1.5 block">Expires On</label>
                  <input
                    required
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
                  />
                </div>
                <Button type="submit" variant="dark" size="lg" className="w-full" loading={saving}>
                  Create Coupon
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCoupons;
