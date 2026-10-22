import { CheckCircle2, ClipboardList, Lock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { moduleNumber } from "@/lib/format";
import type { ModuleQuizView } from "@/lib/quiz/service";

function moduleQuizHref(quiz: ModuleQuizView) {
  return `/plataforma/modulo/${quiz.moduleSlug}#prova`;
}

export function QuizCard({
  quiz,
  compact = false,
  embedInModule = false,
  showStartButton = true,
}: {
  quiz: ModuleQuizView;
  compact?: boolean;
  /** Quando true, omite o rótulo "Módulo XX" (já está na página do módulo). */
  embedInModule?: boolean;
  /** Exibe CTA para ir à prova / iniciar (desligado quando o formulário já está abaixo). */
  showStartButton?: boolean;
}) {
  const passPercent = Math.round(quiz.passRatio * 100);
  const href = moduleQuizHref(quiz);
  const titleId = `prova-${quiz.moduleSlug}-title`;

  if (quiz.passed) {
    return (
      <section
        aria-labelledby={titleId}
        className="surface relative overflow-hidden border-brand-500/30 p-5 shadow-[0_0_40px_-18px_rgb(10_191_4/0.45)] sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {!embedInModule && (
              <p className="text-xs font-semibold tracking-[0.16em] text-brand-400 uppercase">
                Módulo {moduleNumber(quiz.modulePosition)}
              </p>
            )}
            <div className={cn("flex flex-wrap items-center gap-2", !embedInModule && "mt-1")}>
              <h3 id={titleId} className="text-lg font-semibold text-mist-50">
                {quiz.title}
              </h3>
              <Badge tone="brand">
                <CheckCircle2 className="size-3.5" aria-hidden="true" /> Aprovada
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist-400">
              Prova do módulo concluída
              {quiz.bestScorePercent !== null ? ` · melhor nota ${quiz.bestScorePercent}%` : ""}.
            </p>
          </div>
          {!compact && showStartButton && (
            <ButtonLink href="/plataforma/certificado" variant="gold" size="sm">
              Ver certificado
            </ButtonLink>
          )}
        </div>
      </section>
    );
  }

  if (!quiz.unlocked) {
    return (
      <section aria-labelledby={titleId} className="surface relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-ink-950/55 backdrop-blur-[2px]" aria-hidden="true" />
        <div className="relative z-10 flex flex-col gap-4 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/15 bg-ink-900/80 text-mist-100">
              <Lock className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div>
              {!embedInModule && (
                <p className="text-xs font-semibold tracking-[0.16em] text-mist-500 uppercase">
                  Módulo {moduleNumber(quiz.modulePosition)}
                </p>
              )}
              <div className={cn("flex flex-wrap items-center gap-2", !embedInModule && "mt-1")}>
                <h3 id={titleId} className="text-lg font-semibold text-mist-50">
                  {quiz.title}
                </h3>
                <Badge tone="neutral">
                  <Lock className="size-3" aria-hidden="true" /> Bloqueada
                </Badge>
              </div>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist-300">
                Disponível após concluir todas as aulas deste módulo.
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-2 text-left text-xs text-mist-400 sm:w-56">
            <div className="rounded-xl border border-white/8 bg-ink-900/50 px-2.5 py-2">
              <dt className="text-mist-500">Questões</dt>
              <dd className="mt-0.5 font-medium text-mist-100">{quiz.questionCount}</dd>
            </div>
            <div className="rounded-xl border border-white/8 bg-ink-900/50 px-2.5 py-2">
              <dt className="text-mist-500">Mínimo</dt>
              <dd className="mt-0.5 font-medium text-mist-100">{passPercent}%</dd>
            </div>
            <div className="rounded-xl border border-white/8 bg-ink-900/50 px-2.5 py-2">
              <dt className="text-mist-500">Tentativas</dt>
              <dd className="mt-0.5 font-medium text-mist-100">{quiz.maxAttempts}</dd>
            </div>
          </dl>
        </div>
      </section>
    );
  }

  const exhausted = quiz.attemptsRemaining <= 0;

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "surface relative overflow-hidden border-brand-500/25 p-5 sm:p-6",
        "shadow-[0_0_40px_-18px_rgb(10_191_4/0.45)]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          {!embedInModule && (
            <p className="text-xs font-semibold tracking-[0.16em] text-brand-400 uppercase">
              Módulo {moduleNumber(quiz.modulePosition)}
            </p>
          )}
          <div className={cn("flex flex-wrap items-center gap-2", !embedInModule && "mt-1")}>
            <ClipboardList className="size-5 text-brand-400" aria-hidden="true" />
            <h3 id={titleId} className="text-lg font-semibold text-mist-50">
              {quiz.title}
            </h3>
            <Badge tone="brand">Liberada</Badge>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-mist-400">{quiz.description}</p>
        </div>
        {exhausted ? (
          <p className="rounded-xl border border-warning-400/30 bg-warning-400/10 px-3 py-2 text-sm text-warning-400">
            Tentativas esgotadas.
          </p>
        ) : showStartButton ? (
          <ButtonLink href={href} size="sm">
            {quiz.attemptsUsed > 0 ? "Tentar novamente" : "Iniciar prova"}
          </ButtonLink>
        ) : null}
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/8 bg-ink-900/40 px-3.5 py-3">
          <dt className="text-xs text-mist-500">Questões</dt>
          <dd className="mt-1 text-sm font-medium text-mist-50">{quiz.questionCount}</dd>
        </div>
        <div className="rounded-xl border border-white/8 bg-ink-900/40 px-3.5 py-3">
          <dt className="text-xs text-mist-500">Aproveitamento mínimo</dt>
          <dd className="mt-1 text-sm font-medium text-mist-50">{passPercent}%</dd>
        </div>
        <div className="rounded-xl border border-white/8 bg-ink-900/40 px-3.5 py-3">
          <dt className="text-xs text-mist-500">Tentativas</dt>
          <dd className="mt-1 text-sm font-medium text-mist-50">
            {quiz.attemptsRemaining} restante{quiz.attemptsRemaining === 1 ? "" : "s"}
          </dd>
        </div>
        <div className="rounded-xl border border-white/8 bg-ink-900/40 px-3.5 py-3">
          <dt className="text-xs text-mist-500">Melhor nota</dt>
          <dd className="mt-1 text-sm font-medium text-mist-50">
            {quiz.bestScorePercent !== null ? `${quiz.bestScorePercent}%` : "—"}
          </dd>
        </div>
      </dl>

      {!compact && (
        <p className="mt-4 text-xs text-mist-500">
          Aprovar todas as provas dos módulos libera o certificado.{" "}
          <Link href="/plataforma/certificado" className="text-brand-400 hover:text-brand-300">
            Ver certificado
          </Link>
        </p>
      )}
    </section>
  );
}

export function QuizzesSummary({ quizzes }: { quizzes: ModuleQuizView[] }) {
  if (quizzes.length === 0) return null;
  const passed = quizzes.filter((q) => q.passed).length;
  const unlocked = quizzes.find((q) => q.unlocked && !q.passed && q.attemptsRemaining > 0);
  const allPassed = passed === quizzes.length;

  return (
    <section
      aria-labelledby="provas-resumo-title"
      className={cn(
        "surface relative overflow-hidden p-5 sm:p-6",
        allPassed ? "border-brand-500/30 shadow-[0_0_40px_-18px_rgb(10_191_4/0.45)]" : "border-brand-500/20",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ClipboardList className="size-5 text-brand-400" aria-hidden="true" />
            <h2 id="provas-resumo-title" className="text-lg font-semibold text-mist-50">
              Provas dos módulos
            </h2>
            {allPassed ? (
              <Badge tone="brand">
                <CheckCircle2 className="size-3.5" aria-hidden="true" /> Completas
              </Badge>
            ) : (
              <Badge tone="neutral">
                {passed}/{quizzes.length} aprovadas
              </Badge>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist-400">
            {allPassed
              ? "Você aprovou todas as provas. Já pode emitir o certificado."
              : "Cada prova fica no final do respectivo módulo, abaixo das aulas."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {unlocked && (
            <ButtonLink href={moduleQuizHref(unlocked)} size="sm">
              Fazer próxima prova
            </ButtonLink>
          )}
          {allPassed && (
            <ButtonLink href="/plataforma/certificado" variant="gold" size="sm">
              Certificado
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  );
}
