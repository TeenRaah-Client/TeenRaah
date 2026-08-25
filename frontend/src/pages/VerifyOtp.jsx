import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { MailCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

const VerifyOtp = () => {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate("/register", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    setDigits(pasted.split("").concat(Array(OTP_LENGTH).fill("")).slice(0, OTP_LENGTH));
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length !== OTP_LENGTH) {
      toast.error("Enter the full 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      await verifyOtp({ email, otp });
      toast.success("Email verified! Welcome to TeenRaah 🎉");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Invalid or expired code");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtp(email);
      toast.success("New code sent");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      toast.error(err.message || "Could not resend code");
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <AuthLayout
      eyebrow={<>ALMOST THERE</>}
      subtitle="One quick step keeps your account secure and makes sure order updates actually reach you."
      title="VERIFY YOUR EMAIL"
    >
      <div className="flex items-center gap-2 text-sm text-stone mb-6 mt-2">
        <MailCheck className="w-4 h-4 text-trail-600 shrink-0" />
        Code sent to <span className="font-semibold text-ink">{email}</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-2 mb-6" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <motion.input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              inputMode="numeric"
              maxLength={1}
              className="w-full aspect-square text-center text-xl font-bold rounded-xl border-2 border-ink/15 outline-none focus:border-trail-500"
            />
          ))}
        </div>

        <Button type="submit" variant="dark" size="lg" className="w-full" loading={verifying}>
          Verify Email
        </Button>
      </form>

      <div className="text-sm text-stone mt-6 text-center">
        {cooldown > 0 ? (
          <span>Resend code in {cooldown}s</span>
        ) : (
          <button onClick={handleResend} disabled={resending} className="text-trail-600 font-semibold">
            {resending ? "Sending…" : "Resend code"}
          </button>
        )}
      </div>

      <p className="text-xs text-stone mt-4 text-center">
        Wrong email?{" "}
        <Link to="/register" className="text-trail-600 font-semibold">
          Start over
        </Link>
      </p>
    </AuthLayout>
  );
};

export default VerifyOtp;
