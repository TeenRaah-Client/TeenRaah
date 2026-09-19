import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Eye, EyeOff, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { Loader } from "../../components/ui/Loader";

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/reviews");
      setReviews(data.reviews);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleVisibility = async (review) => {
    try {
      await api.put(`/admin/reviews/${review._id}/visibility`, { isVisible: !review.isVisible });
      setReviews((prev) => prev.map((r) => (r._id === review._id ? { ...r, isVisible: !r.isVisible } : r)));
    } catch (err) {
      toast.error(err.message || "Could not update review");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this review permanently?")) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      toast.success("Review deleted");
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      toast.error(err.message || "Could not delete review");
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide mb-8">REVIEWS</h1>

      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <motion.div
              key={r._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`bg-white rounded-2xl p-5 shadow-card flex items-start gap-4 ${!r.isVisible ? "opacity-50" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s < r.rating ? "fill-amber-400 text-amber-400" : "text-paper-dark"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-stone">
                    {r.user?.name} on <span className="font-semibold text-ink">{r.product?.name}</span>
                  </span>
                  {!r.isVisible && <span className="text-[10px] font-bold bg-stone/10 text-stone px-2 py-0.5 rounded-full">HIDDEN</span>}
                </div>
                <p className="text-sm text-ink/70">{r.comment}</p>
                <p className="text-xs text-stone mt-1.5">{new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => handleToggleVisibility(r)} className="text-ink/60 hover:text-trail-600" aria-label="Toggle visibility">
                  {r.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDelete(r._id)} className="text-ink/60 hover:text-rose" aria-label="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
          {reviews.length === 0 && <p className="text-center text-stone py-10">No reviews yet.</p>}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
