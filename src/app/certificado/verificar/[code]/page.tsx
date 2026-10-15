import { BadgeCheck, ShieldAlert, ShieldX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { normalizeVerificationCode } from "@/lib/certificates/code";
import { formatDate } from "@/lib/format";
import { clientIp, consumeRateLimit } from "@/lib/http/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Verificação de certificado", robots: { index: false } };

export default async function VerifyCertificatePage({ params }: PageProps<"/certificado/verificar/[code]">) {
  const { code: rawCode } = await params;
  const code = normalizeVerificationCode(decodeURIComponent(rawCode));

  let state: "valid" | "revoked" | "not_found" | "rate_limited" = "not_found";
  let certificate: { holder_name: string; course_title: string; workload_hours: number; completed_at: string; issued_at: string } | null = null;

  if (code) {
    if (!(await consumeRateLimit(`verify:${await clientIp()}`, 30, 600))) {
      state = "rate_limited";
    } else {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase.rpc("verify_certificate", { p_code: code });
      const row = data?.[0];
      if (row) {
        certificate = row;
        state = row.is_revoked ? "revoked" : "valid";
      }
    }
  }

  return (
    <PublicShell>
      <div className="flex flex-col gap-6">
        <p className="eyebrow">Verificação pública</p>
        {state === "valid" && certificate && (
          <section className="surface border-brand-500/30 p-6 sm:p-8">
            <BadgeCheck className="size-12 text-brand-400" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-semibold text-mist-50">Certificado válido</h1>
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-mist-500">Titular</dt>
                <dd className="mt-0.5 text-mist-50">{certificate.holder_name}</dd>
              </div>
              <div>
                <dt className="text-mist-500">Programa</dt>
                <dd className="mt-0.5 text-mist-50">{certificate.course_title}</dd>
              </div>
              <div>
                <dt className="text-mist-500">Conclusão</dt>
                <dd className="mt-0.5 text-mist-50">{formatDate(certificate.completed_at)}</dd>
              </div>
              <div>
                <dt className="text-mist-500">Carga horária</dt>
                <dd className="mt-0.5 text-mist-50">{certificate.workload_hours} horas</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-mist-500">Código</dt>
                <dd className="mt-0.5 font-mono text-brand-300">{code}</dd>
              </div>
            </dl>
            <p className="mt-6 text-xs text-mist-500">
              Certificado de conclusão de programa educacional livre. Não constitui habilitação profissional ou licença
              regulatória. Por privacidade, apenas o primeiro nome e a inicial do sobrenome são exibidos.
            </p>
          </section>
        )}
        {state === "revoked" && (
          <section className="surface border-danger-400/30 p-6 sm:p-8">
            <ShieldX className="size-12 text-danger-400" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-semibold text-mist-50">Certificado revogado</h1>
            <p className="mt-2 text-sm text-mist-400">Este código existe, mas o certificado não é mais válido.</p>
          </section>
        )}
        {state === "not_found" && (
          <section className="surface p-6 sm:p-8">
            <ShieldAlert className="size-12 text-warning-400" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-semibold text-mist-50">Certificado não encontrado</h1>
            <p className="mt-2 text-sm text-mist-400">Confira se o código foi digitado corretamente.</p>
          </section>
        )}
        {state === "rate_limited" && (
          <section className="surface p-6 sm:p-8" role="alert">
            <h1 className="text-2xl font-semibold text-mist-50">Muitas consultas</h1>
            <p className="mt-2 text-sm text-mist-400">Aguarde alguns minutos e tente novamente.</p>
          </section>
        )}
        <Link href="/certificado/verificar" className="text-sm font-medium text-brand-400 hover:text-brand-300">
          Verificar outro código
        </Link>
      </div>
    </PublicShell>
  );
}
