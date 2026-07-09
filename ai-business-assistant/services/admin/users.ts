import { sanitizeSearchQuery } from "@/lib/sanitize";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileRow, SubscriptionRow, CreditsRow, DbPlanType } from "@/types/database";

export interface AdminUserRow extends ProfileRow {
  subscription: Pick<SubscriptionRow, "plan" | "status" | "current_period_end"> | null;
  credits: Pick<CreditsRow, "balance" | "monthly_allowance" | "total_used"> | null;
}

export interface AdminUserListParams {
  search?: string;
  plan?: DbPlanType | "all";
  suspended?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AdminUserListResult {
  users: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listAdminUsers(
  params: AdminUserListParams = {},
): Promise<AdminUserListResult> {
  const admin = createAdminClient();
  const { search = "", plan = "all", suspended, page = 1, pageSize = 20 } = params;

  let query = admin
    .from("profiles")
    .select("*", { count: "exact" });

  if (search) {
    const safe = sanitizeSearchQuery(search);
    query = query.or(
      `email.ilike.%${safe}%,full_name.ilike.%${safe}%,username.ilike.%${safe}%`,
    );
  }
  if (plan !== "all") {
    query = query.eq("plan", plan);
  }
  if (typeof suspended === "boolean") {
    query = query.eq("is_suspended", suspended);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: profiles, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!profiles) {
    return { users: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const ids = profiles.map((p) => p.id);

  const [{ data: subs }, { data: credits }] = await Promise.all([
    admin
      .from("subscriptions")
      .select("user_id, plan, status, current_period_end")
      .in("user_id", ids),
    admin
      .from("credits")
      .select("user_id, balance, monthly_allowance, total_used")
      .in("user_id", ids),
  ]);

  const subMap = Object.fromEntries(
    (subs ?? []).map((s) => [s.user_id, { plan: s.plan, status: s.status, current_period_end: s.current_period_end }]),
  );
  const creditsMap = Object.fromEntries(
    (credits ?? []).map((c) => [
      c.user_id,
      { balance: c.balance, monthly_allowance: c.monthly_allowance, total_used: c.total_used },
    ]),
  );

  const total = count ?? 0;
  const users: AdminUserRow[] = profiles.map((p) => ({
    ...(p as ProfileRow),
    subscription: subMap[p.id] ?? null,
    credits: creditsMap[p.id] ?? null,
  }));

  return { users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserRow | null> {
  const admin = createAdminClient();

  const [{ data: profile }, { data: sub }, { data: credits }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).single<ProfileRow>(),
    admin
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("credits")
      .select("balance, monthly_allowance, total_used")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (!profile) return null;

  return {
    ...profile,
    subscription: sub ?? null,
    credits: credits ?? null,
  };
}

export async function getUserActivityHistory(userId: string, limit = 20) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("history")
    .select("id, tool, title, credits_used, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function suspendUser(userId: string, suspended: boolean): Promise<void> {
  const admin = createAdminClient();
  await admin.from("profiles").update({ is_suspended: suspended }).eq("id", userId);
  if (suspended) {
    await admin.auth.admin.signOut(userId, "global");
  }
}

export async function deleteAdminUser(userId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(userId);
}

export async function resetUserCredits(userId: string, newBalance: number, newAllowance?: number): Promise<void> {
  const admin = createAdminClient();
  const update: { balance: number; total_used: number; monthly_allowance?: number } = {
    balance: newBalance,
    total_used: 0,
  };
  if (newAllowance !== undefined) update.monthly_allowance = newAllowance;
  await admin.from("credits").update(update).eq("user_id", userId);
}

export async function changeUserPlan(userId: string, plan: DbPlanType): Promise<void> {
  const admin = createAdminClient();
  await admin.from("profiles").update({ plan }).eq("id", userId);
  await admin
    .from("subscriptions")
    .update({ plan })
    .eq("user_id", userId);

  const PLAN_ALLOWANCE: Record<DbPlanType, number> = {
    free: 20,
    starter: 500,
    pro: 999_999,
    enterprise: 999_999,
  };
  await admin
    .from("credits")
    .update({ monthly_allowance: PLAN_ALLOWANCE[plan] })
    .eq("user_id", userId);
}
