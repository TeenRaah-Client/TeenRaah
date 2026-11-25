import mongoose from "mongoose";

const marketingCampaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    objective: {
      type: String,
      enum: ["repeat_purchase", "win_back", "new_customer", "product_launch", "seasonal"],
      required: true,
    },
    audienceSegment: {
      type: String,
      enum: ["all_purchasers", "Champions", "Loyal", "New", "At Risk", "Dormant"],
      required: true,
    },
    channel: { type: String, enum: ["email", "sms", "onsite"], required: true },
    subject: { type: String, trim: true, maxlength: 120, default: "" },
    message: { type: String, trim: true, maxlength: 2000, required: true },
    status: { type: String, enum: ["draft"], default: "draft", immutable: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

marketingCampaignSchema.index({ createdAt: -1 });

const MarketingCampaign = mongoose.model("MarketingCampaign", marketingCampaignSchema);
export default MarketingCampaign;
