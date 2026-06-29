import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { icon: "h-8 w-8", iconWrap: "h-12 w-12", title: "text-sm", desc: "text-xs", padding: "py-6" },
  md: { icon: "h-10 w-10", iconWrap: "h-16 w-16", title: "text-base", desc: "text-sm", padding: "py-10" },
  lg: { icon: "h-12 w-12", iconWrap: "h-20 w-20", title: "text-lg", desc: "text-sm", padding: "py-16" },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const s = sizeMap[size];

  return (
    <div className={cn("flex flex-col items-center justify-center text-center", s.padding, className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-muted/60 mb-4",
          s.iconWrap,
        )}
      >
        <Icon className={cn("text-muted-foreground", s.icon)} />
      </div>
      <p className={cn("font-semibold text-foreground mb-1", s.title)}>{title}</p>
      <p className={cn("text-muted-foreground max-w-xs", s.desc)}>{description}</p>
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Button asChild size="sm" variant="outline">
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
