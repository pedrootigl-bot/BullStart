"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { loadCourseSnapshot } from "@/lib/access/snapshot";
import { getSessionUser } from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/http/security";
import { submitQuizAttempt } from "@/lib/quiz/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.record(z.string().uuid(), z.number().int().min(0).max(5)),
});

export type SubmitQuizActionResult =
  | {
      ok: true;
      scorePercent: number;
      passed: boolean;
      correctCount: number;
      total: number;
      attemptsRemaining: number;
      moduleId: string;
      moduleTitle: string;
    }
  | { ok: false; error: string };

export async function submitQuizAction(raw: unknown): Promise<SubmitQuizActionResult> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Sessão expirada. Entre novamente." };

  if (!(await consumeRateLimit(`quiz:${session.profile.id}`, 10, 600))) {
    return { ok: false, error: "Muitas tentativas em pouco tempo. Aguarde alguns minutos." };
  }

  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Respostas inválidas. Revise e tente novamente." };

  const snapshot = await loadCourseSnapshot(await createSupabaseServerClient(), session.profile);
  if (!snapshot) return { ok: false, error: "Formação indisponível no momento." };

  const result = await submitQuizAttempt(snapshot, session.profile.id, parsed.data.quizId, parsed.data.answers);
  if (!result.ok) return { ok: false, error: result.message };

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/modulo", "layout");
  revalidatePath("/plataforma/certificado");

  return {
    ok: true,
    scorePercent: result.scorePercent,
    passed: result.passed,
    correctCount: result.correctCount,
    total: result.total,
    attemptsRemaining: result.attemptsRemaining,
    moduleId: result.moduleId,
    moduleTitle: result.moduleTitle,
  };
}
