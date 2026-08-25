import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error(`Unsupported file type: ${file.mimetype}`));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB — generous enough for short product videos
});

// Product form sends up to 6 images + 2 videos as separate fields
export const productMediaUpload = upload.fields([
  { name: "images", maxCount: 6 },
  { name: "videos", maxCount: 2 },
]);

// AI Photo Studio processes one raw photo at a time
export const singleImageUpload = upload.single("image");
