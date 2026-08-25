import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, Gift } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    referralCode: searchParams.get("ref") || "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created! Check your email for a verification code.");
      navigate("/verify-otp", { state: { email: form.email } });
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow={<>EVERY PATH STARTS WITH ONE STEP</>}
      subtitle="Create an account to save addresses, track orders in real time, and unlock referral rewards."
      title="CREATE ACCOUNT"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            required
            value={form.name}
            onChange={update("name")}
            placeholder="Full name"
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            required
            type="email"
            value={form.email}
            onChange={update("email")}
            placeholder="Email address"
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
          />
        </div>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            value={form.phone}
            onChange={update("phone")}
            placeholder="Phone number"
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            required
            minLength={6}
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={update("password")}
            placeholder="Password (min. 6 characters)"
            className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="relative">
          <Gift className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            value={form.referralCode}
            onChange={(e) => setForm((f) => ({ ...f, referralCode: e.target.value.toUpperCase() }))}
            placeholder="Referral code (optional)"
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500 uppercase"
          />
        </div>

        <Button type="submit" variant="dark" size="lg" className="w-full" loading={loading}>
          Create Account
        </Button>
      </form>

      <p className="text-sm text-stone mt-6 text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-trail-600 font-semibold">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
