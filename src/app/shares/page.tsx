"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { sharesApi } from "../../lib/api/shares";
import { PageHeader } from "../../components/layout/PageHeader";
import { LoadingSpinner } from "../../components/shared/LoadingSpinner";
import { formatCurrency } from "../../lib/utils/format";
import { Landmark, GraduationCap, ChevronRight } from "lucide-react";

export default function SharesLandingPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["my-shares-summary"],
    queryFn: () => sharesApi.getMySummary(),
  });
  const summary = data?.data?.data ?? data?.data;

  if (isLoading)
    return (
      <div>
        <PageHeader title="Shares" />
        <LoadingSpinner />
      </div>
    );

  const cards = [
    {
      type: "mutan",
      title: "MUTAN Shares",
      icon: Landmark,
      value: summary?.mutan?.total_value ?? 0,
      sub: `${summary?.mutan?.units_held ?? 0} units`,
    },
    {
      type: "cbt",
      title: "CBT Shares",
      icon: GraduationCap,
      value: summary?.cbt?.total_value ?? 0,
      sub: summary?.cbt?.cap
        ? `${Math.round(summary.cbt.progress_percent ?? 0)}% of cap`
        : "Levy-funded",
    },
  ];

  return (
    <div>
      <PageHeader title="Shares" subtitle="Your cooperative equity" />
      <div className="px-4 pt-4 pb-6 space-y-3">
        {cards.map((c) => (
          <button
            key={c.type}
            onClick={() => router.push(`/shares/${c.type}`)}
            className="wallet-card p-5 w-full text-left block"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <c.icon size={18} className="text-white/80" />
                <p className="text-white/80 text-sm font-medium">{c.title}</p>
              </div>
              <ChevronRight size={16} className="text-white/50" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {formatCurrency(c.value)}
            </p>
            <p className="text-white/60 text-xs">{c.sub}</p>
          </button>
        ))}

        <div
          className="p-4 rounded-2xl text-xs"
          style={{ background: "var(--forest-light)", color: "var(--forest)" }}
        >
          <p className="font-semibold mb-1">📊 About Your Shares</p>
          <p className="text-gray-600">
            MUTAN Shares are your general cooperative equity, purchased through
            the Financial Secretary and dividend-bearing. CBT Shares build up
            automatically each month through a fixed levy, up to a cap the board
            sets.
          </p>
        </div>
      </div>
    </div>
  );
}
