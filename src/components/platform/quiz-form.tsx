"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitQuizAction } from "@/app/plataforma/prova/actions";
import { ModuleCompleteModal } from "@/components/platform/module-complete-modal";
import { Button, ButtonLink } from "@/components/ui/button";
import { markModuleCelebrated } from "@/lib/catalog/module-celebration";
import { cn } from "@/lib/cn";
import type { QuizQuestionPublic } from "@/lib/quiz/service";

export function QuizForm({
  quizId,
  questions,
  passPercent,
  attemptsRemaining,
}: {
  quizId: string;
  questions: QuizQuestionPublic[];
  passPercent: number;
  attemptsRemaining: number;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    scorePercent: number;
    passed: boolean;
    correctCount: number;
    total: number;
    attemptsRemaining: number;
    moduleId: string;
    moduleTitle: string;
  } | null>(null);
  const [celebrate, setCelebrate] = useState<{ moduleId: string; moduleTitle: string } | null>(null);

  const allAnswered = questions.every((question) => typeof answers[question.id] === "number");

  const onSubmit = () => {
    startTransition(async () => {
      const response = await submitQuizAction({ quizId, answers });
      if (!response.ok) {
        toast.error(response.error);
        return;
      }
      setResult(response);
      if (response.passed) {
        markModuleCelebrated(response.moduleId);
        setCelebrate({ moduleId: response.moduleId, moduleTitle: response.moduleTitle });
      } else {
        toast.message(`Nota ${response.scorePercent}%. É necessário ${passPercent}% para aprovar.`);
      }
      router.refresh();
    });
  };

  if (result) {
    return (
      <>
        {celebrate ? (
          <ModuleCompleteModal
            moduleId={celebrate.moduleId}
            moduleTitle={celebrate.moduleTitle}
            onClose={() => setCelebrate(null)}
          />
        ) : null}
        <div className="surface flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            {result.passed ? (
              <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-brand-400" aria-hidden="true" />
            ) : (
              <XCircle className="mt-0.5 size-6 shrink-0 text-danger-400" aria-hidden="true" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-mist-50">
                {result.passed ? "Prova aprovada" : "Prova não aprovada"}
              </h2>
              <p className="mt-1 text-sm text-mist-400">
                Você acertou {result.correctCount} de {result.total} questões ({result.scorePercent}%). Aproveitamento
                mínimo: {passPercent}%.
              </p>
              {!result.passed && (
                <p className="mt-2 text-sm text-mist-400">
                  Tentativas restantes: {result.attemptsRemaining}. Revise o módulo e tente novamente.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {result.passed ? (
              <ButtonLink href="/plataforma" variant="primary">
                Continuar formação
              </ButtonLink>
            ) : result.attemptsRemaining > 0 ? (
              <Button
                type="button"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                }}
              >
                Nova tentativa
              </Button>
            ) : null}
            <ButtonLink href="/plataforma/certificado" variant="outline">
              Certificado
            </ButtonLink>
            <ButtonLink href="/plataforma" variant="outline">
              Voltar à formação
            </ButtonLink>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ol className="flex flex-col gap-4">
        {questions.map((question, index) => (
          <li key={question.id} className="surface p-5 sm:p-6">
            <p className="text-xs font-semibold tracking-[0.16em] text-brand-400">QUESTÃO {index + 1}</p>
            <h3 className="mt-2 text-base font-semibold text-balance text-mist-50 sm:text-lg">{question.prompt}</h3>
            {question.imageUrl ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-ink-950/60">
                <Image
                  src={question.imageUrl}
                  alt={`Ilustração de contexto da questão ${index + 1}`}
                  width={960}
                  height={540}
                  className="h-auto w-full object-contain"
                  sizes="(max-width: 768px) 100vw, 640px"
                />
              </div>
            ) : null}
            <fieldset className="mt-4">
              <legend className="sr-only">Alternativas da questão {index + 1}</legend>
              <ul className="flex flex-col gap-2">
                {question.options.map((option, optionIndex) => {
                  const selected = answers[question.id] === optionIndex;
                  const inputId = `${question.id}-${optionIndex}`;
                  return (
                    <li key={inputId}>
                      <label
                        htmlFor={inputId}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 text-sm transition-colors",
                          selected
                            ? "border-brand-500/50 bg-brand-500/10 text-mist-50"
                            : "border-white/10 bg-ink-900/40 text-mist-300 hover:border-white/20 hover:text-mist-100",
                        )}
                      >
                        <input
                          id={inputId}
                          type="radio"
                          name={question.id}
                          className="mt-1 size-4 accent-brand-400"
                          checked={selected}
                          onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                        />
                        <span>{option}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          </li>
        ))}
      </ol>

      <div className="surface flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <p className="text-sm text-mist-400">
          {allAnswered
            ? `Pronto para enviar. Tentativas restantes após este envio: ${Math.max(0, attemptsRemaining - 1)}.`
            : "Responda todas as questões para liberar o envio."}
        </p>
        <Button type="button" disabled={!allAnswered || pending || attemptsRemaining <= 0} aria-busy={pending} onClick={onSubmit}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Enviar prova
        </Button>
      </div>
    </div>
  );
}
