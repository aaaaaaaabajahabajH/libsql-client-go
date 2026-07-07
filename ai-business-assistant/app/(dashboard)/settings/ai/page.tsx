import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreatePreferences } from "@/services/preferences";
import { AIPreferencesForm } from "./ai-form";

export const metadata = { title: "AI Preferences" };

export default async function AIPreferencesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const prefs = await getOrCreatePreferences(user.id);
  return <AIPreferencesForm preferences={prefs} />;
}
