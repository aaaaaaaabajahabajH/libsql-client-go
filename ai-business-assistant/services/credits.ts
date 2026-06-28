/**
 * Credits Service — manages the credit ledger for each user.
 *
 * All credit mutations go through the `deduct_credits` database function
 * which uses a row-level lock to prevent race conditions (concurrent calls).
 *
 * Implementation: Milestone 11
 */

import type { CreditsState, PlanType } from "@/types";
import { PLAN_CREDITS } from "@/utils/constants";

/* ─── Interfaces ─────────────────────────────────────────────── */

export interface CreditCheckResult {
  sufficient: boolean;
  balance: number;
  required: number;
}

/* ─── Pure helpers (no I/O — safe to use anywhere) ─────────── */

export function buildCreditsState(
  balance: number,
  totalUsed: number,
  resetAt: string,
  plan: PlanType,
): CreditsState {
  const total = PLAN_CREDITS[plan];
  const percentage = Math.min(Math.round((totalUsed / total) * 100), 100);

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

/* ─── Database-backed operations (stub — implemented in Milestone 11) */

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

export async function resetMonthlyCredits(_userId: string): Promise<void> {
  throw new Error("resetMonthlyCredits: implemented in Milestone 11");
}
