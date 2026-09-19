import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Denormalized snapshot — stays readable even if the admin account is
    // later removed, and avoids a populate() on every log page load.
    adminName: { type: String, required: true },
    adminEmail: { type: String, required: true },

    action: { type: String, required: true, index: true }, // e.g. "product.create", "order.status_update"
    targetType: { type: String }, // "Product" | "Order" | "Coupon" | "Review" | "Auth"
    targetId: { type: mongoose.Schema.Types.ObjectId },

    summary: { type: String, required: true }, // human-readable one-liner for the log table
    metadata: { type: mongoose.Schema.Types.Mixed }, // small before/after context where it's cheap to capture

    ip: { type: String },
  },
  { timestamps: true }
);

adminLogSchema.index({ createdAt: -1 });

const AdminLog = mongoose.model("AdminLog", adminLogSchema);
export default AdminLog;
