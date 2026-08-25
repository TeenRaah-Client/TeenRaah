import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err.data?.requiresVerification) {
        toast("Please verify your email first", { icon: "📧" });
        navigate("/verify-otp", { state: { email: err.data.email } });
        return;
      }
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow={<>WELCOME BACK TO THE PATH</>}
      subtitle="Pick up right where you left off — your bag, addresses and orders are all here."
      title="LOG IN"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-ink/15 text-sm outline-none focus:border-trail-500"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            required
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
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

        <Button type="submit" variant="dark" size="lg" className="w-full" loading={loading}>
          Log In
        </Button>
      </form>

      <p className="text-sm text-stone mt-6 text-center">
        New to TeenRaah?{" "}
        <Link to="/register" className="text-trail-600 font-semibold">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
