/**
 * Supabase Database type definitions.
 * These mirror the SQL schema in supabase/migrations/001_schema.sql exactly.
 * Never use `any` — add proper shapes here when the schema evolves.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/* ─── Enum mirrors ─────────────────────────────────────────── */

export type DbPlanType = "free" | "starter" | "pro" | "enterprise";

export type DbSubscriptionStatus =
  | "active"
  | "cancelled"
  | "past_due"
  | "trialing";

export type DbToolType =
  | "social-media"
  | "product-description"
  | "blog-writer"
  | "email-writer"
  | "invoice-generator"
  | "translator";

/* ─── Table row types ──────────────────────────────────────── */

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  company: string | null;
  website: string | null;
  plan: DbPlanType;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: DbPlanType;
  status: DbSubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditsRow {
  id: string;
  user_id: string;
  balance: number;
  total_used: number;
  reset_at: string;
  created_at: string;
  updated_at: string;
}

export interface HistoryRow {
  id: string;
  user_id: string;
  tool: DbToolType;
  title: string;
  prompt: string;
  output: string;
  credits: number;
  created_at: string;
}

export interface SavedDocumentRow {
  id: string;
  user_id: string;
  history_id: string | null;
  tool: DbToolType;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

/* ─── Insert / Update helpers ──────────────────────────────── */

export type ProfileInsert = Omit<ProfileRow, "created_at" | "updated_at"> &
  Partial<Pick<ProfileRow, "plan" | "company" | "website">>;

export type ProfileUpdate = Partial<
  Pick<ProfileRow, "full_name" | "avatar_url" | "company" | "website" | "plan">
>;

export type HistoryInsert = Omit<HistoryRow, "id" | "created_at">;

export type SavedDocumentInsert = Omit<
  SavedDocumentRow,
  "id" | "created_at" | "updated_at"
> &
  Partial<Pick<SavedDocumentRow, "history_id" | "tags">>;

export type SavedDocumentUpdate = Partial<
  Pick<SavedDocumentRow, "title" | "content" | "tags">
>;

/* ─── Full Database interface (for createClient generics) ──── */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: Omit<SubscriptionRow, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Pick<
            SubscriptionRow,
            | "plan"
            | "status"
            | "stripe_customer_id"
            | "stripe_subscription_id"
            | "current_period_start"
            | "current_period_end"
            | "cancel_at_period_end"
          >
        >;
      };
      credits: {
        Row: CreditsRow;
        Insert: Omit<CreditsRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Pick<CreditsRow, "balance" | "total_used" | "reset_at">>;
      };
      history: {
        Row: HistoryRow;
        Insert: HistoryInsert;
        Update: never;
      };
      saved_documents: {
        Row: SavedDocumentRow;
        Insert: SavedDocumentInsert;
        Update: SavedDocumentUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: {
      deduct_credits: {
        Args: { p_user_id: string; p_amount: number };
        Returns: boolean;
      };
    };
    Enums: {
      plan_type: DbPlanType;
      subscription_status: DbSubscriptionStatus;
      tool_type: DbToolType;
    };
  };
}
