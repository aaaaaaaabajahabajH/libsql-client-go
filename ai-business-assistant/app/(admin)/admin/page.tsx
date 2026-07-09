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
import { StatCard } from "@/components/admin/stat-card";
import { ChartCard } from "@/components/admin/chart-card";
import { AreaChart } from "@/components/admin/area-chart";
import { BarChart } from "@/components/admin/bar-chart";
import { DonutChart } from "@/components/admin/donut-chart";
import { PageHeader } from "@/components/admin/page-header";
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
        title="Admin Overview"
        description={`Dashboard as of ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          subtext={`+${stats.newUsersToday} today`}
        />
        <StatCard
          label="Active Users"
          value={stats.activeUsers.toLocaleString()}
          icon={UserCheck}
          subtext="Last 30 days"
          variant="success"
        />
        <StatCard
          label="New Today"
          value={stats.newUsersToday.toLocaleString()}
          icon={UserPlus}
          variant={stats.newUsersToday > 0 ? "success" : "default"}
        />
        <StatCard
          label="Active Subscriptions"
          value={stats.activeSubscriptions.toLocaleString()}
          icon={CreditCard}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="MRR"
          value={`$${stats.mrr.toLocaleString()}`}
          icon={DollarSign}
          variant="success"
          subtext="Monthly recurring"
        />
        <StatCard
          label="ARR"
          value={`$${stats.arr.toLocaleString()}`}
          icon={TrendingUp}
          variant="success"
          subtext="Annual recurring"
        />
        <StatCard
          label="AI Requests Today"
          value={stats.aiRequestsToday.toLocaleString()}
          icon={Sparkles}
          variant={stats.aiRequestsToday > 100 ? "warning" : "default"}
        />
        <StatCard
          label="AI Requests (Month)"
          value={stats.aiRequestsMonth.toLocaleString()}
          icon={Activity}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Credits Used"
          value={stats.totalCreditsUsed.toLocaleString()}
          icon={Zap}
        />
        <StatCard
          label="Free Users"
          value={stats.freeUsers.toLocaleString()}
          icon={Users}
          subtext={`${stats.totalUsers > 0 ? ((stats.freeUsers / stats.totalUsers) * 100).toFixed(0) : 0}% of all users`}
        />
        <StatCard
          label="Paid Users"
          value={stats.paidUsers.toLocaleString()}
          icon={CreditCard}
          variant={stats.paidUsers > 0 ? "success" : "default"}
          subtext={`${stats.totalUsers > 0 ? ((stats.paidUsers / stats.totalUsers) * 100).toFixed(0) : 0}% conversion`}
        />
        <StatCard
          label="Database"
          value="Supabase"
          icon={Database}
          variant="success"
          subtext="PostgreSQL"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard
          title="Daily AI Requests"
          description="Last 30 days"
          height={220}
        >
          <AreaChart data={dailyAI} label="Requests" color="#6366f1" />
        </ChartCard>

        <ChartCard
          title="User Growth"
          description="New sign-ups last 30 days"
          height={220}
        >
          <AreaChart data={dailyUsers} label="Users" color="#10b981" />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Tool Usage (30d)"
          description="Requests per AI tool"
          height={240}
        >
          <BarChart data={toolBarData} horizontal />
        </ChartCard>

        <ChartCard
          title="Plan Distribution"
          description="Users by subscription plan"
          height={240}
        >
          <DonutChart data={planDonutData} />
        </ChartCard>
      </div>
    </>
  );
}
