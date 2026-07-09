import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  operational: {
    label: "Operational",
    dot: "bg-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
  },
  down: {
    label: "Down",
    dot: "bg-red-500",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
  },
  active: {
    label: "Active",
    dot: "bg-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  canceled: {
    label: "Canceled",
    dot: "bg-muted-foreground",
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
  past_due: {
    label: "Past Due",
    dot: "bg-red-500",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
  },
  trialing: {
    label: "Trialing",
    dot: "bg-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
  },
  suspended: {
    label: "Suspended",
    dot: "bg-orange-500",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_MAP[status] ?? {
    label: status,
    dot: "bg-muted-foreground",
    bg: "bg-muted",
    text: "text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        style.bg,
        style.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {style.label}
    </span>
  );
}
