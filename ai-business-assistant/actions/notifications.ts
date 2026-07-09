"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  listNotifications,
} from "@/services/notifications";
import type { NotificationRow } from "@/types/database";

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function fetchNotificationsAction(
  limit = 20,
  offset = 0,
): Promise<{ notifications: NotificationRow[]; total: number }> {
  const userId = await getAuthUserId();
  return listNotifications(userId, limit, offset);
}

export async function markNotificationReadAction(notificationId: string): Promise<void> {
  const userId = await getAuthUserId();
  await markNotificationRead(notificationId, userId);
  revalidatePath("/dashboard", "layout");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const userId = await getAuthUserId();
  await markAllNotificationsRead(userId);
  revalidatePath("/dashboard", "layout");
}

export async function deleteNotificationAction(notificationId: string): Promise<void> {
  const userId = await getAuthUserId();
  await deleteNotification(notificationId, userId);
  revalidatePath("/dashboard", "layout");
}

export async function deleteAllNotificationsAction(): Promise<void> {
  const userId = await getAuthUserId();
  await deleteAllNotifications(userId);
  revalidatePath("/dashboard", "layout");
}
