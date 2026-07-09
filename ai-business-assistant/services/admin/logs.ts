import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminLogRow, DbLogType } from "@/types/database";

export interface LogListParams {
  logType?: DbLogType | "all";
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface LogListResult {
  logs: AdminLogRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listAdminLogs(params: LogListParams = {}): Promise<LogListResult> {
  const admin = createAdminClient();
  const { logType = "all", search = "", page = 1, pageSize = 50 } = params;

  let query = admin
    .from("admin_logs")
    .select("*", { count: "exact" });

  if (logType !== "all") {
    query = query.eq("log_type", logType);
  }
  if (search) {
    query = query.ilike("action", `%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const total = count ?? 0;
  return {
    logs: (data as AdminLogRow[]) ?? [],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function writeAdminLog(
  logType: DbLogType,
  action: string,
  details: Record<string, unknown> = {},
  adminId?: string,
  userId?: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("admin_logs").insert({
    log_type: logType,
    action,
    details,
    admin_id: adminId ?? null,
    user_id: userId ?? null,
  });
}

export async function getSubscriptionLogs(): Promise<
  Pick<AdminLogRow, "id" | "action" | "details" | "created_at">[]
> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_logs")
    .select("id, action, details, created_at")
    .eq("log_type", "billing")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as Pick<AdminLogRow, "id" | "action" | "details" | "created_at">[];
}
