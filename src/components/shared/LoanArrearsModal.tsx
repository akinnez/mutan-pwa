"use client";
import { useRouter } from "next/navigation";
import { AlertCircle, X } from "lucide-react";
import { formatCurrency } from "../../lib/utils/format";

interface LoanArrearsInfo {
  loan_id: string;
  outstanding_balance: number;
  amount_in_arrears: number;
  months_elapsed: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  loans: LoanArrearsInfo[];
}

// Shown once per app open when the member has fallen behind on a loan
// repayment — loan arrears are the one thing in MUTAN that genuinely need
// proactive nagging, since other members' pooled funds are on the other
// side of that balance. Savings-scheme shortfalls don't get this treatment
// — those only affect the member themselves and roll over quietly.
export function LoanArrearsModal({ open, onClose, loans }: Props) {
  const router = useRouter();
  if (!open || loans.length === 0) return null;

  const totalArrears = loans.reduce((sum, l) => sum + l.amount_in_arrears, 0);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-gray-100 text-gray-400"
        >
          <X size={18} />
        </button>

        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "#fee2e2" }}
        >
          <AlertCircle size={22} style={{ color: "#991b1b" }} />
        </div>

        <h3
          className="font-semibold text-base mb-1.5"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Loan Repayment Overdue
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-4">
          {loans.length === 1
            ? `Your loan repayment is behind by ${loans[0].months_elapsed} month(s). A total of `
            : `Across your loans, repayments are behind schedule. A total of `}
          <span className="font-semibold" style={{ color: "#991b1b" }}>
            {formatCurrency(totalArrears)}
          </span>{" "}
          is currently owed beyond what's been deducted so far.
        </p>

        <div
          className="p-3.5 rounded-2xl mb-5"
          style={{ background: "var(--forest-light)" }}
        >
          {loans.map((l) => (
            <div key={l.loan_id} className="flex justify-between text-xs py-1">
              <span className="text-gray-500">Outstanding balance</span>
              <span
                className="font-semibold"
                style={{ color: "var(--forest)" }}
              >
                {formatCurrency(l.outstanding_balance)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => {
              onClose();
              router.push("/payments?action=pay-direct&type=loan_repayment");
            }}
            className="btn-primary"
          >
            Pay Direct Now
          </button>
          <button
            onClick={() => {
              onClose();
              router.push("/payments?action=declare&type=loan_repayment");
            }}
            className="btn-secondary"
          >
            Declare a Bank Payment
          </button>
          <button onClick={onClose} className="text-xs text-gray-400 mt-1">
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
}
