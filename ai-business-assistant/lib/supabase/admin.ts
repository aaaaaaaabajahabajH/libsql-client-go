import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Service-role Supabase client — bypasses Row Level Security entirely.
 *
 * ONLY use in:
 *  - Server Actions that need to operate on another user's data (e.g., webhooks)
 *  - Edge Functions (stripe-webhook, reset-credits cron)
 *  - Server-side admin utilities
 *
 * NEVER import this in Client Components or expose the service role key to the browser.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
