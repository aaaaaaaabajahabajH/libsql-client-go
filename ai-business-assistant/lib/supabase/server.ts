import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

/**
 * Server-side Supabase client for use in:
 *  - Server Components
 *  - Route Handlers (app/api/*)
 *  - Server Actions (actions/*)
 *
 * Must be `await`-ed because `cookies()` is async in Next.js 15.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Silently ignore cookie mutations inside Server Components
            // (read-only context). Route Handlers and Server Actions can write.
          }
        },
      },
    },
  );
}
