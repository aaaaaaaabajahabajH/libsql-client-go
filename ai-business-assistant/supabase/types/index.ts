/**
 * Supabase type helpers.
 * Re-exports from types/database.ts for convenient import inside
 * Supabase Edge Functions that run in a separate TypeScript context.
 */

export type {
  CreditsRow,
  Database,
  DbPlanType,
  DbSubscriptionStatus,
  DbToolType,
  HistoryInsert,
  HistoryRow,
  Json,
  ProfileInsert,
  ProfileRow,
  ProfileUpdate,
  SavedDocumentInsert,
  SavedDocumentRow,
  SavedDocumentUpdate,
  SubscriptionRow,
} from "../../types/database";
