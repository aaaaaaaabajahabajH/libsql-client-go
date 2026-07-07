import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreatePreferences } from "@/services/preferences";
import { WorkspaceForm } from "./workspace-form";

export const metadata = { title: "Workspace Settings" };

export default async function WorkspacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const prefs = await getOrCreatePreferences(user.id);
  return <WorkspaceForm preferences={prefs} />;
}
