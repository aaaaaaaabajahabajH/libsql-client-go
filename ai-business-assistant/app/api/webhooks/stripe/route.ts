import { NextRequest } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe";
import { planFromPriceId, STRIPE_PLAN_CREDITS } from "@/lib/stripe/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DbPlanType, DbSubscriptionStatus } from "@/types/database";

export const runtime = "nodejs";

function ok() {
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isoFromUnix(ts: number | null | undefined): string | null {
  return ts ? new Date(ts * 1000).toISOString() : null;
}

async function userIdFromCustomer(customerId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single<{ user_id: string }>();
  return data?.user_id ?? null;
}

async function handleSubscriptionUpsert(sub: Stripe.Subscription): Promise<void> {
  const admin = createAdminClient();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = sub.metadata?.user_id ?? (await userIdFromCustomer(customerId));
  if (!userId) return;

  const firstItem = sub.items.data[0];
  const priceId = firstItem?.price.id ?? null;
  const plan: DbPlanType = (priceId ? planFromPriceId(priceId) : null) ?? "free";
  const status = sub.status as DbSubscriptionStatus;

  const periodStart = isoFromUnix(firstItem?.current_period_start ?? null);
  const periodEnd = isoFromUnix(firstItem?.current_period_end ?? null);

  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      plan,
      status,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      stripe_price_id: priceId,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: sub.cancel_at_period_end,
    },
    { onConflict: "user_id" },
  );

  await admin.rpc(
    "update_user_plan",
    { p_user_id: userId, p_plan: plan } as unknown as { p_user_id: string; p_plan: DbPlanType },
  );
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
  const admin = createAdminClient();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = sub.metadata?.user_id ?? (await userIdFromCustomer(customerId));
  if (!userId) return;

  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      plan: "free",
      status: "canceled",
      stripe_customer_id: customerId,
      stripe_subscription_id: null,
      stripe_price_id: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
    },
    { onConflict: "user_id" },
  );

  await admin.rpc(
    "update_user_plan",
    { p_user_id: userId, p_plan: "free" } as unknown as { p_user_id: string; p_plan: DbPlanType },
  );

  await admin.rpc(
    "reset_monthly_credits",
    { p_user_id: userId, p_new_allowance: STRIPE_PLAN_CREDITS.free } as unknown as {
      p_user_id: string;
      p_new_allowance: number;
    },
  );
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  if (invoice.billing_reason !== "subscription_cycle") return;

  const admin = createAdminClient();
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const userId = await userIdFromCustomer(customerId);
  if (!userId) return;

  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .single<{ plan: DbPlanType }>();

  const plan: DbPlanType = sub?.plan ?? "free";
  const newAllowance = STRIPE_PLAN_CREDITS[plan];

  await admin.rpc(
    "reset_monthly_credits",
    { p_user_id: userId, p_new_allowance: newAllowance } as unknown as {
      p_user_id: string;
      p_new_allowance: number;
    },
  );
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const admin = createAdminClient();
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const userId = await userIdFromCustomer(customerId);
  if (!userId) return;

  await admin
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("user_id", userId);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.mode !== "subscription") return;
  const stripe = getStripe();

  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription?.id;

  if (!subscriptionId) return;

  const sub = await stripe.subscriptions.retrieve(subscriptionId);

  // Attach user_id to subscription metadata if not already set
  const userId = session.metadata?.user_id;
  if (userId && !sub.metadata?.user_id) {
    await stripe.subscriptions.update(subscriptionId, {
      metadata: { user_id: userId },
    });
  }

  await handleSubscriptionUpsert(sub);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return err("Missing stripe-signature or webhook secret", 400);
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    return err(`Webhook signature verification failed: ${e instanceof Error ? e.message : "unknown"}`, 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        break;
    }
  } catch (e) {
    console.error(`Webhook handler error [${event.type}]:`, e);
    return err("Internal webhook handler error", 500);
  }

  return ok();
}
