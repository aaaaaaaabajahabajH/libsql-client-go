import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionRow, DbSubscriptionStatus } from "@/types/database";

export interface AdminSubscriptionRow extends SubscriptionRow {
  user_email: string | null;
  user_name: string | null;
}

export interface SubscriptionStats {
  active: number;
  pastDue: number;
  canceled: number;
  trialing: number;
}

export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  const admin = createAdminClient();
  const { data } = await admin.from("subscriptions").select("status");

  const counts = { active: 0, pastDue: 0, canceled: 0, trialing: 0 };
  (data ?? []).forEach((r) => {
    if (r.status === "active") counts.active += 1;
    else if (r.status === "past_due") counts.pastDue += 1;
    else if (r.status === "canceled") counts.canceled += 1;
    else if (r.status === "trialing") counts.trialing += 1;
  });
  return counts;
}

export async function listSubscriptions(
  status?: string,
  page = 1,
  pageSize = 20,
): Promise<{ subs: AdminSubscriptionRow[]; total: number; totalPages: number }> {
  const admin = createAdminClient();

  let query = admin
    .from("subscriptions")
    .select("*", { count: "exact" });

  if (status && status !== "all") {
    query = query.eq("status", status as DbSubscriptionStatus);
  }

  const from = (page - 1) * pageSize;
  const { data: subs, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (!subs) return { subs: [], total: 0, totalPages: 0 };

  const userIds = subs.map((s) => s.user_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, { email: p.email, name: p.full_name }]),
  );

  const total = count ?? 0;
  return {
    subs: subs.map((s) => ({
      ...(s as SubscriptionRow),
      user_email: profileMap[s.user_id]?.email ?? null,
      user_name: profileMap[s.user_id]?.name ?? null,
    })),
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getExpiringSubscriptions(days = 7): Promise<AdminSubscriptionRow[]> {
  const admin = createAdminClient();
  const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const { data: subs } = await admin
    .from("subscriptions")
    .select("*")
    .eq("status", "active")
    .lte("current_period_end", future)
    .gte("current_period_end", now)
    .order("current_period_end", { ascending: true });

  if (!subs?.length) return [];

  const userIds = subs.map((s) => s.user_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, { email: p.email, name: p.full_name }]),
  );

  return subs.map((s) => ({
    ...(s as SubscriptionRow),
    user_email: profileMap[s.user_id]?.email ?? null,
    user_name: profileMap[s.user_id]?.name ?? null,
  }));
}
