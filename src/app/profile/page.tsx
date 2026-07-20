"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { memberApi } from "../../lib/api/member";
import { authApi } from "../../lib/api/auth";
import { useAuthStore } from "../../lib/stores/auth.store";
import { PageHeader } from "../../components/layout/PageHeader";
import { BottomSheet } from "../../components/shared/BottomSheet";
import { ConfirmDialog } from "../../components/shared/ConfirmDialog";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { LoadingSpinner } from "../../components/shared/LoadingSpinner";
import { formatDate } from "../../lib/utils/format";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Bell,
  Key,
  Lock,
  LogOut,
  ChevronRight,
  Eye,
  EyeOff,
  TrendingUp,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, logout } = useAuthStore();

  const [showChangePw, setShowChangePw] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [showPinStep, setShowPinStep] = useState<"otp" | "new-pin">("otp");
  const [pinOtp, setPinOtp] = useState("");
  const [pinSetupToken, setPinSetupToken] = useState("");
  const [newPin, setNewPin] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", new: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(user?.sms_opt_in ?? false);

  const { data, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => memberApi.getProfile(),
  });
  const profile = data?.data?.data ?? data?.data;

  const updateProfileMutation = useMutation({
    mutationFn: (d: { email?: string; sms_opt_in?: boolean }) =>
      memberApi.updateProfile(d),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message ?? "Update failed"),
  });

  const changePwMutation = useMutation({
    mutationFn: () =>
      authApi.changePassword({
        current_password: pwForm.current,
        new_password: pwForm.new,
      }),
    onSuccess: () => {
      toast.success("Password changed successfully");
      setShowChangePw(false);
      setPwForm({ current: "", new: "", confirm: "" });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  const requestPinOtpMutation = useMutation({
    mutationFn: () => authApi.requestPinResetOtp(),
    onSuccess: () => {
      setShowPinStep("otp");
      toast.success("OTP sent to your phone");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  const confirmPinOtpMutation = useMutation({
    mutationFn: () =>
      authApi.confirmOtp({
        phone_number: user?.phone_number ?? "",
        otp: pinOtp,
      }),
    onSuccess: (res) => {
      const payload = res.data?.data ?? res.data;
      setPinSetupToken(payload.setup_token);
      setShowPinStep("new-pin");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message ?? "Invalid OTP"),
  });

  const resetPinMutation = useMutation({
    mutationFn: () =>
      authApi.resetPin({ setup_token: pinSetupToken, new_pin: newPin }),
    onSuccess: () => {
      toast.success("PIN updated successfully");
      setShowChangePin(false);
      setPinOtp("");
      setNewPin("");
      setPinSetupToken("");
      setShowPinStep("otp");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    logout();
    router.push("/onboarding");
    toast.success("Logged out");
  };

  const handleChangePw = () => {
    if (pwForm.new !== pwForm.confirm) {
      setPwError("Passwords do not match");
      return;
    }
    if (pwForm.new.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }
    setPwError("");
    changePwMutation.mutate();
  };

  if (isLoading)
    return (
      <div>
        <PageHeader title="Profile" />
        <LoadingSpinner />
      </div>
    );

  const p = profile ?? user;

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your account settings" />
      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* Avatar + name */}
        <div className="card p-5 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
            style={{ background: "var(--forest)" }}
          >
            {p?.full_name?.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base">{p?.full_name}</h2>
            <p
              className="text-xs font-mono mt-0.5"
              style={{ color: "var(--forest)" }}
            >
              {p?.mutan_id}
            </p>
            <div className="mt-1">
              <StatusBadge status={p?.membership_status ?? "active"} />
            </div>
          </div>
        </div>

        {/* Member details */}
        <div className="card overflow-hidden">
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <p
              className="text-xs font-semibold"
              style={{ color: "var(--forest)" }}
            >
              MEMBER DETAILS
            </p>
          </div>
          {[
            { icon: User, label: "Staff ID", value: p?.staff_id },
            { icon: Phone, label: "Phone", value: p?.phone_number },
            { icon: Mail, label: "Email", value: p?.email ?? "Not set" },
            {
              icon: Calendar,
              label: "Date Joined",
              value: p?.date_joined ? formatDate(p.date_joined) : "—",
            },
            { icon: Shield, label: "Role", value: p?.role?.replace(/_/g, " ") },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center px-4 py-3 border-b last:border-0"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center mr-3 flex-shrink-0"
                style={{ background: "var(--forest-light)" }}
              >
                <Icon size={15} style={{ color: "var(--forest)" }} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium capitalize">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* SMS opt-in */}
        <div className="card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "var(--forest-light)" }}
            >
              <Bell size={15} style={{ color: "var(--forest)" }} />
            </div>
            <div>
              <p className="text-sm font-medium">SMS Notifications</p>
              <p className="text-xs text-gray-400">
                ~₦50/month deducted from Normal Savings
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const next = !smsOptIn;
              setSmsOptIn(next);
              updateProfileMutation.mutate({ sms_opt_in: next });
            }}
            className={`w-12 h-6 rounded-full transition-colors relative ${smsOptIn ? "" : "bg-gray-200"}`}
            style={smsOptIn ? { background: "var(--forest)" } : {}}
          >
            <span
              className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform shadow-sm ${smsOptIn ? "translate-x-6" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        {/* Investments */}
        <div className="card overflow-hidden">
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="text-xs font-semibold" style={{ color: "var(--forest)" }}>
              INVESTMENTS
            </p>
          </div>
          <button
            onClick={() => router.push("/investments")}
            className="w-full flex items-center px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center mr-3"
              style={{ background: "var(--forest-light)" }}
            >
              <TrendingUp size={15} style={{ color: "var(--forest)" }} />
            </div>
            <div className="flex-1 text-left">
              <span className="text-sm font-medium block">My Investments</span>
              <span className="text-xs text-gray-400">View rounds, returns and investment history</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </div>

        {/* Security */}
        <div className="card overflow-hidden">
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <p
              className="text-xs font-semibold"
              style={{ color: "var(--forest)" }}
            >
              SECURITY
            </p>
          </div>
          {[
            {
              icon: Key,
              label: "Change Password",
              action: () => setShowChangePw(true),
            },
            {
              icon: Lock,
              label: "Change Transaction PIN",
              action: () => {
                setShowChangePin(true);
                requestPinOtpMutation.mutate();
              },
            },
          ].map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              className="w-full flex items-center px-4 py-3.5 border-b last:border-0 hover:bg-gray-50 transition-colors"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center mr-3"
                style={{ background: "var(--forest-light)" }}
              >
                <Icon size={15} style={{ color: "var(--forest)" }} />
              </div>
              <span className="flex-1 text-sm font-medium text-left">
                {label}
              </span>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl border transition-colors hover:bg-red-50"
          style={{ borderColor: "#fee2e2" }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "#fee2e2" }}
          >
            <LogOut size={15} style={{ color: "#991b1b" }} />
          </div>
          <span className="text-sm font-medium" style={{ color: "#991b1b" }}>
            Sign Out
          </span>
        </button>

        <ConfirmDialog
          open={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
          title="Sign out?"
          message="Are you sure you want to sign out of your MUTAN account?"
          confirmLabel="Yes, Sign Out"
          variant="danger"
        />

        {/* App info */}
        <p className="text-center text-xs text-gray-400">
          MUTAN Cooperative Member Portal · v1.0.0
        </p>
      </div>

      {/* Change Password Sheet */}
      <BottomSheet
        open={showChangePw}
        onClose={() => {
          setShowChangePw(false);
          setPwForm({ current: "", new: "", confirm: "" });
          setPwError("");
        }}
        title="Change Password"
      >
        <div className="space-y-4">
          {[
            { label: "Current Password", key: "current" },
            { label: "New Password", key: "new" },
            { label: "Confirm New Password", key: "confirm" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-2">{label}</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={(pwForm as any)[key]}
                  onChange={(e) =>
                    setPwForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  className="input-field pr-12"
                />
                {key === "current" && (
                  <button
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          {pwError && <p className="text-xs text-red-600">{pwError}</p>}
          <button
            onClick={handleChangePw}
            disabled={
              !pwForm.current || !pwForm.new || changePwMutation.isPending
            }
            className="btn-primary flex items-center justify-center gap-2"
          >
            {changePwMutation.isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Update Password"
            )}
          </button>
        </div>
      </BottomSheet>

      {/* Change PIN Sheet */}
      <BottomSheet
        open={showChangePin}
        onClose={() => {
          setShowChangePin(false);
          setPinOtp("");
          setNewPin("");
          setShowPinStep("otp");
        }}
        title="Change Transaction PIN"
      >
        <div className="space-y-4">
          {showPinStep === "otp" && (
            <>
              <p className="text-sm text-gray-600">
                {requestPinOtpMutation.isPending
                  ? "Sending OTP to your phone…"
                  : `Enter the OTP sent to ${user?.phone_number?.slice(0, 4)}****${user?.phone_number?.slice(-3)}`}
              </p>
              <div>
                <label className="block text-xs font-medium mb-2">
                  6-Digit OTP
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinOtp}
                  onChange={(e) =>
                    setPinOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="••••••"
                  className="input-field text-center text-xl tracking-widest"
                />
              </div>
              <button
                disabled={pinOtp.length < 6 || confirmPinOtpMutation.isPending}
                onClick={() => confirmPinOtpMutation.mutate()}
                className="btn-primary flex items-center justify-center gap-2"
              >
                {confirmPinOtpMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Verify OTP"
                )}
              </button>
            </>
          )}

          {showPinStep === "new-pin" && (
            <>
              <p className="text-sm text-gray-600">
                Enter your new 4-digit transaction PIN. Keep it private.
              </p>
              <div>
                <label className="block text-xs font-medium mb-2">
                  New 4-Digit PIN
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) =>
                    setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="••••"
                  className="input-field text-center text-2xl tracking-[0.5em]"
                />
              </div>
              <button
                disabled={newPin.length !== 4 || resetPinMutation.isPending}
                onClick={() => resetPinMutation.mutate()}
                className="btn-primary flex items-center justify-center gap-2"
              >
                {resetPinMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Set New PIN"
                )}
              </button>
            </>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
