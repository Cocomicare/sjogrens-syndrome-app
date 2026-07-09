import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. Respects RLS as the signed-in user (reads the session from
 * cookies). Writing cookies from a Server Component is a no-op by design;
 * session refresh is instead handled in `src/middleware.ts`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component with no request context to write to.
          // Session refresh is handled in middleware, so this is safe to ignore.
        }
      },
    },
  });
}
