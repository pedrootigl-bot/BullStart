import { Award, CheckCircle2, Circle, Download, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CertificateMockup } from "@/components/certificate/certificate-mockup";
import { CopyButton, IssueCertificateButton } from "@/components/certificate/certificate-actions";
import { buttonClasses } from "@/components/ui/button";
import { Breadcrumbs, EmptyState } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";
import { isCourseComplete } from "@/lib/access/snapshot";
import { getStudentContext } from "@/lib/access/student";
import { getActiveCertificate, verificationUrl } from "@/lib/certificates/service";
import { formatDate, moduleNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Certificado" };

export default async function CertificatePage() {
  const { session, snapshot } = await getStudentContext("/plataforma/certificado");
  if (!snapshot) {
    return <EmptyState icon={<Award className="size-6" />} title="Formação indisponível" description="Os módulos ainda não foram publicados." />;
  }

  const certificate = await getActiveCertificate(session.profile.id, snapshot.course.id);
  const complete = isCourseComplete(snapshot);

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumbs items={[{ label: "Minha formação", href: "/plataforma" }, { label: "Certificado" }]} />

      <header className="max-w-3xl">
        <p className="eyebrow">Certificação Bullex Start</p>
        <h1 className="mt-2 text-2xl font-semibold text-mist-50 sm:text-3xl">Seu conhecimento merece reconhecimento.</h1>
        <p className="mt-2 text-sm leading-relaxed text-mist-400">
          O certificado de conclusão é liberado após concluir todas as aulas obrigatórias publicadas da formação. Ele
          comprova a conclusão de um programa educacional livre e não representa habilitação profissional ou licença
          regulatória.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-5">
          <CertificateMockup
            sample={!certificate}
            holderName={certificate?.holder_name ?? (session.profile.full_name || "Seu nome")}
            programName={snapshot.course.title}
            completedAt={certificate ? formatDate(certificate.completed_at) : "data de conclusão"}
            workloadHours={certificate?.workload_hours ?? snapshot.course.workload_hours}
            code={certificate?.verification_code ?? "BXS-XXXX-XXXX-XXXX"}
          />
          {certificate && (
            <div className="flex flex-wrap gap-3">
              <a href={`/api/certificates/${certificate.id}/pdf`} className={buttonClasses({ variant: "primary" })}>
                <Download className="size-4" aria-hidden="true" /> Baixar PDF
              </a>
              <CopyButton value={certificate.verification_code} label="Copiar código" />
              <Link
                href={`/certificado/verificar/${certificate.verification_code}`}
                className={buttonClasses({ variant: "outline", size: "sm" })}
                target="_blank"
              >
                <ExternalLink className="size-4" aria-hidden="true" /> Página de verificação
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <section className="surface p-5 sm:p-6" aria-labelledby="req-cert">
            <h2 id="req-cert" className="font-semibold text-mist-50">
              Requisitos para emissão
            </h2>
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-sm text-mist-400">
                <span>
                  {snapshot.overall.completedRequired} de {snapshot.overall.totalRequired} aulas obrigatórias
                </span>
                <span className="font-medium text-mist-100">{snapshot.overall.percent}%</span>
              </div>
              <ProgressBar value={snapshot.overall.percent} label="Progresso para o certificado" tone="gold" />
            </div>
            <ul className="mt-5 flex flex-col gap-3">
              {snapshot.modules.map((module) => {
                const done = module.progress.percent === 100;
                return (
                  <li key={module.id} className="flex items-start gap-3 text-sm">
                    {done ? (
                      <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-brand-400" aria-hidden="true" />
                    ) : (
                      <Circle className="mt-0.5 size-4.5 shrink-0 text-mist-500" aria-hidden="true" />
                    )}
                    <span className="flex-1 text-mist-300">
                      <span className="text-mist-500">Módulo {moduleNumber(module.position)} · </span>
                      {module.title}
                    </span>
                    <span className="text-xs text-mist-500">
                      {module.progress.completedRequired}/{module.progress.totalRequired}
                      <span className="sr-only">{done ? " — concluído" : " — pendente"}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {certificate ? (
            <section className="surface border-brand-500/25 p-5 sm:p-6">
              <p className="flex items-center gap-2 font-semibold text-brand-300">
                <CheckCircle2 className="size-5" aria-hidden="true" /> Certificado emitido em {formatDate(certificate.issued_at)}
              </p>
              <p className="mt-2 text-sm text-mist-400">
                Qualquer pessoa pode confirmar a autenticidade em{" "}
                <span className="break-all text-mist-300">{verificationUrl(certificate.verification_code)}</span>
              </p>
            </section>
          ) : complete ? (
            <section className="surface flex flex-col gap-4 p-5 sm:p-6">
              <p className="text-sm text-mist-300">
                Parabéns! Você concluiu todas as aulas obrigatórias. Confira se seu nome está correto no{" "}
                <Link href="/plataforma/perfil" className="text-brand-400 hover:text-brand-300">
                  perfil
                </Link>{" "}
                — ele será impresso no certificado.
              </p>
              <div>
                <IssueCertificateButton />
              </div>
            </section>
          ) : (
            <p className="surface p-5 text-sm text-mist-400">
              Continue sua formação para liberar a emissão. Módulos bloqueados precisam ter seus requisitos de acesso
              atendidos para que as aulas possam ser concluídas.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
