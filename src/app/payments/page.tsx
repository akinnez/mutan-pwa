"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { memberApi } from "../../lib/api/member";
import { useAuthStore } from "../../lib/stores/auth.store";
import { PageHeader } from "../../components/layout/PageHeader";
import { BottomSheet } from "../../components/shared/BottomSheet";
import { ConfirmDialog } from "../../components/shared/ConfirmDialog";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { LoadingSpinner } from "../../components/shared/LoadingSpinner";
import { EmptyState } from "../../components/shared/EmptyState";
import {
  formatCurrency,
  formatDateTime,
  paymentTypeLabel,
} from "../../lib/utils/format";
import toast from "react-hot-toast";
import { Receipt, Plus, Upload, ExternalLink, Info, Zap } from "lucide-react";
import type { ManualPayment } from "../../lib/types";

const PAYMENT_TYPES = [
  { value: "subscription_payment", label: "Monthly Subscription" },
  { value: "loan_repayment", label: "Loan Repayment" },
  { value: "wallet_topup", label: "Wallet Top-up" },
];

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: Record<string, any>) => { openIframe: () => void };
    };
  }
}

function PaymentsPageInner() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const searchParams = useSearchParams();

  const [showDeclare, setShowDeclare] = useState(false);
  const [showPayDirect, setShowPayDirect] = useState(false);
  const [confirmingDeclare, setConfirmingDeclare] = useState(false);
  const [confirmingPayDirect, setConfirmingPayDirect] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    payment_type: "subscription_payment",
    declared_amount: "",
    bank_reference: "",
    month_label: "",
    is_directed: false,
    target_scheme_id: "",
    target_loan_id: "",
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [payDirectForm, setPayDirectForm] = useState({
    payment_type: "subscription_payment" as
      | "subscription_payment"
      | "loan_repayment"
      | "wallet_topup",
    amount: "",
    is_directed: false,
    target_scheme_id: "",
    target_loan_id: "",
  });

  // Arrived here from the dashboard's overdue-loan popup — open the right
  // sheet with the right payment type already selected.
  useEffect(() => {
    const action = searchParams.get("action");
    const type = searchParams.get("type");
    if (action === "pay-direct") {
      setPayDirectForm((f) => ({
        ...f,
        payment_type: (type as any) ?? f.payment_type,
      }));
      setShowPayDirect(true);
    } else if (action === "declare") {
      setForm((f) => ({ ...f, payment_type: type ?? f.payment_type }));
      setShowDeclare(true);
    }
  }, [searchParams]);

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["my-payments"],
    queryFn: () => memberApi.getPayments(),
  });
  const payments: ManualPayment[] =
    paymentsData?.data?.data ?? paymentsData?.data ?? [];

  const { data: schemesData } = useQuery({
    queryKey: ["schemes"],
    queryFn: () => memberApi.getSchemes(),
    enabled:
      (showDeclare && form.payment_type === "wallet_topup") ||
      (showPayDirect && payDirectForm.payment_type === "wallet_topup"),
  });
  const schemes = schemesData?.data?.data ?? schemesData?.data ?? [];

  const { data: loanData } = useQuery({
    queryKey: ["active-loan"],
    queryFn: () =>
      memberApi.getActiveLoan
        ? memberApi.getActiveLoan()
        : Promise.resolve(null),
    enabled:
      (showDeclare && form.payment_type === "loan_repayment") ||
      (showPayDirect && payDirectForm.payment_type === "loan_repayment"),
  });
  const activeLoan = loanData?.data?.data ?? loanData?.data;

  // A member can now hold more than one concurrent active loan — default
  // both forms to the first one whenever the list loads, but let the
  // member change it via the picker below if there's more than one.
  useEffect(() => {
    if (activeLoan?.loans?.length) {
      const firstId = activeLoan.loans[0].id;
      setForm((f) =>
        f.target_loan_id ? f : { ...f, target_loan_id: firstId },
      );
      setPayDirectForm((f) =>
        f.target_loan_id ? f : { ...f, target_loan_id: firstId },
      );
    }
  }, [activeLoan]);

  // ── Manual declare ─────────────────────────────────────────────────────
  const declareMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("payment_type", form.payment_type);
      fd.append("declared_amount", form.declared_amount);
      fd.append("bank_reference", form.bank_reference);
      if (form.month_label) fd.append("month_label", form.month_label);
      fd.append("is_directed", String(form.is_directed));
      if (form.is_directed && form.target_scheme_id)
        fd.append("target_scheme_id", form.target_scheme_id);
      if (
        form.payment_type === "loan_repayment" &&
        (form.target_loan_id || activeLoan?.loan?.id)
      ) {
        fd.append("target_loan_id", form.target_loan_id || activeLoan.loan.id);
      }
      if (receiptFile) fd.append("receipt", receiptFile);
      return memberApi.declarePayment(fd);
    },
    onSuccess: () => {
      toast.success(
        "Payment declared — admin will verify within 2 working days",
      );
      qc.invalidateQueries({ queryKey: ["my-payments"] });
      setShowDeclare(false);
      setConfirmingDeclare(false);
      setForm({
        payment_type: "subscription_payment",
        declared_amount: "",
        bank_reference: "",
        month_label: "",
        is_directed: false,
        target_scheme_id: "",
        target_loan_id: "",
      });
      setReceiptFile(null);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Declaration failed");
      setConfirmingDeclare(false);
    },
  });

  const canSubmit =
    form.declared_amount &&
    form.bank_reference &&
    (form.payment_type !== "wallet_topup" ||
      !form.is_directed ||
      form.target_scheme_id);

  // ── Pay Direct (Paystack) ───────────────────────────────────────────────
  const initializeMutation = useMutation({
    mutationFn: () =>
      memberApi.initializePaystack({
        payment_type: payDirectForm.payment_type,
        amount: parseFloat(payDirectForm.amount),
        is_directed:
          payDirectForm.payment_type === "wallet_topup"
            ? payDirectForm.is_directed
            : undefined,
        target_scheme_id:
          payDirectForm.payment_type === "wallet_topup" &&
          payDirectForm.is_directed
            ? payDirectForm.target_scheme_id
            : undefined,
        target_loan_id:
          payDirectForm.payment_type === "loan_repayment"
            ? payDirectForm.target_loan_id || activeLoan?.loan?.id
            : undefined,
        month_label: new Date().toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
      }),
    onSuccess: (res) => {
      const { reference } = res.data?.data ?? res.data;
      launchPaystackPopup(reference);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Could not start payment");
      setConfirmingPayDirect(false);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (reference: string) => memberApi.verifyPaystack(reference),
    onSuccess: () => {
      toast.success("Payment received — your account has been credited");
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["my-payments"] });
      qc.invalidateQueries({ queryKey: ["loan-status"] });
      setShowPayDirect(false);
      setConfirmingPayDirect(false);
      setPayDirectForm({
        payment_type: "subscription_payment",
        amount: "",
        is_directed: false,
        target_scheme_id: "",
        target_loan_id: "",
      });
    },
    onError: () => {
      toast.error(
        "Payment may still be processing — check back shortly, or contact the admin with your reference.",
      );
      setConfirmingPayDirect(false);
    },
  });

  function launchPaystackPopup(reference: string) {
    if (!window.PaystackPop) {
      toast.error(
        "Payment widget failed to load — check your connection and try again.",
      );
      setConfirmingPayDirect(false);
      return;
    }
    const email = user?.email || `${user?.mutan_id}@mutan.coop`;
    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email,
      amount: Math.round(parseFloat(payDirectForm.amount) * 100), // kobo
      ref: reference,
      currency: "NGN",
      callback: (response: { reference: string }) => {
        verifyMutation.mutate(response.reference);
      },
      onClose: () => {
        setConfirmingPayDirect(false);
        toast("Payment cancelled", { icon: "ℹ️" });
      },
    });
    handler.openIframe();
  }

  const canPayDirect =
    payDirectForm.amount &&
    parseFloat(payDirectForm.amount) > 0 &&
    (payDirectForm.payment_type !== "wallet_topup" ||
      !payDirectForm.is_directed ||
      payDirectForm.target_scheme_id) &&
    (payDirectForm.payment_type !== "loan_repayment" ||
      activeLoan?.has_active_loan);

  const payDirectBusy =
    initializeMutation.isPending || verifyMutation.isPending;

  const currentMonth = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Manual payments"
        action={
          <div className="flex justify-end mt-2 gap-x-2.5">
            <button
              onClick={() => setShowPayDirect(true)}
              className="btn-ghost flex items-center py-1.5! px-2.5! text-xs! font-bold! gap-x-1! cursor-pointer "
            >
              <Zap size={14} /> Pay Direct
            </button>

            <button
              onClick={() => setShowDeclare(true)}
              className="btn-ghost flex items-center py-1.5! px-2.5! text-xs! font-bold! gap-x-1! cursor-pointer"
            >
              <Plus size={14} /> Declare Payment
            </button>
          </div>
        }
      />

      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* How it works */}
        <div
          className="p-4 rounded-2xl text-xs"
          style={{ background: "var(--forest-light)", color: "var(--forest)" }}
        >
          <p className="font-semibold mb-1 flex items-center gap-1.5">
            <Info size={13} /> Two ways to pay
          </p>
          <ol className="space-y-1 text-gray-600 list-decimal list-inside">
            <li>
              <strong>Pay Direct</strong> — pay instantly by card or bank
              transfer via Paystack. Credited immediately.
            </li>
            <li>
              <strong>Declare Payment</strong> — already transferred to the
              cooperative's bank account? Report it here with your reference,
              and admin verifies within 2 working days.
            </li>
          </ol>
        </div>

        {/* Payment history */}
        {isLoading ? (
          <LoadingSpinner />
        ) : payments.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No payment declarations"
            description="Tap Pay Direct for an instant payment, or Declare Payment to report a manual bank transfer."
          />
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {paymentTypeLabel[p.payment_type] ?? p.payment_type}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Ref: <span className="font-mono">{p.bank_reference}</span>
                    </p>
                    {p.month_label && (
                      <p className="text-xs text-gray-400">
                        Month: {p.month_label}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      className="text-base font-bold mb-1"
                      style={{ color: "var(--forest)" }}
                    >
                      {formatCurrency(p.declared_amount)}
                    </p>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
                {p.status === "approved" && p.verified_amount && (
                  <p className="text-xs" style={{ color: "var(--forest)" }}>
                    ✓ Verified: {formatCurrency(p.verified_amount)} — posted to
                    your account
                  </p>
                )}
                {p.status === "rejected" && p.rejection_reason && (
                  <p className="text-xs text-red-600">
                    ✗ Rejected: {p.rejection_reason}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {formatDateTime(p.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pay Direct Sheet ──────────────────────────────────────────────── */}
      <BottomSheet
        open={showPayDirect}
        onClose={() => setShowPayDirect(false)}
        title="Pay Direct"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-2">
              What are you paying for?
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PAYMENT_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() =>
                    setPayDirectForm((f) => ({
                      ...f,
                      payment_type: pt.value as any,
                      is_directed: false,
                      target_scheme_id: "",
                    }))
                  }
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm text-left transition-all"
                  style={{
                    borderColor:
                      payDirectForm.payment_type === pt.value
                        ? "var(--forest)"
                        : "#e2e8f0",
                    background:
                      payDirectForm.payment_type === pt.value
                        ? "var(--forest-light)"
                        : "#fff",
                    color:
                      payDirectForm.payment_type === pt.value
                        ? "var(--forest)"
                        : "var(--charcoal)",
                  }}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${payDirectForm.payment_type === pt.value ? "border-forest-900" : "border-gray-300"}`}
                    style={
                      payDirectForm.payment_type === pt.value
                        ? {
                            borderColor: "var(--forest)",
                            background: "var(--forest)",
                          }
                        : {}
                    }
                  >
                    {payDirectForm.payment_type === pt.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white m-auto mt-0.5" />
                    )}
                  </div>
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {payDirectForm.payment_type === "wallet_topup" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium">
                  Direct to specific scheme?
                </label>
                <button
                  onClick={() =>
                    setPayDirectForm((f) => ({
                      ...f,
                      is_directed: !f.is_directed,
                      target_scheme_id: "",
                    }))
                  }
                  className={`w-10 h-5 rounded-full transition-colors relative ${payDirectForm.is_directed ? "bg-forest-900" : "bg-gray-200"}`}
                  style={
                    payDirectForm.is_directed
                      ? { background: "var(--forest)" }
                      : {}
                  }
                >
                  <span
                    className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform shadow-sm ${payDirectForm.is_directed ? "translate-x-5" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
              {payDirectForm.is_directed && (
                <select
                  value={payDirectForm.target_scheme_id}
                  onChange={(e) =>
                    setPayDirectForm((f) => ({
                      ...f,
                      target_scheme_id: e.target.value,
                    }))
                  }
                  className="input-field"
                >
                  <option value="">Select scheme…</option>
                  {schemes
                    .filter((s: any) => !s.is_compulsory)
                    .map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              )}
            </div>
          )}

          {payDirectForm.payment_type === "loan_repayment" &&
            activeLoan?.has_active_loan &&
            activeLoan.loans.length > 1 && (
              <div>
                <label className="block text-xs font-medium mb-2">
                  Which loan?
                </label>
                <select
                  value={payDirectForm.target_loan_id}
                  onChange={(e) =>
                    setPayDirectForm((f) => ({
                      ...f,
                      target_loan_id: e.target.value,
                    }))
                  }
                  className="input-field"
                >
                  {activeLoan.loans.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      Outstanding {formatCurrency(l.outstanding_balance)} — due{" "}
                      {l.due_date}
                    </option>
                  ))}
                </select>
              </div>
            )}
          {payDirectForm.payment_type === "loan_repayment" &&
            activeLoan?.has_active_loan && (
              <div
                className="p-3 rounded-xl text-xs"
                style={{
                  background: "var(--forest-light)",
                  color: "var(--forest)",
                }}
              >
                Repaying loan — Outstanding:{" "}
                <strong>
                  {formatCurrency(
                    (
                      activeLoan.loans.find(
                        (l: any) => l.id === payDirectForm.target_loan_id,
                      ) ?? activeLoan.loan
                    ).outstanding_balance,
                  )}
                </strong>
              </div>
            )}
          {payDirectForm.payment_type === "loan_repayment" &&
            !activeLoan?.has_active_loan && (
              <div
                className="p-3 rounded-xl text-xs"
                style={{ background: "#fee2e2", color: "#991b1b" }}
              >
                No active loan found. Contact the admin if you believe this is
                an error.
              </div>
            )}

          <div>
            <label className="block text-xs font-medium mb-2">
              Amount to Pay (₦) *
            </label>
            <input
              type="number"
              value={payDirectForm.amount}
              onChange={(e) =>
                setPayDirectForm((f) => ({ ...f, amount: e.target.value }))
              }
              placeholder="e.g. 45000"
              className="input-field"
            />
          </div>

          <p className="text-xs text-gray-400">
            You'll be taken to a secure Paystack checkout to pay by card, bank
            transfer, or USSD. Your account is credited immediately on success.
          </p>

          <button
            onClick={() => setConfirmingPayDirect(true)}
            disabled={!canPayDirect || payDirectBusy}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {payDirectBusy ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Zap size={16} /> Continue to Pay{" "}
                {payDirectForm.amount
                  ? formatCurrency(parseFloat(payDirectForm.amount))
                  : ""}
              </>
            )}
          </button>
        </div>
      </BottomSheet>

      {/* ── Declare Payment Sheet ─────────────────────────────────────────── */}
      <BottomSheet
        open={showDeclare}
        onClose={() => {
          setShowDeclare(false);
          setReceiptFile(null);
        }}
        title="Declare Payment"
      >
        <div className="space-y-4">
          {/* Payment type */}
          <div>
            <label className="block text-xs font-medium mb-2">
              Payment Type
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PAYMENT_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      payment_type: pt.value,
                      is_directed: false,
                      target_scheme_id: "",
                    }))
                  }
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm text-left transition-all"
                  style={{
                    borderColor:
                      form.payment_type === pt.value
                        ? "var(--forest)"
                        : "#e2e8f0",
                    background:
                      form.payment_type === pt.value
                        ? "var(--forest-light)"
                        : "#fff",
                    color:
                      form.payment_type === pt.value
                        ? "var(--forest)"
                        : "var(--charcoal)",
                  }}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${form.payment_type === pt.value ? "border-forest-900" : "border-gray-300"}`}
                    style={
                      form.payment_type === pt.value
                        ? {
                            borderColor: "var(--forest)",
                            background: "var(--forest)",
                          }
                        : {}
                    }
                  >
                    {form.payment_type === pt.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white m-auto mt-0.5" />
                    )}
                  </div>
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Directed top-up toggle */}
          {form.payment_type === "wallet_topup" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium">
                  Direct to specific scheme?
                </label>
                <button
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      is_directed: !f.is_directed,
                      target_scheme_id: "",
                    }))
                  }
                  className={`w-10 h-5 rounded-full transition-colors relative ${form.is_directed ? "bg-forest-900" : "bg-gray-200"}`}
                  style={
                    form.is_directed ? { background: "var(--forest)" } : {}
                  }
                >
                  <span
                    className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform shadow-sm ${form.is_directed ? "translate-x-5" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
              {form.is_directed && (
                <select
                  value={form.target_scheme_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, target_scheme_id: e.target.value }))
                  }
                  className="input-field"
                >
                  <option value="">Select scheme…</option>
                  {schemes
                    .filter((s: any) => !s.is_compulsory)
                    .map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              )}
            </div>
          )}

          {/* Active loan notice */}
          {form.payment_type === "loan_repayment" &&
            activeLoan?.has_active_loan &&
            activeLoan.loans.length > 1 && (
              <div>
                <label className="block text-xs font-medium mb-2">
                  Which loan?
                </label>
                <select
                  value={form.target_loan_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, target_loan_id: e.target.value }))
                  }
                  className="input-field"
                >
                  {activeLoan.loans.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      Outstanding {formatCurrency(l.outstanding_balance)} — due{" "}
                      {l.due_date}
                    </option>
                  ))}
                </select>
              </div>
            )}
          {form.payment_type === "loan_repayment" &&
            activeLoan?.has_active_loan && (
              <div
                className="p-3 rounded-xl text-xs"
                style={{
                  background: "var(--forest-light)",
                  color: "var(--forest)",
                }}
              >
                Repaying loan — Outstanding:{" "}
                <strong>
                  {formatCurrency(
                    (
                      activeLoan.loans.find(
                        (l: any) => l.id === form.target_loan_id,
                      ) ?? activeLoan.loan
                    ).outstanding_balance,
                  )}
                </strong>
              </div>
            )}
          {form.payment_type === "loan_repayment" &&
            !activeLoan?.has_active_loan && (
              <div
                className="p-3 rounded-xl text-xs"
                style={{ background: "#fee2e2", color: "#991b1b" }}
              >
                No active loan found. Contact the admin if you believe this is
                an error.
              </div>
            )}

          {/* Amount and reference */}
          <div>
            <label className="block text-xs font-medium mb-2">
              Amount Transferred (₦) *
            </label>
            <input
              type="number"
              value={form.declared_amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, declared_amount: e.target.value }))
              }
              placeholder="e.g. 45000"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-2">
              Bank Transfer Reference *
            </label>
            <input
              type="text"
              value={form.bank_reference}
              onChange={(e) =>
                setForm((f) => ({ ...f, bank_reference: e.target.value }))
              }
              placeholder="e.g. TRF2026010512345"
              className="input-field font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">
              Find this on your bank receipt or transfer confirmation.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium mb-2">
              Month (optional)
            </label>
            <input
              type="text"
              value={form.month_label}
              onChange={(e) =>
                setForm((f) => ({ ...f, month_label: e.target.value }))
              }
              placeholder={`e.g. ${currentMonth}`}
              className="input-field"
            />
          </div>

          {/* Receipt upload */}
          <div>
            <label className="block text-xs font-medium mb-2">
              Receipt / Proof (optional)
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors"
              style={{ borderColor: receiptFile ? "var(--forest)" : "#e2e8f0" }}
            >
              <Upload
                size={20}
                className="mx-auto mb-2"
                style={{ color: receiptFile ? "var(--forest)" : "#cbd5e1" }}
              />
              <p
                className="text-sm"
                style={{ color: receiptFile ? "var(--forest)" : "#94a3b8" }}
              >
                {receiptFile ? receiptFile.name : "Tap to upload receipt"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                JPG, PNG or PDF · Max 10MB
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <button
            onClick={() => setConfirmingDeclare(true)}
            disabled={!canSubmit || declareMutation.isPending}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {declareMutation.isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Receipt size={16} /> Submit Declaration
              </>
            )}
          </button>
        </div>
      </BottomSheet>

      {/* ── Confirmation dialogs ──────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmingDeclare}
        onClose={() => setConfirmingDeclare(false)}
        onConfirm={() => declareMutation.mutate()}
        title="Submit this declaration?"
        message={`You're declaring a payment of ${form.declared_amount ? formatCurrency(parseFloat(form.declared_amount)) : ""} with reference "${form.bank_reference}". Admin will verify this against the bank statement before it's posted to your account.`}
        confirmLabel="Yes, Submit"
        loading={declareMutation.isPending}
      />

      <ConfirmDialog
        open={confirmingPayDirect}
        onClose={() => setConfirmingPayDirect(false)}
        onConfirm={() => initializeMutation.mutate()}
        title="Proceed to payment?"
        message={`You'll be taken to a secure Paystack checkout to pay ${payDirectForm.amount ? formatCurrency(parseFloat(payDirectForm.amount)) : ""}. Continue?`}
        confirmLabel="Yes, Continue"
        loading={initializeMutation.isPending}
      />
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentsPageInner />
    </Suspense>
  );
}
