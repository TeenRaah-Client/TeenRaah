import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Mail } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("You're on the list!");
    setEmail("");
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
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
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
              <li><Link to="/shop?category=Travel+%26+Luggage" className="hover:text-white transition-colors">Travel &amp; Luggage</Link></li>
              <li><Link to="/shop?category=Wallets" className="hover:text-white transition-colors">Wallets</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">All Products</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-widest2 uppercase">Account</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/orders" className="hover:text-white transition-colors">Track Order</Link></li>
              <li><Link to="/addresses" className="hover:text-white transition-colors">My Addresses</Link></li>
              <li><Link to="/referral" className="hover:text-white transition-colors">Refer &amp; Earn</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Profile</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-widest2 uppercase">Stay in the loop</h4>
            <form onSubmit={handleSubscribe} className="flex items-center bg-white/10 rounded-full pl-4 pr-1 py-1">
              <Mail className="w-4 h-4 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="bg-transparent outline-none text-sm px-2 py-1.5 w-full placeholder:text-white/40"
              />
              <button type="submit" className="bg-trail-500 text-white text-xs font-semibold px-3.5 py-2 rounded-full shrink-0">
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/50">
          <span>© {new Date().getFullYear()} TeenRaah. All rights reserved.</span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white/80">Privacy Policy</a>
            <a href="#" className="hover:text-white/80">Terms</a>
            <a href="#" className="hover:text-white/80">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
