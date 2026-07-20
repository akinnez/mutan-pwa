"use client";
export const dynamic = 'force-dynamic';
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { sharesApi, ShareTypeParam } from "../../../lib/api/shares";
import { PageHeader } from "../../../components/layout/PageHeader";
import { LoadingSpinner } from "../../../components/shared/LoadingSpinner";
import { EmptyState } from "../../../components/shared/EmptyState";
import { formatCurrency, formatDate } from "../../../lib/utils/format";
import {
  PieChart,
  TrendingUp,
  Gift,
  ShoppingCart,
  ChevronLeft,
} from "lucide-react";

export default function ShareTypeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const type = (
    (params.type as string) === "cbt" ? "cbt" : "mutan"
  ) as ShareTypeParam;
  const isCbt = type === "cbt";

  const { data: holdingData, isLoading } = useQuery({
    queryKey: ["my-shares", type],
    queryFn: () => sharesApi.getMyShares(type),
  });
  const { data: txData } = useQuery({
    queryKey: ["my-share-transactions", type],
    queryFn: () => sharesApi.getMyTransactions(type),
  });

  const holding = holdingData?.data?.data ?? holdingData?.data;
  const transactions = txData?.data?.data ?? txData?.data ?? [];

  if (isLoading)
    return (
      <div>
        <PageHeader title={isCbt ? "CBT Shares" : "MUTAN Shares"} />
        <LoadingSpinner />
      </div>
    );

  const typeIcon = (t: string) =>
    t === "purchase" ? ShoppingCart : t === "dividend" ? Gift : TrendingUp;
  const typeColor = (t: string) =>
    t === "redemption" ? "#991b1b" : "var(--forest)";

  return (
    <div>
      <PageHeader
        title={isCbt ? "CBT Shares" : "MUTAN Shares"}
        subtitle={
          isCbt ? "Levy-funded cooperative equity" : "Your cooperative equity"
        }
      />
      <div className="px-4 pt-2 pb-6 space-y-4">
        <button
          onClick={() => router.push("/shares")}
          className="flex items-center gap-1 text-xs text-gray-400"
        >
          <ChevronLeft size={14} /> Back to Shares
        </button>

        {holding && holding.units_held > 0 ? (
          <div className="wallet-card p-5">
            <p className="text-white/60 text-xs mb-1">
              {isCbt ? "CBT Shares Value" : "Total Share Value"}
            </p>
            <p className="text-3xl font-bold text-white mb-4">
              {formatCurrency(holding.total_value)}
            </p>

            {isCbt ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    {
                      label: "Monthly Levy",
                      value: holding.monthly_levy_amount
                        ? formatCurrency(holding.monthly_levy_amount)
                        : "—",
                    },
                    {
                      label: "Levy Status",
                      value: holding.levy_active ? "Active" : "Paused",
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/10 rounded-xl p-3">
                      <p className="text-white/60 text-xs mb-0.5">{label}</p>
                      <p className="text-white text-sm font-semibold">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                {holding.cap && (
                  <div>
                    <div className="flex justify-between text-white/60 text-xs mb-1.5">
                      <span>Progress to cap</span>
                      <span>
                        {formatCurrency(holding.total_value)} /{" "}
                        {formatCurrency(holding.cap)}
                      </span>
                    </div>
                    <div
                      className="progress-bar"
                      style={{ background: "rgba(255,255,255,0.15)" }}
                    >
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(100, holding.progress_percent ?? 0)}%`,
                          background: holding.cap_reached ? "#4ade80" : "#fff",
                        }}
                      />
                    </div>
                    {holding.cap_reached && (
                      <p className="text-white/70 text-xs mt-2">
                        Cap reached — the monthly levy has stopped for this
                        share type.
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Units Held",
                    value: holding.units_held.toLocaleString(),
                  },
                  {
                    label: "Face Value/Unit",
                    value: formatCurrency(holding.face_value_per_unit ?? 0),
                  },
                  {
                    label: "Last Dividend",
                    value: holding.last_dividend
                      ? `${formatCurrency(holding.last_dividend)}/unit`
                      : "—",
                  },
                  {
                    label: "Dividend Date",
                    value: holding.last_dividend_date
                      ? formatDate(holding.last_dividend_date)
                      : "—",
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/10 rounded-xl p-3">
                    <p className="text-white/60 text-xs mb-0.5">{label}</p>
                    <p className="text-white text-sm font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            )}
            {!isCbt && !holding.allow_new_purchases && (
              <p className="text-white/60 text-xs mt-3 text-center">
                Share purchases are currently closed.
              </p>
            )}
          </div>
        ) : (
          <div className="card p-5">
            <EmptyState
              icon={PieChart}
              title={`No ${isCbt ? "CBT" : "MUTAN"} shares yet`}
              description={
                isCbt
                  ? "These build up automatically through the monthly levy, if active."
                  : "Contact the Financial Secretary to purchase cooperative shares."
              }
            />
            {!isCbt && holding?.allow_new_purchases && (
              <div
                className="mt-3 p-3 rounded-xl text-xs text-center"
                style={{
                  background: "var(--forest-light)",
                  color: "var(--forest)",
                }}
              >
                Share purchases are currently <strong>open</strong>. Face value:{" "}
                {formatCurrency(holding.face_value_per_unit ?? 0)}/unit. Contact
                the Financial Secretary to purchase.
              </div>
            )}
          </div>
        )}

        {!isCbt && (
          <div
            className="p-4 rounded-2xl text-xs"
            style={{
              background: "var(--forest-light)",
              color: "var(--forest)",
            }}
          >
            <p className="font-semibold mb-1">📊 About MUTAN Shares</p>
            <p className="text-gray-600">
              Shares represent your equity in MUTAN Cooperative. Annual
              dividends are declared at the AGM based on the cooperative's
              surplus. Maximum individual holding: 20% of total shares.
            </p>
          </div>
        )}

        {transactions.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-3">
              {isCbt ? "CBT" : "MUTAN"} Share Transactions
            </h3>
            <div className="card overflow-hidden">
              {transactions.map((tx: any, i: number) => {
                const Icon = typeIcon(tx.type);
                return (
                  <div
                    key={tx.id}
                    className={`flex items-center justify-between px-4 py-3 ${i < transactions.length - 1 ? "border-b" : ""}`}
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background:
                            tx.type === "redemption"
                              ? "#fee2e2"
                              : "var(--forest-light)",
                        }}
                      >
                        <Icon size={14} style={{ color: typeColor(tx.type) }} />
                      </div>
                      <div>
                        <p className="text-xs font-medium capitalize">
                          {tx.type}
                        </p>
                        <p className="text-xs text-gray-400">
                          {isCbt
                            ? formatCurrency(tx.units)
                            : `${tx.units} units`}{" "}
                          · {formatDate(tx.created_at)}
                        </p>
                        {tx.note && (
                          <p className="text-xs text-gray-400 italic">
                            {tx.note}
                          </p>
                        )}
                      </div>
                    </div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: typeColor(tx.type) }}
                    >
                      {tx.type === "redemption" ? "-" : "+"}
                      {formatCurrency(tx.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
