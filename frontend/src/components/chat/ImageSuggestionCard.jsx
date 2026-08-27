import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Loader2 } from "lucide-react";
import { generateConceptImage } from "../../api/chatApi";
import { useAuth } from "../../context/AuthContext";

const ImageSuggestionCard = ({ suggestion }) => {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerate = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const data = await generateConceptImage({ category: suggestion.category, description: suggestion.description });
      setResult(data);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err.message || "Could not generate that image");
      setStatus("error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-amber-200 p-3 w-60"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">AI Concept</span>
      </div>
      <p className="text-xs text-ink/70 mb-3 leading-snug line-clamp-3">{suggestion.description}</p>

      {status === "done" && result ? (
        <>
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={result.url}
            alt={suggestion.description}
            className="w-full aspect-square object-cover rounded-lg mb-2 bg-paper-dark"
          />
          <p className="text-[10px] text-stone">
            {result.remainingToday} generation{result.remainingToday === 1 ? "" : "s"} left today
          </p>
        </>
      ) : !isAuthenticated ? (
        <Link to="/login" className="block text-center text-xs font-bold bg-ink text-white rounded-full py-2">
          Log in to generate
        </Link>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={status === "loading"}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-bold bg-ink text-white rounded-full py-2 disabled:opacity-70"
        >
          {status === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
          {status === "loading" ? "Generating…" : "Generate Image"}
        </button>
      )}

      {status === "error" && <p className="text-[10px] text-rose mt-2">{errorMsg}</p>}
    </motion.div>
  );
};

export default ImageSuggestionCard;
