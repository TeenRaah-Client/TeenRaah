import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { User, Mail, Phone, LogOut, Wallet, Gift } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Button from "../components/ui/Button";

const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/users/me", { name, phone });
      await refreshUser();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-10">
      <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-8">MY PROFILE</h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 shadow-card flex items-center gap-3">
          <Wallet className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="font-bold tnum">₹{user?.walletBalance?.toLocaleString("en-IN") || 0}</p>
            <p className="text-xs text-stone">Wallet Balance</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-white rounded-2xl p-5 shadow-card flex items-center gap-3">
          <Gift className="w-5 h-5 text-trail-600 shrink-0" />
          <div>
            <p className="font-bold">{user?.referralCode}</p>
            <p className="text-xs text-stone">Referral Code</p>
          </div>
        </motion.div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 shadow-card space-y-4">
        <h2 className="font-display text-lg tracking-wide mb-2">ACCOUNT DETAILS</h2>

        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            value={user?.email || ""}
            disabled
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-ink/10 text-sm bg-paper text-stone"
          />
        </div>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
          />
        </div>

        <Button type="submit" variant="dark" loading={saving}>
          Save Changes
        </Button>
      </form>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm font-semibold text-rose mt-8 mx-auto"
      >
        <LogOut className="w-4 h-4" /> Log Out
      </button>
    </div>
  );
};

export default Profile;
