"use client";
import { useQuery } from "@tanstack/react-query";
import { memberApi } from "../../lib/api/member";
import { useAuthStore } from "../../lib/stores/auth.store";
import { LoadingSpinner } from "../../components/shared/LoadingSpinner";
import { LoanArrearsModal } from "../../components/shared/LoanArrearsModal";
import { formatCurrency, formatDate } from "../../lib/utils/format";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  TrendingUp,
  Lock,
  Calendar,
  CreditCard,
  PiggyBank,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { Wallet } from "../../lib/types";

// Only re-show the overdue popup once per app session, not on every
// 60-second dashboard refetch — it's a nudge, not a nag.
const ARREARS_DISMISSED_KEY = "mutan_loan_arrears_dismissed_session";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [hideBalance, setHideBalance] = useState(false);
  const [showArrearsModal, setShowArrearsModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => memberApi.getDashboard(),
    refetchInterval: 60_000,
  });

  const { data: loanStatusData } = useQuery({
    queryKey: ["loan-status"],
    queryFn: () => memberApi.getLoanStatus(),
  });
  const loanStatus = loanStatusData?.data?.data ?? loanStatusData?.data;
  const overdueLoans = (loanStatus?.loans ?? []).filter(
    (l: any) => l.is_overdue,
  );

  useEffect(() => {
    if (
      loanStatus?.has_overdue_loan &&
      !sessionStorage.getItem(ARREARS_DISMISSED_KEY)
    ) {
      setShowArrearsModal(true);
    }
  }, [loanStatus?.has_overdue_loan]);

  const dismissArrearsModal = () => {
    setShowArrearsModal(false);
    sessionStorage.setItem(ARREARS_DISMISSED_KEY, "1");
  };

  const dash = data?.data?.data ?? data?.data;

  if (isLoading)
    return (
      <div>
        <div className="wallet-card mx-4 mt-14 p-6 h-48 animate-pulse opacity-60" />
        <LoadingSpinner />
      </div>
    );

  const wallets: Wallet[] = dash?.wallets ?? [];
  const normalSavings = wallets.find((w) => w.is_compulsory);
  const otherWallets = wallets.filter((w) => !w.is_compulsory);

  return (
    <div className="pb-6">
      <LoanArrearsModal
        open={showArrearsModal}
        onClose={dismissArrearsModal}
        loans={overdueLoans}
      />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-14 pb-4">
        <div>
          <p className="text-xs text-gray-400">Assalamu Alaikum</p>
          <h1
            className="text-lg font-semibold"
            style={{
              color: "var(--charcoal)",
              fontFamily: "Playfair Display, serif",
            }}
          >
            {user?.full_name?.split(" ")[0]} 🌙
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <p
            className="text-xs px-2.5 py-1 rounded-full font-mono"
            style={{
              background: "var(--forest-light)",
              color: "var(--forest)",
            }}
          >
            {dash?.mutan_id ?? user?.mutan_id}
          </p>
          <Link
            href="/profile"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
            style={{ background: "var(--gold)" }}
          >
            {user?.full_name?.charAt(0)}
          </Link>
        </div>
      </div>

      {/* Main wallet card */}
      <div className="wallet-card mx-4 p-6 mb-4">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-white/60 text-xs mb-1">
              Total Cooperative Balance
            </p>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold text-white">
                {hideBalance
                  ? "₦ ••••••"
                  : formatCurrency(dash?.total_balance ?? 0)}
              </p>
              <button
                onClick={() => setHideBalance(!hideBalance)}
                className="text-white/60 hover:text-white"
              >
                {hideBalance ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs">Available</p>
            <p className="text-sm font-semibold text-white/90">
              {hideBalance
                ? "••••"
                : formatCurrency(dash?.available_for_cashout ?? 0)}
            </p>
          </div>
        </div>

        {/* Normal savings bar */}
        {normalSavings && (
          <div>
            <div className="flex justify-between text-xs text-white/60 mb-1.5">
              <span>{normalSavings.scheme_name}</span>
              <span>
                {hideBalance ? "••••" : formatCurrency(normalSavings.balance)}
              </span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/70 rounded-full"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3 px-4 mb-5">
        {[
          { label: "Savings", href: "/savings", icon: PiggyBank },
          { label: "Loans", href: "/loans", icon: CreditCard },
          { label: "Invest", href: "/investments", icon: TrendingUp },
          { label: "Pay", href: "/payments", icon: Bell },
        ].map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="card-sm flex flex-col items-center gap-1.5 py-3 hover:shadow-md transition-shadow"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--forest-light)" }}
            >
              <Icon size={18} style={{ color: "var(--forest)" }} />
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: "var(--charcoal)" }}
            >
              {label}
            </span>
          </Link>
        ))}
      </div>

      {/* Scheme wallets */}
      {otherWallets.length > 0 && (
        <div className="px-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2
              className="font-semibold text-sm"
              style={{ color: "var(--charcoal)" }}
            >
              Your Schemes
            </h2>
            <Link
              href="/savings"
              className="text-xs"
              style={{ color: "var(--forest)" }}
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {otherWallets.slice(0, 3).map((w) => (
              <div key={w.scheme_id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{w.scheme_name}</p>
                      {w.lock_until && (
                        <Lock size={12} className="text-gray-400" />
                      )}
                    </div>
                    {w.next_payout_date && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Calendar size={10} /> Payout:{" "}
                        {formatDate(w.next_payout_date)}
                      </p>
                    )}
                  </div>
                  <p
                    className="text-sm font-bold"
                    style={{ color: "var(--forest)" }}
                  >
                    {hideBalance ? "••••" : formatCurrency(w.balance)}
                  </p>
                </div>
                {w.target_amount && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{w.progress_percent}% of goal</span>
                      <span>
                        {hideBalance ? "••••" : formatCurrency(w.target_amount)}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(100, parseFloat(w.progress_percent ?? "0"))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions teaser */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2
            className="font-semibold text-sm"
            style={{ color: "var(--charcoal)" }}
          >
            Recent Activity
          </h2>
          <Link
            href="/savings#transactions"
            className="text-xs flex items-center gap-1"
            style={{ color: "var(--forest)" }}
          >
            See all <ChevronRight size={12} />
          </Link>
        </div>
        <RecentTransactions hideBalance={hideBalance} />
      </div>
    </div>
  );
}

function RecentTransactions({ hideBalance }: { hideBalance: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["transactions", 1, 5],
    queryFn: () => memberApi.getTransactions({ page: 1, limit: 5 }),
  });

  const txs = data?.data?.data?.data ?? data?.data?.data ?? [];

  if (isLoading) return <div className="h-24 card animate-pulse" />;

  if (!txs.length)
    return (
      <div className="card p-4 text-center text-xs text-gray-400">
        No transactions yet. Your activity will appear here.
      </div>
    );

  const txColor = (type: string) =>
    type.includes("debit") ? "#991b1b" : "#0F5132";
  const txSign = (type: string) => (type.includes("debit") ? "-" : "+");

  return (
    <div className="card overflow-hidden">
      {txs.map((tx: any, i: number) => (
        <div
          key={tx.id}
          className={`flex items-center justify-between px-4 py-3 ${i < txs.length - 1 ? "border-b" : ""}`}
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: tx.type.includes("debit")
                  ? "#fee2e2"
                  : "var(--forest-light)",
              }}
            >
              <TrendingUp size={14} style={{ color: txColor(tx.type) }} />
            </div>
            <div>
              <p className="text-xs font-medium">
                {tx.scheme_name ?? tx.type.replace(/_/g, " ")}
              </p>
              <p className="text-xs text-gray-400">
                {tx.month_label ?? new Date(tx.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <p
            className="text-sm font-semibold"
            style={{ color: txColor(tx.type) }}
          >
            {txSign(tx.type)}
            {hideBalance ? "••••" : formatCurrency(tx.amount)}
          </p>
        </div>
      ))}
    </div>
  );
}
