/**
 * Supabase Database type definitions.
 * These mirror the SQL schema in supabase/migrations/001_initial_schema.sql exactly.
 * Re-generate with: supabase gen types typescript --linked > types/database.ts
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

/** Mirrors Stripe subscription status values (US spelling: "canceled"). */
export type DbSubscriptionStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "trialing"
  | "unpaid";

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
  stripe_price_id: string | null;
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
  monthly_allowance: number;
  total_used: number;
  reset_at: string;
  created_at: string;
  updated_at: string;
}

/** Immutable append-only log entry. input stores raw form values as JSONB. */
export interface HistoryRow {
  id: string;
  user_id: string;
  tool: DbToolType;
  title: string;
  input: Json;
  output: string;
  credits_used: number;
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
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

/* ─── Insert / Update helpers ──────────────────────────────── */

export type ProfileInsert = Pick<ProfileRow, "id" | "email"> &
  Partial<Pick<ProfileRow, "full_name" | "avatar_url" | "company" | "website" | "plan">>;

export type ProfileUpdate = Partial<
  Pick<ProfileRow, "full_name" | "avatar_url" | "company" | "website" | "plan">
>;

export type HistoryInsert = Omit<HistoryRow, "id" | "created_at">;

export type SavedDocumentInsert = Omit<
  SavedDocumentRow,
  "id" | "created_at" | "updated_at"
> &
  Partial<Pick<SavedDocumentRow, "history_id" | "tags" | "is_favorite">>;

export type SavedDocumentUpdate = Partial<
  Pick<SavedDocumentRow, "title" | "content" | "tags" | "is_favorite">
>;

/* ─── Full Database interface (for createClient<Database> generics) ── */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow & Record<string, unknown>;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      subscriptions: {
        Row: SubscriptionRow & Record<string, unknown>;
        Insert: Omit<SubscriptionRow, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Pick<
            SubscriptionRow,
            | "plan"
            | "status"
            | "stripe_customer_id"
            | "stripe_subscription_id"
            | "stripe_price_id"
            | "current_period_start"
            | "current_period_end"
            | "cancel_at_period_end"
          >
        >;
        Relationships: [];
      };
      credits: {
        Row: CreditsRow & Record<string, unknown>;
        Insert: Omit<CreditsRow, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Pick<CreditsRow, "balance" | "monthly_allowance" | "total_used" | "reset_at">
        >;
        Relationships: [];
      };
      history: {
        Row: HistoryRow & Record<string, unknown>;
        Insert: {
          user_id: string;
          tool: DbToolType;
          title: string;
          input: Json;
          output: string;
          credits_used: number;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      saved_documents: {
        Row: SavedDocumentRow & Record<string, unknown>;
        Insert: {
          user_id: string;
          tool: DbToolType;
          title: string;
          content: string;
          history_id?: string | null;
          tags?: string[];
          is_favorite?: boolean;
        };
        Update: {
          title?: string;
          content?: string;
          tags?: string[];
          is_favorite?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      plan_limits: {
        Row: {
          plan: DbPlanType;
          monthly_credits: number;
          history_retention_days: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      deduct_credits: {
        Args: { p_user_id: string; p_amount: number };
        Returns: boolean;
      };
      reset_monthly_credits: {
        Args: { p_user_id: string; p_new_allowance?: number };
        Returns: void;
      };
      update_user_plan: {
        Args: { p_user_id: string; p_plan: DbPlanType };
        Returns: void;
      };
    };
    Enums: {
      plan_type: DbPlanType;
      subscription_status: DbSubscriptionStatus;
      tool_type: DbToolType;
    };
  };
}
