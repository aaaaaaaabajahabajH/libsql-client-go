"use client";

import * as React from "react";
import Link from "next/link";
import { Shield, Zap, RefreshCw, Headphones, ArrowRight } from "lucide-react";
import { LandingNavbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import {
  BillingToggle,
  PlanCard,
  ComparisonTable,
  PricingFaq,
  UpgradeDialog,
} from "@/components/pricing";
import { PLAN_CONFIGS } from "@/utils/constants";
import type { DbPlanType } from "@/types/database";

const guarantees = [
  { icon: Shield, label: "7-day money-back guarantee" },
  { icon: Zap, label: "Instant access after payment" },
  { icon: RefreshCw, label: "Cancel anytime" },
  { icon: Headphones, label: "Priority support on paid plans" },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [targetPlan, setTargetPlan] = React.useState<DbPlanType | null>(null);

  function handleUpgrade(planId: DbPlanType) {
    setTargetPlan(planId);
    setDialogOpen(true);
  }

  async function handleConfirmUpgrade() {
    await new Promise<void>((r) => setTimeout(r, 1200));
  }

  return (
    <>
      <LandingNavbar />

      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-16">
          <div className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            Simple, transparent pricing
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Choose the plan that{" "}
            <span className="gradient-text">fits your business</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Start free, upgrade when you need more. All plans include access to all 6 AI
            tools — just pick how many credits you need each month.
          </p>

          <BillingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />
        </section>

        {/* Plan cards */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-20">
          <div className="grid gap-6 sm:grid-cols-3">
            {PLAN_CONFIGS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isAnnual={isAnnual}
                isAuthenticated={false}
                onUpgrade={handleUpgrade}
              />
            ))}
          </div>

          {/* Guarantees */}
          <div className="mt-10 flex flex-wrap justify-center gap-6">
            {guarantees.map((g) => (
              <div key={g.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <g.icon className="h-4 w-4 text-primary shrink-0" />
                {g.label}
              </div>
            ))}
          </div>
        </section>

        {/* Comparison table */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-24">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Compare all features
            </h2>
            <p className="mt-3 text-muted-foreground">
              A detailed breakdown of what&apos;s included in each plan.
            </p>
          </div>
          <ComparisonTable />
        </section>

        {/* Enterprise callout */}
        <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 mb-24">
          <div className="rounded-2xl border border-border bg-muted/30 p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Need more? Let&apos;s talk Enterprise.</h3>
            <p className="text-muted-foreground text-sm mb-5 max-w-lg mx-auto">
              Custom credit volumes, SSO, dedicated onboarding, SLA guarantees, and team
              management. Built for agencies and large businesses.
            </p>
            <Link
              href="mailto:sales@aibusiness.ai"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Contact Sales
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
          <PricingFaq />
        </section>
      </main>

      <Footer />

      <UpgradeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        targetPlan={targetPlan}
        currentPlan="free"
        isAnnual={isAnnual}
        onConfirm={handleConfirmUpgrade}
      />
    </>
  );
}
