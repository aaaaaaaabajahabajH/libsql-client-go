import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildCreditsState } from "@/services/credits";
import { DashboardHeader } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
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

  const [profileResult, creditsResult] = await Promise.all([
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
        plan={plan}
        creditsBalance={creditsState.balance}
        creditsTotal={monthlyAllowance}
        creditsPercentage={creditsState.percentage}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <DashboardHeader
          userName={profile?.full_name ?? null}
          userEmail={user.email ?? ""}
          avatarUrl={profile?.avatar_url ?? null}
          plan={plan}
          creditsBalance={creditsState.balance}
          creditsTotal={monthlyAllowance}
          creditsPercentage={creditsState.percentage}
        />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
