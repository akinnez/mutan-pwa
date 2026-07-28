import { authApi } from "../../lib/api/auth";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

interface IFirstTime {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  showPw: boolean;
  setShowPw: React.Dispatch<React.SetStateAction<boolean>>;
  setAuth: any;
  setupToken: string | null;
}

export default function FirstTime({
  setLoading,
  loading,
  password,
  setPassword,
  showPw,
  setShowPw,
  setAuth,
  setupToken,
}: IFirstTime) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ── STEP 3a: First-time setup ────────────────────────────────────────────
  const handleSetup = async () => {
    if (!password || !pin) {
      toast.error("Enter password and PIN");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      toast.error("Password must include uppercase, lowercase, and a number");
      return;
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.setupCredentials({
        setup_token: setupToken!,
        password,
        pin,
      });
      const payload = data.data ?? data;
      setAuth(payload.member);
      toast.success("Account set up! Welcome to MUTAN Cooperative.");
      router.push("/dashboard");
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Setup failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-2.5">
      <div>
        <h2
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Set Up Account
        </h2>
        <p className="text-sm text-gray-400">
          Create your login password and a 4-digit transaction PIN. Keep your
          PIN private — it authorises financial actions.
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-2">Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 chars, uppercase, lowercase, number"
              className="input-field pr-12"
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
        <div>
          <label className="block text-xs font-medium mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-2">
            4-Digit Transaction PIN
          </label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="e.g. 1234"
            className="input-field tracking-[0.5em] text-center text-xl"
          />
          <p className="text-xs text-gray-400 mt-1">
            You'll enter this PIN to authorise payouts and declarations.
          </p>
        </div>
      </div>
      <button
        onClick={handleSetup}
        disabled={loading}
        className="btn-primary flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          "Create Account"
        )}
      </button>
    </div>
  );
}
