"use client";

import { Check, X, Zap, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlanConfig } from "@/types";
import type { DbPlanType } from "@/types/database";

interface PlanCardProps {
  plan: PlanConfig;
  isAnnual: boolean;
  currentPlan?: DbPlanType;
  isAuthenticated: boolean;
  onUpgrade?: (planId: DbPlanType) => void;
}

const ANNUAL_PRICES: Record<string, number> = {
  free: 0,
  starter: 15,
  pro: 39,
};

const ANNUAL_SAVINGS: Record<string, number> = {
  starter: 48,
  pro: 120,
};

export function PlanCard({
  plan,
  isAnnual,
  currentPlan,
  isAuthenticated,
  onUpgrade,
}: PlanCardProps) {
  const monthlyPrice = isAnnual ? (ANNUAL_PRICES[plan.id] ?? plan.price) : plan.price;
  const isCurrent = currentPlan === plan.id;
  const annualSavings = ANNUAL_SAVINGS[plan.id];

  const isUpgrade = (() => {
    if (!currentPlan) return false;
    const order: DbPlanType[] = ["free", "starter", "pro", "enterprise"];
    return order.indexOf(plan.id) > order.indexOf(currentPlan);
  })();

  const isDowngrade = (() => {
    if (!currentPlan) return false;
    const order: DbPlanType[] = ["free", "starter", "pro", "enterprise"];
    return order.indexOf(plan.id) < order.indexOf(currentPlan);
  })();

  function getCtaLabel() {
    if (!isAuthenticated) return "Get Started";
    if (isCurrent) return "Current Plan";
    if (isUpgrade) return `Upgrade to ${plan.name}`;
    if (isDowngrade) return `Downgrade to ${plan.name}`;
    return "Get Started";
  }

  function handleCta() {
    if (!isAuthenticated) return;
    if (isCurrent) return;
    if (onUpgrade) onUpgrade(plan.id);
  }

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 transition-all duration-300",
        plan.highlighted
          ? "border-primary bg-primary/5 shadow-glow scale-[1.02] dark:bg-primary/10"
          : "border-border bg-card hover:border-primary/40 hover:shadow-md",
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground shadow-glow-sm px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3 w-3 mr-1" />
            {plan.badge}
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="space-y-2 mb-6">
        <h3 className="text-lg font-bold">{plan.name}</h3>
        <p className="text-sm text-muted-foreground">{plan.description}</p>

        <div className="pt-2">
          <div className="flex items-end gap-1">
            <span className="text-4xl font-extrabold tracking-tight">
              ${monthlyPrice}
            </span>
            {plan.price > 0 && (
              <span className="text-muted-foreground text-sm mb-1.5">/month</span>
            )}
            {plan.price === 0 && (
              <span className="text-muted-foreground text-sm mb-1.5">forever</span>
            )}
          </div>

          {isAnnual && plan.price > 0 && (
            <div className="mt-1 space-y-0.5">
              <p className="text-xs text-muted-foreground">
                Billed ${monthlyPrice * 12}/year
              </p>
              {annualSavings && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Save ${annualSavings}/year
                </p>
              )}
            </div>
          )}

          {!isAnnual && plan.price > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">Billed monthly</p>
          )}

          {plan.price === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">No credit card required</p>
          )}
        </div>
      </div>

      {/* Credits badge */}
      <div className="flex items-center gap-1.5 mb-5 rounded-lg bg-primary/10 px-3 py-2 border border-primary/20">
        <Zap className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-semibold text-primary">
          {plan.credits.toLocaleString()} credits / month
        </span>
      </div>

      {/* CTA */}
      {isAuthenticated ? (
        <Button
          className={cn(
            "w-full mb-6 font-semibold",
            plan.highlighted && "shadow-glow-sm",
            isCurrent && "opacity-60 cursor-not-allowed",
            isDowngrade && "border-destructive/50 text-destructive hover:bg-destructive/10",
          )}
          disabled={isCurrent}
          variant={plan.highlighted ? "default" : "outline"}
          onClick={handleCta}
        >
          {isCurrent ? (
            "Current Plan"
          ) : (
            <>
              {getCtaLabel()}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </>
          )}
        </Button>
      ) : (
        <Button
          asChild
          className={cn("w-full mb-6 font-semibold", plan.highlighted && "shadow-glow-sm")}
          variant={plan.highlighted ? "default" : "outline"}
        >
          <Link href={plan.price === 0 ? "/register" : "/register"}>
            {plan.price === 0 ? "Start Free" : "Get Started"}
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </Button>
      )}

      {/* Feature list */}
      <ul className="space-y-3">
        {plan.features.map((feature) => (
          <li key={feature.text} className="flex items-start gap-2.5">
            <span
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                feature.included
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {feature.included ? (
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              ) : (
                <X className="h-2.5 w-2.5" strokeWidth={3} />
              )}
            </span>
            <span
              className={cn(
                "text-sm leading-snug",
                feature.included ? "text-foreground" : "text-muted-foreground line-through",
              )}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
