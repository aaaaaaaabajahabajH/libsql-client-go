import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DbPlanType, DbSubscriptionStatus, SubscriptionRow } from "@/types/database";

export async function getSubscription(userId: string): Promise<SubscriptionRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single<SubscriptionRow>();

  return data ?? null;
}

export interface UpsertSubscriptionInput {
  userId: string;
  plan: DbPlanType;
  status: DbSubscriptionStatus;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export async function upsertSubscription(input: UpsertSubscriptionInput): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("subscriptions")
    .upsert(
      {
        user_id: input.userId,
        plan: input.plan,
        status: input.status,
        stripe_customer_id: input.stripeCustomerId,
        stripe_subscription_id: input.stripeSubscriptionId,
        stripe_price_id: input.stripePriceId,
        current_period_start: input.currentPeriodStart,
        current_period_end: input.currentPeriodEnd,
        cancel_at_period_end: input.cancelAtPeriodEnd,
      },
      { onConflict: "user_id" },
    );
}

/**
 * Finds or creates a Stripe customer for the given user.
 * Persists the customer ID in the subscriptions table so subsequent calls
 * return the same customer without hitting the Stripe API.
 */
export async function syncStripeCustomer(userId: string, email: string): Promise<string> {
  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single<Pick<SubscriptionRow, "stripe_customer_id">>();

  if (sub?.stripe_customer_id) return sub.stripe_customer_id;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });

  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customer.id,
      plan: "free",
      status: "active",
      stripe_subscription_id: null,
      stripe_price_id: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
    },
    { onConflict: "user_id" },
  );

  return customer.id;
}

export async function setSubscriptionCancelAtPeriodEnd(
  userId: string,
  cancel: boolean,
): Promise<void> {
  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .single<Pick<SubscriptionRow, "stripe_subscription_id">>();

  if (!sub?.stripe_subscription_id) {
    throw new Error("No active subscription found");
  }

  const stripe = getStripe();
  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    cancel_at_period_end: cancel,
  });

  await admin
    .from("subscriptions")
    .update({ cancel_at_period_end: cancel })
    .eq("user_id", userId);
}
