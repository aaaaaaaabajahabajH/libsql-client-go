import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreatePreferences } from "@/services/preferences";
import { NotificationsForm } from "./notifications-form";

export const metadata = { title: "Notification Preferences" };

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const prefs = await getOrCreatePreferences(user.id);
  return <NotificationsForm preferences={prefs} />;
}
