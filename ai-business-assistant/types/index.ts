/**
 * Application-level TypeScript types.
 * Keep domain types here; database row types live in types/database.ts.
 */

import type { LucideIcon } from "lucide-react";

import type { DbPlanType, DbToolType } from "./database";

/* ─── Re-exports from database layer ──────────────────────── */

export type { Database } from "./database";
export type { DbPlanType as PlanType, DbToolType as ToolType } from "./database";

/* ─── Navigation ───────────────────────────────────────────── */

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  external?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/* ─── Dashboard widgets ─────────────────────────────────────── */

export interface StatsData {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

export interface ActivityItem {
  id: string;
  tool: DbToolType;
  title: string;
  credits: number;
  createdAt: string;
}

/* ─── AI Tools ──────────────────────────────────────────────── */

export interface ToolConfig {
  id: DbToolType;
  label: string;
  description: string;
  icon: LucideIcon;
  creditCost: number;
  gradient: string;
  badge?: string;
}

export interface ToolFormValues {
  prompt: string;
  [key: string]: string | number | boolean;
}

export interface ToolResult {
  content: string;
  creditsUsed: number;
  generatedAt: string;
}

/* ─── Subscription / Pricing ────────────────────────────────── */

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanConfig {
  id: DbPlanType;
  name: string;
  price: number;
  interval: "month" | "year";
  description: string;
  credits: number;
  features: PlanFeature[];
  highlighted: boolean;
  badge?: string;
  stripePriceId?: string;
}

/* ─── Credits ───────────────────────────────────────────────── */

export interface CreditsState {
  balance: number;
  totalUsed: number;
  resetAt: string;
  percentage: number;
}

/* ─── Auth ──────────────────────────────────────────────────── */

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  plan: DbPlanType;
}

/* ─── API responses ─────────────────────────────────────────── */

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type AsyncActionResult<T = void> = Promise<ActionResult<T>>;

/* ─── Generic helpers ───────────────────────────────────────── */

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type WithId<T> = T & { id: string };
export type Prettify<T> = { [K in keyof T]: T[K] } & unknown;
