import type { Metadata } from "next";
import { Zap, FileText, Clock, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentActivity, type ActivityItem } from "@/components/dashboard/recent-activity";
import { AIToolsGrid } from "@/components/dashboard/ai-tools-grid";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your AI Business Assistant dashboard.",
};

const MOCK_STATS = [
  {
    title: "Credits Remaining",
    value: "2,660",
    change: "+500 this month",
    trend: "up" as const,
    icon: Zap,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    title: "Documents Generated",
    value: "128",
    change: "+24%",
    trend: "up" as const,
    icon: FileText,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    title: "Hours Saved",
    value: "47h",
    change: "+12h",
    trend: "up" as const,
    icon: Clock,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    title: "Productivity Score",
    value: "94%",
    change: "+6%",
    trend: "up" as const,
    icon: TrendingUp,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-100 dark:bg-violet-900/30",
  },
];

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "1",
    tool: "social-media",
    title: "LinkedIn post about Q4 results",
    credits: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "2",
    tool: "email-writer",
    title: "Follow-up email to enterprise client",
    credits: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "3",
    tool: "blog-writer",
    title: "10 AI Trends Reshaping Business in 2025",
    credits: 10,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "4",
    tool: "translator",
    title: "Product catalog translated to Spanish",
    credits: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "5",
    tool: "invoice-generator",
    title: "Invoice #1042 — Consulting Services",
    credits: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Good morning, Jane 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your AI tools today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {MOCK_STATS.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* AI Tools + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <AIToolsGrid />
        </div>
        <div>
          <RecentActivity activities={MOCK_ACTIVITY} />
        </div>
      </div>
    </div>
  );
}
