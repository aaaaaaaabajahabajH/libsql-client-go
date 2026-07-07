import type { DbPlanType } from "@/types/database";

/**
 * Monthly credit allowance per plan.
 * Pro uses 999_999 as a sentinel for "unlimited" (never actually exhausted).
 */
export const STRIPE_PLAN_CREDITS: Record<DbPlanType, number> = {
  free: 20,
  starter: 500,
  pro: 999_999,
  enterprise: 999_999,
};

/**
 * Returns true when the monthly_allowance represents an unlimited credit pool.
 */
export function isUnlimitedCredits(allowance: number): boolean {
  return allowance >= 999_999;
}

/**
 * Maps a Stripe Price ID to a plan type.
 * Returns null when the price ID isn't recognised.
 */
export function planFromPriceId(priceId: string): DbPlanType | null {
  const starterMonthly = process.env.STRIPE_STARTER_MONTHLY_PRICE_ID;
  const starterAnnual = process.env.STRIPE_STARTER_ANNUAL_PRICE_ID;
  const proMonthly = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  const proAnnual = process.env.STRIPE_PRO_ANNUAL_PRICE_ID;

  if (priceId === starterMonthly || priceId === starterAnnual) return "starter";
  if (priceId === proMonthly || priceId === proAnnual) return "pro";
  return null;
}

/**
 * Returns the correct Stripe Price ID for a given plan + billing interval.
 */
export function priceIdForPlan(planId: DbPlanType, annual: boolean): string {
  if (planId === "starter") {
    return annual
      ? process.env.STRIPE_STARTER_ANNUAL_PRICE_ID!
      : process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!;
  }
  if (planId === "pro") {
    return annual
      ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID!
      : process.env.STRIPE_PRO_MONTHLY_PRICE_ID!;
  }
  throw new Error(`No Stripe price for plan: ${planId}`);
}
