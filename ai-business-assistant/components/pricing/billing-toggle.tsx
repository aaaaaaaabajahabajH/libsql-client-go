"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BillingToggleProps {
  isAnnual: boolean;
  onToggle: (annual: boolean) => void;
  className?: string;
}

export function BillingToggle({ isAnnual, onToggle, className }: BillingToggleProps) {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          !isAnnual ? "text-foreground" : "text-muted-foreground",
        )}
      >
        Monthly
      </span>

      <Switch
        checked={isAnnual}
        onCheckedChange={onToggle}
        aria-label="Toggle annual billing"
        className="data-[state=checked]:bg-primary"
      />

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-sm font-medium transition-colors",
            isAnnual ? "text-foreground" : "text-muted-foreground",
          )}
        >
          Annual
        </span>
        <Badge
          variant="secondary"
          className={cn(
            "text-xs font-semibold px-2 py-0.5 transition-all duration-300",
            isAnnual
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              : "opacity-60",
          )}
        >
          Save 20%
        </Badge>
      </div>
    </div>
  );
}
