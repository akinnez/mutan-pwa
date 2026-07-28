"use client";
import { useState } from "react";
import { authApi } from "../../lib/api/auth";
import { useAuthStore } from "../../lib/stores/auth.store";
import toast from "react-hot-toast";
import { Shield, ChevronLeft } from "lucide-react";
import Login from "./Login";
import { Step } from "../../types/steps";
import FirstTime from "./FirstTime";
import ReturningLogin from "./ReturningLogin";
import OTP from "./OTP";
import ForgotPasswordOTP from "./ForgotPasswordOTP";
import ForgotReset from "./ForgotReset";
import { formatToNigeriaInternational } from "../../lib/utils/format";

export default function OnboardingPage() {
  const { setAuth, setSetupToken, setupToken, onboardingPhone } =
    useAuthStore();

  const [step, setStep] = useState<Step>("identify");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isFirstTime, setIsFirstTime] = useState(false);

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const [forgotOtp, setForgotOtp] = useState(["", "", "", "", "", ""]);

  const [forgotSetupToken, setForgotSetupToken] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);

  // Countdown for OTP resend
  const startResendTimer = () => {
    setResendSeconds(60);
    const iv = setInterval(() => {
      setResendSeconds((s) => {
        if (s <= 1) {
          clearInterval(iv);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendSeconds > 0) return;
    setLoading(true);
    try {
      if (step === "forgot-otp")
        await authApi.forgotPassword(formatToNigeriaInternational(phone));
      else
        await authApi.requestOtp(
          formatToNigeriaInternational(phone),
          isFirstTime,
        );
      startResendTimer();
      toast.success("OTP resent");
    } catch (e: any) {
      toast.error("Resend failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen justify-center items-center flex flex-col px-5 md:px-0"
      style={{ background: "var(--forest)" }}
    >
      <div className="w-full md:max-w-md flex flex-col rounded-lg glass-card ">
        {/* Header */}
        <div className="flex flex-col gap-3 px-5  p-6">
          {step !== "identify" && step !== "login" && (
            <button
              onClick={() => {
                if (step === "otp") setStep("identify");
                else if (step === "setup") setStep("otp");
                else if (step === "forgot-otp") {
                  setStep("login");
                  setForgotOtp(["", "", "", "", "", ""]);
                } else if (step === "forgot-reset") setStep("forgot-otp");
              }}
              className="p-1.5 rounded-xl hover:bg-gray-100 flex items-center gap-3 text-xs font-bold cursor-pointer"
            >
              <ChevronLeft size={16} style={{ color: "var(--charcoal)" }} />{" "}
              Back
            </button>
          )}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "var(--forest)" }}
            >
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <p
                className="font-bold text-sm leading-relaxed"
                style={{ color: "var(--forest)" }}
              >
                MUTAN Cooperative
              </p>
              <p className="text-base text-gray-400">Member Portal</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-5 pb-8">
          {/* ── IDENTIFY ─────────────────────────────────────────────────── */}
          {step === "identify" && (
            <Login
              idNumber={idNumber}
              setIdNumber={setIdNumber}
              phone={phone}
              setPhone={setPhone}
              setSetupToken={setSetupToken}
              loading={loading}
              setLoading={setLoading}
              setStep={setStep}
              startResendTimer={startResendTimer}
              setIsFirstTime={setIsFirstTime}
            />
          )}

          {/* ── OTP ──────────────────────────────────────────────────────── */}
          {step === "otp" && (
            <OTP
              handleResend={handleResend}
              loading={loading}
              phone={phone}
              resendSeconds={resendSeconds}
              setLoading={setLoading}
              setSetupToken={setSetupToken}
              setStep={setStep}
            />
          )}

          {/* ── FIRST-TIME SETUP ─────────────────────────────────────────── */}
          {step === "setup" && (
            <FirstTime
              loading={loading}
              password={password}
              setAuth={setAuth}
              setLoading={setLoading}
              setPassword={setPassword}
              setShowPw={setShowPw}
              setupToken={setupToken}
              showPw={showPw}
            />
          )}

          {/* ── RETURNING LOGIN ───────────────────────────────────────────── */}
          {step === "login" && (
            <ReturningLogin
              loading={loading}
              password={password}
              phone={phone}
              setAuth={setAuth}
              setLoading={setLoading}
              setPassword={setPassword}
              setShowPw={setShowPw}
              setStep={setStep}
              showPw={showPw}
              startResendTimer={startResendTimer}
            />
          )}

          {/* ── FORGOT OTP ────────────────────────────────────────────────── */}
          {step === "forgot-otp" && (
            <ForgotPasswordOTP
              forgotOtp={forgotOtp}
              handleResend={handleResend}
              loading={loading}
              phone={phone}
              resendSeconds={resendSeconds}
              setForgotOtp={setForgotOtp}
              setForgotSetupToken={setForgotSetupToken}
              setLoading={setLoading}
              setStep={setStep}
            />
          )}

          {/* ── FORGOT RESET ──────────────────────────────────────────────── */}
          {step === "forgot-reset" && (
            <ForgotReset
              forgotSetupToken={forgotSetupToken}
              loading={loading}
              setLoading={setLoading}
              setPassword={setPassword}
              setStep={setStep}
            />
          )}
        </div>
      </div>
    </div>
  );
}
