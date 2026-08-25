import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { apiMultipart } from "../../api/axios";

/**
 * props:
 *  - source: { file: File } for a not-yet-uploaded photo, or
 *            { sourcePublicId: string } to re-process a photo already on Cloudinary
 *  - onDone: ({ publicId, originalUrl, aiUrl, isNewUpload }) => void
 *  - label?: string
 */
const AiEnhanceButton = ({ source, onDone, label = "AI Studio", className = "" }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      let res;
      if (source.file) {
        const fd = new FormData();
        fd.append("image", source.file);
        res = await apiMultipart.post("/admin/products/ai-studio", fd);
      } else {
        res = await apiMultipart.post("/admin/products/ai-studio", { sourcePublicId: source.sourcePublicId });
      }
      onDone(res.data);
    } catch (err) {
      toast.error(err.message || "AI Studio couldn't process this photo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-ink text-white hover:bg-ink-800 disabled:opacity-70 transition-colors ${className}`}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
      {loading ? "Processing…" : label}
    </button>
  );
};

export default AiEnhanceButton;
