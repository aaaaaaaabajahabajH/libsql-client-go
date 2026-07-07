import { createAdminClient } from "@/lib/supabase/admin";
import type {
  UserPreferencesRow,
  UserPreferencesUpdate,
  DbAIProvider,
  DbTheme,
  DbWritingTone,
} from "@/types/database";

const DEFAULT_PREFERENCES: Omit<UserPreferencesRow, "id" | "user_id" | "created_at" | "updated_at"> = {
  ai_provider: "openai",
  ai_model: "gpt-4o",
  temperature: 0.7,
  max_tokens: 2048,
  default_language: "English",
  writing_tone: "professional",
  theme: "system",
  app_language: "en",
  notify_marketing: true,
  notify_billing: true,
  notify_ai_completion: false,
  notify_security: true,
  workspace_name: null,
  workspace_logo_url: null,
};

export async function getOrCreatePreferences(userId: string): Promise<UserPreferencesRow> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single<UserPreferencesRow>();

  if (existing) return existing;

  const { data: created, error } = await admin
    .from("user_preferences")
    .insert({ user_id: userId, ...DEFAULT_PREFERENCES })
    .select("*")
    .single<UserPreferencesRow>();

  if (error || !created) {
    return { id: "", user_id: userId, created_at: "", updated_at: "", ...DEFAULT_PREFERENCES };
  }

  return created;
}

export async function updatePreferences(
  userId: string,
  update: UserPreferencesUpdate,
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("user_preferences")
    .upsert({ user_id: userId, ...update }, { onConflict: "user_id" });
}

/* ─── Typed subset updaters ─────────────────────────────────── */

export async function updateAIPreferences(
  userId: string,
  prefs: {
    ai_provider: DbAIProvider;
    ai_model: string;
    temperature: number;
    max_tokens: number;
    default_language: string;
    writing_tone: DbWritingTone;
  },
): Promise<void> {
  return updatePreferences(userId, prefs);
}

export async function updateNotificationPreferences(
  userId: string,
  prefs: {
    notify_marketing: boolean;
    notify_billing: boolean;
    notify_ai_completion: boolean;
    notify_security: boolean;
  },
): Promise<void> {
  return updatePreferences(userId, prefs);
}

export async function updateAppPreferences(
  userId: string,
  prefs: { theme: DbTheme; app_language: string },
): Promise<void> {
  return updatePreferences(userId, prefs);
}

export async function updateWorkspace(
  userId: string,
  workspace: { workspace_name: string | null; workspace_logo_url?: string | null },
): Promise<void> {
  return updatePreferences(userId, workspace);
}

export { DEFAULT_PREFERENCES };
export type { UserPreferencesRow, UserPreferencesUpdate };
