import { Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CreditDisplayProps {
  cost: number;
  balance: number;
  className?: string;
}

export function CreditDisplay({ cost, balance, className }: CreditDisplayProps) {
  const insufficient = balance < cost;

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <Badge
        className={cn(
          "gap-1 font-semibold px-2.5 py-1",
          insufficient
            ? "border-destructive/50 bg-destructive/10 text-destructive"
            : "border-primary/30 bg-primary/10 text-primary",
        )}
        variant="outline"
      >
        <Zap className="h-3 w-3" />
        {cost} credits
      </Badge>
      <span className={cn("text-xs", insufficient ? "text-destructive" : "text-muted-foreground")}>
        {insufficient
          ? `Insufficient (you have ${balance})`
          : `${balance} available`}
      </span>
    </div>
  );
}
