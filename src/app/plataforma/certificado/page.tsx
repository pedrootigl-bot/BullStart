import { Award, CheckCircle2, Circle, Download, ExternalLink, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CertificateMockup } from "@/components/certificate/certificate-mockup";
import { CopyButton, IssueCertificateButton } from "@/components/certificate/certificate-actions";
import { buttonClasses, ButtonLink } from "@/components/ui/button";
import { Breadcrumbs, EmptyState } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";
import { getStudentContext } from "@/lib/access/student";
import { filterLaunchModules, isLaunchCourseComplete, launchModuleIds } from "@/lib/catalog/launch";
import { getActiveCertificate, verificationUrl } from "@/lib/certificates/service";
import { formatDate, formatDateLong, moduleNumber } from "@/lib/format";
import { hasPassedAllQuizzes, loadModuleQuizzes } from "@/lib/quiz/service";

export const metadata: Metadata = { title: "Certificado" };

export default async function CertificatePage() {
  const { session, snapshot } = await getStudentContext("/plataforma/certificado");
  if (!snapshot) {
    return <EmptyState icon={<Award className="size-6" />} title="Formação indisponível" description="Os módulos ainda não foram publicados." />;
  }

  const certificate = await getActiveCertificate(session.profile.id, snapshot.course.id);
  const visibleModules = filterLaunchModules(snapshot.modules);
  const complete = isLaunchCourseComplete(snapshot);
  const launchIds = launchModuleIds(snapshot);
  const quizzes = (await loadModuleQuizzes(snapshot, session.profile.id)).filter((q) => launchIds.includes(q.moduleId));
  const quizzesPassed = await hasPassedAllQuizzes(session.profile.id, snapshot.course.id, launchIds);
  const quizzesPassedCount = quizzes.filter((q) => q.passed).length;
  const canIssue = complete && quizzesPassed;
  const nextQuiz = quizzes.find((q) => !q.passed);
  const completedRequired = visibleModules.reduce((acc, m) => acc + m.progress.completedRequired, 0);
  const totalRequired = visibleModules.reduce((acc, m) => acc + m.progress.totalRequired, 0);
  const percent = totalRequired === 0 ? 0 : Math.floor((completedRequired / totalRequired) * 100);

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumbs items={[{ label: "Minha formação", href: "/plataforma" }, { label: "Certificado" }]} />

      <header className="max-w-3xl">
        <p className="eyebrow">Certificação Bullex Start</p>
        <h1 className="mt-2 text-2xl font-semibold text-mist-50 sm:text-3xl">Seu conhecimento merece reconhecimento.</h1>
        <p className="mt-2 text-sm leading-relaxed text-mist-400">
          O certificado de conclusão é liberado após concluir as aulas e a prova do módulo disponível nesta primeira
          etapa da formação. Ele comprova a conclusão de um programa educacional livre e não representa habilitação
          profissional ou licença regulatória.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-5">
          <CertificateMockup
            sample={!certificate}
            holderName={certificate?.holder_name ?? (session.profile.full_name || "Nome do Aluno")}
            programName={snapshot.course.title}
            completedAt={certificate ? formatDateLong(certificate.completed_at) : "dd de mês de aaaa"}
            workloadHours={certificate?.workload_hours ?? snapshot.course.workload_hours}
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
                  {completedRequired} de {totalRequired} aulas obrigatórias
                </span>
                <span className="font-medium text-mist-100">{percent}%</span>
              </div>
              <ProgressBar value={percent} label="Progresso para o certificado" tone="gold" />
            </div>
            <ul className="mt-5 flex flex-col gap-3">
              <li className="flex items-start gap-3 text-sm">
                {complete ? (
                  <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-brand-400" aria-hidden="true" />
                ) : (
                  <Circle className="mt-0.5 size-4.5 shrink-0 text-mist-500" aria-hidden="true" />
                )}
                <span className="flex-1 text-mist-300">Aulas concluídas</span>
                <span className="text-xs text-mist-500">
                  {completedRequired}/{totalRequired}
                </span>
              </li>
              {visibleModules.map((module) => {
                const done = module.progress.percent === 100;
                const moduleQuiz = quizzes.find((q) => q.moduleId === module.id);
                return (
                  <li key={module.id} className="ml-4 flex flex-col gap-2 border-l border-white/8 pl-3 text-sm">
                    <div className="flex items-start gap-3">
                      {done ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-400" aria-hidden="true" />
                      ) : (
                        <Circle className="mt-0.5 size-4 shrink-0 text-mist-500" aria-hidden="true" />
                      )}
                      <span className="flex-1 text-mist-400">
                        <span className="text-mist-500">Módulo {moduleNumber(module.position)} · </span>
                        {module.title}
                      </span>
                      <span className="text-xs text-mist-500">
                        {module.progress.completedRequired}/{module.progress.totalRequired}
                      </span>
                    </div>
                    {moduleQuiz && (
                      <div className="ml-7 flex items-start gap-3">
                        {moduleQuiz.passed ? (
                          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-400" aria-hidden="true" />
                        ) : moduleQuiz.unlocked ? (
                          <Circle className="mt-0.5 size-3.5 shrink-0 text-gold-400" aria-hidden="true" />
                        ) : (
                          <Lock className="mt-0.5 size-3.5 shrink-0 text-mist-500" aria-hidden="true" />
                        )}
                        <span className="flex-1 text-xs text-mist-500">
                          {moduleQuiz.passed
                            ? "Prova aprovada"
                            : moduleQuiz.unlocked
                              ? "Prova liberada"
                              : "Prova bloqueada"}
                        </span>
                        {!moduleQuiz.passed && (
                          <Link
                            href={`/plataforma/modulo/${moduleQuiz.moduleSlug}#prova`}
                            className="text-xs font-medium text-brand-400 hover:text-brand-300"
                          >
                            Ver
                          </Link>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
              <li className="flex items-start gap-3 text-sm">
                {quizzesPassed ? (
                  <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-brand-400" aria-hidden="true" />
                ) : (
                  <Circle className="mt-0.5 size-4.5 shrink-0 text-mist-500" aria-hidden="true" />
                )}
                <span className="flex-1 text-mist-300">Todas as provas aprovadas</span>
                <span className="text-xs text-mist-500">
                  {quizzesPassedCount}/{quizzes.length || "—"}
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                {certificate ? (
                  <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-brand-400" aria-hidden="true" />
                ) : (
                  <Lock className="mt-0.5 size-4.5 shrink-0 text-mist-500" aria-hidden="true" />
                )}
                <span className="flex-1 text-mist-300">
                  {certificate ? "Certificado emitido" : "Certificado — disponível após todas as provas"}
                </span>
              </li>
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
          ) : canIssue ? (
            <section className="surface flex flex-col gap-4 p-5 sm:p-6">
              <p className="text-sm text-mist-300">
                Parabéns! Você concluiu as aulas e aprovou todas as provas. Confira se seu nome está correto no{" "}
                <Link href="/plataforma/perfil" className="text-brand-400 hover:text-brand-300">
                  perfil
                </Link>{" "}
                — ele será impresso no certificado.
              </p>
              <div>
                <IssueCertificateButton />
              </div>
            </section>
          ) : nextQuiz ? (
            <section className="surface flex flex-col gap-4 p-5 sm:p-6">
              <p className="text-sm text-mist-300">
                {complete
                  ? "Você concluiu as aulas. Aprove as provas pendentes para liberar o certificado."
                  : "Conclua as aulas de cada módulo para liberar a prova correspondente. O certificado exige todas as provas aprovadas."}
                {` Progresso das provas: ${quizzesPassedCount}/${quizzes.length}.`}
              </p>
              <ButtonLink
                href={
                  nextQuiz.unlocked
                    ? `/plataforma/modulo/${nextQuiz.moduleSlug}#prova`
                    : `/plataforma/modulo/${nextQuiz.moduleSlug}`
                }
              >
                {nextQuiz.unlocked ? "Ir para a próxima prova" : "Ir ao módulo da prova"}
              </ButtonLink>
            </section>
          ) : (
            <p className="surface p-5 text-sm text-mist-400">
              Continue sua formação para liberar as provas e, depois, a emissão do certificado. Módulos bloqueados
              precisam ter seus requisitos de acesso atendidos para que as aulas possam ser concluídas.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
