/**
 * Credits Service — manages the credit ledger for each user.
 *
 * All credit mutations go through the deduct_credits() and
 * reset_monthly_credits() Postgres functions which use row-level
 * locks to prevent race conditions under concurrent requests.
 *
 * DB operations (getUserCredits, deductCredits, resetMonthlyCredits)
 * are implemented in Milestone 11 once the AI tool pages are in place.
 */

import type { CreditsState } from "@/types";

/* ─── Interfaces ─────────────────────────────────────────────── */

export interface CreditCheckResult {
  sufficient: boolean;
  balance: number;
  required: number;
}

/* ─── Pure helpers (no I/O — safe to call anywhere) ─────────── */

/**
 * Builds a CreditsState from raw DB values.
 * Uses monthly_allowance (stored per-user) instead of deriving from plan,
 * so it remains correct after mid-cycle plan changes.
 */
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
  if (balance >= 1_000) return `${(balance / 1_000).toFixed(1)}k`;
  return String(balance);
}

/* ─── Database-backed operations (implemented in Milestone 11) ─ */

export async function getUserCredits(
  _userId: string,
): Promise<CreditsState | null> {
  throw new Error("getUserCredits: implemented in Milestone 11");
}

export async function deductCredits(
  _userId: string,
  _amount: number,
): Promise<boolean> {
  throw new Error("deductCredits: implemented in Milestone 11");
}

export async function resetMonthlyCredits(
  _userId: string,
  _newAllowance?: number,
): Promise<void> {
  throw new Error("resetMonthlyCredits: implemented in Milestone 11");
}
