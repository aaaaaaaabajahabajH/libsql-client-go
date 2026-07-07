import { createClient } from "@/lib/supabase/server";
import type { HistoryRow, HistoryInsert } from "@/types/database";

export async function saveHistory(entry: HistoryInsert): Promise<HistoryRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("history")
    .insert(entry)
    .select("*")
    .single<HistoryRow>();
  return data;
}

export async function getUserHistory(
  userId: string,
  limit = 20,
): Promise<HistoryRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<HistoryRow[]>();
  return data ?? [];
}

export async function deleteHistoryEntry(id: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("history")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}
