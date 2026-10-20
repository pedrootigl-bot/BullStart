import { getSessionUser } from "@/lib/auth/session";
import { renderCertificatePdf } from "@/lib/certificates/pdf";
import { consumeRateLimit, jsonError } from "@/lib/http/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, ctx: RouteContext<"/api/certificates/[id]/pdf">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return jsonError(404, "not_found", "Certificado não encontrado.");

  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated", "Sessão expirada.");

  if (!(await consumeRateLimit(`certificate-pdf:${session.profile.id}`, 20, 600))) {
    return jsonError(429, "rate_limited", "Muitas solicitações. Aguarde alguns minutos.");
  }

  // RLS garante que apenas o titular lê o próprio certificado.
  const supabase = await createSupabaseServerClient();
  const { data: certificate } = await supabase
    .from("certificates")
    .select("id, verification_code, holder_name, workload_hours, completed_at, revoked_at, course_id")
    .eq("id", id)
    .maybeSingle();
  if (!certificate || certificate.revoked_at) return jsonError(404, "not_found", "Certificado não encontrado.");

  const { data: course } = await supabase.from("courses").select("title").eq("id", certificate.course_id).maybeSingle();

  const pdf = await renderCertificatePdf({
    holderName: certificate.holder_name,
    programName: course?.title ?? "Formação Trader Bullex",
    completedAt: new Date(certificate.completed_at),
    workloadHours: certificate.workload_hours,
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificado-bullex-start-${certificate.verification_code}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
