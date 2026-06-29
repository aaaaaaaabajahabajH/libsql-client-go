import Link from "next/link";
import { Zap, RefreshCw, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DbPlanType } from "@/types/database";

interface CreditsCardProps {
  balance: number;
  totalUsed: number;
  monthlyAllowance: number;
  percentage: number;
  resetAt: string;
  plan: DbPlanType;
}

function formatResetDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric" });
  } catch {
    return "next month";
  }
}

export function CreditsCard({
  balance,
  totalUsed,
  monthlyAllowance,
  percentage,
  resetAt,
  plan,
}: CreditsCardProps) {
  const isLow = percentage >= 80;
  const isCritical = percentage >= 95;

  return (
    <Card className="border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            Credit Usage
          </div>
          <span className="text-xs font-normal text-muted-foreground capitalize">{plan} plan</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Balance display */}
        <div className="flex items-end justify-between">
          <div>
            <p className={cn("text-3xl font-bold tabular-nums", isCritical && "text-destructive", isLow && !isCritical && "text-warning")}>
              {balance.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">credits remaining</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">{totalUsed.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">used this month</p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <Progress
            value={percentage}
            className={cn(
              "h-2",
              isCritical && "[&>div]:bg-destructive",
              isLow && !isCritical && "[&>div]:bg-warning",
            )}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{percentage}% used</span>
            <span>of {monthlyAllowance.toLocaleString()} / mo</span>
          </div>
        </div>

        {/* Reset info */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50">
          <RefreshCw className="h-3.5 w-3.5 shrink-0" />
          <span>Resets {formatResetDate(resetAt)}</span>
        </div>

        {/* Upgrade CTA when running low */}
        {isLow && (plan === "free" || plan === "starter") && (
          <Button asChild size="sm" className="w-full h-8 text-xs" variant={isCritical ? "default" : "outline"}>
            <Link href="/pricing">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              {isCritical ? "Upgrade Now" : "Get More Credits"}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
