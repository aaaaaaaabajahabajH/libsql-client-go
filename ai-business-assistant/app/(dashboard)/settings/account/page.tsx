import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreatePreferences } from "@/services/preferences";
import type { ProfileRow } from "@/types/database";
import { AccountForm } from "./account-form";

export const metadata = { title: "Account Settings" };

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, preferences] = await Promise.all([
    supabase.from("profiles").select("email").eq("id", user.id).single<Pick<ProfileRow, "email">>(),
    getOrCreatePreferences(user.id),
  ]);

  return (
    <AccountForm
      userEmail={profile?.email ?? user.email ?? ""}
      currentTheme={preferences.theme}
      currentLanguage={preferences.app_language}
    />
  );
}
