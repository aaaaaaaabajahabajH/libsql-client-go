import Link from "next/link";
import { Zap, Calendar, TrendingUp, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DbPlanType } from "@/types/database";

interface CurrentPlanBannerProps {
  plan: DbPlanType;
  creditsBalance: number;
  creditsTotal: number;
  nextBillingDate: string | null;
  showUpgradeButton?: boolean;
}

const PLAN_LABELS: Record<DbPlanType, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

const PLAN_BADGE_CLASSES: Record<DbPlanType, string> = {
  free: "bg-muted text-muted-foreground border-border",
  starter: "bg-primary/15 text-primary border-primary/30",
  pro: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  enterprise: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function CurrentPlanBanner({
  plan,
  creditsBalance,
  creditsTotal,
  nextBillingDate,
  showUpgradeButton = true,
}: CurrentPlanBannerProps) {
  const usedCredits = creditsTotal - creditsBalance;
  const percentage = creditsTotal > 0 ? Math.round((usedCredits / creditsTotal) * 100) : 0;
  const isFree = plan === "free";
  const isPro = plan === "pro" || plan === "enterprise";

  return (
    <div
      className={cn(
        "rounded-2xl border p-6",
        isPro
          ? "border-primary/30 bg-gradient-to-br from-primary/5 to-violet-500/5"
          : "border-border bg-card",
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left: plan info */}
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                isPro ? "bg-primary/15" : "bg-muted",
              )}
            >
              {isPro ? (
                <Crown className="h-5 w-5 text-primary" />
              ) : (
                <Zap className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Current Plan
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <h3 className="text-lg font-bold">{PLAN_LABELS[plan]}</h3>
                <Badge
                  variant="outline"
                  className={cn("text-xs font-semibold", PLAN_BADGE_CLASSES[plan])}
                >
                  {PLAN_LABELS[plan]}
                </Badge>
              </div>
            </div>
          </div>

          {/* Credits */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Credits Used
              </span>
              <span className="font-semibold tabular-nums">
                {usedCredits.toLocaleString()} / {creditsTotal.toLocaleString()}
              </span>
            </div>
            <Progress
              value={percentage}
              className={cn(
                "h-2",
                percentage >= 90 && "[&>[data-slot=indicator]]:bg-destructive",
                percentage >= 70 &&
                  percentage < 90 &&
                  "[&>[data-slot=indicator]]:bg-amber-500",
              )}
            />
            <p className="text-xs text-muted-foreground">
              {creditsBalance.toLocaleString()} credits remaining
            </p>
          </div>

          {/* Billing date */}
          {nextBillingDate && !isFree && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Next billing date:{" "}
                <strong className="text-foreground font-medium">
                  {formatDate(nextBillingDate)}
                </strong>
              </span>
            </div>
          )}

          {isFree && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Credits reset monthly on your signup anniversary</span>
            </div>
          )}
        </div>

        {/* Right: upgrade CTA */}
        {showUpgradeButton && !isPro && (
          <div className="shrink-0 flex flex-col gap-2 sm:items-end">
            <Button asChild size="sm" className="shadow-glow-sm font-semibold">
              <Link href="/pricing">
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                Upgrade Plan
              </Link>
            </Button>
            {isFree && (
              <p className="text-xs text-muted-foreground text-right">
                Get 20× more credits with Starter
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
