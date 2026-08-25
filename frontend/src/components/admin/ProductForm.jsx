import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { X, UploadCloud, Sparkles, Loader2, RotateCcw } from "lucide-react";
import api, { apiMultipart } from "../../api/axios";
import AiEnhanceButton from "./AiEnhanceButton";
import Button from "../ui/Button";

const CATEGORIES = [
  "Backpacks",
  "Handbags",
  "Sling Bags",
  "Tote Bags",
  "Office Bags",
  "Travel & Luggage",
  "Duffle Bags",
  "Wallets",
  "Accessories",
];

const emptyForm = (p) => ({
  name: p?.name || "",
  description: p?.description || "",
  category: p?.category || CATEGORIES[0],
  price: p?.price || "",
  mrp: p?.mrp || "",
  colors: p?.colors?.join(", ") || "",
  material: p?.material || "",
  capacityLitres: p?.capacityLitres || "",
  stock: p?.stock ?? "",
  tags: p?.tags?.join(", ") || "",
  isFeatured: p?.isFeatured || false,
  isActive: p?.isActive ?? true,
});

/** Shared thumbnail: shows a spinner until the image has actually finished
 * loading (the AI version's first load is Cloudinary computing the
 * transformation, which takes a moment), plus a small "AI" badge. */
const ImageSlotPreview = ({ displayUrl, isAiVersion, size = 96 }) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [displayUrl]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-paper-dark shrink-0" style={{ width: size, height: size }}>
      <img
        src={displayUrl}
        alt=""
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-stone" />
        </div>
      )}
      {isAiVersion && loaded && (
        <span className="absolute top-1 left-1 flex items-center gap-0.5 bg-ink/85 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
          <Sparkles className="w-2.5 h-2.5 text-amber-400" /> AI
        </span>
      )}
    </div>
  );
};

/** props: product (null = create mode), onClose, onSaved */
const ProductForm = ({ product, onClose, onSaved }) => {
  const [form, setForm] = useState(emptyForm(product));
  // Each new-image slot: { id, file, rawPreviewUrl, aiUrl, aiPublicId, rawUploadedUrl, useAi }
  const [newImages, setNewImages] = useState([]);
  const [newVideos, setNewVideos] = useState([]);
  const [existingImages, setExistingImages] = useState(product?.images || []);
  // AI previews pending confirmation for existing (already-saved) photos: { [publicId]: aiUrl }
  const [existingAiPreview, setExistingAiPreview] = useState({});
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleRemoveExistingMedia = async (publicId, type) => {
    if (!product) return;
    try {
      await apiMultipart.delete(`/admin/products/${product._id}/media`, { data: { publicId, type } });
      setExistingImages((imgs) => imgs.filter((i) => i.publicId !== publicId));
      toast.success("Removed");
    } catch (err) {
      toast.error(err.message || "Could not remove media");
    }
  };

  // ---------------- AI Studio: existing (already-saved) photos ----------------

  const handleAiResultForExisting = (publicId) => (result) => {
    setExistingAiPreview((s) => ({ ...s, [publicId]: result.aiUrl }));
  };

  const keepExistingAiVersion = async (publicId) => {
    const aiUrl = existingAiPreview[publicId];
    if (!aiUrl || !product) return;
    try {
      await api.put(`/admin/products/${product._id}/media/promote-ai`, { publicId, aiUrl });
      setExistingImages((imgs) => imgs.map((img) => (img.publicId === publicId ? { ...img, url: aiUrl } : img)));
      setExistingAiPreview((s) => {
        const next = { ...s };
        delete next[publicId];
        return next;
      });
      toast.success("Switched to the AI Studio version");
    } catch (err) {
      toast.error(err.message || "Could not switch to the AI version");
    }
  };

  const discardExistingAiPreview = (publicId) => {
    setExistingAiPreview((s) => {
      const next = { ...s };
      delete next[publicId];
      return next;
    });
  };

  // ---------------- AI Studio: newly selected (not yet uploaded) photos ----------------

  const handleSelectNewImages = (fileList) => {
    const files = Array.from(fileList).slice(0, 6);
    setNewImages(
      files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        rawPreviewUrl: URL.createObjectURL(file),
        aiUrl: null,
        aiPublicId: null,
        rawUploadedUrl: null,
        useAi: false,
      }))
    );
  };

  const handleAiResultForNew = (slotId) => (result) => {
    setNewImages((imgs) =>
      imgs.map((img) =>
        img.id === slotId
          ? { ...img, aiUrl: result.aiUrl, aiPublicId: result.publicId, rawUploadedUrl: result.originalUrl, useAi: true }
          : img
      )
    );
  };

  const toggleNewImageVersion = (slotId) => {
    setNewImages((imgs) => imgs.map((img) => (img.id === slotId ? { ...img, useAi: !img.useAi } : img)));
  };

  const removeNewImage = async (slotId) => {
    const slot = newImages.find((img) => img.id === slotId);
    setNewImages((imgs) => imgs.filter((img) => img.id !== slotId));
    // Clean up the staged Cloudinary upload if AI Studio already ran on it —
    // otherwise nothing was ever uploaded, so there's nothing to clean up.
    if (slot?.aiPublicId) {
      apiMultipart.delete("/admin/products/ai-studio", { data: { publicId: slot.aiPublicId } }).catch(() => {});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product && newImages.length === 0) {
      toast.error("Add at least one product image");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));

      // Slots already processed by AI Studio are already on Cloudinary — send
      // their URL/publicId directly instead of re-uploading the raw file.
      const aiStudioImages = [];
      newImages.forEach((slot) => {
        if (slot.aiPublicId) {
          aiStudioImages.push({
            publicId: slot.aiPublicId,
            url: slot.useAi ? slot.aiUrl : slot.rawUploadedUrl,
          });
        } else {
          fd.append("images", slot.file);
        }
      });
      if (aiStudioImages.length) fd.append("aiStudioImages", JSON.stringify(aiStudioImages));

      newVideos.forEach((f) => fd.append("videos", f));

      if (product) {
        await apiMultipart.put(`/admin/products/${product._id}`, fd);
        toast.success("Product updated");
      } else {
        await apiMultipart.post("/admin/products", fd);
        toast.success("Product created");
      }
      onSaved();
    } catch (err) {
      toast.error(err.message || "Could not save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-ink/50 z-50" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="fixed inset-x-4 top-[3%] bottom-[3%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-paper rounded-2xl z-50 overflow-y-auto"
      >
        <div className="sticky top-0 bg-paper flex items-center justify-between p-5 border-b border-ink/10 z-10">
          <h2 className="font-display text-2xl tracking-wide">{product ? "EDIT PRODUCT" : "NEW PRODUCT"}</h2>
          <button onClick={onClose} aria-label="Close"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input
            required
            placeholder="Product name"
            value={form.name}
            onChange={update("name")}
            className="w-full px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
          />
          <textarea
            required
            placeholder="Description"
            rows={3}
            value={form.description}
            onChange={update("description")}
            className="w-full px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500 resize-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <select value={form.category} onChange={update("category")} className="px-4 py-3 rounded-xl border border-ink/15 text-sm bg-white outline-none focus:border-trail-500">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Material (e.g. Ripstop Nylon)" value={form.material} onChange={update("material")} className="px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500" />

            <input required type="number" min="0" placeholder="Selling price (₹)" value={form.price} onChange={update("price")} className="px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500" />
            <input required type="number" min="0" placeholder="MRP (₹)" value={form.mrp} onChange={update("mrp")} className="px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500" />

            <input required type="number" min="0" placeholder="Stock quantity" value={form.stock} onChange={update("stock")} className="px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500" />
            <input type="number" min="0" step="0.5" placeholder="Capacity (litres)" value={form.capacityLitres} onChange={update("capacityLitres")} className="px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500" />
          </div>

          <input placeholder="Colors, comma separated (e.g. Black, Olive, Rust)" value={form.colors} onChange={update("colors")} className="w-full px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500" />
          <input placeholder="Tags, comma separated (e.g. waterproof, laptop, travel)" value={form.tags} onChange={update("tags")} className="w-full px-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500" />

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm px-1">
              <input type="checkbox" checked={form.isFeatured} onChange={update("isFeatured")} className="rounded accent-trail-500" />
              Featured (shows on homepage)
            </label>
            <label className="flex items-center gap-2 text-sm px-1">
              <input type="checkbox" checked={form.isActive} onChange={update("isActive")} className="rounded accent-trail-500" />
              Active / visible in store
            </label>
          </div>

          {/* ---- Existing images (edit mode) ---- */}
          {existingImages.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone uppercase mb-2">Current Images</p>
              <div className="flex flex-wrap gap-3">
                {existingImages.map((img) => {
                  const preview = existingAiPreview[img.publicId];
                  return (
                    <div key={img.publicId} className="w-24">
                      <div className="relative">
                        <ImageSlotPreview displayUrl={preview || img.url} isAiVersion={Boolean(preview)} size={96} />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingMedia(img.publicId, "image")}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose text-white rounded-full flex items-center justify-center z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="mt-1.5">
                        {preview ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => keepExistingAiVersion(img.publicId)}
                              className="flex-1 text-[10px] font-bold bg-trail-500 text-white rounded-full py-1"
                            >
                              Keep
                            </button>
                            <button
                              type="button"
                              onClick={() => discardExistingAiPreview(img.publicId)}
                              className="text-[10px] font-bold text-stone px-1.5"
                              aria-label="Revert to original"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <AiEnhanceButton
                            source={{ sourcePublicId: img.publicId }}
                            onDone={handleAiResultForExisting(img.publicId)}
                            label="Enhance"
                            className="w-full justify-center"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---- New images ---- */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2 cursor-pointer text-trail-600">
              <UploadCloud className="w-4 h-4" /> {product ? "Add more images" : "Product images (up to 6)"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={(e) => handleSelectNewImages(e.target.files)}
              />
            </label>

            {newImages.length > 0 && (
              <>
                <p className="text-xs text-stone mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Run AI Studio to drop the background and center each bag on a clean white background, Amazon-style.
                </p>
                <div className="flex flex-wrap gap-3">
                  {newImages.map((slot) => (
                    <div key={slot.id} className="w-24">
                      <div className="relative">
                        <ImageSlotPreview
                          displayUrl={slot.useAi && slot.aiUrl ? slot.aiUrl : slot.rawPreviewUrl}
                          isAiVersion={Boolean(slot.useAi && slot.aiUrl)}
                          size={96}
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(slot.id)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose text-white rounded-full flex items-center justify-center z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="mt-1.5">
                        {slot.aiUrl ? (
                          <div className="flex rounded-full bg-paper-dark p-0.5 text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => !slot.useAi || toggleNewImageVersion(slot.id)}
                              className={`flex-1 rounded-full py-1 ${!slot.useAi ? "bg-white shadow-sm" : "text-stone"}`}
                            >
                              Original
                            </button>
                            <button
                              type="button"
                              onClick={() => slot.useAi || toggleNewImageVersion(slot.id)}
                              className={`flex-1 rounded-full py-1 ${slot.useAi ? "bg-ink text-white" : "text-stone"}`}
                            >
                              AI
                            </button>
                          </div>
                        ) : (
                          <AiEnhanceButton
                            source={{ file: slot.file }}
                            onDone={handleAiResultForNew(slot.id)}
                            className="w-full justify-center"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2 cursor-pointer text-trail-600">
              <UploadCloud className="w-4 h-4" /> Product videos (up to 2, optional)
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                multiple
                className="hidden"
                onChange={(e) => setNewVideos(Array.from(e.target.files).slice(0, 2))}
              />
            </label>
            {newVideos.length > 0 && <p className="text-xs text-stone">{newVideos.map((f) => f.name).join(", ")}</p>}
          </div>

          <Button type="submit" variant="dark" size="lg" className="w-full" loading={saving}>
            {product ? "Save Changes" : "Create Product"}
          </Button>
        </form>
      </motion.div>
    </>
  );
};

export default ProductForm;
