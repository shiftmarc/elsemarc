import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase with the secret key, which bypasses Row Level Security. Server
 * code only: "server-only" fails the build if this is imported by a client
 * component. Tables it uses have RLS on and no public policies, so the
 * publishable key can read or write none of them.
 */

export const INTAKE_BUCKET = "intake-assets";
export const BRIEFS_TABLE = "intake_briefs";

let client: SupabaseClient | null = null;

/** Throws when the environment is not configured, so callers can fail the save cleanly. */
export function supabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set.");
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
