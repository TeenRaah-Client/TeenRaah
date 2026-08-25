import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true }, // needed to delete from Cloudinary later
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, required: true },

    category: {
      type: String,
      required: true,
      enum: [
        "Backpacks",
        "Handbags",
        "Sling Bags",
        "Tote Bags",
        "Office Bags",
        "Travel & Luggage",
        "Duffle Bags",
        "Wallets",
        "Accessories",
      ],
      index: true,
    },

    price: { type: Number, required: true, min: 0 }, // selling price
    mrp: { type: Number, required: true, min: 0 }, // struck-through original price

    colors: [{ type: String, trim: true }],
    material: { type: String, trim: true },
    capacityLitres: { type: Number },

    images: { type: [mediaSchema], validate: (v) => v.length > 0 },
    videos: { type: [mediaSchema], default: [] },

    stock: { type: Number, required: true, default: 0, min: 0 },
    sku: { type: String, unique: true, sparse: true },

    tags: [{ type: String, trim: true, lowercase: true }],

    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // Powers the "Hot New Arrivals" countdown-timer strip, zuok-style.
    saleEndsAt: { type: Date, default: null },

    ratingsAverage: { type: Number, default: 4.5, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", tags: "text" });

productSchema.virtual("discountPercent").get(function () {
  if (!this.mrp || this.mrp <= this.price) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

const Product = mongoose.model("Product", productSchema);
export default Product;
