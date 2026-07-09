"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/** Supabase client for use in Client Components. Respects RLS as the signed-in user. */
export function createClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}
