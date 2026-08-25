import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Wallet, Users, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { Loader } from "../components/ui/Loader";

const Referral = () => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const { data } = await api.get("/users/referral");
        setInfo(data);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, []);

  if (loading) return <Loader />;

  const referralLink = `${window.location.origin}/register?ref=${info.referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsapp = () => {
    const text = encodeURIComponent(`${info.shareMessage} ${referralLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
      <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-2">REFER & EARN</h1>
      <p className="text-stone mb-10">Share your path. Every friend who orders earns you both wallet credit.</p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-[2rem] overflow-hidden bg-ink text-white p-8 md:p-10 mb-8"
      >
        <div className="absolute inset-0 bg-topo-dark" />
        <div className="relative">
          <p className="text-white/60 text-sm mb-2">Your referral code</p>
          <p className="font-display text-5xl tracking-widest mb-6">{info.referralCode}</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 bg-white text-ink font-semibold px-6 py-3 rounded-full hover:bg-white/90 transition-colors flex-1"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy Link"}
            </button>
            <button
              onClick={shareOnWhatsapp}
              className="flex items-center justify-center gap-2 bg-trail-500 text-white font-semibold px-6 py-3 rounded-full hover:bg-trail-600 transition-colors flex-1"
            >
              <MessageCircle className="w-4 h-4" />
              Share on WhatsApp
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-5 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl p-6 shadow-card flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold tnum">₹{info.walletBalance.toLocaleString("en-IN")}</p>
            <p className="text-xs text-stone">Wallet balance</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-card flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-trail-50 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-trail-600" />
          </div>
          <div>
            <p className="text-2xl font-bold tnum">{info.referredCount}</p>
            <p className="text-xs text-stone">Friends joined</p>
          </div>
        </motion.div>
      </div>

      <div>
        <h2 className="font-display text-xl tracking-wide mb-4">HOW IT WORKS</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { step: "01", text: "Share your unique code or link with friends" },
            { step: "02", text: "They sign up and place their first order" },
            { step: "03", text: "You both get wallet credit, automatically" },
          ].map((s) => (
            <div key={s.step} className="bg-white rounded-2xl p-5 shadow-card">
              <span className="font-display text-3xl text-trail-200">{s.step}</span>
              <p className="text-sm text-ink/70 mt-2">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {info.referredUsers?.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl tracking-wide mb-4">YOUR REFERRALS</h2>
          <div className="bg-white rounded-2xl shadow-card divide-y divide-ink/8">
            {info.referredUsers.map((u) => (
              <div key={u._id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-semibold">{u.name}</p>
                  <p className="text-xs text-stone">Joined {new Date(u.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.referralRewardGiven ? "bg-trail-50 text-trail-700" : "bg-stone/10 text-stone"}`}>
                  {u.referralRewardGiven ? "Reward earned" : "Awaiting first order"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Referral;
