"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  suspendUser,
  deleteAdminUser,
  resetUserCredits,
  changeUserPlan,
} from "@/services/admin/users";
import { writeAdminLog } from "@/services/admin/logs";
import type { AsyncActionResult } from "@/types";
import type { DbPlanType } from "@/types/database";
import { z } from "zod";

async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "superadmin")) return null;
  return user;
}

export async function suspendUserAction(
  userId: string,
  suspended: boolean,
): AsyncActionResult {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: "Unauthorized" };

    await suspendUser(userId, suspended);
    await writeAdminLog(
      "activity",
      suspended ? "user_suspended" : "user_unsuspended",
      { target_user_id: userId },
      admin.id,
      userId,
    );
    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function deleteUserAction(userId: string): AsyncActionResult {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: "Unauthorized" };

    await deleteAdminUser(userId);
    await writeAdminLog(
      "activity",
      "user_deleted",
      { target_user_id: userId },
      admin.id,
      userId,
    );
    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

const ResetCreditsSchema = z.object({
  userId: z.string().uuid(),
  balance: z.number().int().min(0),
  allowance: z.number().int().min(0).optional(),
});

export async function resetCreditsAction(raw: {
  userId: string;
  balance: number;
  allowance?: number;
}): AsyncActionResult {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: "Unauthorized" };

    const data = ResetCreditsSchema.parse(raw);
    await resetUserCredits(data.userId, data.balance, data.allowance);
    await writeAdminLog(
      "activity",
      "credits_reset",
      { target_user_id: data.userId, balance: data.balance },
      admin.id,
      data.userId,
    );
    revalidatePath(`/admin/users/${data.userId}`);
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

const ChangePlanSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(["free", "starter", "pro", "enterprise"]),
});

export async function changePlanAction(raw: {
  userId: string;
  plan: string;
}): AsyncActionResult {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: "Unauthorized" };

    const data = ChangePlanSchema.parse(raw);
    await changeUserPlan(data.userId, data.plan as DbPlanType);
    await writeAdminLog(
      "billing",
      "plan_changed",
      { target_user_id: data.userId, new_plan: data.plan },
      admin.id,
      data.userId,
    );
    revalidatePath(`/admin/users/${data.userId}`);
    revalidatePath("/admin/subscriptions");
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed" };
  }
}
