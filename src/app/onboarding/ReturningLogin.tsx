import { authApi } from "../../lib/api/auth";
import { Step } from "../../types/steps";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface IReturningLogin {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  showPw: boolean;
  setShowPw: React.Dispatch<React.SetStateAction<boolean>>;
  setAuth: any;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  startResendTimer: () => void;
  phone: string;
}
export default function ReturningLogin({
  loading,
  password,
  setAuth,
  setLoading,
  setPassword,
  setShowPw,
  showPw,
  setStep,
  startResendTimer,
  phone,
}: IReturningLogin) {
  const router = useRouter();
  // ── STEP 3b: Returning member login ─────────────────────────────────────
  const handleLogin = async () => {
    if (!password) {
      toast.error("Enter your password");
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.login({ phone_number: phone, password });
      const payload = data.data ?? data;
      setAuth(payload.member);
      toast.success(`Welcome back, ${payload.member.full_name.split(" ")[0]}!`);
      router.push("/dashboard");
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };
  // ── FORGOT PASSWORD ──────────────────────────────────────────────────────
  const handleForgotRequest = async () => {
    if (!phone) {
      toast.error("Enter your phone number");
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(phone);
      startResendTimer();
      setStep("forgot-otp");
      toast.success("OTP sent");
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Welcome Back
        </h2>
        <p className="text-sm text-gray-400">
          Enter your password to access your account.
        </p>
      </div>
      <div>
        <label className="block text-xs font-medium mb-2">Password</label>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="input-field pr-12"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <button
        onClick={handleLogin}
        disabled={loading}
        className="btn-primary flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          "Sign In"
        )}
      </button>
      <button
        onClick={() => {
          setStep("forgot-otp");
          handleForgotRequest();
        }}
        className="w-full text-center text-sm"
        style={{ color: "var(--forest)" }}
      >
        Forgot password?
      </button>
    </div>
  );
}
