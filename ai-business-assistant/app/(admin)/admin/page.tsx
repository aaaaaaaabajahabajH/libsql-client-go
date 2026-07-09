import {
  Users,
  UserCheck,
  UserPlus,
  DollarSign,
  CreditCard,
  Zap,
  Activity,
  TrendingUp,
  Database,
  Sparkles,
} from "lucide-react";

import { AreaChart } from "@/components/admin/area-chart";
import { BarChart } from "@/components/admin/bar-chart";
import { ChartCard } from "@/components/admin/chart-card";
import { DonutChart } from "@/components/admin/donut-chart";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import {
  getAdminDashboardStats,
  getDailyAIRequests,
  getDailyUserGrowth,
  getToolStats,
  getPlanDistribution,
} from "@/services/admin/stats";

export const metadata = { title: "Admin — Overview" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [stats, dailyAI, dailyUsers, toolStats, planDist] = await Promise.all([
    getAdminDashboardStats(),
    getDailyAIRequests(30),
    getDailyUserGrowth(30),
    getToolStats(),
    getPlanDistribution(),
  ]);

  const toolBarData = toolStats.map((t) => ({ label: t.tool, value: t.count }));
  const planDonutData = planDist.map((p) => ({
    name: p.plan.charAt(0).toUpperCase() + p.plan.slice(1),
    value: p.count,
  }));

  return (
    <>
      <PageHeader
        description={`Dashboard as of ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`}
        title="Admin Overview"
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Total Users"
          subtext={`+${stats.newUsersToday} today`}
          value={stats.totalUsers.toLocaleString()}
        />
        <StatCard
          icon={UserCheck}
          label="Active Users"
          subtext="Last 30 days"
          value={stats.activeUsers.toLocaleString()}
          variant="success"
        />
        <StatCard
          icon={UserPlus}
          label="New Today"
          value={stats.newUsersToday.toLocaleString()}
          variant={stats.newUsersToday > 0 ? "success" : "default"}
        />
        <StatCard
          icon={CreditCard}
          label="Active Subscriptions"
          value={stats.activeSubscriptions.toLocaleString()}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={DollarSign}
          label="MRR"
          subtext="Monthly recurring"
          value={`$${stats.mrr.toLocaleString()}`}
          variant="success"
        />
        <StatCard
          icon={TrendingUp}
          label="ARR"
          subtext="Annual recurring"
          value={`$${stats.arr.toLocaleString()}`}
          variant="success"
        />
        <StatCard
          icon={Sparkles}
          label="AI Requests Today"
          value={stats.aiRequestsToday.toLocaleString()}
          variant={stats.aiRequestsToday > 100 ? "warning" : "default"}
        />
        <StatCard
          icon={Activity}
          label="AI Requests (Month)"
          value={stats.aiRequestsMonth.toLocaleString()}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Zap}
          label="Credits Used"
          value={stats.totalCreditsUsed.toLocaleString()}
        />
        <StatCard
          icon={Users}
          label="Free Users"
          subtext={`${stats.totalUsers > 0 ? ((stats.freeUsers / stats.totalUsers) * 100).toFixed(0) : 0}% of all users`}
          value={stats.freeUsers.toLocaleString()}
        />
        <StatCard
          icon={CreditCard}
          label="Paid Users"
          subtext={`${stats.totalUsers > 0 ? ((stats.paidUsers / stats.totalUsers) * 100).toFixed(0) : 0}% conversion`}
          value={stats.paidUsers.toLocaleString()}
          variant={stats.paidUsers > 0 ? "success" : "default"}
        />
        <StatCard
          icon={Database}
          label="Database"
          subtext="PostgreSQL"
          value="Supabase"
          variant="success"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard
          description="Last 30 days"
          height={220}
          title="Daily AI Requests"
        >
          <AreaChart color="#6366f1" data={dailyAI} label="Requests" />
        </ChartCard>

        <ChartCard
          description="New sign-ups last 30 days"
          height={220}
          title="User Growth"
        >
          <AreaChart color="#10b981" data={dailyUsers} label="Users" />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          description="Requests per AI tool"
          height={240}
          title="Tool Usage (30d)"
        >
          <BarChart horizontal data={toolBarData} />
        </ChartCard>

        <ChartCard
          description="Users by subscription plan"
          height={240}
          title="Plan Distribution"
        >
          <DonutChart data={planDonutData} />
        </ChartCard>
      </div>
    </>
  );
}
