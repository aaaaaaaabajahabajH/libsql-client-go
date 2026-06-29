"use client";

import * as React from "react";
import { Loader2, Zap, ArrowRight, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { PLAN_CONFIGS } from "@/utils/constants";
import type { DbPlanType } from "@/types/database";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPlan: DbPlanType | null;
  currentPlan: DbPlanType;
  isAnnual: boolean;
  onConfirm: () => Promise<void>;
}

const ANNUAL_PRICES: Record<string, number> = {
  starter: 15,
  pro: 39,
};

const PLAN_ORDER: DbPlanType[] = ["free", "starter", "pro", "enterprise"];

export function UpgradeDialog({
  open,
  onOpenChange,
  targetPlan,
  currentPlan,
  isAnnual,
  onConfirm,
}: UpgradeDialogProps) {
  const [loading, setLoading] = React.useState(false);

  const target = PLAN_CONFIGS.find((p) => p.id === targetPlan);
  const current = PLAN_CONFIGS.find((p) => p.id === currentPlan);

  if (!target || !current) return null;

  const isUpgrade = PLAN_ORDER.indexOf(target.id) > PLAN_ORDER.indexOf(currentPlan);
  const isDowngrade = !isUpgrade;

  const displayPrice = isAnnual
    ? (ANNUAL_PRICES[target.id] ?? target.price)
    : target.price;

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div
            className={cn(
              "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full",
              isUpgrade ? "bg-primary/15" : "bg-amber-500/15",
            )}
          >
            {isUpgrade ? (
              <Zap className="h-6 w-6 text-primary" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            )}
          </div>

          <AlertDialogTitle className="text-center">
            {isUpgrade ? `Upgrade to ${target.name}` : `Downgrade to ${target.name}`}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-center space-y-3">
            <span className="block">
              You&apos;re moving from{" "}
              <strong className="text-foreground">{current.name}</strong> to{" "}
              <strong className="text-foreground">{target.name}</strong>.
            </span>

            {target.price > 0 && (
              <span className="block rounded-lg bg-muted px-4 py-3 text-sm">
                <strong className="text-foreground text-base">
                  ${displayPrice}/month
                </strong>
                {isAnnual && (
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    Billed ${displayPrice * 12}/year
                  </span>
                )}
              </span>
            )}

            {isUpgrade && (
              <span className="block text-sm">
                You&apos;ll be redirected to Stripe to complete your payment securely.
                Your new credits will activate immediately.
              </span>
            )}

            {isDowngrade && (
              <span className="block text-sm text-amber-600 dark:text-amber-400">
                Your current plan remains active until the end of the billing period.
                You&apos;ll lose access to premium features at that time.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={loading}
            className={cn(
              "font-semibold",
              isDowngrade &&
                "bg-amber-500 hover:bg-amber-600 text-white border-amber-500",
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                {isUpgrade ? "Continue to Payment" : `Confirm Downgrade`}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
