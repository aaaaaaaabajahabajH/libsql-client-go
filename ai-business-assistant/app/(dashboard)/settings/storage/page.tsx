import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserCreditsRow } from "@/services/credits";
import { StorageView } from "./storage-view";

export const metadata = { title: "Storage & Usage" };

const UNLIMITED_SENTINEL = 999_999;

export default async function StoragePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [creditsRow, { count: savedCount }, { count: historyCount }] = await Promise.all([
    getUserCreditsRow(user.id),
    admin
      .from("saved_documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    admin
      .from("history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const isUnlimited = (creditsRow?.monthly_allowance ?? 0) >= UNLIMITED_SENTINEL;

  return (
    <StorageView
      savedDocuments={savedCount ?? 0}
      historyEntries={historyCount ?? 0}
      creditsUsed={creditsRow?.total_used ?? 0}
      creditsAllowance={creditsRow?.monthly_allowance ?? 0}
      creditsBalance={creditsRow?.balance ?? 0}
      isUnlimited={isUnlimited}
      resetAt={creditsRow?.reset_at ?? null}
    />
  );
}
