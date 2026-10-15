import "server-only";
import type { z } from "zod";
import type { ActionResult } from "@/lib/auth/schemas";
import { AuthorizationError, assertAdmin, type SessionUser } from "@/lib/auth/session";

export type AdminResult<T = undefined> = (ActionResult & { ok: false }) | { ok: true; message?: string; data?: T };

/**
 * Executa uma operação administrativa: autoriza no servidor, valida a entrada com Zod
 * e converte falhas em mensagens genéricas (sem vazar detalhes internos).
 */
export async function runAdmin<S extends z.ZodType, T = undefined>(
  schema: S,
  input: unknown,
  fn: (data: z.output<S>, admin: SessionUser) => Promise<AdminResult<T>>,
): Promise<AdminResult<T>> {
  let admin: SessionUser;
  try {
    admin = await assertAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, error: "Acesso não autorizado." };
    throw error;
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    return await fn(parsed.data, admin);
  } catch (error) {
    console.error("[admin] falha inesperada", error instanceof Error ? error.message : error);
    return { ok: false, error: "Não foi possível concluir a operação. Tente novamente." };
  }
}

export function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}
