import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import { authCookieOptions } from "@/lib/supabase/cookies";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Cliente com o JWT do usuário da requisição: todas as consultas respeitam RLS.
 */
export async function createSupabaseServerClient() {
  const env = getEnv();
  const cookieStore = await cookies();
  const cookieOptions = authCookieOptions(env.APP_URL);

  return createServerClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, { ...options, httpOnly: true, secure: cookieOptions.secure });
          }
        } catch {
          // Server Components não podem gravar cookies; o proxy renova a sessão.
        }
      },
    },
  });
}
