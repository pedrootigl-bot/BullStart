import "server-only";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Proteção CSRF para Route Handlers que alteram estado: exige Origin igual ao APP_URL
 * (ou ao host da requisição). Server Actions já possuem verificação equivalente do Next.js.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }
  const appOrigin = new URL(getEnv().APP_URL).origin;
  if (originUrl.origin === appOrigin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  return host !== null && originUrl.host === host;
}

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * Rate limiting em janela fixa, persistido no Postgres (funciona com múltiplas instâncias).
 * Em caso de falha do banco, nega a operação (falha fechada).
 */
export async function consumeRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin().rpc("consume_rate_limit", {
    p_key: key.slice(0, 200),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit] falha ao consumir limite", error.message);
    return false;
  }
  return data === true;
}
