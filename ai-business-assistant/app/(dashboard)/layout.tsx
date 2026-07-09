import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { createClient } from "@/lib/supabase/server";
import { buildCreditsState } from "@/services/credits";
import { getUnreadCount } from "@/services/notifications";
import type { DbPlanType, ProfileRow, CreditsRow } from "@/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profileResult, creditsResult, unreadCount] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single<ProfileRow>(),
    supabase
      .from("credits")
      .select("*")
      .eq("user_id", user.id)
      .single<CreditsRow>(),
    getUnreadCount(user.id),
  ]);

  const profile = profileResult.data;
  const credits = creditsResult.data;

  const plan: DbPlanType = profile?.plan ?? "free";

  const creditsState = credits
    ? buildCreditsState(
        credits.balance,
        credits.total_used,
        credits.monthly_allowance,
        credits.reset_at,
      )
    : { balance: 0, totalUsed: 0, percentage: 0, resetAt: "" };

  const monthlyAllowance = credits?.monthly_allowance ?? 50;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        creditsBalance={creditsState.balance}
        creditsPercentage={creditsState.percentage}
        creditsTotal={monthlyAllowance}
        plan={plan}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <DashboardHeader
          avatarUrl={profile?.avatar_url ?? null}
          creditsBalance={creditsState.balance}
          creditsPercentage={creditsState.percentage}
          creditsTotal={monthlyAllowance}
          plan={plan}
          unreadNotificationCount={unreadCount}
          userEmail={user.email ?? ""}
          userName={profile?.full_name ?? null}
        />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
