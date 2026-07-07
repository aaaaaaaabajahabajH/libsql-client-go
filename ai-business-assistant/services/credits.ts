import { createAdminClient } from "@/lib/supabase/admin";
import type { CreditsRow } from "@/types/database";
import type { CreditsState } from "@/types";

/* ─── Interfaces ─────────────────────────────────────────────── */

export interface CreditCheckResult {
  sufficient: boolean;
  balance: number;
  required: number;
}

/* ─── Pure helpers (no I/O — safe to call anywhere) ─────────── */

export function buildCreditsState(
  balance: number,
  totalUsed: number,
  monthlyAllowance: number,
  resetAt: string,
): CreditsState {
  const percentage =
    monthlyAllowance > 0
      ? Math.min(Math.round((totalUsed / monthlyAllowance) * 100), 100)
      : 0;

  return { balance, totalUsed, resetAt, percentage };
}

export function hasSufficientCredits(
  balance: number,
  required: number,
): boolean {
  return balance >= required;
}

export function formatCreditsDisplay(balance: number): string {
  if (balance >= 999_999) return "∞";
  if (balance >= 1_000) return `${(balance / 1_000).toFixed(1)}k`;
  return String(balance);
}

/* ─── Database-backed operations ────────────────────────────── */

export async function getUserCredits(userId: string): Promise<CreditsState | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("credits")
    .select("*")
    .eq("user_id", userId)
    .single<CreditsRow>();

  if (!data) return null;

  return buildCreditsState(
    data.balance,
    data.total_used,
    data.monthly_allowance,
    data.reset_at,
  );
}

export async function getUserCreditsRow(userId: string): Promise<CreditsRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("credits")
    .select("*")
    .eq("user_id", userId)
    .single<CreditsRow>();

  return data ?? null;
}

export async function deductCredits(userId: string, amount: number): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin.rpc(
    "deduct_credits",
    { p_user_id: userId, p_amount: amount } as unknown as { p_user_id: string; p_amount: number },
  );
  return data === true;
}

export async function resetMonthlyCredits(userId: string, newAllowance?: number): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc(
    "reset_monthly_credits",
    {
      p_user_id: userId,
      ...(newAllowance !== undefined && { p_new_allowance: newAllowance }),
    } as unknown as { p_user_id: string; p_new_allowance?: number },
  );
}
