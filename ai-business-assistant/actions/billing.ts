"use server";

import { redirect } from "next/navigation";

import { getStripe } from "@/lib/stripe";
import { priceIdForPlan } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";
import { syncStripeCustomer, setSubscriptionCancelAtPeriodEnd } from "@/services/subscription";
import { APP_URL } from "@/utils/constants";
import type { DbPlanType } from "@/types/database";
import type { AsyncActionResult } from "@/types";

export async function createCheckoutSession(
  planId: DbPlanType,
  annual: boolean,
): AsyncActionResult<{ url: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "You must be signed in to upgrade." };

    const priceId = priceIdForPlan(planId, annual);
    const customerId = await syncStripeCustomer(user.id, user.email!);

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/billing?session_id={CHECKOUT_SESSION_ID}&upgraded=1`,
      cancel_url: `${APP_URL}/billing`,
      metadata: { user_id: user.id },
      subscription_data: {
        metadata: { user_id: user.id },
      },
      allow_promotion_codes: true,
    });

    return { success: true, data: { url: session.url! } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to start checkout.",
    };
  }
}

export async function createPortalSession(): AsyncActionResult<{ url: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "You must be signed in." };

    const customerId = await syncStripeCustomer(user.id, user.email!);
    const stripe = getStripe();

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/billing`,
    });

    return { success: true, data: { url: session.url } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to open billing portal.",
    };
  }
}

export async function cancelSubscription(): AsyncActionResult {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "You must be signed in." };

    await setSubscriptionCancelAtPeriodEnd(user.id, true);
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cancel subscription.",
    };
  }
}

export async function resumeSubscription(): AsyncActionResult {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "You must be signed in." };

    await setSubscriptionCancelAtPeriodEnd(user.id, false);
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to resume subscription.",
    };
  }
}

/**
 * Server action that redirects the user to the Stripe Customer Portal.
 * Use when you need a full redirect rather than a client-side URL navigation.
 */
export async function redirectToPortal(): Promise<never> {
  const result = await createPortalSession();
  if (result.success) {
    redirect(result.data.url);
  }
  redirect("/billing");
}
