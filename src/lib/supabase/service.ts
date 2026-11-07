import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseServiceKey, supabaseUrl } from "./env";

/**
 * Service-role client. Bypasses RLS: use ONLY in server actions after validation
 * (creating orders/leads/data requests, order tracking lookups). Never import from client code.
 */
export function serviceClient() {
  return createClient(supabaseUrl(), supabaseServiceKey(), { auth: { persistSession: false, autoRefreshToken: false } });
}
