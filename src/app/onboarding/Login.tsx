import { authApi } from "../../lib/api/auth";
import { Step } from "../../types/steps";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface IOnboardingVerify {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  setSetupToken: any;
  phone: string;
  setPhone: React.Dispatch<React.SetStateAction<string>>;
  idNumber: string;
  loading: boolean;
  setIdNumber: React.Dispatch<React.SetStateAction<string>>;
  startResendTimer: () => void;
}

function Login({
  idNumber,
  setIdNumber,
  phone,
  setSetupToken,
  loading,
  setPhone,
  setLoading,
  setStep,
  startResendTimer,
}: IOnboardingVerify) {
  const [adminWhatsapp, setAdminWhatsapp] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  // ── STEP 1: Verify identity ──────────────────────────────────────────────
  const handleVerifyIdentity = async () => {
    if (!phone || !idNumber) {
      toast.error("Enter your phone number and ID");
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.verifyIdentity({
        phone_number: phone,
        id_number: idNumber,
      });
      const payload = data.data ?? data;
      if (!payload.verified) {
        setNotFound(true);
        setAdminWhatsapp(payload.admin_whatsapp_url ?? "");
        return;
      }
      setIsFirstTime(payload.is_first_time);
      // Request OTP
      await authApi.requestOtp(phone);
      startResendTimer();
      setSetupToken("", phone);
      setStep("otp");
      toast.success(`OTP sent to ${phone.slice(0, 4)}****${phone.slice(-3)}`);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <div className="space-y-6">
        <div>
          <h2
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Welcome
          </h2>
          <p className="text-sm text-gray-400">
            Enter your registered phone number and membership ID to continue.
          </p>
        </div>

        {notFound && (
          <div
            className="p-4 rounded-2xl text-sm"
            style={{ background: "#fef2f2", color: "#991b1b" }}
          >
            <p className="font-medium mb-1">Record not found</p>
            <p className="text-xs mb-3">
              Your phone number and ID combination was not found. Please contact
              the admin to update your record.
            </p>
            {adminWhatsapp && (
              <a
                href={adminWhatsapp}
                target="_blank"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white"
                style={{ background: "#25D366" }}
              >
                Contact Admin on WhatsApp
              </a>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setNotFound(false);
              }}
              placeholder="e.g. 08012345678"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2">
              Staff ID or MUTAN ID
            </label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => {
                setIdNumber(e.target.value);
                setNotFound(false);
              }}
              placeholder="e.g. GOV/OY/2019/001 or MUTAN-2024-0001"
              className="input-field"
            />
            <p className="text-xs text-gray-400 mt-2">
              Enter either your Government Staff ID or your MUTAN membership ID.
            </p>
          </div>
        </div>

        <button
          onClick={handleVerifyIdentity}
          disabled={loading}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Continue <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Login;
