"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  updateAIPreferences,
  updateNotificationPreferences,
  updateAppPreferences,
  updateWorkspace,
} from "@/services/preferences";
import type { AsyncActionResult } from "@/types";
import type { DbAIProvider, DbTheme, DbWritingTone, ProfileRow, ProfileUpdate } from "@/types/database";

/* ─── Validation schemas ─────────────────────────────────────── */

const ProfileSchema = z.object({
  full_name: z.string().max(100).optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, _ and - allowed")
    .optional()
    .or(z.literal("")),
  job_title: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  company: z.string().max(100).optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  country: z.string().max(100).optional(),
  timezone: z.string().max(50).optional(),
});

const ChangePasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const AIPreferencesSchema = z.object({
  ai_provider: z.enum(["openai", "anthropic", "google"]),
  ai_model: z.string().min(1),
  temperature: z.number().min(0).max(1),
  max_tokens: z.number().int().min(256).max(16384),
  default_language: z.string().min(1),
  writing_tone: z.enum(["professional", "casual", "friendly", "formal", "persuasive"]),
});

const NotificationPrefsSchema = z.object({
  notify_marketing: z.boolean(),
  notify_billing: z.boolean(),
  notify_ai_completion: z.boolean(),
  notify_security: z.boolean(),
});

const AppPreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  app_language: z.string().min(2).max(10),
});

const WorkspaceSchema = z.object({
  workspace_name: z.string().max(100).optional(),
});

/* ─── Profile actions ────────────────────────────────────────── */

export async function updateProfile(
  raw: z.infer<typeof ProfileSchema>,
): AsyncActionResult {
  try {
    const data = ProfileSchema.parse(raw);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const update: ProfileUpdate = {};
    if (data.full_name !== undefined) update.full_name = data.full_name || null;
    if (data.username !== undefined) update.username = data.username || null;
    if (data.job_title !== undefined) update.job_title = data.job_title || null;
    if (data.bio !== undefined) update.bio = data.bio || null;
    if (data.company !== undefined) update.company = data.company || null;
    if (data.website !== undefined) update.website = data.website || null;
    if (data.country !== undefined) update.country = data.country || null;
    if (data.timezone !== undefined) update.timezone = data.timezone;

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", user.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings/profile");
    revalidatePath("/", "layout");
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update profile" };
  }
}

export async function uploadAvatar(formData: FormData): AsyncActionResult<{ url: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const file = formData.get("avatar") as File | null;
    if (!file || file.size === 0) return { success: false, error: "No file provided" };
    if (file.size > 2 * 1024 * 1024) return { success: false, error: "File must be under 2 MB" };

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const allowedExts = ["jpg", "jpeg", "png", "webp", "gif"];
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedExts.includes(ext) || !allowedMimes.includes(file.type)) {
      return { success: false, error: "Unsupported file type. Please upload a JPEG, PNG, WebP, or GIF." };
    }

    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) return { success: false, error: uploadError.message };

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) return { success: false, error: updateError.message };

    revalidatePath("/", "layout");
    return { success: true, data: { url: publicUrl } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Upload failed" };
  }
}

/* ─── Account actions ────────────────────────────────────────── */

export async function changePassword(
  raw: z.infer<typeof ChangePasswordSchema>,
): AsyncActionResult {
  try {
    const data = ChangePasswordSchema.parse(raw);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await supabase.auth.updateUser({ password: data.newPassword });
    if (error) return { success: false, error: error.message };

    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to change password" };
  }
}

export async function updateAppPreferencesAction(
  raw: z.infer<typeof AppPreferencesSchema>,
): AsyncActionResult {
  try {
    const data = AppPreferencesSchema.parse(raw);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    await updateAppPreferences(user.id, {
      theme: data.theme as DbTheme,
      app_language: data.app_language,
    });
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save preferences" };
  }
}

export async function deleteAccount(): AsyncActionResult {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return { success: false, error: error.message };

    await supabase.auth.signOut();
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete account" };
  }
}

export async function exportUserData(): AsyncActionResult<{ json: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const [profileRes, historyRes, documentsRes, creditsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single<ProfileRow>(),
      supabase.from("history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(500),
      supabase.from("saved_documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(500),
      supabase.from("credits").select("balance, total_used, monthly_allowance, reset_at").eq("user_id", user.id).single(),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      profile: profileRes.data,
      credits: creditsRes.data,
      history: historyRes.data ?? [],
      saved_documents: documentsRes.data ?? [],
    };

    return { success: true, data: { json: JSON.stringify(exportData, null, 2) } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Export failed" };
  }
}

/* ─── AI Preferences actions ─────────────────────────────────── */

export async function updateAIPreferencesAction(
  raw: z.infer<typeof AIPreferencesSchema>,
): AsyncActionResult {
  try {
    const data = AIPreferencesSchema.parse(raw);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    await updateAIPreferences(user.id, {
      ai_provider: data.ai_provider as DbAIProvider,
      ai_model: data.ai_model,
      temperature: data.temperature,
      max_tokens: data.max_tokens,
      default_language: data.default_language,
      writing_tone: data.writing_tone as DbWritingTone,
    });
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save AI preferences" };
  }
}

/* ─── Notification actions ───────────────────────────────────── */

export async function updateNotificationPrefsAction(
  raw: z.infer<typeof NotificationPrefsSchema>,
): AsyncActionResult {
  try {
    const data = NotificationPrefsSchema.parse(raw);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    await updateNotificationPreferences(user.id, data);
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save notification preferences" };
  }
}

/* ─── Workspace actions ──────────────────────────────────────── */

export async function updateWorkspaceAction(
  raw: z.infer<typeof WorkspaceSchema>,
): AsyncActionResult {
  try {
    const data = WorkspaceSchema.parse(raw);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    await updateWorkspace(user.id, { workspace_name: data.workspace_name ?? null });
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save workspace" };
  }
}

/* ─── Security actions ───────────────────────────────────────── */

export async function signOutAllDevices(): AsyncActionResult {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) return { success: false, error: error.message };
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Sign-out failed" };
  }
}
