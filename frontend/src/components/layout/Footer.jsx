import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Mail, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const { data } = await api.post("/subscribers", { email: trimmed, source: "footer" });
      toast.success(data.message || "You're on the list!");
      setSubscribed(true);
      setEmail("");
    } catch (err) {
      toast.error(err.message || "Please enter a valid email address");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-ink text-white/80 relative overflow-hidden">
      <div className="absolute inset-0 bg-topo-dark pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 relative">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="TeenRaah" className="h-9 w-9 rounded-lg" />
              <span className="font-display text-xl text-white tracking-wide">TEENRAAH</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Bags, backpacks and travel gear built for wherever you're headed next. Every path starts somewhere —
              yours starts here.
            </p>
            <div className="flex gap-3 mt-5">
              {[
                { Icon: Instagram, label: "Instagram" },
                { Icon: Facebook, label: "Facebook" },
                { Icon: Twitter, label: "Twitter" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#top"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-widest2 uppercase">Shop</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/shop?category=Backpacks" className="hover:text-white transition-colors">Backpacks</Link></li>
              <li><Link to="/shop?category=Office+Bags" className="hover:text-white transition-colors">Office Bags</Link></li>
              <li><Link to="/shop?category=Travel+%26+Luggage" className="hover:text-white transition-colors">Travel &amp; Luggage</Link></li>
              <li><Link to="/shop?category=Wallets" className="hover:text-white transition-colors">Wallets</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">All Products</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-widest2 uppercase">Account</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/orders" className="hover:text-white transition-colors">Track Order</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition-colors">Wishlist</Link></li>
              <li><Link to="/compare" className="hover:text-white transition-colors">Compare Bags</Link></li>
              <li><Link to="/addresses" className="hover:text-white transition-colors">My Addresses</Link></li>
              <li><Link to="/referral" className="hover:text-white transition-colors">Refer &amp; Earn</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Profile</Link></li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="text-white font-semibold text-sm mb-4 tracking-widest2 uppercase">Stay in the loop</h4>
            <p className="text-xs text-white/60 mb-3">Weekly drops, restock alerts &amp; early access.</p>
            {subscribed ? (
              <div className="flex items-center gap-2 rounded-2xl bg-trail-500/20 border border-trail-400/30 px-4 py-3 text-xs text-white">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>You're subscribed to TeenRaah drops.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-center bg-white/10 rounded-full pl-4 pr-1 py-1">
                <Mail className="w-4 h-4 shrink-0 text-white/60" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  aria-label="Email for newsletter"
                  className="bg-transparent outline-none text-sm px-2 py-1.5 w-full placeholder:text-white/40 text-white"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-trail-500 hover:bg-trail-400 text-white text-xs font-semibold px-3.5 py-2 rounded-full shrink-0 transition-colors disabled:opacity-50"
                >
                  {submitting ? "…" : "Join"}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/50">
          <span>© {new Date().getFullYear()} TeenRaah. All rights reserved.</span>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-white/80">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white/80">Terms</Link>
            <Link to="/shipping-returns" className="hover:text-white/80">Shipping &amp; Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
