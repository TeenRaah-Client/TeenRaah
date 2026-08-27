import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, Compass } from "lucide-react";
import { streamChatMessage } from "../../api/chatApi";
import { useAuth } from "../../context/AuthContext";
import ChatMessageBubble from "./ChatMessageBubble";
import TypingIndicator from "./TypingIndicator";

const QUICK_REPLIES = [
  "Recommend a backpack for me",
  "Where's my order?",
  "What's your return policy?",
  "Design me a custom bag",
];

let idCounter = 0;
const nextId = () => `msg_${Date.now()}_${idCounter++}`;

const ChatWidget = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  const scrollRef = useRef(null);
  const abortRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setHasOpenedOnce(true);
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMsg = { id: nextId(), role: "user", text: trimmed };
      const assistantMsg = { id: nextId(), role: "assistant", text: "", attachments: null, streaming: true };

      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.text }));

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      await streamChatMessage(history, {
        signal: controller.signal,
        onDelta: (delta) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsg.id ? { ...m, text: m.text + delta } : m))
          );
        },
        onAttachments: (attachments) => {
          setMessages((prev) => (prev.map((m) => (m.id === assistantMsg.id ? { ...m, attachments } : m))));
        },
        onDone: () => {
          setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? { ...m, streaming: false } : m)));
          setIsStreaming(false);
        },
        onError: (message) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, text: m.text || message || "Something went wrong — please try again.", streaming: false }
                : m
            )
          );
          setIsStreaming(false);
        },
      });
    },
    [messages, isStreaming]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? "Close TeenRaah Assistant" : "Open TeenRaah Assistant"}
        className="fixed bottom-5 right-5 z-[70] w-14 h-14 rounded-full bg-ink text-white shadow-lift flex items-center justify-center"
      >
        {!hasOpenedOnce && (
          <motion.span
            className="absolute inset-0 rounded-full bg-trail-400"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-5 h-5" />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="w-5 h-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed bottom-24 right-5 z-[70] w-[calc(100vw-2.5rem)] max-w-[380px] h-[min(600px,calc(100vh-140px))] bg-paper rounded-2xl shadow-lift overflow-hidden flex flex-col border border-ink/10"
          >
            {/* Header */}
            <div className="relative bg-ink text-white px-4 py-3.5 flex items-center gap-3 shrink-0">
              <div className="absolute inset-0 bg-topo-dark pointer-events-none" />
              <div className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="relative flex-1 min-w-0">
                <p className="font-display text-sm tracking-wide leading-none">TEENRAAH ASSISTANT</p>
                <p className="text-[10px] text-white/50 mt-1">Find Your Path</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center px-4 pt-4">
                  <div className="w-12 h-12 rounded-full bg-trail-50 flex items-center justify-center mx-auto mb-3">
                    <Compass className="w-5 h-5 text-trail-600" />
                  </div>
                  <p className="text-sm font-semibold text-ink mb-1">
                    {user ? `Hi ${user.name.split(" ")[0]}, how can I help?` : "Hi! How can I help you today?"}
                  </p>
                  <p className="text-xs text-stone mb-4">Ask about products, orders, or describe a bag you're imagining.</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {QUICK_REPLIES.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-[11px] font-medium bg-white border border-ink/10 rounded-full px-3 py-1.5 hover:border-trail-400 hover:text-trail-600 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <ChatMessageBubble key={m.id} message={m} onNavigate={() => setOpen(false)} />
              ))}

              {isStreaming && messages[messages.length - 1]?.text === "" && <TypingIndicator />}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-ink/8 bg-white flex items-center gap-2 shrink-0">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about bags, orders, returns…"
                disabled={isStreaming}
                className="flex-1 px-3.5 py-2.5 rounded-full border border-ink/12 text-sm outline-none focus:border-trail-500 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center shrink-0 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
