import { authApi } from "../../lib/api/auth";
import { Step } from "../../types/steps";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface IForgotReset {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  forgotSetupToken: string;
  loading: boolean;
}

export default function ForgotReset({
  forgotSetupToken,
  loading,
  setLoading,
  setPassword,
  setStep,
}: IForgotReset) {
  const [newPassword, setNewPassword] = useState("");
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({
        setup_token: forgotSetupToken,
        new_password: newPassword,
      });
      toast.success("Password reset. Please log in.");
      setStep("login");
      setPassword("");
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Reset failed");
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
          New Password
        </h2>
        <p className="text-sm text-gray-400">Choose a strong new password.</p>
      </div>
      <div>
        <label className="block text-xs font-medium mb-2">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Min. 8 chars"
          className="input-field"
        />
      </div>
      <button
        onClick={handleResetPassword}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
        ) : (
          "Reset Password"
        )}
      </button>
    </div>
  );
}
