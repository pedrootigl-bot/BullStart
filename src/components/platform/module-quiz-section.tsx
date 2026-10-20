import { QuizCard } from "@/components/platform/quiz-card";
import { QuizForm } from "@/components/platform/quiz-form";
import type { ModuleQuizView } from "@/lib/quiz/service";

/**
 * Bloco da prova do módulo, exibido abaixo das aulas.
 * Com `embedForm`, o aluno responde na própria página do módulo.
 */
export function ModuleQuizSection({
  quiz,
  embedForm = false,
}: {
  quiz: ModuleQuizView | null;
  embedForm?: boolean;
}) {
  if (!quiz) return null;

  const passPercent = Math.round(quiz.passRatio * 100);
  const showForm =
    embedForm && quiz.unlocked && !quiz.passed && quiz.attemptsRemaining > 0 && quiz.questions.length > 0;

  return (
    <section id="prova" aria-labelledby={`prova-modulo-${quiz.moduleSlug}`} className="scroll-mt-24 flex flex-col gap-4">
      <div>
        <h2 id={`prova-modulo-${quiz.moduleSlug}`} className="text-lg font-semibold text-mist-50">
          Prova do módulo
        </h2>
        <p className="mt-1 text-sm text-mist-400">
          {quiz.questionCount} questões · mínimo {passPercent}% · até {quiz.maxAttempts} tentativas. Libera ao concluir
          as aulas deste módulo.
        </p>
      </div>

      <QuizCard quiz={quiz} compact embedInModule showStartButton={!showForm} />

      {showForm ? (
        <QuizForm
          quizId={quiz.id}
          questions={quiz.questions}
          passPercent={passPercent}
          attemptsRemaining={quiz.attemptsRemaining}
        />
      ) : null}
    </section>
  );
}
