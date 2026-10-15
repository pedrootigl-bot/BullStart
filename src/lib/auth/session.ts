import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type CurrentProfile = Pick<
  Tables<"profiles">,
  | "id"
  | "auth_user_id"
  | "full_name"
  | "email"
  | "role"
  | "broker_user_id"
  | "broker_account_status"
  | "broker_verification_status"
  | "broker_registered_at"
  | "broker_linked_at"
  | "broker_last_synced_at"
  | "created_at"
>;

export type SessionUser = {
  authUserId: string;
  profile: CurrentProfile;
};

const PROFILE_COLUMNS =
  "id, auth_user_id, full_name, email, role, broker_user_id, broker_account_status, broker_verification_status, broker_registered_at, broker_linked_at, broker_last_synced_at, created_at";

/**
 * Valida a sessão junto ao Supabase Auth (getUser verifica o token no servidor de Auth)
 * e carrega o perfil via RLS. Memoizado por requisição.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile) return null;

  return { authUserId: user.id, profile };
});

export function safeNextPath(value: unknown, fallback = "/plataforma"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

export async function requireUser(nextPath = "/plataforma"): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) redirect(`/login?erro=sessao&next=${encodeURIComponent(safeNextPath(nextPath))}`);
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireUser("/admin");
  if (session.profile.role !== "admin") redirect("/plataforma?erro=acesso-restrito");
  return session;
}

export class AuthorizationError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(status === 401 ? "unauthenticated" : "forbidden");
  }
}

/** Para Server Actions administrativas: falha fechada, sem redirecionar. */
export async function assertAdmin(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) throw new AuthorizationError(401);
  if (session.profile.role !== "admin") throw new AuthorizationError(403);
  return session;
}

export function firstName(fullName: string, fallback = "aluno"): string {
  const name = fullName.trim().split(/\s+/)[0];
  return name || fallback;
}
