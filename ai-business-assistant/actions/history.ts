"use server";

import { createClient } from "@/lib/supabase/server";
import { deleteHistoryEntry } from "@/services/history";
import type { AsyncActionResult } from "@/types";

export async function deleteHistoryAction(id: string): AsyncActionResult {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const ok = await deleteHistoryEntry(id, user.id);
  if (!ok) return { success: false, error: "Failed to delete history entry" };
  return { success: true, data: undefined };
}
