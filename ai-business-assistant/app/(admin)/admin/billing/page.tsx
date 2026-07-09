import { DollarSign, TrendingUp, BarChart2, Percent } from "lucide-react";

import { AreaChart } from "@/components/admin/area-chart";
import { ChartCard } from "@/components/admin/chart-card";
import { DonutChart } from "@/components/admin/donut-chart";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import {
  getAdminDashboardStats,
  getDailyRevenue,
  getPlanDistribution,
} from "@/services/admin/stats";

export const metadata = { title: "Admin — Billing Analytics" };
export const dynamic = "force-dynamic";

const PLAN_PRICE: Record<string, number> = { free: 0, starter: 12, pro: 25, enterprise: 99 };

export default async function BillingPage() {
  const [stats, dailyRevenue, planDist] = await Promise.all([
    getAdminDashboardStats(),
    getDailyRevenue(30),
    getPlanDistribution(),
  ]);

  const totalUsers = stats.totalUsers;
  const arpu = stats.activeSubscriptions > 0 ? stats.mrr / stats.activeSubscriptions : 0;
  const conversionRate = totalUsers > 0 ? (stats.paidUsers / totalUsers) * 100 : 0;

  const revenueByPlan = planDist
    .filter((p) => PLAN_PRICE[p.plan] > 0)
    .map((p) => ({
      name: p.plan.charAt(0).toUpperCase() + p.plan.slice(1),
      value: p.count * PLAN_PRICE[p.plan],
    }));

  return (
    <>
      <PageHeader description="Revenue and subscription metrics" title="Billing Analytics" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={DollarSign}
          label="MRR"
          subtext="Monthly recurring revenue"
          value={`$${stats.mrr.toLocaleString()}`}
          variant="success"
        />
        <StatCard
          icon={TrendingUp}
          label="ARR"
          subtext="Annual recurring revenue"
          value={`$${stats.arr.toLocaleString()}`}
          variant="success"
        />
        <StatCard
          icon={BarChart2}
          label="ARPU"
          subtext="Avg revenue per paid user"
          value={`$${arpu.toFixed(2)}`}
        />
        <StatCard
          icon={Percent}
          label="Conversion Rate"
          subtext={`${stats.paidUsers} of ${totalUsers} users`}
          value={`${conversionRate.toFixed(1)}%`}
          variant={conversionRate > 5 ? "success" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard
          description="Revenue from new subscriptions each day"
          height={220}
          title="New Subscription Revenue (30d)"
        >
          <AreaChart color="#10b981" data={dailyRevenue} label="Revenue" valuePrefix="$" />
        </ChartCard>

        <ChartCard
          description="Monthly recurring revenue per plan"
          height={220}
          title="Revenue by Plan"
        >
          {revenueByPlan.length > 0 ? (
            <DonutChart data={revenueByPlan} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No revenue data yet
            </div>
          )}
        </ChartCard>
      </div>

      {/* Plan breakdown table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Users</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price / mo</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">MRR contribution</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">% of MRR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {planDist.map((p) => {
              const price = PLAN_PRICE[p.plan] ?? 0;
              const mrrContrib = p.count * price;
              return (
                <tr key={p.plan} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium capitalize">{p.plan}</td>
                  <td className="px-4 py-3 text-right">{p.count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {price > 0 ? `$${price}` : "Free"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {mrrContrib > 0 ? `$${mrrContrib.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {stats.mrr > 0 && mrrContrib > 0
                      ? `${((mrrContrib / stats.mrr) * 100).toFixed(1)}%`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-border bg-muted/30">
            <tr>
              <td className="px-4 py-3 font-semibold">Total</td>
              <td className="px-4 py-3 text-right font-semibold">{totalUsers.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">—</td>
              <td className="px-4 py-3 text-right font-semibold">${stats.mrr.toLocaleString()}</td>
              <td className="px-4 py-3 text-right font-semibold">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
