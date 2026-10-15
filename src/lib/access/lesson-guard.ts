import "server-only";
import { NextResponse } from "next/server";
import { findLesson, loadCourseSnapshot, type CourseSnapshot } from "@/lib/access/snapshot";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { isSameOrigin, jsonError } from "@/lib/http/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LessonGuardOk = {
  ok: true;
  session: SessionUser;
  snapshot: CourseSnapshot;
  entry: NonNullable<ReturnType<typeof findLesson>>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Autorização de qualquer operação sobre uma aula: sessão válida, (opcionalmente) mesma origem,
 * aula publicada e módulo desbloqueado segundo o motor de regras.
 */
export async function guardLessonRequest(
  request: Request,
  lessonId: string,
  { mutating }: { mutating: boolean },
): Promise<LessonGuardOk | { ok: false; response: NextResponse }> {
  if (mutating && !isSameOrigin(request)) {
    return { ok: false, response: jsonError(403, "invalid_origin", "Origem da requisição não autorizada.") };
  }
  if (!UUID.test(lessonId)) {
    return { ok: false, response: jsonError(404, "not_found", "Aula não encontrada.") };
  }

  const session = await getSessionUser();
  if (!session) return { ok: false, response: jsonError(401, "unauthenticated", "Sessão expirada. Entre novamente.") };

  const snapshot = await loadCourseSnapshot(await createSupabaseServerClient(), session.profile);
  const entry = snapshot ? findLesson(snapshot, lessonId) : null;
  if (!snapshot || !entry) return { ok: false, response: jsonError(404, "not_found", "Aula não encontrada.") };

  if (!entry.module.access.unlocked) {
    return { ok: false, response: jsonError(403, "module_locked", "Este módulo ainda não está liberado para sua conta.") };
  }

  return { ok: true, session, snapshot, entry };
}

export function requiredWatchSeconds(durationSeconds: number, ratio: number): number {
  return Math.floor(durationSeconds * ratio);
}
