"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memberApi } from "../../lib/api/member";
import { PageHeader } from "../../components/layout/PageHeader";
import { BottomSheet } from "../../components/shared/BottomSheet";
import { ConfirmDialog } from "../../components/shared/ConfirmDialog";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { LoadingSpinner } from "../../components/shared/LoadingSpinner";
import { EmptyState } from "../../components/shared/EmptyState";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  txColor,
  txSign,
  txIconName,
  dayGroupLabel,
} from "../../lib/utils/format";
import toast from "react-hot-toast";
import {
  PiggyBank,
  Lock,
  Calendar,
  ChevronRight,
  Pause,
  Play,
  Plus,
  LogOut,
  LogIn,
  TrendingUp,
  Repeat,
  Banknote,
  Receipt,
  Gift,
  PieChart,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronLeft,
} from "lucide-react";
import type { Scheme, Subscription, Transaction } from "../../lib/types";

const TX_ICONS: Record<string, any> = {
  Repeat,
  Banknote,
  LogIn,
  LogOut,
  Receipt,
  Gift,
  PieChart,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
};

type ConfirmKind = "exit" | "pause" | "amount" | "join";

export default function SavingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "wallets" | "transactions" | "schemes"
  >("wallets");
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [joinAmount, setJoinAmount] = useState("");
  const [pauseReason, setPauseReason] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [txPage, setTxPage] = useState(1);
  const [txSchemeFilter, setTxSchemeFilter] = useState("");
  const [confirming, setConfirming] = useState<ConfirmKind | null>(null);

  const { data: dashData } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => memberApi.getDashboard(),
  });
  const dash = dashData?.data?.data ?? dashData?.data;
  const wallets = dash?.wallets ?? [];

  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => memberApi.getSubscriptions(),
    enabled: activeTab === "wallets",
  });
  const subscriptions: Subscription[] =
    subsData?.data?.data ?? subsData?.data ?? [];

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["transactions", txPage, txSchemeFilter],
    queryFn: () =>
      memberApi.getTransactions({
        page: txPage,
        limit: 20,
        scheme_id: txSchemeFilter || undefined,
      }),
    enabled: activeTab === "transactions",
  });
  const transactions: Transaction[] =
    txData?.data?.data?.data ?? txData?.data?.data ?? [];
  const txTotal = txData?.data?.data?.total ?? 0;
  const txTotalPages = txData?.data?.data?.total_pages ?? 1;

  const { data: schemesData, isLoading: schemesLoading } = useQuery({
    queryKey: ["schemes"],
    queryFn: () => memberApi.getSchemes(),
    enabled: activeTab === "schemes",
  });
  const schemes: Scheme[] = schemesData?.data?.data ?? schemesData?.data ?? [];

  // Group the current page's transactions by day — "Today" / "Yesterday" /
  // a full date — instead of one flat undifferentiated list.
  const groupedTransactions = transactions.reduce(
    (groups: Record<string, Transaction[]>, tx) => {
      const label = dayGroupLabel(tx.created_at);
      if (!groups[label]) groups[label] = [];
      groups[label].push(tx);
      return groups;
    },
    {},
  );

  const handleSchemeFilterChange = (value: string) => {
    setTxSchemeFilter(value);
    setTxPage(1);
  };

  const updateSubMutation = useMutation({
    mutationFn: ({ schemeId, data }: { schemeId: string; data: any }) =>
      memberApi.updateSubscription(schemeId, data),
    onSuccess: () => {
      toast.success("Subscription updated");
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setSelectedSub(null);
      setPauseReason("");
      setNewAmount("");
      setConfirming(null);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Update failed");
      setConfirming(null);
    },
  });

  const joinMutation = useMutation({
    mutationFn: ({ schemeId, amount }: { schemeId: string; amount: number }) =>
      memberApi.joinScheme(schemeId, amount),
    onSuccess: () => {
      toast.success("Joined scheme successfully");
      qc.invalidateQueries({ queryKey: ["schemes"] });
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setSelectedScheme(null);
      setJoinAmount("");
      setConfirming(null);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to join");
      setConfirming(null);
    },
  });

  const exitMutation = useMutation({
    mutationFn: (schemeId: string) => memberApi.exitScheme(schemeId),
    onSuccess: (res) => {
      const r = res.data?.data ?? res.data;
      toast.success(
        r.message ?? "Exited scheme — balance moved to Normal Savings",
      );
      qc.invalidateQueries({ queryKey: ["schemes"] });
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setSelectedSub(null);
      setConfirming(null);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Exit failed");
      setConfirming(null);
    },
  });

  const tabs = [
    { key: "wallets", label: "My Wallets" },
    { key: "transactions", label: "Transactions" },
    { key: "schemes", label: "Browse Schemes" },
  ] as const;

  return (
    <div>
      <PageHeader title="Savings" subtitle="Your cooperative savings" />

      {/* Tabs */}
      <div
        className="flex px-4 pt-3 pb-0 gap-2 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`pb-2.5 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? "border-forest-900 text-forest-900" : "border-transparent text-gray-400"}`}
            style={
              activeTab === t.key
                ? { borderColor: "var(--forest)", color: "var(--forest)" }
                : {}
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 pb-6 space-y-3">
        {/* ── WALLETS TAB ── */}
        {activeTab === "wallets" &&
          (subsLoading ? (
            <LoadingSpinner />
          ) : subscriptions.length === 0 ? (
            <EmptyState
              icon={PiggyBank}
              title="No subscriptions yet"
              description="Browse schemes to join savings plans."
            />
          ) : (
            subscriptions.map((sub) => {
              const wallet = wallets.find(
                (w: any) => w.scheme_id === sub.scheme_id,
              );
              return (
                <div key={sub.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">
                          {sub.scheme?.name}
                        </p>
                        {sub.scheme?.lock_until && (
                          <Lock size={12} className="text-gray-400" />
                        )}
                        {sub.is_paused && (
                          <span className="badge-yellow px-2 py-0.5 rounded-full text-xs">
                            Paused
                          </span>
                        )}
                      </div>
                      {sub.scheme?.next_payout_date && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Calendar size={10} /> Payout:{" "}
                          {formatDate(sub.scheme.next_payout_date)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className="text-base font-bold"
                        style={{ color: "var(--forest)" }}
                      >
                        {formatCurrency(wallet?.balance ?? 0)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatCurrency(sub.monthly_amount)}/mo
                      </p>
                    </div>
                  </div>

                  {wallet?.target_amount && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{wallet.progress_percent}% of goal</span>
                        <span>{formatCurrency(wallet.target_amount)}</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(100, parseFloat(wallet.progress_percent ?? "0"))}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedSub(sub);
                      setNewAmount(String(sub.monthly_amount));
                    }}
                    className="text-xs flex items-center gap-1 mt-1"
                    style={{ color: "var(--forest)" }}
                  >
                    Manage <ChevronRight size={12} />
                  </button>
                </div>
              );
            })
          ))}

        {/* ── TRANSACTIONS TAB ── */}
        {activeTab === "transactions" && (
          <div className="space-y-3">
            {/* Scheme filter */}
            {wallets.length > 1 && (
              <select
                value={txSchemeFilter}
                onChange={(e) => handleSchemeFilterChange(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">All Schemes</option>
                {wallets.map((w: any) => (
                  <option key={w.scheme_id} value={w.scheme_id}>
                    {w.scheme_name}
                  </option>
                ))}
              </select>
            )}

            {txLoading ? (
              <LoadingSpinner />
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="No transactions yet"
                description={
                  txSchemeFilter
                    ? "No transactions for this scheme yet."
                    : "Your transaction history will appear here after your first contribution."
                }
              />
            ) : (
              <>
                <div className="card overflow-hidden">
                  <div
                    className="px-4 py-2 border-b text-xs text-gray-400"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {txTotal} transaction{txTotal !== 1 ? "s" : ""} total
                  </div>
                  {Object.entries(groupedTransactions).map(
                    ([dayLabel, dayTransactions]) => (
                      <div key={dayLabel}>
                        <div
                          className="px-4 py-1.5 text-xs font-semibold"
                          style={{
                            background: "var(--forest-light)",
                            color: "var(--forest)",
                          }}
                        >
                          {dayLabel}
                        </div>
                        {dayTransactions.map((tx, i) => {
                          const Icon =
                            TX_ICONS[txIconName(tx.type)] ?? TrendingUp;
                          return (
                            <div
                              key={tx.id}
                              className={`flex items-center justify-between px-4 py-3 ${i < dayTransactions.length - 1 ? "border-b" : ""}`}
                              style={{ borderColor: "var(--border)" }}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{
                                    background: tx.type.includes("debit")
                                      ? "#fee2e2"
                                      : "var(--forest-light)",
                                  }}
                                >
                                  <Icon
                                    size={14}
                                    style={{ color: txColor(tx.type) }}
                                  />
                                </div>
                                <div>
                                  <p className="text-xs font-medium capitalize">
                                    {tx.type.replace(/_/g, " ")}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {tx.scheme_name ?? "—"} ·{" "}
                                    {formatDateTime(tx.created_at)}
                                  </p>
                                  {tx.note && (
                                    <p className="text-xs text-gray-400 italic">
                                      {tx.note}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <p
                                className="text-sm font-semibold flex-shrink-0"
                                style={{ color: txColor(tx.type) }}
                              >
                                {txSign(tx.type)}
                                {formatCurrency(tx.amount)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ),
                  )}
                </div>

                {/* Pagination */}
                {txTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                      disabled={txPage === 1}
                      className="btn-ghost flex items-center gap-1 text-xs py-2 px-3 disabled:opacity-40"
                      style={{ width: "auto" }}
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <span className="text-xs text-gray-400">
                      Page {txPage} of {txTotalPages}
                    </span>
                    <button
                      onClick={() =>
                        setTxPage((p) => Math.min(txTotalPages, p + 1))
                      }
                      disabled={txPage === txTotalPages}
                      className="btn-ghost flex items-center gap-1 text-xs py-2 px-3 disabled:opacity-40"
                      style={{ width: "auto" }}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── SCHEMES BROWSE TAB ── */}
        {activeTab === "schemes" &&
          (schemesLoading ? (
            <LoadingSpinner />
          ) : (
            schemes
              .filter((s) => !s.is_compulsory && s.is_active)
              .map((scheme) => (
                <div key={scheme.id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{scheme.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {scheme.description}
                      </p>
                    </div>
                    {scheme.is_subscribed ? (
                      <span className="badge-green px-2 py-0.5 rounded-full text-xs">
                        Joined
                      </span>
                    ) : (
                      <span className="badge-gray px-2 py-0.5 rounded-full text-xs">
                        Available
                      </span>
                    )}
                  </div>
                  {scheme.monthly_target && (
                    <p className="text-xs text-gray-500 mb-3">
                      Suggested: {formatCurrency(scheme.monthly_target)}/month
                    </p>
                  )}
                  {scheme.lock_until && (
                    <p className="text-xs flex items-center gap-1 text-gray-400 mb-3">
                      <Lock size={10} /> Locked until{" "}
                      {formatDate(scheme.lock_until)}
                    </p>
                  )}
                  {!scheme.is_subscribed && (
                    <button
                      onClick={() => {
                        setSelectedScheme(scheme);
                        setJoinAmount(String(scheme.monthly_target ?? ""));
                      }}
                      className="btn-ghost flex items-center justify-center gap-2 w-full py-2.5 text-sm"
                    >
                      <Plus size={14} /> Join Scheme
                    </button>
                  )}
                </div>
              ))
          ))}
      </div>

      {/* Manage Subscription Sheet */}
      <BottomSheet
        open={!!selectedSub}
        onClose={() => {
          setSelectedSub(null);
          setPauseReason("");
        }}
        title={`Manage — ${selectedSub?.scheme?.name}`}
      >
        {selectedSub && (
          <div className="space-y-4">
            <div
              className="p-4 rounded-2xl"
              style={{ background: "var(--forest-light)" }}
            >
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Current monthly amount</span>
                <span
                  className="font-semibold"
                  style={{ color: "var(--forest)" }}
                >
                  {formatCurrency(selectedSub.monthly_amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Status</span>
                <StatusBadge
                  status={selectedSub.is_paused ? "suspended" : "active"}
                  label={selectedSub.is_paused ? "Paused" : "Active"}
                />
              </div>
            </div>

            {/* Change amount */}
            <div>
              <label className="block text-xs font-medium mb-2">
                Change Monthly Amount (₦)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="input-field flex-1"
                  placeholder="New amount"
                />
                <button
                  disabled={!newAmount || updateSubMutation.isPending}
                  onClick={() => setConfirming("amount")}
                  className="btn-ghost px-4 py-2.5 whitespace-nowrap text-sm"
                  style={{ width: "auto" }}
                >
                  Update
                </button>
              </div>
            </div>

            {/* Pause / resume */}
            {selectedSub?.scheme?.name.toLowerCase() != "normal savings" && (
              <>
                {!selectedSub.is_paused ? (
                  <div>
                    <label className="block text-xs font-medium mb-2">
                      Pause Reason (optional)
                    </label>
                    <input
                      value={pauseReason}
                      onChange={(e) => setPauseReason(e.target.value)}
                      placeholder="e.g. Financial difficulty"
                      className="input-field mb-3"
                    />
                    <button
                      disabled={updateSubMutation.isPending}
                      onClick={() => setConfirming("pause")}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium border"
                      style={{ borderColor: "#e2e8f0", color: "#6b7280" }}
                    >
                      <Pause size={14} /> Pause Contributions
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={updateSubMutation.isPending}
                    onClick={() =>
                      updateSubMutation.mutate({
                        schemeId: selectedSub.scheme_id,
                        data: { is_paused: false },
                      })
                    }
                    className="btn-primary flex items-center justify-center gap-2 py-3"
                  >
                    <Play size={14} /> Resume Contributions
                  </button>
                )}

                <button
                  disabled={exitMutation.isPending}
                  onClick={() => setConfirming("exit")}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium"
                  style={{ background: "#fee2e2", color: "#991b1b" }}
                >
                  <LogOut size={14} />
                  {exitMutation.isPending
                    ? "Exiting…"
                    : "Exit Scheme (balance → Normal Savings)"}
                </button>
              </>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Join Scheme Sheet */}
      <BottomSheet
        open={!!selectedScheme}
        onClose={() => {
          setSelectedScheme(null);
          setJoinAmount("");
        }}
        title={`Join — ${selectedScheme?.name}`}
      >
        {selectedScheme && (
          <div className="space-y-4">
            {selectedScheme.description && (
              <p className="text-sm text-gray-600">
                {selectedScheme.description}
              </p>
            )}
            <div>
              <label className="block text-xs font-medium mb-2">
                Monthly Contribution Amount (₦)
              </label>
              <input
                type="number"
                value={joinAmount}
                onChange={(e) => setJoinAmount(e.target.value)}
                placeholder={
                  selectedScheme.monthly_target
                    ? `Suggested: ${formatCurrency(selectedScheme.monthly_target)}`
                    : "Enter amount"
                }
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">
                This amount will be deducted from your monthly payroll
                allocation.
              </p>
            </div>
            {selectedScheme.lock_until && (
              <div
                className="p-3 rounded-xl text-xs flex items-center gap-2"
                style={{
                  background: "var(--gold-light, #fffbeb)",
                  color: "#854d0e",
                }}
              >
                <Lock size={12} />
                <span>
                  This scheme is locked until{" "}
                  {formatDate(selectedScheme.lock_until)}. Contributions go in,
                  but withdrawals are blocked until then.
                </span>
              </div>
            )}
            <button
              disabled={!joinAmount || joinMutation.isPending}
              onClick={() => setConfirming("join")}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {joinMutation.isPending ? "Joining…" : "Confirm & Join"}
            </button>
          </div>
        )}
      </BottomSheet>

      {/* ── Confirmation dialogs ──────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirming === "exit"}
        onClose={() => setConfirming(null)}
        onConfirm={() =>
          selectedSub && exitMutation.mutate(selectedSub.scheme_id)
        }
        title="Exit this scheme?"
        message={`Are you sure you want to exit ${selectedSub?.scheme?.name}? Your current balance will be moved to Normal Savings, and you'll stop contributing to this scheme.`}
        confirmLabel="Yes, Exit Scheme"
        variant="danger"
        loading={exitMutation.isPending}
      />

      <ConfirmDialog
        open={confirming === "pause"}
        onClose={() => setConfirming(null)}
        onConfirm={() =>
          selectedSub &&
          updateSubMutation.mutate({
            schemeId: selectedSub.scheme_id,
            data: { is_paused: true, paused_reason: pauseReason || undefined },
          })
        }
        title="Pause contributions?"
        message={`Are you sure you want to pause contributions to ${selectedSub?.scheme?.name}? You can resume anytime — no money already saved will be affected.`}
        confirmLabel="Yes, Pause"
        loading={updateSubMutation.isPending}
      />

      <ConfirmDialog
        open={confirming === "amount"}
        onClose={() => setConfirming(null)}
        onConfirm={() =>
          selectedSub &&
          updateSubMutation.mutate({
            schemeId: selectedSub.scheme_id,
            data: { monthly_amount: parseFloat(newAmount) },
          })
        }
        title="Change monthly amount?"
        message={`Change your monthly contribution to ${selectedSub?.scheme?.name} from ${selectedSub ? formatCurrency(selectedSub.monthly_amount) : ""} to ${newAmount ? formatCurrency(parseFloat(newAmount)) : "—"}?`}
        confirmLabel="Yes, Update Amount"
        loading={updateSubMutation.isPending}
      />

      <ConfirmDialog
        open={confirming === "join"}
        onClose={() => setConfirming(null)}
        onConfirm={() =>
          selectedScheme &&
          joinMutation.mutate({
            schemeId: selectedScheme.id,
            amount: parseFloat(joinAmount),
          })
        }
        title="Join this scheme?"
        message={`Join ${selectedScheme?.name} with a monthly contribution of ${joinAmount ? formatCurrency(parseFloat(joinAmount)) : "—"}? This amount will be deducted from your monthly payroll allocation going forward.`}
        confirmLabel="Yes, Join Scheme"
        loading={joinMutation.isPending}
      />
    </div>
  );
}
