import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // The delivered order that proves this reviewer actually bought the
    // product — required, not just recorded for show. See reviewController.js.
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    isVisible: { type: Boolean, default: true }, // admin can hide without deleting
  },
  { timestamps: true }
);

// One review per customer per product — resubmitting just edits the existing one.
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
