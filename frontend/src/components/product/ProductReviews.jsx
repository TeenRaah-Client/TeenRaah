import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";

const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} stars`}>
        <Star className={`w-6 h-6 transition-colors ${n <= value ? "fill-amber-400 text-amber-400" : "text-paper-dark"}`} />
      </button>
    ))}
  </div>
);

/** props: slug */
const ProductReviews = ({ slug }) => {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const requests = [api.get(`/products/${slug}/reviews`)];
      if (isAuthenticated) requests.push(api.get(`/products/${slug}/reviews/eligibility`));

      const [reviewsRes, eligibilityRes] = await Promise.all(requests);
      setReviews(reviewsRes.data.reviews);
      if (eligibilityRes) {
        setEligibility(eligibilityRes.data);
        if (eligibilityRes.data.existingReview) {
          setRating(eligibilityRes.data.existingReview.rating);
          setComment(eligibilityRes.data.existingReview.comment);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (comment.trim().length < 5) {
      toast.error("Add a few words about your experience");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/products/${slug}/reviews`, { rating, comment: comment.trim() });
      toast.success("Review submitted — thank you!");
      setFormOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err.message || "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-14 border-t border-ink/8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-3xl tracking-wide">REVIEWS ({reviews.length})</h2>
        {isAuthenticated && eligibility?.canReview && !formOpen && (
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            {eligibility.hasReviewed ? "Edit Your Review" : "Write a Review"}
          </Button>
        )}
      </div>

      {isAuthenticated && !eligibility?.canReview && !eligibility?.hasReviewed && eligibility?.reason && (
        <p className="text-xs text-stone mb-8">{eligibility.reason}</p>
      )}

      {formOpen && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 shadow-card mb-8 max-w-lg"
        >
          <p className="text-sm font-semibold mb-2">Your rating</p>
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How did this hold up? What did you like or not like?"
            rows={4}
            className="w-full mt-4 px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500 resize-none"
          />
          <div className="flex gap-3 mt-4">
            <Button type="submit" variant="dark" loading={submitting}>
              Submit Review
            </Button>
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </motion.form>
      )}

      {reviews.length === 0 ? (
        <p className="text-stone text-sm">No reviews yet — be the first to share your experience.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {reviews.map((r, i) => (
            <motion.div
              key={r._id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i, 6) * 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-card"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s < r.rating ? "fill-amber-400 text-amber-400" : "text-paper-dark"}`} />
                  ))}
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-trail-600 bg-trail-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                </span>
              </div>
              <p className="text-sm text-ink/80 leading-relaxed mb-3">{r.comment}</p>
              <p className="text-xs font-semibold text-ink">
                {r.user?.name} <span className="text-stone font-normal">· {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductReviews;
