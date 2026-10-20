"use server";

import { revalidatePath } from "next/cache";
import { loadCourseSnapshot } from "@/lib/access/snapshot";
import { getSessionUser } from "@/lib/auth/session";
import { issueCertificate } from "@/lib/certificates/service";
import { consumeRateLimit } from "@/lib/http/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type IssueActionResult = { ok: true; code: string } | { ok: false; error: string };

export async function issueCertificateAction(): Promise<IssueActionResult> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Sessão expirada. Entre novamente." };

  if (!(await consumeRateLimit(`certificate:${session.profile.id}`, 5, 600))) {
    return { ok: false, error: "Muitas tentativas. Aguarde alguns minutos." };
  }

  const snapshot = await loadCourseSnapshot(await createSupabaseServerClient(), session.profile);
  if (!snapshot) return { ok: false, error: "Formação indisponível no momento." };

  const result = await issueCertificate(session.profile, snapshot);
  if (!result.ok) {
    const messages = {
      incomplete: "Conclua todas as aulas obrigatórias para emitir o certificado.",
      quiz_required: "Aprove todas as provas dos módulos antes de emitir o certificado.",
      missing_name: "Atualize seu nome completo no perfil antes de emitir o certificado.",
      error: "Não foi possível emitir o certificado agora. Tente novamente.",
    } as const;
    return { ok: false, error: messages[result.reason] };
  }

  revalidatePath("/plataforma/certificado");
  return { ok: true, code: result.certificate.verification_code };
}
