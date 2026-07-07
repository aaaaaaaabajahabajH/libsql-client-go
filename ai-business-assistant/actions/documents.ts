"use server";

import { createClient } from "@/lib/supabase/server";
import { saveDocument, updateDocument, deleteDocument, toggleFavorite } from "@/services/documents";
import type { AsyncActionResult } from "@/types";
import type { SavedDocumentRow, DbToolType } from "@/types/database";

export async function saveDocumentAction(params: {
  historyId: string | null;
  tool: DbToolType;
  title: string;
  content: string;
  tags?: string[];
}): AsyncActionResult<SavedDocumentRow> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const doc = await saveDocument({
    user_id: user.id,
    history_id: params.historyId,
    tool: params.tool,
    title: params.title,
    content: params.content,
    tags: params.tags ?? [],
    is_favorite: false,
  });

  if (!doc) return { success: false, error: "Failed to save document" };
  return { success: true, data: doc };
}

export async function renameDocumentAction(
  id: string,
  title: string,
): AsyncActionResult {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const result = await updateDocument(id, user.id, { title });
  if (!result) return { success: false, error: "Failed to rename document" };
  return { success: true, data: undefined };
}

export async function deleteDocumentAction(id: string): AsyncActionResult {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const ok = await deleteDocument(id, user.id);
  if (!ok) return { success: false, error: "Failed to delete document" };
  return { success: true, data: undefined };
}

export async function toggleFavoriteAction(
  id: string,
  isFavorite: boolean,
): AsyncActionResult {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const ok = await toggleFavorite(id, user.id, isFavorite);
  if (!ok) return { success: false, error: "Failed to update favorite" };
  return { success: true, data: undefined };
}
