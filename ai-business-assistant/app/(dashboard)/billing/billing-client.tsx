"use client";

import {
  CreditCard,
  Receipt,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import {
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
  resumeSubscription,
} from "@/actions/billing";
import {
  BillingToggle,
  PlanCard,
  ComparisonTable,
  UpgradeDialog,
  CurrentPlanBanner,
} from "@/components/pricing";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { DbPlanType } from "@/types/database";
import type { CreditsRow, SubscriptionRow } from "@/types/database";
import { PLAN_CONFIGS } from "@/utils/constants";

interface Props {
  subscription: SubscriptionRow | null;
  credits: CreditsRow | null;
}

export function BillingClient({ subscription, credits }: Props) {
  const plan: DbPlanType = subscription?.plan ?? "free";
  const creditsBalance = credits?.balance ?? 0;
  const creditsTotal = credits?.monthly_allowance ?? 20;
  const nextBillingDate = subscription?.current_period_end ?? null;
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end ?? false;

  const [isAnnual, setIsAnnual] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [targetPlan, setTargetPlan] = React.useState<DbPlanType | null>(null);
  const [portalLoading, setPortalLoading] = React.useState(false);
  const [cancelLoading, setCancelLoading] = React.useState(false);
  const [resumeLoading, setResumeLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  function handleUpgrade(planId: DbPlanType) {
    setTargetPlan(planId);
    setDialogOpen(true);
  }

  async function handleConfirmUpgrade() {
    if (!targetPlan) return;
    setErrorMsg(null);
    const result = await createCheckoutSession(targetPlan, isAnnual);
    if (result.success) {
      window.location.href = result.data.url;
    } else {
      setErrorMsg(result.error);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    setErrorMsg(null);
    const result = await createPortalSession();
    setPortalLoading(false);
    if (result.success) {
      window.location.href = result.data.url;
    } else {
      setErrorMsg(result.error);
    }
  }

  async function handleCancelSubscription() {
    setCancelLoading(true);
    setErrorMsg(null);
    const result = await cancelSubscription();
    setCancelLoading(false);
    if (result.success) {
      setSuccessMsg("Your subscription will cancel at the end of the current billing period.");
    } else {
      setErrorMsg(result.error);
    }
  }

  async function handleResumeSubscription() {
    setResumeLoading(true);
    setErrorMsg(null);
    const result = await resumeSubscription();
    setResumeLoading(false);
    if (result.success) {
      setSuccessMsg("Your subscription has been resumed. It will renew as scheduled.");
    } else {
      setErrorMsg(result.error);
    }
  }

  const isPaid = plan !== "free";

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-10">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your subscription and payment information.
          </p>
        </div>

        {isPaid && (
          <Button
            disabled={portalLoading}
            size="sm"
            variant="outline"
            onClick={handleManageBilling}
          >
            {portalLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            Manage Payment Method
            <ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        )}
      </div>

      {/* Current plan banner */}
      <section>
        <CurrentPlanBanner
          creditsBalance={creditsBalance}
          creditsTotal={creditsTotal}
          nextBillingDate={nextBillingDate}
          plan={plan}
          showUpgradeButton={false}
        />
      </section>

      {/* Feedback banners */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{successMsg}</p>
        </div>
      )}

      {/* Status alerts */}
      {plan === "free" && !errorMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            You&apos;re on the Free plan. Upgrade to unlock more credits, saved documents, and
            priority generation.
          </p>
        </div>
      )}

      {isPaid && !cancelAtPeriodEnd && !successMsg && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <div className="text-sm text-emerald-700 dark:text-emerald-400">
              <span className="font-semibold">Active subscription.</span>{" "}
              Your plan renews automatically.{" "}
              <button
                className="underline underline-offset-2 hover:no-underline"
                onClick={handleManageBilling}
              >
                Manage billing
              </button>{" "}
              to update payment details.
            </div>
          </div>
          <Button
            className="text-destructive hover:text-destructive shrink-0"
            disabled={cancelLoading}
            size="sm"
            variant="ghost"
            onClick={handleCancelSubscription}
          >
            {cancelLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Cancel plan"}
          </Button>
        </div>
      )}

      {isPaid && cancelAtPeriodEnd && !successMsg && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <div className="flex items-start gap-3">
            <XCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-700 dark:text-amber-400">
              <span className="font-semibold">Cancellation scheduled.</span> Your subscription
              ends on{" "}
              {nextBillingDate
                ? new Date(nextBillingDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "the end of this billing period"}
              .
            </div>
          </div>
          <Button
            className="shrink-0"
            disabled={resumeLoading}
            size="sm"
            variant="outline"
            onClick={handleResumeSubscription}
          >
            {resumeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Resume plan"}
          </Button>
        </div>
      )}

      <Separator />

      {/* Upgrade section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Available Plans</h2>
            <p className="text-sm text-muted-foreground">
              Switch plans at any time. Changes take effect immediately.
            </p>
          </div>
          <BillingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {PLAN_CONFIGS.map((p) => (
            <PlanCard
              key={p.id}
              isAuthenticated
              currentPlan={plan}
              isAnnual={isAnnual}
              plan={p}
              onUpgrade={handleUpgrade}
            />
          ))}
        </div>
      </section>

      <Separator />

      {/* Comparison table */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Feature Comparison</h2>
          <p className="text-sm text-muted-foreground">
            Full breakdown of what&apos;s included across all plans.
          </p>
        </div>
        <ComparisonTable />
      </section>

      <Separator />

      {/* Invoice note */}
      <section className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-5 py-4">
        <Receipt className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Invoices & Payment History</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Download invoices and view past charges from the Stripe billing portal.
          </p>
        </div>
        {isPaid ? (
          <Button disabled={portalLoading} size="sm" variant="outline" onClick={handleManageBilling}>
            {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Open Portal"}
          </Button>
        ) : (
          <Link
            className="text-xs font-medium text-primary underline-offset-4 hover:underline shrink-0"
            href="/pricing"
          >
            Upgrade to access
          </Link>
        )}
      </section>

      <UpgradeDialog
        currentPlan={plan}
        isAnnual={isAnnual}
        open={dialogOpen}
        targetPlan={targetPlan}
        onConfirm={handleConfirmUpgrade}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
