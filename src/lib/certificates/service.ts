import "server-only";
import type { CourseSnapshot } from "@/lib/access/snapshot";
import { recordAudit } from "@/lib/audit";
import { generateVerificationCode } from "@/lib/certificates/code";
import { isLaunchCourseComplete, launchModuleIds } from "@/lib/catalog/launch";
import { getEnv } from "@/lib/env";
import { hasPassedAllQuizzes } from "@/lib/quiz/service";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";

export type CertificateRow = Tables<"certificates">;

export type IssueResult =
  | { ok: true; certificate: CertificateRow; alreadyIssued: boolean }
  | { ok: false; reason: "incomplete" | "quiz_required" | "missing_name" | "error" };

export function verificationUrl(code: string): string {
  return new URL(`/certificado/verificar/${encodeURIComponent(code)}`, getEnv().APP_URL).toString();
}

export async function getActiveCertificate(userId: string, courseId: string): Promise<CertificateRow | null> {
  const { data } = await getSupabaseAdmin()
    .from("certificates")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .is("revoked_at", null)
    .maybeSingle();
  return data;
}

function completionDate(snapshot: CourseSnapshot): string {
  let latest = 0;
  const visibleIds = new Set(launchModuleIds(snapshot));
  for (const courseModule of snapshot.modules) {
    if (!visibleIds.has(courseModule.id)) continue;
    for (const lesson of courseModule.lessons) {
      if (!lesson.is_required) continue;
      const completedAt = snapshot.progressByLesson.get(lesson.id)?.completed_at;
      if (completedAt) latest = Math.max(latest, new Date(completedAt).getTime());
    }
  }
  return new Date(latest || Date.now()).toISOString();
}

/**
 * Emite o certificado após revalidar no servidor: identidade (snapshot do próprio aluno),
 * conclusão de todas as aulas obrigatórias publicadas e inexistência de certificado ativo.
 */
export async function issueCertificate(
  profile: { id: string; full_name: string },
  snapshot: CourseSnapshot,
): Promise<IssueResult> {
  if (!isLaunchCourseComplete(snapshot)) return { ok: false, reason: "incomplete" };
  if (!(await hasPassedAllQuizzes(profile.id, snapshot.course.id, launchModuleIds(snapshot)))) {
    return { ok: false, reason: "quiz_required" };
  }
  const holderName = profile.full_name.trim();
  if (holderName.length < 3) return { ok: false, reason: "missing_name" };

  const existing = await getActiveCertificate(profile.id, snapshot.course.id);
  if (existing) return { ok: true, certificate: existing, alreadyIssued: true };

  const db = getSupabaseAdmin();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await db
      .from("certificates")
      .insert({
        user_id: profile.id,
        course_id: snapshot.course.id,
        verification_code: generateVerificationCode(),
        holder_name: holderName,
        workload_hours: snapshot.course.workload_hours,
        completed_at: completionDate(snapshot),
      })
      .select("*")
      .single();

    if (data) {
      await recordAudit({
        actorId: profile.id,
        action: "certificate.issued",
        entityType: "certificate",
        entityId: data.id,
        metadata: { course_id: snapshot.course.id },
      });
      return { ok: true, certificate: data, alreadyIssued: false };
    }

    if (error?.code === "23505") {
      const concurrent = await getActiveCertificate(profile.id, snapshot.course.id);
      if (concurrent) return { ok: true, certificate: concurrent, alreadyIssued: true };
      continue;
    }
    console.error("[certificate] falha ao emitir", error?.message);
    return { ok: false, reason: "error" };
  }
  return { ok: false, reason: "error" };
}
