import { BarChart3, FileText, Zap, Clock } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  WelcomeCard,
  StatsCard,
  CreditsCard,
  AIToolsGrid,
  RecentActivity,
  SavedDocumentsPreview,
  QuickActions,
  WelcomeCardSkeleton,
  StatsSectionSkeleton,
  CreditsCardSkeleton,
  AIToolsGridSkeleton,
  ActivitySkeleton,
  SavedDocumentsSkeleton,
} from "@/components/dashboard";
import type { ActivityItem } from "@/components/dashboard/recent-activity";
import type { SavedDocumentPreview } from "@/components/dashboard/saved-documents-preview";
import { createClient } from "@/lib/supabase/server";
import { buildCreditsState } from "@/services/credits";
import type {
  DbPlanType,
  DbToolType,
  ProfileRow,
  CreditsRow,
  HistoryRow,
  SavedDocumentRow,
} from "@/types/database";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your AI Business Assistant dashboard.",
};

/* ─── Data fetching ───────────────────────────────────────── */

async function getDashboardData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileResult, creditsResult, historyResult, savedResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<ProfileRow>(),
    supabase.from("credits").select("*").eq("user_id", user.id).single<CreditsRow>(),
    supabase
      .from("history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<HistoryRow[]>(),
    supabase
      .from("saved_documents")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(5)
      .returns<SavedDocumentRow[]>(),
  ]);

  const profile = profileResult.data;
  const credits = creditsResult.data;
  const historyRows = historyResult.data ?? [];
  const savedRows = savedResult.data ?? [];

  const creditsState = credits
    ? buildCreditsState(
        credits.balance,
        credits.total_used,
        credits.monthly_allowance,
        credits.reset_at,
      )
    : { balance: 0, totalUsed: 0, percentage: 0, resetAt: "" };

  const monthlyAllowance = credits?.monthly_allowance ?? 50;

  const activities: ActivityItem[] = historyRows.map((h) => ({
    id: h.id,
    tool: h.tool as DbToolType,
    title: h.title,
    creditsUsed: h.credits_used,
    createdAt: h.created_at,
  }));

  const savedDocs: SavedDocumentPreview[] = savedRows.map((d) => ({
    id: d.id,
    tool: d.tool as DbToolType,
    title: d.title,
    isFavorite: d.is_favorite,
    updatedAt: d.updated_at,
  }));

  return {
    userName: profile?.full_name ?? null,
    plan: (profile?.plan ?? "free") as DbPlanType,
    creditsState,
    monthlyAllowance,
    activities,
    savedDocs,
  } as const;
}

/* ─── Stats builder ───────────────────────────────────────── */

function buildStats(totalGenerations: number, creditsUsed: number, savedCount: number) {
  return [
    {
      title: "AI Generations",
      value: totalGenerations.toLocaleString(),
      change: totalGenerations > 0 ? `+${totalGenerations} total` : "None yet",
      trend: totalGenerations > 0 ? ("up" as const) : ("neutral" as const),
      icon: BarChart3,
      iconColor: "text-violet-500",
      iconBg: "bg-violet-500/10",
    },
    {
      title: "Credits Used",
      value: creditsUsed.toLocaleString(),
      change: creditsUsed > 0 ? "This month" : "None yet",
      trend: "neutral" as const,
      icon: Zap,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
    },
    {
      title: "Saved Documents",
      value: savedCount.toLocaleString(),
      change: savedCount > 0 ? `${savedCount} total` : "None saved",
      trend: savedCount > 0 ? ("up" as const) : ("neutral" as const),
      icon: FileText,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
    },
    {
      title: "Tools Available",
      value: "6",
      change: "All accessible",
      trend: "neutral" as const,
      icon: Clock,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-500/10",
    },
  ];
}

/* ─── Page ────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const data = await getDashboardData();
  const stats = buildStats(
    data.activities.length,
    data.creditsState.totalUsed,
    data.savedDocs.length,
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in max-w-screen-2xl mx-auto">
      <Suspense fallback={<WelcomeCardSkeleton />}>
        <WelcomeCard
          creditsBalance={data.creditsState.balance}
          totalGenerations={data.activities.length}
          userName={data.userName}
        />
      </Suspense>

      <Suspense fallback={<StatsSectionSkeleton />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>
      </Suspense>

      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<AIToolsGridSkeleton />}>
            <AIToolsGrid />
          </Suspense>
        </div>

        <div className="space-y-6">
          <Suspense fallback={<CreditsCardSkeleton />}>
            <CreditsCard
              balance={data.creditsState.balance}
              monthlyAllowance={data.monthlyAllowance}
              percentage={data.creditsState.percentage}
              plan={data.plan}
              resetAt={data.creditsState.resetAt}
              totalUsed={data.creditsState.totalUsed}
            />
          </Suspense>

          <Suspense fallback={<SavedDocumentsSkeleton />}>
            <SavedDocumentsPreview documents={data.savedDocs} />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity activities={data.activities} />
      </Suspense>
    </div>
  );
}
