import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  activeSubscriptions: number;
  freeUsers: number;
  paidUsers: number;
  aiRequestsToday: number;
  aiRequestsMonth: number;
  totalCreditsUsed: number;
  mrr: number;
  arr: number;
}

export interface DailyPoint {
  date: string;
  value: number;
}

export interface ToolStat {
  tool: string;
  count: number;
  credits: number;
}

export interface PlanDistribution {
  plan: string;
  count: number;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const admin = createAdminClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: newUsersToday },
    { count: activeSubscriptions },
    { count: aiRequestsToday },
    { count: aiRequestsMonth },
    { data: creditRows },
    { data: planRows },
    { data: activeSubRows },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart),
    admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    admin
      .from("history")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart),
    admin
      .from("history")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart),
    admin.from("credits").select("total_used"),
    admin.from("profiles").select("plan"),
    admin
      .from("subscriptions")
      .select("plan")
      .eq("status", "active"),
  ]);

  const totalCreditsUsed =
    (creditRows ?? []).reduce((sum, r) => sum + (r.total_used ?? 0), 0);

  const planCounts = (planRows ?? []).reduce(
    (acc: Record<string, number>, r) => {
      acc[r.plan] = (acc[r.plan] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const freeUsers = planCounts["free"] ?? 0;
  const paidUsers = (totalUsers ?? 0) - freeUsers;

  const PLAN_PRICE: Record<string, number> = {
    starter: 12,
    pro: 25,
    enterprise: 99,
  };
  const mrr = (activeSubRows ?? []).reduce(
    (sum, r) => sum + (PLAN_PRICE[r.plan] ?? 0),
    0,
  );

  // activeUsers: users who have generated AI content in past 30 days
  const { count: activeUsers } = await admin
    .from("history")
    .select("user_id", { count: "exact", head: true })
    .gte("created_at", thirtyDaysAgo);

  return {
    totalUsers: totalUsers ?? 0,
    activeUsers: activeUsers ?? 0,
    newUsersToday: newUsersToday ?? 0,
    activeSubscriptions: activeSubscriptions ?? 0,
    freeUsers,
    paidUsers,
    aiRequestsToday: aiRequestsToday ?? 0,
    aiRequestsMonth: aiRequestsMonth ?? 0,
    totalCreditsUsed,
    mrr,
    arr: mrr * 12,
  };
}

export async function getDailyAIRequests(days = 30): Promise<DailyPoint[]> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await admin
    .from("history")
    .select("created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  const counts: Record<string, number> = {};
  (data ?? []).forEach((row) => {
    const d = row.created_at.slice(0, 10);
    counts[d] = (counts[d] ?? 0) + 1;
  });

  const points: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    points.push({ date: label, value: counts[key] ?? 0 });
  }
  return points;
}

export async function getDailyUserGrowth(days = 30): Promise<DailyPoint[]> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await admin
    .from("profiles")
    .select("created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  const counts: Record<string, number> = {};
  (data ?? []).forEach((row) => {
    const d = row.created_at.slice(0, 10);
    counts[d] = (counts[d] ?? 0) + 1;
  });

  const points: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    points.push({ date: label, value: counts[key] ?? 0 });
  }
  return points;
}

export async function getToolStats(): Promise<ToolStat[]> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await admin
    .from("history")
    .select("tool, credits_used")
    .gte("created_at", since);

  const map: Record<string, { count: number; credits: number }> = {};
  (data ?? []).forEach((row) => {
    if (!map[row.tool]) map[row.tool] = { count: 0, credits: 0 };
    map[row.tool].count += 1;
    map[row.tool].credits += row.credits_used ?? 0;
  });

  const LABELS: Record<string, string> = {
    "social-media": "Social Media",
    "product-description": "Product Desc",
    "blog-writer": "Blog Writer",
    "email-writer": "Email Writer",
    "invoice-generator": "Invoice Gen",
    translator: "Translator",
  };

  return Object.entries(map)
    .map(([tool, s]) => ({ tool: LABELS[tool] ?? tool, count: s.count, credits: s.credits }))
    .sort((a, b) => b.count - a.count);
}

export async function getPlanDistribution(): Promise<PlanDistribution[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("plan");

  const counts: Record<string, number> = {};
  (data ?? []).forEach((r) => {
    counts[r.plan] = (counts[r.plan] ?? 0) + 1;
  });

  return Object.entries(counts).map(([plan, count]) => ({ plan, count }));
}

export async function getDailyRevenue(days = 30): Promise<DailyPoint[]> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await admin
    .from("subscriptions")
    .select("plan, created_at")
    .eq("status", "active")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  const PLAN_PRICE: Record<string, number> = { starter: 12, pro: 25, enterprise: 99 };
  const revenue: Record<string, number> = {};
  (data ?? []).forEach((row) => {
    const d = row.created_at.slice(0, 10);
    revenue[d] = (revenue[d] ?? 0) + (PLAN_PRICE[row.plan] ?? 0);
  });

  const points: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    points.push({ date: label, value: revenue[key] ?? 0 });
  }
  return points;
}
