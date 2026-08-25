import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Lock, Mail, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";

const AdminLogin = ({ adminPath }) => {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin({ email, password });
      navigate(adminPath, { replace: true });
    } catch (err) {
      toast.error(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-white flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-topo-dark" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm bg-white/[0.04] backdrop-blur border border-white/10 rounded-2xl p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-amber-400/20 flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="font-display text-2xl tracking-wide">ADMIN ACCESS</h1>
          <p className="text-white/50 text-xs mt-1">Restricted — authorized personnel only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin email"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-400"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-400"
            />
          </div>

          <Button type="submit" variant="amber" size="lg" className="w-full" loading={loading}>
            Enter Control Panel
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
