import { Sparkles, Zap, Activity, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { ChartCard } from "@/components/admin/chart-card";
import { AreaChart } from "@/components/admin/area-chart";
import { BarChart } from "@/components/admin/bar-chart";
import { DonutChart } from "@/components/admin/donut-chart";
import { PageHeader } from "@/components/admin/page-header";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getDailyAIRequests,
  getToolStats,
  getAdminDashboardStats,
} from "@/services/admin/stats";

export const metadata = { title: "Admin — AI Analytics" };
export const dynamic = "force-dynamic";

async function getProviderStats() {
  const admin = createAdminClient();
  const { data } = await admin.from("user_preferences").select("ai_provider");
  const counts: Record<string, number> = {};
  (data ?? []).forEach((r) => {
    counts[r.ai_provider] = (counts[r.ai_provider] ?? 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

async function getAIErrorCount() {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("admin_logs")
    .select("id", { count: "exact", head: true })
    .eq("log_type", "error")
    .gte("created_at", since);
  return count ?? 0;
}

export default async function AIAnalyticsPage() {
  const [stats, dailyRequests, toolStats, providerStats, errorCount] = await Promise.all([
    getAdminDashboardStats(),
    getDailyAIRequests(30),
    getToolStats(),
    getProviderStats(),
    getAIErrorCount(),
  ]);

  const toolBarData = toolStats.map((t) => ({ label: t.tool, value: t.count }));
  const creditsByTool = toolStats.map((t) => ({ label: t.tool, value: t.credits }));

  const providerLabels: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
  };
  const providerDonutData = providerStats.map((p) => ({
    name: providerLabels[p.name] ?? p.name,
    value: p.value,
  }));

  const totalRequests = toolStats.reduce((s, t) => s + t.count, 0);
  const totalCredits = toolStats.reduce((s, t) => s + t.credits, 0);

  return (
    <>
      <PageHeader title="AI Analytics" description="Usage stats for the last 30 days" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Requests Today" value={stats.aiRequestsToday.toLocaleString()} icon={Sparkles} />
        <StatCard label="Requests (Month)" value={stats.aiRequestsMonth.toLocaleString()} icon={Activity} />
        <StatCard label="Credits Consumed" value={totalCredits.toLocaleString()} icon={Zap} />
        <StatCard
          label="AI Errors (30d)"
          value={errorCount.toLocaleString()}
          icon={TrendingUp}
          variant={errorCount > 10 ? "danger" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Daily AI Requests" description="Last 30 days" height={220}>
          <AreaChart data={dailyRequests} label="Requests" color="#6366f1" />
        </ChartCard>

        <ChartCard title="Provider Usage" description="Preferred AI provider per user" height={220}>
          {providerDonutData.length > 0 ? (
            <DonutChart data={providerDonutData} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No provider data yet
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Tool Usage (30d)" description="Requests per tool" height={240}>
          {toolBarData.length > 0 ? (
            <BarChart data={toolBarData} horizontal />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No tool usage yet
            </div>
          )}
        </ChartCard>

        <ChartCard title="Credits by Tool" description="Credits consumed per tool" height={240}>
          {creditsByTool.length > 0 ? (
            <BarChart data={creditsByTool} horizontal color="#8b5cf6" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No credit data yet
            </div>
          )}
        </ChartCard>
      </div>

      {/* Summary table */}
      {toolStats.length > 0 && (
        <div className="mt-6 rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tool</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Requests</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Credits used</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {toolStats.map((t) => (
                <tr key={t.tool} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{t.tool}</td>
                  <td className="px-4 py-3 text-right">{t.count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{t.credits.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {totalRequests > 0 ? ((t.count / totalRequests) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-border bg-muted/30">
              <tr>
                <td className="px-4 py-3 font-semibold">Total</td>
                <td className="px-4 py-3 text-right font-semibold">{totalRequests.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-semibold">{totalCredits.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </>
  );
}
