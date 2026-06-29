"use server";

import type { DbPlanType } from "@/types/database";
import type { AsyncActionResult } from "@/types";

export async function createCheckoutSession(
  _planId: DbPlanType,
  _annual: boolean,
): AsyncActionResult<{ url: string }> {
  throw new Error("Stripe checkout implemented in Milestone 10");
}

export async function createPortalSession(): AsyncActionResult<{ url: string }> {
  throw new Error("Stripe portal implemented in Milestone 10");
}

export async function cancelSubscription(): AsyncActionResult {
  throw new Error("Stripe cancellation implemented in Milestone 10");
}

export async function resumeSubscription(): AsyncActionResult {
  throw new Error("Stripe resume implemented in Milestone 10");
}
