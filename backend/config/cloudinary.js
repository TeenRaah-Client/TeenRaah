import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer (from multer memory storage) to Cloudinary.
 * resourceType: "image" | "video" | "auto"
 */
export const uploadBufferToCloudinary = (buffer, { folder, resourceType = "auto" } = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder || "teenraah/products",
        resource_type: resourceType,
        // Reasonable defaults so large phone-shot videos don't blow up storage
        transformation:
          resourceType === "image"
            ? [{ width: 1600, crop: "limit", quality: "auto:good", fetch_format: "auto" }]
            : undefined,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error("Cloudinary delete failed:", err.message);
  }
};

/**
 * Builds an "AI Photo Studio" URL for an already-uploaded image: strips the
 * background (Cloudinary's AI Background Removal add-on) and recomposites
 * the product onto a clean studio background — the Amazon-style "product on
 * white" look — entirely as a Cloudinary transformation, computed lazily on
 * first request and cached by Cloudinary after that.
 *
 * Requires the "Background Removal" add-on to be enabled on the Cloudinary
 * account (Console → Add-ons). It is NOT part of the base free plan — it has
 * its own trial/usage pricing, but needs no separate signup or API key since
 * it runs on the same Cloudinary account already configured above.
 */
export const buildAiStudioUrl = (publicId, { resourceType = "image" } = {}) => {
  const bgColor = process.env.AI_STUDIO_BACKGROUND_COLOR || "white";
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
    transformation: [
      { effect: "background_removal" },
      { background: bgColor, crop: "pad", width: 1200, height: 1200 },
      { quality: "auto", fetch_format: "auto" },
    ],
  });
};

export default cloudinary;
