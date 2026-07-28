import { useRef } from "react";
import OtpGrid from "./OTPGrid";
import toast from "react-hot-toast";
import { Step } from "../../types/steps";
import { authApi } from "../../lib/api/auth";
import { formatToNigeriaInternational } from "../../lib/utils/format";

interface IForgotOTP {
  forgotOtp: Array<string>;
  phone: string;
  resendSeconds: number;
  loading: boolean;
  handleResend: () => void;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setForgotSetupToken: React.Dispatch<React.SetStateAction<any>>;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  setForgotOtp: React.Dispatch<React.SetStateAction<Array<string>>>;
}
export default function ForgotPasswordOTP({
  forgotOtp,
  phone,
  resendSeconds,
  loading,
  handleResend,
  setForgotOtp,
  setForgotSetupToken,
  setLoading,
  setStep,
}: IForgotOTP) {
  const forgotOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleForgotOtpConfirm = async () => {
    const otpStr = forgotOtp.join("");
    if (otpStr.length < 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.confirmOtp({
        phone_number: formatToNigeriaInternational(phone),
        otp: otpStr,
      });
      const payload = data.data ?? data;
      setForgotSetupToken(payload.setup_token);
      setStep("forgot-reset");
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Invalid OTP");
      setForgotOtp(["", "", "", "", "", ""]);
      forgotOtpRefs.current[0]?.focus();
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
          Reset Password
        </h2>
        <p className="text-sm text-gray-400">
          Enter the OTP sent to your phone.
        </p>
      </div>
      <OtpGrid
        values={forgotOtp}
        setValues={setForgotOtp}
        refs={forgotOtpRefs}
      />
      <button
        onClick={handleForgotOtpConfirm}
        disabled={loading || forgotOtp.join("").length < 6}
        className="btn-primary"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
        ) : (
          "Verify OTP"
        )}
      </button>
      <p className="text-center text-sm text-gray-400">
        <button
          onClick={handleResend}
          disabled={resendSeconds > 0}
          className="font-medium"
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
