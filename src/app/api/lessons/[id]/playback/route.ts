import { NextResponse } from "next/server";
import { guardLessonRequest } from "@/lib/access/lesson-guard";
import { consumeRateLimit, jsonError } from "@/lib/http/security";
import { resolvePlayback } from "@/lib/video/playback";

export async function GET(request: Request, ctx: RouteContext<"/api/lessons/[id]/playback">) {
  const { id } = await ctx.params;
  const guard = await guardLessonRequest(request, id, { mutating: false });
  if (!guard.ok) return guard.response;

  if (!(await consumeRateLimit(`playback:${guard.session.profile.id}`, 30, 60))) {
    return jsonError(429, "rate_limited", "Muitas solicitações. Aguarde um instante.");
  }

  const playback = await resolvePlayback(id);
  if (!playback.ok) return jsonError(404, playback.reason, "Vídeo indisponível para esta aula.");

  return NextResponse.json(
    { ok: true, url: playback.url, expiresAt: playback.expiresAt },
    { headers: { "Cache-Control": "no-store" } },
  );
}
