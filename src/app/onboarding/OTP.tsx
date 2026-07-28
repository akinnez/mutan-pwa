import { authApi } from "../../lib/api/auth";
import { Step } from "../../types/steps";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import OtpGrid from "./OTPGrid";
import { format } from "path";
import { formatToNigeriaInternational } from "../../lib/utils/format";

interface IOTPLogin {
  phone: string;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setSetupToken: (token: string, phone: string) => void;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  handleResend: () => void;
  resendSeconds: number;
}
export default function OTP({
  phone,
  loading,
  setLoading,
  setSetupToken,
  setStep,
  handleResend,
  resendSeconds,
}: IOTPLogin) {
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const handleConfirmOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.confirmOtp({
        phone_number: formatToNigeriaInternational(phone),
        otp: otpString,
      });
      const payload = data.data ?? data;
      setSetupToken(payload.setup_token, formatToNigeriaInternational(phone));
      if (payload.is_first_time) {
        setStep("setup");
      } else {
        setStep("login");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Invalid OTP");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
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
          Verify OTP
        </h2>
        <p className="text-sm text-gray-400">
          A 6-digit code was sent to{" "}
          <strong>
            {phone.slice(0, 4)}****{phone.slice(-3)}
          </strong>
          . Valid for 10 minutes.
        </p>
      </div>
      <OtpGrid values={otp} setValues={setOtp} refs={otpRefs} />
      <button
        onClick={handleConfirmOtp}
        disabled={loading || otp.join("").length < 6}
        className="btn-primary flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          "Verify"
        )}
      </button>
      <p className="text-center text-sm text-gray-400">
        Didn't receive it?{" "}
        <button
          onClick={handleResend}
          disabled={resendSeconds > 0}
          className="font-medium cursor-pointer"
          style={{
            color: resendSeconds > 0 ? "#9ca3af" : "var(--forest)",
          }}
        >
          {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend OTP"}
        </button>
      </p>
    </div>
  );
}
