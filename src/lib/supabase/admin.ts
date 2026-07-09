import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env";

/**
 * Service-role Supabase client. Bypasses Row Level Security entirely.
 *
 * Only use this inside server-only code (Route Handlers, Server Actions,
 * scripts) for operations that must legitimately cross RLS boundaries:
 * invite redemption, account provisioning, and scheduled signal
 * calculation. Never import this from a Client Component.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
