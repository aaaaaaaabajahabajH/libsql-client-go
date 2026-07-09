import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationRow, DbNotificationType } from "@/types/database";

export interface CreateNotificationPayload {
  userId: string;
  type: DbNotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export async function createNotification(payload: CreateNotificationPayload): Promise<void> {
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    data: payload.data ?? {},
  });
}

export async function listNotifications(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<{ notifications: NotificationRow[]; total: number }> {
  const admin = createAdminClient();

  const [{ data }, { count }] = await Promise.all([
    admin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1),
    admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return {
    notifications: (data ?? []) as NotificationRow[],
    total: count ?? 0,
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return count ?? 0;
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
}

export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", userId);
}

export async function deleteAllNotifications(userId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("notifications").delete().eq("user_id", userId);
}
