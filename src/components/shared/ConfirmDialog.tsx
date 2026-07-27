"use client";
import { useEffect } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
}

// Centered confirmation prompt — used before any action that's destructive,
// irreversible, or commits to a recurring financial obligation (exiting a
// scheme, pausing contributions, changing a monthly amount, joining a
// scheme, submitting a payment declaration, logging out).
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Yes, Continue",
  cancelLabel = "Cancel",
  variant = "primary",
  loading,
}: Props) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const Icon = variant === "danger" ? AlertTriangle : HelpCircle;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-5">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />
      <div className="relative bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background:
              variant === "danger" ? "#fee2e2" : "var(--forest-light)",
          }}
        >
          <Icon
            size={22}
            style={{
              color: variant === "danger" ? "#991b1b" : "var(--forest)",
            }}
          />
        </div>
        <h3
          className="font-semibold text-base mb-1.5"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          {title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={variant === "danger" ? "btn-danger" : "btn-primary"}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
