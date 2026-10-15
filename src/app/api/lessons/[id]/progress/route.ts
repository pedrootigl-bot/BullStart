import { NextResponse } from "next/server";
import { z } from "zod";
import { guardLessonRequest, requiredWatchSeconds } from "@/lib/access/lesson-guard";
import { consumeRateLimit, jsonError } from "@/lib/http/security";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const bodySchema = z.object({
  position: z.number().int().min(0).max(86_400),
  watchedSeconds: z.number().int().min(0).max(120),
});

/**
 * Heartbeat de reprodução. O servidor limita o crédito de tempo assistido ao tempo real
 * decorrido (função apply_lesson_heartbeat), então eventos do navegador não aceleram o progresso.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/lessons/[id]/progress">) {
  const { id } = await ctx.params;
  const guard = await guardLessonRequest(request, id, { mutating: true });
  if (!guard.ok) return guard.response;

  if (!(await consumeRateLimit(`progress:${guard.session.profile.id}`, 40, 60))) {
    return jsonError(429, "rate_limited", "Muitas atualizações em pouco tempo.");
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid_body", "Dados de progresso inválidos.");

  const { data, error } = await getSupabaseAdmin().rpc("apply_lesson_heartbeat", {
    p_user_id: guard.session.profile.id,
    p_lesson_id: id,
    p_position: parsed.data.position,
    p_claimed_seconds: parsed.data.watchedSeconds,
  });
  if (error || !data) {
    console.error("[progress] falha no heartbeat", error?.message);
    return jsonError(500, "progress_failed", "Não foi possível salvar seu progresso agora.");
  }

  const required = requiredWatchSeconds(guard.entry.lesson.duration_seconds, Number(guard.snapshot.course.completion_min_watch_ratio));
  return NextResponse.json({
    ok: true,
    status: data.status,
    lastPositionSeconds: data.last_position_seconds,
    watchedSeconds: data.watched_seconds,
    requiredSeconds: required,
    canComplete: data.status === "completed" || data.watched_seconds >= required,
  });
}
