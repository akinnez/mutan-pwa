"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { memberApi } from "../../lib/api/member";
import { sharesApi } from "../../lib/api/shares";
import { formatCurrency, formatDate } from "../../lib/utils/format";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  PiggyBank,
  Landmark,
  GraduationCap,
  Gift,
  ChevronDown,
  Filter,
  Search,
  Receipt,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type TxType =
  | "all"
  | "credit"
  | "debit"
  | "loan"
  | "levy"
  | "shares"
  | "payment";

interface UnifiedTx {
  id: string;
  amount: number;
  type: string; // raw backend type
  category: TxType;
  label: string;
  sublabel: string;
  date: string;
  isDebit: boolean;
  source: "wallet" | "share" | "payment";
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const inferCategory = (type: string, source: string): TxType => {
  if (source === "payment") return "payment";
  if (source === "share") return "shares";
  if (type.includes("levy") || type.includes("debit")) return "levy";
  if (type.includes("loan") || type.includes("repay")) return "loan";
  if (type.includes("dividend")) return "shares";
  return type.includes("debit") ? "debit" : "credit";
};

const isDebitType = (type: string) =>
  type.includes("debit") ||
  type.includes("redemption") ||
  type.includes("repayment");

const friendlyLabel = (type: string, schemeName?: string): string => {
  if (schemeName) return schemeName;
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const FILTERS: { value: TxType; label: string; icon: any }[] = [
  { value: "all", label: "All", icon: Receipt },
  { value: "credit", label: "Credits", icon: ArrowDownLeft },
  { value: "debit", label: "Debits", icon: ArrowUpRight },
  { value: "payment", label: "Payments", icon: CreditCard },
  { value: "loan", label: "Loans", icon: Landmark },
  { value: "levy", label: "Levies", icon: PiggyBank },
  { value: "shares", label: "Shares", icon: GraduationCap },
];

const TxIcon = ({
  category,
  isDebit,
}: {
  category: TxType;
  isDebit: boolean;
}) => {
  const iconMap: Record<string, any> = {
    payment: CreditCard,
    loan: Landmark,
    levy: PiggyBank,
    shares: GraduationCap,
    credit: TrendingUp,
    debit: TrendingDown,
    all: TrendingUp,
  };
  const Icon = iconMap[category] ?? (isDebit ? TrendingDown : TrendingUp);
  return <Icon size={16} />;
};

const PAGE_SIZE = 20;

// ── Page ─────────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<TxType>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [allTxs, setAllTxs] = useState<UnifiedTx[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["all-transactions", page],
    queryFn: () => memberApi.getTransactions({ page, limit: PAGE_SIZE }),
  });

  const { data: paymentData, isLoading: paymentLoading } = useQuery({
    queryKey: ["my-payments"],
    queryFn: () => memberApi.getPayments(),
    enabled: page === 1,
  });

  const { data: mutanShareData } = useQuery({
    queryKey: ["my-share-transactions", "mutan"],
    queryFn: () => sharesApi.getMyTransactions("mutan"),
    enabled: page === 1,
  });

  const { data: cbtShareData } = useQuery({
    queryKey: ["my-share-transactions", "cbt"],
    queryFn: () => sharesApi.getMyTransactions("cbt"),
    enabled: page === 1,
  });

  // ── Unify and merge transactions ───────────────────────────────────────────
  useEffect(() => {
    const walletTxs: UnifiedTx[] = (
      walletData?.data?.data?.data ??
      walletData?.data?.data ??
      []
    ).map((tx: any) => ({
      id: `w-${tx.id}`,
      amount: Number(tx.amount),
      type: tx.type,
      category: inferCategory(tx.type, "wallet"),
      label: friendlyLabel(tx.type, tx.scheme_name),
      sublabel: tx.month_label ?? tx.note ?? formatDate(tx.created_at),
      date: tx.created_at,
      isDebit: isDebitType(tx.type),
      source: "wallet",
    }));

    const newTxs = page === 1 ? walletTxs : [...allTxs, ...walletTxs];
    if (walletTxs.length < PAGE_SIZE) setHasMore(false);

    // On first page, also fold in payments + shares
    if (page === 1) {
      const paymentTxs: UnifiedTx[] = (
        paymentData?.data?.data ??
        paymentData?.data ??
        []
      ).map((p: any) => ({
        id: `p-${p.id}`,
        amount: Number(p.declared_amount),
        type: p.payment_type,
        category: "payment" as TxType,
        label:
          p.payment_type
            ?.replace(/_/g, " ")
            ?.replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? "Payment",
        sublabel: `Ref: ${p.bank_reference ?? p.paystack_reference ?? "—"} · ${p.status}`,
        date: p.created_at,
        isDebit: false,
        source: "payment",
      }));

      const mutanTxs: UnifiedTx[] = (
        mutanShareData?.data?.data ??
        mutanShareData?.data ??
        []
      ).map((s: any) => ({
        id: `ms-${s.id}`,
        amount: Number(s.amount),
        type: s.type,
        category: "shares" as TxType,
        label: `MUTAN Shares — ${s.type}`,
        sublabel: s.note ?? formatDate(s.created_at),
        date: s.created_at,
        isDebit: s.type === "redemption",
        source: "share",
      }));

      const cbtTxs: UnifiedTx[] = (
        cbtShareData?.data?.data ??
        cbtShareData?.data ??
        []
      ).map((s: any) => ({
        id: `cs-${s.id}`,
        amount: Number(s.amount),
        type: s.type,
        category: "shares" as TxType,
        label: `CBT Shares — ${s.type}`,
        sublabel: s.note ?? formatDate(s.created_at),
        date: s.created_at,
        isDebit: s.type === "redemption",
        source: "share",
      }));

      const all = [...walletTxs, ...paymentTxs, ...mutanTxs, ...cbtTxs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      setAllTxs(all);
    } else {
      setAllTxs(newTxs);
    }
  }, [walletData, paymentData, mutanShareData, cbtShareData, page]);

  // ── Infinite scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !walletLoading)
          setPage((p) => p + 1);
      },
      { threshold: 0.1 },
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, walletLoading]);

  // ── Filter + search ────────────────────────────────────────────────────────
  const visible = allTxs.filter((tx) => {
    const matchFilter = filter === "all" || tx.category === filter;
    const matchSearch =
      !search ||
      tx.label.toLowerCase().includes(search.toLowerCase()) ||
      tx.sublabel.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const isLoading = walletLoading && page === 1;

  // ── Group by date ──────────────────────────────────────────────────────────
  const grouped: { date: string; items: UnifiedTx[] }[] = [];
  visible.forEach((tx) => {
    const d = new Date(tx.date).toDateString();
    const last = grouped[grouped.length - 1];
    if (last?.date === d) last.items.push(tx);
    else grouped.push({ date: d, items: [tx] });
  });

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--surface)", paddingBottom: "2rem" }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="wallet-card px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <ArrowLeft size={16} color="white" />
          </button>
          <h1 className="text-white text-lg font-semibold">
            Transaction History
          </h1>
        </div>

        {/* Summary chips */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total Entries", value: allTxs.length },
            {
              label: "Credits",
              value: allTxs.filter((t) => !t.isDebit).length,
            },
            { label: "Debits", value: allTxs.filter((t) => t.isDebit).length },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="text-center py-2 px-1 rounded-xl"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <p className="text-white text-lg font-bold">{value}</p>
              <p className="text-white/50 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <div className="px-4 -mt-4 mb-3">
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-2xl shadow-sm"
          style={{ background: "#fff", border: "1px solid var(--border)" }}
        >
          <Search size={14} style={{ color: "var(--forest)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions…"
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: "var(--charcoal)" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "var(--forest-light)",
                color: "var(--forest)",
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Filter pills ────────────────────────────────────────────────────── */}
      <div className="px-4 mb-4 overflow-x-auto">
        <div className="flex gap-2 pb-1" style={{ width: "max-content" }}>
          {FILTERS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
              style={{
                background: filter === value ? "var(--forest)" : "#fff",
                color: filter === value ? "#fff" : "var(--charcoal)",
                border: `1px solid ${filter === value ? "var(--forest)" : "var(--border)"}`,
              }}
            >
              <Icon size={11} />
              {label}
              {value !== "all" && (
                <span
                  className="ml-0.5 px-1.5 py-0.5 rounded-full text-xs"
                  style={{
                    background:
                      filter === value
                        ? "rgba(255,255,255,0.2)"
                        : "var(--forest-light)",
                    color: filter === value ? "#fff" : "var(--forest)",
                  }}
                >
                  {allTxs.filter((t) => t.category === value).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Transaction list ─────────────────────────────────────────────────── */}
      <div className="px-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="card p-4 animate-pulse flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-full"
                  style={{ background: "var(--border)" }}
                />
                <div className="flex-1 space-y-2">
                  <div
                    className="h-3 rounded-full w-1/2"
                    style={{ background: "var(--border)" }}
                  />
                  <div
                    className="h-2.5 rounded-full w-1/3"
                    style={{ background: "var(--border)" }}
                  />
                </div>
                <div
                  className="h-4 w-16 rounded-full"
                  style={{ background: "var(--border)" }}
                />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="card p-10 text-center mt-4">
            <div
              className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ background: "var(--forest-light)" }}
            >
              <Receipt size={24} style={{ color: "var(--forest)" }} />
            </div>
            <p className="font-medium text-sm mb-1">No transactions found</p>
            <p className="text-xs text-gray-400">
              {search
                ? `No results for "${search}"`
                : "No activity yet in this category."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(({ date, items }) => (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center gap-2 mb-2">
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "var(--forest)" }}
                  >
                    {new Date(date).toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <div
                    className="flex-1 h-px"
                    style={{ background: "var(--border)" }}
                  />
                  <p className="text-xs text-gray-400">{items.length}</p>
                </div>

                {/* Transactions in group */}
                <div className="card overflow-hidden">
                  {items.map((tx, i) => (
                    <div
                      key={tx.id}
                      className={`flex items-center gap-3 px-4 py-3.5 ${i < items.length - 1 ? "border-b" : ""}`}
                      style={{ borderColor: "var(--border)" }}
                    >
                      {/* Icon */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: tx.isDebit
                            ? "#fee2e2"
                            : "var(--forest-light)",
                          color: tx.isDebit ? "#991b1b" : "var(--forest)",
                        }}
                      >
                        <TxIcon category={tx.category} isDebit={tx.isDebit} />
                      </div>

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {tx.label}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {tx.sublabel}
                        </p>
                      </div>

                      {/* Amount + badge */}
                      <div className="text-right flex-shrink-0">
                        <p
                          className="text-sm font-bold"
                          style={{
                            color: tx.isDebit ? "#991b1b" : "var(--forest)",
                          }}
                        >
                          {tx.isDebit ? "−" : "+"}
                          {formatCurrency(tx.amount)}
                        </p>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                          style={{
                            background: tx.isDebit
                              ? "#fee2e2"
                              : "var(--forest-light)",
                            color: tx.isDebit ? "#991b1b" : "var(--forest)",
                          }}
                        >
                          {tx.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll loader */}
        {hasMore && !isLoading && (
          <div ref={loaderRef} className="py-6 flex justify-center">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{
                borderColor: "var(--border)",
                borderTopColor: "var(--forest)",
              }}
            />
          </div>
        )}

        {!hasMore && visible.length > 0 && (
          <p className="text-center text-xs text-gray-300 py-6">
            All transactions loaded
          </p>
        )}
      </div>
    </div>
  );
}
