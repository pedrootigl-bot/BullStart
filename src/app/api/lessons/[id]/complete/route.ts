import { NextResponse } from "next/server";
import { z } from "zod";
import { guardLessonRequest } from "@/lib/access/lesson-guard";
import { consumeRateLimit, jsonError } from "@/lib/http/security";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const resultSchema = z.object({
  ok: z.boolean(),
  already: z.boolean().optional(),
  reason: z.string().optional(),
  required_seconds: z.number().optional(),
  watched_seconds: z.number().optional(),
});

/** Conclusão explícita: a política mínima de visualização é validada no banco (complete_lesson). */
export async function POST(request: Request, ctx: RouteContext<"/api/lessons/[id]/complete">) {
  const { id } = await ctx.params;
  const guard = await guardLessonRequest(request, id, { mutating: true });
  if (!guard.ok) return guard.response;

  if (!(await consumeRateLimit(`complete:${guard.session.profile.id}`, 20, 60))) {
    return jsonError(429, "rate_limited", "Muitas tentativas. Aguarde um instante.");
  }

  const { data, error } = await getSupabaseAdmin().rpc("complete_lesson", {
    p_user_id: guard.session.profile.id,
    p_lesson_id: id,
  });
  const result = resultSchema.safeParse(data);
  if (error || !result.success) {
    console.error("[complete] falha ao concluir aula", error?.message);
    return jsonError(500, "complete_failed", "Não foi possível concluir a aula agora.");
  }

  if (!result.data.ok) {
    const missing = Math.max(0, (result.data.required_seconds ?? 0) - (result.data.watched_seconds ?? 0));
    return jsonError(
      409,
      result.data.reason ?? "not_allowed",
      missing > 0
        ? `Assista mais ${Math.ceil(missing / 60)} min da aula para concluí-la.`
        : "A aula ainda não atende ao critério mínimo de visualização.",
    );
  }

  return NextResponse.json({ ok: true, already: Boolean(result.data.already) });
}
