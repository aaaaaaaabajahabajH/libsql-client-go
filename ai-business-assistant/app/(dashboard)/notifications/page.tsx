import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listNotifications, getUnreadCount } from "@/services/notifications";

import { NotificationsView } from "./notifications-view";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ notifications, total }, unreadCount] = await Promise.all([
    listNotifications(user.id, 30, 0),
    getUnreadCount(user.id),
  ]);

  return (
    <div className="container max-w-3xl py-8 px-4">
      <NotificationsView
        initialNotifications={notifications}
        initialTotal={total}
        initialUnreadCount={unreadCount}
      />
    </div>
  );
}
