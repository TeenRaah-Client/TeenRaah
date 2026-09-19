import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";

const AdminSettings = () => {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState("idle"); // idle | setup | disable
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [secret, setSecret] = useState(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/admin/2fa/setup");
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setSecret(data.secret);
      setStep("setup");
    } catch (err) {
      toast.error(err.message || "Could not start setup");
    } finally {
      setLoading(false);
    }
  };

  const confirmSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/admin/2fa/confirm", { code });
      toast.success("Two-factor authentication enabled");
      await refreshUser();
      setStep("idle");
      setCode("");
    } catch (err) {
      toast.error(err.message || "Incorrect code");
    } finally {
      setLoading(false);
    }
  };

  const confirmDisable = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/admin/2fa/disable", { code });
      toast.success("Two-factor authentication disabled");
      await refreshUser();
      setStep("idle");
      setCode("");
    } catch (err) {
      toast.error(err.message || "Incorrect code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl tracking-wide mb-8">SETTINGS</h1>

      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${user?.totpEnabled ? "bg-trail-50 text-trail-600" : "bg-stone/10 text-stone"}`}>
            {user?.totpEnabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="font-semibold text-sm">Two-Factor Authentication</h2>
            <p className="text-xs text-stone mt-0.5">
              {user?.totpEnabled
                ? "Enabled — a code from your authenticator app is required at login."
                : "Add an authenticator-app code as a second step at login, on top of your password."}
            </p>
          </div>
        </div>

        {step === "idle" && (
          <Button variant={user?.totpEnabled ? "outline" : "dark"} onClick={user?.totpEnabled ? () => setStep("disable") : startSetup} loading={loading}>
            {user?.totpEnabled ? "Disable 2FA" : "Enable 2FA"}
          </Button>
        )}

        <AnimatePresence>
          {step === "setup" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="pt-5 mt-5 border-t border-ink/8">
                <p className="text-sm font-semibold mb-3">1. Scan this with Google Authenticator, Authy, or similar</p>
                {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="2FA QR code" className="w-40 h-40 rounded-lg border border-ink/10 mb-3" />}
                <p className="text-xs text-stone mb-4">
                  Can't scan? Enter this code manually: <code className="bg-paper px-1.5 py-0.5 rounded font-mono">{secret}</code>
                </p>

                <p className="text-sm font-semibold mb-2">2. Enter the 6-digit code it shows</p>
                <form onSubmit={confirmSetup} className="flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500 tnum tracking-widest"
                  />
                  <Button type="submit" variant="dark" loading={loading}>Confirm</Button>
                  <Button type="button" variant="ghost" onClick={() => setStep("idle")}>Cancel</Button>
                </form>
              </div>
            </motion.div>
          )}

          {step === "disable" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="pt-5 mt-5 border-t border-ink/8">
                <p className="text-sm font-semibold mb-2">Enter your current authenticator code to confirm</p>
                <form onSubmit={confirmDisable} className="flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500 tnum tracking-widest"
                  />
                  <Button type="submit" variant="danger" loading={loading}>Disable</Button>
                  <Button type="button" variant="ghost" onClick={() => setStep("idle")}>Cancel</Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminSettings;
