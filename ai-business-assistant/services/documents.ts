import { createClient } from "@/lib/supabase/server";
import type { SavedDocumentRow, SavedDocumentInsert, SavedDocumentUpdate } from "@/types/database";

export async function saveDocument(entry: SavedDocumentInsert): Promise<SavedDocumentRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_documents")
    .insert(entry)
    .select("*")
    .single<SavedDocumentRow>();
  return data;
}

export async function getUserDocuments(
  userId: string,
  limit = 50,
): Promise<SavedDocumentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<SavedDocumentRow[]>();
  return data ?? [];
}

export async function updateDocument(
  id: string,
  userId: string,
  updates: SavedDocumentUpdate,
): Promise<SavedDocumentRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_documents")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single<SavedDocumentRow>();
  return data;
}

export async function deleteDocument(id: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("saved_documents")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}

export async function toggleFavorite(
  id: string,
  userId: string,
  isFavorite: boolean,
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("saved_documents")
    .update({ is_favorite: isFavorite })
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}
