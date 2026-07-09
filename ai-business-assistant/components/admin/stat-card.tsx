import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: number;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const variantStyles = {
    default: "bg-card border-border",
    success: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800",
    warning: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
    danger: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
  };

  const iconStyles = {
    default: "bg-muted text-muted-foreground",
    success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    danger: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
  };

  const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend === undefined
      ? ""
      : trend > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : trend < 0
          ? "text-red-500 dark:text-red-400"
          : "text-muted-foreground";

  return (
    <div
      className={cn(
        "rounded-xl border p-5 flex flex-col gap-4 transition-shadow hover:shadow-sm",
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            iconStyles[variant],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {TrendIcon && trend !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
            <TrendIcon className="h-3.5 w-3.5" />
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-sm font-medium text-muted-foreground mt-0.5">{label}</p>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </div>
    </div>
  );
}
