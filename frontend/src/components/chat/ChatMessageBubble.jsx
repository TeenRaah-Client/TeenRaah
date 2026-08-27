import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import ChatProductCard from "./ChatProductCard";
import ImageSuggestionCard from "./ImageSuggestionCard";

/** Lightweight markdown for **bold** and "- " bullet lists — enough for how
 * an LLM naturally formats a short shopping-assistant reply, without
 * pulling in a full markdown dependency. */
const renderLiteMarkdown = (text) => {
  const boldSplit = (str, keyPrefix) =>
    str.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={`${keyPrefix}-${j}`}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={`${keyPrefix}-${j}`}>{part}</span>
      )
    );

  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (/^[-*]\s+/.test(trimmed)) {
      return (
        <li key={i} className="ml-4 list-disc">
          {boldSplit(trimmed.replace(/^[-*]\s+/, ""), i)}
        </li>
      );
    }
    if (!trimmed) return null;
    return (
      <p key={i} className={i > 0 ? "mt-1.5" : ""}>
        {boldSplit(line, i)}
      </p>
    );
  });
};

const ChatMessageBubble = ({ message, onNavigate }) => {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2`}
    >
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-ink flex items-center justify-center shrink-0 mt-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        {message.text && (
          <div
            className={`px-4 py-2.5 text-[13px] leading-relaxed rounded-2xl ${
              isUser ? "bg-ink text-white rounded-br-sm" : "bg-white text-ink rounded-bl-sm shadow-sm"
            }`}
          >
            {renderLiteMarkdown(message.text)}
            {message.streaming && (
              <motion.span
                className="inline-block w-1 h-3.5 bg-current ml-0.5 align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.7, repeat: Infinity }}
              />
            )}
          </div>
        )}

        {message.attachments?.products?.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none" style={{ scrollbarWidth: "none" }}>
            {message.attachments.products.map((p) => (
              <ChatProductCard key={p.slug} product={p} onNavigate={onNavigate} />
            ))}
          </div>
        )}

        {message.attachments?.imageSuggestion && <ImageSuggestionCard suggestion={message.attachments.imageSuggestion} />}
      </div>
    </motion.div>
  );
};

export default ChatMessageBubble;
