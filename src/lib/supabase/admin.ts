import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export type AppSupabaseClient = SupabaseClient<Database>;

let adminClient: AppSupabaseClient | null = null;

/**
 * Cliente privilegiado (service_role). Ignora RLS: usar somente após autorização
 * explícita no servidor. Nunca importar em Client Components.
 */
export function getSupabaseAdmin(): AppSupabaseClient {
  if (adminClient) return adminClient;
  const env = getEnv();
  adminClient = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return adminClient;
}
