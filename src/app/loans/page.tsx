"use client";
export const dynamic = 'force-dynamic';
import { useQuery } from "@tanstack/react-query";
import { loansApi } from "../../lib/api/loans";
import { memberApi } from "../../lib/api/member";
import { PageHeader } from "../../components/layout/PageHeader";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { LoadingSpinner } from "../../components/shared/LoadingSpinner";
import { EmptyState } from "../../components/shared/EmptyState";
import { formatCurrency, formatDate } from "../../lib/utils/format";
import {
  CreditCard,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import type { Loan } from "../../lib/types";

export default function LoansPage() {
  const { data: activeData } = useQuery({
    queryKey: ["active-loan"],
    queryFn: () => loansApi.getActiveLoan(),
  });
  const { data: allData, isLoading } = useQuery({
    queryKey: ["my-loans"],
    queryFn: () => loansApi.getMyLoans(),
  });
  const { data: loanStatusData } = useQuery({
    queryKey: ["loan-status"],
    queryFn: () => memberApi.getLoanStatus(),
  });

  const activeLoan = activeData?.data?.data ?? activeData?.data;
  const loans: Loan[] = allData?.data?.data ?? allData?.data ?? [];
  const loanStatus = loanStatusData?.data?.data ?? loanStatusData?.data;
  const overdue = (loanStatus?.loans ?? []).find((l: any) => l.is_overdue);

  return (
    <div>
      <PageHeader title="Loans" subtitle="Qard Hasan — interest-free" />
      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* Qard Hasan banner */}
        <div
          className="p-4 rounded-2xl text-sm"
          style={{ background: "var(--forest-light)", color: "var(--forest)" }}
        >
          <p className="font-semibold mb-0.5">🕌 Qard Hasan Loans</p>
          <p className="text-xs text-gray-600">
            All MUTAN loans are interest-free (Riba-free) in accordance with
            Islamic financial principles. You repay exactly what you borrow.
          </p>
        </div>

        {/* Overdue arrears banner */}
        {overdue && (
          <div
            className="p-4 rounded-2xl text-sm"
            style={{ background: "#fee2e2" }}
          >
            <p
              className="font-semibold mb-1 flex items-center gap-1.5"
              style={{ color: "#991b1b" }}
            >
              <AlertTriangle size={14} /> Repayment Behind Schedule
            </p>
            <p className="text-xs text-gray-600 mb-3">
              You're {overdue.months_elapsed} month(s) in, with{" "}
              <strong>{formatCurrency(overdue.amount_in_arrears)}</strong> owed
              beyond what's been deducted so far.
            </p>
            <div className="flex gap-2">
              <Link
                href="/payments?action=pay-direct&type=loan_repayment"
                className="btn-primary flex-1 text-center text-xs! py-2!"
              >
                Pay Direct
              </Link>
              <Link
                href="/payments?action=declare&type=loan_repayment"
                className="btn-secondary flex-1 text-center text-xs! py-2!"
              >
                Declare Payment
              </Link>
            </div>
          </div>
        )}

        {/* Active loan card(s) — a member can hold more than one concurrently */}
        {activeLoan?.has_active_loan &&
          activeLoan.loans?.map((loan: any) => (
            <div key={loan.id} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Active Loan</h3>
                <StatusBadge status="active" />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  {
                    label: "Principal",
                    value: formatCurrency(loan.principal_amount),
                  },
                  {
                    label: "Outstanding",
                    value: formatCurrency(loan.outstanding_balance),
                  },
                  {
                    label: "Monthly",
                    value: formatCurrency(loan.monthly_repayment),
                  },
                  { label: "Due Date", value: formatDate(loan.due_date) },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="p-3 rounded-xl"
                    style={{ background: "var(--forest-light)" }}
                  >
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--forest)" }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Repayment progress */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Repayment progress</span>
                  <span>
                    {(
                      ((loan.principal_amount - loan.outstanding_balance) /
                        loan.principal_amount) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${((loan.principal_amount - loan.outstanding_balance) / loan.principal_amount) * 100}%`,
                      background:
                        loan.outstanding_balance === 0
                          ? "#16a34a"
                          : "var(--forest)",
                    }}
                  />
                </div>
              </div>

              <div
                className="mt-4 p-3 rounded-xl text-xs flex gap-2"
                style={{ background: "#fef9c3", color: "#854d0e" }}
              >
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <p>
                  To repay this loan, use <strong>Pay Direct</strong> on the
                  Payments tab for an instant card/transfer payment, or declare
                  a bank transfer for admin to verify.
                </p>
              </div>
            </div>
          ))}

        {/* No active loan */}
        {activeLoan && !activeLoan.has_active_loan && (
          <div className="card p-5 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--forest-light)" }}
            >
              <CheckCircle size={20} style={{ color: "var(--forest)" }} />
            </div>
            <div>
              <p className="text-sm font-medium">No Active Loan</p>
              <p className="text-xs text-gray-400">
                To apply for a Qard Hasan loan, contact the Financial Secretary.
              </p>
            </div>
          </div>
        )}

        {/* Loan history */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <h3
              className="font-semibold text-sm pt-2"
              style={{ color: "var(--charcoal)" }}
            >
              Loan History
            </h3>
            {loans.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No loan history"
                description="Your loan records will appear here."
              />
            ) : (
              <div className="card overflow-hidden">
                {loans.map((loan, i) => (
                  <div
                    key={loan.id}
                    className={`p-4 ${i < loans.length - 1 ? "border-b" : ""}`}
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold">
                          {formatCurrency(loan.principal_amount)}
                        </p>
                        {loan.purpose && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {loan.purpose}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={loan.status} />
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>
                        Outstanding: {formatCurrency(loan.outstanding_balance)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} /> {formatDate(loan.due_date)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="progress-bar" style={{ height: 4 }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${parseFloat(loan.repayment_percent)}%`,
                            background:
                              loan.status === "fully_paid"
                                ? "#16a34a"
                                : loan.status === "defaulted"
                                  ? "#991b1b"
                                  : "var(--forest)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
