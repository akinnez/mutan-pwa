"use client";
import { useQuery } from "@tanstack/react-query";
import { investmentsApi } from "../../lib/api/investments";
import { PageHeader } from "../../components/layout/PageHeader";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { LoadingSpinner } from "../../components/shared/LoadingSpinner";
import { EmptyState } from "../../components/shared/EmptyState";
import { formatCurrency, formatDate } from "../../lib/utils/format";
import { TrendingUp, Calendar, CheckCircle, Clock } from "lucide-react";
import type { InvestmentRound } from "../../lib/types";

export default function InvestmentsPage() {
  const { data: availableData, isLoading: availLoading } = useQuery({
    queryKey: ["available-investments"],
    queryFn: () => investmentsApi.getAvailable(),
  });
  const { data: myData, isLoading: myLoading } = useQuery({
    queryKey: ["my-investments"],
    queryFn: () => investmentsApi.getMyInvestments(),
  });

  const available: InvestmentRound[] =
    availableData?.data?.data ?? availableData?.data ?? [];
  const myInvestments = myData?.data?.data ?? myData?.data ?? [];

  return (
    <div>
      <PageHeader title="Investments" subtitle="Halal investment rounds" />
      <div className="px-4 pt-4 pb-6 space-y-5">
        {/* Info banner */}
        <div
          className="p-4 rounded-2xl text-xs"
          style={{ background: "var(--forest-light)", color: "var(--forest)" }}
        >
          <p className="font-semibold mb-1">🌿 Halal Investment Principles</p>
          <p className="text-gray-600">
            MUTAN investments follow Mudarabah/Musharakah profit-sharing.
            Returns are distributed based on actual profit — no guaranteed
            interest (Riba).
          </p>
        </div>

        {/* My investments */}
        {myInvestments.length > 0 && (
          <div>
            <h3
              className="font-semibold text-sm mb-3"
              style={{ color: "var(--charcoal)" }}
            >
              My Investments
            </h3>
            <div className="space-y-3">
              {myInvestments.map((inv: any) => (
                <div key={inv.id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{inv.round_name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={10} /> Matures:{" "}
                        {formatDate(inv.maturity_date)}
                      </p>
                    </div>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Invested</p>
                      <p
                        className="font-semibold"
                        style={{ color: "var(--forest)" }}
                      >
                        {formatCurrency(inv.amount_invested)}
                      </p>
                    </div>
                    {inv.profit_share && (
                      <div>
                        <p className="text-xs text-gray-400">Profit Share</p>
                        <p
                          className="font-semibold"
                          style={{ color: "var(--gold)" }}
                        >
                          {formatCurrency(inv.profit_share)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available rounds */}
        <div>
          <h3
            className="font-semibold text-sm mb-3"
            style={{ color: "var(--charcoal)" }}
          >
            Available Rounds
          </h3>
          {availLoading ? (
            <LoadingSpinner />
          ) : available.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No open rounds"
              description="Investment rounds will appear here when the board opens them."
            />
          ) : (
            <div className="space-y-3">
              {available.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{r.name}</p>
                      {r.description && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {r.description}
                        </p>
                      )}
                    </div>
                    {r.my_investment ? (
                      <span className="badge-green px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                        <CheckCircle size={10} /> Joined
                      </span>
                    ) : (
                      <StatusBadge status={r.status} />
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Funding progress</span>
                      <span>
                        {formatCurrency(r.amount_raised)} /{" "}
                        {formatCurrency(r.target_amount)}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(100, parseFloat(r.fill_percent))}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {r.fill_percent}% funded
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} /> Opens: {formatDate(r.open_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> Matures: {formatDate(r.maturity_date)}
                    </span>
                    {r.profit_ratio && (
                      <span>Projected profit: {r.profit_ratio}%</span>
                    )}
                  </div>

                  {/* Eligibility requirements */}
                  {(r.eligibility.min_months_active ||
                    r.eligibility.min_savings_balance ||
                    r.eligibility.min_shares_held) && (
                    <div
                      className="p-3 rounded-xl text-xs mb-3"
                      style={{ background: "var(--forest-light)" }}
                    >
                      <p
                        className="font-medium mb-1"
                        style={{ color: "var(--forest)" }}
                      >
                        Eligibility Requirements
                      </p>
                      {r.eligibility.min_months_active && (
                        <p className="text-gray-600">
                          • Minimum {r.eligibility.min_months_active} months
                          membership
                        </p>
                      )}
                      {r.eligibility.min_savings_balance && (
                        <p className="text-gray-600">
                          • Minimum savings:{" "}
                          {formatCurrency(r.eligibility.min_savings_balance)}
                        </p>
                      )}
                      {r.eligibility.min_shares_held && (
                        <p className="text-gray-600">
                          • Minimum {r.eligibility.min_shares_held} shares held
                        </p>
                      )}
                      {r.eligibility.max_investment_amount && (
                        <p className="text-gray-600">
                          • Max investment:{" "}
                          {formatCurrency(r.eligibility.max_investment_amount)}
                        </p>
                      )}
                    </div>
                  )}

                  {!r.my_investment && (
                    <div
                      className="p-3 rounded-xl text-xs"
                      style={{ background: "#fef9c3", color: "#854d0e" }}
                    >
                      To join this investment round, contact the Financial
                      Secretary with your desired investment amount.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
